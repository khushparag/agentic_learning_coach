import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  MapIcon,
  CogIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  CodeBracketIcon,
  ListBulletIcon,
  XMarkIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { ConnectionStatusBadge } from './ConnectionStatusIndicator'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  badge?: string | number
  requiresAuth?: boolean
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, requiresAuth: true },
  { name: 'Learning Path', href: '/learning-path', icon: MapIcon, requiresAuth: true },
  { name: 'Tasks', href: '/tasks', icon: ListBulletIcon, requiresAuth: true },
  { name: 'Exercises', href: '/exercises', icon: CodeBracketIcon, requiresAuth: true },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, requiresAuth: true },
  { name: 'Social', href: '/social', icon: UserGroupIcon, requiresAuth: true },
  { name: 'Achievements', href: '/achievements', icon: TrophyIcon, requiresAuth: true },
  { name: 'Settings', href: '/settings', icon: CogIcon, requiresAuth: true },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export default function Sidebar({ isOpen = true, onClose, className = '' }: SidebarProps) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Filter navigation items based on auth status
  const filteredNavigation = navigation.filter(item => 
    !item.requiresAuth || isAuthenticated
  )

  const handleChangeTechnologies = () => {
    if (onClose) onClose()
    navigate('/onboarding')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex flex-col w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${onClose ? 'fixed inset-y-0 left-0 z-30 lg:relative lg:translate-x-0' : ''}
        ${className}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">Learning Coach</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        
        {/* User info */}
        {isAuthenticated && user && (
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
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
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose} // Close mobile sidebar on navigation
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
          
          {/* Change Technologies Button */}
          {isAuthenticated && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleChangeTechnologies}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <AcademicCapIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">Change Technologies</span>
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 space-y-2">
          <div className="flex justify-center">
            <ConnectionStatusBadge />
          </div>
          <p className="text-xs text-gray-500 text-center">
            © 2024 Learning Coach
          </p>
        </div>
      </div>
    </>
  )
}