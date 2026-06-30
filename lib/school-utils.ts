"use server"
import { getAdminProfile } from "@/lib/dashboard-utils"
import { fetchApi } from "@/lib/api-client"
import { cookies } from "next/headers"

const getCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll().map((c: any) => `${c.name}=${c.value}`).join('; ');
}
export interface SchoolInfo {
  school_id: string
  schoolName: string
  stage?: string
}

export async function getCurrentSchoolInfo(): Promise<SchoolInfo> {
  try {
    // Instead of parsing from supabase, we use the backend /auth/me
    const adminProfile = await getAdminProfile("", "");
    
    if (adminProfile) {
      return {
        school_id: adminProfile.school_id || adminProfile.id,
        schoolName: adminProfile.schoolName || "",
        stage: adminProfile.schoolStage || "",
      }
    }

    return {
      school_id: "unknown",
      schoolName: "",
      stage: "",
    }
  } catch (error) {
    console.error("Error fetching school admin data via API:", error)
    return {
      school_id: "unknown",
      schoolName: "",
      stage: "",
    }
  }
}


export async function getStudentCountsByClass(schoolId: string): Promise<{ [className: string]: number }> {
  try {
    const response = await fetchApi<{ [className: string]: number }>(`/school/${schoolId}/student-counts`, {
      headers: { 'Cookie': await getCookieHeader() }
    });

    if (response.success && response.data) {
      return response.data;
    }
    return {};
  } catch (error) {
    console.error("Error fetching student counts by class:", error)
    return {}
  }
}

export async function getTotalStudentCount(schoolId: string): Promise<number> {
  try {
    const response = await fetchApi<number>(`/school/${schoolId}/total-students`, {
      headers: { 'Cookie': await getCookieHeader() }
    });
    
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching total student count:", error)
    return 0
  }
}

export async function generateAdmissionNumber(schoolId: string, year: string): Promise<string> {
  try {
    const response = await fetchApi<string>(`/school/${schoolId}/generate-admission-number?year=${year}`, {
      headers: { 'Cookie': await getCookieHeader() }
    });

    if (response.success && response.data) {
      return response.data;
    }
    return `${year}${Date.now().toString().slice(-3)}`
  } catch (error) {
    console.error("Error generating admission number:", error)
    return `${year}${Date.now().toString().slice(-3)}`
  }
}


