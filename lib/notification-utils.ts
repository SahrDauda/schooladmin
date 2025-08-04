import { doc, setDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CreateNotificationParams {
  adminId: string
  title: string
  message: string
  type: 'welcome' | 'password_change' | 'system' | 'info'
  action_url?: string
}

export async function createNotification({
  adminId,
  title,
  message,
  type,
  action_url
}: CreateNotificationParams) {
  try {
    const notificationId = `NOTIF_${Date.now().toString().slice(-6)}`
    const currentDate = new Date()
    
    const notificationData = {
      id: notificationId,
      admin_id: adminId,
      title,
      message,
      type,
      read: false,
      created_at: Timestamp.fromDate(currentDate),
      ...(action_url && { action_url })
    }

    await setDoc(doc(db, "notifications", notificationId), notificationData)
    
    console.log('Notification created:', notificationData)
    return notificationId
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function sendWelcomeNotification(adminId: string, adminName: string, adminEmail: string) {
  try {
    // Create notification in Firestore
    await createNotification({
      adminId,
      title: "Welcome to Skultɛk!",
      message: "Thank you for using Skultɛk School Management System. We're excited to have you on board!",
      type: "welcome",
      action_url: "/dashboard"
    })

    // Send welcome email
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'welcome',
        email: adminEmail,
        name: adminName,
        adminId
      }),
    })

    if (!emailResponse.ok) {
      console.error('Failed to send welcome email')
    }

    return true
  } catch (error) {
    console.error('Error sending welcome notification:', error)
    throw error
  }
}

export async function sendPasswordChangeNotification(adminId: string, adminName: string, adminEmail: string) {
  try {
    // Create notification in Firestore
    await createNotification({
      adminId,
      title: "Password Changed",
      message: "Your password was recently changed. If this wasn't you, please contact support immediately.",
      type: "password_change",
      action_url: "/profile"
    })

    // Send password change email
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'password_change',
        email: adminEmail,
        name: adminName,
        adminId
      }),
    })

    if (!emailResponse.ok) {
      console.error('Failed to send password change email')
    }

    return true
  } catch (error) {
    console.error('Error sending password change notification:', error)
    throw error
  }
} 