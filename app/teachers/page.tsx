"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, UserPlus, Search, Mail, Phone, Edit, Trash2, Camera, X } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Papa from "papaparse"
import * as XLSX from "xlsx"

// Zod schema for validation
const teacherSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  qualification: z.string().min(1, "Qualification is required"),
  subject: z.string().min(1, "Subject is required"),
  joining_date: z.string().min(1, "Joining date is required"),
})

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  const [isViewTeacherOpen, setIsViewTeacherOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })
  const [activeTab, setActiveTab] = useState("personal")

  // Initial Form State
  const initialFormState = {
    firstname: "",
    lastname: "",
    middlename: "",
    dob: "",
    gender: "",
    nationality: "Sierra Leonean",
    nin: "",
    marital_status: "",
    religion: "",
    address: "",
    phone: "",
    email: "",
    level: "",
    subject: "",
    district_preference: "",
    school_preference: "",
    application_type: "",
    institution_name: "",
    qualification_obtained: "",
    year_completed: "",
    certificate_number: "",
    teacher_certificate: "",
    higher_teacher_certificate: "",
    bachelor_education: "",
    pgde: "",
    other_credentials: "",
    previous_schools: "",
    positions_held: "",
    employment_dates: "",
    responsibilities: "",
    registration_number: "",
    registration_year: "",
    referee1_name: "",
    referee1_position: "",
    referee1_address: "",
    referee1_phone: "",
    referee1_relationship: "",
    referee2_name: "",
    referee2_position: "",
    referee2_address: "",
    referee2_phone: "",
    referee2_relationship: "",
    certificates_attached: false,
    birth_certificate_attached: false,
    national_id_attached: false,
    photo_attached: false,
    license_attached: false,
    employment_letters_attached: false,
    declaration_signed: false,
    declaration_date: "",
    qualification: "",
    joining_date: "",
    school_id: "",
  }

  const [formData, setFormData] = useState(initialFormState)
  const [editFormData, setEditFormData] = useState<any>(initialFormState)
  const [subjects, setSubjects] = useState<any[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ninSearchQuery, setNinSearchQuery] = useState("")
  const [isSearchingNin, setIsSearchingNin] = useState(false)
  const [passportPicture, setPassportPicture] = useState<File | null>(null)
  const [passportPicturePreview, setPassportPicturePreview] = useState<string>("")

  // Load School Info
  useEffect(() => {
    const loadSchoolInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminData } = await supabase
          .from('schooladmin')
          .select('school_id, schools(name)')
          .eq('id', user.id)
          .single()

        if (adminData) {
          setSchoolInfo({
            school_id: adminData.school_id,
            schoolName: adminData.schools?.name || ""
          })
          setFormData(prev => ({ ...prev, school_id: adminData.school_id }))
        }
      }
    }
    loadSchoolInfo()
  }, [])

  // Fetch Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!schoolInfo.school_id) return
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', schoolInfo.school_id)
          .order('name')

        if (error) throw error
        setSubjects(data || [])
      } catch (error) {
        console.error("Error fetching subjects:", error)
        toast({
          title: "Error",
          description: "Failed to load subjects",
          variant: "destructive",
        })
      }
    }
    fetchSubjects()
  }, [schoolInfo.school_id])

  // Fetch Teachers
  const fetchTeachers = async () => {
    if (!schoolInfo.school_id) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolInfo.school_id)
        .order('lastname')

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error("Error fetching teachers:", error)
      toast({
        title: "Error",
        description: "Failed to load teachers data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [schoolInfo.school_id])

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePassportPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ title: "File too large", description: "Please select an image smaller than 10MB", variant: "destructive" })
        return
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" })
        return
      }
      setPassportPicture(file)
      const reader = new FileReader()
      reader.onload = (e) => setPassportPicturePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removePassportPicture = () => {
    setPassportPicture(null)
    setPassportPicturePreview("")
  }

  const searchNINFromAPI = async (nin: string) => {
    if (!nin.trim()) {
      toast({ title: "Error", description: "Please enter a NIN to search", variant: "destructive" })
      return
    }
    setIsSearchingNin(true)
    try {
      const response = await fetch('/api/nin-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nin: nin.trim(), type: 'teacher' }),
      })
      if (!response.ok) throw new Error('Teacher not found')
      const data = await response.json()

      setFormData((prev) => ({
        ...prev,
        firstname: data.firstName || prev.firstname,
        lastname: data.lastName || prev.lastname,
        gender: data.gender || prev.gender,
        email: data.emailaddress || prev.email,
        phone: data.phoneNumber || prev.phone,
        address: data.address || prev.address,
        qualification: data.qualification || prev.qualification,
        subject: data.subject || prev.subject,
        joining_date: data.joiningDate || prev.joining_date,
        nin: nin.trim(),
        nationality: data.nationality || prev.nationality,
        dob: data.dateOfBirth || prev.dob,
      }))
      toast({ title: "Success", description: `Teacher information retrieved for ${data.firstName} ${data.lastName}` })
    } catch (error: any) {
      toast({ title: "Teacher Not Found", description: error.message || "Search failed", variant: "destructive" })
    } finally {
      setIsSearchingNin(false)
    }
  }

  const handleSubmitTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      teacherSchema.parse(formData)

      let passportPictureUrl = ""
      if (passportPicture) {
        const fileName = `teacher-${Date.now()}-${passportPicture.name}`
        const { data, error } = await supabase.storage
          .from('teacher-photos')
          .upload(fileName, passportPicture)

        if (error) throw error

        const { data: publicUrlData } = supabase.storage
          .from('teacher-photos')
          .getPublicUrl(fileName)

        passportPictureUrl = publicUrlData.publicUrl
      }

      const { error } = await supabase.from('teachers').insert({
        ...formData,
        school_id: schoolInfo.school_id,
        photo_url: passportPictureUrl, // Changed from passport_picture to photo_url to match schema
        status: "Active"
      })

      if (error) throw error

      toast({ title: "Success", description: "Teacher added successfully." })
      await fetchTeachers()

      // Reset form
      setFormData({ ...initialFormState, school_id: schoolInfo.school_id })
      setPassportPicture(null)
      setPassportPicturePreview("")
      setActiveTab("personal")

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" })
      } else {
        console.error("Error adding teacher:", error)
        toast({ title: "Error", description: error.message || "Failed to add teacher", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          firstname: editFormData.firstname,
          lastname: editFormData.lastname,
          email: editFormData.email,
          phone: editFormData.phone,
          subject: editFormData.subject,
          qualification: editFormData.qualification,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTeacher.id)

      if (error) throw error

      toast({ title: "Success", description: "Teacher updated successfully" })
      await fetchTeachers()
      setIsViewTeacherOpen(false)
      setIsEditing(false)
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update teacher", variant: "destructive" })
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) {
      try {
        const { error } = await supabase.from('teachers').delete().eq('id', teacherId)
        if (error) throw error

        toast({ title: "Success", description: "Teacher deleted successfully" })
        await fetchTeachers()
        setIsViewTeacherOpen(false)
      } catch (error: any) {
        toast({ title: "Error", description: "Failed to delete teacher", variant: "destructive" })
      }
    }
  }

  // Bulk Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
  }

  const handleUploadCSV = async () => {
    if (!csvFile) {
      setUploadError("Please select a file first")
      return
    }
    setIsUploading(true)
    setUploadError(null)

    try {
      let rows: any[] = []
      if (csvFile.name.endsWith(".csv")) {
        const text = await csvFile.text()
        const parsed = Papa.parse(text, { header: true })
        rows = parsed.data
      } else {
        const data = await csvFile.arrayBuffer()
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
      }

      let successCount = 0
      let errorCount = 0

      for (const row of rows) {
        if (!row.firstname || !row.lastname) continue

        const { error } = await supabase.from('teachers').insert({
          firstname: row.firstname,
          lastname: row.lastname,
          email: row.email,
          phone: row.phone,
          subject: row.subject,
          qualification: row.qualification,
          school_id: schoolInfo.school_id,
          status: 'Active'
        })

        if (error) errorCount++
        else successCount++
      }

      toast({
        title: "Upload Complete",
        description: `${successCount} teachers uploaded, ${errorCount} errors`,
        variant: errorCount > 0 ? "destructive" : "default",
      })
      setCsvFile(null)
      await fetchTeachers()

    } catch (error) {
      setUploadError("Failed to process file")
    } finally {
      setIsUploading(false)
    }
  }

  // Filter Logic
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === "all" || teacher.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter((t) => t.status === "Active").length
  const maleTeachers = teachers.filter((t) => t.gender === "Male").length
  const femaleTeachers = teachers.filter((t) => t.gender === "Female").length
  const subjectOptions = [...new Set(teachers.map((t) => t.subject))].filter(Boolean).sort() as string[]
  const getInitials = (f: string, l: string) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase()

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Teachers</CardTitle>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span>Add Teacher</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] w-[90%] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Teacher</DialogTitle>
                    <DialogDescription>Fill out the form below to add a new teacher.</DialogDescription>
                  </DialogHeader>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="personal">Personal Info</TabsTrigger>
                      <TabsTrigger value="position">Position</TabsTrigger>
                      <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                      <TabsTrigger value="experience">Experience</TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal" className="space-y-4">
                      <div className="mb-6 p-4 border rounded-md bg-gray-50">
                        <h3 className="text-sm font-medium mb-2">Search by NIN</h3>
                        <div className="flex gap-2">
                          <Input placeholder="Enter teacher NIN" value={ninSearchQuery} onChange={(e) => setNinSearchQuery(e.target.value)} />
                          <Button variant="secondary" onClick={() => searchNINFromAPI(ninSearchQuery)} disabled={isSearchingNin}>
                            {isSearchingNin ? "Searching..." : <><Search className="w-4 h-4 mr-2" /> Search</>}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="firstname">First Name *</Label><Input id="firstname" value={formData.firstname} onChange={handleInputChange} required /></div>
                        <div><Label htmlFor="lastname">Last Name *</Label><Input id="lastname" value={formData.lastname} onChange={handleInputChange} required /></div>
                        <div><Label htmlFor="middlename">Middle Name</Label><Input id="middlename" value={formData.middlename} onChange={handleInputChange} /></div>
                        <div><Label htmlFor="dob">Date of Birth *</Label><Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required /></div>
                        <div>
                          <Label htmlFor="gender">Gender *</Label>
                          <Select onValueChange={(v) => handleSelectChange("gender", v)} value={formData.gender}>
                            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label htmlFor="phone">Phone *</Label><Input id="phone" value={formData.phone} onChange={handleInputChange} required /></div>
                        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={handleInputChange} /></div>
                        <div className="md:col-span-2"><Label htmlFor="address">Address *</Label><Input id="address" value={formData.address} onChange={handleInputChange} required /></div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button onClick={() => setActiveTab("position")}>Next</Button>
                      </div>
                    </TabsContent>

                    {/* Position Tab */}
                    <TabsContent value="position" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="level">Level *</Label>
                          <Select onValueChange={(v) => handleSelectChange("level", v)} value={formData.level}>
                            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Primary">Primary</SelectItem>
                              <SelectItem value="Secondary">Secondary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="subject">Subject *</Label>
                          <Select onValueChange={(v) => handleSelectChange("subject", v)} value={formData.subject}>
                            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                            <SelectContent>
                              {subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label htmlFor="joining_date">Joining Date *</Label><Input id="joining_date" type="date" value={formData.joining_date} onChange={handleInputChange} required /></div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setActiveTab("personal")}>Previous</Button>
                        <Button onClick={() => setActiveTab("qualifications")}>Next</Button>
                      </div>
                    </TabsContent>

                    {/* Qualifications Tab */}
                    <TabsContent value="qualifications" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="qualification">Highest Qualification *</Label><Input id="qualification" value={formData.qualification} onChange={handleInputChange} required /></div>
                        <div><Label htmlFor="institution_name">Institution</Label><Input id="institution_name" value={formData.institution_name} onChange={handleInputChange} /></div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setActiveTab("position")}>Previous</Button>
                        <Button onClick={() => setActiveTab("experience")}>Next</Button>
                      </div>
                    </TabsContent>

                    {/* Experience Tab */}
                    <TabsContent value="experience" className="space-y-4">
                      <div className="space-y-4">
                        <div><Label htmlFor="previous_schools">Previous Schools</Label><Input id="previous_schools" value={formData.previous_schools} onChange={handleInputChange} /></div>

                        {/* Passport Picture */}
                        <div>
                          <Label>Passport Picture</Label>
                          <div className="mt-2">
                            {passportPicturePreview ? (
                              <div className="relative inline-block">
                                <img src={passportPicturePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
                                <button type="button" onClick={removePassportPicture} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="h-4 w-4" /></button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input type="file" id="passport" accept="image/*" onChange={handlePassportPictureChange} className="hidden" />
                                <label htmlFor="passport" className="cursor-pointer flex flex-col items-center">
                                  <Camera className="h-8 w-8 text-gray-400" />
                                  <span className="text-sm text-gray-600">Upload Picture</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setActiveTab("qualifications")}>Previous</Button>
                        <Button onClick={handleSubmitTeacher} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Add Teacher"}</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalTeachers}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium text-green-600">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{activeTeachers}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium text-blue-600">Male</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{maleTeachers}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium text-pink-600">Female</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{femaleTeachers}</div></CardContent></Card>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-4">
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search teachers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 w-full md:w-[250px]" />
                </div>
                <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Upload */}
            <div className="mb-4 border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center">
              <p className="text-gray-500 mb-2">Bulk Upload Teachers (CSV/Excel)</p>
              <input type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
              {csvFile && <Button variant="secondary" size="sm" className="mt-2" onClick={handleUploadCSV} disabled={isUploading}>{isUploading ? "Uploading..." : "Upload"}</Button>}
              {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No teachers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedTeacher(teacher); setEditFormData(teacher); setIsViewTeacherOpen(true); }}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={teacher.photo_url} />
                              <AvatarFallback>{getInitials(teacher.firstname, teacher.lastname)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{teacher.firstname} {teacher.lastname}</div>
                              <div className="text-xs text-muted-foreground">{teacher.qualification}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.subject}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.phone}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{teacher.status}</span></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedTeacher(teacher); setEditFormData(teacher); setIsViewTeacherOpen(true); setIsEditing(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteTeacher(teacher.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View/Edit Dialog */}
        <Dialog open={isViewTeacherOpen} onOpenChange={(open) => { if (!open) { setIsViewTeacherOpen(false); setIsEditing(false); } }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Teacher" : "Teacher Details"}</DialogTitle>
            </DialogHeader>
            {selectedTeacher && (
              <div className="space-y-4">
                {isEditing ? (
                  <form onSubmit={handleUpdateTeacher} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>First Name</Label><Input value={editFormData.firstname} onChange={(e) => setEditFormData({ ...editFormData, firstname: e.target.value })} /></div>
                      <div><Label>Last Name</Label><Input value={editFormData.lastname} onChange={(e) => setEditFormData({ ...editFormData, lastname: e.target.value })} /></div>
                      <div><Label>Email</Label><Input value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} /></div>
                      <div><Label>Phone</Label><Input value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} /></div>
                      <div><Label>Subject</Label><Input value={editFormData.subject} onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })} /></div>
                      <div><Label>Qualification</Label><Input value={editFormData.qualification} onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-muted-foreground">Name</Label><div className="font-medium">{selectedTeacher.firstname} {selectedTeacher.lastname}</div></div>
                    <div><Label className="text-muted-foreground">Email</Label><div className="font-medium">{selectedTeacher.email}</div></div>
                    <div><Label className="text-muted-foreground">Phone</Label><div className="font-medium">{selectedTeacher.phone}</div></div>
                    <div><Label className="text-muted-foreground">Subject</Label><div className="font-medium">{selectedTeacher.subject}</div></div>
                    <div><Label className="text-muted-foreground">Qualification</Label><div className="font-medium">{selectedTeacher.qualification}</div></div>
                    <div><Label className="text-muted-foreground">Status</Label><div className="font-medium">{selectedTeacher.status}</div></div>
                  </div>
                )}
                {!isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                    <Button variant="destructive" onClick={() => handleDeleteTeacher(selectedTeacher.id)}>Delete</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
