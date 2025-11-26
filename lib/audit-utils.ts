import { supabase } from "@/lib/supabase"

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
  const { data, error } = await supabase
    .from("audit_logs")
    .insert(log)
    .select()
    .single()

  if (error) throw error
  return data
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

export const getChangesBetweenObjects = (before: any, after: any): string[] => {
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