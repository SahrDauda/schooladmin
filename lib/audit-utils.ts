import { doc, setDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface AuditLog {
  id: string
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
    session_id?: string
  }
  timestamp: any
}

export const createAuditLog = async (logData: Omit<AuditLog, "id" | "timestamp">) => {
  try {
    const auditId = `AUDIT_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substr(2, 9)}`
    
    const auditLog: AuditLog = {
      ...logData,
      id: auditId,
      timestamp: Timestamp.fromDate(new Date()),
    }

    await setDoc(doc(db, "audit_logs", auditId), auditLog)
    
    console.log("Audit log created:", auditId)
    return auditId
  } catch (error) {
    console.error("Error creating audit log:", error)
    // Don't throw error to avoid breaking main functionality
  }
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