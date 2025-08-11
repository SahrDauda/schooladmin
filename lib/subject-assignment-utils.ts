import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SubjectAssignment {
    id?: string
    student_id: string
    subject_id: string
    school_id: string
    assigned_by: string // admin ID
    assigned_at: any
    academic_year?: string
    term?: string
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
    academicYear?: string,
    term?: string
): Promise<string> {
    try {
        // Check if assignment already exists
        const existingQuery = query(
            collection(db, "subject_assignments"),
            where("student_id", "==", studentId),
            where("subject_id", "==", subjectId),
            where("school_id", "==", schoolId),
            where("status", "==", "active")
        )

        const existingSnapshot = await getDocs(existingQuery)
        if (!existingSnapshot.empty) {
            throw new Error("Student is already assigned to this subject")
        }

        const assignmentData: SubjectAssignment = {
            student_id: studentId,
            subject_id: subjectId,
            school_id: schoolId,
            assigned_by: adminId,
            assigned_at: Timestamp.fromDate(new Date()),
            academic_year: academicYear || new Date().getFullYear().toString(),
            term: term || "Full Year",
            status: "active"
        }

        const docRef = await addDoc(collection(db, "subject_assignments"), assignmentData)
        return docRef.id
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
        await deleteDoc(doc(db, "subject_assignments", assignmentId))
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
        const querySnapshot = await getDocs(
            query(
                collection(db, "subject_assignments"),
                where("school_id", "==", schoolId),
                where("status", "==", "active")
            )
        )

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SubjectAssignment[]
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
        const assignmentsQuery = query(
            collection(db, "subject_assignments"),
            where("subject_id", "==", subjectId),
            where("school_id", "==", schoolId),
            where("status", "==", "active")
        )

        const assignmentsSnapshot = await getDocs(assignmentsQuery)
        const studentIds = assignmentsSnapshot.docs.map(doc => doc.data().student_id)

        if (studentIds.length === 0) return []

        // Fetch student details
        const studentsQuery = query(
            collection(db, "students"),
            where("school_id", "==", schoolId)
        )

        const studentsSnapshot = await getDocs(studentsQuery)
        const students = studentsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(student => studentIds.includes(student.id))

        return students
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
        const assignmentsQuery = query(
            collection(db, "subject_assignments"),
            where("student_id", "==", studentId),
            where("school_id", "==", schoolId),
            where("status", "==", "active")
        )

        const assignmentsSnapshot = await getDocs(assignmentsQuery)
        const subjectIds = assignmentsSnapshot.docs.map(doc => doc.data().subject_id)

        if (subjectIds.length === 0) return []

        // Fetch subject details
        const subjectsQuery = query(
            collection(db, "subjects"),
            where("school_id", "==", schoolId)
        )

        const subjectsSnapshot = await getDocs(subjectsQuery)
        const subjects = subjectsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(subject => subjectIds.includes(subject.id))

        return subjects
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
    academicYear?: string,
    term?: string
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
                    academicYear,
                    term
                )
                assignmentIds.push(assignmentId)
            } catch (error) {
                console.error(`Failed to assign student ${studentId} to subject ${subjectId}:`, error)
                // Continue with other assignments
            }
        }

        return assignmentIds
    } catch (error) {
        console.error("Error in bulk assignment:", error)
        throw error
    }
} 