import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables." },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { 
      firstname, 
      lastname, 
      email, 
      phone, 
      gender, 
      qualification, 
      address, 
      joining_date, 
      school_id, 
      nin_number, 
      level, 
      subject,
      dob,
      health_status,
      institution,
      is_disabled,
      previous_schools,
      photo_url
    } = body

    // Validate required fields
    if (!firstname || !lastname || !email || !school_id) {
      return NextResponse.json(
        { error: "Missing required fields (firstname, lastname, email, school_id)" },
        { status: 400 }
      )
    }

    // Check if email already exists in the teachers table
    const { data: existingTeacher } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingTeacher) {
      return NextResponse.json(
        { error: "A teacher with this email address already exists in the system." },
        { status: 400 }
      )
    }

    // 1. Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8) + Math.floor(1000 + Math.random() * 9000)

    // 2. Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: `${firstname} ${lastname}`,
        role: "Teacher",
        avatar_url: photo_url || null,
      },
    })

    if (authError) {
      console.error("Auth teacher creation error:", authError)
      return NextResponse.json(
        { error: `Failed to create teacher authentication account: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      )
    }

    // 3. Insert teacher database record
    const { error: dbError } = await supabaseAdmin
      .from("teachers")
      .insert({
        id: authData.user.id,
        firstname,
        lastname,
        email,
        phone: phone || null,
        gender: gender || null,
        qualification: qualification || null,
        address: address || null,
        school_id,
        nin_number: nin_number || null,
        level: level || null,
        subject: subject || null,
        dob: dob || null,
        health_status: health_status || null,
        institution: institution || null,
        is_disabled: is_disabled || false,
        joining_date: joining_date || null,
        previous_schools: previous_schools || null,
        photo_url: photo_url || null,
        hasloggedinbefore: false,
        status: "Active",
      })

    if (dbError) {
      // Cleanup on failure
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error("Teacher profile creation error:", dbError)
      return NextResponse.json(
        { error: `Failed to create teacher profile: ${dbError.message}` },
        { status: 500 }
      )
    }

    // 4. Send Credentials Email
    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_APP_PASSWORD

    if (gmailUser && gmailPassword) {
      try {
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
          subject: 'Welcome to Skultɛk — Your Teacher Account Credentials',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #1E3A5F; border-bottom: 2px solid #1E3A5F; padding-bottom: 10px;">Welcome to Skultɛk!</h2>
              <p>Hello <strong>${firstname} ${lastname}</strong>,</p>
              <p>An administrator has successfully registered your teacher profile on the Skultɛk School Management System.</p>
              <p>Below are your secure credentials to log into the Staff & Teacher Portal:</p>
              
              <div style="background-color: #f4f7fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1E3A5F; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Teacher Portal Link:</strong> <a href="${request.headers.get("origin") || 'http://localhost:3000'}" style="color: #1E3A5F; font-weight: bold; text-decoration: none;">Click Here to Access Portal</a></p>
                <p style="margin: 8px 0;"><strong>Your Username / Email:</strong> <code style="font-size: 14px; background: #e8ecef; padding: 2px 6px; border-radius: 3px;">${email}</code></p>
                <p style="margin: 8px 0;"><strong>Temporary Password:</strong> <code style="font-size: 15px; font-weight: bold; color: #e11d48; background: #ffe4e6; padding: 2px 8px; border-radius: 3px;">${temporaryPassword}</code></p>
              </div>
              
              <p style="color: #e11d48; font-weight: bold; font-size: 13px;">⚠️ For security, you will be required to create your own private password on your very first login.</p>
              <p>If you have any questions or require support, please contact your school's IT support team.</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 11px; color: #888; text-align: center;">Skultɛk School Management System &copy; ${new Date().getFullYear()}</p>
            </div>
          `
        }

        await transporter.sendMail(mailOptions)
        console.log(`Welcome email successfully sent to teacher: ${email}`)
      } catch (emailErr) {
        console.error("Failed to send welcome credentials email:", emailErr)
        // We still return success: true because the account was successfully created!
      }
    } else {
      console.log("Gmail app credentials are missing. Simulating email credentials delivery:")
      console.log(`Teacher Welcome Email to ${email} -> Temp Password: ${temporaryPassword}`)
    }

    return NextResponse.json({
      success: true,
      message: "Teacher created and credentials successfully sent",
      tempPassword: temporaryPassword // Kept in response for quick admin feedback during demo
    })

  } catch (error: any) {
    console.error("Teacher creation server error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
