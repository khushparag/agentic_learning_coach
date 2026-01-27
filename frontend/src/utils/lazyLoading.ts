/**
 * Advanced lazy loading utilities for optimal performance
 */

import { performanceMonitor } from './performance'

export interface LazyLoadOptions {
  timeout?: number
  preload?: boolean
  retries?: number
}

/**
 * Route-based code splitting with preloading
 */
export class RoutePreloader {
  private preloadedRoutes = new Set<string>()
  private preloadPromises = new Map<string, Promise<void>>()

  /**
   * Preload a route component
   */
  preloadRoute(routeName: string, factory: () => Promise<any>): Promise<void> {
    if (this.preloadedRoutes.has(routeName)) {
      return Promise.resolve()
    }

    if (this.preloadPromises.has(routeName)) {
      return this.preloadPromises.get(routeName)!
    }

    const preloadPromise = factory()
      .then(() => {
        this.preloadedRoutes.add(routeName)
        this.preloadPromises.delete(routeName)
        performanceMonitor.recordCustomMetric('route-preload', 0, { route: routeName })
      })
      .catch(error => {
        this.preloadPromises.delete(routeName)
        performanceMonitor.recordCustomMetric('route-preload-error', 0, { 
          route: routeName, 
          error: error.message 
        })
        throw error
      })

    this.preloadPromises.set(routeName, preloadPromise)
    return preloadPromise
  }

  /**
   * Preload routes based on user behavior
   */
  preloadLikelyRoutes(currentRoute: string) {
    const routePreloadMap: Record<string, string[]> = {
      '/': ['/learning-path', '/exercises', '/tasks'],
      '/learning-path': ['/exercises', '/tasks'],
      '/exercises': ['/tasks', '/analytics'],
      '/tasks': ['/exercises', '/analytics'],
      '/social': ['/gamification', '/achievements'],
      '/analytics': ['/dashboard', '/achievements']
    }

    const routesToPreload = routePreloadMap[currentRoute] || []
    
    routesToPreload.forEach(route => {
      // Preload after a short delay to not interfere with current page
      setTimeout(() => {
        this.preloadRoute(route, () => import(`../pages${route}`))
      }, 1000)
    })
  }
}

export const routePreloader = new RoutePreloader()

/**
 * Progressive data loading utility
 */
export function createProgressiveLoader<T>(
  dataLoader: () => Promise<T>,
  options: LazyLoadOptions = {}
) {
  const { timeout = 10000, retries = 2 } = options
  let retryCount = 0

  const loadData = async (): Promise<T> => {
    const start = performance.now()
    
    try {
      const result = await Promise.race([
        dataLoader(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Data loading timed out after ${timeout}ms`))
          }, timeout)
        })
      ])

      const duration = performance.now() - start
      performanceMonitor.recordCustomMetric('progressive-data-load', duration, {
        success: true,
        retryCount
      })
      
      return result
    } catch (error) {
      if (retryCount < retries) {
        retryCount++
        performanceMonitor.recordCustomMetric('progressive-data-load-retry', retryCount)
        return loadData()
      }
      
      performanceMonitor.recordCustomMetric('progressive-data-load', performance.now() - start, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount
      })
      throw error
    }
  }

  return loadData
}

/**
 * Image preloading utility
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Intersection Observer utility for lazy loading
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

/**
 * Debounced function utility for performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttled function utility for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}