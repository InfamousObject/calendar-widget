import { NextRequest, NextResponse } from 'next/server';
import { requireTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { canAcceptPayments } from '@/lib/subscription';
import { z } from 'zod';
import { log } from '@/lib/logger';

const appointmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  duration: z.number().min(5, 'Duration must be at least 5 minutes').optional(),
  color: z.string().optional(),
  bufferBefore: z.number().min(0).optional(),
  bufferAfter: z.number().min(0).optional(),
  active: z.boolean().optional(),
  enableGoogleMeet: z.boolean().optional(), // Auto-generate Google Meet link
  // Payment settings
  price: z.number().min(50, 'Minimum price is 50 cents').nullable().optional(), // Price in cents (null = free)
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  requirePayment: z.boolean().optional(), // Require payment before booking
  depositPercent: z.number().min(1).max(100).nullable().optional(), // Percentage for deposit (null = full payment)
  refundPolicy: z.enum(['full', 'partial', 'none']).optional(), // full, partial (50%), none
});

/**
 * PATCH /api/appointment-types/[id]
 * Update an appointment type
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireTeamContext();
    const { id } = await params;

    // Check permission
    if (!hasPermission(context.role, 'appointment-types:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if appointment type exists and belongs to team account
    const existing = await prisma.appointmentType.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== context.accountId) {
      return NextResponse.json(
        { error: 'Appointment type not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = appointmentTypeSchema.parse(body);

    // Check if payment fields are being set
    if (validatedData.requirePayment || validatedData.price) {
      const paymentCheck = await canAcceptPayments(context.accountId);
      if (!paymentCheck.allowed) {
        return NextResponse.json(
          {
            error: paymentCheck.message,
            requiresUpgrade: true,
            currentTier: paymentCheck.tier,
          },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.appointmentType.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[AppointmentType] Error updating appointment type', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointment-types/[id]
 * Delete an appointment type
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireTeamContext();
    const { id } = await params;

    // Check permission
    if (!hasPermission(context.role, 'appointment-types:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if appointment type exists and belongs to team account
    const existing = await prisma.appointmentType.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== context.accountId) {
      return NextResponse.json(
        { error: 'Appointment type not found' },
        { status: 404 }
      );
    }

    await prisma.appointmentType.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Appointment type deleted' });
  } catch (error) {
    log.error('[AppointmentType] Error deleting appointment type', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
