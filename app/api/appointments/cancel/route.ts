import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteCalendarEvent } from '@/lib/google/calendar';
import { availabilityCache } from '@/lib/cache/availability-cache';

// POST - Cancel an appointment using cancellation token (public endpoint)
export async function POST(request: NextRequest) {
  try {
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
        console.error('Error deleting calendar event:', error);
        // Don't fail the cancellation if calendar deletion fails
      }
    }

    // Invalidate cache (frees up time slot)
    availabilityCache.invalidateUser(appointment.userId);
    console.log(`[Cancellation] Cache invalidated for user ${appointment.userId} after public cancellation`);

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
