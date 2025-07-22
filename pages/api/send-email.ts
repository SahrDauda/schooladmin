import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { to, subject, body } = req.body

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'schooltech24@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, // Use your Gmail app password from env
      },
    })

    await transporter.sendMail({
      from: 'schooltech24@gmail.com',
      to,
      subject,
      text: body,
    })

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Error sending email:', error)
    res.status(500).json({ success: false, error: error.message })
  }
} 