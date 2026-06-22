"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useStudents } from "@/hooks/use-students"
import { StudentForm } from "@/components/student-form"
import { StudentMetrics } from "@/components/student-metrics"
import { StudentTable } from "@/components/student-table"
import { StudentDialog } from "@/components/student-dialog"
import { ParentForm } from "@/components/parent-form"
import type { StudentWithDetails } from "@/lib/student-utils"

export default function StudentsPage() {
  const {
    students,
    classes,
    isLoading,
    isSubmitting,
    schoolInfo,
    metrics,
    addStudent,
    updateStudentData,
    deleteStudentData,
    searchNIN,
    generateNewAdmissionNumber,
    refreshStudents
  } = useStudents()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isParentDialogOpen, setIsParentDialogOpen] = useState(false)

  const handleAddStudent = async (studentData: any) => {
    const success = await addStudent(studentData)
    if (success) {
      setIsAddDialogOpen(false)
    }
    return success
  }

  const handleUpdateStudent = async (studentId: string, updateData: any) => {
    return await updateStudentData(studentId, updateData)
  }

  const handleDeleteStudent = async (studentId: string) => {
    return await deleteStudentData(studentId)
  }

  const handleViewStudent = (studentData: StudentWithDetails) => {
    setSelectedStudent(studentData)
    setIsViewDialogOpen(true)
  }

  const handleEditStudent = (studentData: StudentWithDetails) => {
    setSelectedStudent(studentData)
    setIsViewDialogOpen(true) // Editing happens inside the same dialog
  }

  const handleAddParent = (studentData: StudentWithDetails) => {
    setSelectedStudent(studentData)
    setIsParentDialogOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Students Dashboard</CardTitle>
            <div className="flex gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    <span>Add Student</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] w-[90%] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>Fill out the form below to register a new student.</DialogDescription>
                  </DialogHeader>
                  <StudentForm
                    classes={classes}
                    onSubmit={handleAddStudent}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isSubmitting={isSubmitting}
                    searchNIN={searchNIN}
                    generateNewAdmissionNumber={generateNewAdmissionNumber}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Metrics Dashboard */}
            <StudentMetrics metrics={metrics} />

            {/* Students Table */}
            <StudentTable
              students={students}
              classes={classes}
              onViewStudent={handleViewStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onAddParent={handleAddParent}
              isLoading={isLoading}
            />

            {/* Student Details Dialog */}
            <StudentDialog
              studentData={selectedStudent}
              classes={classes}
              isOpen={isViewDialogOpen}
              onClose={() => {
                setIsViewDialogOpen(false)
                setSelectedStudent(null)
              }}
              onUpdate={handleUpdateStudent}
              onDelete={handleDeleteStudent}
              isSubmitting={isSubmitting}
            />

            {/* Parent Add/Link Dialog */}
            <ParentForm
              student={selectedStudent}
              isOpen={isParentDialogOpen}
              onClose={() => {
                setIsParentDialogOpen(false)
                setSelectedStudent(null)
              }}
              onSuccess={() => refreshStudents()}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
