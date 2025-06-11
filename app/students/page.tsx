"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
import {
  UserPlus,
  Upload,
  Users,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Accessibility,
  Activity,
  Filter,
  Search,
  Download,
  FileIcon as FilePdf,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, Timestamp, getDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { useSearchParams, useRouter } from "next/navigation"
import { exportToCSV, exportToExcel, exportToPDF, prepareDataForExport } from "@/lib/export-utils"

export default function StudentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialFilter = searchParams.get("filter")

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    batch: "",
    school_id: "",
    adm_no: "",
    schoolname: "",
    firstname: "",
    lastname: "",
    dob: "",
    gender: "",
    bgroup: "",
    class: "",
    faculty: "",
    level: "",
    homeaddress: "",
    phonenumber: "",
    emailaddress: "",
    religion: "",
    nationality: "",
    nin: "",
    disability: "",
    disability_type: "",
    sick: "",
    sick_type: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [parentFormData, setParentFormData] = useState({
    student_id: "",
    firstname: "",
    lastname: "",
    gender: "",
    dob: "",
    occupation: "",
    emailaddress: "",
    phonenumber: "",
    homeaddress: "",
    relationship_with_student: "",
    nin: "",
    password: "",
  })
  const [isAddParentOpen, setIsAddParentOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedStudentName, setSelectedStudentName] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [isViewStudentOpen, setIsViewStudentOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState(formData)
  const [classes, setClasses] = useState<any[]>([])
  const [specialNeedsFilter, setSpecialNeedsFilter] = useState(
    initialFilter === "special-needs" ? "all-special" : "all",
  )
  const [schoolId, setSchoolId] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [isSearchingNIN, setIsSearchingNIN] = useState(false)
  const [ninSearchQuery, setNinSearchQuery] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isSubmittingParent, setIsSubmittingParent] = useState(false)

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      // Get current admin's school ID
      const adminId = localStorage.getItem("adminId")
      let currentSchoolId = ""
      let currentSchoolName = ""

      if (adminId) {
        const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
        if (adminDoc.exists()) {
          const adminData = adminDoc.data()
          currentSchoolId = adminData.school_id || adminId
          currentSchoolName = adminData.schoolName || "Holy Family Junior Secondary School"
          setSchoolId(currentSchoolId)
          setSchoolName(currentSchoolName)
        }
      }

      // Create query with school ID filter only (no ordering)
      let studentsQuery = collection(db, "students")

      if (currentSchoolId) {
        studentsQuery = query(collection(db, "students"), where("school_id", "==", currentSchoolId))
      } else {
        studentsQuery = query(collection(db, "students"))
      }

      const querySnapshot = await getDocs(studentsQuery)

      // Sort students by created_at client-side
      const studentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Sort by created_at in descending order (newest first)
      const sortedStudents = studentsList.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0)
        const dateB = b.created_at?.toDate?.() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      setStudents(sortedStudents)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()

    // Fetch classes for the dropdown
    const fetchClasses = async () => {
      try {
        // Get current admin's school ID
        const adminId = localStorage.getItem("adminId")
        let currentSchoolId = ""

        if (adminId) {
          const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            currentSchoolId = adminData.school_id || adminId
          }
        }

        // Create query with school ID filter
        let classesQuery = collection(db, "classes")

        if (currentSchoolId) {
          classesQuery = query(collection(db, "classes"), where("school_id", "==", currentSchoolId))
        }

        const classesSnapshot = await getDocs(classesQuery)
        const classesList = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setClasses(classesList)
      } catch (error) {
        console.error("Error fetching classes:", error)
      }
    }

    // Fetch school admin data to auto-populate fields
    const fetchSchoolAdmin = async () => {
      try {
        const adminId = localStorage.getItem("adminId")
        if (adminId) {
          const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            setFormData((prev) => ({
              ...prev,
              school_id: adminData.school_id || adminId,
              schoolname: adminData.schoolName || "Holy Family Junior Secondary School",
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching school admin data:", error)
      }
    }

    fetchClasses()
    fetchSchoolAdmin()
  }, [initialFilter])

  // Refresh students list after adding a new student
  const refreshStudents = async () => {
    try {
      const studentsRef = collection(db, "students")

      // Apply school ID filter if available (without ordering)
      let q = query(studentsRef)

      if (schoolId) {
        q = query(studentsRef, where("school_id", "==", schoolId))
      }

      const querySnapshot = await getDocs(q)

      // Sort students by created_at client-side
      const studentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Sort by created_at in descending order (newest first)
      const sortedStudents = studentsList.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0)
        const dateB = b.created_at?.toDate?.() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      setStudents(sortedStudents)
    } catch (error) {
      console.error("Error refreshing students:", error)
      toast({
        title: "Error",
        description: "Failed to refresh students data",
        variant: "destructive",
      })
    }
  }

  const filteredStudents = students.filter((student) => {
    // Text search filter
    const matchesSearch =
      student.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nin?.includes(searchQuery)

    // Class filter
    const matchesClass = selectedClass === "all" || student.class === selectedClass

    // Special needs filter
    let matchesSpecialNeeds = true
    if (specialNeedsFilter === "disability") {
      matchesSpecialNeeds = student.disability === "Yes"
    } else if (specialNeedsFilter === "medical") {
      matchesSpecialNeeds = student.sick === "Yes"
    } else if (specialNeedsFilter === "all-special") {
      matchesSpecialNeeds = student.disability === "Yes" || student.sick === "Yes"
    }

    return matchesSearch && matchesClass && matchesSpecialNeeds
  })

  // Calculate dashboard metrics
  const totalStudents = students.length
  const activeStudents = students.filter((student) => student.status === "Active").length
  const maleStudents = students.filter((student) => student.gender === "Male").length
  const femaleStudents = students.filter((student) => student.gender === "Female").length
  const studentsWithDisabilities = students.filter((student) => student.disability === "Yes").length
  const studentsWithMedicalConditions = students.filter((student) => student.sick === "Yes").length

  // Form validation schema
  const studentSchema = z.object({
    batch: z.string().min(1, "Academic year is required"),
    school_id: z.string().min(1, "School ID is required"),
    adm_no: z.string().min(1, "Admission number is required"),
    schoolname: z.string().min(1, "School name is required"),
    firstname: z.string().min(2, "First name must be at least 2 characters"),
    lastname: z.string().min(2, "Last name must be at least 2 characters"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.string().min(1, "Gender is required"),
    class: z.string().min(1, "Class is required"),
    homeaddress: z.string().min(1, "Home address is required"),
    nationality: z.string().min(1, "Nationality is required"),
    // Optional fields
    bgroup: z.string().optional(),
    faculty: z.string().optional(),
    level: z.string().optional(),
    phonenumber: z.string().optional(),
    emailaddress: z.string().email().optional().or(z.literal("")),
    religion: z.string().optional(),
    nin: z.string().optional(),
    disability: z.string().optional(),
    disability_type: z.string().optional(),
    sick: z.string().optional(),
    sick_type: z.string().optional(),
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Validate form data
      studentSchema.parse(formData)

      // Generate a unique ID if admission number is not provided
      const studentId = formData.adm_no || `ST${Date.now().toString().slice(-6)}`

      // Ensure school information is included
      const adminId = localStorage.getItem("adminId")
      let schoolData = {
        school_id: formData.school_id,
        schoolname: formData.schoolname,
      }

      // If school info is not already in the form data, try to get it
      if (!formData.school_id || !formData.schoolname) {
        try {
          if (adminId) {
            const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
            if (adminDoc.exists()) {
              const adminData = adminDoc.data()
              schoolData = {
                school_id: adminData.school_id || adminId,
                schoolname: adminData.schoolName || "Holy Family Junior Secondary School",
              }
            }
          }
        } catch (error) {
          console.error("Error fetching school admin data:", error)
        }
      }

      // Add timestamp and metadata
      const currentDate = new Date()
      const studentData = {
        ...formData,
        ...schoolData, // Ensure school data is included
        id: studentId,
        status: "Active",
        created_at: Timestamp.fromDate(currentDate),
        date: currentDate.toLocaleDateString(),
        month: currentDate.toLocaleString("default", { month: "long" }),
        year: currentDate.getFullYear().toString(),
      }

      // Save to Firestore
      await setDoc(doc(db, "students", studentId), studentData)

      // Show success message
      toast({
        title: "Success",
        description: "Student added successfully",
      })

      // Refresh the students list
      await refreshStudents()

      // Reset form and close dialog
      setFormData({
        batch: "",
        school_id: "",
        adm_no: "",
        schoolname: "",
        firstname: "",
        lastname: "",
        dob: "",
        gender: "",
        bgroup: "",
        class: "",
        faculty: "",
        level: "",
        homeaddress: "",
        phonenumber: "",
        emailaddress: "",
        religion: "",
        nationality: "",
        nin: "",
        disability: "",
        disability_type: "",
        sick: "",
        sick_type: "",
      })
      setIsAddStudentOpen(false)
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        })
      } else {
        console.error("Error adding student:", error)
        toast({
          title: "Error",
          description: "Failed to add student. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]

    if (!file) return

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setUploadError("Please upload a valid CSV file")
      return
    }

    setCsvFile(file)
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setUploadError(null)

    const file = e.dataTransfer.files?.[0]

    if (!file) return

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setUploadError("Please upload a valid CSV file")
      return
    }

    setCsvFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleUploadCSV = async () => {
    if (!csvFile) {
      setUploadError("Please select a CSV file first")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Here you would implement the actual CSV processing logic
      // For example, reading the file and sending it to your backend

      // Simulating upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Success message
      toast({
        title: "Success",
        description: `${csvFile.name} uploaded successfully`,
      })

      // Reset state
      setCsvFile(null)
      setIsAddStudentOpen(false)
    } catch (error) {
      setUploadError("Failed to process CSV file. Please try again.")
      console.error("CSV upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplateCSV = () => {
    // Create CSV template content
    const headers = [
      "admission_number",
      "first_name",
      "last_name",
      "gender",
      "date_of_birth",
      "class",
      "level",
      "address",
      "phone",
      "email",
      "nin",
    ].join(",")

    const csvContent = `data:text/csv;charset=utf-8,${headers}`

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "student_template.csv")
    document.body.appendChild(link)

    // Trigger download
    link.click()

    // Clean up
    document.body.removeChild(link)
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Ensure school ID is preserved
      const updatedData = {
        ...editFormData,
        school_id: editFormData.school_id || schoolId,
        schoolname: editFormData.schoolname || schoolName,
        updated_at: Timestamp.fromDate(new Date()),
      }

      await setDoc(doc(db, "students", selectedStudent.id), updatedData)

      toast({
        title: "Success",
        description: "Student information updated successfully",
      })

      await refreshStudents()
      setIsViewStudentOpen(false)
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student information",
        variant: "destructive",
      })
    }
  }

  // Get unique class options from students data
  const classOptions = [...new Set(students.map((student) => student.class))]

  // Handle special needs filter change
  const handleSpecialNeedsFilterChange = (value: string) => {
    setSpecialNeedsFilter(value)

    // Update URL to reflect filter (for sharing/bookmarking)
    if (value === "all-special") {
      router.push("/students?filter=special-needs")
    } else {
      router.push("/students")
    }
  }

  // Function to search for student by NIN
  const searchStudentByNIN = async () => {
    if (!ninSearchQuery) {
      toast({
        title: "Error",
        description: "Please enter a NIN to search",
        variant: "destructive",
      })
      return
    }

    setIsSearchingNIN(true)
    try {
      // In a real implementation, this would call an API to get student data
      // For now, we'll simulate by searching our local data

      // First check if we have the student in our local data
      const foundStudent = students.find((student) => student.nin === ninSearchQuery)

      if (foundStudent) {
        // Populate the form with the found student's data
        setFormData({
          ...formData,
          firstname: foundStudent.firstname || "",
          lastname: foundStudent.lastname || "",
          dob: foundStudent.dob || "",
          gender: foundStudent.gender || "",
          homeaddress: foundStudent.homeaddress || "",
          phonenumber: foundStudent.phonenumber || "",
          emailaddress: foundStudent.emailaddress || "",
          nationality: foundStudent.nationality || "Sierra Leone",
          nin: foundStudent.nin || ninSearchQuery,
        })

        toast({
          title: "Success",
          description: "Student information found and populated",
        })
      } else {
        // Simulate API call to National ID database
        // In a real implementation, this would be an actual API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // For demo purposes, we'll just set the NIN and show a message
        setFormData({
          ...formData,
          nin: ninSearchQuery,
        })

        toast({
          title: "Information",
          description:
            "No student found with this NIN. When API is connected, this would fetch data from the National ID database.",
        })
      }
    } catch (error) {
      console.error("Error searching by NIN:", error)
      toast({
        title: "Error",
        description: "Failed to search by NIN. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearchingNIN(false)
    }
  }

  // Export functions
  const handleExportToCSV = () => {
    try {
      setIsExporting(true)

      const headers = [
        { key: "id", label: "Student ID" },
        { key: "firstname", label: "First Name" },
        { key: "lastname", label: "Last Name" },
        { key: "gender", label: "Gender" },
        { key: "dob", label: "Date of Birth" },
        { key: "class", label: "Class" },
        { key: "level", label: "Level" },
        { key: "homeaddress", label: "Address" },
        { key: "phonenumber", label: "Phone" },
        { key: "emailaddress", label: "Email" },
        { key: "disability", label: "Disability" },
        { key: "disability_type", label: "Disability Type" },
        { key: "sick", label: "Medical Condition" },
        { key: "sick_type", label: "Medical Condition Type" },
      ]

      // Use the filtered students for export
      const exportData = prepareDataForExport(filteredStudents, [
        "created_at", // Exclude raw timestamp objects
        "updated_at",
      ])

      exportToCSV(
        exportData,
        headers,
        `${schoolName.replace(/\s+/g, "_")}_Students_${new Date().toISOString().split("T")[0]}`,
      )

      toast({
        title: "Success",
        description: "Students data exported to CSV successfully",
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Error",
        description: "Failed to export students data to CSV",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = () => {
    try {
      setIsExporting(true)

      const headers = [
        { key: "id", label: "Student ID" },
        { key: "firstname", label: "First Name" },
        { key: "lastname", label: "Last Name" },
        { key: "gender", label: "Gender" },
        { key: "dob", label: "Date of Birth" },
        { key: "class", label: "Class" },
        { key: "level", label: "Level" },
        { key: "homeaddress", label: "Address" },
        { key: "phonenumber", label: "Phone" },
        { key: "emailaddress", label: "Email" },
        { key: "disability", label: "Disability" },
        { key: "disability_type", label: "Disability Type" },
        { key: "sick", label: "Medical Condition" },
        { key: "sick_type", label: "Medical Condition Type" },
      ]

      // Use the filtered students for export
      const exportData = prepareDataForExport(filteredStudents, [
        "created_at", // Exclude raw timestamp objects
        "updated_at",
      ])

      exportToExcel(
        exportData,
        headers,
        `${schoolName.replace(/\s+/g, "_")}_Students_${new Date().toISOString().split("T")[0]}`,
      )

      toast({
        title: "Success",
        description: "Students data exported to Excel successfully",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Error",
        description: "Failed to export students data to Excel",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToPDF = () => {
    try {
      setIsExporting(true)

      const headers = [
        { key: "id", label: "ID" },
        { key: "firstname", label: "First Name" },
        { key: "lastname", label: "Last Name" },
        { key: "gender", label: "Gender" },
        { key: "class", label: "Class" },
        { key: "disability", label: "Disability" },
        { key: "sick", label: "Medical" },
      ]

      // Use the filtered students for export
      const exportData = prepareDataForExport(filteredStudents, [
        "created_at", // Exclude raw timestamp objects
        "updated_at",
      ])

      exportToPDF(
        exportData,
        headers,
        `${schoolName.replace(/\s+/g, "_")}_Students_${new Date().toISOString().split("T")[0]}`,
        "Students Report",
        schoolName,
      )

      toast({
        title: "Success",
        description: "Students data exported to PDF successfully",
      })
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Error",
        description: "Failed to export students data to PDF",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSubmitParent = async (e: React.FormEvent, studentId: string, studentName: string) => {
    e.preventDefault()
    setIsSubmittingParent(true)

    try {
      // Generate a unique ID for the parent
      const parentId = `PAR${Date.now().toString().slice(-6)}`

      // Get current admin's school data
      const adminId = localStorage.getItem("adminId")
      let schoolData = {
        school_id: schoolId,
        schoolname: schoolName,
      }

      if (adminId && (!schoolId || !schoolName)) {
        try {
          const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            schoolData = {
              school_id: adminData.school_id || adminId,
              schoolname: adminData.schoolName || "Holy Family Junior Secondary School",
            }
          }
        } catch (error) {
          console.error("Error fetching school admin data:", error)
        }
      }

      // Prepare parent data
      const currentDate = new Date()
      const parentData = {
        ...parentFormData,
        id: parentId,
        student_id: studentId,
        student_name: studentName,
        ...schoolData,
        status: "Active",
        created_at: Timestamp.fromDate(currentDate),
        date: currentDate.toLocaleDateString(),
        month: currentDate.toLocaleString("default", { month: "long" }),
        year: currentDate.getFullYear().toString(),
      }

      // Save to Firestore
      await setDoc(doc(db, "parents", parentId), parentData)

      toast({
        title: "Success",
        description: `Parent added successfully for ${studentName}`,
      })

      // Reset form
      setParentFormData({
        student_id: "",
        firstname: "",
        lastname: "",
        gender: "",
        dob: "",
        occupation: "",
        emailaddress: "",
        phonenumber: "",
        homeaddress: "",
        relationship_with_student: "",
        nin: "",
        password: "",
      })

      // Close the dialog
      const dialogCloseButton = document.querySelector('[role="dialog"] button[aria-label="Close"]')
      if (dialogCloseButton) {
        ;(dialogCloseButton as HTMLElement).click()
      }
    } catch (error) {
      console.error("Error adding parent:", error)
      toast({
        title: "Error",
        description: "Failed to add parent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingParent(false)
    }
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Students</CardTitle>
          <div className="space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="space-x-2" disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" forceMount>
                <DropdownMenuItem onClick={handleExportToCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Export to CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Export to Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportToPDF}>
                  <FilePdf className="h-4 w-4 mr-2" />
                  <span>Export to PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span>Add Student</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] w-[90%] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Student</DialogTitle>
                  <DialogDescription>Fill out the form below to add a new student.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="personal" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal" className="space-y-2">
                    {/* NIN Search Section */}
                    <div className="mb-6 p-4 border rounded-md bg-gray-50">
                      <h3 className="text-sm font-medium mb-2">Search by National ID Number</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter NIN"
                          value={ninSearchQuery}
                          onChange={(e) => setNinSearchQuery(e.target.value)}
                        />
                        <Button variant="secondary" onClick={searchStudentByNIN} disabled={isSearchingNIN}>
                          {isSearchingNIN ? (
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
                        Enter the student's National ID Number to automatically fill their information
                      </p>
                    </div>

                    <form onSubmit={handleSubmitStudent} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="batch">Academic Year</Label>
                          <Input id="batch" value={formData.batch} onChange={handleInputChange} />
                        </div>
                        {/* School ID and School Name fields are hidden but still in the form */}
                        <input type="hidden" id="school_id" value={formData.school_id} />
                        <input type="hidden" id="schoolname" value={formData.schoolname} />
                        <div>
                          <Label htmlFor="adm_no">Admission Number</Label>
                          <Input id="adm_no" value={formData.adm_no} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="firstname">First Name</Label>
                          <Input id="firstname" value={formData.firstname} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="lastname">Last Name</Label>
                          <Input id="lastname" value={formData.lastname} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="dob">Date of Birth</Label>
                          <Input type="date" id="dob" value={formData.dob} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            onValueChange={(value) => handleSelectChange("gender", value)}
                            value={formData.gender}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="bgroup">Blood Group</Label>
                          <Select
                            onValueChange={(value) => handleSelectChange("bgroup", value)}
                            defaultValue="Not Known"
                            value={formData.bgroup || "Not Known"}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select blood group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Not Known">Not Known</SelectItem>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="class">Class</Label>
                          <Select onValueChange={(value) => handleSelectChange("class", value)} value={formData.class}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.name}>
                                  {cls.name} {cls.section || ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="faculty">Faculty</Label>
                          <Select
                            onValueChange={(value) => handleSelectChange("faculty", value)}
                            value={formData.faculty}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select faculty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Science">Science</SelectItem>
                              <SelectItem value="Commercial">Commercial</SelectItem>
                              <SelectItem value="Arts">Arts</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="level">Level</Label>
                          <Input id="level" value={formData.level} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="homeaddress">Home Address</Label>
                          <Input id="homeaddress" value={formData.homeaddress} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="phonenumber">Phone Number</Label>
                          <Input id="phonenumber" value={formData.phonenumber} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="emailaddress">Email Address</Label>
                          <Input
                            type="email"
                            id="emailaddress"
                            value={formData.emailaddress}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="religion">Religion</Label>
                          <Select
                            onValueChange={(value) => handleSelectChange("religion", value)}
                            value={formData.religion}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select religion" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Christianity">Christianity</SelectItem>
                              <SelectItem value="Islam">Islam</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="nationality">Nationality</Label>
                          <Select
                            onValueChange={(value) => handleSelectChange("nationality", value)}
                            value={formData.nationality}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                              <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                              <SelectItem value="Albania">Albania</SelectItem>
                              <SelectItem value="Algeria">Algeria</SelectItem>
                              <SelectItem value="Andorra">Andorra</SelectItem>
                              <SelectItem value="Angola">Angola</SelectItem>
                              <SelectItem value="Antigua and Barbuda">Antigua and Barbuda</SelectItem>
                              <SelectItem value="Argentina">Argentina</SelectItem>
                              <SelectItem value="Armenia">Armenia</SelectItem>
                              <SelectItem value="Australia">Australia</SelectItem>
                              <SelectItem value="Austria">Austria</SelectItem>
                              <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                              <SelectItem value="Bahamas">Bahamas</SelectItem>
                              <SelectItem value="Bahrain">Bahrain</SelectItem>
                              <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                              <SelectItem value="Barbados">Barbados</SelectItem>
                              <SelectItem value="Belarus">Belarus</SelectItem>
                              <SelectItem value="Belgium">Belgium</SelectItem>
                              <SelectItem value="Belize">Belize</SelectItem>
                              <SelectItem value="Benin">Benin</SelectItem>
                              <SelectItem value="Bhutan">Bhutan</SelectItem>
                              <SelectItem value="Bolivia">Bolivia</SelectItem>
                              <SelectItem value="Bosnia and Herzegovina">Bosnia and Herzegovina</SelectItem>
                              <SelectItem value="Botswana">Botswana</SelectItem>
                              <SelectItem value="Brazil">Brazil</SelectItem>
                              <SelectItem value="Brunei">Brunei</SelectItem>
                              <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                              <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                              <SelectItem value="Burundi">Burundi</SelectItem>
                              <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                              <SelectItem value="Cambodia">Cambodia</SelectItem>
                              <SelectItem value="Cameroon">Cameroon</SelectItem>
                              <SelectItem value="Canada">Canada</SelectItem>
                              <SelectItem value="Central African Republic">Central African Republic</SelectItem>
                              <SelectItem value="Chad">Chad</SelectItem>
                              <SelectItem value="Chile">Chile</SelectItem>
                              <SelectItem value="China">China</SelectItem>
                              <SelectItem value="Colombia">Colombia</SelectItem>
                              <SelectItem value="Comoros">Comoros</SelectItem>
                              <SelectItem value="Congo">Congo</SelectItem>
                              <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                              <SelectItem value="Croatia">Croatia</SelectItem>
                              <SelectItem value="Cuba">Cuba</SelectItem>
                              <SelectItem value="Cyprus">Cyprus</SelectItem>
                              <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                              <SelectItem value="Denmark">Denmark</SelectItem>
                              <SelectItem value="Djibouti">Djibouti</SelectItem>
                              <SelectItem value="Dominica">Dominica</SelectItem>
                              <SelectItem value="Dominican Republic">Dominican Republic</SelectItem>
                              <SelectItem value="Ecuador">Ecuador</SelectItem>
                              <SelectItem value="Egypt">Egypt</SelectItem>
                              <SelectItem value="El Salvador">El Salvador</SelectItem>
                              <SelectItem value="Equatorial Guinea">Equatorial Guinea</SelectItem>
                              <SelectItem value="Eritrea">Eritrea</SelectItem>
                              <SelectItem value="Estonia">Estonia</SelectItem>
                              <SelectItem value="Eswatini">Eswatini</SelectItem>
                              <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                              <SelectItem value="Fiji">Fiji</SelectItem>
                              <SelectItem value="Finland">Finland</SelectItem>
                              <SelectItem value="France">France</SelectItem>
                              <SelectItem value="Gabon">Gabon</SelectItem>
                              <SelectItem value="Gambia">Gambia</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                              <SelectItem value="Germany">Germany</SelectItem>
                              <SelectItem value="Ghana">Ghana</SelectItem>
                              <SelectItem value="Greece">Greece</SelectItem>
                              <SelectItem value="Grenada">Grenada</SelectItem>
                              <SelectItem value="Guatemala">Guatemala</SelectItem>
                              <SelectItem value="Guinea">Guinea</SelectItem>
                              <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                              <SelectItem value="Guyana">Guyana</SelectItem>
                              <SelectItem value="Haiti">Haiti</SelectItem>
                              <SelectItem value="Honduras">Honduras</SelectItem>
                              <SelectItem value="Hungary">Hungary</SelectItem>
                              <SelectItem value="Iceland">Iceland</SelectItem>
                              <SelectItem value="India">India</SelectItem>
                              <SelectItem value="Indonesia">Indonesia</SelectItem>
                              <SelectItem value="Iran">Iran</SelectItem>
                              <SelectItem value="Iraq">Iraq</SelectItem>
                              <SelectItem value="Ireland">Ireland</SelectItem>
                              <SelectItem value="Israel">Israel</SelectItem>
                              <SelectItem value="Italy">Italy</SelectItem>
                              <SelectItem value="Jamaica">Jamaica</SelectItem>
                              <SelectItem value="Japan">Japan</SelectItem>
                              <SelectItem value="Jordan">Jordan</SelectItem>
                              <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                              <SelectItem value="Kenya">Kenya</SelectItem>
                              <SelectItem value="Kiribati">Kiribati</SelectItem>
                              <SelectItem value="Korea, North">Korea, North</SelectItem>
                              <SelectItem value="Korea, South">Korea, South</SelectItem>
                              <SelectItem value="Kosovo">Kosovo</SelectItem>
                              <SelectItem value="Kuwait">Kuwait</SelectItem>
                              <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                              <SelectItem value="Laos">Laos</SelectItem>
                              <SelectItem value="Latvia">Latvia</SelectItem>
                              <SelectItem value="Lebanon">Lebanon</SelectItem>
                              <SelectItem value="Lesotho">Lesotho</SelectItem>
                              <SelectItem value="Liberia">Liberia</SelectItem>
                              <SelectItem value="Libya">Libya</SelectItem>
                              <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                              <SelectItem value="Lithuania">Lithuania</SelectItem>
                              <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                              <SelectItem value="Madagascar">Madagascar</SelectItem>
                              <SelectItem value="Malawi">Malawi</SelectItem>
                              <SelectItem value="Malaysia">Malaysia</SelectItem>
                              <SelectItem value="Maldives">Maldives</SelectItem>
                              <SelectItem value="Mali">Mali</SelectItem>
                              <SelectItem value="Malta">Malta</SelectItem>
                              <SelectItem value="Marshall Islands">Marshall Islands</SelectItem>
                              <SelectItem value="Mauritania">Mauritania</SelectItem>
                              <SelectItem value="Mauritius">Mauritius</SelectItem>
                              <SelectItem value="Mexico">Mexico</SelectItem>
                              <SelectItem value="Micronesia">Micronesia</SelectItem>
                              <SelectItem value="Moldova">Moldova</SelectItem>
                              <SelectItem value="Monaco">Monaco</SelectItem>
                              <SelectItem value="Mongolia">Mongolia</SelectItem>
                              <SelectItem value="Montenegro">Montenegro</SelectItem>
                              <SelectItem value="Morocco">Morocco</SelectItem>
                              <SelectItem value="Mozambique">Mozambique</SelectItem>
                              <SelectItem value="Myanmar">Myanmar</SelectItem>
                              <SelectItem value="Namibia">Namibia</SelectItem>
                              <SelectItem value="Nauru">Nauru</SelectItem>
                              <SelectItem value="Nepal">Nepal</SelectItem>
                              <SelectItem value="Netherlands">Netherlands</SelectItem>
                              <SelectItem value="New Zealand">New Zealand</SelectItem>
                              <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                              <SelectItem value="Niger">Niger</SelectItem>
                              <SelectItem value="Nigeria">Nigeria</SelectItem>
                              <SelectItem value="North Macedonia">North Macedonia</SelectItem>
                              <SelectItem value="Norway">Norway</SelectItem>
                              <SelectItem value="Oman">Oman</SelectItem>
                              <SelectItem value="Pakistan">Pakistan</SelectItem>
                              <SelectItem value="Palau">Palau</SelectItem>
                              <SelectItem value="Palestine">Palestine</SelectItem>
                              <SelectItem value="Panama">Panama</SelectItem>
                              <SelectItem value="Papua New Guinea">Papua New Guinea</SelectItem>
                              <SelectItem value="Paraguay">Paraguay</SelectItem>
                              <SelectItem value="Peru">Peru</SelectItem>
                              <SelectItem value="Philippines">Philippines</SelectItem>
                              <SelectItem value="Poland">Poland</SelectItem>
                              <SelectItem value="Portugal">Portugal</SelectItem>
                              <SelectItem value="Qatar">Qatar</SelectItem>
                              <SelectItem value="Romania">Romania</SelectItem>
                              <SelectItem value="Russia">Russia</SelectItem>
                              <SelectItem value="Rwanda">Rwanda</SelectItem>
                              <SelectItem value="Saint Kitts and Nevis">Saint Kitts and Nevis</SelectItem>
                              <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                              <SelectItem value="Saint Vincent and the Grenadines">
                                Saint Vincent and the Grenadines
                              </SelectItem>
                              <SelectItem value="Samoa">Samoa</SelectItem>
                              <SelectItem value="San Marino">San Marino</SelectItem>
                              <SelectItem value="Sao Tome and Principe">Sao Tome and Principe</SelectItem>
                              <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                              <SelectItem value="Senegal">Senegal</SelectItem>
                              <SelectItem value="Serbia">Serbia</SelectItem>
                              <SelectItem value="Seychelles">Seychelles</SelectItem>
                              <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                              <SelectItem value="Singapore">Singapore</SelectItem>
                              <SelectItem value="Slovakia">Slovakia</SelectItem>
                              <SelectItem value="Slovenia">Slovenia</SelectItem>
                              <SelectItem value="Solomon Islands">Solomon Islands</SelectItem>
                              <SelectItem value="Somalia">Somalia</SelectItem>
                              <SelectItem value="South Africa">South Africa</SelectItem>
                              <SelectItem value="South Sudan">South Sudan</SelectItem>
                              <SelectItem value="Spain">Spain</SelectItem>
                              <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                              <SelectItem value="Sudan">Sudan</SelectItem>
                              <SelectItem value="Suriname">Suriname</SelectItem>
                              <SelectItem value="Sweden">Sweden</SelectItem>
                              <SelectItem value="Switzerland">Switzerland</SelectItem>
                              <SelectItem value="Syria">Syria</SelectItem>
                              <SelectItem value="Taiwan">Taiwan</SelectItem>
                              <SelectItem value="Tajikistan">Tajikistan</SelectItem>
                              <SelectItem value="Tanzania">Tanzania</SelectItem>
                              <SelectItem value="Thailand">Thailand</SelectItem>
                              <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                              <SelectItem value="Togo">Togo</SelectItem>
                              <SelectItem value="Tonga">Tonga</SelectItem>
                              <SelectItem value="Trinidad and Tobago">Trinidad and Tobago</SelectItem>
                              <SelectItem value="Tunisia">Tunisia</SelectItem>
                              <SelectItem value="Turkey">Turkey</SelectItem>
                              <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                              <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                              <SelectItem value="Uganda">Uganda</SelectItem>
                              <SelectItem value="Ukraine">Ukraine</SelectItem>
                              <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                              <SelectItem value="United States">United States</SelectItem>
                              <SelectItem value="Uruguay">Uruguay</SelectItem>
                              <SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
                              <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                              <SelectItem value="Vatican City">Vatican City</SelectItem>
                              <SelectItem value="Venezuela">Venezuela</SelectItem>
                              <SelectItem value="Vietnam">Vietnam</SelectItem>
                              <SelectItem value="Yemen">Yemen</SelectItem>
                              <SelectItem value="Zambia">Zambia</SelectItem>
                              <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="nin">NIN</Label>
                          <Input id="nin" value={formData.nin} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="disability">Disability</Label>
                          <Select
                            onValueChange={(value) => handleSelectChange("disability", value)}
                            value={formData.disability}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_assigned">Not Assigned</SelectItem>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.disability === "Yes" && (
                          <div>
                            <Label htmlFor="disability_type">Disability Type</Label>
                            <Input id="disability_type" value={formData.disability_type} onChange={handleInputChange} />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="sick">Medical Condition</Label>
                          <Select onValueChange={(value) => handleSelectChange("sick", value)} value={formData.sick}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_assigned">Not Assigned</SelectItem>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.sick === "Yes" && (
                          <div>
                            <Label htmlFor="sick_type">Medical Condition Type</Label>
                            <Input id="sick_type" value={formData.sick_type} onChange={handleInputChange} />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Add Student"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Total Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Active Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Accessibility className="h-4 w-4 text-purple-500" />
                  <span>With Disabilities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentsWithDisabilities}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-red-500" />
                  <span>With Medical Conditions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentsWithMedicalConditions}</div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-auto">
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[250px]"
                />
              </div>
              <Select onValueChange={(value) => setSelectedClass(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classOptions.map((classOption, index) => (
                    <SelectItem key={index} value={classOption}>
                      {classOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={handleSpecialNeedsFilterChange} value={specialNeedsFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Special needs filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="all-special">All Special Needs</SelectItem>
                  <SelectItem value="disability">With Disabilities</SelectItem>
                  <SelectItem value="medical">With Medical Conditions</SelectItem>
                </SelectContent>
              </Select>
              {specialNeedsFilter !== "all" && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-800 border-purple-200 flex items-center gap-1"
                >
                  <Filter className="h-3 w-3" />
                  <span>Special Needs Filter Active</span>
                </Badge>
              )}
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Upload CSV</AccordionTrigger>
                <AccordionContent>
                  <div
                    className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer"
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 text-gray-500 mb-2" />
                    <p className="text-gray-500">Drag and drop your CSV file here or click to select</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                  </div>
                  {uploadError && (
                    <Badge variant="destructive" className="mt-2">
                      {uploadError}
                    </Badge>
                  )}
                  {csvFile && (
                    <div className="mt-2">
                      <p>Selected file: {csvFile.name}</p>
                      <Button variant="secondary" onClick={handleUploadCSV} disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  )}
                  <Button variant="link" onClick={downloadTemplateCSV}>
                    Download CSV Template
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          {isLoading ? (
            <p>Loading students...</p>
          ) : filteredStudents.length === 0 ? (
            <p>No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Special Needs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest("button")) {
                          setSelectedStudent(student)
                          setEditFormData(student)
                          setIsViewStudentOpen(true)
                        }
                      }}
                    >
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{`${student.firstname} ${student.lastname}`}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.disability === "Yes" && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                              <Accessibility className="h-3 w-3 mr-1" />
                              {student.disability_type || "Disability"}
                            </Badge>
                          )}
                          {student.sick === "Yes" && (
                            <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                              <Activity className="h-3 w-3 mr-1" />
                              {student.sick_type || "Medical"}
                            </Badge>
                          )}
                          {student.disability !== "Yes" && student.sick !== "Yes" && (
                            <span className="text-gray-500 text-sm">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Add Parent
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] w-[90%] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Add Parent for {student.firstname} {student.lastname}
                              </DialogTitle>
                              <DialogDescription>
                                Fill out the form below to add a parent for this student.
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              onSubmit={(e) =>
                                handleSubmitParent(e, student.id, `${student.firstname} ${student.lastname}`)
                              }
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="parent_firstname">First Name</Label>
                                  <Input
                                    id="parent_firstname"
                                    value={parentFormData.firstname}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        firstname: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="parent_lastname">Last Name</Label>
                                  <Input
                                    id="parent_lastname"
                                    value={parentFormData.lastname}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        lastname: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="parent_gender">Gender</Label>
                                  <Select
                                    onValueChange={(value) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        gender: value,
                                      }))
                                    }
                                  >
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
                                  <Label htmlFor="parent_relationship">Relationship</Label>
                                  <Select
                                    onValueChange={(value) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        relationship_with_student: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select relationship" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Father">Father</SelectItem>
                                      <SelectItem value="Mother">Mother</SelectItem>
                                      <SelectItem value="Guardian">Guardian</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="parent_phone">Phone Number</Label>
                                  <Input
                                    id="parent_phone"
                                    value={parentFormData.phonenumber}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        phonenumber: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="parent_email">Email</Label>
                                  <Input
                                    type="email"
                                    id="parent_email"
                                    value={parentFormData.emailaddress}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        emailaddress: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="parent_dob">Date of Birth</Label>
                                  <Input
                                    type="date"
                                    id="parent_dob"
                                    value={parentFormData.dob}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        dob: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="parent_occupation">Occupation</Label>
                                  <Input
                                    id="parent_occupation"
                                    value={parentFormData.occupation}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        occupation: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="parent_address">Home Address</Label>
                                  <Input
                                    id="parent_address"
                                    value={parentFormData.homeaddress}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        homeaddress: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="parent_nin">NIN</Label>
                                  <Input
                                    id="parent_nin"
                                    value={parentFormData.nin}
                                    onChange={(e) =>
                                      setParentFormData((prev) => ({
                                        ...prev,
                                        nin: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={isSubmittingParent}>
                                  {isSubmittingParent ? "Adding Parent..." : "Add Parent"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {selectedStudent && (
            <Dialog
              open={isViewStudentOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setIsViewStudentOpen(false)
                  setIsEditing(false)
                }
              }}
              modal
            >
              <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] w-[90%] max-h-[85vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle>Student Information</DialogTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      {isEditing ? "Cancel Edit" : "Edit"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsViewStudentOpen(false)
                        setIsEditing(false)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </DialogHeader>

                {isEditing ? (
                  <form onSubmit={handleUpdateStudent} className="space-y-4">
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
                        <Label htmlFor="edit_class">Class</Label>
                        <Input
                          id="edit_class"
                          value={editFormData.class}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              class: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_gender">Gender</Label>
                        <Select
                          value={editFormData.gender}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              gender: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit_disability">Disability</Label>
                        <Select
                          value={editFormData.disability}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              disability: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editFormData.disability === "Yes" && (
                        <div>
                          <Label htmlFor="edit_disability_type">Disability Type</Label>
                          <Input
                            id="edit_disability_type"
                            value={editFormData.disability_type}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                disability_type: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="edit_sick">Medical Condition</Label>
                        <Select
                          value={editFormData.sick}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              sick: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editFormData.sick === "Yes" && (
                        <div>
                          <Label htmlFor="edit_sick_type">Medical Condition Type</Label>
                          <Input
                            id="edit_sick_type"
                            value={editFormData.sick_type}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                sick_type: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bold">Student ID</Label>
                      <p>{selectedStudent.id}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Name</Label>
                      <p>{`${selectedStudent.firstname} ${selectedStudent.lastname}`}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Class</Label>
                      <p>{selectedStudent.class}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Gender</Label>
                      <p>{selectedStudent.gender}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Date of Birth</Label>
                      <p>{selectedStudent.dob}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Blood Group</Label>
                      <p>{selectedStudent.bgroup || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Address</Label>
                      <p>{selectedStudent.homeaddress}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Phone</Label>
                      <p>{selectedStudent.phonenumber || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Email</Label>
                      <p>{selectedStudent.emailaddress || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-bold">NIN</Label>
                      <p>{selectedStudent.nin || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="font-bold">Disability</Label>
                      <p className="flex items-center gap-2">
                        {selectedStudent.disability === "Yes" ? (
                          <>
                            <Accessibility className="h-4 w-4 text-purple-600" />
                            <span>Yes - {selectedStudent.disability_type || "Not specified"}</span>
                          </>
                        ) : (
                          "No"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="font-bold">Medical Condition</Label>
                      <p className="flex items-center gap-2">
                        {selectedStudent.sick === "Yes" ? (
                          <>
                            <Activity className="h-4 w-4 text-red-600" />
                            <span>Yes - {selectedStudent.sick_type || "Not specified"}</span>
                          </>
                        ) : (
                          "No"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="font-bold">School</Label>
                      <p>{selectedStudent.schoolname || "N/A"}</p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
