/**
 * Enhanced Toast Component
 * Advanced toast notification component with multiple types, animations, and features
 */

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  TrophyIcon,
  FireIcon,
  UserGroupIcon,
  BellIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { ToastNotification, NotificationType, NOTIFICATION_COLORS, NOTIFICATION_DURATIONS } from '../../types/notifications'

export interface ToastProps {
  notification: ToastNotification
  onClose: (id: string) => void
  onAction?: (actionId: string, notificationId: string) => void
}

const Toast: React.FC<ToastProps> = ({ notification, onClose, onAction }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)

  const duration = notification.duration || NOTIFICATION_DURATIONS[notification.type] || 4000

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onClose(notification.id), 300)
  }, [notification.id, onClose])

  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now()
      const timer = setTimeout(handleClose, duration)

      // Update progress bar
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, duration - elapsed)
        setProgress((remaining / duration) * 100)
      }, 50)

      return () => {
        clearTimeout(timer)
        clearInterval(progressInterval)
      }
    }
  }, [duration, handleClose])

  const getIcon = () => {
    if (notification.icon) return notification.icon

    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />
      case 'error':
        return <XCircleIcon className="w-5 h-5" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'info':
        return <InformationCircleIcon className="w-5 h-5" />
      case 'achievement':
        return <TrophyIcon className="w-5 h-5" />
      case 'progress':
        return <CheckCircleIcon className="w-5 h-5" />
      case 'streak':
        return <FireIcon className="w-5 h-5" />
      case 'collaboration':
        return <UserGroupIcon className="w-5 h-5" />
      case 'system':
        return <BellIcon className="w-5 h-5" />
      default:
        return <InformationCircleIcon className="w-5 h-5" />
    }
  }

  const getColorClasses = () => {
    if (notification.color) return notification.color
    return NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.info
  }

  const getAnimationDirection = () => {
    const position = notification.position || 'top-right'
    if (position.includes('left')) return { x: -300 }
    if (position.includes('right')) return { x: 300 }
    if (position.includes('top')) return { y: -100 }
    if (position.includes('bottom')) return { y: 100 }
    return { x: 300 }
  }

  const animationDirection = getAnimationDirection()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, ...animationDirection }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, ...animationDirection }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.4
          }}
          className={`
            relative max-w-sm w-full rounded-lg shadow-lg backdrop-blur-sm
            ${getColorClasses()}
          `}
          style={{ minWidth: '320px' }}
        >
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold truncate">
                      {notification.title}
                    </h4>
                    <p className="text-sm opacity-90 mt-1 break-words">
                      {notification.message}
                    </p>
                  </div>

                  {notification.closable !== false && (
                    <button
                      onClick={handleClose}
                      className="ml-2 flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
                      aria-label="Close notification"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Metadata display */}
                {notification.metadata?.xp && (
                  <div className="flex items-center mt-2 space-x-2">
                    <StarIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      +{notification.metadata.xp} XP
                    </span>
                  </div>
                )}

                {notification.metadata?.streak && (
                  <div className="flex items-center mt-2 space-x-2">
                    <FireIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {notification.metadata.streak} day streak!
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex space-x-2 mt-3">
                    {notification.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          action.handler()
                          if (onAction) {
                            onAction(action.id, notification.id)
                          }
                        }}
                        className={`
                          px-3 py-1 text-xs font-medium rounded-md transition-colors
                          ${action.type === 'primary' 
                            ? 'bg-white/20 hover:bg-white/30 text-white' 
                            : action.type === 'danger'
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-100'
                            : 'bg-black/10 hover:bg-black/20 text-white/80'
                          }
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs opacity-60 mt-2">
                  {notification.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar for timed notifications */}
          {notification.showProgress !== false && duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05, ease: "linear" }}
                className="h-full bg-black/20"
              />
            </div>
          )}

          {/* Priority indicator */}
          {notification.priority === 'urgent' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          {notification.priority === 'high' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast
