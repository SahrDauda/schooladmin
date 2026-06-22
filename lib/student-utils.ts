import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit-utils"

// Validation schemas
export const studentSchema = z.object({
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
  house: z.string().optional().nullable(),
})

export const studentUpdateSchema = studentSchema.partial()

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

// Validation functions
export const validateStudentData = async (data: any, schoolId: string, existingStudentId?: string): Promise<StudentValidationResult> => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const isUpdate = Boolean(existingStudentId)
    // Coerce date if provided as string
    if (data.dateofbirth && typeof data.dateofbirth === 'string') {
      data.dateofbirth = new Date(data.dateofbirth)
    }
    const validatedData = isUpdate ? studentUpdateSchema.parse(data) : studentSchema.parse(data)

    // Check for duplicate admission numbers
    if (validatedData.admission_number) {
      const duplicateStudent = await prisma.students.findFirst({
        where: {
          school_id: schoolId,
          admission_number: validatedData.admission_number,
          NOT: existingStudentId ? { id: existingStudentId } : undefined
        }
      })

      if (duplicateStudent) {
        errors.push("A student with this admission number already exists")
      }
    }

    if (validatedData.class_id) {
      const classExists = await prisma.classes.findFirst({
        where: {
          id: validatedData.class_id,
          school_id: schoolId
        }
      })
      if (!classExists) {
        errors.push("Selected class does not exist or does not belong to this school")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message || "Required"))
    } else {
      errors.push("Validation failed")
    }
    return {
      isValid: false,
      errors,
      warnings
    }
  }
}

// Data fetching functions
export const fetchStudentsWithDetails = async (schoolId: string): Promise<StudentWithDetails[]> => {
  try {
    const students = await prisma.students.findMany({
      where: { school_id: schoolId },
      include: {
        classes: {
          select: {
            name: true,
            level: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return students.map(student => ({
      ...student,
      class_name: student.classes?.name,
      class_level: student.classes?.level
    }))
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
    const validation = await validateStudentData(studentData, schoolInfo.school_id)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "))
    }

    const student = await prisma.students.create({
      data: {
        ...studentData,
        school_id: schoolInfo.school_id
      }
    })

    if (userId && userName) {
      await logStudentAction("create", student.id, userId, userName, schoolInfo.school_id, {
        after: student
      })
    }

    return student.id
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
    const validation = await validateStudentData(updateData, schoolInfo.school_id, studentId)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "))
    }

    const beforeUpdate = await prisma.students.findUnique({ where: { id: studentId } })

    const student = await prisma.students.update({
      where: { id: studentId },
      data: updateData
    })

    if (userId && userName) {
      await logStudentAction("update", studentId, userId, userName, schoolInfo.school_id, {
        before: beforeUpdate,
        after: student
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
    const student = await prisma.students.findUnique({ where: { id: studentId } })
    if (!student) throw new Error("Student not found")

    await prisma.students.delete({
      where: { id: studentId }
    })

    if (userId && userName) {
      await logStudentAction("delete", studentId, userId, userName, schoolInfo.school_id, {
        before: student
      })
    }
  } catch (error) {
    console.error("Error deleting student:", error)
    throw error
  }
}

// Dashboard metrics
export const getStudentMetrics = (students: StudentWithDetails[]) => {
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status?.toLowerCase() === "active").length
  const inactiveStudents = students.filter(s => s.status?.toLowerCase() === "inactive").length
  const withSpecialNeeds = students.filter(s => s.is_disabled || s.health_status).length

  return {
    totalStudents,
    activeStudents,
    inactiveStudents,
    withSpecialNeeds
  }
}
