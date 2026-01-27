/**
 * Memory management utilities to prevent memory leaks and optimize performance
 */

import React from 'react'
import { performanceMonitor } from './performance'

export interface MemoryUsage {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  percentage: number
}

export interface ComponentMemoryInfo {
  componentName: string
  mountTime: number
  unmountTime?: number
  memoryAtMount: MemoryUsage
  memoryAtUnmount?: MemoryUsage
  memoryDelta?: number
}

class MemoryManager {
  private componentMemoryMap = new Map<string, ComponentMemoryInfo>()
  private intervalId: number | null = null
  private memoryThreshold = 0.8 // 80% of heap limit
  private cleanupCallbacks = new Set<() => void>()

  constructor() {
    this.startMemoryMonitoring()
    this.setupUnloadHandler()
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage {
    const memory = (performance as any).memory
    if (!memory) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        percentage: 0
      }
    }

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
    }
  }

  /**
   * Track component memory usage
   */
  trackComponentMount(componentName: string): string {
    const id = `${componentName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const memoryAtMount = this.getMemoryUsage()
    
    this.componentMemoryMap.set(id, {
      componentName,
      mountTime: Date.now(),
      memoryAtMount
    })

    performanceMonitor.recordCustomMetric('component-mount', 1, {
      component: componentName,
      memoryUsage: memoryAtMount.usedJSHeapSize
    })

    return id
  }

  /**
   * Track component unmount and calculate memory delta
   */
  trackComponentUnmount(id: string): void {
    const info = this.componentMemoryMap.get(id)
    if (!info) return

    const memoryAtUnmount = this.getMemoryUsage()
    const memoryDelta = memoryAtUnmount.usedJSHeapSize - info.memoryAtMount.usedJSHeapSize

    info.unmountTime = Date.now()
    info.memoryAtUnmount = memoryAtUnmount
    info.memoryDelta = memoryDelta

    performanceMonitor.recordCustomMetric('component-unmount', 1, {
      component: info.componentName,
      memoryDelta,
      lifespan: info.unmountTime - info.mountTime
    })

    // Clean up after tracking
    setTimeout(() => {
      this.componentMemoryMap.delete(id)
    }, 5000)
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return

    this.intervalId = window.setInterval(() => {
      const usage = this.getMemoryUsage()
      
      performanceMonitor.recordCustomMetric('memory-usage', usage.usedJSHeapSize, {
        percentage: usage.percentage,
        total: usage.totalJSHeapSize
      })

      // Warn if memory usage is high
      if (usage.percentage > this.memoryThreshold) {
        console.warn(`High memory usage detected: ${(usage.percentage * 100).toFixed(1)}%`)
        this.triggerGarbageCollection()
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Trigger garbage collection if available
   */
  private triggerGarbageCollection(): void {
    if ((window as any).gc) {
      (window as any).gc()
      performanceMonitor.recordCustomMetric('manual-gc-trigger', 1)
    }
  }

  /**
   * Register cleanup callback
   */
  registerCleanup(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback)
    
    return () => {
      this.cleanupCallbacks.delete(callback)
    }
  }

  /**
   * Setup unload handler for cleanup
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return

    const cleanup = () => {
      this.cleanupCallbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.warn('Cleanup callback failed:', error)
        }
      })
      
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
    }

    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('pagehide', cleanup)
  }

  /**
   * Get memory report for debugging
   */
  getMemoryReport(): {
    currentUsage: MemoryUsage
    componentCount: number
    topMemoryComponents: ComponentMemoryInfo[]
  } {
    const components = Array.from(this.componentMemoryMap.values())
    const topMemoryComponents = components
      .filter(c => c.memoryDelta !== undefined)
      .sort((a, b) => (b.memoryDelta || 0) - (a.memoryDelta || 0))
      .slice(0, 10)

    return {
      currentUsage: this.getMemoryUsage(),
      componentCount: components.length,
      topMemoryComponents
    }
  }
}

// Singleton instance
export const memoryManager = new MemoryManager()

/**
 * React hook for memory tracking
 */
export function useMemoryTracking(componentName: string): void {
  React.useEffect(() => {
    const id = memoryManager.trackComponentMount(componentName)
    
    return () => {
      memoryManager.trackComponentUnmount(id)
    }
  }, [componentName])
}

/**
 * Higher-order component for automatic memory tracking
 */
export function withMemoryTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  const MemoryTrackedComponent: React.FC<P> = (props) => {
    useMemoryTracking(displayName)
    return React.createElement(WrappedComponent, props)
  }

  MemoryTrackedComponent.displayName = `withMemoryTracking(${displayName})`
  
  return MemoryTrackedComponent
}

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | Element = window,
  options?: boolean | AddEventListenerOptions
): void {
  const savedHandler = React.useRef(handler)

  React.useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  React.useEffect(() => {
    const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K])
    
    element.addEventListener(eventName, eventListener, options)
    
    const cleanup = () => {
      element.removeEventListener(eventName, eventListener, options)
    }
    
    memoryManager.registerCleanup(cleanup)
    
    return cleanup
  }, [eventName, element, options])
}

/**
 * Hook for managing intervals with automatic cleanup
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = React.useRef(callback)

  React.useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)
    
    const cleanup = () => clearInterval(id)
    memoryManager.registerCleanup(cleanup)
    
    return cleanup
  }, [delay])
}

/**
 * Hook for managing timeouts with automatic cleanup
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = React.useRef(callback)

  React.useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    if (delay === null) return

    const id = setTimeout(() => savedCallback.current(), delay)
    
    const cleanup = () => clearTimeout(id)
    memoryManager.registerCleanup(cleanup)
    
    return cleanup
  }, [delay])
}

/**
 * Hook for managing async operations with cleanup
 */
export function useAsyncEffect(
  effect: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList
): void {
  React.useEffect(() => {
    const controller = new AbortController()
    
    effect(controller.signal).catch(error => {
      if (!controller.signal.aborted) {
        console.error('Async effect error:', error)
      }
    })
    
    const cleanup = () => controller.abort()
    memoryManager.registerCleanup(cleanup)
    
    return cleanup
  }, deps)
}

/**
 * Hook for debounced values to prevent excessive re-renders
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    const cleanup = () => clearTimeout(handler)
    memoryManager.registerCleanup(cleanup)
    
    return cleanup
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for throttled callbacks to limit execution frequency
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = React.useRef(Date.now())
  const timeoutRef = React.useRef<number>()

  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      const now = Date.now()
      const timeSinceLastRun = now - lastRun.current

      if (timeSinceLastRun >= delay) {
        callback(...args)
        lastRun.current = now
      } else {
        timeoutRef.current = window.setTimeout(() => {
          callback(...args)
          lastRun.current = Date.now()
        }, delay - timeSinceLastRun)
      }
    }) as T,
    [callback, delay]
  )
}

/**
 * Hook for managing WebSocket connections with cleanup
 */
export function useWebSocket(
  url: string,
  options: {
    onOpen?: (event: Event) => void
    onMessage?: (event: MessageEvent) => void
    onError?: (event: Event) => void
    onClose?: (event: CloseEvent) => void
    protocols?: string | string[]
  } = {}
): {
  socket: WebSocket | null
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void
  close: () => void
} {
  const [socket, setSocket] = React.useState<WebSocket | null>(null)
  const optionsRef = React.useRef(options)

  React.useEffect(() => {
    optionsRef.current = options
  }, [options])

  React.useEffect(() => {
    const ws = new WebSocket(url, options.protocols)
    
    ws.onopen = (event) => optionsRef.current.onOpen?.(event)
    ws.onmessage = (event) => optionsRef.current.onMessage?.(event)
    ws.onerror = (event) => optionsRef.current.onError?.(event)
    ws.onclose = (event) => optionsRef.current.onClose?.(event)
    
    setSocket(ws)
    
    const cleanup = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
    
    memoryManager.registerCleanup(cleanup)
    
    return cleanup
  }, [url])

  const send = React.useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(data)
    }
  }, [socket])

  const close = React.useCallback(() => {
    socket?.close()
  }, [socket])

  return { socket, send, close }
}

/**
 * Development helper to monitor memory usage
 */
if (import.meta.env.DEV) {
  (window as any).memoryManager = memoryManager
  
  // Log memory report every minute in development
  setInterval(() => {
    const report = memoryManager.getMemoryReport()
    console.log('Memory Report:', report)
  }, 60000)
}
