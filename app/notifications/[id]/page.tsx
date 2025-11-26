"use client"

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Mail, Shield, User, Clock, Calendar } from "lucide-react"
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
  <div className = "flex justify-center items-center py-8">
            <div className = "animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div >
          </div >
        </div >
      </DashboardLayout >
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