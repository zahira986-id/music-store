// Service Worker for MusicStore PWA
const CACHE_NAME = 'musicstore-v9';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/tailwind.css',
    '/script.js',
    '/scraper.js',
    '/chatbot.js',
    '/manifest.json',
    '/img/icon-192.png',
    '/img/icon-512.png',
    '/img/hero-bg.png',
    '/img/screenshot-mobile.png',
    '/img/screenshot-desktop.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // NETWORK ONLY for API calls - Never cache dynamic data
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // If network fails for API, return a 503 instead of a cached page
                return new Response(JSON.stringify({ error: 'Offline - server unreachable' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // CACHE FIRST for static assets
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache the fetched response for future use
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // Return a custom offline page if available
                    return caches.match('/index.html');
                });
            })
    );
});

// Background sync event (for future offline functionality)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-favorites') {
        console.log('[Service Worker] Syncing favorites...');
        // Add sync logic here
    }
});

// Push notification event (for future notifications)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update available!',
        icon: '/img/icon-192.png',
        badge: '/img/icon-192.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('MusicStore', options)
    );
});
