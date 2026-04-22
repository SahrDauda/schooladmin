"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, CheckCheck, Trash2, X, MessageSquare, Shield, User, Clock, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: 'welcome' | 'password_change' | 'system' | 'info'
  read: boolean
  created_at: string
  admin_id?: string
  recipient_type?: 'admin' | 'teacher' | 'parent' | 'mbsse' | 'system'
  recipient_id?: string
  action_url?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const fetchNotifications = async () => {
    const adminId = localStorage.getItem("adminId")
    if (!adminId) return

    setLoading(true)
    try {
      const { data: newNotifications, error: newError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_type', 'admin')
        .eq('recipient_id', adminId)
        .order('created_at', { ascending: false })

      const { data: legacyNotifications, error: legacyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })

      if (newError && legacyError) throw newError || legacyError

      const merged = new Map<string, Notification>()
      const allDocs = [...(newNotifications || []), ...(legacyNotifications || [])]

      for (const d of allDocs) {
        merged.set(d.id, d as Notification)
      }
      const list = Array.from(merged.values())
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setNotifications(list)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      console.error("Error marking as read:", error)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast({ title: "Success", description: "All notifications marked as read" })
    } catch (error) {
      console.error("Error marking all read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <User className="h-4 w-4 text-green-600" />
      case 'password_change': return <Shield className="h-4 w-4 text-blue-600" />
      case 'system': return <Bell className="h-4 w-4 text-orange-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'welcome': return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Welcome</Badge>
      case 'password_change': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">Security</Badge>
      case 'system': return <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">System</Badge>
      default: return <Badge variant="outline" className="text-xs">Info</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Notifications</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchNotifications}>Refresh</Button>
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>Mark all as read</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 rounded-lg border transition-colors cursor-pointer",
                        notification.read ? "bg-white border-gray-100" : "bg-blue-50/50 border-blue-100"
                      )}
                      onClick={() => {
                        setSelectedNotification(notification)
                        setIsDetailsModalOpen(true)
                        if (!notification.read) markAsRead(notification.id)
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className={cn("font-medium", !notification.read && "text-blue-900")}>
                                {notification.title}
                              </h4>
                              {getNotificationBadge(notification.type)}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(notification.created_at).date}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(notification.created_at).time}</span>
                            </div>
                          </div>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            disabled={markingAsRead === notification.id}
                            className="text-xs h-8"
                          >
                            {markingAsRead === notification.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                            ) : (
                              "Mark as read"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              Notification Details
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedNotification.title}</h3>
                {getNotificationBadge(selectedNotification.type)}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Sent on {new Date(selectedNotification.created_at).toLocaleString()}
              </div>
              {selectedNotification.action_url && (
                <div className="pt-4 border-t">
                  <Button onClick={() => window.location.href = selectedNotification.action_url!} className="w-full">
                    Take Action
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
