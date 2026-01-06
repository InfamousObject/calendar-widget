import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google/calendar';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { incrementUsage, checkUsageLimit } from '@/lib/subscription';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyCaptcha } from '@/lib/captcha';
import { validateCsrfToken, isCsrfEnabled } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';

const bookAppointmentSchema = z.object({
  widgetId: z.string(),
  appointmentTypeId: z.string(),
  startTime: z.string().datetime(),
  visitorName: z.string().min(1, 'Name is required'),
  visitorEmail: z.string().email('Valid email is required'),
  visitorPhone: z.string().optional(), // Made optional - can be added as custom field if needed
  notes: z.string().optional(),
  timezone: z.string(),
  formResponses: z.record(z.string(), z.unknown()).optional(),
  captchaToken: z.string().optional(), // hCaptcha token for bot protection
  csrfToken: z.string().optional(), // CSRF token for request validation
});

// POST - Book an appointment (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get client IP for rate limiting, CSRF, and CAPTCHA verification
    const clientIp = getClientIp(request);

    // Verify CSRF token if enabled (before other validations to fail fast on forged requests)
    if (isCsrfEnabled()) {
      if (!body.csrfToken) {
        return NextResponse.json(
          { error: 'CSRF token required. Please refresh the page and try again.' },
          { status: 403 }
        );
      }

      const csrfValid = await validateCsrfToken(body.csrfToken, clientIp);
      if (!csrfValid) {
        return NextResponse.json(
          { error: 'Invalid or expired CSRF token. Please refresh the page and try again.' },
          { status: 403 }
        );
      }

      log.info('[Book] CSRF validation successful', { ip: clientIp });
    }

    // Verify CAPTCHA if configured (before rate limiting to prevent CAPTCHA bypass)
    if (process.env.HCAPTCHA_SECRET_KEY) {
      if (!body.captchaToken) {
        return NextResponse.json(
          { error: 'CAPTCHA verification required. Please complete the verification.' },
          { status: 400 }
        );
      }

      const captchaValid = await verifyCaptcha(body.captchaToken, clientIp);
      if (!captchaValid) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }

      log.info('[Book] CAPTCHA verification successful', { ip: clientIp });
    }

    // Check rate limit
    const { success, remaining } = await checkRateLimit('booking', clientIp);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many booking requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      );
    }

    log.debug('[Book] Received booking request', {
      appointmentTypeId: body.appointmentTypeId,
      startTime: body.startTime,
      timezone: body.timezone,
      // PII automatically redacted by logger
      visitorEmail: body.visitorEmail,
      visitorName: body.visitorName,
      visitorPhone: body.visitorPhone,
    });

    const validatedData = bookAppointmentSchema.parse(body);
    log.info('[Book] Validation passed');

    // Find user by widget ID
    const user = await prisma.user.findUnique({
      where: { widgetId: validatedData.widgetId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Check monthly booking limit for the user's subscription tier
    const usageCheck = await checkUsageLimit(user.id, 'monthlyBookings');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: `Monthly booking limit reached (${usageCheck.limit} bookings per month). Please upgrade your plan for unlimited bookings.`,
          limit: usageCheck.limit,
          current: usageCheck.current
        },
        { status: 429 }
      );
    }

    // Find appointment type
    const appointmentType = await prisma.appointmentType.findFirst({
      where: {
        id: validatedData.appointmentTypeId,
        userId: user.id,
        active: true,
      },
    });

    if (!appointmentType) {
      return NextResponse.json(
        { error: 'Appointment type not found or inactive' },
        { status: 404 }
      );
    }

    // Calculate end time
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(startTime.getTime() + appointmentType.duration * 60000);

    // Generate cryptographically secure cancellation token (64 bytes = 128 hex characters)
    const cancellationToken = crypto.randomBytes(64).toString('hex');

    // Use database transaction with serializable isolation to prevent double booking race condition
    // This ensures that the conflict check and appointment creation are atomic
    let appointment;
    try {
      appointment = await prisma.$transaction(async (tx) => {
        // Step 1: Check for conflicts while holding a transaction lock
        const conflictingAppointment = await tx.appointment.findFirst({
          where: {
            userId: user.id,
            status: {
              not: 'cancelled',
            },
            OR: [
              // Existing appointment overlaps with start of new booking
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } },
                ],
              },
              // Existing appointment overlaps with end of new booking
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } },
                ],
              },
              // New booking completely encompasses existing appointment
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } },
                ],
              },
            ],
          },
        });

        if (conflictingAppointment) {
          // Throw error to abort transaction
          throw new Error('SLOT_UNAVAILABLE');
        }

        // Step 2: Create appointment while transaction lock is held
        // This ensures no other request can create a conflicting appointment
        const newAppointment = await tx.appointment.create({
          data: {
            userId: user.id,
            appointmentTypeId: appointmentType.id,
            startTime,
            endTime,
            timezone: validatedData.timezone,
            visitorName: validatedData.visitorName,
            visitorEmail: validatedData.visitorEmail,
            visitorPhone: validatedData.visitorPhone,
            notes: validatedData.notes,
            formResponses: validatedData.formResponses as Prisma.InputJsonValue,
            status: 'confirmed',
            cancellationToken,
          },
          include: {
            appointmentType: true,
          },
        });

        return newAppointment;
      }, {
        isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
        timeout: 5000, // 5 second timeout to prevent long-running locks
      });
    } catch (error: any) {
      // Handle slot unavailable error
      if (error.message === 'SLOT_UNAVAILABLE') {
        return NextResponse.json(
          { error: 'This time slot is no longer available. Please select another time.' },
          { status: 409 }
        );
      }

      // Re-throw other errors
      throw error;
    }

    // Track usage for billing and limits
    await incrementUsage(user.id, 'booking');

    // Create Google Calendar event
    let calendarEventId: string | null | undefined;
    try {
      // Build description with form responses
      let description = `Appointment with ${validatedData.visitorName}\nEmail: ${validatedData.visitorEmail}${
        validatedData.visitorPhone ? `\nPhone: ${validatedData.visitorPhone}` : ''
      }${validatedData.notes ? `\n\nNotes: ${validatedData.notes}` : ''}`;

      // Add custom form responses if present
      if (validatedData.formResponses && Object.keys(validatedData.formResponses).length > 0) {
        description += '\n\nCustom Fields:';
        // Fetch field labels for better display
        const formFields = await prisma.bookingFormField.findMany({
          where: { userId: user.id },
          select: { id: true, label: true },
        });
        const fieldMap = Object.fromEntries(formFields.map(f => [f.id, f.label]));

        for (const [fieldId, value] of Object.entries(validatedData.formResponses)) {
          const label = fieldMap[fieldId] || fieldId;
          description += `\n${label}: ${value}`;
        }
      }

      calendarEventId = await createCalendarEvent({
        userId: user.id,
        summary: `${appointmentType.name} - ${validatedData.visitorName}`,
        description,
        startTime,
        endTime,
        attendeeEmail: validatedData.visitorEmail,
        attendeeName: validatedData.visitorName,
      });

      // Update appointment with calendar event ID
      if (calendarEventId) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { calendarEventId },
        });
      }
    } catch (error) {
      log.error('[Book] Error creating calendar event', error);
      // Don't fail the appointment if calendar creation fails
    }

    // Invalidate cache for this user's availability
    availabilityCache.invalidateUser(user.id);
    log.info('[Booking] Cache invalidated after new booking', { userId: user.id });

    // Send email notifications (don't let failures break booking)
    try {
      const { sendBookingConfirmation, sendBookingNotification } = await import('@/lib/email');

      // Send confirmation to customer
      await sendBookingConfirmation({
        appointmentId: appointment.id,
        visitorEmail: appointment.visitorEmail,
        visitorName: appointment.visitorName,
        appointmentTypeName: appointmentType.name,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        timezone: appointment.timezone,
        cancellationToken: appointment.cancellationToken,
        businessName: user.businessName || undefined,
      });

      // Send notification to business owner
      // TODO: Add emailNotifications and notificationEmail fields to User model
      await sendBookingNotification({
        appointmentId: appointment.id,
        ownerEmail: user.email,
        visitorName: appointment.visitorName,
        visitorEmail: appointment.visitorEmail,
        appointmentTypeName: appointmentType.name,
        startTime: appointment.startTime,
        timezone: appointment.timezone,
        notes: appointment.notes || undefined,
      });
    } catch (error) {
      // Log error but don't fail the booking
      log.error('[Book] Failed to send email notifications', error);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        appointmentType: {
          name: appointmentType.name,
          duration: appointmentType.duration,
        },
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        timezone: appointment.timezone,
        visitorName: appointment.visitorName,
        visitorEmail: appointment.visitorEmail,
        cancellationToken: appointment.cancellationToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('[Book] Validation error', {
        issues: error.issues,
      });
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Book] Error booking appointment', error);
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}
