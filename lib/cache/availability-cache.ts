/**
 * Simple in-memory cache for availability data
 * Caches available dates and time slots with 1-hour TTL
 * Automatically invalidates on new bookings
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class AvailabilityCache {
  private cache: Map<string, CacheEntry<any>>;
  private TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private CALENDAR_TTL = 15 * 60 * 1000; // 15 minutes for calendar events

  constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  /**
   * Generate cache key for dates
   */
  private getDatesKey(userId: string, appointmentTypeId: string): string {
    return `dates:${userId}:${appointmentTypeId}`;
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
   * Get cached available dates
   */
  getDates(userId: string, appointmentTypeId: string): string[] | null {
    const key = this.getDatesKey(userId, appointmentTypeId);
    return this.get(key);
  }

  /**
   * Set cached available dates
   */
  setDates(userId: string, appointmentTypeId: string, dates: string[]): void {
    const key = this.getDatesKey(userId, appointmentTypeId);
    this.set(key, dates);
  }

  /**
   * Get cached slots for a specific date
   */
  getSlots(userId: string, appointmentTypeId: string, date: string): any | null {
    const key = this.getSlotsKey(userId, appointmentTypeId, date);
    return this.get(key);
  }

  /**
   * Set cached slots for a specific date
   */
  setSlots(userId: string, appointmentTypeId: string, date: string, slots: any): void {
    const key = this.getSlotsKey(userId, appointmentTypeId, date);
    this.set(key, slots);
  }

  /**
   * Get cached calendar events for a specific date
   */
  getCalendarEvents(userId: string, date: string): any[] | null {
    const key = this.getCalendarEventsKey(userId, date);
    return this.get(key);
  }

  /**
   * Set cached calendar events for a specific date (15-minute TTL)
   */
  setCalendarEvents(userId: string, date: string, events: any[]): void {
    const key = this.getCalendarEventsKey(userId, date);
    this.setWithCustomTTL(key, events, this.CALENDAR_TTL);
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

    console.log(`[Cache] Invalidated ${keysToDelete.length} entries for user ${userId}`);
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

    console.log(`[Cache] Invalidated ${keysToDelete.length} entries for appointment type ${appointmentTypeId}`);
  }

  /**
   * Generic get method
   */
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`[Cache] Expired and removed: ${key}`);
      return null;
    }

    console.log(`[Cache] Hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Generic set method
   */
  private set<T>(key: string, data: T): void {
    this.setWithCustomTTL(key, data, this.TTL);
  }

  /**
   * Set with custom TTL
   */
  private setWithCustomTTL<T>(key: string, data: T, ttl: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });

    console.log(`[Cache] Set: ${key} (expires in ${ttl / 1000 / 60} minutes)`);
  }

  /**
   * Clean up expired entries every 10 minutes
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
        console.log(`[Cache] Cleanup: Removed ${cleanedCount} expired entries`);
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
    };
  }

  /**
   * Clear all cache (for testing)
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }
}

// Singleton instance
export const availabilityCache = new AvailabilityCache();
