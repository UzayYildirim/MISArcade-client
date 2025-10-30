// Service worker for MIS Arcade PWA
// Provides basic PWA functionality with minimal caching

const CACHE_NAME = 'mis-arcade-v1'
const BASE = new URL('./', self.registration.scope).pathname
const STATIC_CACHE_URLS = [
  BASE,
  BASE + 'manifest.webmanifest',
  BASE + 'assets/fancyarcadeicon.png'
]

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
        return self.skipWaiting()
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              return response
            }

            // Clone the response for caching
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // If network fails and no cache, return a fallback page
            if (event.request.destination === 'document') {
              return caches.match('/')
            }
          })
      })
  )
})

// Handle background sync for future features
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
})

// Handle push notifications for future features
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/assets/fancyarcadeicon.png',
      badge: '/assets/fancyarcadeicon.png',
      tag: 'mis-arcade-notification',
      requireInteraction: false
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'MIS Arcade', options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/')
  )
})


