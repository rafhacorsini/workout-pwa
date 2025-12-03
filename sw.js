const CACHE_NAME = 'workout-app-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/src/css/variables.css',
    '/src/css/reset.css',
    '/src/css/typography.css',
    '/src/css/components.css',
    '/src/css/animations.css',
    '/src/css/main.css',
    '/src/js/app.js',
    '/src/js/core/db.js',
    '/src/js/core/router.js',
    '/src/js/core/store.js',
    '/src/js/core/utils.js',
    '/src/js/views/home-view.js',
    '/src/js/views/library-view.js',
    '/src/js/views/workout-view.js',
    '/src/js/views/progress-view.js',
    '/src/js/components/nav-bar.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activation
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
        // Network first, then cache (better for development)
    );
});
