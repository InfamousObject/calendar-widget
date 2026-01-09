import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAppointmentReminder } from '@/lib/email';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Verify request is from Vercel Cron or has valid CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';

  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log.warn('[Cron] Unauthorized attempt to trigger reminders');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log.info('[Cron] Starting appointment reminder job');

  try {
    // Calculate time window: 24 hours from now (±1 hour buffer)
    const now = new Date();
    const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Fetch appointments in the reminder window
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: reminderStart,
          lt: reminderEnd,
        },
        status: 'confirmed',
      },
      include: {
        appointmentType: true,
      },
    });

    log.info(`[Cron] Found ${appointments.length} appointments to remind`);

    let successCount = 0;
    let failureCount = 0;

    // Send reminders
    for (const appointment of appointments) {
      try {
        await sendAppointmentReminder({
          appointmentId: appointment.id,
          visitorEmail: appointment.visitorEmail,
          visitorName: appointment.visitorName,
          appointmentTypeName: appointment.appointmentType.name,
          startTime: appointment.startTime,
          timezone: appointment.timezone,
          cancellationToken: appointment.cancellationToken,
        });
        successCount++;
      } catch (error) {
        log.error('[Cron] Failed to send reminder', {
          appointmentId: appointment.id,
          error,
        });
        failureCount++;
      }
    }

    log.info('[Cron] Reminder job completed', {
      total: appointments.length,
      success: successCount,
      failures: failureCount,
    });

    return NextResponse.json({
      success: true,
      total: appointments.length,
      sent: successCount,
      failed: failureCount,
    });
  } catch (error) {
    log.error('[Cron] Reminder job failed', error);
    return NextResponse.json(
      { error: 'Reminder job failed' },
      { status: 500 }
    );
  }
}
