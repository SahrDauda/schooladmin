"use server"

import { z } from "zod"
import { logClassAction } from "@/lib/audit-utils"
import { getErrorMessage } from "@/lib/error-utils"
import { fetchApi } from "@/lib/api-client"
import { cookies } from "next/headers"

const getCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll().map((c: any) => `${c.name}=${c.value}`).join('; ');
}

// Validation schemas
const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name too long"),
  level: z.string().min(1, "Level is required"),
  capacity: z.number().min(1, "Capacity must be at least 1").max(1000, "Capacity too high"),
  form_teacher_id: z.string().optional().nullable(),
  faculty: z.enum(["Science", "Arts", "Commercial"]).optional().nullable(),
  school_id: z.string().optional(), // injected into finalData separately
})

const classUpdateSchema = classSchema.partial()

// Types
export interface Class {
  id: string
  name: string
  level: string
  capacity: number
  form_teacher_id?: string
  faculty?: string | null
  students_count?: number
  school_id: string
  created_at?: any
  updated_at?: any
}

export interface ClassWithDetails extends Class {
  teacher_name?: string
  teacher_email?: string
  occupancy_rate?: number
  section?: string
  description?: string
}

export interface ClassValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Validation functions
// Validation is handled mostly by the backend now
export const validateClassData = async (data: any, schoolId: string, existingClassId?: string): Promise<ClassValidationResult> => {
  return {
    isValid: true,
    errors: [],
    warnings: []
  }
}

function buildClassUpdatePayload(updateData: Record<string, unknown>): Record<string, unknown> {
  const formTeacherId =
    updateData.form_teacher_id !== undefined
      ? updateData.form_teacher_id
      : updateData.teacher_id

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updateData.name !== undefined) payload.name = updateData.name
  if (updateData.level !== undefined) payload.level = updateData.level
  if (updateData.capacity !== undefined) payload.capacity = Number(updateData.capacity)
  if (formTeacherId !== undefined) payload.form_teacher_id = formTeacherId || null
  if (updateData.faculty !== undefined) payload.faculty = updateData.faculty || null

  return payload
}

// Data fetching functions
export const fetchClassesWithDetails = async (schoolId: string): Promise<ClassWithDetails[]> => {
  try {
    const response = await fetchApi<ClassWithDetails[]>(`/classes/school/${schoolId}`, {
      headers: { 'Cookie': await getCookieHeader() }
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching classes with details:", error)
    throw new Error("Failed to fetch classes")
  }
}

export const fetchTeachers = async (schoolId: string) => {
  try {
    const response = await fetchApi<any[]>(`/classes/teachers/school/${schoolId}`, {
      headers: { 'Cookie': await getCookieHeader() }
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching teachers:", error)
    throw new Error("Failed to fetch teachers")
  }
}

// CRUD operations
export const createClass = async (
  classData: any,
  schoolInfo: { school_id: string; schoolName: string },
  userId?: string,
  userName?: string
): Promise<string> => {
  try {
    const teacherId = classData.form_teacher_id || classData.teacher_id || null
    const finalData = {
      name: classData.name,
      level: classData.level,
      capacity: Number(classData.capacity),
      form_teacher_id: teacherId,
      faculty: classData.faculty || null,
      school_id: schoolInfo.school_id,
    }

    const response = await fetchApi<any>('/classes', {
      method: 'POST',
      headers: { 'Cookie': await getCookieHeader() },
      body: JSON.stringify(finalData)
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create class");
    }

    const classId = response.data.id

    if (userId && userName) {
      await logClassAction("create", classId, userId, userName, schoolInfo.school_id, {
        after: finalData
      })
    }

    return classId
  } catch (error: any) {
    console.error("Error creating class:", error)
    throw error
  }
}

export const updateClass = async (
  classId: string,
  updateData: any,
  schoolInfo: { school_id: string; schoolName: string },
  previousTeacherId?: string
): Promise<{ previousTeacherId?: string; newTeacherId?: string; hasTeacherChanged: boolean }> => {
  try {
    const finalData = buildClassUpdatePayload(updateData)
    const newTeacherId = finalData.form_teacher_id as string | null | undefined

    const response = await fetchApi<any>(`/classes/${classId}`, {
      method: 'PUT',
      headers: { 'Cookie': await getCookieHeader() },
      body: JSON.stringify({ ...finalData, school_id: schoolInfo.school_id })
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to update class");
    }

    return {
      previousTeacherId,
      newTeacherId: newTeacherId ?? undefined,
      hasTeacherChanged: String(previousTeacherId || "") !== String(newTeacherId || ""),
    }
  } catch (error) {
    console.error("Error updating class:", getErrorMessage(error))
    throw new Error(getErrorMessage(error))
  }
}

export const deleteClass = async (classId: string): Promise<void> => {
  try {
    const response = await fetchApi(`/classes/${classId}`, {
      method: 'DELETE',
      headers: { 'Cookie': await getCookieHeader() }
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to delete class");
    }
  } catch (error) {
    console.error("Error deleting class:", error)
    throw error
  }
}

// Utility functions
export const getClassById = async (classId: string): Promise<Class | null> => {
  try {
    const response = await fetchApi<Class>(`/classes/${classId}`, {
      headers: { 'Cookie': await getCookieHeader() }
    });

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching class by ID:", error)
    throw error
  }
}

export const checkClassCapacity = async (classId: string): Promise<{ current: number; capacity: number; available: number }> => {
  try {
    const response = await fetchApi<any>(`/classes/${classId}`, {
      headers: { 'Cookie': await getCookieHeader() }
    });

    if (!response.success || !response.data) {
      throw new Error("Class not found");
    }

    return {
      current: response.data.current || 0,
      capacity: response.data.capacity,
      available: response.data.available || 0
    }
  } catch (error) {
    console.error("Error checking class capacity:", error)
    throw error
  }
}