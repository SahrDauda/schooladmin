"use client"

import { useState, useEffect, useRef } from "react"
import { onSnapshot, doc, getFirestore, getDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export function useFirebaseConnection() {
  const [isConnected, setIsConnected] = useState(true)
  const initialCheckDone = useRef(false)
  const toastShown = useRef(false)

  useEffect(() => {
    const db = getFirestore()

    // Initial check using navigator.onLine
    const checkInitialStatus = async () => {
      const isOnline = navigator.onLine

      if (!isOnline) {
        setIsConnected(false)
        if (!toastShown.current) {
          toast({
            title: "Connection Issue",
            description: "You're currently offline. The app will sync when connection is restored.",
            variant: "destructive",
            duration: 5000,
          })
          toastShown.current = true
        }
      } else {
        // Try to make a simple Firestore request to verify connection
        try {
          await getDoc(doc(db, ".info", "connected"))
          setIsConnected(true)
          initialCheckDone.current = true
        } catch (error) {
          console.error("Error during initial connection check:", error)
          // Only show toast if we're confident there's an issue
          if (error.code !== "permission-denied") {
            setIsConnected(false)
            if (!toastShown.current) {
              toast({
                title: "Firebase Connection Issue",
                description: "Unable to connect to the database. Please check your internet connection.",
                variant: "destructive",
                duration: 5000,
              })
              toastShown.current = true
            }
          }
        }
      }
    }

    checkInitialStatus()

    // Add browser online/offline event listeners
    const handleOnline = () => {
      setIsConnected(true)
      toastShown.current = false
      toast({
        title: "Connected",
        description: "Your connection has been restored.",
        duration: 3000,
      })
    }

    const handleOffline = () => {
      setIsConnected(false)
      if (!toastShown.current) {
        toast({
          title: "Connection Issue",
          description: "You're currently offline. The app will sync when connection is restored.",
          variant: "destructive",
          duration: 5000,
        })
        toastShown.current = true
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Listen to the .info/connected document as a backup
    const unsubscribe = onSnapshot(
      doc(db, ".info", "connected"),
      (snapshot) => {
        const connected = snapshot.data()?.connected || false

        // Only update if the initial check is done and there's a change
        if (initialCheckDone.current && connected !== isConnected) {
          setIsConnected(connected)

          if (!connected && !toastShown.current) {
            toast({
              title: "Connection Issue",
              description: "You're currently offline. The app will sync when connection is restored.",
              variant: "destructive",
              duration: 5000,
            })
            toastShown.current = true
          } else if (connected) {
            toastShown.current = false
            toast({
              title: "Connected",
              description: "Your connection has been restored.",
              duration: 3000,
            })
          }
        }
      },
      (error) => {
        console.error("Error monitoring connection status:", error)
        // Only update if we're confident there's an issue
        if (error.code !== "permission-denied" && initialCheckDone.current) {
          setIsConnected(false)
          if (!toastShown.current) {
            toast({
              title: "Firebase Connection Issue",
              description: "Error monitoring connection status.",
              variant: "destructive",
              duration: 5000,
            })
            toastShown.current = true
          }
        }
      },
    )

    return () => {
      unsubscribe()
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isConnected }
}
