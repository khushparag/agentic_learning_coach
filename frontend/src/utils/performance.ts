/**
 * Performance monitoring utilities for the Learning Coach application
 * Implements Web Vitals tracking and custom performance metrics
 */

import React from 'react'

// Web Vitals types
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

export interface CustomMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, unknown>
}

// Custom interface for memory info (non-standard API)
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export interface PerformanceReport {
  webVitals: WebVitalsMetric[]
  customMetrics: CustomMetric[]
  resourceTiming: PerformanceResourceTiming[]
  navigationTiming: PerformanceNavigationTiming | null
  memoryUsage?: MemoryInfo
  timestamp: number
}

class PerformanceMonitor {
  private metrics: CustomMetric[] = []
  private webVitals: WebVitalsMetric[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeWebVitals()
    this.initializeResourceObserver()
    this.initializeLongTaskObserver()
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals() {
    // Dynamic import to avoid blocking main thread
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      const handleMetric = (metric: WebVitalsMetric) => {
        this.webVitals.push(metric)
        this.reportMetric(metric)
      }

      onCLS(handleMetric)
      onFID(handleMetric)
      onFCP(handleMetric)
      onLCP(handleMetric)
      onTTFB(handleMetric)
      onINP(handleMetric)
    }).catch(() => {
      console.warn('Web Vitals library not available')
    })
  }

  /**
   * Monitor resource loading performance
   */
  private initializeResourceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.trackResourceTiming(entry as PerformanceResourceTiming)
          }
        }
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.push(observer)
    }
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private initializeLongTaskObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordCustomMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name
            })
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['longtask'] })
        this.observers.push(observer)
      } catch (e) {
        // Long task observer not supported
      }
    }
  }

  /**
   * Track resource loading performance
   */
  private trackResourceTiming(entry: PerformanceResourceTiming) {
    const duration = entry.responseEnd - entry.startTime
    const size = entry.transferSize || 0

    // Track slow resources
    if (duration > 1000) { // > 1 second
      this.recordCustomMetric('slow-resource', duration, {
        name: entry.name,
        size,
        type: this.getResourceType(entry.name)
      })
    }

    // Track large resources
    if (size > 1024 * 1024) { // > 1MB
      this.recordCustomMetric('large-resource', size, {
        name: entry.name,
        duration,
        type: this.getResourceType(entry.name)
      })
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image'
    if (url.includes('/api/')) return 'api'
    return 'other'
  }

  /**
   * Record a custom performance metric
   */
  recordCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    }

    this.metrics.push(metric)
    this.reportMetric(metric)
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordCustomMetric(`function-${name}`, duration)
    return result
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    this.recordCustomMetric(`async-function-${name}`, duration)
    return result
  }

  /**
   * Mark the start of a performance measurement
   */
  markStart(name: string) {
    performance.mark(`${name}-start`)
  }

  /**
   * Mark the end of a performance measurement and record the duration
   */
  markEnd(name: string) {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    if (measure) {
      this.recordCustomMetric(name, measure.duration)
    }
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, renderTime: number) {
    this.recordCustomMetric(`component-render-${componentName}`, renderTime)
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, duration: number, success: boolean) {
    this.recordCustomMetric(`api-call-${endpoint}`, duration, {
      success,
      endpoint
    })
  }

  /**
   * Track route change performance
   */
  trackRouteChange(from: string, to: string, duration: number) {
    this.recordCustomMetric('route-change', duration, {
      from,
      to
    })
  }

  /**
   * Get current performance report
   */
  getPerformanceReport(): PerformanceReport {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    return {
      webVitals: [...this.webVitals],
      customMetrics: [...this.metrics],
      resourceTiming: resources,
      navigationTiming: navigation,
      memoryUsage: (performance as any).memory,
      timestamp: Date.now()
    }
  }

  /**
   * Report metric to analytics service
   */
  private reportMetric(metric: WebVitalsMetric | CustomMetric) {
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with your analytics service
      console.log('Performance metric:', metric)
    }
  }

  /**
   * Clean up observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  return {
    recordMetric: performanceMonitor.recordCustomMetric.bind(performanceMonitor),
    measureFunction: performanceMonitor.measureFunction.bind(performanceMonitor),
    measureAsyncFunction: performanceMonitor.measureAsyncFunction.bind(performanceMonitor),
    markStart: performanceMonitor.markStart.bind(performanceMonitor),
    markEnd: performanceMonitor.markEnd.bind(performanceMonitor),
    trackComponentRender: performanceMonitor.trackComponentRender.bind(performanceMonitor),
    trackApiCall: performanceMonitor.trackApiCall.bind(performanceMonitor),
    trackRouteChange: performanceMonitor.trackRouteChange.bind(performanceMonitor),
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor)
  }
}

/**
 * Higher-order component for measuring component render performance
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const renderStart = performance.now()
    
    React.useEffect(() => {
      const renderEnd = performance.now()
      performanceMonitor.trackComponentRender(componentName, renderEnd - renderStart)
    })

    return React.createElement(WrappedComponent, props)
  }
}

/**
 * Performance-aware lazy loading with timeout
 */
export function createPerformantLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  timeout: number = 10000
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    const start = performance.now()
    
    return Promise.race([
      factory().then(module => {
        const duration = performance.now() - start
        performanceMonitor.recordCustomMetric('lazy-load-success', duration)
        return module
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          performanceMonitor.recordCustomMetric('lazy-load-timeout', timeout)
          reject(new Error(`Component lazy loading timed out after ${timeout}ms`))
        }, timeout)
      })
    ])
  })
}