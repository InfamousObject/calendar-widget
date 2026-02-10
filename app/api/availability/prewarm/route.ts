import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { getTeamCalendarEvents } from '@/lib/google/calendar';
import { log } from '@/lib/logger';

// POST - Pre-warm cache for next N days (background process)
export async function POST(request: NextRequest) {
  try {
    const { userId, widgetId, appointmentTypeId, daysToPrewarm = 5 } = await request.json();

    // Find user
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (widgetId) {
      user = await prisma.user.findUnique({ where: { widgetId } });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Start pre-warming in the background (don't await)
    prewarmAvailability(user.id, appointmentTypeId, daysToPrewarm).catch(error => {
      log.error('Prewarm background task error', { error });
    });

    return NextResponse.json({
      success: true,
      message: `Pre-warming ${daysToPrewarm} days in background`,
    });
  } catch (error) {
    log.error('Failed to start pre-warming', { error });
    return NextResponse.json(
      { error: 'Failed to start pre-warming' },
      { status: 500 }
    );
  }
}

/**
 * Pre-warm cache by fetching calendar events for multiple days
 */
async function prewarmAvailability(
  userId: string,
  appointmentTypeId: string,
  daysToPrewarm: number
): Promise<void> {
  log.info('Starting availability prewarm', { daysToPrewarm });
  const startTime = Date.now();

  try {
    // Get available dates
    const availability = await prisma.availability.findMany({
      where: { userId, isAvailable: true },
    });

    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, daysToPrewarm);

    const dateOverrides = await prisma.dateOverride.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    // Determine which dates have availability
    const datesToPrewarm: string[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate && datesToPrewarm.length < daysToPrewarm) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // Check for override
      const override = dateOverrides.find(
        (o) => format(o.date, 'yyyy-MM-dd') === dateStr
      );

      let hasAvailability = false;
      if (override) {
        hasAvailability = override.isAvailable && !!override.startTime && !!override.endTime;
      } else {
        const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);
        hasAvailability = !!dayAvailability;
      }

      if (hasAvailability) {
        datesToPrewarm.push(dateStr);
      }

      currentDate = addDays(currentDate, 1);
    }

    log.info('Pre-warming dates', {
      dateCount: datesToPrewarm.length,
      dates: datesToPrewarm
    });

    // Fetch calendar events for all dates in parallel
    const prewarmPromises = datesToPrewarm.map(async (dateStr) => {
      try {
        // Check if already cached (use team: prefix to match slots endpoint)
        const cached = availabilityCache.getCalendarEvents(`team:${userId}`, dateStr);
        if (cached) {
          log.debug('Date already cached, skipping prewarm', { date: dateStr });
          return;
        }

        const date = new Date(dateStr);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const events = await getTeamCalendarEvents(userId, dayStart, dayEnd);
        availabilityCache.setCalendarEvents(`team:${userId}`, dateStr, events);
        log.info('Cached events for date', { eventCount: events.length, date: dateStr });
      } catch (error) {
        log.error('Failed to cache date during prewarm', { error, date: dateStr });
      }
    });

    await Promise.all(prewarmPromises);

    const duration = Date.now() - startTime;
    log.info('Prewarm completed', { durationMs: duration });
  } catch (error) {
    log.error('Fatal error during prewarm', { error });
  }
}
