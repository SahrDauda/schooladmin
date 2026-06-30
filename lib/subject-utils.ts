"use server"

import { fetchApi } from "@/lib/api-client"
import { cookies } from "next/headers"

const getCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll().map((c: any) => `${c.name}=${c.value}`).join('; ');
}

export interface SubjectAssignment {
    id?: string
    student_id: string
    subject_id: string
    school_id: string
    assigned_by: string // admin ID
    assigned_at: any
    session_id?: string
    term_id?: string
    status: "active" | "inactive"
}

export interface StudentSubjectData {
    student: any
    subject: any
    assignment: SubjectAssignment
}

/**
 * Assign a student to a subject
 */
export async function assignStudentToSubject(
    studentId: string,
    subjectId: string,
    schoolId: string,
    adminId: string,
    sessionId?: string,
    termId?: string
): Promise<string> {
    try {
        const response = await fetchApi<string>('/subjects/assign', {
            method: 'POST',
            headers: { 'Cookie': await getCookieHeader() },
            body: JSON.stringify({
                studentId,
                subjectId,
                schoolId,
                adminId,
                sessionId,
                termId
            })
        });

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to assign student to subject");
        }

        return response.data;
    } catch (error) {
        console.error("Error assigning student to subject:", error)
        throw error
    }
}

/**
 * Remove a student from a subject
 */
export async function removeStudentFromSubject(assignmentId: string): Promise<void> {
    try {
        const response = await fetchApi(`/subjects/assignments/${assignmentId}`, {
            method: 'DELETE',
            headers: { 'Cookie': await getCookieHeader() }
        });

        if (!response.success) {
            throw new Error(response.message || "Failed to remove assignment");
        }
    } catch (error) {
        console.error("Error removing student from subject:", error)
        throw error
    }
}

/**
 * Get all subject assignments for a school
 */
export async function getSubjectAssignments(schoolId: string): Promise<SubjectAssignment[]> {
    try {
        const response = await fetchApi<SubjectAssignment[]>(`/subjects/assignments/school/${schoolId}`, {
            headers: { 'Cookie': await getCookieHeader() }
        });

        if (response.success && response.data) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching subject assignments:", error)
        throw error
    }
}

/**
 * Get students assigned to a specific subject
 */
export async function getStudentsForSubject(subjectId: string, schoolId: string): Promise<any[]> {
    try {
        const response = await fetchApi<any[]>(`/subjects/${subjectId}/students/${schoolId}`, {
            headers: { 'Cookie': await getCookieHeader() }
        });

        if (response.success && response.data) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching students for subject:", error)
        throw error
    }
}

/**
 * Get subjects assigned to a specific student
 */
export async function getSubjectsForStudent(studentId: string, schoolId: string): Promise<any[]> {
    try {
        const response = await fetchApi<any[]>(`/subjects/student/${studentId}/subjects/${schoolId}`, {
            headers: { 'Cookie': await getCookieHeader() }
        });

        if (response.success && response.data) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching subjects for student:", error)
        throw error
    }
}

/**
 * Bulk assign multiple students to a subject
 */
export async function bulkAssignStudentsToSubject(
    studentIds: string[],
    subjectId: string,
    schoolId: string,
    adminId: string,
    sessionId?: string,
    termId?: string
): Promise<string[]> {
    try {
        const response = await fetchApi<string[]>('/subjects/bulk-assign', {
            method: 'POST',
            headers: { 'Cookie': await getCookieHeader() },
            body: JSON.stringify({
                studentIds,
                subjectId,
                schoolId,
                adminId,
                sessionId,
                termId
            })
        });

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to bulk assign");
        }

        return response.data;
    } catch (error) {
        console.error("Error in bulk assignment:", error)
        throw error
    }
}
