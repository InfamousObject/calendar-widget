import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { getCalendarClient } from '@/lib/google/oauth';
import { decrypt } from '@/lib/encryption';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      userId,
      checks: {},
      errors: [],
      warnings: [],
      info: [],
    };

    // Check 1: Environment variables
    diagnostics.checks.envVars = {
      googleClientId: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    };

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      diagnostics.errors.push(
        'Google OAuth credentials not configured in environment variables'
      );
      diagnostics.errors.push(
        'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local'
      );
    } else {
      diagnostics.info.push('Google OAuth credentials are configured');
    }

    // Check 2: User exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    diagnostics.checks.user = {
      exists: !!user,
      email: user?.email,
      name: user?.name,
    };

    if (!user) {
      diagnostics.errors.push('User not found in database');
      return NextResponse.json(diagnostics);
    }

    diagnostics.info.push(`User found: ${user.email}`);

    // Check 3: Calendar connection exists
    const connections = await prisma.calendarConnection.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        provider: true,
        source: true,
        email: true,
        emailIv: true,
        emailAuth: true,
        isPrimary: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    diagnostics.checks.connections = {
      count: connections.length,
      connections: connections.map((conn) => {
        let decryptedEmail = '***@***.***';
        try {
          decryptedEmail = decrypt(conn.email, conn.emailIv, conn.emailAuth);
        } catch (error) {
          log.error('[Calendar] Failed to decrypt email for connection', { error, connectionId: conn.id });
        }

        const isClerk = (conn as any).source === 'clerk';

        return {
          id: conn.id,
          provider: conn.provider,
          source: (conn as any).source || 'manual',
          email: decryptedEmail,
          isPrimary: conn.isPrimary,
          expiresAt: conn.expiresAt,
          isExpired: isClerk ? false : new Date() >= new Date(conn.expiresAt),
          needsReconnect: isClerk,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
        };
      }),
    };

    if (connections.length === 0) {
      diagnostics.errors.push('No calendar connections found');
      diagnostics.errors.push(
        'Please connect your Google Calendar from the dashboard'
      );
      return NextResponse.json(diagnostics);
    }

    diagnostics.info.push(`Found ${connections.length} calendar connection(s)`);

    // Flag Clerk connections as needing reconnection
    const clerkConnections = connections.filter((c) => (c as any).source === 'clerk');
    if (clerkConnections.length > 0) {
      diagnostics.warnings.push(
        `${clerkConnections.length} connection(s) use Clerk-managed tokens which are no longer supported. ` +
        'Please disconnect and reconnect via the manual OAuth flow from the calendar settings page.'
      );
    }

    // Check 4: Primary connection
    const primaryConnection = connections.find((c) => c.isPrimary);

    if (!primaryConnection) {
      diagnostics.warnings.push('No primary calendar connection found');
      diagnostics.info.push('Using first connection as fallback');
    } else {
      diagnostics.info.push(
        `Primary connection: ${primaryConnection.provider} (${primaryConnection.email})`
      );

      if ((primaryConnection as any).source === 'clerk') {
        diagnostics.errors.push(
          'Primary connection uses Clerk-managed tokens which are no longer supported. ' +
          'Please disconnect and reconnect via the manual OAuth flow.'
        );
      } else {
        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(primaryConnection.expiresAt);

        if (now >= expiresAt) {
          diagnostics.warnings.push(
            `Access token expired at ${expiresAt.toISOString()}`
          );
          diagnostics.info.push('Token will be refreshed automatically on next use');
        } else {
          const minutesUntilExpiry = Math.floor(
            (expiresAt.getTime() - now.getTime()) / 60000
          );
          diagnostics.info.push(
            `Access token valid for ${minutesUntilExpiry} more minutes`
          );
        }
      }
    }

    // Check 5: Test calendar API access (optional - only if user wants to test)
    const testApi = request.nextUrl.searchParams.get('testApi') === 'true';

    if (testApi && primaryConnection) {
      if ((primaryConnection as any).source === 'clerk') {
        diagnostics.checks.apiTest = {
          success: false,
          error: 'Clerk connections are no longer supported. Please reconnect via the manual OAuth flow.',
        };
        diagnostics.errors.push('Cannot test API with Clerk connection — please reconnect manually');
      } else {
        try {
          const conn = await prisma.calendarConnection.findFirst({
            where: {
              userId: user.id,
              isPrimary: true,
            },
          });

          if (conn) {
            const decryptedAccessToken = decrypt(conn.accessToken, conn.accessTokenIv, conn.accessTokenAuth);
            const decryptedRefreshToken = decrypt(conn.refreshToken, conn.refreshTokenIv, conn.refreshTokenAuth);
            const calendar = getCalendarClient(decryptedAccessToken, decryptedRefreshToken);

            const calendarList = await calendar.calendarList.list();

            diagnostics.checks.apiTest = {
              success: true,
              calendarsFound: calendarList.data.items?.length || 0,
              primaryCalendar: calendarList.data.items?.find((cal: any) => cal.primary)
                ?.summary,
            };

            diagnostics.info.push(
              `Successfully connected to Google Calendar API`
            );
          } else {
            diagnostics.warnings.push(
              'Could not retrieve connection for API test'
            );
          }
        } catch (error: any) {
          diagnostics.checks.apiTest = {
            success: false,
            error: error.message,
            code: error.code || error.status || undefined,
          };

          diagnostics.errors.push(`Calendar API test failed: ${error.message}`);

          if (error.message?.includes('invalid_grant')) {
            diagnostics.errors.push(
              'Access token is invalid - please reconnect your calendar'
            );
          }
        }
      }
    } else if (!testApi) {
      diagnostics.info.push(
        'Add ?testApi=true to URL to test actual API connection'
      );
    }

    // Summary
    diagnostics.summary = {
      status:
        diagnostics.errors.length === 0
          ? diagnostics.warnings.length === 0
            ? 'healthy'
            : 'warning'
          : 'error',
      errorCount: diagnostics.errors.length,
      warningCount: diagnostics.warnings.length,
      infoCount: diagnostics.info.length,
    };

    return NextResponse.json(diagnostics, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    log.error('[Calendar] Diagnostics error', error);
    return NextResponse.json(
      {
        error: 'Diagnostics failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
