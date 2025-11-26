import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { logClassAction } from "@/lib/audit-utils"

// Validation schemas
export const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name too long"),
  level: z.string().min(1, "Level is required"),
  capacity: z.number().min(1, "Capacity must be at least 1").max(1000, "Capacity too high"),
  form_teacher_id: z.string().optional(), // Changed from teacher_id to form_teacher_id
  school_id: z.string().min(1, "School ID is required"),
})

export const classUpdateSchema = classSchema.partial()

// Types
export interface Class {
  id: string
  name: string
  level: string
  capacity: number
  form_teacher_id?: string // Changed from teacher_id
  students_count?: number
  school_id: string
  created_at?: any
  updated_at?: any
}

export interface ClassWithDetails extends Class {
  teacher_name?: string
  teacher_email?: string
  occupancy_rate?: number
}

export interface ClassValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Stage-specific level options
export const getLevelOptions = (stage: string) => {
  switch (stage) {
    case "Primary":
      return ["Prep 1", "Prep 2", "Prep 3", "Prep 4", "Prep 5", "Prep 6"]
    case "Junior Secondary":
      return ["JSS 1", "JSS 2", "JSS 3"]
    case "Senior Secondary":
      return ["SSS 1", "SSS 2", "SSS 3"]
    default:
      return ["Not Specified"]
  }
}

// Validation functions
export const validateClassData = async (data: any, schoolId: string, existingClassId?: string): Promise<ClassValidationResult> => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Validate schema (full for create, partial for update)
    const isUpdate = Boolean(existingClassId)
    const validatedData = isUpdate ? classUpdateSchema.parse(data) : classSchema.parse(data)

    // Check for duplicate class names only when both fields are present
    if ((!isUpdate) || (validatedData.name && validatedData.level)) {
      const { data: duplicateClasses, error } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', validatedData.name || data.name)
        .eq('level', validatedData.level || data.level)

      if (!error && duplicateClasses) {
        const duplicates = duplicateClasses.filter(doc => doc.id !== existingClassId)
        if (duplicates.length > 0) {
          errors.push("A class with this name and level already exists")
        }
      }
    }

    // Validate teacher assignment
    if (validatedData.form_teacher_id || data.form_teacher_id) {
      const teacherId = validatedData.form_teacher_id || data.form_teacher_id

      const { data: teacherDoc, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single()

      if (teacherError || !teacherDoc) {
        errors.push("Selected teacher does not exist")
      } else {
        if (teacherDoc.school_id !== schoolId) {
          errors.push("Selected teacher does not belong to this school")
        }

        // Check if teacher is already assigned to another class
        const { data: teacherClasses, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('school_id', schoolId)
          .eq('form_teacher_id', teacherId)

        if (!classError && teacherClasses) {
          const otherClasses = teacherClasses.filter(doc => doc.id !== existingClassId)
          if (otherClasses.length > 0) {
            warnings.push("This teacher is already assigned to another class")
          }
        }
      }
    }

    // Validate capacity
    if ((!isUpdate && (validatedData as any).capacity !== undefined) || (isUpdate && (data.capacity !== undefined))) {
      const cap = isUpdate ? Number(data.capacity) : Number((validatedData as any).capacity)
      if (Number.isNaN(cap) || cap < 1) {
        errors.push("Class capacity must be at least 1")
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
export const fetchClassesWithDetails = async (schoolId: string): Promise<ClassWithDetails[]> => {
  try {
    // Fetch classes
    const { data: classesList, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)

    if (classesError) throw classesError

    // Fetch teachers for class details
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId)

    if (teachersError) throw teachersError

    // Fetch students count by class_id
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('class_id')
      .eq('school_id', schoolId)

    if (studentsError) throw studentsError

    // Count students by class_id
    const studentCounts: { [classId: string]: number } = {}
    students?.forEach((student: any) => {
      if (student.class_id) {
        studentCounts[student.class_id] = (studentCounts[student.class_id] || 0) + 1
      }
    })

    // Combine data and calculate occupancy rates
    const classesWithDetails: ClassWithDetails[] = (classesList || []).map((cls: any) => {
      const studentCount = studentCounts[cls.id] || 0
      const teacher = teachers?.find((t: any) => t.id === cls.form_teacher_id)

      return {
        ...cls,
        students_count: studentCount,
        teacher_name: teacher ? `${teacher.firstname || ''} ${teacher.lastname || ''}`.trim() : undefined,
        teacher_email: teacher?.email,
        occupancy_rate: cls.capacity > 0 ? Math.round((studentCount / cls.capacity) * 100) : 0
      }
    })

    // Sort classes by level
    return classesWithDetails.sort((a, b) => {
      const levelA = a.level.split(" ").pop() || ""
      const levelB = b.level.split(" ").pop() || ""
      const typeA = a.level.split(" ")[0] || ""
      const typeB = b.level.split(" ")[0] || ""

      if (typeA !== typeB) {
        return typeA.localeCompare(typeB)
      }
      return Number.parseInt(levelA) - Number.parseInt(levelB)
    })
  } catch (error) {
    console.error("Error fetching classes with details:", error)
    throw new Error("Failed to fetch classes")
  }
}

export const fetchTeachers = async (schoolId: string) => {
  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId)

    if (error) throw error

    return teachers || []
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
    // Validate data
    const validation = await validateClassData(classData, schoolInfo.school_id)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "))
    }

    // Prepare data
    // Note: ID is auto-generated by Supabase (UUID)
    const finalData = {
      name: classData.name,
      level: classData.level,
      capacity: Number(classData.capacity),
      form_teacher_id: classData.form_teacher_id || null,
      school_id: schoolInfo.school_id,
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('classes')
      .insert(finalData)
      .select('id')
      .single()

    if (error) throw error

    const classId = data.id

    // Log audit trail
    if (userId && userName) {
      await logClassAction("create", classId, userId, userName, schoolInfo.school_id, {
        after: finalData
      })
    }

    return classId
  } catch (error) {
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
    // Validate data
    const validation = await validateClassData(updateData, schoolInfo.school_id, classId)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "))
    }

    // Prepare update data
    const finalData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Update in Supabase
    const { error } = await supabase
      .from('classes')
      .update(finalData)
      .eq('id', classId)

    if (error) throw error

    // Return teacher change info for notification
    return {
      previousTeacherId,
      newTeacherId: updateData.form_teacher_id,
      hasTeacherChanged: previousTeacherId !== updateData.form_teacher_id
    }
  } catch (error) {
    console.error("Error updating class:", error)
    throw error
  }
}

