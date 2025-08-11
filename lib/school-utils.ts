import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SchoolInfo {
  school_id: string
  schoolName: string
  stage?: string // Add stage to the interface
}

export async function getCurrentSchoolInfo(): Promise<SchoolInfo> {
  try {
    // Prefer values set by AuthProvider; fallback to existing localStorage keys
    const adminId = typeof window !== "undefined" ? localStorage.getItem("adminId") : null

    if (!adminId) {
      return {
        school_id: "unknown",
        schoolName: "",
        stage: "",
      }
    }

    const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
    if (adminDoc.exists()) {
      const adminData: any = adminDoc.data()
      const schoolId = adminData.school_id

      // Fetch school stage and school name from the 'schools' collection via school_id
      let schoolStage = ""
      let schoolName = adminData.schoolname || adminData.schoolName || ""

      if (schoolId) {
        const schoolsRef = collection(db, "schools")
        const schoolsQuery = query(schoolsRef, where("school_id", "==", schoolId))
        const schoolsSnapshot = await getDocs(schoolsQuery)
        if (!schoolsSnapshot.empty) {
          const schoolDoc = schoolsSnapshot.docs[0]
          const schoolData: any = schoolDoc.data()
          schoolStage = schoolData.stage || ""
          if (schoolData.school_name) {
            schoolName = schoolData.school_name
          }
        }
      }

      return {
        school_id: schoolId || adminId,
        schoolName,
        stage: schoolStage,
      }
    }

    return {
      school_id: adminId,
      schoolName: "",
      stage: "",
    }
  } catch (error) {
    console.error("Error fetching school admin data:", error)
    return {
      school_id: "error",
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
    const studentsRef = collection(db, "students")
    const studentsQuery = query(studentsRef, where("school_id", "==", schoolId))
    const studentsSnapshot = await getDocs(studentsQuery)

    const studentCounts: { [className: string]: number } = {}

    studentsSnapshot.docs.forEach((doc) => {
      const studentData: any = doc.data()
      const className = studentData.class || "Unassigned"
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
    const studentsRef = collection(db, "students")
    const studentsQuery = query(studentsRef, where("school_id", "==", schoolId))
    const studentsSnapshot = await getDocs(studentsQuery)

    return studentsSnapshot.size
  } catch (error) {
    console.error("Error fetching total student count:", error)
    return 0
  }
}

export async function generateAdmissionNumber(schoolId: string, year: string): Promise<string> {
  try {
    // Get all students for this school and year
    const studentsRef = collection(db, "students")
    const studentsQuery = query(
      studentsRef,
      where("school_id", "==", schoolId),
      where("batch", "==", year)
    )
    const studentsSnapshot = await getDocs(studentsQuery)

    // Count existing students for this school and year
    const existingCount = studentsSnapshot.size

    // Generate the next number (001, 002, etc.)
    const nextNumber = (existingCount + 1).toString().padStart(3, '0')

    // Format: SCHOOL_ID + YEAR + SEQUENTIAL_NUMBER
    return `${schoolId}${year}${nextNumber}`
  } catch (error) {
    console.error("Error generating admission number:", error)
    // Fallback to timestamp-based generation
    return `${schoolId}${year}${Date.now().toString().slice(-3)}`
  }
}
