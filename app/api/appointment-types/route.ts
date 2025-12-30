import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Appointment type schema validation
 */
const appointmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  color: z.string().default('#3b82f6'),
  bufferBefore: z.number().min(0).default(0),
  bufferAfter: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

/**
 * GET /api/appointment-types
 * Get all appointment types for the authenticated user or by widgetId (public)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const widgetId = searchParams.get('widgetId');

    let userId: string | undefined;

    if (widgetId) {
      // Public access via widgetId
      const user = await prisma.user.findUnique({
        where: { widgetId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
      }

      userId = user.id;
    } else {
      // Authenticated access
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = session.user.id;
    }

    const appointmentTypes = await prisma.appointmentType.findMany({
      where: {
        userId,
        active: true, // Only return active appointment types for public access
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ appointmentTypes });
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointment-types
 * Create a new appointment type
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = appointmentTypeSchema.parse(body);

    const appointmentType = await prisma.appointmentType.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(appointmentType, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating appointment type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
