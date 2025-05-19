/// <reference lib="webworker" />

import { BackgroundSyncPlugin } from "workbox-background-sync"
import { registerRoute } from "workbox-routing"
import { NetworkOnly } from "workbox-strategies"

// Create a new plugin for Firestore operations
const firebaseSync = new BackgroundSyncPlugin("firebase-operations-queue", {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
})

// Register a route handler for Firestore operations
registerRoute(
  ({ url }) => url.pathname.includes("google") && url.pathname.includes("firestore"),
  new NetworkOnly({
    plugins: [firebaseSync],
  }),
  "POST",
)

// Listen for sync events to notify the app
self.addEventListener("sync", (event) => {
  if (event.tag === "firebase-operations-queue") {
    console.log("Background sync triggered for Firebase operations")
    // Could post a message to client windows
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "BACKGROUND_SYNC_COMPLETE",
          timestamp: Date.now(),
        })
      })
    })
  }
})

// This is a simple service worker to enable background sync
// The actual service worker would be more complex in a real app
self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})
