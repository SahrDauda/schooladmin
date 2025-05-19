"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useOfflineStorage } from "@/hooks/use-offline-storage"
import { useFirebaseConnection } from "@/hooks/use-firebase-connection"
import { useSyncSettings } from "@/hooks/use-sync-settings"
import { Download, RefreshCw, WifiOff, Clock, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SyncManagerProps {
  schoolId: string
}

export function SyncManager({ schoolId }: SyncManagerProps) {
  const { isConnected } = useFirebaseConnection()
  const { syncPendingOperations, downloadAllData, isSyncing, lastSyncTime, db } = useOfflineStorage()
  const { settings, updateSettings, isLoaded } = useSyncSettings()
  const [pendingCount, setPendingCount] = useState(0)
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null)
  const lastSyncAttempt = useRef<number>(0)
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Extract settings for easier access
  const { autoSyncEnabled, syncInterval } = settings

  // Check for pending operations
  useEffect(() => {
    if (!isLoaded) return

    const checkPendingOps = async () => {
      if (!db) return

      try {
        const pendingOps = await db.getAll("pending_operations")
        setPendingCount(pendingOps.length)
      } catch (error) {
        console.error("Error checking pending operations:", error)
      }
    }

    checkPendingOps()

    // Set up interval to check periodically
    const interval = setInterval(checkPendingOps, 30000)

    return () => clearInterval(interval)
  }, [db, isSyncing, isLoaded])

  // Setup background synchronization
  useEffect(() => {
    if (!isLoaded) return

    // Clear existing timer if it exists
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
      syncTimerRef.current = null
    }

    // Don't set up sync if auto-sync is disabled
    if (!autoSyncEnabled) {
      setNextSyncTime(null)
      return
    }

    const intervalMinutes = Number.parseInt(syncInterval, 10)
    const intervalMs = intervalMinutes * 60 * 1000

    // Set next sync time
    const next = new Date(Date.now() + intervalMs)
    setNextSyncTime(next)

    // Set up background sync timer
    syncTimerRef.current = setTimeout(async () => {
      if (isConnected) {
        console.log("Running background sync...")
        await runBackgroundSync()
      }

      // Reset the timer for the next sync
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }

      // Only show notification if we had pending changes and they were synced
      if (pendingCount > 0 && isConnected) {
        toast({
          title: "Background Sync",
          description: "Your changes have been synced with the server",
        })
      }
    }, intervalMs)

    // Cleanup
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [autoSyncEnabled, syncInterval, isConnected, pendingCount, isLoaded])

  // Also sync when connection is restored
  useEffect(() => {
    if (!isLoaded) return

    if (isConnected && pendingCount > 0 && !isSyncing) {
      // Throttle sync attempts to prevent multiple syncs
      const now = Date.now()
      if (now - lastSyncAttempt.current > 30000) {
        // 30 seconds cooldown
        lastSyncAttempt.current = now
        runBackgroundSync()
      }
    }
  }, [isConnected, pendingCount, isSyncing, isLoaded])

  // Update last sync time in settings when it changes
  useEffect(() => {
    if (lastSyncTime && isLoaded) {
      updateSettings({ lastSyncTime: lastSyncTime.getTime() })
    }
  }, [lastSyncTime, isLoaded, updateSettings])

  // Background sync function
  const runBackgroundSync = async () => {
    if (!isConnected || isSyncing) return

    try {
      await syncPendingOperations()

      // Update next sync time
      if (autoSyncEnabled) {
        const intervalMinutes = Number.parseInt(syncInterval, 10)
        const next = new Date(Date.now() + intervalMinutes * 60 * 1000)
        setNextSyncTime(next)
      }
    } catch (error) {
      console.error("Background sync error:", error)
    }
  }

  const handleSync = async () => {
    if (!isConnected) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline. Changes will sync automatically when connection is restored.",
        variant: "destructive",
      })
      return
    }

    await syncPendingOperations()
    lastSyncAttempt.current = Date.now()
  }

  const handleDownload = async () => {
    if (!isConnected) {
      toast({
        title: "Offline",
        description: "Cannot download data while offline.",
        variant: "destructive",
      })
      return
    }

    await downloadAllData(schoolId)
  }

  const handleAutoSyncChange = (checked: boolean) => {
    updateSettings({ autoSyncEnabled: checked })
  }

  const handleSyncIntervalChange = (value: string) => {
    updateSettings({ syncInterval: value })
  }

  const formatTimeLeft = () => {
    if (!nextSyncTime) return "Not scheduled"

    const now = new Date()
    const diffMs = nextSyncTime.getTime() - now.getTime()

    if (diffMs <= 0) return "Syncing soon..."

    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)

    return `${diffMins}m ${diffSecs}s`
  }

  if (!isLoaded) {
    return null // Don't render until settings are loaded
  }

  return (
    <div className="flex flex-col gap-2">
      {!isConnected && (
        <div className="flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-amber-800">
          <WifiOff className="h-4 w-4" />
          <span className="text-xs font-medium">Offline Mode</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing || !isConnected || pendingCount === 0}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Sync{pendingCount > 0 ? ` (${pendingCount})` : ""}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isSyncing || !isConnected}
          className="flex items-center gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download</span>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-auto">
              <Settings className="h-3.5 w-3.5" />
              <span className="sr-only">Sync Settings</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Sync Settings</h4>
                <p className="text-sm text-muted-foreground">Configure automatic background synchronization</p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-sync" className="flex items-center gap-1">
                    <span>Auto-sync</span>
                  </Label>
                  <Switch id="auto-sync" checked={autoSyncEnabled} onCheckedChange={handleAutoSyncChange} />
                </div>

                <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="sync-interval">Sync interval</Label>
                  <Select value={syncInterval} onValueChange={handleSyncIntervalChange} disabled={!autoSyncEnabled}>
                    <SelectTrigger id="sync-interval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {autoSyncEnabled && nextSyncTime && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Next sync:</span>
                    <span>{formatTimeLeft()}</span>
                  </div>
                )}
              </div>

              {lastSyncTime && (
                <div className="text-xs text-muted-foreground">Last synced: {lastSyncTime.toLocaleString()}</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {autoSyncEnabled && nextSyncTime && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Next sync: {formatTimeLeft()}</span>
        </div>
      )}
    </div>
  )
}
