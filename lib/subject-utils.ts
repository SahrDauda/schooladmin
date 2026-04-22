
import { supabase } from "@/lib/supabase"

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
        // Check if assignment already exists
        const { data: existingAssignments, error } = await supabase
            .from('subject_assignments')
            .select('id')
            .eq('student_id', studentId)
            .eq('subject_id', subjectId)
            .eq('school_id', schoolId)
        //.eq('status', 'active') // Check all statuses? Or just active?

        if (error) throw error

        if (existingAssignments && existingAssignments.length > 0) {
            // If exists but inactive, maybe reactivate? For now, just throw.
            throw new Error("Student is already assigned to this subject")
        }

        const assignmentData: SubjectAssignment = {
            student_id: studentId,
            subject_id: subjectId,
            school_id: schoolId,
            assigned_by: adminId,
            assigned_at: new Date().toISOString(),
            session_id: sessionId,
            term_id: termId,
            status: "active"
        }

        const { data: newAssignment, error: insertError } = await supabase
            .from('subject_assignments')
            .insert(assignmentData)
            .select()
            .single()

        if (insertError) throw insertError

        return newAssignment.id
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
        const { error } = await supabase
            .from('subject_assignments')
            .delete()
            .eq('id', assignmentId)

        if (error) throw error
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
        const { data: assignments, error } = await supabase
            .from('subject_assignments')
            .select('*')
            .eq('school_id', schoolId)
        //.eq('status', 'active')

        if (error) throw error

        return assignments as SubjectAssignment[]
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
        const { data: assignments, error: assignmentsError } = await supabase
            .from('subject_assignments')
            .select('student_id')
            .eq('subject_id', subjectId)
            .eq('school_id', schoolId)
        //.eq('status', 'active')

        if (assignmentsError) throw assignmentsError

        const studentIds = assignments.map(a => a.student_id)

        if (studentIds.length === 0) return []

        // Fetch student details
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('school_id', schoolId)
            .in('id', studentIds)

        if (studentsError) throw studentsError

        return students || []
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
        const { data: assignments, error: assignmentsError } = await supabase
            .from('subject_assignments')
            .select('subject_id')
            .eq('student_id', studentId)
            .eq('school_id', schoolId)
        //.eq('status', 'active')

        if (assignmentsError) throw assignmentsError

        const subjectIds = assignments.map(a => a.subject_id)

        if (subjectIds.length === 0) return []

        // Fetch subject details
        const { data: subjects, error: subjectsError } = await supabase
            .from('subjects')
            .select('*')
            .eq('school_id', schoolId)
            .in('id', subjectIds)

        if (subjectsError) throw subjectsError

        return subjects || []
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
        const assignmentIds: string[] = []

        for (const studentId of studentIds) {
            try {
                const assignmentId = await assignStudentToSubject(
                    studentId,
                    subjectId,
                    schoolId,
                    adminId,
                    sessionId,
                    termId
                )
                assignmentIds.push(assignmentId)
            } catch (error) {
                console.error(`Failed to assign student ${studentId} to subject ${subjectId}: `, error)
                // Continue with other assignments
            }
        }

        return assignmentIds
    } catch (error) {
        console.error("Error in bulk assignment:", error)
        throw error
    }
}
