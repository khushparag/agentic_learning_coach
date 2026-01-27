import { useEffect, useRef, useCallback, useState } from 'react'

// Touch gesture types
export interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

export interface PinchGesture {
  scale: number
  center: TouchPoint
}

export interface TapGesture {
  point: TouchPoint
  tapCount: number
}

// Touch gesture configuration
export interface GestureConfig {
  swipeThreshold?: number // Minimum distance for swipe
  swipeVelocityThreshold?: number // Minimum velocity for swipe
  tapTimeout?: number // Maximum time for tap
  doubleTapTimeout?: number // Maximum time between taps for double tap
  longPressTimeout?: number // Minimum time for long press
  pinchThreshold?: number // Minimum scale change for pinch
}

const defaultConfig: Required<GestureConfig> = {
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  tapTimeout: 200,
  doubleTapTimeout: 300,
  longPressTimeout: 500,
  pinchThreshold: 0.1,
}

// Touch gesture handlers
export interface GestureHandlers {
  onSwipe?: (gesture: SwipeGesture) => void
  onTap?: (gesture: TapGesture) => void
  onDoubleTap?: (gesture: TapGesture) => void
  onLongPress?: (point: TouchPoint) => void
  onPinch?: (gesture: PinchGesture) => void
  onPanStart?: (point: TouchPoint) => void
  onPanMove?: (point: TouchPoint, delta: TouchPoint) => void
  onPanEnd?: (point: TouchPoint) => void
}

// Utility functions
function getTouchPoint(touch: Touch): TouchPoint {
  return {
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now(),
  }
}

function getDistance(point1: TouchPoint, point2: TouchPoint): number {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getDirection(start: TouchPoint, end: TouchPoint): SwipeGesture['direction'] {
  const dx = end.x - start.x
  const dy = end.y - start.y
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  } else {
    return dy > 0 ? 'down' : 'up'
  }
}

function getVelocity(distance: number, duration: number): number {
  return duration > 0 ? distance / duration : 0
}

function getCenter(touch1: Touch, touch2: Touch): TouchPoint {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
    timestamp: Date.now(),
  }
}

function getPinchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// Main touch gesture hook
export function useTouchGestures(
  handlers: GestureHandlers,
  config: GestureConfig = {}
) {
  const configRef = useRef({ ...defaultConfig, ...config })
  const stateRef = useRef({
    startPoint: null as TouchPoint | null,
    lastPoint: null as TouchPoint | null,
    startTime: 0,
    lastTapTime: 0,
    tapCount: 0,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
    isPanning: false,
    initialPinchDistance: 0,
    lastPinchScale: 1,
  })

  // Update config when it changes
  useEffect(() => {
    configRef.current = { ...defaultConfig, ...config }
  }, [config])

  const clearLongPressTimer = useCallback(() => {
    if (stateRef.current.longPressTimer) {
      clearTimeout(stateRef.current.longPressTimer)
      stateRef.current.longPressTimer = null
    }
  }, [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    const point = getTouchPoint(touch)
    const state = stateRef.current
    const config = configRef.current

    // Handle multi-touch (pinch)
    if (event.touches.length === 2) {
      clearLongPressTimer()
      state.isPanning = false
      state.initialPinchDistance = getPinchDistance(event.touches[0], event.touches[1])
      state.lastPinchScale = 1
      return
    }

    // Single touch
    state.startPoint = point
    state.lastPoint = point
    state.startTime = point.timestamp
    state.isPanning = false

    // Start long press timer
    state.longPressTimer = setTimeout(() => {
      if (handlers.onLongPress && state.startPoint) {
        handlers.onLongPress(state.startPoint)
      }
    }, config.longPressTimeout)

    // Handle pan start
    if (handlers.onPanStart) {
      handlers.onPanStart(point)
    }
  }, [handlers, clearLongPressTimer])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const state = stateRef.current
    const config = configRef.current

    // Handle multi-touch (pinch)
    if (event.touches.length === 2) {
      const currentDistance = getPinchDistance(event.touches[0], event.touches[1])
      const scale = currentDistance / state.initialPinchDistance
      
      if (Math.abs(scale - state.lastPinchScale) > config.pinchThreshold) {
        const center = getCenter(event.touches[0], event.touches[1])
        
        if (handlers.onPinch) {
          handlers.onPinch({ scale, center })
        }
        
        state.lastPinchScale = scale
      }
      return
    }

    // Single touch
    const touch = event.touches[0]
    const point = getTouchPoint(touch)
    
    if (!state.startPoint || !state.lastPoint) return

    const distance = getDistance(state.startPoint, point)
    
    // Clear long press if moved too far
    if (distance > 10) {
      clearLongPressTimer()
    }

    // Handle panning
    if (distance > 5 && !state.isPanning) {
      state.isPanning = true
    }

    if (state.isPanning && handlers.onPanMove) {
      const delta = {
        x: point.x - state.lastPoint.x,
        y: point.y - state.lastPoint.y,
        timestamp: point.timestamp - state.lastPoint.timestamp,
      }
      handlers.onPanMove(point, delta)
    }

    state.lastPoint = point
  }, [handlers, clearLongPressTimer])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    const state = stateRef.current
    const config = configRef.current

    clearLongPressTimer()

    // Handle multi-touch end
    if (event.changedTouches.length > 1 || event.touches.length > 0) {
      return
    }

    const touch = event.changedTouches[0]
    const endPoint = getTouchPoint(touch)

    if (!state.startPoint) return

    const distance = getDistance(state.startPoint, endPoint)
    const duration = endPoint.timestamp - state.startTime
    const velocity = getVelocity(distance, duration)

    // Handle pan end
    if (handlers.onPanEnd) {
      handlers.onPanEnd(endPoint)
    }

    // Handle swipe
    if (distance > config.swipeThreshold && velocity > config.swipeVelocityThreshold) {
      const direction = getDirection(state.startPoint, endPoint)
      
      if (handlers.onSwipe) {
        handlers.onSwipe({
          direction,
          distance,
          velocity,
          duration,
        })
      }
    }
    // Handle tap
    else if (distance < 10 && duration < config.tapTimeout) {
      const now = Date.now()
      
      // Check for double tap
      if (now - state.lastTapTime < config.doubleTapTimeout) {
        state.tapCount++
        
        if (state.tapCount === 2 && handlers.onDoubleTap) {
          handlers.onDoubleTap({
            point: endPoint,
            tapCount: 2,
          })
          state.tapCount = 0
        }
      } else {
        state.tapCount = 1
        
        // Delay single tap to check for double tap
        setTimeout(() => {
          if (state.tapCount === 1 && handlers.onTap) {
            handlers.onTap({
              point: endPoint,
              tapCount: 1,
            })
          }
        }, config.doubleTapTimeout)
      }
      
      state.lastTapTime = now
    }

    // Reset state
    state.startPoint = null
    state.lastPoint = null
    state.isPanning = false
  }, [handlers, clearLongPressTimer])

  const elementRef = useRef<HTMLElement | null>(null)

  const attachGestures = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart)
      elementRef.current.removeEventListener('touchmove', handleTouchMove)
      elementRef.current.removeEventListener('touchend', handleTouchEnd)
    }

    elementRef.current = element

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false })
      element.addEventListener('touchmove', handleTouchMove, { passive: false })
      element.addEventListener('touchend', handleTouchEnd, { passive: false })
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer()
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart)
        elementRef.current.removeEventListener('touchmove', handleTouchMove)
        elementRef.current.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, clearLongPressTimer])

  return { attachGestures }
}

// Swipe navigation hook
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  config?: GestureConfig
) {
  const handlers: GestureHandlers = {
    onSwipe: (gesture) => {
      switch (gesture.direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }
    },
  }

  return useTouchGestures(handlers, config)
}

// Pull to refresh hook
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  threshold: number = 80
) {
  const isRefreshing = useRef(false)
  const pullDistance = useRef(0)

  const handlers: GestureHandlers = {
    onPanStart: () => {
      pullDistance.current = 0
    },
    onPanMove: (point, delta) => {
      // Only trigger on downward pull at top of page
      if (window.scrollY === 0 && delta.y > 0) {
        pullDistance.current += delta.y
        
        // Add visual feedback here if needed
        if (pullDistance.current > threshold && !isRefreshing.current) {
          // Trigger haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        }
      }
    },
    onPanEnd: async () => {
      if (pullDistance.current > threshold && !isRefreshing.current) {
        isRefreshing.current = true
        
        try {
          await onRefresh()
        } finally {
          isRefreshing.current = false
          pullDistance.current = 0
        }
      }
    },
  }

  return useTouchGestures(handlers)
}

// Touch-friendly button hook
export function useTouchButton(
  onClick: () => void,
  onLongPress?: () => void
) {
  const handlers: GestureHandlers = {
    onTap: onClick,
    onLongPress: onLongPress,
  }

  return useTouchGestures(handlers, {
    tapTimeout: 150, // Shorter for better responsiveness
    longPressTimeout: 600, // Slightly longer to avoid accidental triggers
  })
}

// Utility for preventing zoom on double tap
export function preventDoubleTabZoom(element: HTMLElement) {
  let lastTouchEnd = 0
  
  element.addEventListener('touchend', (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, { passive: false })
}

// Utility for handling safe area insets
export function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
  }
}

// Hook for responsive breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('sm')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else setBreakpoint('sm')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  }
}