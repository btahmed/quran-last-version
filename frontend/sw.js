// QuranReview — Service Worker (version ES Modules / Vercel)
const CACHE_NAME = 'quranreview-frontend-v1';

// Assets statiques à précacher
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/core/config.js',
    '/src/core/state.js',
    '/src/core/router.js',
    '/src/core/ui.js',
    '/src/core/logger.js',
    '/manifest.json',
    '/assets/logo-192.png',
    '/assets/logo-512.png',
    '/assets/favicon.ico',
];

// ── Install : précacher les assets statiques ───────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((err) => console.warn('[SW] Précachage partiel :', err))
    );
    self.skipWaiting();
});

// ── Activate : nettoyer les anciens caches ─────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all([
                ...names
                    .filter((n) => n !== CACHE_NAME)
                    .map((n) => caches.delete(n)),
                self.clients.claim(),
            ])
        )
    );
});

// ── Fetch : stratégie hybride ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ne pas intercepter les requêtes non-GET
    if (request.method !== 'GET') return;

    // Ne pas intercepter les appels API backend (Vercel API)
    if (url.hostname.includes('quranreview-api.vercel.app')) return;
    if (url.pathname.startsWith('/api/')) return;

    // Ne pas intercepter les ressources externes (CDN audio, etc.)
    if (url.origin !== self.location.origin) return;

    // Stratégie : Network First pour les navigations (HTML toujours frais)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    if (!res || res.status !== 200) return res;
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                    return res;
                })
                .catch(() => caches.match('/index.html').then(r => r || new Response('Offline', { status: 503 })))
        );
        return;
    }

    // Stratégie : Network First pour les modules JS (évite le cache obsolète)
    if (url.pathname.startsWith('/src/') || url.pathname.endsWith('.js')) {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    if (!res || res.status !== 200 || res.type !== 'basic') return res;
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                    return res;
                })
                .catch(() => caches.match(request).then(r => r || new Response('// offline', { status: 503 })))
        );
        return;
    }

    // Stratégie : Cache First pour les autres assets statiques (images, fonts, etc.)
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request)
                .then((res) => {
                    if (!res || res.status !== 200 || res.type !== 'basic') return res;
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                    return res;
                })
                .catch(() => new Response('Offline', { status: 503, statusText: 'Service Unavailable' }));
        })
    );
});
