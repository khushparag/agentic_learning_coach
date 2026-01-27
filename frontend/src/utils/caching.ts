/**
 * Advanced caching strategies for optimal performance
 */

import React from 'react'
import { performanceMonitor } from './performance'

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  size: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size in bytes
  maxEntries?: number // Maximum number of entries
  serialize?: (data: any) => string
  deserialize?: (data: string) => any
}

/**
 * Advanced in-memory cache with LRU eviction and size limits
 */
export class AdvancedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder = new Map<string, number>()
  private currentSize = 0
  private accessCounter = 0

  constructor(private options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 1000,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
      ...options
    }
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      performanceMonitor.recordCustomMetric('cache-miss', 1, { key })
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      performanceMonitor.recordCustomMetric('cache-expired', 1, { key })
      return null
    }

    // Update access order and hit count
    entry.hits++
    this.accessOrder.set(key, ++this.accessCounter)
    
    performanceMonitor.recordCustomMetric('cache-hit', 1, { key, hits: entry.hits })
    return entry.data
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl!
    const serialized = this.options.serialize!(data)
    const size = new Blob([serialized]).size

    // Check if single item exceeds max size
    if (size > this.options.maxSize!) {
      console.warn(`Cache item ${key} exceeds maximum size limit`)
      return
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key)
    }

    // Evict entries if necessary
    this.evictIfNecessary(size)

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size
    }

    this.cache.set(key, entry)
    this.accessOrder.set(key, ++this.accessCounter)
    this.currentSize += size

    performanceMonitor.recordCustomMetric('cache-set', 1, { 
      key, 
      size, 
      totalSize: this.currentSize 
    })
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.accessOrder.delete(key)
    this.currentSize -= entry.size

    performanceMonitor.recordCustomMetric('cache-delete', 1, { key })
    return true
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.currentSize = 0
    this.accessCounter = 0

    performanceMonitor.recordCustomMetric('cache-clear', 1)
  }

  /**
   * Evict entries if cache limits are exceeded
   */
  private evictIfNecessary(newItemSize: number): void {
    // Evict by size
    while (this.currentSize + newItemSize > this.options.maxSize!) {
      this.evictLRU()
    }

    // Evict by count
    while (this.cache.size >= this.options.maxEntries!) {
      this.evictLRU()
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let oldestKey = ''
    let oldestAccess = Infinity

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
      performanceMonitor.recordCustomMetric('cache-evict-lru', 1, { key: oldestKey })
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries())
    const totalHits = entries.reduce((sum, [, entry]) => sum + entry.hits, 0)
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0

    return {
      size: this.cache.size,
      totalSize: this.currentSize,
      maxSize: this.options.maxSize,
      maxEntries: this.options.maxEntries,
      totalHits,
      avgHits,
      hitRate: totalHits / (totalHits + this.getMetricValue('cache-miss')),
      entries: entries.map(([key, entry]) => ({
        key,
        size: entry.size,
        hits: entry.hits,
        age: Date.now() - entry.timestamp
      }))
    }
  }

  private getMetricValue(metricName: string): number {
    // This would integrate with your metrics system
    return 0
  }
}

/**
 * Persistent cache using localStorage/sessionStorage
 */
export class PersistentCache<T = any> {
  private memoryCache: AdvancedCache<T>

  constructor(
    private storageKey: string,
    private storage: Storage = localStorage,
    options: CacheOptions = {}
  ) {
    this.memoryCache = new AdvancedCache<T>(options)
    this.loadFromStorage()
  }

