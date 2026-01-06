/**
 * hCaptcha verification helper
 *
 * Verifies CAPTCHA tokens from public forms to prevent bot spam.
 * Gracefully degrades in development when secret key is not configured.
 */

import { log } from '@/lib/logger';

interface HCaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  credit?: boolean;
  'error-codes'?: string[];
  score?: number;
  score_reason?: string[];
}

/**
 * Verify a hCaptcha token from the frontend
 *
 * @param token - The hCaptcha response token from the frontend widget
 * @param ip - The client's IP address (for additional verification)
 * @returns boolean - Whether the CAPTCHA verification was successful
 */
export async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  // Allow bypassing CAPTCHA in development if secret key is not configured
  if (!process.env.HCAPTCHA_SECRET_KEY) {
    log.warn('[CAPTCHA] Secret key not configured, skipping verification (development mode)');
    return true;
  }

  // Validate token exists
  if (!token || token.trim() === '') {
    log.warn('[CAPTCHA] Empty or missing token provided', { ip });
    return false;
  }

  try {
    log.debug('[CAPTCHA] Verifying token', {
      ip,
      tokenLength: token.length
    });

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: token,
        remoteip: ip
      }).toString()
    });

    if (!response.ok) {
      log.error('[CAPTCHA] hCaptcha API returned non-200 status', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }

    const data: HCaptchaVerifyResponse = await response.json();

    if (data.success) {
      log.info('[CAPTCHA] Verification successful', {
        ip,
        hostname: data.hostname,
        timestamp: data.challenge_ts
      });
      return true;
    } else {
      log.warn('[CAPTCHA] Verification failed', {
        ip,
        errors: data['error-codes']
      });
      return false;
    }
  } catch (error) {
    log.error('[CAPTCHA] Verification error', error);
    // Fail closed - if we can't verify, reject the request
    return false;
  }
}

/**
 * Check if CAPTCHA is enabled/configured
 * Used to conditionally show CAPTCHA widgets in the frontend
 */
export function isCaptchaEnabled(): boolean {
  return !!(process.env.HCAPTCHA_SECRET_KEY && process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
}
