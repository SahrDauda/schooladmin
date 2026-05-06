import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
  }

  try {
    // 1. Check schooladmin
    const schoolAdmin = await (prisma as any).schooladmin.findUnique({
      where: { id: userId }
    });

    if (schoolAdmin) {
      return NextResponse.json({
        success: true,
        role: schoolAdmin.role || 'Admin',
        school_id: schoolAdmin.school_id,
        hasloggedinbefore: schoolAdmin.hasloggedinbefore ?? false
      });
    }

    // 2. Check teachers
    const teacher = await prisma.teachers.findUnique({
      where: { id: userId }
    });

    if (teacher) {
      return NextResponse.json({
        success: true,
        role: 'Teacher',
        school_id: teacher.school_id,
        hasloggedinbefore: teacher.hasloggedinbefore ?? false
      });
    }

    // 3. Fallback to email for teachers
    if (email) {
      const teacherByEmail = await prisma.teachers.findFirst({
        where: { email: email.trim() }
      });

      if (teacherByEmail) {
        return NextResponse.json({
          success: true,
          role: 'Teacher',
          school_id: teacherByEmail.school_id,
          hasloggedinbefore: teacherByEmail.hasloggedinbefore ?? false
        });
      }
    }

    return NextResponse.json({ success: false, error: 'User context not found' }, { status: 404 });
  } catch (error: any) {
    console.error('User Context Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
