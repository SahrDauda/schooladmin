import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set.' },
      { status: 500 }
    )
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Try schooladmin table first
    const { error: adminErr } = await supabaseAdmin
      .from('schooladmin')
      .update({ hasloggedinbefore: true })
      .eq('id', userId)

    if (!adminErr) {
      return NextResponse.json({ success: true })
    }

    // Fall back to teachers table
    const { error: teacherErr } = await supabaseAdmin
      .from('teachers')
      .update({ hasloggedinbefore: true })
      .eq('id', userId)

    if (!teacherErr) {
      return NextResponse.json({ success: true })
    }

    // Neither table had a matching row — log both errors and return 404
    console.error('[complete-first-login] schooladmin error:', adminErr)
    console.error('[complete-first-login] teachers error:', teacherErr)
    return NextResponse.json(
      { error: 'User not found in schooladmin or teachers tables.' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('[complete-first-login] unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
