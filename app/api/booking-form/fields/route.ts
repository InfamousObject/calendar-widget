import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { log } from '@/lib/logger';

// Validation schema
const fieldSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  fieldType: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'checkbox']),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  order: z.number().default(0),
  active: z.boolean().default(true),
});

// GET - Get all booking form fields for the user
export async function GET(request: NextRequest) {
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

    const fields = await prisma.bookingFormField.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ fields });
  } catch (error) {
    log.error('[Forms] Failed to fetch booking form fields', error);
    return NextResponse.json(
      { error: 'Failed to fetch form fields' },
      { status: 500 }
    );
  }
}

// POST - Create a new booking form field
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    log.debug('[Forms] Received booking form field creation request', {
      fieldCount: 1,
    });

    const validatedData = fieldSchema.parse(body);
    log.debug('[Forms] Validated booking form field data');

    // Get the next order number
    const maxOrderField = await prisma.bookingFormField.findFirst({
      where: { userId: user.id },
      orderBy: { order: 'desc' },
    });

    const nextOrder = maxOrderField ? maxOrderField.order + 1 : 0;

    const createData = {
      ...validatedData,
      userId: user.id,
      order: nextOrder,
    };
    log.debug('[Forms] Creating booking form field', {
      order: nextOrder,
    });

    const field = await prisma.bookingFormField.create({
      data: createData,
    });

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.debug('[Forms] Validation error for booking form field', {
        issues: error.issues,
      });
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[Forms] Failed to create booking form field', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create form field: ${errorMessage}` },
      { status: 500 }
    );
  }
}
