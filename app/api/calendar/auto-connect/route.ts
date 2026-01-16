import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { encrypt } from '@/lib/encryption';
import {
  getClerkGoogleToken,
  hasCalendarScopes,
  userHasGoogleConnection,
  getClerkGoogleEmail,
} from '@/lib/clerk/oauth-tokens';

/**
 * POST - Auto-connect Google Calendar using Clerk OAuth tokens
 * For users who signed up with Google and have calendar scopes granted
 */
export async function POST() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a Google connection in Clerk
    const hasGoogle = await userHasGoogleConnection(userId);
    if (!hasGoogle) {
      return NextResponse.json(
        {
          error: 'No Google account linked',
          message: 'Please sign in with Google or link a Google account to use auto-connect',
        },
        { status: 400 }
      );
    }

    // Get the OAuth token from Clerk
    const clerkToken = await getClerkGoogleToken(userId);

    if (!clerkToken) {
      return NextResponse.json(
        {
          error: 'Token unavailable',
          message: 'Could not retrieve Google OAuth token from Clerk',
        },
        { status: 400 }
      );
    }

    // Check if calendar scopes are present
    if (!hasCalendarScopes(clerkToken.scopes)) {
      return NextResponse.json(
        {
          error: 'Missing calendar scopes',
          message: 'Your Google account does not have calendar access permissions. Please use the manual connection flow.',
          scopes: clerkToken.scopes,
          requiredScopes: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
          ],
        },
        { status: 400 }
      );
    }

    // Get the Google email from Clerk
    const googleEmail = await getClerkGoogleEmail(userId);
    if (!googleEmail) {
      return NextResponse.json(
        {
          error: 'Email unavailable',
          message: 'Could not retrieve Google email from Clerk',
        },
        { status: 400 }
      );
    }

    // Check for existing calendar connection
    const existingConnection = await prisma.calendarConnection.findFirst({
      where: {
        userId,
        provider: 'google',
        isPrimary: true,
      },
    });

    if (existingConnection) {
      // Update existing connection to use Clerk tokens
      // Encrypt the email for storage
      const { encrypted: encryptedEmail, iv: emailIv, authTag: emailAuth } = encrypt(googleEmail);

      // For Clerk-managed tokens, we store placeholder values for tokens
      // The actual token is fetched from Clerk at runtime
      const placeholderToken = 'clerk-managed';
      const { encrypted: encryptedToken, iv: tokenIv, authTag: tokenAuth } = encrypt(placeholderToken);

      await prisma.calendarConnection.update({
        where: { id: existingConnection.id },
        data: {
          source: 'clerk',
          email: encryptedEmail,
          emailIv,
          emailAuth,
          accessToken: encryptedToken,
          accessTokenIv: tokenIv,
          accessTokenAuth: tokenAuth,
          refreshToken: encryptedToken,
          refreshTokenIv: tokenIv,
          refreshTokenAuth: tokenAuth,
          // Set expiry far in the future since Clerk handles refresh
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      log.info('[Calendar] Updated existing connection to Clerk-managed', { userId });

      return NextResponse.json({
        success: true,
        message: 'Calendar connection updated to use your Google sign-in',
        source: 'clerk',
      });
    }

    // Create new Clerk-managed calendar connection
    const { encrypted: encryptedEmail, iv: emailIv, authTag: emailAuth } = encrypt(googleEmail);
    const placeholderToken = 'clerk-managed';
    const { encrypted: encryptedToken, iv: tokenIv, authTag: tokenAuth } = encrypt(placeholderToken);

    await prisma.calendarConnection.create({
      data: {
        userId,
        provider: 'google',
        source: 'clerk',
        email: encryptedEmail,
        emailIv,
        emailAuth,
        accessToken: encryptedToken,
        accessTokenIv: tokenIv,
        accessTokenAuth: tokenAuth,
        refreshToken: encryptedToken,
        refreshTokenIv: tokenIv,
        refreshTokenAuth: tokenAuth,
        // Set expiry far in the future since Clerk handles refresh
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPrimary: true,
      },
    });

    log.info('[Calendar] Created Clerk-managed calendar connection', { userId });

    return NextResponse.json({
      success: true,
      message: 'Google Calendar connected using your Google sign-in',
      source: 'clerk',
    });
  } catch (error) {
    log.error('[Calendar] Error in auto-connect', error);
    return NextResponse.json(
      { error: 'Failed to auto-connect Google Calendar' },
      { status: 500 }
    );
  }
}
