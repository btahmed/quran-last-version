// QuranReview - Service Worker for PWA
const CACHE_NAME = 'quranreview-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/audio-config.js',
    '/quran-metadata.json',
    '/manifest.json',
    '/assets/logo.svg',
    '/assets/logo-192.png',
    '/assets/logo-512.png',
    '/assets/favicon.ico',
    '/assets/fonts/NotoNaskhArabic-Bold.ttf',
    '/assets/fonts/NotoNaskhArabic-Medium.ttf',
    '/assets/fonts/NotoNaskhArabic-Regular.ttf',
    '/assets/fonts/NotoNaskhArabic-SemiBold.ttf'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => {
                console.error('[SW] Cache failed:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - cache strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip API calls (don't cache API responses)
    if (url.pathname.startsWith('/api/')) {
        return;
    }
    
    // Skip external resources (CDN)
    if (!url.origin.includes(self.location.origin)) {
        return;
    }
    
    // Strategy: Cache First for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }
                
                // Fetch from network and cache
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Clone the response
                        const responseToCache = networkResponse.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch((err) => {
                        console.error('[SW] Fetch failed:', err);
                        // Return offline fallback if available
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-tasks') {
        event.waitUntil(syncPendingTasks());
    }
});

// Push notifications (for future implementation)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/assets/logo-192.png',
                badge: '/assets/logo-72.png',
                data: data.data
            })
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Helper function to sync pending tasks
async function syncPendingTasks() {
    // This will be implemented when background sync is needed
    console.log('[SW] Syncing pending tasks...');
}
