import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import {
  fetchStudentsWithDetails,
  createStudent,
  updateStudent,
  deleteStudent,
  getNextAdmissionNumber,
  type StudentWithDetails,
  type StudentValidationResult
} from "@/lib/student-utils"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

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

interface UseStudentsReturn {
  // State
  students: StudentWithDetails[]
  classes: any[]
  isLoading: boolean
  isSubmitting: boolean
  schoolInfo: { school_id: string; schoolName: string; stage?: string }
  metrics: ReturnType<typeof getStudentMetrics>
  isSearchingNIN: boolean
  
  // Actions
  refreshStudents: () => Promise<void>
  addStudent: (studentData: any) => Promise<boolean>
  updateStudentData: (studentId: string, updateData: any) => Promise<boolean>
  deleteStudentData: (studentId: string) => Promise<boolean>
  searchNIN: (nin: string) => Promise<any | null>
  generateNewAdmissionNumber: () => Promise<string>
}

export const useStudents = (): UseStudentsReturn => {
  const { admin } = useAuth()
  const [students, setStudents] = useState<StudentWithDetails[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearchingNIN, setIsSearchingNIN] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{ school_id: string; schoolName: string; stage?: string }>({
    school_id: "",
    schoolName: "",
    stage: ""
  })

  // Load school info from auth context
  useEffect(() => {
    if (admin) {
      setSchoolInfo({
        school_id: admin.school_id,
        schoolName: admin.schoolName || "Holy Family Junior Secondary School",
        stage: admin.schoolStage || ""
      })
    }
  }, [admin])

  // Fetch classes for dropdowns
  const fetchClasses = useCallback(async (schoolId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }, [])

  // Refresh students data
  const refreshStudents = useCallback(async () => {
    if (!schoolInfo.school_id) return

    setIsLoading(true)
    try {
      const [studentsData] = await Promise.all([
        fetchStudentsWithDetails(schoolInfo.school_id),
        fetchClasses(schoolInfo.school_id)
      ])
      
      setStudents(studentsData)
    } catch (error) {
      console.error("Error refreshing students:", error)
      toast({
        title: "Error",
        description: "Failed to load students data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [schoolInfo.school_id, fetchClasses])

  // Load data when school info is available
  useEffect(() => {
    if (schoolInfo.school_id) {
      refreshStudents()
    }
  }, [schoolInfo.school_id, refreshStudents])

  // Add new student
  const addStudent = useCallback(async (studentData: any): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await createStudent(studentData, schoolInfo, admin?.id, admin?.adminname || "Admin")
      
      toast({
        title: "Success",
        description: "Student added successfully",
      })

      await refreshStudents()
      return true
    } catch (error) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [schoolInfo, admin, refreshStudents])

  // Update student
  const updateStudentData = useCallback(async (
    studentId: string, 
    updateData: any
  ): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await updateStudent(studentId, updateData, schoolInfo, admin?.id, admin?.adminname || "Admin")

      toast({
        title: "Success",
        description: "Student information updated successfully",
      })

      await refreshStudents()
      return true
    } catch (error) {
      console.error("Error updating student:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student information",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [schoolInfo, admin, refreshStudents])

  // Delete student
  const deleteStudentData = useCallback(async (studentId: string): Promise<boolean> => {
    try {
      await deleteStudent(studentId, schoolInfo, admin?.id, admin?.adminname || "Admin")

      toast({
        title: "Success",
        description: "Student deleted successfully",
      })

      await refreshStudents()
      return true
    } catch (error) {
      console.error("Error deleting student:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student",
        variant: "destructive",
      })
      return false
    }
  }, [schoolInfo, admin, refreshStudents])

  // NIN API integration for students
  const searchNIN = useCallback(async (nin: string) => {
    setIsSearchingNIN(true)
    try {
      const response = await fetch('/api/nin-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nin })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: NIN not found`)
      }

      const data = await response.json()
      if (!data || !data.firstName || !data.lastName) {
        throw new Error('Invalid NIN data received')
      }

      toast({
        title: "Success",
        description: `Student information retrieved for ${data.firstName} ${data.lastName}`,
      })

      return data
    } catch (error) {
      console.error('NIN search failed:', error)
      let errorMessage = "NIN verification failed"
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = `NIN "${nin}" not found in the database`
        } else if (error.message.includes('Invalid NIN data')) {
          errorMessage = "Invalid data received from NIN database"
        } else if (error.message.includes('fetch')) {
          errorMessage = "Network error - please check your connection"
        }
      }
      toast({
        title: "NIN Not Found",
        description: errorMessage,
        variant: "destructive",
      })
      return null
    } finally {
      setIsSearchingNIN(false)
    }
  }, [])

  const generateNewAdmissionNumber = useCallback(async () => {
    if (!schoolInfo.school_id) return ""
    return await getNextAdmissionNumber(schoolInfo.school_id)
  }, [schoolInfo.school_id])

  // Calculate metrics
  const metrics = getStudentMetrics(students)

  return {
    students,
    classes,
    isLoading,
    isSubmitting,
    schoolInfo,
    metrics,
    isSearchingNIN,
    
    refreshStudents,
    addStudent,
    updateStudentData,
    deleteStudentData,
    searchNIN,
    generateNewAdmissionNumber
  }
}
