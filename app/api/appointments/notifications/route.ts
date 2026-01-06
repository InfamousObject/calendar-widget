import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

// GET - Get recent appointment notifications
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

    // Get appointments created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAppointments = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: {
          not: 'cancelled',
        },
      },
      include: {
        appointmentType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      notifications: recentAppointments.map((apt) => ({
        id: apt.id,
        type: 'new_booking',
        message: `New booking: ${apt.appointmentType.name} with ${apt.visitorName}`,
        appointmentType: apt.appointmentType.name,
        visitorName: apt.visitorName,
        visitorEmail: apt.visitorEmail,
        startTime: apt.startTime,
        createdAt: apt.createdAt,
        isNew: (new Date().getTime() - new Date(apt.createdAt).getTime()) < 3600000, // Within last hour
      })),
    });
  } catch (error) {
    log.error('[Notifications] Error fetching notifications', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
