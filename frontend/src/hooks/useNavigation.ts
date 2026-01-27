import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface NavigationOptions {
  replace?: boolean
  state?: any
}

export const useNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  const goTo = (path: string, options?: NavigationOptions) => {
    navigate(path, options)
  }

  const goBack = () => {
    navigate(-1)
  }

  const goToDashboard = () => {
    navigate('/', { replace: true })
  }

  const goToOnboarding = () => {
    navigate('/onboarding', { replace: true })
  }

  const goToLogin = (returnPath?: string) => {
    navigate('/login', { 
      replace: true, 
      state: { from: { pathname: returnPath || location.pathname } }
    })
  }

  const canAccess = (path: string): boolean => {
    // Public routes
    const publicRoutes = ['/login', '/register', '/forgot-password', '/ui-showcase']
    if (publicRoutes.includes(path)) {
      return true
    }

    // Onboarding route
    if (path === '/onboarding') {
      return isAuthenticated
    }

    // Protected routes
    return isAuthenticated && user?.isOnboardingComplete === true
  }

  const getCurrentRoute = () => {
    return location.pathname
  }

  const isCurrentRoute = (path: string): boolean => {
    return location.pathname === path
  }

  const getReturnPath = (): string => {
    const state = location.state as { from?: { pathname: string } }
    return state?.from?.pathname || '/'
  }

  return {
    goTo,
    goBack,
    goToDashboard,
    goToOnboarding,
    goToLogin,
    canAccess,
    getCurrentRoute,
    isCurrentRoute,
    getReturnPath,
    location,
  }
}
