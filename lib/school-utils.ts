import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SchoolInfo {
  school_id: string
  schoolName: string
  stage?: string // Add stage to the interface
}

export async function getCurrentSchoolInfo(): Promise<SchoolInfo> {
  try {
    const adminId = localStorage.getItem("adminId")
    console.log("getCurrentSchoolInfo - adminId:", adminId)
    
    if (!adminId) {
      console.log("getCurrentSchoolInfo - No adminId found")
      return {
        school_id: "unknown",
        schoolName: "",
        stage: "",
      }
    }

    const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
    console.log("getCurrentSchoolInfo - adminDoc exists:", adminDoc.exists())
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data()
      const schoolId = adminData.school_id
      console.log("getCurrentSchoolInfo - schoolId from admin:", schoolId)

      // Fetch school stage from the 'schools' collection using school_id as foreign key
      let schoolStage = ""
      let schoolName = adminData.schoolname || adminData.schoolName || ""
      
      if (schoolId) {
        // Query schools collection by school_id field instead of using it as document ID
        const schoolsRef = collection(db, "schools")
        const schoolsQuery = query(schoolsRef, where("school_id", "==", schoolId))
        const schoolsSnapshot = await getDocs(schoolsQuery)
        console.log("getCurrentSchoolInfo - schools query result size:", schoolsSnapshot.size)
        
        if (!schoolsSnapshot.empty) {
          const schoolDoc = schoolsSnapshot.docs[0]
          const schoolData = schoolDoc.data()
          schoolStage = schoolData.stage || ""
          console.log("getCurrentSchoolInfo - schoolData.stage:", schoolData.stage)
          console.log("getCurrentSchoolInfo - schoolStage set to:", schoolStage)
          
          // Also get school name from schools collection if available
          if (schoolData.school_name) {
            schoolName = schoolData.school_name
          }
        } else {
          console.log("getCurrentSchoolInfo - No school document found with school_id:", schoolId)
        }
      } else {
        console.log("getCurrentSchoolInfo - No schoolId found in admin data")
      }

      const result = {
        school_id: schoolId || adminId,
        schoolName: schoolName,
        stage: schoolStage,
      }
      console.log("getCurrentSchoolInfo - returning:", result)
      return result
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
