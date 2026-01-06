import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { log } from '@/lib/logger';

const fieldUpdateSchema = z.object({
  label: z.string().min(1, 'Label is required').optional(),
  fieldType: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'checkbox']).optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  order: z.number().optional(),
  active: z.boolean().optional(),
});

// PATCH - Update a booking form field
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
    const validatedData = fieldUpdateSchema.parse(body);

    // Check if field belongs to user
    const existingField = await prisma.bookingFormField.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const updatedField = await prisma.bookingFormField.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ field: updatedField });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Forms] Failed to update booking form field', error);
    return NextResponse.json(
      { error: 'Failed to update form field' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a booking form field
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

    // Check if field belongs to user
    const existingField = await prisma.bookingFormField.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    await prisma.bookingFormField.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Forms] Failed to delete booking form field', error);
    return NextResponse.json(
      { error: 'Failed to delete form field' },
      { status: 500 }
    );
  }
}
