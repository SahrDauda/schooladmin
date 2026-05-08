import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { 
      email, password, adminName, gender, 
      schoolName, schoolStage, schoolAddress, emisCode, contactPhone 
    } = await req.json();

    if (!email || !password || !schoolName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create School
      const school = await (tx as any).schools.create({
        data: {
          name: schoolName,
          stage: schoolStage,
          address: schoolAddress,
          emis_code: emisCode,
          contact_email: email,
          contact_phone: contactPhone,
          school_configs: {
            create: {
              passing_mark: 50,
              grading_system: 'WASSCE',
              term_remarks_enabled: true
            }
          }
        }
      });

      // 2. Create Supabase Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          adminname: adminName,
          role: 'Admin',
          school_id: school.id
        }
      });

      if (authError) throw authError;

      // 3. Create Default Academic Session
      const currentYear = new Date().getFullYear();
      const session = await (tx as any).academic_sessions.create({
        data: {
          name: `${currentYear}/${currentYear + 1}`,
          start_date: new Date(currentYear, 8, 1), // Sept 1st
          end_date: new Date(currentYear + 1, 6, 31), // July 31st
          is_current: true,
          school_id: school.id,
          terms: {
            create: [
              { name: 'Term 1', is_current: true, start_date: new Date(currentYear, 8, 1), end_date: new Date(currentYear, 11, 15) },
              { name: 'Term 2', is_current: false, start_date: new Date(currentYear + 1, 0, 10), end_date: new Date(currentYear + 1, 3, 10) },
              { name: 'Term 3', is_current: false, start_date: new Date(currentYear + 1, 4, 1), end_date: new Date(currentYear + 1, 6, 31) }
            ]
          }
        }
      });

      // 4. Create SchoolAdmin profile
      const adminProfile = await (tx as any).schooladmin.create({
        data: {
          id: authData.user.id,
          email: email,
          adminname: adminName,
          gender: gender,
          role: 'Admin',
          school_id: school.id,
          schoolname: schoolName,
          status: 'Active',
          hasloggedinbefore: false
        }
      });

      return { school, adminProfile, session };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Registration Failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
