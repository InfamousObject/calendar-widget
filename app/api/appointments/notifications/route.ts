import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get recent appointment notifications
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
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
