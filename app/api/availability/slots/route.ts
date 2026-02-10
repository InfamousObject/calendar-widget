import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTeamCalendarEvents, checkSlotsAgainstEvents } from '@/lib/google/calendar';
import { addDays, format, startOfDay, endOfDay, addMinutes, isBefore, isAfter, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

interface TimeSlot {
  start: string; // ISO string
  end: string; // ISO string
  startLocal: string; // Human-readable local time (e.g., "10:30 AM")
  endLocal: string; // Human-readable local time (e.g., "11:00 AM")
  available: boolean;
}

const isDev = process.env.NODE_ENV === 'development';

// GET - Calculate available time slots
export async function GET(request: NextRequest) {
    // Check rate limit (fail-open: don't block availability on rate limit errors)
    try {
      const clientIp = getClientIp(request);
      const { success, remaining } = await checkRateLimit('availability', clientIp);

      if (!success) {
        return NextResponse.json(
          { error: 'Too many availability requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': remaining.toString(),
            },
          }
        );
      }
    } catch (error) {
      log.error('Rate limit check failed, proceeding anyway', error instanceof Error ? error : new Error(String(error)));
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const widgetId = searchParams.get('widgetId');
    const appointmentTypeId = searchParams.get('appointmentTypeId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Look up user
    let user;
    try {
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      } else if (widgetId) {
        user = await prisma.user.findUnique({ where: { widgetId } });
      }
    } catch (error) {
      log.error('User lookup failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Failed to look up user', stage: 'user_lookup', ...(isDev && { details: error instanceof Error ? error.message : String(error) }) },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!appointmentTypeId) {
      return NextResponse.json(
        { error: 'appointmentTypeId is required' },
        { status: 400 }
      );
    }

    // Get appointment type
    let appointmentType;
    try {
      appointmentType = await prisma.appointmentType.findFirst({
        where: {
          id: appointmentTypeId,
          userId: user.id,
          active: true,
        },
      });
    } catch (error) {
      log.error('Appointment type lookup failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Failed to look up appointment type', stage: 'appointment_type', ...(isDev && { details: error instanceof Error ? error.message : String(error) }) },
        { status: 500 }
      );
    }

    if (!appointmentType) {
      return NextResponse.json(
        { error: 'Appointment type not found or inactive' },
        { status: 404 }
      );
    }

    // Parse dates (default to next 7 days)
    const startDate = startDateParam
      ? startOfDay(parseISO(startDateParam))
      : startOfDay(new Date());
    const endDate = endDateParam
      ? endOfDay(parseISO(endDateParam))
      : endOfDay(addDays(startDate, 6)); // 7 days total

    // For single-day requests, check cache first
    const isSingleDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
    if (isSingleDay) {
      const dateStr = format(startDate, 'yyyy-MM-dd');
      const cachedSlots = await availabilityCache.getSlots(user.id, appointmentTypeId, dateStr);

      if (cachedSlots) {
        return NextResponse.json({
          appointmentType: {
            id: appointmentType.id,
            name: appointmentType.name,
            duration: appointmentType.duration,
          },
          timezone: user.timezone,
          slots: [{ date: dateStr, slots: cachedSlots }],
          cached: true,
        });
      }
    }

    // Fetch availability settings, date overrides, and existing appointments
    let availability;
    let dateOverrides;
    let existingAppointments;
    try {
      [availability, dateOverrides, existingAppointments] = await Promise.all([
        prisma.availability.findMany({
          where: {
            userId: user.id,
            isAvailable: true,
          },
        }),
        prisma.dateOverride.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.appointment.findMany({
          where: {
            userId: user.id,
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              not: 'cancelled',
            },
          },
          include: {
            appointmentType: true,
          },
        }),
      ]);
    } catch (error) {
      log.error('Data queries failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Failed to fetch availability data', stage: 'data_queries', ...(isDev && { details: error instanceof Error ? error.message : String(error) }) },
        { status: 500 }
      );
    }

    // Generate slots for each day
    try {
      // --- Pre-fetch calendar events for the ENTIRE date range ---
      const dateStrings: string[] = [];
      {
        let d = new Date(startDate);
        while (isBefore(d, endDate) || d.getTime() === startDate.getTime()) {
          dateStrings.push(format(d, 'yyyy-MM-dd'));
          d = addDays(d, 1);
        }
      }

      // Check per-day cache, collect misses
      const cachedEventsByDate = new Map<string, any[]>();
      const uncachedDates: string[] = [];
      for (const ds of dateStrings) {
        const cached = await availabilityCache.getCalendarEvents(`team:${user.id}`, ds);
        if (cached) {
          cachedEventsByDate.set(ds, cached);
        } else {
          uncachedDates.push(ds);
        }
      }

      // If any dates missed cache, fetch full range in ONE API call
      if (uncachedDates.length > 0) {
        try {
          const fetchedEvents = await getTeamCalendarEvents(user.id, startDate, endDate);
          for (const ds of uncachedDates) {
            const dayStart = startOfDay(parseISO(ds));
            const dayEnd = endOfDay(parseISO(ds));
            const dayEvents = fetchedEvents.filter((event: any) => {
              const es = new Date(event.start?.dateTime || event.start?.date);
              const ee = new Date(event.end?.dateTime || event.end?.date);
              return es < dayEnd && ee > dayStart;
            });
            cachedEventsByDate.set(ds, dayEvents);
            availabilityCache.setCalendarEvents(`team:${user.id}`, ds, dayEvents);
          }
          log.info('Pre-fetched calendar events for range', {
            eventCount: fetchedEvents.length,
            cachedDays: dateStrings.length - uncachedDates.length,
            fetchedDays: uncachedDates.length,
          });
        } catch (error) {
          log.error('Error pre-fetching calendar events', error instanceof Error ? error : new Error(String(error)));
          for (const ds of uncachedDates) {
            if (!cachedEventsByDate.has(ds)) {
              cachedEventsByDate.set(ds, []);
            }
          }
        }
      }

      const allSlots: { date: string; slots: TimeSlot[] }[] = [];
      let currentDate = new Date(startDate);

      while (isBefore(currentDate, endDate) || currentDate.getTime() === startDate.getTime()) {
        const dayOfWeek = currentDate.getDay(); // 0-6
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // Check for date override
        const override = dateOverrides.find(
          (o) => format(o.date, 'yyyy-MM-dd') === dateStr
        );

        let daySlots: TimeSlot[] = [];

        if (override) {
          // Use override settings
          if (override.isAvailable && override.startTime && override.endTime) {
            daySlots = await generateSlotsForDay(
              currentDate,
              override.startTime,
              override.endTime,
              appointmentType,
              user,
              existingAppointments,
              user.timezone,
              cachedEventsByDate.get(dateStr) || []
            );
          }
          // If override is not available, daySlots stays empty
        } else {
          // Use regular availability
          const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);
          if (dayAvailability) {
            daySlots = await generateSlotsForDay(
              currentDate,
              dayAvailability.startTime,
              dayAvailability.endTime,
              appointmentType,
              user,
              existingAppointments,
              user.timezone,
              cachedEventsByDate.get(dateStr) || []
            );
          }
        }

        allSlots.push({
          date: dateStr,
          slots: daySlots,
        });

        currentDate = addDays(currentDate, 1);
      }

      // Cache single-day results
      if (isSingleDay && allSlots.length > 0) {
        const dateStr = format(startDate, 'yyyy-MM-dd');
        availabilityCache.setSlots(user.id, appointmentTypeId, dateStr, allSlots[0].slots);
      }

      return NextResponse.json({
        appointmentType: {
          id: appointmentType.id,
          name: appointmentType.name,
          duration: appointmentType.duration,
        },
        timezone: user.timezone,
        slots: allSlots,
        cached: false,
      });
    } catch (error) {
      log.error('Slot generation failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Failed to generate time slots', stage: 'slot_generation', ...(isDev && { details: error instanceof Error ? error.message : String(error) }) },
        { status: 500 }
      );
    }
}

