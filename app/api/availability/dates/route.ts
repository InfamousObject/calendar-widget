import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, format, startOfDay } from 'date-fns';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { log } from '@/lib/logger';

// GET - Get available dates (faster endpoint that doesn't calculate individual slots)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const widgetId = searchParams.get('widgetId');
    const appointmentTypeId = searchParams.get('appointmentTypeId');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '14');

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

    // Check cache first
    const cachedDates = availabilityCache.getDates(user.id, appointmentTypeId, daysAhead);
    if (cachedDates) {
      const appointmentType = await prisma.appointmentType.findFirst({
        where: { id: appointmentTypeId, userId: user.id, active: true },
        select: { id: true, name: true, duration: true },
      });

      return NextResponse.json({
        availableDates: cachedDates,
        timezone: user.timezone,
        appointmentType,
        cached: true,
      });
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

    // Get user's availability settings
    const availability = await prisma.availability.findMany({
      where: {
        userId: user.id,
        isAvailable: true,
      },
    });

    // Get date overrides
    const startDate = startOfDay(new Date());
    // Scan up to daysAhead*3 or 90 calendar days to find enough available dates
    const maxScanDays = Math.max(daysAhead * 3, 90);
    const scanEndDate = addDays(startDate, maxScanDays);

    const dateOverrides = await prisma.dateOverride.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: scanEndDate,
        },
      },
    });

    // Generate list of dates with availability
    // daysAhead = number of available dates to return (not calendar days)
    const availableDates: string[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= scanEndDate && availableDates.length < daysAhead) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // Check for date override
      const override = dateOverrides.find(
        (o) => format(o.date, 'yyyy-MM-dd') === dateStr
      );

      let hasAvailability = false;

      if (override) {
        hasAvailability = override.isAvailable && !!override.startTime && !!override.endTime;
      } else {
        // Check regular availability
        const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);
        hasAvailability = !!dayAvailability;
      }

      if (hasAvailability) {
        availableDates.push(dateStr);
      }

      currentDate = addDays(currentDate, 1);
    }

    // Cache the results
    availabilityCache.setDates(user.id, appointmentTypeId, daysAhead, availableDates);

    return NextResponse.json({
      availableDates,
      timezone: user.timezone,
      appointmentType: {
        id: appointmentType.id,
        name: appointmentType.name,
        duration: appointmentType.duration,
      },
      cached: false,
    });
  } catch (error) {
    log.error('Error fetching available dates', { error });
    return NextResponse.json(
      { error: 'Failed to fetch available dates' },
      { status: 500 }
    );
  }
}
