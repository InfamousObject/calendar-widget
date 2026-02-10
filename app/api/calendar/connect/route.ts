import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { getAuthUrl } from '@/lib/google/oauth';
import { log } from '@/lib/logger';

// GET - Initiate Google Calendar OAuth flow
export async function GET(request: NextRequest) {
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

    // Check if Google OAuth credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Google Calendar integration not configured' },
        { status: 500 }
      );
    }

    // Verify application URL is configured
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: 'Application URL not configured (NEXT_PUBLIC_APP_URL)' },
        { status: 500 }
      );
    }

    // Generate secure OAuth URL with CSRF protection
    const authUrl = await getAuthUrl(user.id);

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    log.error('[Calendar] Error initiating Google OAuth', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate Google Calendar connection',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
