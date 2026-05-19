import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminname, email, password, gender, role, schoolName, schoolStage } = body

    // Validate required fields
    if (!adminname || !email || !password || !schoolName || !schoolStage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 1. Create the school first
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({
        name: schoolName,
        stage: schoolStage,
      })
      .select()
      .single()

    if (schoolError) {
      console.error("School creation error:", schoolError)
      return NextResponse.json(
        { error: `Failed to create school: ${schoolError.message}` },
        { status: 500 }
      )
    }

    // 2. Create auth user with admin client (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for demo
      user_metadata: {
        name: adminname,
        role: role || "Principal",
      },
    })

    if (authError) {
      // Cleanup school if auth fails
      await supabaseAdmin.from("schools").delete().eq("id", schoolData.id)
      
      console.error("Auth creation error:", authError)
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      await supabaseAdmin.from("schools").delete().eq("id", schoolData.id)
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      )
    }

    // 3. Create schooladmin record
    const { error: adminError } = await supabaseAdmin
      .from("schooladmin")
      .insert({
        id: authData.user.id,
        email: email,
        adminname: adminname,
        gender: gender || null,
        role: role || "Principal",
        school_id: schoolData.id,
        schoolname: schoolName,
        hasloggedinbefore: false,
        status: "Active",
      })

    if (adminError) {
      // Cleanup on failure
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      await supabaseAdmin.from("schools").delete().eq("id", schoolData.id)
      
      console.error("Admin profile creation error:", adminError)
      return NextResponse.json(
        { error: `Failed to create admin profile: ${adminError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "School and admin created successfully",
      school: schoolData,
      adminId: authData.user.id,
    })

  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
