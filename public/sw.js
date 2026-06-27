// Main Service Worker — handles offline caching + push notifications.
// Combines asset caching for PWA install (iOS/Android) with push events.

const CACHE_NAME = "vkusmarket-v5";
const OFFLINE_URL = "/offline";

// Precache app shell (only icons — no HTML pages to avoid stale cache on iOS)
const PRECACHE_URLS = [
  "/icon-192.png",
  "/icon-512.png",
  "/icon-vendor-192.png",
  "/icon-vendor-512.png",
  "/icon-courier-192.png",
  "/icon-courier-512.png",
  "/icon-admin-192.png",
  "/icon-admin-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // CRITICAL: Only handle same-origin requests.
  // Cross-origin requests (Google Fonts, CDN images, etc.) must be left
  // to the browser — intercepting them on iOS Safari causes failures.
  if (url.origin !== self.location.origin) return;

  // Skip API/server action requests
  if (url.pathname.startsWith("/api/")) return;
  if (request.headers.get("next-action")) return;
  // Skip Next.js internal requests
  if (url.pathname.startsWith("/_next/")) return;

  // Network-first for navigations with timeout to prevent hanging
  if (request.mode === "navigate") {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("nav timeout")), 10000)
        ),
      ])
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // For static assets (images, etc.) — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Push notification handling (from sw-push.js)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "ВкусМаркет", body: event.data.text() };
  }

  const title = payload.title || "ВкусМаркет";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    data: {
      url: payload.url || "/",
      ...(payload.data || {}),
    },
    tag: payload.tag,
    requireInteraction: payload.requireInteraction === true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        if (client.url.includes(url)) {
          await client.focus();
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(url);
    })()
  );
});
