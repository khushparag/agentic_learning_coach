import { useState, useEffect, useCallback } from 'react'

// Breakpoint definitions (matching Tailwind CSS)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof breakpoints
export type BreakpointValue = typeof breakpoints[Breakpoint]

// Screen size categories
export interface ScreenSize {
  width: number
  height: number
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLandscape: boolean
  isPortrait: boolean
  aspectRatio: number
}

// Device type detection
export interface DeviceInfo {
  isTouchDevice: boolean
  isIOS: boolean
  isAndroid: boolean
  isSafari: boolean
  isChrome: boolean
  isFirefox: boolean
  supportsHover: boolean
  devicePixelRatio: number
  maxTouchPoints: number
}

// Layout configuration
export interface LayoutConfig {
  sidebarWidth: {
    mobile: number
    tablet: number
    desktop: number
  }
  headerHeight: {
    mobile: number
    tablet: number
    desktop: number
  }
  bottomNavHeight: number
  containerMaxWidth: {
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  gridColumns: {
    mobile: number
    tablet: number
    desktop: number
  }
}

const defaultLayoutConfig: LayoutConfig = {
  sidebarWidth: {
    mobile: 280,
    tablet: 320,
    desktop: 256,
  },
  headerHeight: {
    mobile: 56,
    tablet: 64,
    desktop: 72,
  },
  bottomNavHeight: 64,
  containerMaxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  gridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
}

// Get current breakpoint
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl'
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  return 'sm'
}

// Detect device information
function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isAndroid = /android/.test(userAgent)
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
  const isChrome = /chrome/.test(userAgent)
  const isFirefox = /firefox/.test(userAgent)

  return {
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    supportsHover: window.matchMedia('(hover: hover)').matches,
    devicePixelRatio: window.devicePixelRatio || 1,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  }
}

