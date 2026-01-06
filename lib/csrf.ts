import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { log } from '@/lib/logger';

// Initialize Redis client for CSRF token storage
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else {
    log.warn('[CSRF] Redis not configured - CSRF protection disabled');
  }
} catch (error) {
  log.error('[CSRF] Failed to initialize Redis', error);
}

/**
 * Generate a CSRF token and store it in Redis
 * Token is tied to a client identifier (IP address or session ID)
 *
 * @param identifier - Client IP address or session identifier
 * @returns CSRF token (hex string)
 */
export async function generateCsrfToken(identifier: string): Promise<string> {
  if (!redis) {
    log.error('[CSRF] Cannot generate token - Redis not available');
    throw new Error('CSRF protection unavailable');
  }

  // Generate cryptographically secure token (32 bytes = 64 hex characters)
  const token = crypto.randomBytes(32).toString('hex');

  // Store token with identifier in Redis (1 hour expiry)
  try {
    await redis.set(`csrf:${token}`, identifier, {
      ex: 3600, // 1 hour TTL
    });

    log.info('[CSRF] Token generated', {
      tokenPrefix: token.substring(0, 8) + '...',
      identifier: identifier.substring(0, 10) + '...', // Partial logging for security
    });

    return token;
  } catch (error) {
    log.error('[CSRF] Failed to store token', error);
    throw new Error('Failed to generate CSRF token');
  }
}

/**
 * Validate a CSRF token against the stored identifier
 * Token is deleted after validation (one-time use)
 *
 * @param token - CSRF token to validate
 * @param identifier - Client IP address or session identifier
 * @returns true if token is valid, false otherwise
 */
export async function validateCsrfToken(token: string, identifier: string): Promise<boolean> {
  if (!redis) {
    log.error('[CSRF] Cannot validate token - Redis not available');
    // Fail closed - reject request if Redis unavailable
    return false;
  }

  if (!token || token.length !== 64) {
    log.warn('[CSRF] Invalid token format', {
      tokenLength: token?.length,
    });
    return false;
  }

  try {
    // Retrieve stored identifier for this token
    const storedIdentifier = await redis.get<string>(`csrf:${token}`);

    if (!storedIdentifier) {
      log.warn('[CSRF] Token not found or expired', {
        tokenPrefix: token.substring(0, 8) + '...',
      });
      return false;
    }

    // Verify identifier matches
    if (storedIdentifier !== identifier) {
      log.warn('[CSRF] Token identifier mismatch', {
        tokenPrefix: token.substring(0, 8) + '...',
        expected: storedIdentifier.substring(0, 10) + '...',
        actual: identifier.substring(0, 10) + '...',
      });
      return false;
    }

    // Delete token to enforce one-time use
    await redis.del(`csrf:${token}`);

    log.info('[CSRF] Token validated and consumed', {
      tokenPrefix: token.substring(0, 8) + '...',
    });

    return true;
  } catch (error) {
    log.error('[CSRF] Token validation error', error);
    // Fail closed - reject on error
    return false;
  }
}

/**
 * Check if CSRF protection is enabled
 * @returns true if Redis is available for CSRF token storage
 */
export function isCsrfEnabled(): boolean {
  return redis !== null;
}
