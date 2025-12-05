const CACHE_NAME = 'workout-app-v3';
const ASSETS = [
    '/',
    '/index.html',
    '/public/icon.svg',
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
    '/src/js/config.js',
    '/src/js/views/home-view.js',
    '/src/js/views/library-view.js',
    '/src/js/views/workout-view.js',
    '/src/js/views/progress-view.js',
    '/src/js/views/nutrition-view.js',
    '/src/js/components/nav-bar.js',
    '/src/js/services/ai.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
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
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request)
                    .then((response) => {
                        if (response) return response;
                        // If not in cache and network failed, return 404 or fallback
                        return new Response('Offline', { status: 404, statusText: 'Not Found' });
                    });
            })
    );
});
