
const CACHE_NAME = 'fire-and-fury-pwa-v2';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith('fire-and-fury-pwa-') &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle same-origin GET requests.
  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  // PAGE NAVIGATION
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put('./index.html', copy));
          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match('./index.html') ||
            Response.error()
          );
        })
    );

    return;
  }

  // OTHER SAME-ORIGIN RESOURCES
  event.respondWith(
    caches.match(request)
      .then(async cached => {
        if (cached) return cached;

        const response = await fetch(request);

        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));
        }

        return response;
      })
  );
});
