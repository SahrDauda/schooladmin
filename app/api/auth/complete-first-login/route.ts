import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    let updated = false;

    // 1. Try to update in schooladmin table first (covers Admin, Principal, Vice Principal, etc.)
    try {
      await (prisma as any).schooladmin.update({
        where: { id: userId },
        data: { hasloggedinbefore: true }
      });
      updated = true;
    } catch (err) {
      // Not in schooladmin, proceed to check teachers
    }

    // 2. If not found in schooladmin, try to update in teachers table
    if (!updated) {
      try {
        await prisma.teachers.update({
          where: { id: userId },
          data: { hasloggedinbefore: true } as any
        });
        updated = true;
      } catch (err) {
        // Not in teachers either
      }
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found in schooladmin or teachers tables' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'First login status successfully updated' });
  } catch (error: any) {
    console.error("complete-first-login server error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
