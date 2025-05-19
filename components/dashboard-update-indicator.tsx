"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { useSyncSettings } from "@/hooks/use-sync-settings"
import { useFirebaseConnection } from "@/hooks/use-firebase-connection"

export function DashboardUpdateIndicator() {
  const { settings } = useSyncSettings()
  const { isConnected } = useFirebaseConnection()
  const [formattedTime, setFormattedTime] = useState<string>("Never")

  useEffect(() => {
    const formatLastUpdated = () => {
      if (!settings.lastSyncTime) {
        setFormattedTime("Never")
        return
      }

      const lastSync = new Date(settings.lastSyncTime)
      const now = new Date()
      const diffMs = now.getTime() - lastSync.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) {
        setFormattedTime("Just now")
      } else if (diffMins < 60) {
        setFormattedTime(`${diffMins} minute${diffMins > 1 ? "s" : ""} ago`)
      } else if (diffMins < 1440) {
        // less than a day
        const hours = Math.floor(diffMins / 60)
        setFormattedTime(`${hours} hour${hours > 1 ? "s" : ""} ago`)
      } else {
        const days = Math.floor(diffMins / 1440)
        setFormattedTime(`${days} day${days > 1 ? "s" : ""} ago`)
      }
    }

    formatLastUpdated()

    // Update the "last updated" text every minute
    const interval = setInterval(formatLastUpdated, 60000)

    return () => clearInterval(interval)
  }, [settings.lastSyncTime])

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>
        {isConnected ? "Data updated " : "Last synced "}
        {formattedTime}
      </span>
    </div>
  )
}
