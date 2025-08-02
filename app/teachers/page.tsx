"use client"

import React from "react"

import { useState, useEffect } from "react"
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
import { GraduationCap, UserPlus, Search, Mail, Phone, BookOpen, Calendar, Edit, Trash2, QrCode, Camera, X } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, Timestamp, deleteDoc, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { TeacherAttendanceQR } from "@/components/teacher-attendance-qr"
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { sendEmail } from "@/lib/index"
import Papa from "papaparse"
import * as XLSX from "xlsx"

const teacherSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  qualification: z.string().min(1, "Qualification is required"),
  subject: z.string().min(1, "Subject is required"),
  joining_date: z.string().min(1, "Joining date is required"),
})

// Function to generate a random password
const generateRandomPassword = () => {
  const length = 12
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return password
}

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Information
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
    
    // Position Information
    level: "",
    subject: "",
    district_preference: "",
    school_preference: "",
    application_type: "",
    
    // Academic Qualifications
    institution_name: "",
    qualification_obtained: "",
    year_completed: "",
    certificate_number: "",
    
    // Professional Qualifications
    teacher_certificate: "",
    higher_teacher_certificate: "",
    bachelor_education: "",
    pgde: "",
    other_credentials: "",
    
    // Work Experience
    previous_schools: "",
    positions_held: "",
    employment_dates: "",
    responsibilities: "",
    
    // Teaching License
    registration_number: "",
    registration_year: "",
    
    // Referees
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
    
    // Supporting Documents
    certificates_attached: false,
    birth_certificate_attached: false,
    national_id_attached: false,
    photo_attached: false,
    license_attached: false,
    employment_letters_attached: false,
    
    // Declaration
    declaration_signed: false,
    declaration_date: "",
    
    // System Fields
    qualification: "",
    joining_date: "",
    school_id: "",
  })
  const [editFormData, setEditFormData] = useState<typeof formData & { passport_picture?: string }>(formData)
  const [subjects, setSubjects] = useState<any[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [ninSearchQuery, setNinSearchQuery] = useState("")
  const [isSearchingNin, setIsSearchingNin] = useState(false)
  const [passportPicture, setPassportPicture] = useState<File | null>(null)
  const [passportPicturePreview, setPassportPicturePreview] = useState<string>("")

  useEffect(() => {
    const loadSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      setSchoolInfo(info)
      setFormData((prev) => ({ ...prev, school_id: info.school_id }))
    }

    loadSchoolInfo()
  }, [])

  // NIN API integration
  // Passport picture handlers
  const handlePassportPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }
      
      setPassportPicture(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPassportPicturePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePassportPicture = () => {
    setPassportPicture(null)
    setPassportPicturePreview("")
  }

  const searchNINFromAPI = async (nin: string) => {
    if (!nin.trim()) {
      toast({
        title: "Error",
        description: "Please enter a NIN to search",
        variant: "destructive",
      })
      return
    }

    setIsSearchingNin(true)
    try {
      console.log('Searching for teacher NIN:', nin)
      
      const response = await fetch('/api/nin-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nin: nin.trim(), type: 'teacher' }),
      })

      if (!response.ok) {
        throw new Error('Teacher not found')
      }

      const data = await response.json()
      console.log('Teacher data retrieved:', data)

      // Auto-populate form with teacher data
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
      
      console.log('Form updated with teacher data')
      
      toast({
        title: "Success",
        description: `Teacher information retrieved for ${data.firstName} ${data.lastName}`,
      })
    } catch (error) {
      console.error('Teacher NIN search failed:', error)
      
      let errorMessage = "Teacher search failed"
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          errorMessage = `Teacher NIN "${nin}" not found in the database`
        }
      }
      
      toast({
        title: "Teacher Not Found",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSearchingNin(false)
    }
  }

  // Fetch subjects for the current school
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!schoolInfo.school_id) return
      try {
        const subjectsRef = collection(db, "subjects")
        const q = query(subjectsRef, where("school_id", "==", schoolInfo.school_id))
        const querySnapshot = await getDocs(q)
        const subjectsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
        // Sort by name
        subjectsList.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        setSubjects(subjectsList)
      } catch (error) {
        console.error("Error fetching subjects:", error)
        toast({
          title: "Error",
          description: "Failed to load subjects",
          variant: "destructive",
        })
      }
    }
    if (schoolInfo.school_id) {
      fetchSubjects()
    }
  }, [schoolInfo.school_id])

  const fetchTeachers = async () => {
    setIsLoading(true)
    try {
      if (!schoolInfo.school_id) return

      const teachersRef = collection(db, "teachers")
      // Modified query to remove orderBy to avoid needing a composite index
      const q = query(teachersRef, where("school_id", "==", schoolInfo.school_id))
      const querySnapshot = await getDocs(q)

      const teachersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any), // or as Teacher if you have a Teacher type
      }))

      // Sort teachers by lastname client-side instead
      const sortedTeachers = teachersList.sort((a, b) => (a.lastname || "").localeCompare(b.lastname || ""))

      setTeachers(sortedTeachers)
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
    if (schoolInfo.school_id) {
      fetchTeachers()
    }
  }, [schoolInfo.school_id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Validate form data
      teacherSchema.parse(formData)

      // Generate a unique ID
      const teacherId = `TCH${Date.now().toString().slice(-6)}`

      // Generate a random password for the teacher
      const password = generateRandomPassword()

      // Create Firebase Auth user with the same ID as the document
      let userCredential
      try {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, password)
        
        // Update the auth user's UID to match the document ID
        // Note: Firebase Auth doesn't allow changing UID after creation
        // So we'll create the auth user with a custom UID using admin SDK
        // For now, we'll store the document ID in the auth_uid field
      } catch (authError: any) {
        let errorMsg = "Failed to create teacher account."
        if (authError.code === "auth/email-already-in-use") {
          errorMsg = "Email is already in use."
        } else if (authError.code === "auth/invalid-email") {
          errorMsg = "Invalid email address."
        } else if (authError.code === "auth/weak-password") {
          errorMsg = "Password is too weak."
        }
        toast({
          title: "Authentication Error",
          description: errorMsg,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Handle passport picture upload
      let passportPictureUrl = ""
      if (passportPicture) {
        try {
          // Convert file to base64 for storage
          const reader = new FileReader()
          reader.onload = async (e) => {
            const base64 = e.target?.result as string
            passportPictureUrl = base64
          }
          reader.readAsDataURL(passportPicture)
        } catch (error) {
          console.error("Error processing passport picture:", error)
          toast({
            title: "Warning",
            description: "Failed to process passport picture, but teacher will be added",
            variant: "destructive",
          })
        }
      }

      // Add timestamp and metadata
      const currentDate = new Date()
      const teacherData = {
        ...formData,
        id: teacherId,
        school_id: schoolInfo.school_id,
        schoolName: schoolInfo.schoolName, // Include school name
        passport_picture: passportPictureUrl,
        created_at: Timestamp.fromDate(currentDate),
        status: "Active", // Always set to Active
        // Store the document ID as auth_uid for consistency
        auth_uid: teacherId,
        // Also store the Firebase Auth UID for reference
        firebase_auth_uid: userCredential.user.uid,
      }

      // Save to Firestore
      await setDoc(doc(db, "teachers", teacherId), teacherData)

      // Send email with login credentials
      const emailSubject = "Welcome to SchoolTech – Your Account Credentials"
      const emailBody = `Dear ${formData.firstname} ${formData.lastname},\n\nWelcome to SchoolTech! We are excited to have you join us.\n\nYour account has been created. Please find your login credentials below:\n\nUsername: ${formData.email}\nPassword: ${password}\n\nFor security, we recommend logging in and changing your password as soon as possible.\n\nIf you have any questions or need assistance, feel free to reach out to the admin team.\n\nBest regards,\nSchoolTech Administration`
      const emailResult = await sendEmail(formData.email, emailSubject, emailBody)
      if (!emailResult.success) {
        toast({
          title: "Warning",
          description: "Teacher added, but failed to send email with credentials.",
          variant: "destructive",
        })
      }

      // Show success message (password removed)
      toast({
        title: "Success",
        description: `Teacher added successfully.`,
      })

      // Refresh the teachers list
      await fetchTeachers()

      // Reset form
      setFormData({
        // Personal Information
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
        
        // Position Information
        level: "",
        subject: "",
        district_preference: "",
        school_preference: "",
        application_type: "",
        
        // Academic Qualifications
        institution_name: "",
        qualification_obtained: "",
        year_completed: "",
        certificate_number: "",
        
        // Professional Qualifications
        teacher_certificate: "",
        higher_teacher_certificate: "",
        bachelor_education: "",
        pgde: "",
        other_credentials: "",
        
        // Work Experience
        previous_schools: "",
        positions_held: "",
        employment_dates: "",
        responsibilities: "",
        
        // Teaching License
        registration_number: "",
        registration_year: "",
        
        // Referees
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
        
        // Supporting Documents
        certificates_attached: false,
        birth_certificate_attached: false,
        national_id_attached: false,
        photo_attached: false,
        license_attached: false,
        employment_letters_attached: false,
        
        // Declaration
        declaration_signed: false,
        declaration_date: "",
        
        // System Fields
        qualification: "",
        joining_date: "",
        school_id: schoolInfo.school_id,
      })
      
      // Reset passport picture state
      setPassportPicture(null)
      setPassportPicturePreview("")
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        })
      } else {
        console.error("Error adding teacher:", error)
        toast({
          title: "Error",
          description: "Failed to add teacher. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await setDoc(doc(db, "teachers", selectedTeacher.id), {
        ...editFormData,
        school_id: schoolInfo.school_id,
        schoolName: schoolInfo.schoolName, // Include school name
        updated_at: Timestamp.fromDate(new Date()),
      })

      toast({
        title: "Success",
        description: "Teacher information updated successfully",
      })

      await fetchTeachers()
      setIsViewTeacherOpen(false)
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update teacher information",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) {
      try {
        // Get the teacher data to find the auth UID
        const teacherDoc = await getDoc(doc(db, "teachers", teacherId))
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data()
          
          // Delete the Firestore document
          await deleteDoc(doc(db, "teachers", teacherId))
          
          // Try to delete the auth user if firebase_auth_uid exists
          if (teacherData.firebase_auth_uid) {
            try {
              // Call the API to delete the auth user
              const response = await fetch('/api/delete-auth-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ authUid: teacherData.firebase_auth_uid })
              })
              
              if (!response.ok) {
                console.error("Failed to delete auth user")
              } else {
                console.log("Auth user deletion initiated")
              }
            } catch (authError) {
              console.error("Error deleting auth user:", authError)
              // Continue with the deletion even if auth deletion fails
            }
          }
        }

        toast({
          title: "Success",
          description: "Teacher deleted successfully",
        })

        await fetchTeachers()
        setIsViewTeacherOpen(false)
      } catch (error) {
        console.error("Error deleting teacher:", error)
        toast({
          title: "Error",
          description: "Failed to delete teacher",
          variant: "destructive",
        })
      }
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.id?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubject = selectedSubject === "all" || teacher.subject === selectedSubject

    return matchesSearch && matchesSubject
  })

  // Calculate dashboard metrics
  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter((teacher) => teacher.status === "Active").length
  const maleTeachers = teachers.filter((teacher) => teacher.gender === "Male").length
  const femaleTeachers = teachers.filter((teacher) => teacher.gender === "Female").length

  // Get unique subject options from teachers data
  const subjectOptions = [...new Set(teachers.map((teacher) => teacher.subject))].filter(Boolean).sort()

  // Get initials for avatar
  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname?.[0] || ""}${lastname?.[0] || ""}`.toUpperCase()
  }

  // Bulk upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (
      file.type !== "text/csv" &&
      !file.name.endsWith(".csv") &&
      file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      !file.name.endsWith(".xlsx")
    ) {
      setUploadError("Please upload a valid CSV or Excel file")
      return
    }
    setCsvFile(file)
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setUploadError(null)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (
      file.type !== "text/csv" &&
      !file.name.endsWith(".csv") &&
      file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      !file.name.endsWith(".xlsx")
    ) {
      setUploadError("Please upload a valid CSV or Excel file")
      return
    }
    setCsvFile(file)
  }

  const handleUploadCSV = async () => {
    if (!csvFile) {
      setUploadError("Please select a CSV or Excel file first")
      return
    }
    setIsUploading(true)
    setUploadError(null)
    try {
      let rows: any[] = []
      if (
        csvFile.type === "text/csv" ||
        csvFile.name.endsWith(".csv")
      ) {
        // Parse CSV file
        const text = await csvFile.text()
        const parsed = Papa.parse(text, { header: true })
        if (parsed.errors.length > 0) {
          setUploadError("Failed to parse CSV file. Please check the format.")
          setIsUploading(false)
          return
        }
        rows = parsed.data
      } else if (
        csvFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        csvFile.name.endsWith(".xlsx")
      ) {
        // Parse Excel file
        const data = await csvFile.arrayBuffer()
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = XLSX.utils.sheet_to_json(worksheet)
      } else {
        setUploadError("Unsupported file type.")
        setIsUploading(false)
        return
      }
      let successCount = 0
      let errorCount = 0
      for (const row of rows) {
        try {
          // Basic validation (customize as needed)
          if (!row.firstname || !row.lastname || !row.email) continue
          // Generate a unique ID if not present
          const teacherId = row.id || `TCH${Date.now().toString().slice(-6)}`
          // Add timestamp and metadata
          const currentDate = new Date()
          const teacherData = {
            ...row,
            id: teacherId,
            school_id: schoolInfo.school_id,
            schoolName: schoolInfo.schoolName,
            created_at: Timestamp.fromDate(currentDate),
            status: "Active",
          }
          await setDoc(doc(db, "teachers", teacherId), teacherData)
          successCount++
        } catch (err) {
          errorCount++
        }
      }
      toast({
        title: "Upload Complete",
        description: `${successCount} teachers uploaded, ${errorCount} errors`,
        variant: errorCount > 0 ? "destructive" : "default",
      })
      setCsvFile(null)
      await fetchTeachers()
    } catch (error) {
      setUploadError("Failed to process file. Please try again.")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

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
                  <Tabs defaultValue="personal" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="personal">Personal Info</TabsTrigger>
                      <TabsTrigger value="position">Position</TabsTrigger>
                      <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                      <TabsTrigger value="experience">Experience</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="personal" className="space-y-4">
                      <form className="space-y-4">
                        {/* Search by NIN */}
                        <div className="mb-6 p-4 border rounded-md bg-gray-50">
                          <h3 className="text-sm font-medium mb-2">Search by NIN</h3>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter teacher NIN"
                              value={ninSearchQuery}
                              onChange={(e) => setNinSearchQuery(e.target.value)}
                            />
                            <Button variant="secondary" onClick={() => searchNINFromAPI(ninSearchQuery)} disabled={isSearchingNin}>
                              {isSearchingNin ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-2">⏳</span> Searching...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <Search className="w-4 h-4 mr-2" /> Search
                                </span>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the teacher's NIN to automatically fill the form with existing teacher information
                          </p>
                          
                          {/* Available Teacher NINs */}
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">Available Teacher NINs for Testing:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-blue-600">TL12345678</span>
                                <br />
                                <span className="text-gray-600">Abubakarr Koroma</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-blue-600">TL87654321</span>
                                <br />
                                <span className="text-gray-600">Fatmata Sesay</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-blue-600">TL11223344</span>
                                <br />
                                <span className="text-gray-600">Mohamed Bangura</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-blue-600">TL55667788</span>
                                <br />
                                <span className="text-gray-600">Aminata Turay</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-blue-600">TL99887766</span>
                                <br />
                                <span className="text-gray-600">Ibrahim Kamara</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-blue-600">TL33445566</span>
                                <br />
                                <span className="text-gray-600">Hawa Conteh</span>
                              </div>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">Click any NIN to copy to clipboard</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstname">First Name *</Label>
                            <Input id="firstname" value={formData.firstname} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="lastname">Last Name *</Label>
                            <Input id="lastname" value={formData.lastname} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="middlename">Middle Name</Label>
                            <Input id="middlename" value={formData.middlename} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="dob">Date of Birth *</Label>
                            <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="gender">Gender *</Label>
                            <Select onValueChange={(value) => handleSelectChange("gender", value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="nationality">Nationality</Label>
                            <Input id="nationality" value={formData.nationality} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="nin">National ID Number (NIN)</Label>
                            <Input id="nin" value={formData.nin} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="marital_status">Marital Status</Label>
                            <Select onValueChange={(value) => handleSelectChange("marital_status", value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Married">Married</SelectItem>
                                <SelectItem value="Divorced">Divorced</SelectItem>
                                <SelectItem value="Widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="religion">Religion</Label>
                            <Input id="religion" value={formData.religion} onChange={handleInputChange} />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="address">Home Address / Permanent Address *</Label>
                            <Input id="address" value={formData.address} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number(s) *</Label>
                            <Input id="phone" value={formData.phone} onChange={handleInputChange} required />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                          </div>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="position" className="space-y-4">
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="level">Level *</Label>
                            <Select onValueChange={(value) => handleSelectChange("level", value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pre-primary">Pre-primary</SelectItem>
                                <SelectItem value="Primary">Primary</SelectItem>
                                <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                                <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="subject">Subject Specialization</Label>
                            <Select
                              value={formData.subject}
                              onValueChange={(value) => handleSelectChange("subject", value)}
                              disabled={subjects.length === 0}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {subjects.map((subject: any) => (
                                  <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="district_preference">District of Preference</Label>
                            <Input id="district_preference" value={formData.district_preference} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="school_preference">School of Preference</Label>
                            <Input id="school_preference" value={formData.school_preference} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="application_type">Application Type</Label>
                            <Select onValueChange={(value) => handleSelectChange("application_type", value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="First Appointment">First Appointment</SelectItem>
                                <SelectItem value="Transfer">Transfer</SelectItem>
                                <SelectItem value="Promotion">Promotion</SelectItem>
                                <SelectItem value="Re-engagement">Re-engagement</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="qualifications" className="space-y-4">
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="institution_name">Institution Name</Label>
                            <Input id="institution_name" value={formData.institution_name} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="qualification_obtained">Qualification Obtained</Label>
                            <Select onValueChange={(value) => handleSelectChange("qualification_obtained", value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select qualification" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WASSCE">WASSCE</SelectItem>
                                <SelectItem value="HTC">HTC</SelectItem>
                                <SelectItem value="TC">TC</SelectItem>
                                <SelectItem value="B.Ed">B.Ed</SelectItem>
                                <SelectItem value="PGDE">PGDE</SelectItem>
                                <SelectItem value="M.Ed">M.Ed</SelectItem>
                                <SelectItem value="PhD">PhD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="year_completed">Year Completed</Label>
                            <Input id="year_completed" value={formData.year_completed} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="certificate_number">Certificate/Index Number</Label>
                            <Input id="certificate_number" value={formData.certificate_number} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="teacher_certificate">Teacher Certificate (TC)</Label>
                            <Input id="teacher_certificate" value={formData.teacher_certificate} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="higher_teacher_certificate">Higher Teacher Certificate (HTC)</Label>
                            <Input id="higher_teacher_certificate" value={formData.higher_teacher_certificate} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="bachelor_education">Bachelor of Education (B.Ed)</Label>
                            <Input id="bachelor_education" value={formData.bachelor_education} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="pgde">Postgraduate Diploma in Education (PGDE)</Label>
                            <Input id="pgde" value={formData.pgde} onChange={handleInputChange} />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="other_credentials">Other Teaching Credentials</Label>
                            <Input id="other_credentials" value={formData.other_credentials} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="registration_number">Teacher Registration Number</Label>
                            <Input id="registration_number" value={formData.registration_number} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="registration_year">Year of Registration</Label>
                            <Input id="registration_year" value={formData.registration_year} onChange={handleInputChange} />
                          </div>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="experience" className="space-y-4">
                      <form onSubmit={handleSubmitTeacher} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="previous_schools">Name of School(s)</Label>
                            <Input id="previous_schools" value={formData.previous_schools} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="positions_held">Position(s) Held</Label>
                            <Input id="positions_held" value={formData.positions_held} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="employment_dates">Dates of Employment</Label>
                            <Input id="employment_dates" value={formData.employment_dates} onChange={handleInputChange} />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="responsibilities">Responsibilities/Subjects Taught</Label>
                            <Input id="responsibilities" value={formData.responsibilities} onChange={handleInputChange} />
                          </div>
                          <div>
                            <Label htmlFor="joining_date">Joining Date</Label>
                            <Input
                              id="joining_date"
                              type="date"
                              value={formData.joining_date}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        {/* Referees Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Referees</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="referee1_name">Referee 1 - Name</Label>
                              <Input id="referee1_name" value={formData.referee1_name} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee1_position">Referee 1 - Position</Label>
                              <Input id="referee1_position" value={formData.referee1_position} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee1_address">Referee 1 - Address</Label>
                              <Input id="referee1_address" value={formData.referee1_address} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee1_phone">Referee 1 - Phone</Label>
                              <Input id="referee1_phone" value={formData.referee1_phone} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee1_relationship">Referee 1 - Relationship</Label>
                              <Input id="referee1_relationship" value={formData.referee1_relationship} onChange={handleInputChange} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="referee2_name">Referee 2 - Name</Label>
                              <Input id="referee2_name" value={formData.referee2_name} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee2_position">Referee 2 - Position</Label>
                              <Input id="referee2_position" value={formData.referee2_position} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee2_address">Referee 2 - Address</Label>
                              <Input id="referee2_address" value={formData.referee2_address} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee2_phone">Referee 2 - Phone</Label>
                              <Input id="referee2_phone" value={formData.referee2_phone} onChange={handleInputChange} />
                            </div>
                            <div>
                              <Label htmlFor="referee2_relationship">Referee 2 - Relationship</Label>
                              <Input id="referee2_relationship" value={formData.referee2_relationship} onChange={handleInputChange} />
                            </div>
                          </div>
                        </div>

                        {/* Passport Picture Section */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="passport_picture">Passport Picture</Label>
                            <div className="mt-2">
                              {passportPicturePreview ? (
                                <div className="relative inline-block">
                                  <img
                                    src={passportPicturePreview}
                                    alt="Passport preview"
                                    className="w-32 h-32 object-cover rounded-lg border"
                                  />
                                  <button
                                    type="button"
                                    onClick={removePassportPicture}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                  <input
                                    type="file"
                                    id="passport_picture"
                                    accept="image/*"
                                    onChange={handlePassportPictureChange}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="passport_picture"
                                    className="cursor-pointer flex flex-col items-center space-y-2"
                                  >
                                    <Camera className="h-8 w-8 text-gray-400" />
                                    <span className="text-sm text-gray-600">Click to upload passport picture</span>
                                    <span className="text-xs text-gray-500">JPG, PNG, GIF up to 5MB</span>
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Add Teacher"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <Button onClick={() => setIsQrModalOpen(true)} variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                <span>Sign In</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span>Total Teachers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTeachers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-green-500" />
                    <span>Active Teachers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeTeachers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    <span>Male Teachers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{maleTeachers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-pink-500" />
                    <span>Female Teachers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{femaleTeachers}</div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-4">
              <div className="flex items-center space-x-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search teachers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-[250px] pl-8"
                  />
                </div>
                {subjectOptions.length > 0 && (
                  <Select onValueChange={(value) => setSelectedSubject(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjectOptions.map((subject, index) => (
                        <SelectItem key={index} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="mb-4">
              <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer"
                onDrop={handleFileDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <UserPlus className="w-6 h-6 text-gray-500 mb-2" />
                <p className="text-gray-500">Drag and drop your CSV or Excel file here or click to select</p>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>
              {uploadError && (
                <div className="text-red-500 mt-2 text-sm">{uploadError}</div>
              )}
              {csvFile && (
                <div className="mt-2">
                  <p>Selected file: {csvFile.name}</p>
                  <Button variant="secondary" onClick={handleUploadCSV} disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              )}
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
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
                      <TableRow
                        key={teacher.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest("button")) {
                            setSelectedTeacher(teacher)
                            setEditFormData(teacher)
                            setIsViewTeacherOpen(true)
                          }
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={teacher.passport_picture} alt={`${teacher.firstname} ${teacher.lastname}`} />
                              <AvatarFallback>{getInitials(teacher.firstname, teacher.lastname)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{`${teacher.firstname} ${teacher.lastname}`}</div>
                              <div className="text-xs text-muted-foreground">{teacher.qualification}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.subject || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{teacher.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{teacher.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${teacher.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : teacher.status === "On Leave"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {teacher.status}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedTeacher(teacher)
                              setEditFormData(teacher)
                              setIsViewTeacherOpen(true)
                              setIsEditing(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {selectedTeacher && (
              <Dialog
                open={isViewTeacherOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsViewTeacherOpen(false)
                    setIsEditing(false)
                  }
                }}
                modal
              >
                <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Teacher Information</DialogTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? "Cancel Edit" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsViewTeacherOpen(false)
                          setIsEditing(false)
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </DialogHeader>

                  {isEditing ? (
                    <form onSubmit={handleUpdateTeacher} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_firstname">First Name</Label>
                          <Input
                            id="edit_firstname"
                            value={editFormData.firstname}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                firstname: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_lastname">Last Name</Label>
                          <Input
                            id="edit_lastname"
                            value={editFormData.lastname}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                lastname: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_email">Email</Label>
                          <Input
                            id="edit_email"
                            type="email"
                            value={editFormData.email}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_phone">Phone</Label>
                          <Input
                            id="edit_phone"
                            value={editFormData.phone}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_subject">Subject</Label>
                          <Input
                            id="edit_subject"
                            value={editFormData.subject}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                subject: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      
                      {/* Passport Picture Section for Edit */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit_passport_picture">Passport Picture</Label>
                          <div className="mt-2">
                            {editFormData.passport_picture ? (
                              <div className="relative inline-block">
                                <img
                                  src={editFormData.passport_picture}
                                  alt="Passport preview"
                                  className="w-32 h-32 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditFormData((prev) => ({ ...prev, passport_picture: "" }))}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                <input
                                  type="file"
                                  id="edit_passport_picture"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const reader = new FileReader()
                                      reader.onload = (e) => {
                                        setEditFormData((prev) => ({
                                          ...prev,
                                          passport_picture: e.target?.result as string
                                        }))
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="edit_passport_picture"
                                  className="cursor-pointer flex flex-col items-center space-y-2"
                                >
                                  <Camera className="h-8 w-8 text-gray-400" />
                                  <span className="text-sm text-gray-600">Click to upload passport picture</span>
                                  <span className="text-xs text-gray-500">JPG, PNG, GIF up to 5MB</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedTeacher.passport_picture} alt={`${selectedTeacher.firstname} ${selectedTeacher.lastname}`} />
                          <AvatarFallback className="text-lg">
                            {getInitials(selectedTeacher.firstname, selectedTeacher.lastname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold">{`${selectedTeacher.firstname} ${selectedTeacher.lastname}`}</h3>
                          <p className="text-muted-foreground">{selectedTeacher.subject} Teacher</p>
                        </div>
                      </div>
                      <div>
                        <Label className="font-bold">Email</Label>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {selectedTeacher.email}
                        </p>
                      </div>
                      <div>
                        <Label className="font-bold">Phone</Label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {selectedTeacher.phone}
                        </p>
                      </div>
                      <div>
                        <Label className="font-bold">Qualification</Label>
                        <p className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          {selectedTeacher.qualification}
                        </p>
                      </div>
                      <div>
                        <Label className="font-bold">Subject</Label>
                        <p className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {selectedTeacher.subject}
                        </p>
                      </div>
                      <div>
                        <Label className="font-bold">Joining Date</Label>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {selectedTeacher.joining_date}
                        </p>
                      </div>
                      <div>
                        <Label className="font-bold">Status</Label>
                        <p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTeacher.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : selectedTeacher.status === "On Leave"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {selectedTeacher.status}
                          </span>
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="font-bold">Address</Label>
                        <p>{selectedTeacher.address}</p>
                      </div>
                      <div>
                        <Label className="font-bold">Passport Picture</Label>
                        {selectedTeacher.passport_picture ? (
                          <div className="flex items-center gap-4">
                            <img
                              src={selectedTeacher.passport_picture}
                              alt="Teacher passport"
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <div className="text-sm text-muted-foreground">
                              <p>Profile photo uploaded</p>
                              <p>Click to view full size</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <Avatar className="h-32 w-32">
                              <AvatarFallback className="text-4xl">
                                {getInitials(selectedTeacher.firstname || '', selectedTeacher.lastname || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm text-muted-foreground">
                              <p>No passport picture uploaded</p>
                              <p>Upload a photo in edit mode</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {/* QR Code Modal */}
            <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
              <DialogContent className="sm:max-w-[600px] md:max-w-[650px] w-[90%]">
                <DialogHeader>
                  <DialogTitle>Teacher Attendance QR Code</DialogTitle>
                  <DialogDescription>Scan this QR code using a mobile device to mark attendance</DialogDescription>
                </DialogHeader>
                {schoolInfo.school_id && (
                  <TeacherAttendanceQR
                    schoolId={schoolInfo.school_id}
                    schoolName={schoolInfo.schoolName}
                    inModal={true}
                  />
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsQrModalOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
