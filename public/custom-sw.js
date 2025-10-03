// Custom Service Worker for enhanced PWA functionality
// This extends the generated sw.js from next-pwa

// Import the generated service worker
importScripts("./sw.js");

// Background Sync for updates
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync-updates") {
    event.waitUntil(syncUpdates());
  }
});

// Function to sync updates in background
async function syncUpdates() {
  try {
    // Check for app updates
    const cache = await caches.open("app-updates-cache");
    const response = await fetch("/api/app-updates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const updates = await response.json();
      // Process updates (e.g., update cached data)
      console.log("Background sync: Updates fetched", updates);
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Extend caching for offline functionality
// Cache member profile data for offline access
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache member profile data for 1 year offline access
  if (
    url.pathname.startsWith("/api/member") ||
    url.pathname.startsWith("/api/members/") ||
    url.pathname.includes("firestore.googleapis.com")
  ) {
    event.respondWith(
      caches.open("offline-data-cache").then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses for 1 year
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version if offline
            return cache.match(event.request);
          });
      })
    );
  }

  // Cache static assets for longer periods
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open("static-assets-cache").then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});

// Handle push notifications with system notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "لديك إشعار جديد",
    icon: "/icons/192.png",
    badge: "/icons/48.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "شباب النسور", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
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

// Periodic background sync for updates (if supported)
if ("periodicSync" in self.registration) {
  self.addEventListener("periodicsync", (event) => {
    if (event.tag === "update-check") {
      event.waitUntil(checkForUpdates());
    }
  });
}

async function checkForUpdates() {
  try {
    const response = await fetch("/api/app-version");
    if (response.ok) {
      const version = await response.json();
      // Compare with cached version and update if needed
      console.log("Periodic sync: Version check", version);
    }
  } catch (error) {
    console.error("Periodic sync failed:", error);
  }
}

// Install event - register background sync
self.addEventListener("install", (event) => {
  console.log("Custom SW installed");

  // Register background sync if supported
  if (
    "serviceWorker" in navigator &&
    "sync" in window.ServiceWorkerRegistration.prototype
  ) {
    self.registration.sync.register("background-sync-updates");
  }

  // Register periodic sync if supported
  if ("periodicSync" in self.registration) {
    self.registration.periodicSync.register("update-check", {
      minInterval: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Custom SW activated");
  event.waitUntil(self.clients.claim());
});
