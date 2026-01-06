import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { deleteCalendarEvent, updateCalendarEvent } from '@/lib/google/calendar';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { z } from 'zod';
import { log } from '@/lib/logger';

const updateAppointmentSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']).optional(),
  notes: z.string().optional(),
});

// PATCH - Update an appointment
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        appointmentType: true,
      },
    });

    if (!appointment || appointment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: validatedData,
      include: {
        appointmentType: true,
      },
    });

    // Handle calendar updates
    if (validatedData.status === 'cancelled' && appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(user.id, appointment.calendarEventId);
      } catch (error) {
        log.error('[Appointment] Error deleting calendar event', {
          userId: user.id,
          eventId: appointment.calendarEventId,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't fail the update if calendar deletion fails
      }
    }

    // Invalidate cache when appointment is cancelled (frees up time slot)
    if (validatedData.status === 'cancelled') {
      availabilityCache.invalidateUser(user.id);
      log.info('[Appointment] Cache invalidated after cancellation', { userId: user.id });
    }

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Appointment] Error updating appointment', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an appointment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await context.params;

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete calendar event
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(user.id, appointment.calendarEventId);
      } catch (error) {
        log.error('[Appointment] Error deleting calendar event', {
          userId: user.id,
          eventId: appointment.calendarEventId,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't fail the delete if calendar deletion fails
      }
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id },
    });

    // Invalidate cache (frees up time slot)
    availabilityCache.invalidateUser(user.id);
    log.info('[Appointment] Cache invalidated after deletion', { userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Appointment] Error deleting appointment', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
