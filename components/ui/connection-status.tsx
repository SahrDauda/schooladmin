"use client"

import { useFirebaseConnection } from "@/hooks/use-firebase-connection"
import { WifiOff } from "lucide-react"

export function ConnectionStatus() {
  const { isConnected } = useFirebaseConnection()

  if (isConnected) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-amber-800 shadow-md">
      <WifiOff className="h-4 w-4" />
      <span className="text-xs font-medium">Offline Mode</span>
    </div>
  )
}
