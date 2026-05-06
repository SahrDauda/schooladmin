import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await req.json();
    
    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    if (role === 'Admin') {
      await (prisma as any).schooladmin.update({
        where: { id: userId },
        data: { hasloggedinbefore: true }
      });
    } else if (role === 'Teacher') {
      await prisma.teachers.update({
        where: { id: userId },
        data: { hasloggedinbefore: true } as any
      });
    }

    return NextResponse.json({ success: true, message: 'First login status updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
