import { prisma } from '@/lib/prisma';
import { getCalendarClient, refreshAccessToken } from './oauth';
import { decrypt, encrypt } from '@/lib/encryption';
import { log } from '@/lib/logger';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import type { calendar_v3 } from 'googleapis';


// Initialize Redis client for distributed locking
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else {
    log.warn('[Calendar] Redis not configured - token refresh race condition possible');
  }
} catch (error) {
  log.error('[Calendar] Failed to initialize Redis', error);
}

/**
 * Retry wrapper with exponential backoff for Google Calendar API calls
 * Handles rate limiting (429), service unavailable (503), and transient errors (500)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const statusCode = error?.code || error?.status || error?.response?.status;

      // Determine if error is retryable
      const isRetryable =
        statusCode === 429 || // Rate limit exceeded
        statusCode === 503 || // Service unavailable
        statusCode === 500;   // Internal server error

      // If not retryable or last attempt, throw the error
      if (!isRetryable || attempt === maxRetries - 1) {
        log.error(`[Calendar] ${operationName} failed after ${attempt + 1} attempts`, {
          error: error?.message,
          statusCode,
          attempt: attempt + 1,
          maxRetries,
        });
        throw error;
      }

      // Calculate exponential backoff with jitter
      // Formula: min(baseDelay * 2^attempt + random(0-1000ms), 10000ms)
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        10000 // Max 10 seconds delay
      );

      log.warn(`[Calendar] ${operationName} failed, retrying...`, {
        error: error?.message,
        statusCode,
        attempt: attempt + 1,
        maxRetries,
        retryAfterMs: Math.round(exponentialDelay),
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, exponentialDelay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error(`${operationName} failed after ${maxRetries} retries`);
}

interface CreateEventParams {
  userId: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
  attendeeName?: string;
  enableGoogleMeet?: boolean; // Auto-generate Google Meet link
}

interface CreateEventResult {
  eventId?: string;
  meetingLink?: string; // Google Meet link if enabled
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
 * All connections use manual OAuth tokens with persistent refresh tokens
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

  // Legacy Clerk connections are no longer supported — users must reconnect manually
  if (connection.source === 'clerk') {
    log.warn('[Calendar] Clerk connection encountered, user must reconnect', { userId });
    throw new Error('Please reconnect your Google Calendar from the settings page');
  }

  // Handle manual OAuth tokens (source="manual" or legacy connections without source)
  // Decrypt tokens for use
  let decryptedAccessToken: string;
  let decryptedRefreshToken: string;

  try {
    decryptedAccessToken = decrypt(
      connection.accessToken,
      connection.accessTokenIv,
      connection.accessTokenAuth
    );
    decryptedRefreshToken = decrypt(
      connection.refreshToken,
      connection.refreshTokenIv,
      connection.refreshTokenAuth
    );
  } catch (error) {
    log.error('[Calendar] Failed to decrypt tokens', error);
    throw new Error('Failed to decrypt calendar tokens - please reconnect your calendar');
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.expiresAt);

  if (now >= expiresAt) {
    // Use distributed locking to prevent multiple concurrent token refreshes
    // Google invalidates old refresh tokens after use, so only one refresh should happen
    const lockKey = `calendar:refresh:${userId}`;
    const lockValue = crypto.randomBytes(16).toString('hex');
    let lockAcquired = false;

    try {
      if (redis) {
        // Try to acquire distributed lock (expires in 10 seconds)
        const acquired = await redis.set(lockKey, lockValue, {
          ex: 10, // 10 second lock expiry
          nx: true, // Only set if doesn't exist (atomic operation)
        });

        lockAcquired = acquired === 'OK';

        if (!lockAcquired) {
          // Another process is already refreshing the token
          // Wait briefly and recursively retry to get the refreshed connection
          log.info('[Calendar] Token refresh in progress by another request, waiting...', { userId });
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          return getValidConnection(userId); // Recursive retry
        }

        log.info('[Calendar] Acquired token refresh lock', { userId });
      } else {
        // Redis not available - proceed without locking (best effort)
        log.warn('[Calendar] No Redis available for token refresh locking', { userId });
      }

      // Double-check token expiry after acquiring lock (another request may have already refreshed)
      const freshConnection = await prisma.calendarConnection.findFirst({
        where: {
          userId,
          provider: 'google',
          isPrimary: true,
        },
      });

      if (freshConnection) {
        const freshExpiresAt = new Date(freshConnection.expiresAt);
        if (new Date() < freshExpiresAt) {
          // Token was already refreshed by another request
          log.info('[Calendar] Token already refreshed by another request', { userId });

          // Decrypt and return the fresh tokens
          const freshAccessToken = decrypt(
            freshConnection.accessToken,
            freshConnection.accessTokenIv,
            freshConnection.accessTokenAuth
          );
          const freshRefreshToken = decrypt(
            freshConnection.refreshToken,
            freshConnection.refreshTokenIv,
            freshConnection.refreshTokenAuth
          );

          return {
            ...freshConnection,
            accessToken: freshAccessToken,
            refreshToken: freshRefreshToken,
          };
        }
      }

      // Refresh the token while holding the lock
      log.info('[Calendar] Refreshing expired token', { userId });
      const newTokens = await refreshAccessToken(decryptedRefreshToken);

      if (!newTokens.access_token) {
        throw new Error('Failed to refresh access token');
      }

      const newExpiresAt = newTokens.expiry_date
        ? new Date(newTokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      // Encrypt new tokens before saving
      const {
        encrypted: newEncryptedAccessToken,
        iv: newAccessTokenIv,
        authTag: newAccessTokenAuth,
      } = encrypt(newTokens.access_token);

      const {
        encrypted: newEncryptedRefreshToken,
        iv: newRefreshTokenIv,
        authTag: newRefreshTokenAuth,
      } = encrypt(newTokens.refresh_token || decryptedRefreshToken);

      // Update connection with new encrypted tokens
      const updatedConnection = await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newEncryptedAccessToken,
          accessTokenIv: newAccessTokenIv,
          accessTokenAuth: newAccessTokenAuth,
          refreshToken: newEncryptedRefreshToken,
          refreshTokenIv: newRefreshTokenIv,
          refreshTokenAuth: newRefreshTokenAuth,
          expiresAt: newExpiresAt,
        },
      });

      log.info('[Calendar] Token refresh successful', { userId });

      // Return connection with decrypted tokens for immediate use
      return {
        ...updatedConnection,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || decryptedRefreshToken,
      };
    } catch (error) {
      log.error('[Calendar] Error refreshing token', error);
      throw new Error('Failed to refresh access token');
    } finally {
      // Always release the lock if we acquired it
      if (redis && lockAcquired) {
        try {
          // Only delete the lock if we still own it (check lock value)
          const currentValue = await redis.get(lockKey);
          if (currentValue === lockValue) {
            await redis.del(lockKey);
            log.info('[Calendar] Released token refresh lock', { userId });
          }
        } catch (error) {
          log.error('[Calendar] Failed to release lock', error);
          // Don't throw - lock will expire automatically
        }
      }
    }
  }

  // Return connection with decrypted tokens
  return {
    ...connection,
    accessToken: decryptedAccessToken,
    refreshToken: decryptedRefreshToken,
  };
}

/**
 * Create a calendar event
 * If enableGoogleMeet is true, automatically generates a Google Meet link
 */
