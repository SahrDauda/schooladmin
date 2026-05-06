import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const school_id = searchParams.get('school_id');

  if (!school_id) return NextResponse.json({ error: 'Missing school_id' }, { status: 400 });

  try {
    const sId = String(school_id);
    const [students, teachers, classes, subjects, attendance, grades] = await Promise.all([
      (prisma as any).students.count({ where: { school_id: sId } }),
      (prisma as any).teachers.count({ where: { school_id: sId } }),
      (prisma as any).classes.count({ where: { school_id: sId } }),
      (prisma as any).subjects.count({ where: { school_id: sId } }),
      (prisma as any).attendance.count({ where: { school_id: sId } }),
      (prisma as any).grades.count({ where: { school_id: sId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { students, teachers, classes, subjects, attendance, grades }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
