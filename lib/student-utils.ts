"use server"

import { fetchApi } from "@/lib/api-client"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit-utils"
import { cookies } from "next/headers"

const getCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll().map((c: any) => `${c.name}=${c.value}`).join('; ');
}

// Validation schemas
const studentSchema = z.object({
  firstname: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastname: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  othernames: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  dateofbirth: z.date().optional().nullable(),
  address: z.string().optional().nullable(),
  guardian_name: z.string().optional().nullable(),
  guardian_phone: z.string().optional().nullable(),
  guardian_email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  class_id: z.string().uuid("Invalid class ID").optional().nullable(),
  admission_number: z.string().optional().nullable(),
  passport_url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  status: z.string().default("Active"),
  school_id: z.string().uuid("Invalid school ID"),
  health_status: z.string().optional().nullable(),
  is_disabled: z.boolean().default(false),
  disability_type: z.string().optional().nullable(),
  sick_type: z.string().optional().nullable(),
  house: z.string().optional().nullable(),
})

const studentUpdateSchema = studentSchema.partial()

// Types
export interface Student {
  id: string
  firstname: string
  lastname: string
  othernames?: string | null
  gender?: string | null
  dateofbirth?: Date | null
  address?: string | null
  guardian_name?: string | null
  guardian_phone?: string | null
  guardian_email?: string | null
  class_id?: string | null
  admission_number?: string | null
  passport_url?: string | null
  status?: string | null
  school_id?: string | null
  health_status?: string | null
  is_disabled?: boolean | null
  house?: string | null
  created_at: Date
  updated_at: Date
}

export interface StudentWithDetails extends Student {
  class_name?: string
  class_level?: string
}

export interface StudentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Validation is handled mostly by the backend now, but we keep the structure for frontend compatibility
export const validateStudentData = async (data: any, schoolId: string, existingStudentId?: string): Promise<StudentValidationResult> => {
  // We can just return valid here, or ping the backend if we needed pre-validation.
  // The Express API handles Zod validation and admission number collision internally.
  return {
    isValid: true,
    errors: [],
    warnings: []
  }
}

// Data fetching functions
export const fetchStudentsWithDetails = async (schoolId: string): Promise<StudentWithDetails[]> => {
  try {
    const response = await fetchApi<StudentWithDetails[]>(`/students/school/${schoolId}`, {
      headers: { 'Cookie': await getCookieHeader() }
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching students with details:", error)
    throw new Error("Failed to fetch students")
  }
}

export const logStudentAction = async (
  action: "create" | "update" | "delete" | "view",
  studentId: string,
  userId: string,
  userName: string,
  schoolId: string,
  changes?: any
) => {
  return createAuditLog({
    action,
    entity_type: "student",
    entity_id: studentId,
    user_id: userId,
    user_name: userName,
    school_id: schoolId,
    changes,
  })
}

// CRUD operations
export const createStudent = async (
  studentData: any,
  schoolInfo: { school_id: string; schoolName: string },
  userId?: string,
  userName?: string
): Promise<string> => {
  try {
    const response = await fetchApi<any>('/students', {
      method: 'POST',
      headers: { 'Cookie': await getCookieHeader() },
      body: JSON.stringify({ ...studentData, school_id: schoolInfo.school_id })
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create student");
    }

    if (userId && userName) {
      await logStudentAction("create", response.data.id, userId, userName, schoolInfo.school_id, {
        after: response.data
      })
    }

    return response.data.id;
  } catch (error) {
    console.error("Error creating student:", error)
    throw error
  }
}

export const updateStudent = async (
  studentId: string,
  updateData: any,
  schoolInfo: { school_id: string; schoolName: string },
  userId?: string,
  userName?: string
): Promise<void> => {
  try {
    // Get existing for audit log
    const getResponse = await fetchApi<any>(`/students/${studentId}`, { headers: { 'Cookie': await getCookieHeader() } });
    const beforeUpdate = getResponse.data;

    const response = await fetchApi<any>(`/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Cookie': await getCookieHeader() },
      body: JSON.stringify(updateData)
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to update student");
    }

    if (userId && userName) {
      await logStudentAction("update", studentId, userId, userName, schoolInfo.school_id, {
        before: beforeUpdate,
        after: response.data
      })
    }
  } catch (error) {
    console.error("Error updating student:", error)
    throw new Error("Failed to update student")
  }
}

export const deleteStudent = async (
  studentId: string,
  schoolInfo: { school_id: string; schoolName: string },
  userId?: string,
  userName?: string
): Promise<void> => {
  try {
    const getResponse = await fetchApi<any>(`/students/${studentId}`, { headers: { 'Cookie': await getCookieHeader() } });
    const beforeDelete = getResponse.data;

    const response = await fetchApi(`/students/${studentId}`, {
      method: 'DELETE',
      headers: { 'Cookie': await getCookieHeader() }
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to delete student");
    }

    if (userId && userName) {
      await logStudentAction("delete", studentId, userId, userName, schoolInfo.school_id, {
        before: beforeDelete
      })
    }
  } catch (error) {
    console.error("Error deleting student:", error)
    throw error
  }
}


// Parent operations
export const addParentToStudent = async (
  studentId: string,
  parentData: any,
  schoolInfo: { school_id: string; schoolName: string },
  userId?: string,
  userName?: string
): Promise<void> => {
  try {
    const getResponse = await fetchApi<any>(`/students/${studentId}`, { headers: { 'Cookie': await getCookieHeader() } });
    const beforeUpdate = getResponse.data;

    const response = await fetchApi<any>(`/students/${studentId}/parent`, {
      method: 'POST',
      headers: { 'Cookie': await getCookieHeader() },
      body: JSON.stringify({ parentData, schoolInfo })
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to link parent to student");
    }

    if (userId && userName) {
      await logStudentAction("update", studentId, userId, userName, schoolInfo.school_id, {
        before: beforeUpdate,
        after: response.data,
        note: "Linked new parent profile"
      })
    }
  } catch (error) {
    console.error("Error adding parent:", error)
    throw new Error("Failed to link parent to student")
  }
}

export const getNextAdmissionNumber = async (schoolId: string): Promise<string> => {
  try {
    const response = await fetchApi<string>(`/students/next-admission/${schoolId}`, {
      headers: { 'Cookie': await getCookieHeader() }
    });

    if (response.success && response.data) {
      return response.data;
    }
    
    return `${new Date().getFullYear()}${Date.now().toString().slice(-3)}`;
  } catch (error) {
    console.error("Error generating admission number:", error)
    return `${new Date().getFullYear()}${Date.now().toString().slice(-3)}`
  }
}
