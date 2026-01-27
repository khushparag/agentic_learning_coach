/**
 * Content Cache Utility
 * 
 * Provides a shared, time-based caching mechanism for content services to reduce
 * redundant API calls and improve application performance. This utility was created
 * during codebase consolidation to eliminate duplicate caching logic across multiple
 * content services.
 * 
 * Key Features:
 * - Time-to-live (TTL) based expiration
 * - Automatic cleanup of expired entries
 * - Generic type support for different content types
 * - Memory-efficient with manual cleanup capabilities
 * 
 * Usage Pattern:
 * 1. Check cache for existing data
 * 2. If cache miss or expired, fetch from API
 * 3. Store fresh data in cache
 * 4. Return data to caller
 */

/**
 * Represents a single cache entry with its data and creation timestamp
 * @template T The type of data being cached
 */
export interface CacheEntry<T> {
  /** The actual cached data */
  data: T;
  /** Unix timestamp (milliseconds) when this entry was created */
  timestamp: number;
}

/**
 * Generic content cache implementation with TTL-based expiration
 * 
 * This class provides an in-memory cache that automatically expires entries
 * after a specified time-to-live period. It's designed to be lightweight
 * and efficient for caching API responses and computed content.
 * 
 * @template T The type of data being cached
 */
export class ContentCache<T> {
  /** Internal Map storing cache entries by key */
  private cache = new Map<string, CacheEntry<T>>();
  
  /** Time-to-live in milliseconds - how long entries remain valid */
  private readonly ttl: number;

  /**
   * Creates a new ContentCache instance
   * 
   * @param ttlMs Time-to-live in milliseconds (default: 30 minutes)
   *              This determines how long cached data remains valid before expiring.
   *              Choose based on data freshness requirements:
   *              - Static content: longer TTL (hours)
   *              - Dynamic content: shorter TTL (minutes)
   *              - Real-time data: very short TTL (seconds)
   */
  constructor(ttlMs: number = 30 * 60 * 1000) { // Default 30 minutes
    this.ttl = ttlMs;
  }

  /**
   * Retrieves data from cache if it exists and hasn't expired
   * 
   * This method implements the cache-aside pattern: it checks for valid data
   * and automatically removes expired entries to prevent memory bloat.
   * 
   * @param key Unique identifier for the cached data
   * @returns The cached data if valid, null if not found or expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    // Check if entry exists and is still within TTL
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.data;
    }
    
    // Entry is expired or doesn't exist - clean it up
    this.cache.delete(key);
    return null;
  }

  /**
   * Stores data in the cache with current timestamp
   * 
   * @param key Unique identifier for the data
   * @param data The data to cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, { 
      data, 
      timestamp: Date.now() 
    });
  }

  /**
   * Removes a specific entry from the cache
   * 
   * Useful for invalidating specific cached data when you know it's stale,
   * such as after a successful update operation.
   * 
   * @param key The key of the entry to remove
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Removes all entries from the cache
   * 
   * Use this when you need to invalidate all cached data, such as:
   * - User logout (clear user-specific data)
   * - Major application state changes
   * - Memory pressure situations
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns the current number of cached entries
   * 
   * Useful for monitoring cache usage and debugging cache behavior.
   * Note: This includes both valid and expired entries until cleanup() is called.
   * 
   * @returns Number of entries currently in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Manually removes all expired entries from the cache
   * 
   * While expired entries are automatically removed during get() operations,
   * this method allows for proactive cleanup to free memory. Consider calling
   * this periodically in long-running applications or when memory usage is a concern.
   * 
   * Implementation note: Uses for...of loop for safe iteration while deleting,
   * as Map.entries() provides a stable iterator even during modifications.
   */
  cleanup(): void {
    const now = Date.now();
    
    // Iterate through all entries and remove expired ones
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Pre-configured cache instances for common use cases
 * 
 * These shared instances prevent cache fragmentation and provide consistent
 * caching behavior across the application. The 30-minute TTL is chosen as
 * a balance between data freshness and performance for most content types.
 */

/** 
 * Cache for generated content (exercises, explanations, etc.)
 * 
 * Used by content generation services to cache AI-generated or computed content
 * that is expensive to recreate. The 30-minute TTL assumes generated content
 * doesn't change frequently but should be refreshed periodically.
 */
export const contentGenerationCache = new ContentCache<any>(30 * 60 * 1000); // 30 minutes

/** 
 * Cache for lesson data and structured learning content
 * 
 * Used by learning content services to cache lesson structures, progress data,
 * and other educational content. The 30-minute TTL balances performance with
 * the need to reflect content updates in a reasonable timeframe.
 */
export const lessonCache = new ContentCache<any>(30 * 60 * 1000); // 30 minutes
