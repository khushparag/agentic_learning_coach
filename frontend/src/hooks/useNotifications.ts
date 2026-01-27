/**
 * Notification Hooks
 * React hooks for managing notifications and preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  BaseNotification, 
  NotificationPreferences, 
  NotificationBatch,
  NotificationStats,
  ToastNotification,
  NotificationType,
  NotificationPriority
} from '../types/notifications'
import { notificationManager } from '../utils/notifications'

export interface UseNotificationsReturn {
  notifications: BaseNotification[]
  unreadNotifications: BaseNotification[]
  batches: NotificationBatch[]
  stats: NotificationStats
  preferences: NotificationPreferences
  createNotification: (notification: Omit<BaseNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => string | null
  markAsRead: (id: string) => void
  dismiss: (id: string) => void
  delete: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  requestPushPermission: () => Promise<NotificationPermission>
  isLoading: boolean
  error: string | null
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<BaseNotification[]>([])
  const [batches, setBatches] = useState<NotificationBatch[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(notificationManager.getPreferences())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refreshInterval = useRef<NodeJS.Timeout>()

  const refreshData = useCallback(() => {
    try {
      setNotifications(notificationManager.getAllNotifications())
      setBatches(notificationManager.getBatches())
      setPreferences(notificationManager.getPreferences())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    }
  }, [])

  useEffect(() => {
    // Load persisted notifications on mount
    notificationManager.loadPersistedNotifications()
    refreshData()
    setIsLoading(false)

    // Set up periodic refresh
    refreshInterval.current = setInterval(refreshData, 5000)

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current)
      }
    }
  }, [refreshData])

  const createNotification = useCallback((notification: Omit<BaseNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    try {
      const id = notificationManager.createNotification(notification)
      refreshData()
      return id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notification')
      return null
    }
  }, [refreshData])

  const markAsRead = useCallback((id: string) => {
    notificationManager.markAsRead(id)
    refreshData()
  }, [refreshData])

  const dismiss = useCallback((id: string) => {
    notificationManager.dismiss(id)
    refreshData()
  }, [refreshData])

  const deleteNotification = useCallback((id: string) => {
    notificationManager.delete(id)
    refreshData()
  }, [refreshData])

  const markAllAsRead = useCallback(() => {
    notificationManager.markAllAsRead()
    refreshData()
  }, [refreshData])

  const clearAll = useCallback(() => {
    notificationManager.clearAll()
    refreshData()
  }, [refreshData])

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    notificationManager.setPreferences(newPreferences)
    refreshData()
  }, [refreshData])

  const requestPushPermission = useCallback(async () => {
    try {
      const permission = await notificationManager.requestPushPermission()
      refreshData()
      return permission
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request push permission')
      return 'denied' as NotificationPermission
    }
  }, [refreshData])

  const unreadNotifications = notifications.filter(n => !n.read && !n.dismissed)
  const stats = notificationManager.getStats()

  return {
    notifications,
    unreadNotifications,
    batches,
    stats,
    preferences,
    createNotification,
    markAsRead,
    dismiss,
    delete: deleteNotification,
    markAllAsRead,
    clearAll,
    updatePreferences,
    requestPushPermission,
    isLoading,
    error
  }
}

export interface UseToastNotificationsReturn {
  toasts: ToastNotification[]
  showToast: (toast: Omit<ToastNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => string | null
  dismissToast: (id: string) => void
  clearToasts: () => void
}

export const useToastNotifications = (): UseToastNotificationsReturn => {
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const { createNotification, dismiss } = useNotifications()

  const showToast = useCallback((toast: Omit<ToastNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    const id = createNotification({
      ...toast,
      persistent: false
    })
    
    if (id) {
      const fullToast: ToastNotification = {
        ...toast,
        id,
        timestamp: new Date(),
        read: false,
        dismissed: false,
        persistent: false,
        duration: toast.duration || 4000,
        position: toast.position || 'top-right',
        showProgress: toast.showProgress !== false,
        closable: toast.closable !== false
      }
      
      setToasts(prev => [...prev, fullToast])
      
      // Auto-dismiss after duration
      if (fullToast.duration && fullToast.duration > 0) {
        setTimeout(() => {
          dismissToast(id)
        }, fullToast.duration)
      }
    }
    
    return id
  }, [createNotification])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    dismiss(id)
  }, [dismiss])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    dismissToast,
    clearToasts
  }
}

export interface UseNotificationSoundsReturn {
  playSound: (type: NotificationType) => void
  preloadSounds: () => void
  setSoundEnabled: (type: NotificationType, enabled: boolean) => void
}

export const useNotificationSounds = (): UseNotificationSoundsReturn => {
  const { preferences, updatePreferences } = useNotifications()
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map())

  const preloadSounds = useCallback(() => {
    Object.entries(preferences.sounds).forEach(([type, url]) => {
      if (url && !audioCache.current.has(url)) {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audio.volume = 0.5
        audioCache.current.set(url, audio)
      }
    })
  }, [preferences.sounds])

  const playSound = useCallback((type: NotificationType) => {
    const soundUrl = preferences.sounds[type]
    if (!soundUrl || !preferences.types[type].sound) return

    let audio = audioCache.current.get(soundUrl)
    if (!audio) {
      audio = new Audio(soundUrl)
      audio.volume = 0.5
      audioCache.current.set(soundUrl, audio)
    }

    audio.currentTime = 0
    audio.play().catch(error => {
      console.warn('Failed to play notification sound:', error)
    })
  }, [preferences])

  const setSoundEnabled = useCallback((type: NotificationType, enabled: boolean) => {
    updatePreferences({
      types: {
        ...preferences.types,
        [type]: {
          ...preferences.types[type],
          sound: enabled
        }
      }
    })
  }, [preferences.types, updatePreferences])

  useEffect(() => {
    preloadSounds()
  }, [preloadSounds])

  return {
    playSound,
    preloadSounds,
    setSoundEnabled
  }
}

export interface UseNotificationFiltersReturn {
  filteredNotifications: BaseNotification[]
  filters: {
    types: NotificationType[]
    priorities: NotificationPriority[]
    showRead: boolean
    showDismissed: boolean
    search: string
    dateRange: { start: Date | null; end: Date | null }
  }
  setTypeFilter: (types: NotificationType[]) => void
  setPriorityFilter: (priorities: NotificationPriority[]) => void
  setShowRead: (show: boolean) => void
  setShowDismissed: (show: boolean) => void
  setSearch: (search: string) => void
  setDateRange: (start: Date | null, end: Date | null) => void
  clearFilters: () => void
}

export const useNotificationFilters = (notifications: BaseNotification[]): UseNotificationFiltersReturn => {
  const [filters, setFilters] = useState({
    types: [] as NotificationType[],
    priorities: [] as NotificationPriority[],
    showRead: true,
    showDismissed: false,
    search: '',
    dateRange: { start: null as Date | null, end: null as Date | null }
  })

  const filteredNotifications = notifications.filter(notification => {
    // Type filter
    if (filters.types.length > 0 && !filters.types.includes(notification.type)) {
      return false
    }

    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(notification.priority)) {
      return false
    }

    // Read/dismissed filters
    if (!filters.showRead && notification.read) {
      return false
    }
    if (!filters.showDismissed && notification.dismissed) {
      return false
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesTitle = notification.title.toLowerCase().includes(searchLower)
      const matchesMessage = notification.message.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesMessage) {
        return false
      }
    }

    // Date range filter
    if (filters.dateRange.start && notification.timestamp < filters.dateRange.start) {
      return false
    }
    if (filters.dateRange.end && notification.timestamp > filters.dateRange.end) {
      return false
    }

    return true
  })

  const setTypeFilter = useCallback((types: NotificationType[]) => {
    setFilters(prev => ({ ...prev, types }))
  }, [])

  const setPriorityFilter = useCallback((priorities: NotificationPriority[]) => {
    setFilters(prev => ({ ...prev, priorities }))
  }, [])

  const setShowRead = useCallback((showRead: boolean) => {
    setFilters(prev => ({ ...prev, showRead }))
  }, [])

  const setShowDismissed = useCallback((showDismissed: boolean) => {
    setFilters(prev => ({ ...prev, showDismissed }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({ ...prev, dateRange: { start, end } }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      types: [],
      priorities: [],
      showRead: true,
      showDismissed: false,
      search: '',
      dateRange: { start: null, end: null }
    })
  }, [])

  return {
    filteredNotifications,
    filters,
    setTypeFilter,
    setPriorityFilter,
    setShowRead,
    setShowDismissed,
    setSearch,
    setDateRange,
    clearFilters
  }
}
