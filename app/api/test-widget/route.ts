import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

// GET - Test endpoint to get your widgetId
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        widgetId: true,
        businessName: true,
      },
    });

    return NextResponse.json({
      user,
      bookingUrl: `${request.nextUrl.origin}/book/${user?.widgetId}`,
    });
  } catch (error) {
    log.error('Error fetching test widget data', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
