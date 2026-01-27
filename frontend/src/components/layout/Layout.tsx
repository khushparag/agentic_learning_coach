import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { ErrorBoundary } from '../routing/ErrorBoundary'
import { PageLoadingBoundary } from '../routing/LoadingBoundary'
import { MobileBottomNavigation, useMobileNavigation } from '../mobile/MobileNavigation'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isMenuOpen, toggleMenu, closeMenu } = useMobileNavigation()
  const { screenSize, getLayoutDimensions, getSafeAreaClasses } = useResponsiveLayout()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const layoutDimensions = getLayoutDimensions()

  return (
    <div className={`flex h-screen bg-gray-100 ${getSafeAreaClasses()}`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        className="lg:hidden"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuToggle={toggleSidebar}
          showBreadcrumbs={!screenSize.isMobile}
        />
        
        <main 
          className={`
            flex-1 overflow-x-hidden overflow-y-auto bg-gray-50
            ${screenSize.isMobile ? 'pb-16' : ''} // Add bottom padding for mobile nav
          `}
          style={{
            // Ensure proper viewport height on mobile
            minHeight: screenSize.isMobile 
              ? `calc(100vh - ${layoutDimensions.headerHeight + layoutDimensions.bottomNavHeight}px)`
              : `calc(100vh - ${layoutDimensions.headerHeight}px)`
          }}
        >
          <div className={`
            container mx-auto px-4 sm:px-6 py-4 sm:py-8
            ${screenSize.isMobile ? 'max-w-full' : 'max-w-7xl'}
          `}>
            <ErrorBoundary>
              <PageLoadingBoundary>
                <Outlet />
              </PageLoadingBoundary>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />
    </div>
  )
}