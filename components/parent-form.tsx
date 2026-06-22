"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { addParentToStudent, type StudentWithDetails } from "@/lib/student-utils"

interface ParentFormProps {
  student: StudentWithDetails | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ParentForm({ student, isOpen, onClose, onSuccess }: ParentFormProps) {
  const { admin } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    gender: "",
    relationship_with_student: "",
    phonenumber: "",
    emailaddress: "",
    dateofbirth: "",
    occupation: "",
    homeaddress: "",
    nin: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id.replace("parent_", "")]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student || !admin) return

    setIsSubmitting(true)
    try {
      await addParentToStudent(
        student.id,
        formData,
        { school_id: admin.school_id, schoolName: admin.schoolName || "" },
        admin.id,
        admin.adminname || "Admin"
      )

      toast({
        title: "Success",
        description: `Parent profile linked to ${student.firstname} successfully.`,
      })
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error("Error adding parent:", error)
      toast({
        title: "Error",
        description: "Failed to add parent information.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!student) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Parent / Guardian</DialogTitle>
          <DialogDescription>
            Linking new guardian profile to student: <strong>{student.firstname} {student.lastname}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent_firstname">First Name *</Label>
              <Input id="parent_firstname" required value={formData.firstname} onChange={handleChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parent_lastname">Last Name *</Label>
              <Input id="parent_lastname" required value={formData.lastname} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)} required>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_relationship">Relationship *</Label>
              <Select value={formData.relationship_with_student} onValueChange={(val) => handleSelectChange("relationship_with_student", val)} required>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_phonenumber">Phone Number *</Label>
              <Input id="parent_phonenumber" type="tel" required value={formData.phonenumber} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_emailaddress">Email</Label>
              <Input id="parent_emailaddress" type="email" value={formData.emailaddress} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_dateofbirth">Date of Birth</Label>
              <Input id="parent_dateofbirth" type="date" value={formData.dateofbirth} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_occupation">Occupation</Label>
              <Input id="parent_occupation" value={formData.occupation} onChange={handleChange} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="parent_homeaddress">Home Address</Label>
              <Textarea id="parent_homeaddress" value={formData.homeaddress} onChange={handleChange} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="parent_nin">National ID Number (NIN)</Label>
              <Input id="parent_nin" value={formData.nin} onChange={handleChange} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Parent"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
