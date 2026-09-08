/* TOLS web push */
self.addEventListener("push", (event) => {
  let data = { title: "TOLS", body: "New house message", href: "/alerts", tag: "tols" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      data.body = event.data?.text() || data.body;
    } catch {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "TOLS", {
      body: data.body,
      icon: "/brand/tols-t.png",
      badge: "/brand/tols-t.png",
      data: { href: data.href || "/alerts" },
      tag: data.tag || "tols",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/alerts";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(href);
          return;
        }
      }
      return self.clients.openWindow(href);
    }),
  );
});
