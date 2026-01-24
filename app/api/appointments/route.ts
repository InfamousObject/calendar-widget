import { NextRequest, NextResponse } from 'next/server';
import { requireTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

// GET - List all appointments for the team account
export async function GET(request: NextRequest) {
  try {
    const context = await requireTeamContext();

    // Check permission
    if (!hasPermission(context.role, 'appointments:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build query filters using accountId (team owner's account)
    const where: any = {
      userId: context.accountId,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        appointmentType: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    log.error('[Appointment] Error fetching appointments', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
