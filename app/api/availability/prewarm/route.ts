import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { getCalendarEvents } from '@/lib/google/calendar';

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
      console.error('[Prewarm] Error:', error);
    });

    return NextResponse.json({
      success: true,
      message: `Pre-warming ${daysToPrewarm} days in background`,
    });
  } catch (error) {
    console.error('[Prewarm] Error:', error);
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
  console.log(`[Prewarm] Starting for user ${userId}, ${daysToPrewarm} days`);
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

    console.log(`[Prewarm] Pre-warming ${datesToPrewarm.length} dates: ${datesToPrewarm.join(', ')}`);

    // Fetch calendar events for all dates in parallel
    const prewarmPromises = datesToPrewarm.map(async (dateStr) => {
      try {
        // Check if already cached
        const cached = availabilityCache.getCalendarEvents(userId, dateStr);
        if (cached) {
          console.log(`[Prewarm] ${dateStr} already cached, skipping`);
          return;
        }

        const date = new Date(dateStr);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const events = await getCalendarEvents(userId, dayStart, dayEnd);
        availabilityCache.setCalendarEvents(userId, dateStr, events);
        console.log(`[Prewarm] ✓ Cached ${events.length} events for ${dateStr}`);
      } catch (error) {
        console.error(`[Prewarm] Failed to cache ${dateStr}:`, error);
      }
    });

    await Promise.all(prewarmPromises);

    const duration = Date.now() - startTime;
    console.log(`[Prewarm] ✅ Completed in ${duration}ms`);
  } catch (error) {
    console.error('[Prewarm] Fatal error:', error);
  }
}
