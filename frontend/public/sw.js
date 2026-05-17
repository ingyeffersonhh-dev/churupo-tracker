const CACHE_NAME = 'churupo-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never cache navigation requests — always go to network
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }

  // API requests: network-first, no caching
  const isApi = event.request.url.includes('/api/') ||
    event.request.url.includes('/transactions') ||
    event.request.url.includes('/analytics') ||
    event.request.url.includes('/budgets') ||
    event.request.url.includes('/categories') ||
    event.request.url.includes('/recurring') ||
    event.request.url.includes('/exchange-rate') ||
    event.request.url.includes('/merchant-rules') ||
    event.request.url.includes('/export');

  if (isApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return response;
      });
    })
  );
});
