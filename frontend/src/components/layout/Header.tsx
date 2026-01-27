import React from 'react'
import { BellIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { Breadcrumbs } from '../navigation/Breadcrumbs'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'

interface HeaderProps {
  onMenuToggle?: () => void
  showBreadcrumbs?: boolean
}

export default function Header({ onMenuToggle, showBreadcrumbs = true }: HeaderProps) {
  const { user, logout } = useAuth()
  const { screenSize, getLayoutDimensions } = useResponsiveLayout()
  const layoutDimensions = getLayoutDimensions()

  return (
    <header 
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      style={{ height: `${layoutDimensions.headerHeight}px` }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 h-full">
        <div className="flex items-center min-w-0 flex-1">
          {/* Mobile menu button */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className={`
                lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 
                hover:bg-gray-100 transition-colors mr-2 sm:mr-4
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                min-w-touch min-h-touch
              `}
              aria-label="Open navigation menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          )}
          
          <div className="min-w-0 flex-1">
            {screenSize.isMobile ? (
              // Mobile: Compact header
              <div>
                <h2 className="text-lg font-semibold text-gray-800 truncate">
                  Learning Coach
                </h2>
                {user && (
                  <p className="text-xs text-gray-500 truncate">
                    Welcome back, {user.name.split(' ')[0]}!
                  </p>
                )}
              </div>
            ) : (
              // Desktop: Full header
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ready to continue your learning journey?
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          <button 
            className={`
              p-2 text-gray-400 hover:text-gray-600 transition-colors relative
              rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 
              focus:ring-primary-500 focus:ring-offset-2
              min-w-touch min-h-touch
            `}
            aria-label="View notifications"
          >
            <BellIcon className="w-6 h-6" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User info - hidden on mobile */}
            {!screenSize.isMobile && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || 'Guest'}
                </p>
                <p className="text-xs text-gray-500">
                  Level {user?.level || 1}
                </p>
              </div>
            )}
            
            <div className="relative group">
              <button 
                className={`
                  flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 
                  transition-colors focus:outline-none focus:ring-2 
                  focus:ring-primary-500 focus:ring-offset-2
                  min-w-touch min-h-touch
                `}
                aria-label="User menu"
              >
                {user ? (
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                )}
              </button>
              
              {/* Dropdown menu */}
              <div className={`
                absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 
                opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                transition-all duration-200 border border-gray-200
                ${screenSize.isMobile ? 'w-56' : 'w-48'}
              `}>
                {/* Mobile: Show user info in dropdown */}
                {screenSize.isMobile && user && (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">Level {user.level}</p>
                    </div>
                  </>
                )}
                
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Settings
                </a>
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Profile
                </a>
                <hr className="my-1" />
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Breadcrumbs - hidden on mobile or when disabled */}
      {showBreadcrumbs && !screenSize.isMobile && (
        <div className="px-4 sm:px-6 pb-3 border-t border-gray-100">
          <Breadcrumbs />
        </div>
      )}
    </header>
  )
}