// Online requests refresh the offline copy automatically.
const CACHE_PREFIX = 'cyber-neon-defender-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const APP_FILES = [
  './', './index.html', './style.css', './game.js', './pwa.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
const APP_URLS = new Set(APP_FILES.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES.map(path => new Request(path, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (!APP_URLS.has(url.href)) return;

  // Prefer fresh files online and keep the last successful copy for offline play.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request, { cache: 'no-store' });
      if (response.ok) {
        await cache.put(url.href, response.clone());
        return response;
      }
      return (await cache.match(url.href)) || response;
    } catch (error) {
      const cached = await cache.match(url.href);
      if (cached) return cached;
      throw error;
    }
  })());
});
