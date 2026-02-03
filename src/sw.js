// Minimal Service Worker to satisfy PWA criteria
const CACHE_NAME = 'girassol-rh-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Optional: cache initial assets
            // return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Required: a fetch handler is mandatory for PWA installability
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
