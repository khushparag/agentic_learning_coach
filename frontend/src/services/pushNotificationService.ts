/**
 * Push Notification Service
 * Handles browser push notifications and service worker integration
 */

import { PushNotification } from '../types/notifications'

export class PushNotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private vapidPublicKey: string
  private _isSupported: boolean

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
    this._isSupported = this.checkSupport()
    this.initialize()
  }

  private checkSupport(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  private async initialize(): Promise<void> {
    if (!this._isSupported) {
      console.warn('Push notifications are not supported in this browser')
      return
    }

    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage)

      console.log('Push notification service initialized')
    } catch (error) {
      console.error('Failed to initialize push notification service:', error)
    }
  }

  private handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data

    switch (type) {
      case 'NOTIFICATION_CLICKED':
        this.handleNotificationClick(data)
        break
      case 'NOTIFICATION_CLOSED':
        this.handleNotificationClose(data)
        break
      default:
        console.log('Unknown service worker message:', type, data)
    }
  }

  private handleNotificationClick(data: any): void {
    // Handle notification click actions
    if (data.action) {
      switch (data.action) {
        case 'view_achievement':
          window.open('/achievements', '_blank')
          break
        case 'continue_learning':
          window.open('/dashboard', '_blank')
          break
        case 'view_progress':
          window.open('/progress', '_blank')
          break
        default:
          if (data.url) {
            window.open(data.url, '_blank')
          }
      }
    } else if (data.url) {
      window.open(data.url, '_blank')
    }
  }

  private handleNotificationClose(data: any): void {
    // Track notification dismissal analytics
    console.log('Notification closed:', data)
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this._isSupported) {
      throw new Error('Push notifications are not supported')
    }

    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      await this.subscribeToPush()
    }

    return permission
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered')
    }

    try {
      // Check if already subscribed
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
        })
      }

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription)

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscriptionFromBackend(subscription)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null
    }

    return await this.serviceWorkerRegistration.pushManager.getSubscription()
  }

  async showNotification(notification: PushNotification): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      // Fallback to browser notification API
      this.showBrowserNotification(notification)
      return
    }

    try {
      await this.serviceWorkerRegistration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/badge-72x72.png',
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent || false,
        data: { ...notification.data, image: notification.image, timestamp: notification.timestamp || Date.now(), actions: notification.actions || [] }
      })
    } catch (error) {
      console.error('Failed to show push notification:', error)
      // Fallback to browser notification
      this.showBrowserNotification(notification)
    }
  }

  private showBrowserNotification(notification: PushNotification): void {
    if (Notification.permission !== 'granted') {
      return
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      tag: notification.tag,
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
      data: { ...notification.data, timestamp: notification.timestamp || Date.now() }
    })

    // Handle click events
    browserNotification.onclick = () => {
      this.handleNotificationClick(notification.data || {})
      browserNotification.close()
    }

    // Auto-close after 5 seconds if not requiring interaction
    if (!notification.requireInteraction) {
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }
  }

  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: this.arrayBufferToBase64(subscription.getKey('auth'))
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to backend')
      }
    } catch (error) {
      console.error('Failed to send subscription to backend:', error)
    }
  }

  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription from backend')
      }
    } catch (error) {
      console.error('Failed to remove subscription from backend:', error)
    }
  }

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

  // Utility methods for common notification patterns
  async showAchievementNotification(achievement: {
    name: string
    description: string
    badge: string
    xp: number
  }): Promise<void> {
    await this.showNotification({
      title: '🏆 Achievement Unlocked!',
      body: `${achievement.name} - ${achievement.description}`,
      icon: '/icons/achievement.png',
      tag: 'achievement',
      requireInteraction: true,
      actions: [
        {
          action: 'view_achievement',
          title: 'View Achievement',
          icon: '/icons/trophy.png'
        }
      ],
      data: {
        type: 'achievement',
        achievementId: achievement.name,
        xp: achievement.xp,
        url: '/achievements'
      }
    })
  }

  async showProgressNotification(progress: {
    taskName: string
    moduleName: string
    completionPercentage: number
  }): Promise<void> {
    await this.showNotification({
      title: '✅ Progress Update',
      body: `Completed "${progress.taskName}" in ${progress.moduleName}`,
      icon: '/icons/progress.png',
      tag: 'progress',
      actions: [
        {
          action: 'continue_learning',
          title: 'Continue Learning',
          icon: '/icons/play.png'
        }
      ],
      data: {
        type: 'progress',
        taskName: progress.taskName,
        moduleName: progress.moduleName,
        url: '/dashboard'
      }
    })
  }

  async showStreakNotification(streak: {
    days: number
    milestone?: boolean
  }): Promise<void> {
    const title = streak.milestone 
      ? `🔥 ${streak.days} Day Streak Milestone!`
      : `🔥 ${streak.days} Day Streak!`
    
    const body = streak.milestone
      ? `Congratulations on reaching ${streak.days} days! Keep it up!`
      : `You're on fire! Keep your learning streak alive.`

    await this.showNotification({
      title,
      body,
      icon: '/icons/streak.png',
      tag: 'streak',
      requireInteraction: streak.milestone,
      actions: [
        {
          action: 'continue_learning',
          title: 'Continue Learning',
          icon: '/icons/play.png'
        }
      ],
      data: {
        type: 'streak',
        days: streak.days,
        milestone: streak.milestone,
        url: '/dashboard'
      }
    })
  }

  async showReminderNotification(reminder: {
    title: string
    message: string
    url?: string
  }): Promise<void> {
    await this.showNotification({
      title: `⏰ ${reminder.title}`,
      body: reminder.message,
      icon: '/icons/reminder.png',
      tag: 'reminder',
      requireInteraction: true,
      actions: reminder.url ? [
        {
          action: 'view_reminder',
          title: 'View',
          icon: '/icons/eye.png'
        }
      ] : [],
      data: {
        type: 'reminder',
        url: reminder.url || '/dashboard'
      }
    })
  }

  getIsSupported(): boolean {
    return this._isSupported
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService()