// Main responsive layout hook
export function useResponsiveLayout(config: Partial<LayoutConfig> = {}) {
  const layoutConfig = { ...defaultLayoutConfig, ...config }
  
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const breakpoint = getCurrentBreakpoint(width)
    
    return {
      width,
      height,
      breakpoint,
      isMobile: breakpoint === 'sm',
      isTablet: breakpoint === 'md',
      isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
      isLandscape: width > height,
      isPortrait: height > width,
      aspectRatio: width / height,
    }
  })

  const [deviceInfo] = useState<DeviceInfo>(getDeviceInfo)

  // Update screen size on resize
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        const breakpoint = getCurrentBreakpoint(width)
        
        setScreenSize({
          width,
          height,
          breakpoint,
          isMobile: breakpoint === 'sm',
          isTablet: breakpoint === 'md',
          isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
          isLandscape: width > height,
          isPortrait: height > width,
          aspectRatio: width / height,
        })
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Get layout dimensions based on current screen size
  const getLayoutDimensions = useCallback(() => {
    const { isMobile, isTablet } = screenSize
    
    return {
      sidebarWidth: isMobile 
        ? layoutConfig.sidebarWidth.mobile
        : isTablet 
        ? layoutConfig.sidebarWidth.tablet
        : layoutConfig.sidebarWidth.desktop,
      headerHeight: isMobile
        ? layoutConfig.headerHeight.mobile
        : isTablet
        ? layoutConfig.headerHeight.tablet
        : layoutConfig.headerHeight.desktop,
      bottomNavHeight: layoutConfig.bottomNavHeight,
      gridColumns: isMobile
        ? layoutConfig.gridColumns.mobile
        : isTablet
        ? layoutConfig.gridColumns.tablet
        : layoutConfig.gridColumns.desktop,
    }
  }, [screenSize, layoutConfig])

  // Check if breakpoint matches
  const isBreakpoint = useCallback((bp: Breakpoint) => {
    return screenSize.breakpoint === bp
  }, [screenSize.breakpoint])

  // Check if screen is at least a certain breakpoint
  const isAtLeast = useCallback((bp: Breakpoint) => {
    return screenSize.width >= breakpoints[bp]
  }, [screenSize.width])

  // Check if screen is at most a certain breakpoint
  const isAtMost = useCallback((bp: Breakpoint) => {
    return screenSize.width <= breakpoints[bp]
  }, [screenSize.width])

  // Get responsive value based on breakpoint
  const getResponsiveValue = useCallback(<T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T => {
    const { breakpoint } = screenSize
    
    // Try exact match first
    if (values[breakpoint] !== undefined) {
      return values[breakpoint]!
    }
    
    // Fall back to smaller breakpoints
    const orderedBreakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm']
    const currentIndex = orderedBreakpoints.indexOf(breakpoint)
    
    for (let i = currentIndex + 1; i < orderedBreakpoints.length; i++) {
      const bp = orderedBreakpoints[i]
      if (values[bp] !== undefined) {
        return values[bp]!
      }
    }
    
    return fallback
  }, [screenSize])

  // Get container classes for responsive design
  const getContainerClasses = useCallback((maxWidth?: Breakpoint) => {
    const baseClasses = 'mx-auto px-4 sm:px-6 lg:px-8'
    
    if (!maxWidth) {
      return `${baseClasses} max-w-7xl`
    }
    
    const maxWidthClass = `max-w-${layoutConfig.containerMaxWidth[maxWidth]}`
    return `${baseClasses} ${maxWidthClass}`
  }, [layoutConfig])

  // Get grid classes for responsive layout
  const getGridClasses = useCallback((
    columns?: Partial<Record<Breakpoint, number>>,
    gap: string = 'gap-6'
  ) => {
    if (!columns) {
      return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gap}`
    }
    
    const colClasses = Object.entries(columns)
      .map(([bp, cols]) => {
        if (bp === 'sm') return `grid-cols-${cols}`
        return `${bp}:grid-cols-${cols}`
      })
      .join(' ')
    
    return `grid ${colClasses} ${gap}`
  }, [])

  // Safe area utilities for mobile devices
  const getSafeAreaClasses = useCallback(() => {
    if (!deviceInfo.isTouchDevice) return ''
    
    return 'safe-area-pt safe-area-pb safe-area-pl safe-area-pr'
  }, [deviceInfo])

  // Orientation change handler
  useEffect(() => {
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        const breakpoint = getCurrentBreakpoint(width)
        
        setScreenSize(prev => ({
          ...prev,
          width,
          height,
          breakpoint,
          isLandscape: width > height,
          isPortrait: height > width,
          aspectRatio: width / height,
        }))
      }, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    return () => window.removeEventListener('orientationchange', handleOrientationChange)
  }, [])

  return {
    screenSize,
    deviceInfo,
    layoutConfig,
    getLayoutDimensions,
    isBreakpoint,
    isAtLeast,
    isAtMost,
    getResponsiveValue,
    getContainerClasses,
    getGridClasses,
    getSafeAreaClasses,
  }
}

// Hook for responsive font sizes
export function useResponsiveFontSize() {
  const { getResponsiveValue } = useResponsiveLayout()
  
  const getFontSize = useCallback((
    sizes: Partial<Record<Breakpoint, string>>,
    fallback: string = 'text-base'
  ) => {
    return getResponsiveValue(sizes, fallback)
  }, [getResponsiveValue])
  
  return { getFontSize }
}

// Hook for responsive spacing
export function useResponsiveSpacing() {
  const { getResponsiveValue } = useResponsiveLayout()
  
  const getSpacing = useCallback((
    spacing: Partial<Record<Breakpoint, string>>,
    fallback: string = 'p-4'
  ) => {
    return getResponsiveValue(spacing, fallback)
  }, [getResponsiveValue])
  
  return { getSpacing }
}

// Media query hook
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Viewport height hook (handles mobile browser address bar)
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight
    }
    return 0
  })

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight)
      
      // Update CSS custom property for 100vh fix
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    window.addEventListener('orientationchange', updateHeight)
    
    return () => {
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('orientationchange', updateHeight)
    }
  }, [])

  return viewportHeight
}
