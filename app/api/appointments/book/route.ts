import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google/calendar';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { z } from 'zod';

const bookAppointmentSchema = z.object({
  widgetId: z.string(),
  appointmentTypeId: z.string(),
  startTime: z.string().datetime(),
  visitorName: z.string().min(1, 'Name is required'),
  visitorEmail: z.string().email('Valid email is required'),
  visitorPhone: z.string().optional(),
  notes: z.string().optional(),
  timezone: z.string(),
  formResponses: z.record(z.string(), z.unknown()).optional(),
});

// POST - Book an appointment (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Book] Received body:', body);
    console.log('[Book] Schema:', bookAppointmentSchema);

    const validatedData = bookAppointmentSchema.parse(body);
    console.log('[Book] Validated data:', validatedData);

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

    // Check if slot is still available (prevent double booking)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: user.id,
        status: {
          not: 'cancelled',
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
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
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Create appointment
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
        formResponses: validatedData.formResponses,
        status: 'confirmed',
      },
      include: {
        appointmentType: true,
      },
    });

    // Create Google Calendar event
    let calendarEventId: string | undefined;
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
      console.error('Error creating calendar event:', error);
      // Don't fail the appointment if calendar creation fails
    }

    // Invalidate cache for this user's availability
    availabilityCache.invalidateUser(user.id);
    console.log(`[Booking] Cache invalidated for user ${user.id} after new booking`);

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
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}
