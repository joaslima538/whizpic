const CACHE = 'whizpic-studio-6';
const files = [
  './index.html','./style.css','./app.js','./reader.js','./stories.js','./manifest.webmanifest',
  './assets/kingdom.webp','./assets/castle.webp','./assets/space.webp','./assets/dino.webp','./assets/forest.webp',
  './assets/icon-192.png','./assets/icon-512.png','./assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2'
];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(files)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(names =>
  Promise.all(names.filter(name => name.startsWith('whizpic-studio-') && name !== CACHE).map(name => caches.delete(name)))
).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).catch(() => caches.match(request.mode === 'navigate' ? './index.html' : request)));
});
