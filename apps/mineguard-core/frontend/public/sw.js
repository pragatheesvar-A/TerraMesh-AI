/*
 * TerraMesh AI — PWA service worker
 * App-shell caching for installable mobile use. API/WS traffic is
 * NEVER cached (network-first) so operational data is never stale.
 *
 * NOTE on push notifications: web push requires VAPID keys + a push
 * service and is therefore BLOCKED until credentials are provisioned
 * (see docs/INTEGRATIONS.md). The app is installable now; push arrives
 * with the FCM/web-push credential step.
 */
const CACHE = 'terramesh-shell-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Operational data: network-only (never serve stale safety telemetry).
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    return;
  }
  // App shell: cache-first with background refresh.
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(event.request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
