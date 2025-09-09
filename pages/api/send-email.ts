import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, email, name, adminId } = req.body

    console.log('Email API received request:', { type, email, name, adminId })

    if (!email || !type) {
      console.error('Missing required fields:', { email, type })
      return res.status(400).json({ error: 'Email and type are required' })
    }

    let subject = ''
    let message = ''

    switch (type) {
      case 'welcome':
        subject = 'Welcome to Skultɛk School Management System!'
        message = `
          Dear ${name || 'Admin'},

          Welcome to Skultɛk! We're excited to have you on board our school management system.

          Thank you for choosing Skultɛk for your school administration needs. Our platform is designed to make school management efficient, secure, and user-friendly.

          Here are some key features you can explore:
          • Student Management
          • Teacher Management  
          • Attendance Tracking
          • Grade Management
          • Timetable Management
          • Reports and Analytics

          If you have any questions or need assistance, please don't hesitate to contact our support team.

          Best regards,
          The Skultɛk Team
        `
        break

      case 'password_change':
        subject = 'Password Changed - Skultɛk Security Alert'
        message = `
          Dear ${name || 'Admin'},

          Your password was recently changed in the Skultɛk School Management System.

          If this was you, no action is required. However, if you did not make this change, please:

          1. Change your password immediately
          2. Contact our support team
          3. Review your account security

          For security reasons, we recommend:
          • Using a strong, unique password
          • Enabling two-factor authentication if available
          • Regularly updating your password

          If you need to reset your password, please visit the login page and use the "Forgot Password" option.

          Best regards,
          The Skultɛk Security Team
        `
        break

      case 'teacher_assignment':
        const { subjectName, subjectCode } = req.body
        subject = 'Subject Assignment - Skultɛk School Management System'
        message = `
          Dear ${name || 'Teacher'},

          You have been assigned to teach ${subjectName} (${subjectCode}) in the Skultɛk School Management System.

          Please review your teaching schedule and prepare accordingly. You can access your assigned subjects through your teacher dashboard.

          If you have any questions about your assignment, please contact the school administration.

          Best regards,
          The Skultɛk School Administration Team
        `
        break

      case 'teacher_unassignment':
        const { subjectName: unassignSubjectName, subjectCode: unassignSubjectCode } = req.body
        subject = 'Subject Unassignment - Skultɛk School Management System'
        message = `
          Dear ${name || 'Teacher'},

          You have been unassigned from teaching ${unassignSubjectName} (${unassignSubjectCode}) in the Skultɛk School Management System.

          If you have any questions about this change, please contact the school administration.

          Best regards,
          The Skultɛk School Administration Team
        `
        break

      case 'teacher_class_assignment':
        const { className, classLevel } = req.body
        subject = 'Class Assignment - Skultɛk School Management System'
        message = `
          Dear ${name || 'Teacher'},

          You have been assigned as the class teacher for ${className} (${classLevel}) in the Skultɛk School Management System.

          Please review your class details and prepare for the academic year. You can access your assigned classes through your teacher dashboard.

          If you have any questions about your assignment, please contact the school administration.

          Best regards,
          The Skultɛk School Administration Team
        `
        break

      case 'custom':
        const { subject: customSubject, message: customMessage } = req.body
        subject = customSubject || 'Notification from Skultɛk'
        message = customMessage || 'You have received a notification from Skultɛk School Management System.'
        break

      default:
        return res.status(400).json({ error: 'Invalid notification type' })
    }

    // Check if Gmail credentials are configured
    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPassword) {
      console.log('Gmail credentials not configured, simulating email send...')
      console.log('Email would be sent:', {
        to: email,
        subject,
        message: message.substring(0, 100) + '...'
      })

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      return res.status(200).json({
        success: true,
        message: 'Email simulated (Gmail not configured)',
        data: { email, subject, type },
        warning: 'Email was simulated because Gmail credentials are not configured'
      })
    }

    // Create transporter for email sending
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    })

    // Email options
    const mailOptions = {
      from: `"Skultɛk" <${gmailUser}>`,
      to: email,
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>')
    }

    console.log('Attempting to send email:', {
      to: email,
      subject,
      from: mailOptions.from
    })

    // Send the email
    const info = await transporter.sendMail(mailOptions)

    console.log('Email sent successfully:', info.messageId)

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: { email, subject, type, messageId: info.messageId }
    })

  } catch (error) {
    console.error('Email sending error:', error)

    // If email sending fails, still return success but log the error
    // This prevents the notification system from breaking if email fails
    console.log('Email sending failed, but continuing with notification...')

    return res.status(200).json({
      success: true,
      message: 'Notification created successfully (email may have failed)',
      data: { email: req.body.email, type: req.body.type },
      warning: 'Email sending failed but notification was created'
    })
  }
} 