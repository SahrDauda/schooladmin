"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import type { ClassWithDetails } from "@/lib/class-utils"

interface ClassDialogProps {
  classData: ClassWithDetails | null
  teachers: any[]
  levelOptions: string[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (classId: string, data: any, previousTeacherId?: string) => Promise<boolean>
  onDelete: (classId: string) => Promise<boolean>
  isSubmitting?: boolean
}

export function ClassDialog({
  classData,
  teachers,
  levelOptions,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  isSubmitting = false
}: ClassDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    level: "",
    section: "",
    capacity: "",
    teacher_id: "",
    description: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when class data changes
  useEffect(() => {
    if (classData) {
      setEditFormData({
        name: classData.name || "",
        level: classData.level || "",
        section: classData.section || "",
        capacity: classData.capacity?.toString() || "",
        teacher_id: classData.teacher_id || "",
        description: classData.description || "",
      })
      setErrors({})
      setIsEditing(false)
      setShowDeleteConfirm(false)
    }
  }, [classData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setEditFormData(prev => ({ ...prev, [id]: value }))
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }))
    }
  }

  const handleSelectChange = (field: string, value: string) => {
    setEditFormData(prev => ({ 
      ...prev, 
      [field]: value === "none" ? "" : value 
    }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!editFormData.name.trim()) {
      newErrors.name = "Class name is required"
    }

    if (!editFormData.level) {
      newErrors.level = "Level is required"
    }

    if (!editFormData.capacity || Number(editFormData.capacity) < 1) {
      newErrors.capacity = "Capacity must be at least 1"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !classData) return

    const submitData = {
      ...editFormData,
      capacity: Number(editFormData.capacity),
    }

    const success = await onUpdate(classData.id, submitData, classData.teacher_id)
    if (success) {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!classData) return

    const success = await onDelete(classData.id)
    if (success) {
      onClose()
    }
    setShowDeleteConfirm(false)
  }

  const getOccupancyStatus = (occupancyRate: number) => {
    if (occupancyRate >= 90) return { color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4" /> }
    if (occupancyRate >= 75) return { color: "bg-amber-100 text-amber-800", icon: <AlertTriangle className="h-4 w-4" /> }
    if (occupancyRate >= 50) return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-4 w-4" /> }
    return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> }
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Not Assigned"
  }

  if (!classData) return null

  const occupancyStatus = getOccupancyStatus(classData.occupancy_rate || 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Class Information</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edit class details below" : "View class information"}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Class Name *</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit_level">Level *</Label>
                <Select
                  value={editFormData.level}
                  onValueChange={(value) => handleSelectChange("level", value)}
                >
                  <SelectTrigger className={errors.level ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-sm text-red-500 mt-1">{errors.level}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit_section">Section</Label>
                <Input
                  id="edit_section"
                  value={editFormData.section}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="edit_capacity">Capacity *</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  min="1"
                  max="1000"
                  value={editFormData.capacity}
                  onChange={handleInputChange}
                  className={errors.capacity ? "border-red-500" : ""}
                />
                {errors.capacity && (
                  <p className="text-sm text-red-500 mt-1">{errors.capacity}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit_teacher_id">Class Teacher</Label>
                <Select
                  value={editFormData.teacher_id || "none"}
                  onValueChange={(value) => handleSelectChange("teacher_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Assigned</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstname} {teacher.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  value={editFormData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Class Status Alert */}
            {classData.occupancy_rate && classData.occupancy_rate >= 90 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This class is at {classData.occupancy_rate}% capacity. Consider increasing capacity or creating a new section.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-bold">Class Name</Label>
                <p className="text-sm">{classData.name}</p>
              </div>

              <div>
                <Label className="font-bold">Level</Label>
                <p className="text-sm">{classData.level}</p>
              </div>

              <div>
                <Label className="font-bold">Section</Label>
                <p className="text-sm">{classData.section || "N/A"}</p>
              </div>

              <div>
                <Label className="font-bold">Capacity</Label>
                <p className="text-sm">{classData.capacity || "N/A"}</p>
              </div>

              <div>
                <Label className="font-bold">Students</Label>
                <p className="text-sm">{classData.students_count || 0}</p>
              </div>

              <div>
                <Label className="font-bold">Occupancy Rate</Label>
                <div className="flex items-center space-x-2">
                  <Badge className={`${occupancyStatus.color} flex items-center space-x-1`}>
                    {occupancyStatus.icon}
                    <span>{classData.occupancy_rate || 0}%</span>
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="font-bold">Class Teacher</Label>
                <p className="text-sm">{classData.teacher_id ? getTeacherName(classData.teacher_id) : "Not Assigned"}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="font-bold">Description</Label>
                <p className="text-sm">{classData.description || "No description provided"}</p>
              </div>
            </div>

            <DialogFooter>
              {!showDeleteConfirm ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Class
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Confirm Delete"
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 