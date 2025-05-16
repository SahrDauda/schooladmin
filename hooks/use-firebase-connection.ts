"use client"

import { useState, useEffect } from "react"
import { onSnapshot, doc, getFirestore } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export function useFirebaseConnection() {
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    const db = getFirestore()

    // Listen to the .info/connected document
    const unsubscribe = onSnapshot(
      doc(db, ".info", "connected"),
      (snapshot) => {
        const connected = snapshot.data()?.connected || false
        setIsConnected(connected)

        if (!connected) {
          toast({
            title: "Connection Issue",
            description: "You're currently offline. The app will sync when connection is restored.",
            variant: "destructive",
            duration: 5000,
          })
        } else if (connected && !isConnected) {
          // Only show the reconnected toast if we were previously disconnected
          toast({
            title: "Connected",
            description: "Your connection has been restored.",
            duration: 3000,
          })
        }
      },
      (error) => {
        console.error("Error monitoring connection status:", error)
        setIsConnected(false)
      },
    )

    return () => unsubscribe()
  }, [isConnected])

  return { isConnected }
}
