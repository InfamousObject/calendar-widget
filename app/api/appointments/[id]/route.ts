import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteCalendarEvent, updateCalendarEvent } from '@/lib/google/calendar';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { z } from 'zod';

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
        console.error('Error deleting calendar event:', error);
        // Don't fail the update if calendar deletion fails
      }
    }

    // Invalidate cache when appointment is cancelled (frees up time slot)
    if (validatedData.status === 'cancelled') {
      availabilityCache.invalidateUser(user.id);
      console.log(`[Appointment] Cache invalidated for user ${user.id} after cancellation`);
    }

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating appointment:', error);
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
        console.error('Error deleting calendar event:', error);
        // Don't fail the delete if calendar deletion fails
      }
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id },
    });

    // Invalidate cache (frees up time slot)
    availabilityCache.invalidateUser(user.id);
    console.log(`[Appointment] Cache invalidated for user ${user.id} after deletion`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
