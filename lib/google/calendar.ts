import { prisma } from '@/lib/prisma';
import { getCalendarClient, refreshAccessToken } from './oauth';
import type { calendar_v3 } from 'googleapis';

interface CreateEventParams {
  userId: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
  attendeeName?: string;
}

interface UpdateEventParams {
  userId: string;
  eventId: string;
  summary?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Get user's primary calendar connection with valid tokens
 */
async function getValidConnection(userId: string) {
  const connection = await prisma.calendarConnection.findFirst({
    where: {
      userId,
      provider: 'google',
      isPrimary: true,
    },
  });

  if (!connection) {
    throw new Error('No Google Calendar connection found');
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.expiresAt);

  if (now >= expiresAt) {
    // Refresh the token
    try {
      const newTokens = await refreshAccessToken(connection.refreshToken);

      if (!newTokens.access_token) {
        throw new Error('Failed to refresh access token');
      }

      const newExpiresAt = newTokens.expiry_date
        ? new Date(newTokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      // Update connection with new tokens
      const updatedConnection = await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || connection.refreshToken,
          expiresAt: newExpiresAt,
        },
      });

      return updatedConnection;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return connection;
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(params: CreateEventParams) {
  const connection = await getValidConnection(params.userId);

  const calendar = getCalendarClient(
    connection.accessToken,
    connection.refreshToken
  );

  // Get user email for notification
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true },
  });

  const event: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: 'UTC',
    },
    // Add email reminder for the business owner
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 0 }, // Immediate email notification
        { method: 'popup', minutes: 30 }, // 30 min before popup
      ],
    },
  };

  // Add both the visitor and the business owner as attendees
  const attendees = [];

  // Add business owner (will receive notification about new booking)
  if (user?.email) {
    attendees.push({
      email: user.email,
      displayName: user.name || undefined,
      organizer: true, // Mark as organizer
      responseStatus: 'accepted', // Auto-accept for the owner
    });
  }

  // Add visitor (customer booking the appointment)
  if (params.attendeeEmail) {
    attendees.push({
      email: params.attendeeEmail,
      displayName: params.attendeeName,
      responseStatus: 'accepted', // Auto-accept for the visitor
    });
  }

  if (attendees.length > 0) {
    event.attendees = attendees;
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    sendUpdates: 'all', // Send email notifications to all attendees
  });

  return response.data.id;
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(params: UpdateEventParams) {
  const connection = await getValidConnection(params.userId);

  const calendar = getCalendarClient(
    connection.accessToken,
    connection.refreshToken
  );

  const event: calendar_v3.Schema$Event = {};

  if (params.summary) event.summary = params.summary;
  if (params.description) event.description = params.description;
  if (params.startTime) {
    event.start = {
      dateTime: params.startTime.toISOString(),
      timeZone: 'UTC',
    };
  }
  if (params.endTime) {
    event.end = {
      dateTime: params.endTime.toISOString(),
      timeZone: 'UTC',
    };
  }

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: params.eventId,
    requestBody: event,
    sendUpdates: 'all',
  });
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
  const connection = await getValidConnection(userId);

  const calendar = getCalendarClient(
    connection.accessToken,
    connection.refreshToken
  );

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
  });
}

/**
 * Check for conflicts in user's calendar
 * Returns true if there are any events overlapping with the given time range
 */
export async function checkForConflicts(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const connection = await getValidConnection(userId);

    const calendar = getCalendarClient(
      connection.accessToken,
      connection.refreshToken
    );

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Filter out declined events and check for conflicts
    const events = response.data.items || [];
    const activeEvents = events.filter(
      (event) =>
        event.status !== 'cancelled' &&
        event.start?.dateTime &&
        event.end?.dateTime
    );

    return activeEvents.length > 0;
  } catch (error) {
    console.error('Error checking for conflicts:', error);
    // If calendar is not connected or error occurs, don't block bookings
    return false;
  }
}

/**
 * Get all events in a date range
 */
export async function getCalendarEvents(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const connection = await getValidConnection(userId);

    const calendar = getCalendarClient(
      connection.accessToken,
      connection.refreshToken
    );

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

/**
 * Batch check if time slots conflict with calendar events
 * Much faster than checking each slot individually
 */
export function checkSlotsAgainstEvents(
  slots: { start: Date; end: Date }[],
  calendarEvents: any[]
): boolean[] {
  // Filter out cancelled events and events without times
  const activeEvents = calendarEvents.filter(
    (event) =>
      event.status !== 'cancelled' &&
      event.start?.dateTime &&
      event.end?.dateTime
  );

  // Check each slot against all events
  return slots.map((slot) => {
    const hasConflict = activeEvents.some((event) => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      // Check for overlap
      return (
        (slot.start >= eventStart && slot.start < eventEnd) ||
        (slot.end > eventStart && slot.end <= eventEnd) ||
        (slot.start <= eventStart && slot.end >= eventEnd)
      );
    });

    return hasConflict;
  });
}
