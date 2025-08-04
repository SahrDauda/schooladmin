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
import { useClasses } from "@/hooks/use-classes"
import { ClassForm } from "@/components/class-form"
import { ClassMetrics } from "@/components/class-metrics"
import { ClassTable } from "@/components/class-table"
import { ClassDialog } from "@/components/class-dialog"
import type { ClassWithDetails } from "@/lib/class-utils"

export default function ClassesPage() {
  const {
    classes,
    teachers,
    isLoading,
    isSubmitting,
    schoolInfo,
    metrics,
    addClass,
    updateClassData,
    deleteClassData,
    getLevelOptions,
  } = useClasses()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const handleAddClass = async (classData: any) => {
    const success = await addClass(classData)
    if (success) {
      setIsAddDialogOpen(false)
    }
    return success
  }

  const handleUpdateClass = async (classId: string, updateData: any, previousTeacherId?: string) => {
    return await updateClassData(classId, updateData, previousTeacherId)
  }

  const handleDeleteClass = async (classId: string) => {
    return await deleteClassData(classId)
  }

  const handleViewClass = (classData: ClassWithDetails) => {
    setSelectedClass(classData)
    setIsViewDialogOpen(true)
  }

  const handleEditClass = (classData: ClassWithDetails) => {
    setSelectedClass(classData)
    setIsViewDialogOpen(true)
  }

  const levelOptions = getLevelOptions()

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Classes</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Class</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Class</DialogTitle>
                  <DialogDescription>Fill out the form below to add a new class.</DialogDescription>
                </DialogHeader>
                <ClassForm
                  mode="add"
                  teachers={teachers}
                  levelOptions={levelOptions}
                  onSubmit={handleAddClass}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {/* Metrics Dashboard */}
            <ClassMetrics metrics={metrics} />

            {/* Classes Table */}
            <ClassTable
              classes={classes}
              teachers={teachers}
              onViewClass={handleViewClass}
              onEditClass={handleEditClass}
              onDeleteClass={handleDeleteClass}
              isLoading={isLoading}
            />

            {/* Class Details Dialog */}
            <ClassDialog
              classData={selectedClass}
              teachers={teachers}
              levelOptions={levelOptions}
              isOpen={isViewDialogOpen}
              onClose={() => {
                setIsViewDialogOpen(false)
                setSelectedClass(null)
              }}
              onUpdate={handleUpdateClass}
              onDelete={handleDeleteClass}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
