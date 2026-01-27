/**
 * Notification System Types
 * Comprehensive type definitions for the notification system
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'progress' | 'streak' | 'collaboration' | 'system'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface BaseNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  timestamp: Date
  read: boolean
  dismissed: boolean
  persistent: boolean
  actions?: NotificationAction[]
  metadata?: Record<string, any>
}

export interface ToastNotification extends BaseNotification {
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  showProgress?: boolean
  closable?: boolean
  icon?: React.ReactNode
  color?: string
}

export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: Record<string, any>
}

export interface NotificationAction {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'danger'
  handler: () => void | Promise<void>
}

export interface NotificationPreferences {
  enabled: boolean
  types: {
    [K in NotificationType]: {
      enabled: boolean
      toast: boolean
      push: boolean
      sound: boolean
      vibration: boolean
    }
  }
  doNotDisturb: {
    enabled: boolean
    startTime: string // HH:MM format
    endTime: string // HH:MM format
    days: number[] // 0-6, Sunday = 0
  }
  batching: {
    enabled: boolean
    maxPerMinute: number
    maxPerHour: number
    groupSimilar: boolean
  }
  push: {
    enabled: boolean
    permission: NotificationPermission
    endpoint?: string
    keys?: {
      p256dh: string
      auth: string
    }
  }
  sounds: {
    [K in NotificationType]: string | null
  }
}

export interface NotificationBatch {
  id: string
  type: NotificationType
  count: number
  title: string
  message: string
  notifications: BaseNotification[]
  timestamp: Date
}

export interface NotificationFilter {
  types?: NotificationType[]
  priority?: NotificationPriority[]
  read?: boolean
  dismissed?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
  todayCount: number
  weekCount: number
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  types: {
    success: { enabled: true, toast: true, push: false, sound: false, vibration: false },
    error: { enabled: true, toast: true, push: true, sound: true, vibration: true },
    warning: { enabled: true, toast: true, push: true, sound: true, vibration: false },
    info: { enabled: true, toast: true, push: false, sound: false, vibration: false },
    achievement: { enabled: true, toast: true, push: true, sound: true, vibration: true },
    progress: { enabled: true, toast: true, push: false, sound: false, vibration: false },
    streak: { enabled: true, toast: true, push: true, sound: true, vibration: false },
    collaboration: { enabled: true, toast: true, push: true, sound: false, vibration: false },
    system: { enabled: true, toast: true, push: true, sound: false, vibration: false }
  },
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6]
  },
  batching: {
    enabled: true,
    maxPerMinute: 5,
    maxPerHour: 20,
    groupSimilar: true
  },
  push: {
    enabled: false,
    permission: 'default'
  },
  sounds: {
    success: null,
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3',
    info: null,
    achievement: '/sounds/achievement.mp3',
    progress: null,
    streak: '/sounds/streak.mp3',
    collaboration: '/sounds/message.mp3',
    system: '/sounds/system.mp3'
  }
}

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  success: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
  error: 'bg-gradient-to-r from-red-400 to-red-600 text-white',
  warning: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
  info: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
  achievement: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
  progress: 'bg-gradient-to-r from-green-400 to-blue-500 text-white',
  streak: 'bg-gradient-to-r from-orange-400 to-red-500 text-white',
  collaboration: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white',
  system: 'bg-white border border-gray-200 text-gray-900 shadow-lg'
}

export const NOTIFICATION_DURATIONS: Record<NotificationType, number> = {
  success: 3000,
  error: 0, // Persistent until dismissed
  warning: 5000,
  info: 4000,
  achievement: 6000,
  progress: 3000,
  streak: 4000,
  collaboration: 5000,
  system: 0 // Persistent until dismissed
}
