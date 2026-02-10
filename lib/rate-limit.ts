import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { log } from '@/lib/logger';

// In-memory storage for rate limiting when Redis is unavailable
// This is a per-instance fallback and will not work across multiple servers
const inMemoryLimits = new Map<string, { count: number; reset: number }>();

// Initialize Redis client
// For development without Upstash, this will gracefully fail
// In production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis | null = null;

try {
  log.debug('[Rate Limit] Checking environment variables', {
    hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
  });

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    log.debug('[Rate Limit] Initializing Redis client');
    redis = Redis.fromEnv();
    log.info('[Rate Limit] Redis client initialized successfully');
  } else {
    log.warn('[Rate Limit] Environment variables not set - rate limiting disabled');
  }
} catch (error) {
  log.error('[Rate Limit] Error initializing Redis', error);
  log.warn('[Rate Limit] Rate limiting disabled due to error');
}

// Rate limit configurations for different endpoints
// These are used by both Redis-based and in-memory rate limiters
const rateLimitConfigs = {
  booking: { maxRequests: 10, windowSeconds: 3600 }, // 10 requests per hour
  formSubmission: { maxRequests: 100, windowSeconds: 3600 }, // 100 requests per hour
  chatbot: { maxRequests: 30, windowSeconds: 3600 }, // 30 messages per hour
  availability: { maxRequests: 300, windowSeconds: 3600 }, // 300 requests per hour
  cancellation: { maxRequests: 5, windowSeconds: 3600 }, // 5 requests per hour
  widget: { maxRequests: 100, windowSeconds: 3600 }, // 100 requests per hour
  support: { maxRequests: 5, windowSeconds: 3600 }, // 5 tickets per hour
} as const;

// Create rate limiters for different endpoints
export const rateLimiters = redis ? {
  // Booking endpoint - 10 requests per hour per IP
  booking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:booking',
  }),

  // Form submission - 100 requests per hour per IP
  formSubmission: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'),
    analytics: true,
    prefix: 'ratelimit:form',
  }),

  // Chatbot - 30 messages per hour per IP (expensive API calls)
  chatbot: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    analytics: true,
    prefix: 'ratelimit:chatbot',
  }),

  // Availability slots - 300 requests per hour per IP
  availability: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 h'),
    analytics: true,
    prefix: 'ratelimit:availability',
  }),

  // Cancellation - 5 requests per hour per IP (prevent abuse)
  cancellation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:cancel',
  }),

  // Widget endpoint - 100 requests per hour per IP (prevent enumeration)
  widget: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'),
    analytics: true,
    prefix: 'ratelimit:widget',
  }),

  // Support tickets - 5 per hour per user (hits Anthropic API)
  support: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:support',
  }),
} : null;

/**
 * Check rate limit for a specific endpoint
 * @param type - Type of rate limiter to use
 * @param identifier - Usually the IP address
 * @returns Rate limit result with success status
 */
export async function checkRateLimit(
  type: keyof NonNullable<typeof rateLimiters>,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If Redis is not available, use in-memory fallback
  if (!redis) {
    log.warn('[Rate Limit] Redis unavailable, using in-memory fallback');

    // Get configuration for this rate limit type
    const config = rateLimitConfigs[type];

    // Create unique key for this action and identifier
    const key = `${type}:${identifier}`;
    const now = Date.now();
    const entry = inMemoryLimits.get(key);

    // If no entry exists or the window has expired, create new entry
    if (!entry || now > entry.reset) {
      const resetTime = now + config.windowSeconds * 1000;
      inMemoryLimits.set(key, {
        count: 1,
        reset: resetTime,
      });

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: resetTime,
      };
    }

    // Window is still active, increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: entry.reset,
      };
    }

    // Update entry with new count
    inMemoryLimits.set(key, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      reset: entry.reset,
    };
  }

  // Redis is available, use Upstash rate limiter
  const ratelimiter = rateLimiters![type];
  const result = await ratelimiter.limit(identifier);

  return result;
}

/**
 * Clean up expired entries from in-memory rate limit storage
 * This is optional and helps prevent memory leaks when using in-memory fallback
 * Call this periodically (e.g., every 10 minutes) if using in-memory rate limiting long-term
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, entry] of inMemoryLimits.entries()) {
    if (now > entry.reset) {
      inMemoryLimits.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    log.debug('[Rate Limit] Cleaned up expired entries', {
      count: cleanedCount,
      remaining: inMemoryLimits.size,
    });
  }
}

// Optional: Auto-cleanup every 10 minutes when using in-memory fallback
if (!redis && typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 10 * 60 * 1000); // 10 minutes
  log.info('[Rate Limit] Auto-cleanup scheduled for in-memory fallback');
}

/**
 * Get client IP address from request
 * @param request - Next.js request object
 * @returns IP address string
 */
export function getClientIp(request: Request): string {
  // Try various headers that may contain the real IP
  const headers = request.headers;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback for development
  return '127.0.0.1';
}
