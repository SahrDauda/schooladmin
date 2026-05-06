import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper to map snake_case table names to Prisma models
const toPrismaModel = (str: string) => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tasks = body.tasks || [];
    const performed_by = body.performed_by || 'system_sync';

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ success: false, error: 'Invalid payload: tasks array expected' }, { status: 400 });
    }

    const results = [];

    for (const task of tasks) {
      const { table_name, action, payload, record_id } = task;
      try {
        const prismaModelName = toPrismaModel(table_name);
        const targetModel = (prisma as any)[prismaModelName];

        if (targetModel) {
          const prismaPayload = { ...payload };

          // Handle special transformations (Grades, Booleans, Dates)
          if (table_name === 'grades') {
            if (payload.ca1 !== undefined || payload.ca2 !== undefined) {
              prismaPayload.ca_score = (payload.ca1 || 0) + (payload.ca2 || 0);
              delete prismaPayload.ca1;
              delete prismaPayload.ca2;
            }
            if (payload.total !== undefined) {
              prismaPayload.total_score = payload.total;
              delete prismaPayload.total;
            }
          }

          const booleanFields = ['is_disabled', 'hasloggedinbefore'];
          for (const field of booleanFields) {
            if (prismaPayload[field] !== undefined) {
              prismaPayload[field] = prismaPayload[field] === 1 || prismaPayload[field] === true;
            }
          }

          const dateFields = ['dob', 'joining_date', 'created_at', 'updated_at', 'date', 'sign_in_time', 'sign_out_time', 'payment_date', 'assigned_at', 'expires_at'];
          for (const field of dateFields) {
            if (prismaPayload[field] && typeof prismaPayload[field] === 'string') {
              prismaPayload[field] = new Date(prismaPayload[field]);
            }
          }

          // Handle Relations
          const relations = ['student_id', 'subject_id', 'class_id', 'term_id', 'session_id', 'teacher_id'];
          const relationMap: any = {
            student_id: 'students',
            subject_id: 'subjects',
            class_id: 'classes',
            term_id: 'terms',
            session_id: 'academic_sessions',
            teacher_id: 'teachers'
          };

          for (const field of relations) {
            if (prismaPayload[field]) {
              const prismaField = relationMap[field];
              prismaPayload[prismaField] = { connect: { id: prismaPayload[field] } };
              delete prismaPayload[field];
            }
          }

          if (action === 'DELETE') {
            await targetModel.delete({ where: { id: payload.id || record_id } });
          } else {
            await targetModel.upsert({
              where: { id: payload.id || record_id },
              create: prismaPayload,
              update: prismaPayload,
            });
          }

          // Audit log (optional but recommended)
          try {
            await (prisma as any).audit_logs.create({
              data: {
                action,
                entity_type: table_name,
                entity_id: payload.id || record_id,
                changes: payload,
                user_name: performed_by
              }
            });
          } catch (auditErr) {
            console.warn('Audit logging failed:', auditErr);
          }

          results.push({ record_id: record_id || payload.id, status: 'synced' });
        } else {
          results.push({ record_id: record_id || payload.id, status: 'error', message: `Model ${prismaModelName} not found` });
        }
      } catch (e: any) {
        console.error(`Sync Task Failed (${table_name}):`, e.message);
        results.push({ record_id: record_id || payload.id, status: 'error', message: e.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Critical Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
