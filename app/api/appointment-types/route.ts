import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { checkUsageLimit } from '@/lib/subscription';
import { z } from 'zod';
import { log } from '@/lib/logger';

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
  enableGoogleMeet: z.boolean().default(false), // Auto-generate Google Meet link
  // Payment settings
  price: z.number().min(50, 'Minimum price is 50 cents').nullable().optional(), // Price in cents (null = free)
  currency: z.string().length(3, 'Currency must be 3 characters').default('usd'),
  requirePayment: z.boolean().default(false), // Require payment before booking
  depositPercent: z.number().min(1).max(100).nullable().optional(), // Percentage for deposit (null = full payment)
  refundPolicy: z.enum(['full', 'partial', 'none']).default('full'), // full, partial (50%), none
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
      const authUserId = await getCurrentUserId();

      if (!authUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = authUserId;
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
    log.error('[AppointmentType] Error fetching appointment types', {
      error: error instanceof Error ? error.message : String(error)
    });
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
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check appointment type limit for user's subscription tier
    const usageCheck = await checkUsageLimit(userId, 'appointmentTypes');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: `Appointment type limit reached (${usageCheck.limit} appointment type${usageCheck.limit > 1 ? 's' : ''} on your plan). Upgrade to Booking or Bundle for unlimited appointment types.`,
          limit: usageCheck.limit,
          current: usageCheck.current
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = appointmentTypeSchema.parse(body);

    const appointmentType = await prisma.appointmentType.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    return NextResponse.json(appointmentType, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[AppointmentType] Error creating appointment type', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
