"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { StudentForm } from "./student-form"
import type { StudentWithDetails } from "@/lib/student-utils"

interface StudentDialogProps {
  studentData: StudentWithDetails | null
  classes: any[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (studentId: string, data: any) => Promise<boolean>
  onDelete: (studentId: string) => Promise<boolean>
  isSubmitting?: boolean
}

export function StudentDialog({
  studentData,
  classes,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  isSubmitting = false
}: StudentDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset state when student data changes or dialog closes
  useEffect(() => {
    setIsEditing(false)
    setShowDeleteConfirm(false)
  }, [studentData, isOpen])

  const handleDelete = async () => {
    if (!studentData) return
    const success = await onDelete(studentData.id)
    if (success) {
      onClose()
    }
  }

  const handleUpdate = async (data: any) => {
    if (!studentData) return false
    const success = await onUpdate(studentData.id, data)
    if (success) {
      setIsEditing(false)
    }
    return success
  }

  if (!studentData) return null

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === "active") return "bg-green-100 text-green-800"
    if (s === "inactive" || s === "suspended") return "bg-red-100 text-red-800"
    if (s === "graduated") return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-[90%] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Student Information</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edit student details below" : "View student information"}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogHeader>

        {isEditing ? (
          <StudentForm
            initialData={studentData}
            classes={classes}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
              <div className="md:col-span-2 flex items-center space-x-4 mb-2">
                {studentData.passport_url ? (
                  <img 
                    src={studentData.passport_url} 
                    alt="avatar" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                    {studentData.firstname?.charAt(0)}{studentData.lastname?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{studentData.firstname} {studentData.lastname} {studentData.othernames}</h2>
                  <p className="text-muted-foreground">{studentData.admission_number || "No Admission Number"}</p>
                </div>
              </div>

              <div>
                <Label className="font-bold text-muted-foreground">Class</Label>
                <p>{studentData.class_name || "Not Assigned"}</p>
              </div>

              <div>
                <Label className="font-bold text-muted-foreground">Status</Label>
                <div>
                  <Badge className={getStatusColor(studentData.status || "")}>
                    {studentData.status || "Unknown"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="font-bold text-muted-foreground">Gender</Label>
                <p>{studentData.gender || "N/A"}</p>
              </div>

              <div>
                <Label className="font-bold text-muted-foreground">Date of Birth</Label>
                <p>{studentData.dateofbirth ? new Date(studentData.dateofbirth).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
              <h3 className="font-semibold text-lg md:col-span-2">Contact Details</h3>

              <div className="md:col-span-2">
                <Label className="font-bold text-muted-foreground">Home Address</Label>
                <p>{studentData.address || "N/A"}</p>
              </div>

              <div>
                <Label className="font-bold text-muted-foreground">Guardian Phone</Label>
                <p>{studentData.guardian_phone || "N/A"}</p>
              </div>

              <div>
                <Label className="font-bold text-muted-foreground">Guardian Email</Label>
                <p>{studentData.guardian_email || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="font-semibold text-lg md:col-span-2">Health Details</h3>

              <div>
                <Label className="font-bold text-muted-foreground">Disability</Label>
                <p>{studentData.is_disabled ? "Yes" : "No"}</p>
              </div>

              <div>
                <Label className="font-bold text-muted-foreground">Medical Conditions</Label>
                <p>{studentData.health_status || "None reported"}</p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              {!showDeleteConfirm ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Student
                  </Button>
                </>
              ) : (
                <div className="w-full flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-200">
                  <span className="text-red-800 text-sm font-medium">Are you sure? This cannot be undone.</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
