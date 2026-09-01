// Service Worker — PWA Offline Support

const CACHE_NAME = 'al-handassa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/cart.html',
  '/checkout.html',
  '/search.html',
  '/wishlist.html',
  '/dashboard.html',
  '/downloads.html',
  '/login.html',
  '/css/style.min.css',
  '/js/cart.js',
  '/js/wishlist.js',
  '/js/recommendations.js',
  '/js/filters.js',
  '/img/favicon.png'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // API requests: network only
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(JSON.stringify({ error: 'Hors ligne' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Pages & assets: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => response || new Response('Page non disponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          }));
      })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification',
    icon: '/img/favicon.png',
    badge: '/img/favicon.png',
    tag: 'al-handassa-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Al Handassa.dz', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
