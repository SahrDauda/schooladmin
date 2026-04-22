"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Shield, User, Clock, Calendar, MessageSquare } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { useParams, useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  type: 'welcome' | 'password_change' | 'system' | 'info'
  read: boolean
  created_at: string
  admin_id: string
  action_url?: string
}

export default function NotificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState(false)

  const fetchNotification = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setNotification(data)

      if (data && !data.read) {
        markAsRead(data.id)
      }
    } catch (error) {
      console.error("Error fetching notification:", error)
      toast({
        title: "Error",
        description: "Failed to load notification",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(true)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      setNotification(prev => prev ? { ...prev, read: true } : null)
    } catch (error) {
      console.error("Error marking as read:", error)
    } finally {
      setMarkingAsRead(false)
    }
  }

  useEffect(() => {
    if (id) fetchNotification()
  }, [id])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <User className="h-6 w-6 text-green-600" />
      case 'password_change': return <Shield className="h-6 w-6 text-blue-600" />
      case 'system': return <Bell className="h-6 w-6 text-orange-600" />
      default: return <MessageSquare className="h-6 w-6 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'welcome': return <Badge variant="default" className="bg-green-100 text-green-800">Welcome</Badge>
      case 'password_change': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Security</Badge>
      case 'system': return <Badge variant="outline" className="bg-orange-100 text-orange-800">System</Badge>
      default: return <Badge variant="outline">Info</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!notification) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 text-center mt-12">
          <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">Notification Not Found</h2>
          <Button onClick={() => router.push("/notifications")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notifications
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const dateInfo = formatDate(notification.created_at)

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 mt-8 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/notifications")}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notifications
        </Button>

        <Card>
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="mt-1 p-2 bg-white rounded-lg border shadow-sm">
                  {getNotificationIcon(notification.type)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <CardTitle className="text-2xl">{notification.title}</CardTitle>
                    {getNotificationBadge(notification.type)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {dateInfo.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {dateInfo.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Message</h4>
              <p className="text-gray-800 text-lg whitespace-pre-wrap leading-relaxed">
                {notification.message}
              </p>
            </div>

            {notification.action_url && (
              <div className="pt-6 border-t">
                <Button 
                  onClick={() => window.location.href = notification.action_url!}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  View Related Content
                </Button>
              </div>
            )}

            <div className="pt-6 border-t grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Status</span>
                <Badge variant={notification.read ? "outline" : "destructive"}>
                  {notification.read ? "Read" : "Unread"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Notification ID</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{notification.id}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
