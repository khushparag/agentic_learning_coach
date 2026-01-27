/**
 * Enhanced Notification System
 * Comprehensive notification management with toast, center, push notifications, and WebSocket integration
 */

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  TrophyIcon, 
  FireIcon, 
  StarIcon,
  BellIcon,
  XMarkIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useNotifications, useToastNotifications } from '../../hooks/useNotifications'
import { pushNotificationService } from '../../services/pushNotificationService'
import { 
  BaseNotification, 
  NotificationType, 
  NOTIFICATION_COLORS, 
  NOTIFICATION_DURATIONS 
} from '../../types/notifications'
import ToastContainer from './ToastContainer'
import NotificationCenter from './NotificationCenter'
import Toast from './Toast'

export interface NotificationSystemProps {
  enableWebSocket?: boolean
  enablePushNotifications?: boolean
  maxToasts?: number
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  enableWebSocket = true,
  enablePushNotifications = true,
  maxToasts = 5,
  toastPosition = 'top-right'
}) => {
  const { user } = useAuth()
  const { 
    createNotification, 
    preferences, 
    updatePreferences 
  } = useNotifications()
  const { showToast } = useToastNotifications()
  
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [achievementToShow, setAchievementToShow] = useState<any>(null)

  // WebSocket connection for real-time notifications
  const wsUrl = enableWebSocket && user?.id 
    ? `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/notifications/${user.id}` 
    : undefined
  const { isConnected, lastMessage } = useWebSocket(wsUrl, {
    enabled: enableWebSocket && !!user?.id,
    connectionName: 'notifications'
  })

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage || !enableWebSocket) return

    try {
      const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage
      handleWebSocketMessage(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }, [lastMessage, enableWebSocket])

  // Initialize push notifications
  useEffect(() => {
    if (enablePushNotifications && preferences.push.enabled) {
      initializePushNotifications()
    }
  }, [enablePushNotifications, preferences.push.enabled])

  const initializePushNotifications = async () => {
    try {
      if (pushNotificationService.getIsSupported() && 
          pushNotificationService.getPermissionStatus() === 'granted') {
        await pushNotificationService.subscribeToPush()
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
    }
  }

  const handleWebSocketMessage = useCallback((message: any) => {
    const { type, data } = message

    switch (type) {
      case 'achievement_unlocked':
        handleAchievementUnlocked(data)
        break
      case 'progress_update':
        handleProgressUpdate(data)
        break
      case 'streak_milestone':
        handleStreakMilestone(data)
        break
      case 'collaboration_update':
        handleCollaborationUpdate(data)
        break
      case 'system_notification':
        handleSystemNotification(data)
        break
      case 'xp_awarded':
        handleXPAwarded(data)
        break
      case 'level_up':
        handleLevelUp(data)
        break
      case 'challenge_received':
        handleChallengeReceived(data)
        break
      default:
        console.log('Unknown WebSocket message type:', type)
    }
  }, [])

  const handleAchievementUnlocked = (data: any) => {
    const { achievement } = data

    // Create notification
    const notificationId = createNotification({
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: achievement.name,
      priority: 'high',
      persistent: false,
      metadata: {
        xp: achievement.xp_reward,
        badge: achievement.badge,
        rarity: achievement.rarity
      }
    })

    // Show full-screen animation for rare achievements
    if (achievement.rarity === 'legendary' || achievement.rarity === 'epic') {
      setAchievementToShow(achievement)
    } else {
      // Show toast for common achievements
      showToast({
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: achievement.name,
        priority: 'high',
        persistent: false,
        duration: 6000,
        metadata: { xp: achievement.xp_reward },
        icon: <span className="text-2xl">{achievement.badge}</span>
      })
    }

    // Send push notification if enabled
    if (enablePushNotifications && preferences.types.achievement.push) {
      pushNotificationService.showAchievementNotification({
        name: achievement.name,
        description: achievement.description,
        badge: achievement.badge,
        xp: achievement.xp_reward
      })
    }
  }

  const handleProgressUpdate = (data: any) => {
    if (data.type === 'task_completed') {
      const notificationId = createNotification({
        type: 'progress',
        title: 'Task Completed!',
        message: `Great job on "${data.taskName}"`,
        priority: 'normal',
        persistent: false,
        metadata: { xp: data.xp, taskName: data.taskName }
      })

      showToast({
        type: 'progress',
        title: 'Task Completed!',
        message: `Great job on "${data.taskName}"`,
        priority: 'normal',
        persistent: false,
        duration: 3000,
        metadata: { xp: data.xp }
      })

      if (enablePushNotifications && preferences.types.progress.push) {
        pushNotificationService.showProgressNotification({
          taskName: data.taskName,
          moduleName: data.moduleName || 'Current Module',
          completionPercentage: data.progress || 0
        })
      }
    } else if (data.type === 'module_completed') {
      const notificationId = createNotification({
        type: 'progress',
        title: 'Module Completed!',
        message: `You've finished "${data.moduleName}"`,
        priority: 'high',
        persistent: false,
        metadata: { xp: data.xp, moduleName: data.moduleName }
      })

      showToast({
        type: 'progress',
        title: 'Module Completed!',
        message: `You've finished "${data.moduleName}"`,
        priority: 'high',
        persistent: false,
        duration: 4000,
        metadata: { xp: data.xp }
      })
    }
  }

  const handleStreakMilestone = (data: any) => {
    const { streak } = data
    
    // Safety check for streak data
    if (!streak || typeof streak.current_streak !== 'number') {
      console.warn('Invalid streak data received:', data)
      return
    }

    createNotification({
      type: 'streak',
      title: 'Streak Milestone!',
      message: `${streak.current_streak} day learning streak! 🔥`,
      priority: 'high',
      persistent: false,
      metadata: { 
        streak: streak.current_streak,
        milestone: streak.milestone
      }
    })

    showToast({
      type: 'streak',
      title: 'Streak Milestone!',
      message: `${streak.current_streak} day learning streak! 🔥`,
      priority: 'high',
      persistent: false,
      duration: 5000,
      metadata: { streak: streak.current_streak }
    })

    if (enablePushNotifications && preferences.types.streak.push) {
      pushNotificationService.showStreakNotification({
        days: streak.current_streak,
        milestone: !!streak.milestone
      })
    }
  }

  const handleCollaborationUpdate = (data: any) => {
    createNotification({
      type: 'collaboration',
      title: 'Collaboration Update',
      message: data.message || 'New activity in your study group',
      priority: 'normal',
      persistent: false,
      metadata: data
    })

    if (preferences.types.collaboration.toast) {
      showToast({
        type: 'collaboration',
        title: 'Collaboration Update',
        message: data.message || 'New activity in your study group',
        priority: 'normal',
        persistent: false,
        duration: 4000
      })
    }
  }

  const handleSystemNotification = (data: any) => {
    createNotification({
      type: 'system',
      title: data.title,
      message: data.message,
      priority: data.severity === 'error' ? 'urgent' : 'normal',
      persistent: data.severity === 'error',
      metadata: data
    })

    if (preferences.types.system.toast) {
      showToast({
        type: data.severity === 'error' ? 'error' : 'info',
        title: data.title,
        message: data.message,
        priority: data.severity === 'error' ? 'urgent' : 'normal',
        persistent: data.severity === 'error',
        duration: data.severity === 'error' ? 0 : 5000
      })
    }
  }

  const handleXPAwarded = (data: any) => {
    if (data.xp_amount > 0) {
      showToast({
        type: 'success',
        title: 'XP Earned!',
        message: `+${data.xp_amount} XP`,
        priority: 'low',
        persistent: false,
        duration: 2000,
        metadata: { xp: data.xp_amount }
      })
    }
  }

  const handleLevelUp = (data: any) => {
    createNotification({
      type: 'achievement',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${data.level}`,
      priority: 'high',
      persistent: false,
      metadata: { 
        level: data.level,
        previousLevel: data.previous_level
      }
    })

    showToast({
      type: 'achievement',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${data.level}`,
      priority: 'high',
      persistent: false,
      duration: 6000,
      icon: <TrophyIcon className="w-6 h-6" />
    })
  }

  const handleChallengeReceived = (data: any) => {
    createNotification({
      type: 'collaboration',
      title: 'Challenge Received!',
      message: `${data.fromUsername} challenged you to "${data.title}"`,
      priority: 'high',
      persistent: true,
      metadata: data,
      actions: [
        {
          id: 'accept',
          label: 'Accept',
          type: 'primary',
          handler: () => {
            // Handle challenge acceptance
            window.open(`/social/challenges/${data.challengeId}`, '_blank')
          }
        },
        {
          id: 'decline',
          label: 'Decline',
          type: 'secondary',
          handler: () => {
            // Handle challenge decline
            console.log('Challenge declined')
          }
        }
      ]
    })
  }

  const dismissAchievement = () => {
    setAchievementToShow(null)
  }

  return (
    <>
      {/* Toast Container */}
      <ToastContainer
        maxToasts={maxToasts}
        position={toastPosition}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Achievement Unlock Animation */}
      <AnimatePresence>
        {achievementToShow && (
          <AchievementUnlockAnimation
            achievement={achievementToShow}
            onComplete={dismissAchievement}
          />
        )}
      </AnimatePresence>

      {/* Notification Bell (can be placed in header) */}
      <NotificationBell
        onClick={() => setShowNotificationCenter(true)}
      />
    </>
  )
}

