/**
 * Availability cache with L1 (in-memory) and L2 (Redis) layers
 * L1: Fast in-process Map (lost on serverless cold start)
 * L2: Redis via Upstash (shared across all serverless instances)
 * Lookup: L1 -> L2 -> miss (caller fetches from Google Calendar API)
 */

import { log } from '@/lib/logger';
import { Redis } from '@upstash/redis';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Initialize Redis for L2 distributed cache
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    log.debug('[Cache] Redis L2 initialized');
  }
} catch (error) {
  log.error('[Cache] Failed to initialize Redis L2', error);
}

class AvailabilityCache {
  private cache: Map<string, CacheEntry<any>>;
  private TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private CALENDAR_TTL = 15 * 60 * 1000; // 15 minutes for calendar events
  private REDIS_SLOTS_TTL = 60 * 60; // 1 hour in seconds
  private REDIS_CALENDAR_TTL = 15 * 60; // 15 minutes in seconds
  private REDIS_PREFIX = 'avail:';

  constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  /**
   * Generate cache key for dates
   */
  private getDatesKey(userId: string, appointmentTypeId: string, daysAhead: number): string {
    return `dates:${userId}:${appointmentTypeId}:${daysAhead}`;
  }

  /**
   * Generate cache key for slots on a specific date
   */
  private getSlotsKey(userId: string, appointmentTypeId: string, date: string): string {
    return `slots:${userId}:${appointmentTypeId}:${date}`;
  }

  /**
   * Generate cache key for calendar events on a specific date
   */
  private getCalendarEventsKey(userId: string, date: string): string {
    return `calendar:${userId}:${date}`;
  }

  /**
   * Get cached available dates (L1 only - lightweight)
   */
  getDates(userId: string, appointmentTypeId: string, daysAhead: number): string[] | null {
    const key = this.getDatesKey(userId, appointmentTypeId, daysAhead);
    return this.getFromMemory(key);
  }

  /**
   * Set cached available dates (L1 only)
   */
  setDates(userId: string, appointmentTypeId: string, daysAhead: number, dates: string[]): void {
    const key = this.getDatesKey(userId, appointmentTypeId, daysAhead);
    this.setInMemory(key, dates, this.TTL);
  }

  /**
   * Get cached slots for a specific date (L1 -> L2)
   */
  async getSlots(userId: string, appointmentTypeId: string, date: string): Promise<any | null> {
    const key = this.getSlotsKey(userId, appointmentTypeId, date);

    // L1: Check in-memory
    const l1 = this.getFromMemory(key);
    if (l1 !== null) return l1;

    // L2: Check Redis
    if (redis) {
      try {
        const redisData = await redis.get<any>(`${this.REDIS_PREFIX}${key}`);
        if (redisData !== null && redisData !== undefined) {
          this.setInMemory(key, redisData, this.TTL);
          log.debug('[Cache] L2 hit (slots)', { key });
          return redisData;
        }
      } catch (error) {
        log.error('[Cache] Redis L2 read error (slots)', {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  }

  /**
   * Set cached slots for a specific date (L1 + L2)
   */
  setSlots(userId: string, appointmentTypeId: string, date: string, slots: any): void {
    const key = this.getSlotsKey(userId, appointmentTypeId, date);
    this.setInMemory(key, slots, this.TTL);
    this.setInRedis(key, slots, this.REDIS_SLOTS_TTL);
  }

  /**
   * Get cached calendar events for a specific date (L1 -> L2)
   */
  async getCalendarEvents(userId: string, date: string): Promise<any[] | null> {
    const key = this.getCalendarEventsKey(userId, date);

    // L1: Check in-memory
    const l1 = this.getFromMemory<any[]>(key);
    if (l1 !== null) return l1;

    // L2: Check Redis
    if (redis) {
      try {
        const redisData = await redis.get<any[]>(`${this.REDIS_PREFIX}${key}`);
        if (redisData !== null && redisData !== undefined) {
          this.setInMemory(key, redisData, this.CALENDAR_TTL);
          log.debug('[Cache] L2 hit (calendar)', { key });
          return redisData;
        }
      } catch (error) {
        log.error('[Cache] Redis L2 read error (calendar)', {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  }

  /**
   * Set cached calendar events for a specific date (L1 + L2)
   */
  setCalendarEvents(userId: string, date: string, events: any[]): void {
    const key = this.getCalendarEventsKey(userId, date);
    this.setInMemory(key, events, this.CALENDAR_TTL);
    this.setInRedis(key, events, this.REDIS_CALENDAR_TTL);
  }

  /**
   * Invalidate all cache for a specific user
   * Called when a new appointment is booked
   */
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Also invalidate Redis L2 keys (best effort, fire-and-forget)
    if (redis && keysToDelete.length > 0) {
      const redisKeys = keysToDelete.map(k => `${this.REDIS_PREFIX}${k}`);
      redis.del(...redisKeys).catch(error => {
        log.error('[Cache] Redis L2 invalidation error', {
          error: error instanceof Error ? error.message : String(error),
          userId,
        });
      });
    }

    log.debug('[Cache] Invalidated user cache entries', {
      count: keysToDelete.length,
      userId
    });
  }

  /**
   * Invalidate cache for a specific appointment type
   */
  invalidateAppointmentType(userId: string, appointmentTypeId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(userId) && key.includes(appointmentTypeId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (redis && keysToDelete.length > 0) {
      const redisKeys = keysToDelete.map(k => `${this.REDIS_PREFIX}${k}`);
      redis.del(...redisKeys).catch(error => {
        log.error('[Cache] Redis L2 invalidation error', {
          error: error instanceof Error ? error.message : String(error),
          appointmentTypeId,
        });
      });
    }

    log.debug('[Cache] Invalidated appointment type cache entries', {
      count: keysToDelete.length,
      appointmentTypeId
    });
  }

  /**
   * Read from L1 in-memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    log.debug('[Cache] L1 hit', { key });
    return entry.data as T;
  }

  /**
   * Write to L1 in-memory cache
   */
  private setInMemory<T>(key: string, data: T, ttl: number): void {
    const timestamp = Date.now();
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt: timestamp + ttl,
    });
  }

  /**
   * Write to L2 Redis cache (fire-and-forget)
   */
  private setInRedis<T>(key: string, data: T, ttlSeconds: number): void {
    if (!redis) return;

    redis.set(`${this.REDIS_PREFIX}${key}`, data, { ex: ttlSeconds }).catch(error => {
      log.error('[Cache] Redis L2 write error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  /**
   * Clean up expired L1 entries every 10 minutes
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        log.debug('[Cache] Cleanup completed', { removedCount: cleanedCount });
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      redisConnected: !!redis,
    };
  }

  /**
   * Clear all cache (for testing)
   */
  clear(): void {
    this.cache.clear();
    log.info('[Cache] Cleared all entries');
  }
}

// Singleton instance
export const availabilityCache = new AvailabilityCache();
