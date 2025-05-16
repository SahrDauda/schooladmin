import { initializeApp, getApps } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firestore with persistence settings from the beginning
let db

if (typeof window !== "undefined") {
  // Only initialize with persistence on the client side
  db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true, // This helps with some browser compatibility issues
  })

  // Enable persistence separately (this will be ignored if already enabled)
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn("Firebase persistence failed to enable: Multiple tabs open")
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the features required for persistence
      console.warn("Firebase persistence not supported in this browser")
    } else {
      console.error("Firebase persistence error:", err)
    }
  })
} else {
  // Server-side initialization (no persistence)
  db = getFirestore(app)
}

// Initialize Auth with custom settings
export const auth = getAuth(app)

// Export the db instance
export { db }

// Add console log to confirm initialization
console.log("Firebase initialized with project:", firebaseConfig.projectId)
