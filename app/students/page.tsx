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
  Camera,
  X,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  getDoc,
  where,
  Query,
  DocumentData,
  CollectionReference,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSearchParams, useRouter } from "next/navigation"
import { exportToCSV, exportToExcel, exportToPDF, prepareDataForExport } from "@/lib/export-utils"
import { generateAdmissionNumber } from "@/lib/school-utils"
import Papa from "papaparse"
import * as XLSX from "xlsx"

// Stage-specific level options
const getLevelOptions = (stage: string) => {
  switch (stage) {
    case "Primary":
      return [
        "Prep 1",
        "Prep 2", 
        "Prep 3",
        "Prep 4",
        "Prep 5",
        "Prep 6"
      ]
    case "Junior Secondary":
      return [
        "JSS 1",
        "JSS 2",
        "JSS 3"
      ]
    case "Senior Secondary":
      return [
        "SSS 1",
        "SSS 2", 
        "SSS 3"
      ]
    default:
      return [
        "Not Specified"
      ]
  }
}

// Nationality options with unique keys
const nationalityOptions = [
  { key: "sierra-leone", value: "Sierra Leone" },
  { key: "afghanistan", value: "Afghanistan" },
  { key: "albania", value: "Albania" },
  { key: "algeria", value: "Algeria" },
  { key: "andorra", value: "Andorra" },
  { key: "angola", value: "Angola" },
  { key: "antigua-barbuda", value: "Antigua and Barbuda" },
  { key: "argentina", value: "Argentina" },
  { key: "armenia", value: "Armenia" },
  { key: "australia", value: "Australia" },
  { key: "austria", value: "Austria" },
  { key: "azerbaijan", value: "Azerbaijan" },
  { key: "bahamas", value: "Bahamas" },
  { key: "bahrain", value: "Bahrain" },
  { key: "bangladesh", value: "Bangladesh" },
  { key: "barbados", value: "Barbados" },
  { key: "belarus", value: "Belarus" },
  { key: "belgium", value: "Belgium" },
  { key: "belize", value: "Belize" },
  { key: "benin", value: "Benin" },
  { key: "bhutan", value: "Bhutan" },
  { key: "bolivia", value: "Bolivia" },
  { key: "bosnia-herzegovina", value: "Bosnia and Herzegovina" },
  { key: "botswana", value: "Botswana" },
  { key: "brazil", value: "Brazil" },
  { key: "brunei", value: "Brunei" },
  { key: "bulgaria", value: "Bulgaria" },
  { key: "burkina-faso", value: "Burkina Faso" },
  { key: "burundi", value: "Burundi" },
  { key: "cabo-verde", value: "Cabo Verde" },
  { key: "cambodia", value: "Cambodia" },
  { key: "cameroon", value: "Cameroon" },
  { key: "canada", value: "Canada" },
  { key: "central-african-republic", value: "Central African Republic" },
  { key: "chad", value: "Chad" },
  { key: "chile", value: "Chile" },
  { key: "china", value: "China" },
  { key: "colombia", value: "Colombia" },
  { key: "comoros", value: "Comoros" },
  { key: "congo", value: "Congo" },
  { key: "costa-rica", value: "Costa Rica" },
  { key: "croatia", value: "Croatia" },
  { key: "cuba", value: "Cuba" },
  { key: "cyprus", value: "Cyprus" },
  { key: "czech-republic", value: "Czech Republic" },
  { key: "denmark", value: "Denmark" },
  { key: "djibouti", value: "Djibouti" },
  { key: "dominica", value: "Dominica" },
  { key: "dominican-republic", value: "Dominican Republic" },
  { key: "ecuador", value: "Ecuador" },
  { key: "egypt", value: "Egypt" },
  { key: "el-salvador", value: "El Salvador" },
  { key: "equatorial-guinea", value: "Equatorial Guinea" },
  { key: "eritrea", value: "Eritrea" },
  { key: "estonia", value: "Estonia" },
  { key: "eswatini", value: "Eswatini" },
  { key: "ethiopia", value: "Ethiopia" },
  { key: "fiji", value: "Fiji" },
  { key: "finland", value: "Finland" },
  { key: "france", value: "France" },
  { key: "gabon", value: "Gabon" },
  { key: "gambia", value: "Gambia" },
  { key: "georgia", value: "Georgia" },
  { key: "germany", value: "Germany" },
  { key: "ghana", value: "Ghana" },
  { key: "greece", value: "Greece" },
  { key: "grenada", value: "Grenada" },
  { key: "guatemala", value: "Guatemala" },
  { key: "guinea", value: "Guinea" },
  { key: "guinea-bissau", value: "Guinea-Bissau" },
  { key: "guyana", value: "Guyana" },
  { key: "haiti", value: "Haiti" },
  { key: "honduras", value: "Honduras" },
  { key: "hungary", value: "Hungary" },
  { key: "iceland", value: "Iceland" },
  { key: "india", value: "India" },
  { key: "indonesia", value: "Indonesia" },
  { key: "iran", value: "Iran" },
  { key: "iraq", value: "Iraq" },
  { key: "ireland", value: "Ireland" },
  { key: "israel", value: "Israel" },
  { key: "italy", value: "Italy" },
  { key: "jamaica", value: "Jamaica" },
  { key: "japan", value: "Japan" },
  { key: "jordan", value: "Jordan" },
  { key: "kazakhstan", value: "Kazakhstan" },
  { key: "kenya", value: "Kenya" },
  { key: "kiribati", value: "Kiribati" },
  { key: "korea-north", value: "Korea, North" },
  { key: "korea-south", value: "Korea, South" },
  { key: "kosovo", value: "Kosovo" },
  { key: "kuwait", value: "Kuwait" },
  { key: "kyrgyzstan", value: "Kyrgyzstan" },
  { key: "laos", value: "Laos" },
  { key: "latvia", value: "Latvia" },
  { key: "lebanon", value: "Lebanon" },
  { key: "lesotho", value: "Lesotho" },
  { key: "liberia", value: "Liberia" },
  { key: "libya", value: "Libya" },
  { key: "liechtenstein", value: "Liechtenstein" },
  { key: "lithuania", value: "Lithuania" },
  { key: "luxembourg", value: "Luxembourg" },
  { key: "madagascar", value: "Madagascar" },
  { key: "malawi", value: "Malawi" },
  { key: "malaysia", value: "Malaysia" },
  { key: "maldives", value: "Maldives" },
  { key: "mali", value: "Mali" },
  { key: "malta", value: "Malta" },
  { key: "marshall-islands", value: "Marshall Islands" },
  { key: "mauritania", value: "Mauritania" },
  { key: "mauritius", value: "Mauritius" },
  { key: "mexico", value: "Mexico" },
  { key: "micronesia", value: "Micronesia" },
  { key: "moldova", value: "Moldova" },
  { key: "monaco", value: "Monaco" },
  { key: "mongolia", value: "Mongolia" },
  { key: "montenegro", value: "Montenegro" },
  { key: "morocco", value: "Morocco" },
  { key: "mozambique", value: "Mozambique" },
  { key: "myanmar", value: "Myanmar" },
  { key: "namibia", value: "Namibia" },
  { key: "nauru", value: "Nauru" },
  { key: "nepal", value: "Nepal" },
  { key: "netherlands", value: "Netherlands" },
  { key: "new-zealand", value: "New Zealand" },
  { key: "nicaragua", value: "Nicaragua" },
  { key: "niger", value: "Niger" },
  { key: "nigeria", value: "Nigeria" },
  { key: "north-macedonia", value: "North Macedonia" },
  { key: "norway", value: "Norway" },
  { key: "oman", value: "Oman" },
  { key: "pakistan", value: "Pakistan" },
  { key: "palau", value: "Palau" },
  { key: "panama", value: "Panama" },
  { key: "papua-new-guinea", value: "Papua New Guinea" },
  { key: "paraguay", value: "Paraguay" },
  { key: "peru", value: "Peru" },
  { key: "philippines", value: "Philippines" },
  { key: "poland", value: "Poland" },
  { key: "portugal", value: "Portugal" },
  { key: "qatar", value: "Qatar" },
  { key: "romania", value: "Romania" },
  { key: "russia", value: "Russia" },
  { key: "rwanda", value: "Rwanda" },
  { key: "saint-kitts-nevis", value: "Saint Kitts and Nevis" },
  { key: "saint-lucia", value: "Saint Lucia" },
  { key: "saint-vincent-grenadines", value: "Saint Vincent and the Grenadines" },
  { key: "samoa", value: "Samoa" },
  { key: "san-marino", value: "San Marino" },
  { key: "sao-tome-principe", value: "Sao Tome and Principe" },
  { key: "saudi-arabia", value: "Saudi Arabia" },
  { key: "senegal", value: "Senegal" },
  { key: "serbia", value: "Serbia" },
  { key: "seychelles", value: "Seychelles" },
  { key: "singapore", value: "Singapore" },
  { key: "slovakia", value: "Slovakia" },
  { key: "slovenia", value: "Slovenia" },
  { key: "solomon-islands", value: "Solomon Islands" },
  { key: "somalia", value: "Somalia" },
  { key: "south-africa", value: "South Africa" },
  { key: "south-sudan", value: "South Sudan" },
  { key: "spain", value: "Spain" },
  { key: "sri-lanka", value: "Sri Lanka" },
  { key: "sudan", value: "Sudan" },
  { key: "suriname", value: "Suriname" },
  { key: "sweden", value: "Sweden" },
  { key: "switzerland", value: "Switzerland" },
  { key: "syria", value: "Syria" },
  { key: "taiwan", value: "Taiwan" },
  { key: "tajikistan", value: "Tajikistan" },
  { key: "tanzania", value: "Tanzania" },
  { key: "thailand", value: "Thailand" },
  { key: "timor-leste", value: "Timor-Leste" },
  { key: "togo", value: "Togo" },
  { key: "tonga", value: "Tonga" },
  { key: "trinidad-tobago", value: "Trinidad and Tobago" },
  { key: "tunisia", value: "Tunisia" },
  { key: "turkey", value: "Turkey" },
  { key: "turkmenistan", value: "Turkmenistan" },
  { key: "tuvalu", value: "Tuvalu" },
  { key: "uganda", value: "Uganda" },
  { key: "ukraine", value: "Ukraine" },
  { key: "united-arab-emirates", value: "United Arab Emirates" },
  { key: "united-kingdom", value: "United Kingdom" },
  { key: "united-states", value: "United States" },
  { key: "uruguay", value: "Uruguay" },
  { key: "uzbekistan", value: "Uzbekistan" },
  { key: "vanuatu", value: "Vanuatu" },
  { key: "vatican-city", value: "Vatican City" },
  { key: "venezuela", value: "Venezuela" },
  { key: "vietnam", value: "Vietnam" },
  { key: "yemen", value: "Yemen" },
  { key: "zambia", value: "Zambia" },
  { key: "zimbabwe", value: "Zimbabwe" }
]

