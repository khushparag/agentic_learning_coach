import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'learning-path': 'Learning Path',
  'exercises': 'Exercises',
  'social': 'Social',
  'analytics': 'Analytics',
  'achievements': 'Achievements',
  'settings': 'Settings',
  'onboarding': 'Onboarding'
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const location = useLocation()
  
  // Generate breadcrumbs from current path if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname)

  if (breadcrumbItems.length <= 1) {
    return null // Don't show breadcrumbs for single-level pages
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
            )}
            
            {index === 0 && (
              <HomeIcon className="w-4 h-4 mr-1 text-gray-400" />
            )}
            
            {item.href && !item.isCurrentPage ? (
              <Link
                to={item.href}
                className="hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={item.isCurrentPage ? 'text-gray-900 font-medium' : 'text-gray-500'}
                aria-current={item.isCurrentPage ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with home
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/',
    isCurrentPage: segments.length === 0
  })

  // Build breadcrumbs for each segment
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    breadcrumbs.push({
      label: routeLabels[segment] || formatSegment(segment),
      href: isLast ? undefined : currentPath,
      isCurrentPage: isLast
    })
  })

  return breadcrumbs
}

function formatSegment(segment: string): string {
  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
