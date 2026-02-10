import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokensFromCode, getCalendarClient } from '@/lib/google/oauth';
import { encrypt } from '@/lib/encryption';
import { log } from '@/lib/logger';
import { Redis } from '@upstash/redis';

// Initialize Redis client for OAuth state validation
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (error) {
  log.error('[Calendar Callback] Error initializing Redis', error);
}

// GET - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // State token (not userId)
    const error = searchParams.get('error');

    if (error) {
      log.error('[Calendar] OAuth error', { error });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=access_denied`
      );
    }

    if (!code || !state) {
      log.warn('[Calendar] Missing code or state parameter');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=missing_params`
      );
    }

    // Validate state token and retrieve userId from Redis
    if (!redis) {
      log.error('[Calendar] Redis unavailable - cannot validate OAuth state');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=server_error`
      );
    }

    const userId = await redis.get<string>(`oauth:state:${state}`);

    if (!userId) {
      log.warn('[Calendar] Invalid or expired OAuth state token', {
        stateLength: state.length
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=invalid_state`
      );
    }

    // Delete state token to enforce one-time use
    try {
      await redis.del(`oauth:state:${state}`);
      log.debug('[Calendar] State token validated and deleted');
    } catch (error) {
      log.error('[Calendar] Failed to delete state token', error);
      // Continue anyway - token will expire in 10 minutes
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=user_not_found`
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=no_tokens`
      );
    }

    // Get user's email from Google
    const calendar = getCalendarClient(
      tokens.access_token,
      tokens.refresh_token
    );
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find((cal) => cal.primary);

    if (!primaryCalendar?.id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=no_calendar`
      );
    }

    // Check if connection already exists (can't search by encrypted email)
    const existingConnection = await prisma.calendarConnection.findFirst({
      where: {
        userId: user.id,
        provider: 'google',
        isPrimary: true,
      },
    });

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Encrypt tokens and email before saving (protect calendar access and PII)
    const {
      encrypted: encryptedEmail,
      iv: emailIv,
      authTag: emailAuth,
    } = encrypt(primaryCalendar.id);

    const {
      encrypted: encryptedAccessToken,
      iv: accessTokenIv,
      authTag: accessTokenAuth,
    } = encrypt(tokens.access_token);

    const {
      encrypted: encryptedRefreshToken,
      iv: refreshTokenIv,
      authTag: refreshTokenAuth,
    } = encrypt(tokens.refresh_token);

    if (existingConnection) {
      // Update existing connection with encrypted tokens and email
      await prisma.calendarConnection.update({
        where: { id: existingConnection.id },
        data: {
          email: encryptedEmail,
          emailIv,
          emailAuth,
          accessToken: encryptedAccessToken,
          accessTokenIv,
          accessTokenAuth,
          refreshToken: encryptedRefreshToken,
          refreshTokenIv,
          refreshTokenAuth,
          expiresAt,
        },
      });
    } else {
      // Create new connection with encrypted tokens and email
      await prisma.calendarConnection.create({
        data: {
          userId: user.id,
          provider: 'google',
          email: encryptedEmail,
          emailIv,
          emailAuth,
          accessToken: encryptedAccessToken,
          accessTokenIv,
          accessTokenAuth,
          refreshToken: encryptedRefreshToken,
          refreshTokenIv,
          refreshTokenAuth,
          expiresAt,
          isPrimary: true,
        },
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?success=true`
    );
  } catch (error) {
    log.error('[Calendar] Error handling OAuth callback', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?error=callback_failed`
    );
  }
}