/**
 * Generate time slots for a specific day - OPTIMIZED with batch calendar checking
 */
async function generateSlotsForDay(
  date: Date,
  startTime: string,
  endTime: string,
  appointmentType: any,
  user: any,
  existingAppointments: any[],
  timezone: string,
  calendarEvents: any[] = []
): Promise<TimeSlot[]> {
  const dateStr = format(date, 'yyyy-MM-dd');

  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  // Create dates in the user's timezone, then convert to UTC
  // We need to interpret the availability times (e.g., "09:00") as being in the user's timezone
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create a date with the wall-clock time we want
  const startWallClock = new Date(year, month, day, startHour, startMinute, 0, 0);
  const endWallClock = new Date(year, month, day, endHour, endMinute, 0, 0);

  // Convert from user's timezone to UTC - fromZonedTime interprets the date's
  // hour/minute values as being in the specified timezone and returns the UTC equivalent
  let currentSlotStart = fromZonedTime(startWallClock, timezone);
  const dayEnd = fromZonedTime(endWallClock, timezone);

  // First, generate all possible slots
  const allSlots: { start: Date; end: Date; bufferedStart: Date; bufferedEnd: Date }[] = [];
  let tempSlotStart = new Date(currentSlotStart);

  while (isBefore(tempSlotStart, dayEnd)) {
    const tempSlotEnd = addMinutes(tempSlotStart, appointmentType.duration);

    if (isAfter(tempSlotEnd, dayEnd)) {
      break;
    }

    // Apply buffers for conflict checking
    const bufferedStart = addMinutes(tempSlotStart, -appointmentType.bufferBefore);
    const bufferedEnd = addMinutes(tempSlotEnd, appointmentType.bufferAfter);

    allSlots.push({
      start: new Date(tempSlotStart),
      end: new Date(tempSlotEnd),
      bufferedStart,
      bufferedEnd,
    });

    tempSlotStart = addMinutes(tempSlotStart, appointmentType.duration);
  }

  // Batch check all slots against calendar events (pre-fetched by caller)
  const calendarConflicts = checkSlotsAgainstEvents(
    allSlots.map(s => ({ start: s.bufferedStart, end: s.bufferedEnd })),
    calendarEvents
  );

  // Now build the final slots array
  const slots: TimeSlot[] = allSlots.map((slot, index) => {
    // Check if this slot conflicts with existing appointments
    const hasAppointmentConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      // Apply buffers
      const bufferedAptStart = addMinutes(
        aptStart,
        -apt.appointmentType.bufferBefore
      );
      const bufferedAptEnd = addMinutes(aptEnd, apt.appointmentType.bufferAfter);

      // Check for overlap with buffered slot
      return (
        (slot.bufferedStart >= bufferedAptStart && slot.bufferedStart < bufferedAptEnd) ||
        (slot.bufferedEnd > bufferedAptStart && slot.bufferedEnd <= bufferedAptEnd) ||
        (slot.bufferedStart <= bufferedAptStart && slot.bufferedEnd >= bufferedAptEnd)
      );
    });

    const hasCalendarConflict = calendarConflicts[index];
    const isAvailable = !hasAppointmentConflict && !hasCalendarConflict;

    // Format times in local timezone for easy display using Intl
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const startLocal = timeFormatter.format(slot.start);
    const endLocal = timeFormatter.format(slot.end);

    return {
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      startLocal, // e.g., "10:30 AM"
      endLocal, // e.g., "11:00 AM"
      available: isAvailable,
    };
  });

  return slots;
}
