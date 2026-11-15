'use strict';
const CACHE_NAME = 'mm-services-pages-v1';
const SCOPE_PATH = new URL('./', self.location).pathname;

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('mm-services-pages-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const url = new URL(request.url);
  const isPage = request.mode === 'navigate' || url.pathname.endsWith('.html');
  if (!isPage || !url.pathname.startsWith(SCOPE_PATH)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  })());
});
