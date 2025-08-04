import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import { 
  fetchClassesWithDetails, 
  fetchTeachers, 
  createClass, 
  updateClass, 
  deleteClass,
  getClassMetrics,
  type ClassWithDetails,
  type ClassValidationResult
} from "@/lib/class-utils"
import { getCurrentSchoolInfo } from "@/lib/school-utils"

interface UseClassesReturn {
  // State
  classes: ClassWithDetails[]
  teachers: any[]
  isLoading: boolean
  isSubmitting: boolean
  schoolInfo: { school_id: string; schoolName: string; stage?: string }
  metrics: ReturnType<typeof getClassMetrics>
  
  // Actions
  refreshClasses: () => Promise<void>
  addClass: (classData: any) => Promise<boolean>
  updateClassData: (classId: string, updateData: any, previousTeacherId?: string) => Promise<boolean>
  deleteClassData: (classId: string) => Promise<boolean>
  validateClass: (data: any) => Promise<ClassValidationResult>
  
  // Utilities
  getTeacherName: (teacherId: string) => string
  getLevelOptions: () => string[]
}

export const useClasses = (): UseClassesReturn => {
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{ school_id: string; schoolName: string; stage?: string }>({ 
    school_id: "", 
    schoolName: "", 
    stage: "" 
  })

  // Load school info
  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        const info = await getCurrentSchoolInfo()
        setSchoolInfo(info)
      } catch (error) {
        console.error("Error loading school info:", error)
        toast({
          title: "Error",
          description: "Failed to load school information",
          variant: "destructive",
        })
      }
    }

    loadSchoolInfo()
  }, [])

  // Refresh classes data
  const refreshClasses = useCallback(async () => {
    if (!schoolInfo.school_id) return

    setIsLoading(true)
    try {
      const [classesData, teachersData] = await Promise.all([
        fetchClassesWithDetails(schoolInfo.school_id),
        fetchTeachers(schoolInfo.school_id)
      ])
      
      setClasses(classesData)
      setTeachers(teachersData)
    } catch (error) {
      console.error("Error refreshing classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [schoolInfo.school_id])

  // Load data when school info is available
  useEffect(() => {
    if (schoolInfo.school_id) {
      refreshClasses()
    }
  }, [schoolInfo.school_id, refreshClasses])

  // Check for refresh flag from students page
  useEffect(() => {
    const checkRefreshFlag = () => {
      const refreshFlag = localStorage.getItem("refreshClasses")
      if (refreshFlag === "true") {
        localStorage.removeItem("refreshClasses")
        refreshClasses()
      }
    }

    checkRefreshFlag()
    const interval = setInterval(checkRefreshFlag, 2000)
    return () => clearInterval(interval)
  }, [refreshClasses])

  // Add new class
  const addClass = useCallback(async (classData: any): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      const classId = await createClass(classData, schoolInfo)
      
      toast({
        title: "Success",
        description: "Class added successfully",
      })

      await refreshClasses()
      return true
    } catch (error) {
      console.error("Error adding class:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add class",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [schoolInfo, refreshClasses])

  // Update class
  const updateClassData = useCallback(async (
    classId: string, 
    updateData: any, 
    previousTeacherId?: string
  ): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      const teacherChangeInfo = await updateClass(classId, updateData, schoolInfo, previousTeacherId)

      // Send notification if teacher was assigned
      if (teacherChangeInfo.hasTeacherChanged && teacherChangeInfo.newTeacherId) {
        try {
          const teacher = teachers.find(t => t.id === teacherChangeInfo.newTeacherId)
          if (teacher) {
            const teacherName = teacher.firstname && teacher.lastname 
              ? `${teacher.firstname} ${teacher.lastname}` 
              : teacher.name || "Teacher"
            const teacherEmail = teacher.email || teacher.emailaddress || ""

            const { sendTeacherClassAssignmentNotification } = await import("@/lib/notification-utils")
            await sendTeacherClassAssignmentNotification(
              teacherChangeInfo.newTeacherId,
              teacherName,
              teacherEmail,
              updateData.name,
              updateData.level
            )
          }
        } catch (error) {
          console.error("Error sending teacher class assignment notification:", error)
          // Don't fail the update if notification fails
        }
      }

      toast({
        title: "Success",
        description: "Class information updated successfully",
      })

      await refreshClasses()
      return true
    } catch (error) {
      console.error("Error updating class:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update class information",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [schoolInfo, teachers, refreshClasses])

  // Delete class
  const deleteClassData = useCallback(async (classId: string): Promise<boolean> => {
    try {
      await deleteClass(classId)

      toast({
        title: "Success",
        description: "Class deleted successfully",
      })

      await refreshClasses()
      return true
    } catch (error) {
      console.error("Error deleting class:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete class",
        variant: "destructive",
      })
      return false
    }
  }, [refreshClasses])

  // Validate class data
  const validateClass = useCallback(async (data: any): Promise<ClassValidationResult> => {
    if (!schoolInfo.school_id) {
      return {
        isValid: false,
        errors: ["School information not loaded"],
        warnings: []
      }
    }

    try {
      const { validateClassData } = await import("@/lib/class-utils")
      return await validateClassData(data, schoolInfo.school_id)
    } catch (error) {
      return {
        isValid: false,
        errors: ["Validation failed"],
        warnings: []
      }
    }
  }, [schoolInfo.school_id])

  // Utility functions
  const getTeacherName = useCallback((teacherId: string): string => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Not Assigned"
  }, [teachers])

  const getLevelOptions = useCallback((): string[] => {
    const { getLevelOptions } = require("@/lib/class-utils")
    return getLevelOptions(schoolInfo.stage || "")
  }, [schoolInfo.stage])

  // Calculate metrics
  const metrics = getClassMetrics(classes)

  return {
    // State
    classes,
    teachers,
    isLoading,
    isSubmitting,
    schoolInfo,
    metrics,
    
    // Actions
    refreshClasses,
    addClass,
    updateClassData,
    deleteClassData,
    validateClass,
    
    // Utilities
    getTeacherName,
    getLevelOptions,
  }
} 