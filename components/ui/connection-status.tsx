"use client"

import { useFirebaseConnection } from "@/hooks/use-firebase-connection"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ConnectionStatus() {
  const { isConnected } = useFirebaseConnection()
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (isConnected) return null

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Force reload the page
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-amber-800 shadow-md">
      <WifiOff className="h-4 w-4" />
      <span className="text-xs font-medium">Offline Mode</span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={handleRefresh} disabled={isRefreshing}>
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh connection</span>
      </Button>
    </div>
  )
}
