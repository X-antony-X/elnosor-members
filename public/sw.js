const CACHE_NAME = "church-youth-v1"
const urlsToCache = [
  "/",
  "/dashboard",
  "/members",
  "/attendance",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === "document") {
          return caches.match("/offline")
        }
      }),
  )
})

// Background sync for attendance
self.addEventListener("sync", (event) => {
  if (event.tag === "attendance-sync") {
    event.waitUntil(syncAttendance())
  }
})

async function syncAttendance() {
  try {
    const cache = await caches.open("attendance-cache")
    const requests = await cache.keys()

    for (const request of requests) {
      if (request.url.includes("/api/attendance/offline")) {
        const response = await cache.match(request)
        const data = await response.json()

        // Send to server
        await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        // Remove from cache after successful sync
        await cache.delete(request)
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error)
  }
}
