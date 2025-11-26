import { supabase } from "@/lib/supabase"

export interface SchoolInfo {
  school_id: string
  schoolName: string
  stage?: string
}

export async function getCurrentSchoolInfo(): Promise<SchoolInfo> {
  try {
    // Prefer values set by AuthProvider; fallback to existing localStorage keys
    const adminIdFromStorage = typeof window !== "undefined" ? localStorage.getItem("adminId") : null

    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id || null

    const candidateIds = [adminIdFromStorage, uid].filter(Boolean) as string[]

    if (candidateIds.length === 0) {
      return {
        school_id: "unknown",
        schoolName: "",
        stage: "",
      }
    }

    let resolvedAdminData: any | null = null
    let resolvedAdminDocId: string | null = null

    // Try reading admin profile by possible IDs (localStorage and/or UID)
    for (const candId of candidateIds) {
      try {
        const { data: aDoc, error } = await supabase
          .from('schooladmin')
          .select('*')
          .eq('id', candId)
          .single()

        if (!error && aDoc) {
          resolvedAdminData = aDoc
          resolvedAdminDocId = candId
          break
        }
      } catch (error) {
        console.warn(`Failed to read admin document for ID ${candId}:`, error)
        continue
      }
    }

    if (resolvedAdminData) {
      const schoolId = resolvedAdminData.school_id

      // Fetch school details from the 'schools' table via school_id
      let schoolStage = ""
      let schoolName = ""

      if (schoolId) {
        try {
          const { data: schoolData, error } = await supabase
            .from('schools')
            .select('*')
            .eq('id', schoolId)
            .single()

          if (!error && schoolData) {
            // Assuming 'stage' might be a field in schools table or derived
            // For now, we'll check if it exists, otherwise default
            schoolName = schoolData.name || ""
            // If stage is not in schools table, we might need to add it or infer it
            // For now, let's assume it might be there or we leave it empty
            schoolStage = (schoolData as any).stage || ""
          }
        } catch (error) {
          console.warn("Failed to read schools table:", error)
        }
      }

      return {
        school_id: schoolId || resolvedAdminDocId!,
        schoolName: schoolName || resolvedAdminData.schoolname || resolvedAdminData.schoolName || "",
        stage: schoolStage,
      }
    }

    // Could not read any admin profile, fallback to first candidateId
    console.warn("Could not read admin profile, using fallback ID:", candidateIds[0])
    return {
      school_id: candidateIds[0],
      schoolName: "",
      stage: "",
    }
  } catch (error) {
    console.error("Error fetching school admin data:", error)
    return {
      school_id: "unknown",
      schoolName: "",
      stage: "",
    }
  }
}

export function getCurrentSchoolInfoSync(): SchoolInfo {
  const adminId = typeof window !== "undefined" ? localStorage.getItem("adminId") : null

  return {
    school_id: adminId || "unknown",
    schoolName: "",
    stage: "",
  }
}

export async function getStudentCountsByClass(schoolId: string): Promise<{ [className: string]: number }> {
  try {
    // We need to join with classes table to get class names if we only have class_id in students
    // But students table has class_id (UUID). 
    // We want counts by class NAME.

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)

    if (classesError) throw classesError

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('class_id')
      .eq('school_id', schoolId)

    if (studentsError) throw studentsError

    const studentCounts: { [className: string]: number } = {}
    const classMap = new Map(classes?.map(c => [c.id, c.name]))

    students?.forEach((student: any) => {
      const className = classMap.get(student.class_id) || "Unassigned"
      studentCounts[className] = (studentCounts[className] || 0) + 1
    })

    return studentCounts
  } catch (error) {
    console.error("Error fetching student counts by class:", error)
    return {}
  }
}

export async function getTotalStudentCount(schoolId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error("Error fetching total student count:", error)
    return 0
  }
}

export async function generateAdmissionNumber(schoolId: string, year: string): Promise<string> {
  try {
    // Get count of students for this school to generate sequential number
    // Note: This is a simple approach. For strict uniqueness, we might need a sequence or atomic increment.
    // But for now, count + 1 is reasonable for low concurrency.

    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)

    if (error) throw error

    const existingCount = count || 0
    const nextNumber = (existingCount + 1).toString().padStart(3, '0')

    // Format: SCH-YEAR-NUM (e.g., SCH-2024-001)
    // We might want a school code/prefix if available in schools table

    return `${year}${nextNumber}`
  } catch (error) {
    console.error("Error generating admission number:", error)
    return `${year}${Date.now().toString().slice(-3)}`
  }
}


