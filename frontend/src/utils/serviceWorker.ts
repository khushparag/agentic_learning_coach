/**
 * Simple Service Worker utilities without React dependencies
 */

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: Error) => void
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false

  /**
   * Register service worker
   */
  async register(config: ServiceWorkerConfig = {}): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    if (import.meta.env.DEV) {
      console.log('Service Worker registration skipped in development')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      this.registration = registration
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              this.updateAvailable = true
              config.onUpdate?.(registration)
            } else {
              // Content cached for first time
              config.onSuccess?.(registration)
            }
          }
        })
      })

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      console.log('Service Worker registered successfully')
      
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      config.onError?.(error as Error)
    }
  }

  /**
   * Update service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered')
    }

    try {
      await this.registration.update()
    } catch (error) {
      console.error('Service Worker update failed:', error)
      throw error
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting(): void {
    if (!this.registration?.waiting) {
      throw new Error('No waiting service worker')
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  /**
   * Check if service worker is supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator
  }

  /**
   * Check if service worker is active
   */
  isActive(): boolean {
    return !!this.registration?.active
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager()

export default serviceWorkerManager
