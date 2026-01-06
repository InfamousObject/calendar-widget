import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, isCsrfEnabled } from '@/lib/csrf';
import { getClientIp } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

/**
 * Generate a CSRF token for the client
 * Token is tied to the client's IP address
 *
 * Public endpoint - no authentication required
 * Called before making state-changing requests (booking, forms, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if CSRF protection is enabled
    if (!isCsrfEnabled()) {
      log.warn('[CSRF] Protection disabled - Redis not configured');
      return NextResponse.json(
        { error: 'CSRF protection unavailable' },
        { status: 503 }
      );
    }

    // Get client IP as identifier
    const clientIp = getClientIp(request);

    if (!clientIp) {
      log.error('[CSRF] Unable to determine client IP');
      return NextResponse.json(
        { error: 'Unable to generate token' },
        { status: 400 }
      );
    }

    // Generate token
    const token = await generateCsrfToken(clientIp);

    log.info('[CSRF] Token issued', {
      ip: clientIp.substring(0, 10) + '...',
    });

    return NextResponse.json({
      token,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error) {
    log.error('[CSRF] Error generating token', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
