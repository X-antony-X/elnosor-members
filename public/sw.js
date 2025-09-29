self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || "Notification";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/196.png",
    badge: data.badge || "/icons/196.png",
    data: data.url || "/",
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
