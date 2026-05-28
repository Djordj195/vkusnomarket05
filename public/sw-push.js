// Service worker для Web Push.
// Регистрируется со страницы /profile/notifications (см. PushSubscribeButton).
// Слушает push-события и показывает нативное уведомление, при клике
// открывает указанный в payload URL.

self.addEventListener("install", () => {
  // Активируем сразу, без ожидания старых клиентов.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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
      // Если уже открыта вкладка с этим URL — переключаемся в неё.
      for (const client of all) {
        if (client.url.includes(url)) {
          await client.focus();
          return;
        }
      }
      // Иначе открываем новую.
      if (self.clients.openWindow) await self.clients.openWindow(url);
    })()
  );
});