interface Student {
  id: string
  created_at?: Timestamp
  firstname?: string
  lastname?: string
  class?: string
  gender?: string
  status?: string
  disability?: string
  disability_type?: string
  sick?: string
  sick_type?: string
  nin?: string
  batch?: string
  school_id?: string
  adm_no?: string
  schoolname?: string
  dob?: string
  bgroup?: string
  faculty?: string
  level?: string
  homeaddress?: string
  phonenumber?: string
  emailaddress?: string
  religion?: string
  nationality?: string
  parent_id?: string
  parent_name?: string
  parent_relationship?: string
  parent_phone?: string
  parent_email?: string
  passport_picture?: string
  [key: string]: any
}

export default function StudentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialFilter = searchParams?.get("filter")

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    id: "",
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
    parent_id: "",
    passport_picture: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewStudentOpen, setIsViewStudentOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<Student & { passport_picture?: string }>({
    id: "",
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
    parent_id: "",
    disability_type: "",
    sick: "",
    sick_type: "",
    passport_picture: "",
  })
  const [classes, setClasses] = useState<any[]>([])
  const [specialNeedsFilter, setSpecialNeedsFilter] = useState(
    initialFilter === "special-needs" ? "all-special" : "all",
  )
  const [schoolId, setSchoolId] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [schoolStage, setSchoolStage] = useState("")
  const [isSearchingNIN, setIsSearchingNIN] = useState(false)
  const [ninSearchQuery, setNinSearchQuery] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isSubmittingParent, setIsSubmittingParent] = useState(false)
  const [duplicateStudent, setDuplicateStudent] = useState<any>(null)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [parentNinSearchQuery, setParentNinSearchQuery] = useState("")
  const [isSearchingParentNin, setIsSearchingParentNin] = useState(false)
  const [passportPicture, setPassportPicture] = useState<File | null>(null)
  const [passportPicturePreview, setPassportPicturePreview] = useState<string>("")

  // NIN API integration for students
  const searchNINFromAPI = async (nin: string) => {
    setIsSearchingNIN(true)
    try {
      console.log('Searching for NIN:', nin)
          const response = await fetch('/api/nin-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nin: nin })
    })
    
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    console.log('Response headers:', response.headers)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: NIN not found`)
      }
      
      const data = await response.json()
      console.log('API response data:', data)
      
      // Check if the API returned valid data
      if (!data || !data.firstName || !data.lastName) {
        console.log('Invalid data structure:', data)
        throw new Error('Invalid NIN data received')
      }
      
      // Auto-populate form with NIN data
      setFormData((prev) => ({
        ...prev,
        firstname: data.firstName || prev.firstname,
        lastname: data.lastName || prev.lastname,
        dob: data.dateOfBirth || prev.dob,
        gender: data.gender || prev.gender,
        nationality: data.nationality || prev.nationality,
        homeaddress: data.address || prev.homeaddress,
        phonenumber: data.phoneNumber || prev.phonenumber,
        emailaddress: data.emailaddress || prev.emailaddress,
        level: data.level || prev.level,
        faculty: data.faculty || prev.faculty
      }))
      
      console.log('Form updated with NIN data')
      
      toast({
        title: "Success",
        description: `Student information retrieved for ${data.firstName} ${data.lastName}`,
      })
    } catch (error) {
      console.error('NIN search failed:', error)
      
      // Show specific error message based on the error
      let errorMessage = "NIN verification failed"
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = `NIN "${nin}" not found in the database`
        } else if (error.message.includes('Invalid NIN data')) {
          errorMessage = "Invalid data received from NIN database"
        } else if (error.message.includes('fetch')) {
          errorMessage = "Network error - please check your connection"
        }
      }
      
      toast({
        title: "NIN Not Found",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSearchingNIN(false)
    }
  }

  // NIN API integration for parents
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

  // Helper function to get student initials
  const getStudentInitials = (firstname: string, lastname: string) => {
    return `${firstname?.charAt(0) || ''}${lastname?.charAt(0) || ''}`.toUpperCase()
  }

  const searchParentNINFromAPI = async (nin: string) => {
    if (!nin.trim()) {
      toast({
        title: "Error",
        description: "Please enter a NIN to search",
        variant: "destructive",
      })
      return
    }

    setIsSearchingParentNin(true)
    try {
      console.log('Searching for parent NIN:', nin)
      
      const response = await fetch('/api/nin-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nin: nin.trim(), type: 'parent' }),
      })

      if (!response.ok) {
        throw new Error('Parent not found')
      }

      const data = await response.json()
      console.log('Parent data retrieved:', data)

      // Auto-populate form with parent data
      setParentFormData((prev) => ({
        ...prev,
        firstname: data.firstName || prev.firstname,
        lastname: data.lastName || prev.lastname,
        gender: data.gender || prev.gender,
        phonenumber: data.phoneNumber || prev.phonenumber,
        emailaddress: data.emailaddress || prev.emailaddress,
        occupation: data.occupation || prev.occupation,
        relationship_with_student: data.relationshipWithStudent || prev.relationship_with_student,
      }))
      
      console.log('Parent form updated with data')
      
      toast({
        title: "Success",
        description: `Parent information retrieved for ${data.firstName} ${data.lastName}`,
      })
    } catch (error) {
      console.error('Parent NIN search failed:', error)
      
      let errorMessage = "Parent search failed"
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          errorMessage = `Parent NIN "${nin}" not found in the database`
        }
      }
      
      toast({
        title: "Parent Not Found",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSearchingParentNin(false)
    }
  }

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
      let studentsQuery: Query<DocumentData> = query(collection(db, "students"))

      if (currentSchoolId) {
        studentsQuery = query(collection(db, "students"), where("school_id", "==", currentSchoolId))
      }

      const querySnapshot = await getDocs(studentsQuery)

      // Sort students by created_at client-side
      const studentsList: Student[] = querySnapshot.docs.map((doc) => ({
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
        let classesQuery: Query<DocumentData> | CollectionReference<DocumentData> = collection(db, "classes")

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
            const schoolId = adminData.school_id || adminId
            
            // Get school stage from schools collection
            let schoolStage = ""
            if (schoolId) {
              const schoolsRef = collection(db, "schools")
              const schoolsQuery = query(schoolsRef, where("school_id", "==", schoolId))
              const schoolsSnapshot = await getDocs(schoolsQuery)
              
              if (!schoolsSnapshot.empty) {
                const schoolDoc = schoolsSnapshot.docs[0]
                const schoolData = schoolDoc.data()
                schoolStage = schoolData.stage || ""
              }
            }
            
            setSchoolStage(schoolStage)
            setFormData((prev) => ({
              ...prev,
              school_id: schoolId,
              schoolname: adminData.schoolName || "Holy Family Junior Secondary School",
            }))

            // Auto-generate admission number
            const currentYear = new Date().getFullYear().toString()
            const admissionNumber = await generateAdmissionNumber(schoolId, currentYear)
            setFormData((prev) => ({
              ...prev,
              adm_no: admissionNumber,
              batch: currentYear,
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
      let q: Query<DocumentData> = query(collection(db, "students"))

      if (schoolId) {
        q = query(collection(db, "students"), where("school_id", "==", schoolId))
      }

      const querySnapshot = await getDocs(q)

      // Sort students by created_at client-side
      const studentsList: Student[] = querySnapshot.docs.map((doc) => ({
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

  const checkForDuplicateStudent = async (studentData: any) => {
    try {
      const studentsRef = collection(db, "students")
      
      // Check by NIN first (if provided)
      if (studentData.nin && studentData.nin.trim()) {
        const ninQuery = query(studentsRef, where("nin", "==", studentData.nin.trim()))
        const ninSnapshot = await getDocs(ninQuery)
        
        if (!ninSnapshot.empty) {
          const duplicate = ninSnapshot.docs[0].data()
          setDuplicateStudent({
            ...duplicate,
            id: ninSnapshot.docs[0].id,
            reason: "NIN"
          })
          setIsDuplicateModalOpen(true)
          return true
        }
      }
      
      // Check by combination of name, dob, address, email (if NIN not provided)
      if (!studentData.nin || !studentData.nin.trim()) {
        const name = `${studentData.firstname} ${studentData.lastname}`.toLowerCase().trim()
        const dob = studentData.dob
        const address = studentData.homeaddress?.toLowerCase().trim()
        const email = studentData.emailaddress?.toLowerCase().trim()
        
        if (name && dob && address && email) {
          const allStudentsQuery = query(studentsRef)
          const allStudentsSnapshot = await getDocs(allStudentsQuery)
          
          for (const doc of allStudentsSnapshot.docs) {
            const existingStudent = doc.data()
            const existingName = `${existingStudent.firstname} ${existingStudent.lastname}`.toLowerCase().trim()
            const existingAddress = existingStudent.homeaddress?.toLowerCase().trim()
            const existingEmail = existingStudent.emailaddress?.toLowerCase().trim()
            
            if (existingName === name && 
                existingStudent.dob === dob && 
                existingAddress === address && 
                existingEmail === email) {
              setDuplicateStudent({
                ...existingStudent,
                id: doc.id,
                reason: "Personal Information"
              })
              setIsDuplicateModalOpen(true)
              return true
            }
          }
        }
      }
      
      return false
    } catch (error) {
      console.error("Error checking for duplicate student:", error)
      return false
    }
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
            description: "Failed to process passport picture, but student will be added",
            variant: "destructive",
          })
        }
      }

      // Add timestamp and metadata
      const currentDate = new Date()
      const studentData = {
        ...formData,
        ...schoolData, // Ensure school data is included
        id: studentId,
        parent_id: "", // Always blank for new students
        status: "Active",
        passport_picture: passportPictureUrl,
        created_at: Timestamp.fromDate(currentDate),
        date: currentDate.toLocaleDateString(),
        month: currentDate.toLocaleString("default", { month: "long" }),
        year: currentDate.getFullYear().toString(),
      }

      // Check for duplicate student before saving
      const isDuplicate = await checkForDuplicateStudent(studentData)
      if (isDuplicate) {
        setIsSubmitting(false)
        return
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
      
      // Trigger classes page refresh by setting a flag
      localStorage.setItem("refreshClasses", "true")

      // Reset form and close dialog
      const currentYear = new Date().getFullYear().toString()
      const admissionNumber = await generateAdmissionNumber(schoolId, currentYear)
      setFormData({
        id: "",
        batch: currentYear,
        school_id: schoolId,
        adm_no: admissionNumber,
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
        parent_id: "",
        disability_type: "",
        sick: "",
        sick_type: "",
        passport_picture: "",
      })
      
      // Reset passport picture state
      setPassportPicture(null)
      setPassportPicturePreview("")
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
        rows = parsed.data as any[]
      } else if (
        csvFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        csvFile.name.endsWith(".xlsx")
      ) {
        // Parse Excel file
        const data = await csvFile.arrayBuffer()
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = XLSX.utils.sheet_to_json(worksheet) as any[]
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
          if (!row.firstname || !row.lastname || !row.class) continue
          // Generate a unique ID if not present
          const studentId = row.adm_no || `ST${Date.now().toString().slice(-6)}`
          // Add timestamp and metadata
          const currentDate = new Date()
          const studentData = {
            ...row,
            id: studentId,
            status: "Active",
            created_at: Timestamp.fromDate(currentDate),
            date: currentDate.toLocaleDateString(),
            month: currentDate.toLocaleString("default", { month: "long" }),
            year: currentDate.getFullYear().toString(),
          }
          await setDoc(doc(db, "students", studentId), studentData)
          successCount++
        } catch (err) {
          errorCount++
        }
      }
      toast({
        title: "Upload Complete",
        description: `${successCount} students uploaded, ${errorCount} errors`,
        variant: errorCount > 0 ? "destructive" : "default",
      })
      setCsvFile(null)
      setIsAddStudentOpen(false)
      await refreshStudents()
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
      const updatedData: Student = {
        ...editFormData,
        school_id: editFormData.school_id || schoolId,
        schoolname: editFormData.schoolname || schoolName,
        updated_at: Timestamp.fromDate(new Date()),
      }

      await setDoc(doc(db, "students", selectedStudent!.id), updatedData)

      toast({
        title: "Success",
        description: "Student information updated successfully",
      })

      await refreshStudents()
      
      // Trigger classes page refresh by setting a flag
      localStorage.setItem("refreshClasses", "true")
      
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
      console.log('Searching for NIN:', ninSearchQuery)
      
      const response = await fetch('/api/nin-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nin: ninSearchQuery })
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: NIN not found`)
      }
      
      const data = await response.json()
      console.log('API response data:', data)
      
      // Check if the API returned valid data
      if (!data || !data.firstName || !data.lastName) {
        console.log('Invalid data structure:', data)
        throw new Error('Invalid NIN data received')
      }
      
      // Auto-populate form with NIN data
      setFormData((prev) => ({
        ...prev,
        firstname: data.firstName || prev.firstname,
        lastname: data.lastName || prev.lastname,
        dob: data.dateOfBirth || prev.dob,
        gender: data.gender || prev.gender,
        nationality: data.nationality || prev.nationality,
        homeaddress: data.address || prev.homeaddress,
        phonenumber: data.phoneNumber || prev.phonenumber,
        emailaddress: data.emailaddress || prev.emailaddress,
        level: data.level || prev.level,
        faculty: data.faculty || prev.faculty,
        nin: ninSearchQuery
      }))
      
      console.log('Form updated with NIN data')
      
      toast({
        title: "Success",
        description: `Student information retrieved for ${data.firstName} ${data.lastName}`,
      })
    } catch (error) {
      console.error('NIN search failed:', error)
      
      // Show specific error message based on the error
      let errorMessage = "NIN verification failed"
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = `NIN "${ninSearchQuery}" not found in the database`
        } else if (error.message.includes('Invalid NIN data')) {
          errorMessage = "Invalid data received from NIN database"
        } else if (error.message.includes('fetch')) {
          errorMessage = "Network error - please check your connection"
        }
      }
      
      toast({
        title: "NIN Not Found",
        description: errorMessage,
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

      // Prepare parent data (without student references)
      const currentDate = new Date()
      const parentData = {
        ...parentFormData,
        id: parentId,
        ...schoolData,
        status: "Active",
        created_at: Timestamp.fromDate(currentDate),
        date: currentDate.toLocaleDateString(),
        month: currentDate.toLocaleString("default", { month: "long" }),
        year: currentDate.getFullYear().toString(),
      }

      // Save to Firestore
      await setDoc(doc(db, "parents", parentId), parentData)

      // Update student record with parent information
      const studentRef = doc(db, "students", studentId)
      await updateDoc(studentRef, {
        parent_id: parentId,
        parent_name: `${parentFormData.firstname} ${parentFormData.lastname}`,
        parent_relationship: parentFormData.relationship_with_student || "Parent",
        parent_phone: parentFormData.phonenumber,
        parent_email: parentFormData.emailaddress
      })

      toast({
        title: "Success",
        description: `Parent added successfully for ${studentName}`,
      })

      // Refresh students list to show updated parent information
      await fetchStudents()

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
        ; (dialogCloseButton as HTMLElement).click()
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
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Manage Students</h1>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
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
                          <Input 
                            id="adm_no" 
                            value={formData.adm_no} 
                            readOnly 
                            className="bg-gray-50"
                            placeholder="Will be auto-generated"
                          />
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
                        {schoolStage === "Senior Secondary" && (
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
                        )}
                        <div>
                          <Label htmlFor="level">Level</Label>
                          <Select onValueChange={(value) => handleSelectChange("level", value)} value={formData.level}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              {getLevelOptions(schoolStage).map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              {nationalityOptions.map((option) => (
                                <SelectItem key={option.key} value={option.value}>
                                  {option.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="nin">NIN</Label>
                          <div className="flex gap-2">
                            <Input id="nin" value={formData.nin} onChange={handleInputChange} placeholder="Enter NIN to search" />
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => searchNINFromAPI(formData.nin)}
                              disabled={isSearchingNIN || !formData.nin}
                              className="whitespace-nowrap"
                            >
                              {isSearchingNIN ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                  Searching...
                                </>
                              ) : (
                                "Search by NIN"
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Test NINs: SL12345678, SL87654321, SL11223344, SL11112222, SL22223333
                          </p>
                          
                          {/* Available Student NINs */}
                          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                            <h4 className="text-sm font-medium text-purple-800 mb-2">Available Student NINs for Testing:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-purple-600">SL12345678</span>
                                <br />
                                <span className="text-gray-600">Fatmata Kamara</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-purple-600">SL87654321</span>
                                <br />
                                <span className="text-gray-600">Mohamed Sesay</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-purple-600">SL11223344</span>
                                <br />
                                <span className="text-gray-600">Aminata Bangura</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-purple-600">SL55667788</span>
                                <br />
                                <span className="text-gray-600">Ibrahim Koroma</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-purple-600">SL99887766</span>
                                <br />
                                <span className="text-gray-600">Mariama Turay</span>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <span className="font-mono text-purple-600">SL33445566</span>
                                <br />
                                <span className="text-gray-600">Alhaji Mansaray</span>
                              </div>
                            </div>
                            <p className="text-xs text-purple-600 mt-2">Click any NIN to copy to clipboard</p>
                          </div>
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
                          {isSubmitting ? "Submitting..." : "Add Student"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
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
                {classOptions.filter((c): c is string => !!c).map((classOption, index) => (
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
                  <TableHead>Photo</TableHead>
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
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.passport_picture} alt={`${student.firstname} ${student.lastname}`} />
                        <AvatarFallback className="text-xs">
                          {getStudentInitials(student.firstname || '', student.lastname || '')}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
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
                      {student.parent_name ? (
                        <div className="text-sm">
                          <span className="font-medium">{student.parent_name}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{student.parent_relationship || "Parent"}</span>
                        </div>
                      ) : (
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
                            {/* Search by NIN */}
                            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                              <h3 className="text-sm font-medium mb-2">Search by NIN</h3>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter parent NIN"
                                  value={parentNinSearchQuery}
                                  onChange={(e) => setParentNinSearchQuery(e.target.value)}
                                />
                                <Button variant="secondary" onClick={() => searchParentNINFromAPI(parentNinSearchQuery)} disabled={isSearchingParentNin}>
                                  {isSearchingParentNin ? (
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
                                Enter the parent's NIN to automatically fill the form with existing parent information
                              </p>
                              
                              {/* Available Parent NINs */}
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <h4 className="text-sm font-medium text-green-800 mb-2">Available Parent NINs for Testing:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  <div className="bg-white p-2 rounded border">
                                    <span className="font-mono text-green-600">PL12345678</span>
                                    <br />
                                    <span className="text-gray-600">Alhaji Koroma</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border">
                                    <span className="font-mono text-green-600">PL87654321</span>
                                    <br />
                                    <span className="text-gray-600">Fatmata Sesay</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border">
                                    <span className="font-mono text-green-600">PL11223344</span>
                                    <br />
                                    <span className="text-gray-600">Mohamed Bangura</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border">
                                    <span className="font-mono text-green-600">PL55667788</span>
                                    <br />
                                    <span className="text-gray-600">Aminata Turay</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border">
                                    <span className="font-mono text-green-600">PL99887766</span>
                                    <br />
                                    <span className="text-gray-600">Ibrahim Kamara</span>
                                  </div>
                                  <div className="bg-white p-2 rounded border">
                                    <span className="font-mono text-green-600">PL33445566</span>
                                    <br />
                                    <span className="text-gray-600">Hawa Conteh</span>
                                  </div>
                                </div>
                                <p className="text-xs text-green-600 mt-2">Click any NIN to copy to clipboard</p>
                              </div>
                            </div>

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
                      )}
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
                  <div>
                    <Label className="font-bold">Passport Picture</Label>
                    {selectedStudent.passport_picture ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={selectedStudent.passport_picture}
                          alt="Student passport"
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
                            {getStudentInitials(selectedStudent.firstname || '', selectedStudent.lastname || '')}
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

        {/* Duplicate Student Modal */}
        <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
          <DialogContent className="sm:max-w-[600px] w-[90%]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Duplicate Student Detected</DialogTitle>
              <DialogDescription>
                A student with the same {duplicateStudent?.reason === "NIN" ? "NIN" : "personal information"} already exists in the system.
              </DialogDescription>
            </DialogHeader>
            {duplicateStudent && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Existing Student Information:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Student ID</h4>
                      <p className="text-base font-medium">{duplicateStudent.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                      <p className="text-base font-medium">{`${duplicateStudent.firstname} ${duplicateStudent.lastname}`}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">School</h4>
                      <p className="text-base">{duplicateStudent.schoolname || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Class</h4>
                      <p className="text-base">{duplicateStudent.class || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Date of Birth</h4>
                      <p className="text-base">{duplicateStudent.dob || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                      <p className="text-base">{duplicateStudent.homeaddress || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                      <p className="text-base">{duplicateStudent.emailaddress || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">NIN</h4>
                      <p className="text-base">{duplicateStudent.nin || "N/A"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p><strong>Reason for detection:</strong> {duplicateStudent.reason === "NIN" ? 
                    "Same NIN number found in the system" : 
                    "Same name, date of birth, address, and email combination found"
                  }</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDuplicateModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
