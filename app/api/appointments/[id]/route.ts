import { NextRequest, NextResponse } from 'next/server';
import { requireTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { deleteCalendarEvent } from '@/lib/google/calendar';
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
  routeContext: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireTeamContext();

    // Check permission
    if (!hasPermission(context.role, 'appointments:edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await routeContext.params;
    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    // Find appointment (must belong to team account)
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        appointmentType: true,
      },
    });

    if (!appointment || appointment.userId !== context.accountId) {
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
        await deleteCalendarEvent(context.accountId, appointment.calendarEventId);
      } catch (error) {
        log.error('[Appointment] Error deleting calendar event', {
          accountId: context.accountId,
          eventId: appointment.calendarEventId,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't fail the update if calendar deletion fails
      }
    }

    // Invalidate cache when appointment is cancelled (frees up time slot)
    if (validatedData.status === 'cancelled') {
      availabilityCache.invalidateUser(context.accountId);
      log.info('[Appointment] Cache invalidated after cancellation', { accountId: context.accountId });
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

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an appointment
export async function DELETE(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireTeamContext();

    // Check permission
    if (!hasPermission(context.role, 'appointments:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await routeContext.params;

    // Find appointment (must belong to team account)
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.userId !== context.accountId) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete calendar event
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(context.accountId, appointment.calendarEventId);
      } catch (error) {
        log.error('[Appointment] Error deleting calendar event', {
          accountId: context.accountId,
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
    availabilityCache.invalidateUser(context.accountId);
    log.info('[Appointment] Cache invalidated after deletion', { accountId: context.accountId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Appointment] Error deleting appointment', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
