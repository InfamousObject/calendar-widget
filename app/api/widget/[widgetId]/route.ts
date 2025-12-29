import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get public widget information
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId } = await context.params;

    // Find user by widget ID
    const user = await prisma.user.findUnique({
      where: { widgetId },
      select: {
        id: true,
        businessName: true,
        name: true,
        timezone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Get active appointment types
    const appointmentTypes = await prisma.appointmentType.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        color: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      businessName: user.businessName || user.name || 'Business',
      timezone: user.timezone,
      appointmentTypes,
    });
  } catch (error) {
    console.error('Error fetching widget info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget information' },
      { status: 500 }
    );
  }
}
