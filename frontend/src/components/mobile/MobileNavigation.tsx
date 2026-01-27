import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  MapIcon,
  CodeBracketIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  ListBulletIcon,
  CogIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  MapIcon as MapIconSolid,
  CodeBracketIcon as CodeBracketIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  TrophyIcon as TrophyIconSolid,
  ListBulletIcon as ListBulletIconSolid,
  CogIcon as CogIconSolid,
} from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  badge?: string | number
  requiresAuth?: boolean
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: HomeIcon, 
    activeIcon: HomeIconSolid,
    requiresAuth: true 
  },
  { 
    name: 'Learning Path', 
    href: '/learning-path', 
    icon: MapIcon, 
    activeIcon: MapIconSolid,
    requiresAuth: true 
  },
  { 
    name: 'Tasks', 
    href: '/tasks', 
    icon: ListBulletIcon, 
    activeIcon: ListBulletIconSolid,
    requiresAuth: true 
  },
  { 
    name: 'Exercises', 
    href: '/exercises', 
    icon: CodeBracketIcon, 
    activeIcon: CodeBracketIconSolid,
    requiresAuth: true 
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: ChartBarIcon, 
    activeIcon: ChartBarIconSolid,
    requiresAuth: true 
  },
  { 
    name: 'Social', 
    href: '/social', 
    icon: UserGroupIcon, 
    activeIcon: UserGroupIconSolid,
    requiresAuth: true 
  },
  { 
    name: 'Achievements', 
    href: '/achievements', 
    icon: TrophyIcon, 
    activeIcon: TrophyIconSolid,
    requiresAuth: true 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: CogIcon, 
    activeIcon: CogIconSolid,
    requiresAuth: true 
  },
]

interface MobileNavigationProps {
  className?: string
}

// Bottom Tab Navigation for Mobile
export function MobileBottomNavigation({ className = '' }: MobileNavigationProps) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Filter navigation items based on auth status and show only primary items
  const primaryNavigation = navigation
    .filter(item => !item.requiresAuth || isAuthenticated)
    .slice(0, 5) // Show only first 5 items in bottom nav

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 
      safe-area-pb md:hidden ${className}
    `}>
      <div className="flex justify-around items-center h-16 px-2">
        {primaryNavigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href))
          const Icon = isActive ? item.activeIcon : item.icon
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-2 
                text-xs font-medium rounded-lg transition-colors relative
                ${isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary-600' : ''}`} />
              <span className="truncate max-w-full">{item.name}</span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavActiveIndicator"
                  className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-600 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Badge */}
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

// Hamburger Menu for Mobile
interface MobileHamburgerMenuProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  className?: string
}

export function MobileHamburgerMenu({ 
  isOpen, 
  onToggle, 
  onClose, 
  className = '' 
}: MobileHamburgerMenuProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  // Close menu on route change
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const filteredNavigation = navigation.filter(item => 
    !item.requiresAuth || isAuthenticated
  )

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 
          hover:bg-gray-100 transition-colors focus:outline-none 
          focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${className}
        `}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Overlay and Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={onClose}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-6 bg-primary-600 text-white">
                <h2 className="text-lg font-semibold">Learning Coach</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-white hover:bg-primary-700 transition-colors"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              {isAuthenticated && user && (
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">Level {user.level}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <div className="space-y-2">
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/' && location.pathname.startsWith(item.href))
                    const Icon = isActive ? item.activeIcon : item.icon
                    
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-4 py-3 text-sm font-medium rounded-lg 
                          transition-colors relative
                          ${isActive
                            ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </nav>

              {/* Footer Actions */}
              {isAuthenticated && (
                <div className="p-4 border-t bg-gray-50">
                  <button
                    onClick={() => {
                      logout()
                      onClose()
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Hook for managing mobile navigation state
export function useMobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)
  const openMenu = () => setIsMenuOpen(true)

  return {
    isMenuOpen,
    toggleMenu,
    closeMenu,
    openMenu,
  }
}