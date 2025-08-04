"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Mail, Shield, User, Clock, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import DashboardLayout from "@/components/dashboard-layout"
import { useParams, useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  type: 'welcome' | 'password_change' | 'system' | 'info'
  read: boolean
  created_at: Timestamp
  admin_id: string
  action_url?: string
}

export default function NotificationDetailsPage() {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState(false)
  const params = useParams()
  const router = useRouter()
  const notificationId = params?.id as string

  useEffect(() => {
    if (notificationId) {
      fetchNotificationDetails(notificationId)
    }
  }, [notificationId])

  const fetchNotificationDetails = async (id: string) => {
    setLoading(true)
    try {
      const notificationDoc = await getDoc(doc(db, "notifications", id))
      
      if (notificationDoc.exists()) {
        const notificationData = {
          id: notificationDoc.id,
          ...notificationDoc.data()
        } as Notification
        
        setNotification(notificationData)
        
        // Mark as read if not already read
        if (!notificationData.read) {
          await markAsRead(id)
        }
      } else {
        toast({
          title: "Error",
          description: "Notification not found",
          variant: "destructive",
        })
        router.push("/notifications")
      }
    } catch (error) {
      console.error("Error fetching notification details:", error)
      toast({
        title: "Error",
        description: "Failed to load notification details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(true)
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      })
      
      setNotification(prev => prev ? { ...prev, read: true } : null)
      
      toast({
        title: "Success",
        description: "Notification marked as read",
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    } finally {
      setMarkingAsRead(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <User className="h-6 w-6 text-green-600" />
      case 'password_change':
        return <Shield className="h-6 w-6 text-blue-600" />
      case 'system':
        return <Bell className="h-6 w-6 text-orange-600" />
      default:
        return <Mail className="h-6 w-6 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Badge variant="default" className="bg-green-100 text-green-800">Welcome</Badge>
      case 'password_change':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Security</Badge>
      case 'system':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">System</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate()
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString()
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!notification) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Notification Not Found</h2>
              <p className="text-muted-foreground mb-4">The notification you're looking for doesn't exist.</p>
              <Button onClick={() => router.push("/notifications")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notifications
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const dateInfo = formatDate(notification.created_at)

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push("/notifications")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Notifications
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{notification.title}</CardTitle>
                    {getNotificationBadge(notification.type)}
                    {!notification.read && (
                      <Badge variant="destructive" className="text-xs">
                        Unread
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {dateInfo.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {dateInfo.time}
                    </div>
                  </div>
                </div>
              </div>
              {!notification.read && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  disabled={markingAsRead}
                >
                  {markingAsRead ? "Marking..." : "Mark as Read"}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Message</h3>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {notification.message}
                </div>
              </div>
            </div>

            {notification.action_url && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Related Action</h3>
                <Button 
                  onClick={() => window.location.href = notification.action_url!}
                  className="w-full sm:w-auto"
                >
                  View Related Content
                </Button>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Notification Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Notification ID:</span>
                  <p className="text-gray-900 font-mono">{notification.id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Type:</span>
                  <p className="text-gray-900 capitalize">{notification.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className="text-gray-900">{notification.read ? "Read" : "Unread"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created:</span>
                  <p className="text-gray-900">{dateInfo.full}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 