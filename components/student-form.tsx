"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Wand2 } from "lucide-react"

interface StudentFormProps {
  initialData?: any
  classes: any[]
  onSubmit: (data: any) => Promise<boolean>
  onCancel: () => void
  isSubmitting?: boolean
  searchNIN?: (nin: string) => Promise<any>
  generateNewAdmissionNumber?: () => Promise<string>
}

const POPULAR_DISABILITIES = [
  "Visual Impairment",
  "Hearing Impairment",
  "Physical Disability",
  "Learning Disability",
  "Autism Spectrum",
]

const POPULAR_MEDICAL = [
  "Asthma",
  "Epilepsy",
  "Diabetes",
  "Severe Allergies",
  "Sickle Cell",
]

export function StudentForm({
  initialData,
  classes,
  onSubmit,
  onCancel,
  isSubmitting = false,
  searchNIN,
  generateNewAdmissionNumber
}: StudentFormProps) {
  const [formData, setFormData] = useState({
    firstname: initialData?.firstname || "",
    lastname: initialData?.lastname || "",
    othernames: initialData?.othernames || "",
    gender: initialData?.gender || "",
    dateofbirth: initialData?.dateofbirth ? new Date(initialData.dateofbirth).toISOString().split('T')[0] : "",
    address: initialData?.address || "",
    guardian_name: initialData?.guardian_name || "",
    guardian_phone: initialData?.guardian_phone || "",
    guardian_email: initialData?.guardian_email || "",
    class_id: initialData?.class_id || "",
    admission_number: initialData?.admission_number || "",
    passport_url: initialData?.passport_url || "",
    status: initialData?.status || "Active",
    is_disabled: initialData?.is_disabled ? "true" : "false",
  })

  // We map the database `health_status` string into our separate disability/medical UI
  // For this form, we'll try to parse out "Disability: X" and "Medical: Y" if they were combined,
  // or just use raw strings. For simplicity, let's treat health_status as Medical Condition,
  // and we'll just store Disability Type inside health_status if it's missing in Prisma.
  // Actually, we can just send `disability_type` and `health_status` separately and let the parent handle it,
  // but to keep it safe with Prisma, let's just pass them in the payload.
  
  const [disabilityTypeSelect, setDisabilityTypeSelect] = useState("")
  const [disabilityTypeOther, setDisabilityTypeOther] = useState("")
  
  const [hasMedical, setHasMedical] = useState(initialData?.health_status && initialData.health_status !== "None" ? "true" : "false")
  const [medicalTypeSelect, setMedicalTypeSelect] = useState("")
  const [medicalTypeOther, setMedicalTypeOther] = useState("")

  useEffect(() => {
    // Parse existing data if any
    if (initialData) {
      if (initialData.health_status) {
        if (POPULAR_MEDICAL.includes(initialData.health_status)) {
          setMedicalTypeSelect(initialData.health_status)
        } else if (initialData.health_status !== "None") {
          setMedicalTypeSelect("Other")
          setMedicalTypeOther(initialData.health_status)
        }
      }
      // If the schema actually returns disability_type:
      if (initialData.disability_type) {
        if (POPULAR_DISABILITIES.includes(initialData.disability_type)) {
          setDisabilityTypeSelect(initialData.disability_type)
        } else {
          setDisabilityTypeSelect("Other")
          setDisabilityTypeOther(initialData.disability_type)
        }
      }
    }
  }, [initialData])

  const [ninSearchQuery, setNinSearchQuery] = useState("")
  const [isSearchingNIN, setIsSearchingNIN] = useState(false)

  useEffect(() => {
    if (!initialData && generateNewAdmissionNumber && !formData.admission_number) {
      generateNewAdmissionNumber().then(adm => {
        if (adm) setFormData(prev => ({ ...prev, admission_number: adm }))
      })
    }
  }, [initialData, generateNewAdmissionNumber, formData.admission_number])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNINSearch = async () => {
    if (!ninSearchQuery || !searchNIN) return
    setIsSearchingNIN(true)
    const result = await searchNIN(ninSearchQuery)
    setIsSearchingNIN(false)
    if (result) {
      setFormData(prev => ({
        ...prev,
        firstname: result.firstName || prev.firstname,
        lastname: result.lastName || prev.lastname,
        dateofbirth: result.dateOfBirth || prev.dateofbirth,
        gender: result.gender || prev.gender,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Resolve final disability type
    let finalDisabilityType = null
    if (formData.is_disabled === "true") {
      finalDisabilityType = disabilityTypeSelect === "Other" ? disabilityTypeOther : disabilityTypeSelect
    }

    // Resolve final medical condition
    let finalHealthStatus = null
    if (hasMedical === "true") {
      finalHealthStatus = medicalTypeSelect === "Other" ? medicalTypeOther : medicalTypeSelect
    }

    const submissionData = {
      ...formData,
      is_disabled: formData.is_disabled === "true",
      dateofbirth: formData.dateofbirth ? new Date(formData.dateofbirth) : null,
      disability_type: finalDisabilityType,
      health_status: finalHealthStatus, // keep for backward compatibility
      sick_type: finalHealthStatus      // map to sick_type column
    }

    await onSubmit(submissionData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!initialData && searchNIN && (
        <div className="bg-muted p-4 rounded-lg flex items-end gap-2 mb-6">
          <div className="flex-1 space-y-2">
            <Label htmlFor="nin_search">Search via NIN (Optional)</Label>
            <Input
              id="nin_search"
              placeholder="Enter 11-digit NIN"
              value={ninSearchQuery}
              onChange={(e) => setNinSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleNINSearch}
            disabled={isSearchingNIN || !ninSearchQuery}
          >
            {isSearchingNIN ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Details */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="font-semibold text-lg border-b pb-2">Personal Details</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstname">First Name <span className="text-red-500">*</span></Label>
          <Input id="firstname" name="firstname" value={formData.firstname} onChange={handleChange} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastname">Last Name <span className="text-red-500">*</span></Label>
          <Input id="lastname" name="lastname" value={formData.lastname} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="othernames">Other Names</Label>
          <Input id="othernames" name="othernames" value={formData.othernames} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateofbirth">Date of Birth</Label>
          <Input type="date" id="dateofbirth" name="dateofbirth" value={formData.dateofbirth} onChange={handleChange} />
        </div>

        {/* Academic Details */}
        <div className="space-y-4 md:col-span-2 mt-4">
          <h3 className="font-semibold text-lg border-b pb-2">Academic Details</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="class_id">Class</Label>
          <Select value={formData.class_id} onValueChange={(val) => handleSelectChange("class_id", val)}>
            <SelectTrigger><SelectValue placeholder="Assign to class" /></SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admission_number">Admission Number</Label>
          <div className="flex gap-2">
            <Input id="admission_number" name="admission_number" value={formData.admission_number} onChange={handleChange} />
            {/* Auto generated by default, but button kept just in case */}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(val) => handleSelectChange("status", val)}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contact Details */}
        <div className="space-y-4 md:col-span-2 mt-4">
          <h3 className="font-semibold text-lg border-b pb-2">Contact Details</h3>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Home Address</Label>
          <Textarea id="address" name="address" value={formData.address} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian_phone">Guardian Phone</Label>
          <Input id="guardian_phone" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian_email">Guardian Email</Label>
          <Input type="email" id="guardian_email" name="guardian_email" value={formData.guardian_email} onChange={handleChange} />
        </div>

        {/* Health Details */}
        <div className="space-y-4 md:col-span-2 mt-4">
          <h3 className="font-semibold text-lg border-b pb-2">Health Details</h3>
        </div>

        {/* Disability Section */}
        <div className="space-y-2">
          <Label htmlFor="is_disabled">Disability Status</Label>
          <Select value={formData.is_disabled} onValueChange={(val) => handleSelectChange("is_disabled", val)}>
            <SelectTrigger><SelectValue placeholder="Has Disability?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.is_disabled === "true" && (
          <div className="space-y-2">
            <Label htmlFor="disability_type">Disability Type</Label>
            <Select value={disabilityTypeSelect} onValueChange={setDisabilityTypeSelect}>
              <SelectTrigger><SelectValue placeholder="Select disability type" /></SelectTrigger>
              <SelectContent>
                {POPULAR_DISABILITIES.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            {disabilityTypeSelect === "Other" && (
              <Input 
                className="mt-2"
                placeholder="Please specify disability" 
                value={disabilityTypeOther} 
                onChange={e => setDisabilityTypeOther(e.target.value)} 
                required 
              />
            )}
          </div>
        )}

        {/* Medical Section */}
        <div className="space-y-2">
          <Label htmlFor="has_medical">Medical Conditions</Label>
          <Select value={hasMedical} onValueChange={setHasMedical}>
            <SelectTrigger><SelectValue placeholder="Has Medical Condition?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasMedical === "true" && (
          <div className="space-y-2">
            <Label htmlFor="medical_type">Condition Type</Label>
            <Select value={medicalTypeSelect} onValueChange={setMedicalTypeSelect}>
              <SelectTrigger><SelectValue placeholder="Select medical condition" /></SelectTrigger>
              <SelectContent>
                {POPULAR_MEDICAL.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            {medicalTypeSelect === "Other" && (
              <Input 
                className="mt-2"
                placeholder="Please specify condition" 
                value={medicalTypeOther} 
                onChange={e => setMedicalTypeOther(e.target.value)} 
                required 
              />
            )}
          </div>
        )}

      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            initialData ? "Update Student" : "Add Student"
          )}
        </Button>
      </div>
    </form>
  )
}
