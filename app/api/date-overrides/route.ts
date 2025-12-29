import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const dateOverrideSchema = z.object({
  date: z.string().datetime(),
  isAvailable: z.boolean(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  reason: z.string().optional(),
});

// GET - Fetch all date overrides for the user
export async function GET(request: NextRequest) {
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

    const dateOverrides = await prisma.dateOverride.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(dateOverrides);
  } catch (error) {
    console.error('Error fetching date overrides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch date overrides' },
      { status: 500 }
    );
  }
}

// POST - Create new date override
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = dateOverrideSchema.parse(body);

    // If available, validate that start time is before end time
    if (
      validatedData.isAvailable &&
      validatedData.startTime &&
      validatedData.endTime
    ) {
      if (validatedData.startTime >= validatedData.endTime) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        );
      }
    }

    const dateOverride = await prisma.dateOverride.create({
      data: {
        userId: user.id,
        date: new Date(validatedData.date),
        isAvailable: validatedData.isAvailable,
        startTime: validatedData.startTime || null,
        endTime: validatedData.endTime || null,
        reason: validatedData.reason || null,
      },
    });

    return NextResponse.json(dateOverride, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating date override:', error);
    return NextResponse.json(
      { error: 'Failed to create date override' },
      { status: 500 }
    );
  }
}
