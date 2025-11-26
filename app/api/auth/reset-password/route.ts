import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
    try {
        const { email, otp, newPassword } = await request.json()

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 })
        }

        // 1. Verify OTP
        const { data: verification, error: verificationError } = await supabaseAdmin
            .from('verification_codes')
            .select('*')
            .eq('email', email)
            .eq('code', otp)
            .single()

        if (verificationError || !verification) {
            return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
        }

        // Check expiration
        if (new Date(verification.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 })
        }

        // 2. Find Admin ID
        const { data: admin, error: adminError } = await supabaseAdmin
            .from('schooladmin')
            .select('id')
            .or(`email.eq.${email},emailaddress.eq.${email}`)
            .single()

        if (adminError || !admin) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 3. Update Password in Supabase Auth
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            admin.id,
            { password: newPassword }
        )

        if (updateError) {
            console.error('Password update error:', updateError)
            return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
        }

        // 4. Update hasloggedinbefore flag
        await supabaseAdmin
            .from('schooladmin')
            .update({ hasloggedinbefore: true })
            .eq('id', admin.id)

        // 5. Delete used OTP
        await supabaseAdmin
            .from('verification_codes')
            .delete()
            .eq('email', email)

        return NextResponse.json({ success: true, message: 'Password updated successfully' })

    } catch (error: any) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
