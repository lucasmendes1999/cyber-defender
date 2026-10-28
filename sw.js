// Increment the version whenever the offline files change.
const CACHE_PREFIX = 'cyber-neon-defender-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_FILES = [
  './', './index.html', './style.css', './game.js', './pwa.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
const APP_URLS = new Set(APP_FILES.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  // Wait for existing game windows to close before activating an update.
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

  // Serve a consistent version of the complete game, even without a connection.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url.href);
    return cached || fetch(event.request);
  })());
});
