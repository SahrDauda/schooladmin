"use server"

import { fetchApi } from "@/lib/api-client"
import { cookies } from "next/headers"

const getCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll().map((c: any) => `${c.name}=${c.value}`).join('; ');
}

export async function getDashboardStats(schoolId: string) {
  try {
    const response = await fetchApi<any>(`/dashboard/stats/${schoolId}`, {
      headers: {
        'Cookie': await getCookieHeader()
      }
    })
    
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching dashboard stats from API:", error)
    return null
  }
}

export async function getAdminProfile(userId: string, userEmail?: string) {
  try {
    const response = await fetchApi<any>('/auth/me', {
      headers: {
        'Cookie': await getCookieHeader()
      }
    });
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching admin profile via API:", error);
    return null;
  }
}

export async function updateAdminProfile(userId: string, data: any) {
  try {
    const response = await fetchApi('/auth/me', {
      method: 'PUT',
      headers: {
        'Cookie': await getCookieHeader()
      },
      body: JSON.stringify(data),
    });
    return { success: response.success, data: response.data, error: response.message };
  } catch (error: any) {
    console.error("Error updating admin profile via API:", error);
    return { success: false, error: error.message };
  }
}
