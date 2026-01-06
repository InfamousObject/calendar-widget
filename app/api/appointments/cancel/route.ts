import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteCalendarEvent } from '@/lib/google/calendar';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

// POST - Cancel an appointment using cancellation token (public endpoint)
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (prevent brute-force token enumeration)
    const clientIp = getClientIp(request);
    const { success, remaining } = await checkRateLimit('cancellation', clientIp);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many cancellation attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      );
    }

    const { cancellationToken } = await request.json();

    if (!cancellationToken) {
      return NextResponse.json(
        { error: 'Cancellation token is required' },
        { status: 400 }
      );
    }

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: { cancellationToken },
      include: {
        appointmentType: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'cancelled' },
    });

    // Delete Google Calendar event
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(appointment.userId, appointment.calendarEventId);
      } catch (error) {
        log.error('[Cancellation] Error deleting calendar event', {
          userId: appointment.userId,
          eventId: appointment.calendarEventId,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't fail the cancellation if calendar deletion fails
      }
    }

    // Invalidate cache (frees up time slot)
    availabilityCache.invalidateUser(appointment.userId);
    log.info('[Cancellation] Cache invalidated after public cancellation', { userId: appointment.userId });

    // Send cancellation confirmation email
    try {
      const { sendCancellationConfirmation } = await import('@/lib/email');

      await sendCancellationConfirmation({
        visitorEmail: appointment.visitorEmail,
        visitorName: appointment.visitorName,
        appointmentTypeName: appointment.appointmentType.name,
        startTime: appointment.startTime,
        timezone: appointment.timezone,
      });
    } catch (error) {
      log.error('[Cancellation] Failed to send confirmation email', error);
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    log.error('[Cancellation] Error cancelling appointment', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
