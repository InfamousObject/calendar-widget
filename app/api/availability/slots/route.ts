import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCalendarEvents, checkSlotsAgainstEvents } from '@/lib/google/calendar';
import { addDays, format, parse, startOfDay, endOfDay, addMinutes, isBefore, isAfter, parseISO } from 'date-fns';
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

// GET - Calculate available time slots
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const widgetId = searchParams.get('widgetId');
    const appointmentTypeId = searchParams.get('appointmentTypeId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Must provide either userId or widgetId
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (widgetId) {
      user = await prisma.user.findUnique({ where: { widgetId } });
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
    const appointmentType = await prisma.appointmentType.findFirst({
      where: {
        id: appointmentTypeId,
        userId: user.id,
        active: true,
      },
    });

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
      const cachedSlots = availabilityCache.getSlots(user.id, appointmentTypeId, dateStr);

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

    // Get user's availability settings
    const availability = await prisma.availability.findMany({
      where: {
        userId: user.id,
        isAvailable: true,
      },
    });

    // Get date overrides
    const dateOverrides = await prisma.dateOverride.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get existing appointments in this range
    const existingAppointments = await prisma.appointment.findMany({
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
    });

    // Generate slots for each day
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
            user.timezone
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
            user.timezone
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
    log.error('Error calculating available slots', { error });
    return NextResponse.json(
      { error: 'Failed to calculate available slots' },
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
  timezone: string
): Promise<TimeSlot[]> {
  const dateStr = format(date, 'yyyy-MM-dd');

  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentSlotStart = new Date(date);
  currentSlotStart.setHours(startHour, startMinute, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMinute, 0, 0);

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

  // Check cache for calendar events
  let calendarEvents = availabilityCache.getCalendarEvents(user.id, dateStr);

  if (!calendarEvents) {
    // Fetch calendar events for the ENTIRE day in ONE API call
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    try {
      calendarEvents = await getCalendarEvents(user.id, dayStart, dayEnd);
      // Cache for 15 minutes
      availabilityCache.setCalendarEvents(user.id, dateStr, calendarEvents);
      log.info('Fetched calendar events for slots', {
        eventCount: calendarEvents.length,
        date: dateStr
      });
    } catch (error) {
      log.error('Error fetching calendar events', { error, date: dateStr });
      calendarEvents = [];
    }
  } else {
    log.debug('Using cached calendar events for slots', { date: dateStr });
  }

  // Batch check all slots against calendar events
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
