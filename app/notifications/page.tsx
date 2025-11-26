"use client"

import { useState, useEffect, useRef } from "react"
variant = "ghost"
size = "sm"
onClick = {(e) => {
  e.stopPropagation()
  markAsRead(notification.id)
}}
disabled = { markingAsRead === notification.id}
className = "text-xs"
  >
  { markingAsRead === notification.id ? (
  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
) : (
  <X className="h-3 w-3" />
)}
                          </Button >
                        )}
                      </div >
                    </div >
                  ))}
                </div >
              </ScrollArea >
            )}
          </CardContent >
        </Card >
      </div >

  {/* Notification Details Modal */ }
  < Dialog open = { isDetailsModalOpen } onOpenChange = { setIsDetailsModalOpen } >
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {selectedNotification && getNotificationIcon(selectedNotification.type)}
          Notification Details
        </DialogTitle>
      </DialogHeader>

      {selectedNotification && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold">{selectedNotification.title}</h3>
              {getNotificationBadge(selectedNotification.type)}
              {!selectedNotification.read && (
                <Badge variant="destructive" className="text-xs">
                  Unread
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Message</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>
            </div>



            {selectedNotification.action_url && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Related Action</h4>
                <Button
                  onClick={() => window.location.href = selectedNotification.action_url!}
                  className="w-full sm:w-auto"
                >
                  View Related Content
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </DialogContent>
      </Dialog >
    </DashboardLayout >
  )
} 