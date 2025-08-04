import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, email, name, adminId } = req.body

    if (!email || !type) {
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

      default:
        return res.status(400).json({ error: 'Invalid notification type' })
    }

    // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll simulate sending the email
    console.log('Email would be sent:', {
      to: email,
      subject,
      message
    })

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      data: { email, subject, type }
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return res.status(500).json({ error: 'Failed to send email' })
  }
} 