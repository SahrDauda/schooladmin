import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toSnakeCase(v));
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => ({
      ...result,
      [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]: toSnakeCase(obj[key]),
    }), {});
  }
  return obj;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const school_id = searchParams.get('school_id');
  const user_id = searchParams.get('user_id');
  const role = searchParams.get('role');
  const email = searchParams.get('email');

  if (!school_id) return NextResponse.json({ error: 'Missing school_id' }, { status: 400 });

  try {
    const sId = String(school_id);
    const isAdmin = role === 'Admin' || role === 'Principal';

    // 1. Fetch School Config
    const school = await prisma.schools.findUnique({
      where: { id: sId },
      include: { school_configs: true } as any
    });

    let students: any[] = [];
    let classes: any[] = [];
    let subjects: any[] = [];
    let grades: any[] = [];
    let teachers: any[] = [];
    let attendance: any[] = [];
    let timetable: any[] = [];

    if (isAdmin) {
      try { students = await (prisma as any).students.findMany({ where: { school_id: sId } }); } catch (e) { console.error("Students pull failed", e); }
      try { classes = await (prisma as any).classes.findMany({ where: { school_id: sId } }); } catch (e) { console.error("Classes pull failed", e); }
      try { subjects = await (prisma as any).subjects.findMany({ where: { school_id: sId } }); } catch (e) { console.error("Subjects pull failed", e); }
      try { attendance = await (prisma as any).attendance.findMany({ where: { school_id: sId } }); } catch (e) { console.error("Attendance pull failed", e); }
      try { teachers = await (prisma as any).teachers.findMany({ where: { school_id: sId } }); } catch (e) { console.error("Teachers pull failed", e); }
      try { grades = await (prisma as any).grades.findMany({ where: { school_id: sId } }); } catch (e) { console.error("Grades pull failed", e); }
      try { timetable = await (prisma as any).timetable_slots.findMany({ where: { school_id: sId } }); } catch (e) { console.error("Timetable pull failed", e); }
    } else {
      // Scoped pull for teachers
      try {
        const tId = String(user_id);
        const teacher = await prisma.teachers.findUnique({
          where: { id: tId },
          include: { classes: true } as any
        });
        
        classes = teacher?.classes || [];
        const classIds = classes.map((c: any) => c.id);
        
        students = await (prisma as any).students.findMany({ where: { class_id: { in: classIds } } });
        subjects = await (prisma as any).subjects.findMany({ where: { school_id: sId } }); 
        grades = await (prisma as any).grades.findMany({ where: { class_id: { in: classIds } } });
        attendance = await (prisma as any).attendance.findMany({ where: { class_id: { in: classIds } } });
        teachers = teacher ? [teacher] : [];
      } catch (e) {
        console.error("Teacher scoped pull failed", e);
      }
    }

    return NextResponse.json(toSnakeCase({
      success: true,
      data: {
        school,
        students,
        classes,
        subjects,
        grades,
        teachers,
        attendance,
        timetable: timetable || []
      }
    }));
  } catch (error: any) {
    console.error('Pull Sync Failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