export async function createCalendarEvent(params: CreateEventParams): Promise<CreateEventResult> {
  const connection = await getValidConnection(params.userId);

  const calendar = getCalendarClient(connection.accessToken, connection.refreshToken);

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

  // Add Google Meet video conferencing if enabled
  if (params.enableGoogleMeet) {
    // Generate a unique request ID for idempotency
    const requestId = crypto.randomBytes(16).toString('hex');

    event.conferenceData = {
      createRequest: {
        requestId,
        conferenceSolutionKey: {
          type: 'hangoutsMeet', // Google Meet
        },
      },
    };

    log.info('[Calendar] Creating event with Google Meet', {
      userId: params.userId,
      requestId,
    });
  }

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

  // Use retry logic to handle rate limits and transient errors
  const response = await withRetry(
    async () => calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to all attendees
      // Enable conference data creation (required for Google Meet)
      conferenceDataVersion: params.enableGoogleMeet ? 1 : undefined,
    }),
    'createCalendarEvent'
  );

  // Extract Google Meet link from response if available
  let meetingLink: string | undefined;
  if (response.data.conferenceData?.entryPoints) {
    const videoEntry = response.data.conferenceData.entryPoints.find(
      (entry) => entry.entryPointType === 'video'
    );
    meetingLink = videoEntry?.uri ?? undefined;

    if (meetingLink) {
      log.info('[Calendar] Google Meet link generated', {
        userId: params.userId,
        eventId: response.data.id,
      });
    }
  }

  return {
    eventId: response.data.id ?? undefined,
    meetingLink,
  };
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(params: UpdateEventParams) {
  const connection = await getValidConnection(params.userId);

  const calendar = getCalendarClient(connection.accessToken, connection.refreshToken);

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

  // Use retry logic to handle rate limits and transient errors
  await withRetry(
    async () => calendar.events.patch({
      calendarId: 'primary',
      eventId: params.eventId,
      requestBody: event,
      sendUpdates: 'all',
    }),
    'updateCalendarEvent'
  );
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
  const connection = await getValidConnection(userId);

  const calendar = getCalendarClient(connection.accessToken, connection.refreshToken);

  // Use retry logic to handle rate limits and transient errors
  await withRetry(
    async () => calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    }),
    'deleteCalendarEvent'
  );
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

    const calendar = getCalendarClient(connection.accessToken, connection.refreshToken);

    // Use retry logic to handle rate limits and transient errors
    const response = await withRetry(
      async () => calendar.events.list({
        calendarId: 'primary',
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      }),
      'checkForConflicts'
    );

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
    log.error('[Calendar] Error checking for conflicts', error);
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

    const calendar = getCalendarClient(connection.accessToken, connection.refreshToken);

    // Use retry logic to handle rate limits and transient errors
    const response = await withRetry(
      async () => calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      }),
      'getCalendarEvents'
    );

    return response.data.items || [];
  } catch (error) {
    log.error('[Calendar] Error fetching calendar events', error);
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

/**
 * Get calendar events for the account owner and all active team members.
 * This merges busy times from all connected calendars for the team.
 */
export async function getTeamCalendarEvents(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    // Get all user IDs to check (owner + active team members with calendars)
    const userIds = [accountId];

    // Get active team members with userIds
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        accountId,
        status: 'active',
        userId: { not: null },
      },
      select: { userId: true },
    });

    userIds.push(...teamMembers.map(m => m.userId!).filter(Boolean));

    // Fetch events from all calendars in parallel
    const allEventsPromises = userIds.map(async (userId) => {
      try {
        return await getCalendarEvents(userId, startDate, endDate);
      } catch (error) {
        // Log but don't fail - some users may not have calendars connected
        log.debug('[Calendar] Could not fetch events for team member', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    });

    const allEventsArrays = await Promise.all(allEventsPromises);

    // Merge all events into a single array
    const mergedEvents = allEventsArrays.flat();

    log.debug('[Calendar] Fetched team calendar events', {
      accountId,
      teamMemberCount: userIds.length,
      totalEvents: mergedEvents.length,
    });

    return mergedEvents;
  } catch (error) {
    log.error('[Calendar] Error fetching team calendar events', error);
    return [];
  }
}
