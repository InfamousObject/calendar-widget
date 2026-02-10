import { google } from 'googleapis';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { log } from '@/lib/logger';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

// Initialize Redis client for OAuth state storage
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
    log.debug('[OAuth] Redis client initialized for state storage');
  } else {
    log.warn('[OAuth] Redis not configured - OAuth state storage disabled');
  }
} catch (error) {
  log.error('[OAuth] Error initializing Redis', error);
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  );
}

export async function getAuthUrl(userId: string) {
  const oauth2Client = getOAuth2Client();

  // Generate cryptographically secure state token to prevent CSRF
  const stateToken = crypto.randomBytes(32).toString('hex');

  // Store state → userId mapping in Redis with 10-minute expiry
  if (redis) {
    try {
      await redis.set(`oauth:state:${stateToken}`, userId, { ex: 600 }); // 10 minutes
      log.debug('[OAuth] State token generated and stored', {
        tokenLength: stateToken.length,
        expiresIn: 600
      });
    } catch (error) {
      log.error('[OAuth] Failed to store state token in Redis', error);
      throw new Error('Failed to initialize OAuth flow. Please try again.');
    }
  } else {
    log.error('[OAuth] Cannot generate auth URL - Redis not available');
    throw new Error('OAuth state storage unavailable. Please contact support.');
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: stateToken, // Use secure random token instead of userId
    prompt: 'consent', // Force consent to get refresh token
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export function getCalendarClient(accessToken: string, refreshToken: string, useAppCredentials = true) {
  const oauth2Client = useAppCredentials ? getOAuth2Client() : new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