  get(key: string): T | null {
    // Try memory cache first
    let data = this.memoryCache.get(key)
    if (data !== null) return data

    // Try persistent storage
    try {
      const stored = this.storage.getItem(`${this.storageKey}:${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Check if expired
        if (Date.now() - parsed.timestamp <= parsed.ttl) {
          data = parsed.data as T
          // Add back to memory cache
          this.memoryCache.set(key, data!, parsed.ttl - (Date.now() - parsed.timestamp))
          return data
        } else {
          // Remove expired item
          this.storage.removeItem(`${this.storageKey}:${key}`)
        }
      }
    } catch (error) {
      console.warn('Failed to read from persistent cache:', error)
    }

    return null
  }

  set(key: string, data: T, ttl?: number): void {
    // Set in memory cache
    this.memoryCache.set(key, data, ttl)

    // Set in persistent storage
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 5 * 60 * 1000
      }
      this.storage.setItem(`${this.storageKey}:${key}`, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to write to persistent cache:', error)
    }
  }

  delete(key: string): boolean {
    this.memoryCache.delete(key)
    try {
      this.storage.removeItem(`${this.storageKey}:${key}`)
      return true
    } catch (error) {
      console.warn('Failed to delete from persistent cache:', error)
      return false
    }
  }

  clear(): void {
    this.memoryCache.clear()
    
    // Clear all items with our prefix
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key?.startsWith(`${this.storageKey}:`)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => this.storage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key?.startsWith(`${this.storageKey}:`)) {
          const cacheKey = key.replace(`${this.storageKey}:`, '')
          const stored = this.storage.getItem(key)
          
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Date.now() - parsed.timestamp <= parsed.ttl) {
              this.memoryCache.set(
                cacheKey, 
                parsed.data, 
                parsed.ttl - (Date.now() - parsed.timestamp)
              )
            } else {
              this.storage.removeItem(key)
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load from persistent cache:', error)
    }
  }
}

/**
 * API response cache with intelligent invalidation
 */
export class APICache {
  private cache = new AdvancedCache<any>()
  private dependencyMap = new Map<string, Set<string>>()

  constructor(options: CacheOptions = {}) {
    this.cache = new AdvancedCache({
      ttl: 5 * 60 * 1000, // 5 minutes for API responses
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 500,
      ...options
    })
  }

  /**
   * Cache API response with dependency tracking
   */
  setResponse(
    endpoint: string, 
    data: any, 
    dependencies: string[] = [],
    ttl?: number
  ): void {
    this.cache.set(endpoint, data, ttl)

    // Track dependencies
    dependencies.forEach(dep => {
      if (!this.dependencyMap.has(dep)) {
        this.dependencyMap.set(dep, new Set())
      }
      this.dependencyMap.get(dep)!.add(endpoint)
    })
  }

  /**
   * Get cached API response
   */
  getResponse(endpoint: string): any | null {
    return this.cache.get(endpoint)
  }

  /**
   * Invalidate cache entries by dependency
   */
  invalidateByDependency(dependency: string): void {
    const dependentEndpoints = this.dependencyMap.get(dependency)
    if (dependentEndpoints) {
      dependentEndpoints.forEach(endpoint => {
        this.cache.delete(endpoint)
      })
      this.dependencyMap.delete(dependency)
    }

    performanceMonitor.recordCustomMetric('cache-invalidate-dependency', 1, { dependency })
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): void {
    const keysToDelete: string[] = []
    
    for (const [key] of this.cache['cache']) {
      if (pattern.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    performanceMonitor.recordCustomMetric('cache-invalidate-pattern', keysToDelete.length)
  }

  /**
   * Preload API responses
   */
  async preloadResponses(endpoints: string[], fetcher: (endpoint: string) => Promise<any>): Promise<void> {
    const promises = endpoints.map(async endpoint => {
      if (!this.cache.get(endpoint)) {
        try {
          const data = await fetcher(endpoint)
          this.cache.set(endpoint, data)
        } catch (error) {
          console.warn(`Failed to preload ${endpoint}:`, error)
        }
      }
    })

    await Promise.allSettled(promises)
  }
}

// Global cache instances
export const memoryCache = new AdvancedCache()
export const persistentCache = new PersistentCache('learning-coach')
export const apiCache = new APICache()

/**
 * React hook for cached data fetching
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    dependencies?: string[]
    persistent?: boolean
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const cache = options.persistent ? persistentCache : memoryCache

  React.useEffect(() => {
    let isCancelled = false

    const loadData = async () => {
      try {
        // Try cache first
        const cached = cache.get(key)
        if (cached) {
          setData(cached)
          setIsLoading(false)
          return
        }

        // Fetch fresh data
        setIsLoading(true)
        const freshData = await performanceMonitor.measureAsyncFunction(
          `cached-fetch-${key}`,
          fetcher
        )

        if (!isCancelled) {
          cache.set(key, freshData, options.ttl)
          setData(freshData)
          setIsLoading(false)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isCancelled = true
    }
  }, [key, options.ttl])

  const invalidate = React.useCallback(() => {
    cache.delete(key)
    setData(null)
    setIsLoading(true)
  }, [key])

  return { data, isLoading, error, invalidate }
}