/**
 * Notification Utilities
 * Helper functions for notification management, batching, and rate limiting
 */

import { 
  BaseNotification, 
  NotificationPreferences, 
  NotificationBatch, 
  NotificationType,
  NotificationPriority,
  PushNotification,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '../types/notifications'

export class NotificationManager {
  private notifications: Map<string, BaseNotification> = new Map()
  private batches: Map<string, NotificationBatch> = new Map()
  private rateLimiter: Map<NotificationType, number[]> = new Map()
  private preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.loadPreferences()
    this.initializeServiceWorker()
  }

  // Preferences Management
  setPreferences(preferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...preferences }
    this.savePreferences()
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  private loadPreferences() {
    try {
      const stored = localStorage.getItem('notification-preferences')
      if (stored) {
        this.preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error)
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(this.preferences))
    } catch (error) {
      console.warn('Failed to save notification preferences:', error)
    }
  }

  // Rate Limiting
  private isRateLimited(type: NotificationType): boolean {
    if (!this.preferences.batching.enabled) return false

    const now = Date.now()
    const typeRates = this.rateLimiter.get(type) || []
    
    // Clean old timestamps (older than 1 hour)
    const recentRates = typeRates.filter(timestamp => now - timestamp < 3600000)
    
    // Check per-minute limit
    const lastMinute = recentRates.filter(timestamp => now - timestamp < 60000)
    if (lastMinute.length >= this.preferences.batching.maxPerMinute) {
      return true
    }
    
    // Check per-hour limit
    if (recentRates.length >= this.preferences.batching.maxPerHour) {
      return true
    }

    // Update rate limiter
    recentRates.push(now)
    this.rateLimiter.set(type, recentRates)
    
    return false
  }

  // Do Not Disturb Check
  private isDoNotDisturbActive(): boolean {
    if (!this.preferences.doNotDisturb.enabled) return false

    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    // Check if current day is in DND days
    if (!this.preferences.doNotDisturb.days.includes(currentDay)) {
      return false
    }

    const [startHour, startMin] = this.preferences.doNotDisturb.startTime.split(':').map(Number)
    const [endHour, endMin] = this.preferences.doNotDisturb.endTime.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    
    // Handle overnight DND (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    }
    
    return currentTime >= startTime && currentTime <= endTime
  }

  // Notification Creation and Management
  createNotification(notification: Omit<BaseNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>): string | null {
    const typePrefs = this.preferences.types[notification.type]
    
    // Check if notifications are enabled for this type
    if (!this.preferences.enabled || !typePrefs.enabled) {
      return null
    }

    // Check do not disturb
    if (this.isDoNotDisturbActive() && notification.priority !== 'urgent') {
      return null
    }

    // Check rate limiting
    if (this.isRateLimited(notification.type)) {
      return this.handleRateLimitedNotification(notification)
    }

    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const fullNotification: BaseNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
      dismissed: false
    }

    this.notifications.set(id, fullNotification)
    this.persistNotifications()

    // Play sound if enabled
    if (typePrefs.sound && this.preferences.sounds[notification.type]) {
      this.playNotificationSound(notification.type)
    }

    // Trigger vibration if enabled and supported
    if (typePrefs.vibration && 'vibrate' in navigator) {
      navigator.vibrate(this.getVibrationPattern(notification.type))
    }

    return id
  }

  private handleRateLimitedNotification(notification: Omit<BaseNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>): string | null {
    if (!this.preferences.batching.groupSimilar) {
      return null
    }

    const batchKey = `${notification.type}-batch`
    let batch = this.batches.get(batchKey)

    if (!batch) {
      batch = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type,
        count: 0,
        title: `Multiple ${notification.type} notifications`,
        message: '',
        notifications: [],
        timestamp: new Date()
      }
      this.batches.set(batchKey, batch)
    }

    const tempNotification: BaseNotification = {
      ...notification,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      dismissed: false
    }

    batch.notifications.push(tempNotification)
    batch.count = batch.notifications.length
    batch.message = `${batch.count} new ${notification.type} notifications`
    batch.timestamp = new Date()

    return batch.id
  }

  // Notification Actions
  markAsRead(id: string): boolean {
    const notification = this.notifications.get(id)
    if (notification) {
      notification.read = true
      this.persistNotifications()
      return true
    }
    return false
  }

  dismiss(id: string): boolean {
    const notification = this.notifications.get(id)
    if (notification) {
      notification.dismissed = true
      this.persistNotifications()
      return true
    }
    return false
  }

  delete(id: string): boolean {
    const deleted = this.notifications.delete(id)
    if (deleted) {
      this.persistNotifications()
    }
    return deleted
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true
    })
    this.persistNotifications()
  }

  clearAll(): void {
    this.notifications.clear()
    this.batches.clear()
    this.persistNotifications()
  }

  // Getters
  getNotification(id: string): BaseNotification | undefined {
    return this.notifications.get(id)
  }

  getAllNotifications(): BaseNotification[] {
    return Array.from(this.notifications.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getUnreadNotifications(): BaseNotification[] {
    return this.getAllNotifications().filter(n => !n.read && !n.dismissed)
  }

  getBatches(): NotificationBatch[] {
    return Array.from(this.batches.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getStats() {
    const notifications = this.getAllNotifications()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read && !n.dismissed).length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      }, {} as Record<NotificationType, number>),
      byPriority: notifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1
        return acc
      }, {} as Record<NotificationPriority, number>),
      todayCount: notifications.filter(n => n.timestamp >= today).length,
      weekCount: notifications.filter(n => n.timestamp >= weekAgo).length
    }
  }

  // Push Notifications
  async requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    const permission = await Notification.requestPermission()
    this.preferences.push.permission = permission
    this.savePreferences()
    
    if (permission === 'granted') {
      await this.subscribeToPush()
    }
    
    return permission
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not available')
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '') as BufferSource
      })

      // Store subscription details
      const keys = subscription.getKey ? {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      } : undefined

      this.preferences.push.endpoint = subscription.endpoint
      this.preferences.push.keys = keys
      this.savePreferences()

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async sendPushNotification(notification: PushNotification): Promise<void> {
    if (!this.preferences.push.enabled || this.preferences.push.permission !== 'granted') {
      return
    }

    if (this.isDoNotDisturbActive()) {
      return
    }

    // This would typically be sent to your backend to trigger the push
    // For now, we'll show a local notification if the page is not visible
    if (document.hidden) {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/badge-72x72.png',
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        data: { ...notification.data, timestamp: notification.timestamp || Date.now() }
      })
    }
  }

  // Audio and Vibration
  private playNotificationSound(type: NotificationType): void {
    const soundUrl = this.preferences.sounds[type]
    if (!soundUrl) return

    try {
      const audio = new Audio(soundUrl)
      audio.volume = 0.5
      audio.play().catch(error => {
        console.warn('Failed to play notification sound:', error)
      })
    } catch (error) {
      console.warn('Failed to create audio for notification:', error)
    }
  }

  private getVibrationPattern(type: NotificationType): number[] {
    switch (type) {
      case 'error':
        return [200, 100, 200, 100, 200]
      case 'warning':
        return [100, 50, 100]
      case 'achievement':
        return [100, 50, 100, 50, 200]
      case 'streak':
        return [50, 25, 50, 25, 50, 25, 100]
      default:
        return [100]
    }
  }

  // Service Worker Management
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
      } catch (error) {
        console.warn('Service worker registration failed:', error)
      }
    }
  }

  // Persistence
  private persistNotifications(): void {
    try {
      const data = {
        notifications: Array.from(this.notifications.entries()),
        batches: Array.from(this.batches.entries())
      }
      localStorage.setItem('notifications-data', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist notifications:', error)
    }
  }

  loadPersistedNotifications(): void {
    try {
      const stored = localStorage.getItem('notifications-data')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore notifications (convert timestamp strings back to Date objects)
        if (data.notifications) {
          data.notifications.forEach(([id, notification]: [string, any]) => {
            notification.timestamp = new Date(notification.timestamp)
            this.notifications.set(id, notification)
          })
        }
        
        // Restore batches
        if (data.batches) {
          data.batches.forEach(([id, batch]: [string, any]) => {
            batch.timestamp = new Date(batch.timestamp)
            batch.notifications.forEach((n: any) => {
              n.timestamp = new Date(n.timestamp)
            })
            this.batches.set(id, batch)
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted notifications:', error)
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return ''
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

// Singleton instance
export const notificationManager = new NotificationManager()

// Utility functions for common notification patterns
export const createSuccessNotification = (title: string, message: string, metadata?: Record<string, any>) => {
  return notificationManager.createNotification({
    type: 'success',
    title,
    message,
    priority: 'normal',
    persistent: false,
    metadata
  })
}

export const createErrorNotification = (title: string, message: string, metadata?: Record<string, any>) => {
  return notificationManager.createNotification({
    type: 'error',
    title,
    message,
    priority: 'high',
    persistent: true,
    metadata
  })
}

export const createWarningNotification = (title: string, message: string, metadata?: Record<string, any>) => {
  return notificationManager.createNotification({
    type: 'warning',
    title,
    message,
    priority: 'normal',
    persistent: false,
    metadata
  })
}

export const createInfoNotification = (title: string, message: string, metadata?: Record<string, any>) => {
  return notificationManager.createNotification({
    type: 'info',
    title,
    message,
    priority: 'low',
    persistent: false,
    metadata
  })
}

export const createAchievementNotification = (title: string, message: string, metadata?: Record<string, any>) => {
  return notificationManager.createNotification({
    type: 'achievement',
    title,
    message,
    priority: 'high',
    persistent: false,
    metadata
  })
}