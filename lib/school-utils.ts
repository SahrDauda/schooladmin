import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SchoolInfo {
  school_id: string
  schoolName: string
}

export async function getCurrentSchoolInfo(): Promise<SchoolInfo> {
  try {
    const adminId = localStorage.getItem("adminId")
    if (!adminId) {
      return {
        school_id: "unknown",
        schoolName: "Unknown School",
      }
    }

    const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
    if (adminDoc.exists()) {
      const adminData = adminDoc.data()
      return {
        school_id: adminData.school_id || adminId,
        schoolName: adminData.schoolName || "Holy Family Junior Secondary School",
      }
    }

    return {
      school_id: adminId,
      schoolName: "Holy Family Junior Secondary School",
    }
  } catch (error) {
    console.error("Error fetching school admin data:", error)
    return {
      school_id: "error",
      schoolName: "Error Loading School",
    }
  }
}

export function getCurrentSchoolInfoSync(): SchoolInfo {
  const adminId = typeof window !== "undefined" ? localStorage.getItem("adminId") : null

  return {
    school_id: adminId || "unknown",
    schoolName: "Holy Family Junior Secondary School",
  }
}
