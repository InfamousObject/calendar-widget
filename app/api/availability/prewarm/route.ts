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

    // Check which dates still need fetching
    const uncachedDates: string[] = [];
    for (const dateStr of datesToPrewarm) {
      const cached = await availabilityCache.getCalendarEvents(`team:${userId}`, dateStr);
      if (cached) {
        log.debug('Date already cached, skipping prewarm', { date: dateStr });
      } else {
        uncachedDates.push(dateStr);
      }
    }

    if (uncachedDates.length > 0) {
      // Fetch ALL events for the full range in ONE API call
      const rangeStart = startOfDay(new Date(uncachedDates[0]));
      const rangeEnd = endOfDay(new Date(uncachedDates[uncachedDates.length - 1]));

      try {
        const allEvents = await getTeamCalendarEvents(userId, rangeStart, rangeEnd);

        // Distribute events to per-day cache entries
        for (const dateStr of uncachedDates) {
          const dayStart = startOfDay(new Date(dateStr));
          const dayEnd = endOfDay(new Date(dateStr));
          const dayEvents = allEvents.filter((event: any) => {
            const es = new Date(event.start?.dateTime || event.start?.date);
            const ee = new Date(event.end?.dateTime || event.end?.date);
            return es < dayEnd && ee > dayStart;
          });
          availabilityCache.setCalendarEvents(`team:${userId}`, dateStr, dayEvents);
        }

        log.info('Batch-fetched events for prewarm', {
          totalEvents: allEvents.length,
          datesWarmed: uncachedDates.length,
        });
      } catch (error) {
        log.error('Failed to batch-fetch during prewarm', { error });
      }
    }

    const duration = Date.now() - startTime;
    log.info('Prewarm completed', { durationMs: duration });
  } catch (error) {
    log.error('Fatal error during prewarm', { error });
  }
}
