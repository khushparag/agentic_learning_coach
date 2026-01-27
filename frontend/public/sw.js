/**
 * Enhanced Service Worker for Learning Coach Application
 * Provides advanced caching, offline support, PWA features, and mobile optimizations
 */

const CACHE_NAME = 'learning-coach-v2.0.0'
const STATIC_CACHE = 'learning-coach-static-v2.0.0'
const DYNAMIC_CACHE = 'learning-coach-dynamic-v2.0.0'
const API_CACHE = 'learning-coach-api-v2.0.0'
const OFFLINE_CACHE = 'learning-coach-offline-v2.0.0'

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/goals',
  '/api/curriculum',
  '/api/progress',
  '/api/tasks',
  '/api/analytics',
  '/api/gamification',
  '/api/social'
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network
  CACHE_FIRST: 'cache-first',
  // Network first, then cache
  NETWORK_FIRST: 'network-first',
  // Cache only
  CACHE_ONLY: 'cache-only',
  // Network only
  NETWORK_ONLY: 'network-only',
  // Stale while revalidate
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(handleApiRequest(request))
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request))
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2)$/)) {
    // Other assets - stale while revalidate
    event.respondWith(handleAssetRequest(request))
  } else {
    // HTML pages - network first with cache fallback
    event.respondWith(handlePageRequest(request))
  }
})

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  const cacheName = API_CACHE
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName)
      
      // Only cache GET requests for specific endpoints
      if (shouldCacheApiResponse(request.url)) {
        cache.put(request, networkResponse.clone())
      }
      
      return networkResponse
    }
    
    // If network fails, try cache
    return await getCachedResponse(request, cacheName)
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url)
    return await getCachedResponse(request, cacheName)
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  // If not in cache, fetch and cache
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url)
    // Return offline fallback if available
    return new Response('Asset not available offline', { status: 503 })
  }
}

/**
 * Handle other assets with stale-while-revalidate strategy
 */
async function handleAssetRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Ignore network errors for background updates
  })
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // If not cached, wait for network
  try {
    return await fetchPromise
  } catch (error) {
    return new Response('Asset not available', { status: 503 })
  }
}

/**
 * Handle page requests with network-first strategy
 */
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    // If network fails, try cache
    return await getCachedResponse(request, DYNAMIC_CACHE)
  } catch (error) {
    console.log('Service Worker: Network failed for page:', request.url)
    
    // Try to return cached version
    const cachedResponse = await getCachedResponse(request, DYNAMIC_CACHE)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page or app shell
    return await getOfflineFallback()
  }
}

/**
 * Get cached response
 */
async function getCachedResponse(request, cacheName) {
  const cache = await caches.open(cacheName)
  return await cache.match(request)
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return STATIC_ASSETS.includes(pathname) || 
         pathname === '/' || 
         pathname === '/index.html'
}

/**
 * Check if API response should be cached
 */
function shouldCacheApiResponse(url) {
  // Only cache GET requests for specific endpoints
  return API_ENDPOINTS.some(endpoint => url.includes(endpoint))
}

/**
 * Get offline fallback page
 */
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE)
  const fallback = await cache.match('/index.html')
  
  if (fallback) {
    return fallback
  }
  
  // Return basic offline message
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Learning Coach - Offline</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .offline-message {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .offline-icon { font-size: 3rem; margin-bottom: 1rem; }
          h1 { color: #374151; margin-bottom: 0.5rem; }
          p { color: #6b7280; margin-bottom: 1.5rem; }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="offline-message">
          <div class="offline-icon">📚</div>
          <h1>You're offline</h1>
          <p>Learning Coach is not available right now. Please check your internet connection.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  try {
    // Get pending actions from IndexedDB or localStorage
    // This would sync offline actions when connection is restored
    console.log('Service Worker: Performing background sync')
    
    // Example: sync offline submissions, progress updates, etc.
    // Implementation would depend on your offline storage strategy
    
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received:', event)
  
  let notificationData = {}
  
  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (error) {
      console.error('Service Worker: Error parsing push data:', error)
      notificationData = {
        title: 'Learning Coach',
        body: event.data.text() || 'You have a new notification',
        icon: '/icon-192x192.png'
      }
    }
  } else {
    notificationData = {
      title: 'Learning Coach',
      body: 'You have a new notification',
      icon: '/icon-192x192.png'
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    image: notificationData.image,
    tag: notificationData.tag || 'learning-coach',
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    timestamp: notificationData.timestamp || Date.now(),
    actions: notificationData.actions || [],
    data: notificationData.data || {}
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event)
  
  event.notification.close()

  const notificationData = event.notification.data || {}
  const action = event.action

  // Determine URL to open
  let urlToOpen = '/'
  
  if (action) {
    // Handle action buttons
    switch (action) {
      case 'view_achievement':
        urlToOpen = '/achievements'
        break
      case 'continue_learning':
        urlToOpen = '/dashboard'
        break
      case 'view_progress':
        urlToOpen = '/progress'
        break
      case 'view_reminder':
        urlToOpen = notificationData.url || '/dashboard'
        break
      case 'join_study_group':
        urlToOpen = `/social/groups/${notificationData.groupId}`
        break
      case 'accept_challenge':
        urlToOpen = `/social/challenges/${notificationData.challengeId}`
        break
      default:
        urlToOpen = notificationData.url || '/'
    }
  } else {
    // Handle main notification click
    urlToOpen = notificationData.url || '/'
  }

  // Open or focus window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with this URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Check if there's any window open to the app
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'navigate' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      
      // No suitable window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }).then(() => {
      // Send message to client about notification click
      return clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: { action, notificationData }
          })
        })
      })
    })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed:', event)
  
  const notificationData = event.notification.data || {}

  // Send message to client about notification close
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_CLOSED',
          data: { notificationData }
        })
      })
    })
  )
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', payload: stats })
      })
      break
      
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' })
      })
      break
      
    default:
      console.log('Service Worker: Unknown message type:', type)
  }
})

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    stats[cacheName] = keys.length
  }
  
  return stats
}

/**
 * Clear specific cache
 */
async function clearCache(cacheName) {
  if (cacheName) {
    return await caches.delete(cacheName)
  } else {
    // Clear all caches
    const cacheNames = await caches.keys()
    return Promise.all(cacheNames.map(name => caches.delete(name)))
  }
}

console.log('Service Worker: Loaded and ready')