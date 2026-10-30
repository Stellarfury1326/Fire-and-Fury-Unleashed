/* FIRE AND FURY — service worker.
   Caches the local application shell only. Firebase (auth/database), the Firebase
   SDK scripts and any other cross-origin request are never cached here and need
   an internet connection. */
const CACHE_PREFIX = 'fire-and-fury-';
const CACHE_VERSION = 'v3';                       // bump on every deployment
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];
/* Optional audio: cached when present, but a missing file never blocks installation. */
const OPTIONAL = [
  './sounds/menu-bgm.mp3', './sounds/battle-bgm.mp3', './sounds/final-fury-bgm.mp3',
  './sounds/rocket-launch.mp3', './sounds/explosion.mp3', './sounds/rock-destruction.mp3',
  './sounds/victory.mp3', './sounds/defeat.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    await Promise.all(OPTIONAL.map(u => cache.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    /* delete only OLD caches that belong to this app */
    await Promise.all(names
      .filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Firebase & CDNs: network only

  /* page navigations: network first, fall back to cached shell when offline */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        if (fresh.ok) cache.put('./index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        return (await caches.match('./index.html')) || (await caches.match('./')) ||
               new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  /* static assets: cache first, then network (and remember it) */
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: false });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic' && res.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (e) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
