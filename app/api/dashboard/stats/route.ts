import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        widgetId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch counts in parallel
    const [appointmentsCount, formsCount, submissionsCount] = await Promise.all([
      prisma.appointment.count({
        where: { userId: user.id },
      }),
      prisma.form.count({
        where: { userId: user.id },
      }),
      prisma.formSubmission.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      appointmentsCount,
      formsCount,
      submissionsCount,
      widgetId: user.widgetId,
    });
  } catch (error) {
    log.error('Error fetching dashboard stats', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
