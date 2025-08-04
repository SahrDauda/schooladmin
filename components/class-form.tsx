"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { ClassWithDetails } from "@/lib/class-utils"

interface ClassFormProps {
  mode: "add" | "edit"
  initialData?: Partial<ClassWithDetails>
  teachers: any[]
  levelOptions: string[]
  onSubmit: (data: any) => Promise<boolean>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ClassForm({ 
  mode, 
  initialData, 
  teachers, 
  levelOptions, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: ClassFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    level: initialData?.level || "",
    section: initialData?.section || "",
    capacity: initialData?.capacity?.toString() || "",
    teacher_id: initialData?.teacher_id || "",
    description: initialData?.description || "",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [warnings, setWarnings] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        level: initialData.level || "",
        section: initialData.section || "",
        capacity: initialData.capacity?.toString() || "",
        teacher_id: initialData.teacher_id || "",
        description: initialData.description || "",
      })
    }
  }, [initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }))
    }
  }

  const handleSelectChange = (field: string, value: string) => {
    if (field === "teacher_id" && value === "none") {
      setFormData(prev => ({ ...prev, [field]: "" }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    // Clear error when user makes selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = async () => {
    setIsValidating(true)
    setErrors({})
    setWarnings([])

    try {
      // Basic validation
      const newErrors: { [key: string]: string } = {}

      if (!formData.name.trim()) {
        newErrors.name = "Class name is required"
      }

      if (!formData.level) {
        newErrors.level = "Level is required"
      }

      if (!formData.capacity || Number(formData.capacity) < 1) {
        newErrors.capacity = "Capacity must be at least 1"
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return false
      }

      // Check for duplicate class names
      if (mode === "add") {
        const existingClass = teachers.find(t => 
          t.name === formData.name && t.level === formData.level
        )
        if (existingClass) {
          newErrors.name = "A class with this name and level already exists"
          setErrors(newErrors)
          return false
        }
      }

      // Check teacher assignment
      if (formData.teacher_id) {
        const teacher = teachers.find(t => t.id === formData.teacher_id)
        if (!teacher) {
          newErrors.teacher_id = "Selected teacher does not exist"
          setErrors(newErrors)
          return false
        }

        // Check if teacher is already assigned to another class
        const teacherClasses = teachers.filter(t => 
          t.teacher_id === formData.teacher_id && 
          t.id !== initialData?.id
        )
        if (teacherClasses.length > 0) {
          setWarnings(["This teacher is already assigned to another class"])
        }
      }

      return true
    } catch (error) {
      console.error("Validation error:", error)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = await validateForm()
    if (!isValid) return

    const submitData = {
      ...formData,
      capacity: Number(formData.capacity),
    }

    const success = await onSubmit(submitData)
    if (success) {
      onCancel()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "add" ? "Add New Class" : "Edit Class"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {warnings.map((warning, index) => (
                  <div key={index}>{warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Mathematics"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="level">Level *</Label>
              <Select 
                value={formData.level} 
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
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={handleInputChange}
                placeholder="e.g. A, B, C"
              />
            </div>

            <div>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="1000"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g. 30"
                className={errors.capacity ? "border-red-500" : ""}
              />
              {errors.capacity && (
                <p className="text-sm text-red-500 mt-1">{errors.capacity}</p>
              )}
            </div>

            <div>
              <Label htmlFor="teacher_id">Class Teacher</Label>
              <Select 
                value={formData.teacher_id || "none"} 
                onValueChange={(value) => handleSelectChange("teacher_id", value)}
              >
                <SelectTrigger className={errors.teacher_id ? "border-red-500" : ""}>
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
              {errors.teacher_id && (
                <p className="text-sm text-red-500 mt-1">{errors.teacher_id}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the class"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isValidating}
            >
              {isSubmitting || isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSubmitting ? "Saving..." : "Validating..."}
                </>
              ) : (
                mode === "add" ? "Add Class" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 