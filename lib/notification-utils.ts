import { doc, setDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Expanded recipient types to support cross-module notifications (admins, teachers, parents, MBSSE, etc.)
type RecipientType = "admin" | "teacher" | "parent" | "mbsse" | "system"

enum NotificationType {
  Welcome = "welcome",
  PasswordChange = "password_change",
  System = "system",
  Info = "info",
}

interface CreateNotificationParams {
  // New unified recipient model
  recipient_type?: RecipientType
  recipient_id?: string

  // Back-compat inputs (will be mapped to recipient_type/id)
  adminId?: string
  teacherId?: string

  // Core payload
  title: string
  message: string
  type: NotificationType | 'welcome' | 'password_change' | 'system' | 'info'
  action_url?: string

  // Optional sender metadata for cross-module notifications
  sender_type?: RecipientType
  sender_id?: string
}

// Export the createNotification function for manual testing with unified recipient model
export async function createNotification(params: CreateNotificationParams) {
  try {
    const {
      recipient_type: providedRecipientType,
      recipient_id: providedRecipientId,
      adminId,
      teacherId,
      title,
      message,
      type,
      action_url,
      sender_type,
      sender_id,
    } = params

    // Resolve recipient from unified or legacy fields
    let recipient_type: RecipientType | undefined = providedRecipientType
    let recipient_id: string | undefined = providedRecipientId

    if (!recipient_type || !recipient_id) {
      if (adminId) {
        recipient_type = "admin"
        recipient_id = adminId
      } else if (teacherId) {
        recipient_type = "teacher"
        recipient_id = teacherId
      }
    }

    if (!recipient_type || !recipient_id) {
      throw new Error("recipient_type and recipient_id (or adminId/teacherId) are required")
    }

    const notificationId = `NOTIF_${Date.now().toString().slice(-6)}`
    const currentDate = new Date()

    const notificationData: Record<string, any> = {
      id: notificationId,
      recipient_type,
      recipient_id,
      title,
      message,
      type,
      read: false,
      created_at: Timestamp.fromDate(currentDate),
      ...(action_url && { action_url }),
      ...(sender_type && { sender_type }),
      ...(sender_id && { sender_id }),
    }

    // Backward compatibility: also persist legacy fields so existing client queries still work
    if (recipient_type === "admin") {
      notificationData.admin_id = recipient_id
    }
    if (recipient_type === "teacher") {
      notificationData.teacher_id = recipient_id
    }

    await setDoc(doc(db, "notifications", notificationId), notificationData)
    return notificationId
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function sendWelcomeNotification(adminId: string, adminName: string, adminEmail: string) {
  try {
    // Create notification in Firestore for admin
    const notificationId = await createNotification({
      recipient_type: "admin",
      recipient_id: adminId,
      title: "Welcome to Skultɛk!",
      message: "Thank you for using Skultɛk School Management System. We're excited to have you on board!",
      type: NotificationType.Welcome,
      action_url: "/dashboard",
      sender_type: "system",
    })

    // Send welcome email
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'welcome', email: adminEmail, name: adminName, adminId }),
    })

    // Best-effort logging
    try { await emailResponse.json() } catch { }

    return notificationId
  } catch (error) {
    console.error('Error sending welcome notification:', error)
    throw error
  }
}

export async function sendPasswordChangeNotification(adminId: string, adminName: string, adminEmail: string) {
  try {
    const notificationId = await createNotification({
      recipient_type: "admin",
      recipient_id: adminId,
      title: "Password Changed",
      message: "Your password was recently changed. If this wasn't you, please contact support immediately.",
      type: NotificationType.PasswordChange,
      action_url: "/profile",
      sender_type: "system",
    })

    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'password_change', email: adminEmail, name: adminName, adminId }),
    })

    try { await emailResponse.json() } catch { }

    return notificationId
  } catch (error) {
    console.error('Error sending password change notification:', error)
    throw error
  }
}

// Admin-originated notification to a teacher about subject assignment
export async function sendTeacherSubjectAssignmentNotification(
  teacherId: string,
  teacherName: string,
  teacherEmail: string,
  subjectName: string,
  subjectCode: string
) {
  try {
    const notificationId = await createNotification({
      recipient_type: "teacher",
      recipient_id: teacherId,
      title: "Subject Assignment",
      message: `You have been assigned to teach ${subjectName} (${subjectCode}). Please review your teaching schedule and prepare accordingly.`,
      type: NotificationType.System,
      action_url: "/subjects",
      sender_type: "admin",
    })

    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'teacher_assignment',
        email: teacherEmail,
        name: teacherName,
        teacherId,
        subjectName,
        subjectCode,
      }),
    })

    try { await emailResponse.json() } catch { }

    return notificationId
  } catch (error) {
    console.error('Error sending teacher subject assignment notification:', error)
    throw error
  }
}

// Admin-originated notification to a teacher about class assignment
export async function sendTeacherClassAssignmentNotification(
  teacherId: string,
  teacherName: string,
  teacherEmail: string,
  className: string,
  classLevel: string
) {
  try {
    const notificationId = await createNotification({
      recipient_type: "teacher",
      recipient_id: teacherId,
      title: "Class Assignment",
      message: `You have been assigned as the class teacher for ${className} (${classLevel}). Please review your class details and prepare for the academic year.`,
      type: NotificationType.System,
      action_url: "/classes",
      sender_type: "admin",
    })

    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'teacher_class_assignment',
        email: teacherEmail,
        name: teacherName,
        teacherId,
        className,
        classLevel,
      }),
    })

    try { await emailResponse.json() } catch { }

    return notificationId
  } catch (error) {
    console.error('Error sending teacher class assignment notification:', error)
    throw error
  }
}

// Test function to verify notification system
export async function testNotificationSystem(adminId: string, adminName: string, adminEmail: string) {
  try {
    const notificationId = await createNotification({
      recipient_type: "admin",
      recipient_id: adminId,
      title: "Test Notification",
      message: "This is a test notification to verify the system is working.",
      type: NotificationType.System,
      action_url: "/dashboard",
      sender_type: "system",
    })

    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'welcome', email: adminEmail, name: adminName, adminId }),
    })

    try { await emailResponse.json() } catch { }

    return notificationId
  } catch (error) {
    console.error('Test notification system failed:', error)
    throw error
  }
} 