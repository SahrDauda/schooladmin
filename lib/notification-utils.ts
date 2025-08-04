import { doc, setDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CreateNotificationParams {
  adminId: string
  title: string
  message: string
  type: 'welcome' | 'password_change' | 'system' | 'info'
  action_url?: string
}

// Export the createNotification function for manual testing
export async function createNotification({
  adminId,
  title,
  message,
  type,
  action_url
}: CreateNotificationParams) {
  try {
    console.log('Creating notification with data:', { adminId, title, message, type, action_url })
    
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

    console.log('Saving notification to Firestore:', notificationData)
    await setDoc(doc(db, "notifications", notificationId), notificationData)
    
    console.log('Notification created successfully with ID:', notificationId)
    return notificationId
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function sendWelcomeNotification(adminId: string, adminName: string, adminEmail: string) {
  try {
    console.log('Creating welcome notification in Firestore...')
    
    // Create notification in Firestore
    const notificationId = await createNotification({
      adminId,
      title: "Welcome to Skultɛk!",
      message: "Thank you for using Skultɛk School Management System. We're excited to have you on board!",
      type: "welcome",
      action_url: "/dashboard"
    })
    
    console.log('Notification created with ID:', notificationId)

    // Send welcome email
    console.log('Sending welcome email to:', adminEmail)
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

    const emailResult = await emailResponse.json()
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send welcome email:', emailResponse.status, errorText)
    } else {
      console.log('Welcome email result:', emailResult)
      if (emailResult.warning) {
        console.warn('Email warning:', emailResult.warning)
      }
    }

    return true
  } catch (error) {
    console.error('Error sending welcome notification:', error)
    throw error
  }
}

export async function sendPasswordChangeNotification(adminId: string, adminName: string, adminEmail: string) {
  try {
    console.log('Creating password change notification in Firestore...')
    
    // Create notification in Firestore
    const notificationId = await createNotification({
      adminId,
      title: "Password Changed",
      message: "Your password was recently changed. If this wasn't you, please contact support immediately.",
      type: "password_change",
      action_url: "/profile"
    })
    
    console.log('Password change notification created with ID:', notificationId)

    // Send password change email
    console.log('Sending password change email to:', adminEmail)
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

    const emailResult = await emailResponse.json()
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send password change email:', emailResponse.status, errorText)
    } else {
      console.log('Password change email result:', emailResult)
      if (emailResult.warning) {
        console.warn('Email warning:', emailResult.warning)
      }
    }

    return true
  } catch (error) {
    console.error('Error sending password change notification:', error)
    throw error
  }
}

export async function sendTeacherSubjectAssignmentNotification(
  teacherId: string, 
  teacherName: string, 
  teacherEmail: string,
  subjectName: string,
  subjectCode: string
) {
  try {
    console.log('Creating teacher subject assignment notification...')
    
    // Create notification in Firestore
    const notificationId = await createNotification({
      adminId: teacherId,
      title: "Subject Assignment",
      message: `You have been assigned to teach ${subjectName} (${subjectCode}). Please review your teaching schedule and prepare accordingly.`,
      type: "system",
      action_url: "/subjects"
    })
    
    console.log('Teacher subject assignment notification created with ID:', notificationId)

    // Send email notification
    console.log('Sending subject assignment email to:', teacherEmail)
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'teacher_assignment',
        email: teacherEmail,
        name: teacherName,
        teacherId,
        subjectName,
        subjectCode
      }),
    })

    const emailResult = await emailResponse.json()
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send subject assignment email:', emailResponse.status, errorText)
    } else {
      console.log('Subject assignment email result:', emailResult)
      if (emailResult.warning) {
        console.warn('Email warning:', emailResult.warning)
      }
    }

    return true
  } catch (error) {
    console.error('Error sending teacher subject assignment notification:', error)
    throw error
  }
}

export async function sendTeacherClassAssignmentNotification(
  teacherId: string, 
  teacherName: string, 
  teacherEmail: string,
  className: string,
  classLevel: string
) {
  try {
    console.log('Creating teacher class assignment notification...')
    
    // Create notification in Firestore
    const notificationId = await createNotification({
      adminId: teacherId,
      title: "Class Assignment",
      message: `You have been assigned as the class teacher for ${className} (${classLevel}). Please review your class details and prepare for the academic year.`,
      type: "system",
      action_url: "/classes"
    })
    
    console.log('Teacher class assignment notification created with ID:', notificationId)

    // Send email notification
    console.log('Sending class assignment email to:', teacherEmail)
    const emailResponse = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'teacher_class_assignment',
        email: teacherEmail,
        name: teacherName,
        teacherId,
        className,
        classLevel
      }),
    })

    const emailResult = await emailResponse.json()
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send class assignment email:', emailResponse.status, errorText)
    } else {
      console.log('Class assignment email result:', emailResult)
      if (emailResult.warning) {
        console.warn('Email warning:', emailResult.warning)
      }
    }

    return true
  } catch (error) {
    console.error('Error sending teacher class assignment notification:', error)
    throw error
  }
}

// Test function to verify notification system
export async function testNotificationSystem(adminId: string, adminName: string, adminEmail: string) {
  try {
    console.log('Testing notification system...')
    
    // Test creating a notification
    const notificationId = await createNotification({
      adminId,
      title: "Test Notification",
      message: "This is a test notification to verify the system is working.",
      type: "system",
      action_url: "/dashboard"
    })
    
    console.log('Test notification created with ID:', notificationId)
    
    // Test sending an email
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
    
    const emailResult = await emailResponse.json()
    
    if (emailResponse.ok) {
      console.log('Test email result:', emailResult)
      if (emailResult.warning) {
        console.warn('Test email warning:', emailResult.warning)
      }
    } else {
      console.error('Test email failed:', emailResponse.status, emailResult)
    }
    
    return true
  } catch (error) {
    console.error('Test notification system failed:', error)
    throw error
  }
} 