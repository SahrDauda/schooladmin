import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // 1. Check if user exists in schooladmin table
        const { data: admin, error: adminError } = await supabaseAdmin
            .from('schooladmin')
            .select('id, name')
            .or(`email.eq.${email},emailaddress.eq.${email}`)
            .single()

        if (adminError || !admin) {
            // For security, don't reveal if user exists
            console.log(`Forgot password requested for non-existent email: ${email}`)
            return NextResponse.json({ success: true, message: 'If your email is registered, you will receive a code.' })
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        // 3. Store OTP in verification_codes table
        const { error: upsertError } = await supabaseAdmin
            .from('verification_codes')
            .upsert({
                email,
                code: otp,
                expires_at: expiresAt.toISOString()
            }, { onConflict: 'email' })

        if (upsertError) {
            console.error('Error storing OTP:', upsertError)
            return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 })
        }

        // 4. Send email
        const gmailUser = process.env.GMAIL_USER
        const gmailPassword = process.env.GMAIL_APP_PASSWORD

        if (!gmailUser || !gmailPassword) {
            console.log('Gmail credentials not configured. Simulating email.')
            console.log(`OTP for ${email}: ${otp}`)
            return NextResponse.json({
                success: true,
                message: 'Email simulated (check console)',
                debug: { otp } // Remove in production
            })
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPassword
            }
        })

        const mailOptions = {
            from: `"Skultɛk Support" <${gmailUser}>`,
            to: email,
            subject: 'Password Reset Verification Code',
            text: `Your verification code is: ${otp}\n\nThis code will expire in 15 minutes.`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1E3A5F;">Password Reset Request</h2>
          <p>Hello ${admin.name || 'Admin'},</p>
          <p>You requested to reset your password. Please use the following verification code:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Skultɛk School Management System</p>
        </div>
      `
        }

        await transporter.sendMail(mailOptions)

        return NextResponse.json({ success: true, message: 'Verification code sent' })

    } catch (error: any) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
