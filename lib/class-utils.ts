import { doc, setDoc, collection, getDocs, query, Timestamp, deleteDoc, where, writeBatch, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { logClassAction, getChangesBetweenObjects } from "@/lib/audit-utils"

// Validation schemas
export const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name too long"),
  level: z.string().min(1, "Level is required"),
  section: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1").max(1000, "Capacity too high"),
  teacher_id: z.string().optional(),
  description: z.string().optional(),
  school_id: z.string().min(1, "School ID is required"),
})

export const classUpdateSchema = classSchema.partial()

// Types
export interface Class {
  id: string
  name: string
  level: string
  section?: string
  capacity: number
  teacher_id?: string
  description?: string
  students_count?: number
  school_id: string
  schoolName?: string
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
    // Validate schema
    const validatedData = classSchema.parse(data)
    
    // Check for duplicate class names
    const classesRef = collection(db, "classes")
    const duplicateQuery = query(
      classesRef, 
      where("school_id", "==", schoolId),
      where("name", "==", data.name),
      where("level", "==", data.level)
    )
    const duplicateSnapshot = await getDocs(duplicateQuery)
    
    const duplicateClasses = duplicateSnapshot.docs.filter(doc => doc.id !== existingClassId)
    if (duplicateClasses.length > 0) {
      errors.push("A class with this name and level already exists")
    }

    // Validate teacher assignment
    if (data.teacher_id) {
      const teacherRef = doc(db, "teachers", data.teacher_id)
      const teacherDoc = await getDoc(teacherRef)
      
      if (!teacherDoc.exists()) {
        errors.push("Selected teacher does not exist")
      } else {
        const teacherData = teacherDoc.data()
        if (teacherData.school_id !== schoolId) {
          errors.push("Selected teacher does not belong to this school")
        }
        
        // Check if teacher is already assigned to another class
        const teacherClassesQuery = query(
          classesRef,
          where("school_id", "==", schoolId),
          where("teacher_id", "==", data.teacher_id)
        )
        const teacherClassesSnapshot = await getDocs(teacherClassesQuery)
        const teacherClasses = teacherClassesSnapshot.docs.filter(doc => doc.id !== existingClassId)
        
        if (teacherClasses.length > 0) {
          warnings.push("This teacher is already assigned to another class")
        }
      }
    }

    // Validate capacity
    if (data.capacity < 1) {
      errors.push("Class capacity must be at least 1")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message))
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
    const classesRef = collection(db, "classes")
    const classesQuery = query(classesRef, where("school_id", "==", schoolId))
    const classesSnapshot = await getDocs(classesQuery)

    const classesList: Class[] = classesSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Class)
    )

    // Fetch teachers for class details
    const teachersRef = collection(db, "teachers")
    const teachersQuery = query(teachersRef, where("school_id", "==", schoolId))
    const teachersSnapshot = await getDocs(teachersQuery)
    const teachers = teachersSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as any))

    // Fetch students count efficiently using aggregation
    const studentsRef = collection(db, "students")
    const studentsQuery = query(studentsRef, where("school_id", "==", schoolId))
    const studentsSnapshot = await getDocs(studentsQuery)

    // Count students by class
    const studentCounts: { [className: string]: number } = {}
    studentsSnapshot.docs.forEach((doc) => {
      const studentData = doc.data()
      if (studentData.class) {
        const className = studentData.class.trim()
        studentCounts[className] = (studentCounts[className] || 0) + 1
      }
    })

    // Combine data and calculate occupancy rates
    const classesWithDetails: ClassWithDetails[] = classesList.map((cls) => {
      const studentCount = studentCounts[cls.name] || 0
      const teacher = teachers.find(t => t.id === cls.teacher_id)
      
      return {
        ...cls,
        students_count: studentCount,
        teacher_name: teacher ? `${teacher.firstname || ''} ${teacher.lastname || ''}`.trim() : undefined,
        teacher_email: teacher?.email || teacher?.emailaddress,
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
    const teachersRef = collection(db, "teachers")
    const q = query(teachersRef, where("school_id", "==", schoolId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
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

    // Generate unique ID
    const classId = `CL${Date.now().toString().slice(-6)}`

    // Prepare data
    const currentDate = new Date()
    const finalData = {
      ...classData,
      id: classId,
      school_id: schoolInfo.school_id,
      schoolName: schoolInfo.schoolName,
      created_at: Timestamp.fromDate(currentDate),
      students_count: 0,
    }

    // Save to Firestore
    await setDoc(doc(db, "classes", classId), finalData)

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
    const currentDate = new Date()
    const finalData = {
      ...updateData,
      school_id: schoolInfo.school_id,
      schoolName: schoolInfo.schoolName,
      updated_at: Timestamp.fromDate(currentDate),
    }

    // Update in Firestore
    await updateDoc(doc(db, "classes", classId), finalData)

    // Return teacher change info for notification
    return {
      previousTeacherId,
      newTeacherId: updateData.teacher_id,
      hasTeacherChanged: previousTeacherId !== updateData.teacher_id
    }
  } catch (error) {
    console.error("Error updating class:", error)
    throw error
  }
}

export const deleteClass = async (classId: string): Promise<void> => {
  try {
    // Check if class has students
    const studentsRef = collection(db, "students")
    const studentsQuery = query(studentsRef, where("class_id", "==", classId))
    const studentsSnapshot = await getDocs(studentsQuery)
    
    if (!studentsSnapshot.empty) {
      throw new Error("Cannot delete class with enrolled students. Please reassign students first.")
    }

    // Delete class
    await deleteDoc(doc(db, "classes", classId))
  } catch (error) {
    console.error("Error deleting class:", error)
    throw error
  }
}

// Utility functions
export const getClassById = async (classId: string): Promise<Class | null> => {
  try {
    const classDoc = await getDoc(doc(db, "classes", classId))
    if (classDoc.exists()) {
      return { id: classDoc.id, ...classDoc.data() } as Class
    }
    return null
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
    const studentsRef = collection(db, "students")
    const studentsQuery = query(studentsRef, where("class_id", "==", classId))
    const studentsSnapshot = await getDocs(studentsQuery)
    const currentStudents = studentsSnapshot.size

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