import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { decrypt } from '@/lib/encryption';

export interface CalendarStatusResponse {
  connected: boolean;
  source?: 'clerk' | 'manual';
  email?: string;
  hasGoogleSignIn: boolean;
  hasCalendarScopes: boolean;
}

/**
 * GET - Get calendar connection status
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json<CalendarStatusResponse>({
        connected: false,
        hasGoogleSignIn: false,
        hasCalendarScopes: false,
      });
    }

    // Connection exists - decrypt email for display
    let email: string | undefined;
    try {
      if (connection.email && connection.emailIv && connection.emailAuth) {
        email = decrypt(connection.email, connection.emailIv, connection.emailAuth);
      }
    } catch {
      log.warn('[CalendarStatus] Failed to decrypt email', { userId });
    }

    // Determine source (default to "manual" for legacy connections)
    const source = (connection.source === 'clerk' ? 'clerk' : 'manual') as 'clerk' | 'manual';

    return NextResponse.json<CalendarStatusResponse>({
      connected: true,
      source,
      email,
      hasGoogleSignIn: false,
      hasCalendarScopes: false,
    });
  } catch (error) {
    log.error('[CalendarStatus] Error getting status', error);
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}
