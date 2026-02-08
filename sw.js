/**
 * QuranReview Service Worker
 * Professional PWA Implementation
 */

const CACHE_NAME = 'quranreview-v1.0.0';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './audio-config.js',
    './manifest.json'
];

const AUDIO_CACHE = 'quranreview-audio-v1.0.0';

// Install event - cache app shell
self.addEventListener('install', (event) => {
    console.log('🕌 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('🕌 Service Worker: Caching app shell');
                return cache.addAll(APP_SHELL);
            })
            .then(() => {
                console.log('🕌 Service Worker: Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🕌 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE) {
                            console.log('🕌 Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('🕌 Service Worker: Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different request types
    if (url.origin === self.location.origin) {
        // Same origin - cache first for app shell, network first for data
        if (APP_SHELL.includes(url.pathname) || url.pathname === '/') {
            // App shell - cache first
            event.respondWith(
                caches.match(request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        
                        // Not in cache, fetch from network
                        return fetch(request)
                            .then((response) => {
                                // Cache successful responses
                                if (response.status === 200) {
                                    const responseClone = response.clone();
                                    caches.open(CACHE_NAME)
                                        .then((cache) => {
                                            cache.put(request, responseClone);
                                        });
                                }
                                return response;
                            })
                            .catch(() => {
                                // Network failed, try to serve offline page
                                return caches.match('./index.html');
                            });
                    })
            );
        } else if (url.pathname.includes('audio/') || url.hostname.includes('qurancdn.com')) {
            // Audio files - cache first with network fallback
            event.respondWith(
                caches.open(AUDIO_CACHE)
                    .then((cache) => {
                        return cache.match(request)
                            .then((response) => {
                                if (response) {
                                    return response;
                                }
                                
                                // Not in cache, fetch and cache
                                return fetch(request)
                                    .then((networkResponse) => {
                                        if (networkResponse.status === 200) {
                                            cache.put(request, networkResponse.clone());
                                        }
                                        return networkResponse;
                                    });
                            });
                    })
            );
        } else {
            // Other same-origin requests - network first
            event.respondWith(
                fetch(request)
                    .catch(() => {
                        // Network failed, try cache
                        return caches.match(request);
                    })
            );
        }
    } else {
        // Cross-origin requests - network only (no caching)
        event.respondWith(fetch(request));
    }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🕌 Service Worker: Background sync triggered');
        event.waitUntil(
            // Handle background sync tasks
            Promise.resolve()
        );
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('🕌 Service Worker: Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'حان وقت مراجعة القرآن',
        icon: './manifest.json',
        badge: './manifest.json',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'فتح التطبيق',
                icon: './manifest.json'
            },
            {
                action: 'close',
                title: 'إغلاق',
                icon: './manifest.json'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('مراجعة القرآن', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('🕌 Service Worker: Notification click received');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// Message handling
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
