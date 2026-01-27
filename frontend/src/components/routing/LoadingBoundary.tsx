import React, { Suspense, ReactNode } from 'react'
import { LoadingSpinner } from '../ui'

interface LoadingBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  children,
  fallback,
  className = "min-h-screen"
}) => {
  const defaultFallback = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

// Specific loading components for different contexts
export const PageLoadingBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <LoadingBoundary className="min-h-96">
    {children}
  </LoadingBoundary>
)

export const ComponentLoadingBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <LoadingBoundary 
    className="h-32"
    fallback={
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="md" />
      </div>
    }
  >
    {children}
  </LoadingBoundary>
)