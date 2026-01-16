import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { decrypt } from '@/lib/encryption';
import {
  getClerkGoogleToken,
  hasCalendarScopes,
  userHasGoogleConnection,
} from '@/lib/clerk/oauth-tokens';

export interface CalendarStatusResponse {
  connected: boolean;
  source?: 'clerk' | 'manual';
  email?: string;
  hasGoogleSignIn: boolean;
  hasCalendarScopes: boolean;
  canAutoConnect: boolean;
}

/**
 * GET - Get calendar connection status
 * Returns information about the user's calendar connection and auto-connect eligibility
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Google sign-in via Clerk
    const hasGoogleSignIn = await userHasGoogleConnection(userId);

    // Check if user has calendar scopes in their Clerk token
    let clerkHasCalendarScopes = false;
    if (hasGoogleSignIn) {
      const clerkToken = await getClerkGoogleToken(userId);
      if (clerkToken) {
        clerkHasCalendarScopes = hasCalendarScopes(clerkToken.scopes);
      }
    }

    // Check for existing calendar connection
    const connection = await prisma.calendarConnection.findFirst({
      where: {
        userId,
        provider: 'google',
        isPrimary: true,
      },
    });

    if (!connection) {
      // No connection exists
      return NextResponse.json<CalendarStatusResponse>({
        connected: false,
        hasGoogleSignIn,
        hasCalendarScopes: clerkHasCalendarScopes,
        canAutoConnect: hasGoogleSignIn && clerkHasCalendarScopes,
      });
    }

    // Connection exists - decrypt email for display
    let email: string | undefined;
    try {
      if (connection.email && connection.emailIv && connection.emailAuth) {
        email = decrypt(connection.email, connection.emailIv, connection.emailAuth);
      }
    } catch {
      // If decryption fails, leave email undefined
      log.warn('[CalendarStatus] Failed to decrypt email', { userId });
    }

    // Determine source (default to "manual" for legacy connections)
    const source = (connection.source === 'clerk' ? 'clerk' : 'manual') as 'clerk' | 'manual';

    return NextResponse.json<CalendarStatusResponse>({
      connected: true,
      source,
      email,
      hasGoogleSignIn,
      hasCalendarScopes: clerkHasCalendarScopes,
      canAutoConnect: hasGoogleSignIn && clerkHasCalendarScopes && source !== 'clerk',
    });
  } catch (error) {
    log.error('[CalendarStatus] Error getting status', error);
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}
