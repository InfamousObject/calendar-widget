import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google/calendar';
import { stripe } from '@/lib/stripe';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { incrementUsage, checkUsageLimit } from '@/lib/subscription';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyCaptcha } from '@/lib/captcha';
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
  paymentIntentId: z.string().optional(), // Stripe Payment Intent ID for paid appointments
});

// POST - Book an appointment (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get client IP for rate limiting and CAPTCHA verification
    const clientIp = getClientIp(request);

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

    // Check rate limit (fail-open: don't block booking on rate limit errors)
    try {
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
    } catch (error) {
      log.error('[Book] Rate limit check failed, proceeding anyway', error instanceof Error ? error : new Error(String(error)));
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

    // Payment verification for paid appointments
    let paymentInfo: {
      paymentIntentId: string;
      paymentStatus: string;
      amountPaid: number;
      currency: string;
    } | null = null;

    if (appointmentType.requirePayment && appointmentType.price) {
      // Payment is required - verify payment intent
      if (!validatedData.paymentIntentId) {
        return NextResponse.json(
          {
            error: 'Payment required for this appointment type',
            requiresPayment: true,
            price: appointmentType.price,
            currency: appointmentType.currency,
            depositPercent: appointmentType.depositPercent,
          },
          { status: 402 } // Payment Required
        );
      }

      // Verify the payment intent with Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(validatedData.paymentIntentId);

        // Verify payment intent is successful
        if (paymentIntent.status !== 'succeeded') {
          log.warn('[Book] Payment intent not succeeded', {
            paymentIntentId: validatedData.paymentIntentId,
            status: paymentIntent.status,
          });
          return NextResponse.json(
            {
              error: 'Payment has not been completed. Please complete payment first.',
              paymentStatus: paymentIntent.status,
            },
            { status: 402 }
          );
        }

        // Verify the payment is for this appointment type
        if (paymentIntent.metadata.appointmentTypeId !== appointmentType.id) {
          log.warn('[Book] Payment intent for wrong appointment type', {
            paymentIntentId: validatedData.paymentIntentId,
            expected: appointmentType.id,
            got: paymentIntent.metadata.appointmentTypeId,
          });
          return NextResponse.json(
            { error: 'Payment is for a different appointment type' },
            { status: 400 }
          );
        }

        // Check if this payment intent has already been used
        const existingBooking = await prisma.appointment.findFirst({
          where: { paymentIntentId: validatedData.paymentIntentId },
        });

        if (existingBooking) {
          log.warn('[Book] Payment intent already used', {
            paymentIntentId: validatedData.paymentIntentId,
            existingAppointmentId: existingBooking.id,
          });
          return NextResponse.json(
            { error: 'This payment has already been used for a booking' },
            { status: 400 }
          );
        }

        // Store payment info for the appointment
        paymentInfo = {
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'paid',
          amountPaid: paymentIntent.amount,
          currency: paymentIntent.currency,
        };

        log.info('[Book] Payment verified successfully', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
        });
      } catch (error) {
        log.error('[Book] Error verifying payment intent', error);
        return NextResponse.json(
          { error: 'Failed to verify payment. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Calculate end time
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(startTime.getTime() + appointmentType.duration * 60000);

    // Generate cryptographically secure cancellation token (64 bytes = 128 hex characters)
    const cancellationToken = crypto.randomBytes(64).toString('hex');

    // Check for conflicting appointments then create
    // Using sequential queries (interactive transactions are not supported
    // with @prisma/adapter-pg through Supabase PgBouncer)
    const conflictingAppointment = await prisma.appointment.findFirst({
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
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please select another time.' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
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
        // Payment info (if payment was required)
        paymentIntentId: paymentInfo?.paymentIntentId,
        paymentStatus: paymentInfo?.paymentStatus,
        amountPaid: paymentInfo?.amountPaid,
        currency: paymentInfo?.currency,
      },
      include: {
        appointmentType: true,
      },
    });

    // Track usage for billing and limits
    try {
      await incrementUsage(user.id, 'booking');
    } catch (error) {
      log.error('[Book] Failed to increment usage', error);
    }

    // Create Google Calendar event (with optional Google Meet link)
    let calendarEventId: string | null | undefined;
    let meetingLink: string | null | undefined;
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

      const calendarResult = await createCalendarEvent({
        userId: user.id,
        summary: `${appointmentType.name} - ${validatedData.visitorName}`,
        description,
        startTime,
        endTime,
        attendeeEmail: validatedData.visitorEmail,
        attendeeName: validatedData.visitorName,
        enableGoogleMeet: appointmentType.enableGoogleMeet,
      });

      calendarEventId = calendarResult.eventId;
      meetingLink = calendarResult.meetingLink;

      // Update appointment with calendar event ID and meeting link
      if (calendarEventId || meetingLink) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            calendarEventId: calendarEventId ?? undefined,
            meetingLink: meetingLink ?? undefined,
            meetingProvider: meetingLink ? 'google_meet' : undefined,
          },
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
        ownerName: user.name || undefined,
        ownerEmail: user.email,
        meetingLink: meetingLink ?? undefined,
        meetingProvider: meetingLink ? 'google_meet' : undefined,
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
        meetingLink: meetingLink ?? undefined,
        meetingProvider: meetingLink ? 'google_meet' : undefined,
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
        meetingLink: meetingLink ?? undefined,
        meetingProvider: meetingLink ? 'google_meet' : undefined,
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
