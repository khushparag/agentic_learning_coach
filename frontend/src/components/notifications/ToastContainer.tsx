/**
 * Toast Container Component
 * Manages multiple toast notifications with positioning and stacking
 */

import React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import Toast from './Toast'
import { useToastNotifications } from '../../hooks/useNotifications'
import { ToastNotification } from '../../types/notifications'

export interface ToastContainerProps {
  maxToasts?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  spacing?: number
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  maxToasts = 5,
  position = 'top-right',
  spacing = 12
}) => {
  const { toasts, dismissToast } = useToastNotifications()

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const toastPosition = toast.position || position
    if (!acc[toastPosition]) {
      acc[toastPosition] = []
    }
    acc[toastPosition].push(toast)
    return acc
  }, {} as Record<string, ToastNotification[]>)

  const getPositionClasses = (pos: string) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  const getFlexDirection = (pos: string) => {
    return pos.includes('bottom') ? 'flex-col-reverse' : 'flex-col'
  }

  // Create portal containers for each position
  const containers = Object.entries(toastsByPosition).map(([pos, positionToasts]) => {
    // Limit number of toasts per position
    const visibleToasts = positionToasts.slice(0, maxToasts)
    
    return (
      <div
        key={pos}
        className={`
          fixed z-50 pointer-events-none
          ${getPositionClasses(pos)}
        `}
      >
        <div 
          className={`
            flex ${getFlexDirection(pos)} space-y-${spacing / 4}
          `}
          style={{ gap: `${spacing}px` }}
        >
          <AnimatePresence mode="popLayout">
            {visibleToasts.map((toast, index) => (
              <div key={toast.id} className="pointer-events-auto">
                <Toast
                  notification={toast}
                  onClose={dismissToast}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  })

  // Render containers using portals
  return (
    <>
      {containers.map((container, index) => 
        createPortal(container, document.body, `toast-container-${index}`)
      )}
    </>
  )
}

export default ToastContainer