interface AchievementUnlockAnimationProps {
  achievement: any
  onComplete: () => void
}

const AchievementUnlockAnimation: React.FC<AchievementUnlockAnimationProps> = ({ 
  achievement, 
  onComplete 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onComplete}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          duration: 0.8
        }}
        className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-white text-center max-w-md mx-4 shadow-2xl"
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="text-6xl mb-4"
        >
          {achievement.badge || '🏆'}
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-2"
        >
          Achievement Unlocked!
        </motion.h2>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl font-semibold mb-2"
        >
          {achievement.name}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm opacity-90 mb-4"
        >
          {achievement.description}
        </motion.p>

        {achievement.xp_reward && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center space-x-2 bg-white/20 rounded-lg px-4 py-2"
          >
            <StarIcon className="w-5 h-5" />
            <span className="font-semibold">+{achievement.xp_reward} XP</span>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs opacity-75 mt-4"
        >
          Click anywhere to continue
        </motion.p>
      </motion.div>

      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              y: -100,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              rotate: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 100,
              rotate: 360 * 3
            }}
            transition={{ 
              duration: 3,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
            className="absolute w-3 h-3 bg-yellow-400 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  )
}

interface NotificationBellProps {
  onClick: () => void
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { unreadNotifications } = useNotifications()
  const unreadCount = unreadNotifications.length

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <BellIcon className="w-6 h-6" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      )}
    </button>
  )
}

export default NotificationSystem