export const deleteClass = async (classId: string): Promise<void> => {
  try {
    // Check if class has students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', classId)
      .limit(1)

    if (studentsError) throw studentsError

    if (students && students.length > 0) {
      throw new Error("Cannot delete class with enrolled students. Please reassign students first.")
    }

    // Delete class
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting class:", error)
    throw error
  }
}

// Utility functions
export const getClassById = async (classId: string): Promise<Class | null> => {
  try {
    const { data: classDoc, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()

    if (error || !classDoc) return null

    return classDoc as Class
  } catch (error) {
    console.error("Error fetching class by ID:", error)
    throw error
  }
}

export const checkClassCapacity = async (classId: string): Promise<{ current: number; capacity: number; available: number }> => {
  try {
    const classData = await getClassById(classId)
    if (!classData) {
      throw new Error("Class not found")
    }

    // Count students in this class
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)

    if (error) throw error

    const currentStudents = count || 0

    return {
      current: currentStudents,
      capacity: classData.capacity,
      available: classData.capacity - currentStudents
    }
  } catch (error) {
    console.error("Error checking class capacity:", error)
    throw error
  }
}

// Dashboard metrics
export const getClassMetrics = (classes: ClassWithDetails[]) => {
  const totalClasses = classes.length
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students_count || 0), 0)
  const totalCapacity = classes.reduce((sum, cls) => sum + (cls.capacity || 0), 0)
  const averageOccupancy = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
  const fullClasses = classes.filter(cls => (cls.students_count || 0) >= cls.capacity).length
  const emptyClasses = classes.filter(cls => (cls.students_count || 0) === 0).length

  return {
    totalClasses,
    totalStudents,
    totalCapacity,
    averageOccupancy,
    fullClasses,
    emptyClasses
  }
}