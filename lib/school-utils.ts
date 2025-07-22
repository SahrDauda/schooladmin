import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SchoolInfo {
  school_id: string
  schoolName: string
  stage?: string // Add stage to the interface
}

export async function getCurrentSchoolInfo(): Promise<SchoolInfo> {
  try {
    const adminId = localStorage.getItem("adminId")
    if (!adminId) {
      return {
        school_id: "unknown",
        schoolName: "Unknown School",
        stage: "senior secondary", // Default stage if adminId is not found
      }
    }

    const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
    if (adminDoc.exists()) {
      const adminData = adminDoc.data()
      const schoolId = adminData.school_id || adminId

      // Fetch school stage from the 'schools' collection
      const schoolDoc = await getDoc(doc(db, "schools", schoolId))
      const schoolStage = schoolDoc.exists() ? schoolDoc.data().stage : "senior secondary"

      return {
        school_id: schoolId,
        schoolName: adminData.schoolName || "Holy Family Junior Secondary School",
        stage: schoolStage,
      }
    }

    return {
      school_id: adminId,
      schoolName: "Holy Family Junior Secondary School",
      stage: "senior secondary", // Default stage if adminDoc doesn't exist
    }
  } catch (error) {
    console.error("Error fetching school admin data:", error)
    return {
      school_id: "error",
      schoolName: "Error Loading School",
      stage: "senior secondary", // Default stage on error
    }
  }
}

export function getCurrentSchoolInfoSync(): SchoolInfo {
  const adminId = typeof window !== "undefined" ? localStorage.getItem("adminId") : null

  return {
    school_id: adminId || "unknown",
    schoolName: "Holy Family Junior Secondary School",
    stage: "senior secondary", // Default stage for sync function
  }
}
