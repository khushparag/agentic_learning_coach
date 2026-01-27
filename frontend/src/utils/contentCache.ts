/**
 * Content Cache Utility
 * Shared caching logic for content services
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ContentCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;

  constructor(ttlMs: number = 30 * 60 * 1000) { // Default 30 minutes
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export commonly used cache instances
export const contentGenerationCache = new ContentCache<any>(30 * 60 * 1000); // 30 minutes
export const lessonCache = new ContentCache<any>(30 * 60 * 1000); // 30 minutes
