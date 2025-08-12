import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { auth } from "@/lib/firebase"

export interface SchoolInfo {
  school_id: string
  schoolName: string
  stage?: string // Add stage to the interface
}

export async function getCurrentSchoolInfo(): Promise<SchoolInfo> {
  try {
    // Prefer values set by AuthProvider; fallback to existing localStorage keys
    const adminIdFromStorage = typeof window !== "undefined" ? localStorage.getItem("adminId") : null
    const uid = auth?.currentUser?.uid || null

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
        const aDoc = await getDoc(doc(db, "schooladmin", candId))
        if (aDoc.exists()) {
          resolvedAdminData = aDoc.data()
          resolvedAdminDocId = candId
          break
        }
      } catch (error) {
        console.warn(`Failed to read admin document for ID ${candId}:`, error)
        // Continue to next candidate instead of ignoring
        continue
      }
    }

    // If we couldn't read by ID, try to read by email (this should work with current rules)
    if (!resolvedAdminData && auth?.currentUser?.email) {
      try {
        console.log("Trying to find admin by email:", auth.currentUser.email)
        const adminQuery = query(
          collection(db, "schooladmin"),
          where("emailaddress", "==", auth.currentUser.email)
        )
        const adminSnapshot = await getDocs(adminQuery)

        if (adminSnapshot.empty) {
          // Try email field as fallback
          const adminQuery2 = query(
            collection(db, "schooladmin"),
            where("email", "==", auth.currentUser.email)
          )
          const adminSnapshot2 = await getDocs(adminQuery2)

          if (!adminSnapshot2.empty) {
            const adminDoc = adminSnapshot2.docs[0]
            resolvedAdminData = adminDoc.data()
            resolvedAdminDocId = adminDoc.id
            console.log("Found admin by email field:", resolvedAdminData)
          }
        } else {
          const adminDoc = adminSnapshot.docs[0]
          resolvedAdminData = adminDoc.data()
          resolvedAdminDocId = adminDoc.id
          console.log("Found admin by emailaddress field:", resolvedAdminData)
        }
      } catch (error) {
        console.error("Failed to find admin by email:", error)
      }
    }

    if (resolvedAdminData) {
      const schoolId = resolvedAdminData.school_id

      // Fetch school stage and school name from the 'schools' collection via school_id
      let schoolStage = ""
      let schoolName = resolvedAdminData.schoolname || resolvedAdminData.schoolName || ""

      if (schoolId) {
        const schoolsRef = collection(db, "schools")
        const schoolsQuery = query(schoolsRef, where("school_id", "==", schoolId))
        try {
          const schoolsSnapshot = await getDocs(schoolsQuery)
          if (!schoolsSnapshot.empty) {
            const schoolDoc = schoolsSnapshot.docs[0]
            const schoolData: any = schoolDoc.data()
            schoolStage = schoolData.stage || ""
            if (schoolData.school_name) {
              schoolName = schoolData.school_name
            }
          }
        } catch (error) {
          console.warn("Failed to read schools collection:", error)
          // If schools read is blocked by rules, still return school_id and whatever name we have
        }
      }

      return {
        school_id: schoolId || resolvedAdminDocId!,
        schoolName,
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
    // Do not poison downstream with "error" school_id; return unknown for resilience
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
