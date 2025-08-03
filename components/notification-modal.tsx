"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Mail, Shield, User, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: "welcome" | "password_change" | "system" | "info"
  timestamp: Date
  read: boolean
  action?: {
    type: "navigate" | "email"
    value: string
  }
}

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock notifications - in a real app, these would come from a database
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "Welcome to Skultɛk!",
        message: "Thank you for using Skultɛk School Management System. We're excited to have you on board!",
        type: "welcome",
        timestamp: new Date(),
        read: false,
        action: {
          type: "navigate",
          value: "/dashboard"
        }
      },
      {
        id: "2",
        title: "Password Changed",
        message: "Your password was recently changed. If this wasn't you, please contact support immediately.",
        type: "password_change",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        action: {
          type: "navigate",
          value: "/profile"
        }
      },
      {
        id: "3",
        title: "System Update",
        message: "New features have been added to the student management module.",
        type: "system",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true
      }
    ]
    setNotifications(mockNotifications)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    )

    // Handle action
    if (notification.action?.type === "navigate") {
      router.push(notification.action.value)
      onClose()
    } else if (notification.action?.type === "email") {
      // Handle email action
      toast({
        title: "Email Sent",
        description: "An email has been sent to your registered address.",
      })
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "welcome":
        return <User className="h-4 w-4 text-green-500" />
      case "password_change":
        return <Shield className="h-4 w-4 text-orange-500" />
      case "system":
        return <Bell className="h-4 w-4 text-blue-500" />
      default:
        return <Mail className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationBadge = (type: Notification["type"]) => {
    switch (type) {
      case "welcome":
        return <Badge variant="default" className="bg-green-500">Welcome</Badge>
      case "password_change":
        return <Badge variant="destructive">Security</Badge>
      case "system":
        return <Badge variant="secondary">System</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-[90%] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see important updates here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    notification.read 
                      ? "bg-muted/30 hover:bg-muted/50" 
                      : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          {getNotificationBadge(notification.type)}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
          }}>
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" onC