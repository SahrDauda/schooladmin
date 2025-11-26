"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState(true)
  const toastShown = useRef(false)

  useEffect(() => {
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
        // Simple check to Supabase
        try {
          const { error } = await supabase.from('schooladmin').select('count', { count: 'exact', head: true })
          if (!error) {
            setIsConnected(true)
          } else {
            // If error is network related
            if (error.message.includes('fetch')) {
              throw error
            }
            // Otherwise assume connected but maybe permission issue or other
            setIsConnected(true)
          }
        } catch (error) {
          console.error("Error during initial connection check:", error)
          setIsConnected(false)
          if (!toastShown.current) {
            toast({
              title: "Connection Issue",
              description: "Unable to connect to the database. Please check your internet connection.",
              variant: "destructive",
              duration: 5000,
            })
            toastShown.current = true
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

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isConnected }
}

