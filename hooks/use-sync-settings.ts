"use client"

import { useState, useEffect } from "react"

interface SyncSettings {
  autoSyncEnabled: boolean
  syncInterval: string
  lastSyncTime: number | null
}

const DEFAULT_SETTINGS: SyncSettings = {
  autoSyncEnabled: true,
  syncInterval: "5", // 5 minutes
  lastSyncTime: null,
}

export function useSyncSettings() {
  const [settings, setSettings] = useState<SyncSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedSettings = localStorage.getItem("sync-settings")
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error("Error loading sync settings:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<SyncSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sync-settings", JSON.stringify(updatedSettings))
      } catch (error) {
        console.error("Error saving sync settings:", error)
      }
    }
  }

  return {
    settings,
    updateSettings,
    isLoaded,
  }
}
