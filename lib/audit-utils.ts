"use server"
import { fetchApi } from "@/lib/api-client"
import { cookies } from "next/headers"

const getCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll().map((c: any) => `${c.name}=${c.value}`).join('; ');
}
export interface AuditLog {
  id?: string
  action: "create" | "update" | "delete" | "view"
  entity_type: "class" | "student" | "teacher" | "subject"
  entity_id: string
  user_id: string
  user_name: string
  school_id: string
  changes?: {
    before?: any
    after?: any
    fields_changed?: string[]
  }
  metadata?: {
    ip_address?: string
    user_agent?: string
    [key: string]: any
  }
}

export const createAuditLog = async (log: Omit<AuditLog, "id" | "created_at">) => {
  const response = await fetchApi<any>('/audit', {
    method: 'POST',
    headers: { 'Cookie': await getCookieHeader() },
    body: JSON.stringify(log)
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to create audit log");
  }
  
  return response.data
}

export const logClassAction = async (
  action: AuditLog["action"],
  classId: string,
  userId: string,
  userName: string,
  schoolId: string,
  changes?: AuditLog["changes"],
  metadata?: AuditLog["metadata"]
) => {
  return createAuditLog({
    action,
    entity_type: "class",
    entity_id: classId,
    user_id: userId,
    user_name: userName,
    school_id: schoolId,
    changes,
    metadata,
  })
}

const getChangesBetweenObjects = (before: any, after: any): string[] => {
  const changes: string[] = []
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])

  for (const key of allKeys) {
    const beforeValue = before?.[key]
    const afterValue = after?.[key]

    if (beforeValue !== afterValue) {
      changes.push(key)
    }
  }

  return changes
}