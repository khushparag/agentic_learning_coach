// Mobile-optimized components
export {
  MobileBottomNavigation,
  MobileHamburgerMenu,
  useMobileNavigation
} from './MobileNavigation'

export {
  ResponsiveContainer as Container,
  ResponsiveGrid as Grid,
  ResponsiveStack as Stack,
  ResponsiveCard as Card,
  ResponsiveButton as Button,
  ResponsiveModal as Modal
} from './ResponsiveContainer'

// Re-export responsive layout hooks
export {
  useResponsiveLayout,
  useResponsiveFontSize,
  useResponsiveSpacing,
  useMediaQuery,
  useViewportHeight
} from '../../hooks/useResponsiveLayout'

// Re-export touch gesture utilities
export {
  useTouchGestures,
  useSwipeNavigation,
  usePullToRefresh,
  useTouchButton,
  preventDoubleTabZoom,
  getSafeAreaInsets,
  useBreakpoint
} from '../../utils/touchGestures'
