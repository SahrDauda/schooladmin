"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, BookOpen, FileText } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, where, Timestamp, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentSchoolInfo } from "@/lib/school-utils"

interface TimetableEntry {
  id: string
  day: string
  start_time: string
  end_time: string
  subject: string
  type: "class" | "exam"
  date?: string
  teacher_id?: string
  room?: string
  examiner?: string
}

interface Teacher {
  id: string
  firstname: string
  lastname: string
}

interface Subject {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
  level?: string
  section?: string
}

interface SchoolStage {
  id: string
  name: string
  forms: Array<{
    id: string
    name: string
    level: string
    sections?: string[]
  }>
}

// Validation schemas
const timetableEntrySchema = z.object({
  class_id: z.string().min(1, "Class is required"),
  day: z.string().min(1, "Day is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  subject: z.string().min(1, "Subject is required"),
  teacher_id: z.string().optional(),
  room: z.string().optional(),
  type: z.enum(["class", "exam"]),
})

const examEntrySchema = z.object({
  class_id: z.string().min(1, "Class is required"),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  subject: z.string().min(1, "Subject is required"),
  room: z.string().optional(),
  examiner: z.string().optional(),
})

// Enhanced time periods based on the school template
const DEFAULT_TIME_PERIODS = [
  { start: "08:00", end: "08:20", label: "8:00 - 8:20", type: "devotion" },
  { start: "08:20", end: "08:30", label: "8:20 - 8:30", type: "break" },
  { start: "08:30", end: "09:15", label: "8:30AM - 9:15AM", type: "class", duration: "45MINUTES" },
  { start: "09:15", end: "10:00", label: "9:15AM - 10:00AM", type: "class", duration: "45MINUTES" },
  { start: "10:00", end: "10:45", label: "10:00AM - 10:45AM", type: "class", duration: "45MINUTES" },
  { start: "10:45", end: "11:30", label: "10:45AM - 11:30AM", type: "class", duration: "45MINUTES" },
  { start: "11:30", end: "12:00", label: "11:30 - 12:00PM", type: "break", duration: "30M" },
  { start: "12:00", end: "12:40", label: "12:00PM - 12:40PM", type: "class", duration: "40MINUTES" },
  { start: "12:40", end: "13:20", label: "12:40PM - 1:20PM", type: "class", duration: "40MINUTES" },
  { start: "13:20", end: "14:00", label: "1:20PM - 2:00PM", type: "class", duration: "40MINUTES" },
]

// Helper function to format time
const formatTime = (timeString: string) => {
  try {
    const [hours, minutes] = timeString.split(":")
    const time = new Date()
    time.setHours(Number.parseInt(hours, 10))
    time.setMinutes(Number.parseInt(minutes, 10))

    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch (error) {
    return timeString
  }
}

// Function to check if a time period is current
const isCurrentTimePeriod = (day: string, period: { start: string; end: string }) => {
  const now = new Date()
  const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]

  if (day !== currentDay) return false

  const [startHour, startMinute] = period.start.split(":").map(Number)
  const [endHour, endMinute] = period.end.split(":").map(Number)

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute
  const currentTime = currentHour * 60 + currentMinute

  return currentTime >= startTime && currentTime < endTime
}

// Define school stages with their respective forms
const SCHOOL_STAGES: SchoolStage[] = [
  {
    id: "primary",
    name: "Primary School",
    forms: [
      { id: "class-1", name: "Class 1", level: "1", sections: ["A", "B"] },
      { id: "class-2", name: "Class 2", level: "2", sections: ["A", "B"] },
      { id: "class-3", name: "Class 3", level: "3", sections: ["A", "B"] },
      { id: "class-4", name: "Class 4", level: "4", sections: ["A", "B"] },
      { id: "class-5", name: "Class 5", level: "5", sections: ["A", "B"] },
      { id: "class-6", name: "Class 6", level: "6", sections: ["A", "B"] },
    ],
  },
  {
    id: "junior-secondary",
    name: "Junior Secondary School",
    forms: [
      { id: "jss-1", name: "JSS 1", level: "JSS 1", sections: ["A", "B", "C"] },
      { id: "jss-2", name: "JSS 2", level: "JSS 2", sections: ["A", "B", "C"] },
      { id: "jss-3", name: "JSS 3", level: "JSS 3", sections: ["A", "B", "C"] },
    ],
  },
  {
    id: "senior-secondary",
    name: "Senior Secondary School",
    forms: [
      { id: "sss-1", name: "SSS 1", level: "SSS 1", sections: ["Science A", "Science B", "Arts A", "Arts B", "Commercial A", "Commercial B"] },
      { id: "sss-2", name: "SSS 2", level: "SSS 2", sections: ["Science A", "Science B", "Arts A", "Arts B", "Commercial A", "Commercial B"] },
      { id: "sss-3", name: "SSS 3", level: "SSS 3", sections: ["Science A", "Science B", "Arts A", "Arts B", "Commercial A", "Commercial B"] },
    ],
  },
]

export default function TimetablePage() {
  // State for tabs
  const [activeTab, setActiveTab] = useState("class")

  // State for school stages
  const [selectedStageId, setSelectedStageId] = useState("primary")
  const [selectedFormId, setSelectedFormId] = useState("")
  const [selectedSection, setSelectedSection] = useState("")

  // State for classes and teachers
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  // State for timetable entries
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])

  // State for selected class
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedClassName, setSelectedClassName] = useState("")

  // State for loading
  const [isLoading, setIsLoading] = useState(true)

  // State for dialogs
  const [isAddClassEntryOpen, setIsAddClassEntryOpen] = useState(false)
  const [isAddExamEntryOpen, setIsAddExamEntryOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  // State for school info
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "", stage: "" })

  // State for form data
  const [classTimetableFormData, setClassTimetableFormData] = useState({
    class_id: "",
    day: "",
    start_time: "",
    end_time: "",
    subject: "",
    teacher_id: "",
    room: "",
    type: "class" as const,
    school_id: "",
    schoolname: "",
  })

  const [examTimetableFormData, setExamTimetableFormData] = useState({
    class_id: "",
    date: "",
    start_time: "",
    end_time: "",
    subject: "",
    room: "",
    examiner: "",
    type: "exam" as const,
    school_id: "",
    schoolname: "",
  })

  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Derived values for current form selection
  const currentStage = SCHOOL_STAGES.find(stage => stage.id === selectedStageId)
  const currentForm = currentStage?.forms.find(form => form.id === selectedFormId)
  const currentFormDisplay = currentForm ? `${currentForm.name}${selectedSection ? ` ${selectedSection}` : ''}` : ''

  // Set default form selection when stage changes
  useEffect(() => {
    if (selectedStageId) {
      const stage = SCHOOL_STAGES.find(s => s.id === selectedStageId)
      if (stage && stage.forms.length > 0 && !selectedFormId) {
        setSelectedFormId(stage.forms[0].id)
      }
    }
  }, [selectedStageId, selectedFormId])

  // Set default section when form changes
  useEffect(() => {
    if (selectedFormId) {
      const stage = SCHOOL_STAGES.find(s => s.id === selectedStageId)
      const form = stage?.forms.find(f => f.id === selectedFormId)
      if (form && form.sections && form.sections.length > 0 && !selectedSection) {
        setSelectedSection(form.sections[0])
      }
    }
  }, [selectedStageId, selectedFormId, selectedSection])

  // Create or find matching class when form/section is selected
  useEffect(() => {
    if (selectedFormId && currentForm && schoolInfo.school_id) {
      const classIdentifier = selectedSection ? 
        `${currentForm.level}_${selectedSection}` : 
        currentForm.level
      
      // Try to find existing class
      const existingClass = classes.find(cls => 
        cls.name === currentForm.name && 
        cls.level === currentForm.level &&
        (selectedSection ? cls.section === selectedSection : !cls.section)
      )

      if (existingClass) {
        setSelectedClassId(existingClass.id)
        setSelectedClassName(`${currentForm.name}${selectedSection ? ` ${selectedSection}` : ''}`)
        setClassTimetableFormData((prev) => ({ ...prev, class_id: existingClass.id }))
        setExamTimetableFormData((prev) => ({ ...prev, class_id: existingClass.id }))
      } else {
        // Create virtual class ID for timetable purposes
        const virtualClassId = `${selectedStageId}_${selectedFormId}${selectedSection ? `_${selectedSection}` : ''}`
        setSelectedClassId(virtualClassId)
        setSelectedClassName(currentFormDisplay)
        setClassTimetableFormData((prev) => ({ ...prev, class_id: virtualClassId }))
        setExamTimetableFormData((prev) => ({ ...prev, class_id: virtualClassId }))
      }
    }
  }, [selectedFormId, selectedSection, currentForm, classes, schoolInfo.school_id])

  useEffect(() => {
    const loadSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      setSchoolInfo(info)
      setClassTimetableFormData((prev) => ({ ...prev, school_id: info.school_id, schoolname: info.schoolName }))
      setExamTimetableFormData((prev) => ({ ...prev, school_id: info.school_id, schoolname: info.schoolName }))
    }

    loadSchoolInfo()
  }, [])

  // Fetch classes, teachers, and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolInfo.school_id) return

      setIsLoading(true)
      try {
        // Fetch classes
        const classesRef = collection(db, "classes")
        const classesQuery = query(classesRef, where("school_id", "==", schoolInfo.school_id))
        const classesSnapshot = await getDocs(classesQuery)
        const classesList: Class[] = classesSnapshot.docs.map(
          (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Class),
        )
        // Sort classes client-side
        classesList.sort((a, b) => a.name.localeCompare(b.name))
        setClasses(classesList)

        // Fetch teachers
        const teachersRef = collection(db, "teachers")
        const teachersQuery = query(teachersRef, where("school_id", "==", schoolInfo.school_id))
        const teachersSnapshot = await getDocs(teachersQuery)
        const teachersList: Teacher[] = teachersSnapshot.docs.map(
          (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Teacher),
        )
        // Sort teachers client-side
        teachersList.sort((a, b) => a.lastname.localeCompare(b.lastname))
        setTeachers(teachersList)

        // Fetch subjects
        const subjectsRef = collection(db, "subjects")
        const subjectsQuery = query(subjectsRef, where("school_id", "==", schoolInfo.school_id))
        const subjectsSnapshot = await getDocs(subjectsQuery)
        const subjectsList: Subject[] = subjectsSnapshot.docs.map(
          (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Subject),
        )
        subjectsList.sort((a, b) => a.name.localeCompare(b.name))
        setSubjects(subjectsList)

        // Set default selected class if available
        if (classesList.length > 0 && !selectedClassId) {
          setSelectedClassId(classesList[0].id)
          setSelectedClassName(classesList[0].name)
          setClassTimetableFormData((prev) => ({ ...prev, class_id: classesList[0].id }))
          setExamTimetableFormData((prev) => ({ ...prev, class_id: classesList[0].id }))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (schoolInfo.school_id) {
      fetchData()
    }
  }, [schoolInfo.school_id])

  // Fetch all timetable entries when school info is available
  useEffect(() => {
    if (schoolInfo.school_id) {
      fetchAllTimetableEntries()
    }
  }, [schoolInfo.school_id])

  // Fetch all timetable entries for the school
  const fetchAllTimetableEntries = async () => {
    if (!schoolInfo.school_id) return

    setIsLoading(true)
    try {
      // Fetch all class timetable entries for the school
      const classTimetableRef = collection(db, "timetable")
      const classTimetableQuery = query(
        classTimetableRef,
        where("school_id", "==", schoolInfo.school_id),
        where("type", "==", "class"),
      )
      const classTimetableSnapshot = await getDocs(classTimetableQuery)
      const classTimetableList = classTimetableSnapshot.docs.map(
        (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as TimetableEntry),
      )

      // Fetch all exam timetable entries for the school
      const examTimetableRef = collection(db, "timetable")
      const examTimetableQuery = query(
        examTimetableRef,
        where("school_id", "==", schoolInfo.school_id),
        where("type", "==", "exam"),
      )
      const examTimetableSnapshot = await getDocs(examTimetableQuery)
      const examTimetableList = examTimetableSnapshot.docs.map(
        (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as TimetableEntry),
      )

      setTimetableEntries([...classTimetableList, ...examTimetableList])
    } catch (error) {
      console.error("Error fetching timetable entries:", error)
      toast({
        title: "Error",
        description: "Failed to load timetable entries",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle class selection
  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find((c) => c.id === classId)
    setSelectedClassId(classId)
    setSelectedClassName(selectedClass?.name || "")
    setClassTimetableFormData((prev) => ({ ...prev, class_id: classId }))
    setExamTimetableFormData((prev) => ({ ...prev, class_id: classId }))
  }

  // Handle form input changes
  const handleClassTimetableInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setClassTimetableFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleExamTimetableInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setExamTimetableFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleClassTimetableSelectChange = (field: string, value: string) => {
    setClassTimetableFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleExamTimetableSelectChange = (field: string, value: string) => {
    setExamTimetableFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Submit class timetable entry
  const handleSubmitClassTimetable = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      timetableEntrySchema.parse(classTimetableFormData)

      // Generate a unique ID
      const entryId = `TT_${Date.now().toString().slice(-6)}`

      // Add timestamp and metadata
      const currentDate = new Date()
      const entryData = {
        ...classTimetableFormData,
        id: entryId,
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
        created_at: Timestamp.fromDate(currentDate),
      }

      // Save to Firestore
      await setDoc(doc(db, "timetable", entryId), entryData)

      // Show success message
      toast({
        title: "Success",
        description: "Timetable entry added successfully",
      })

      // Refresh timetable entries
      fetchAllTimetableEntries()

      // Reset form and close dialog
      setClassTimetableFormData({
        class_id: selectedClassId,
        day: "",
        start_time: "",
        end_time: "",
        subject: "",
        teacher_id: "",
        room: "",
        type: "class",
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
      })
      setIsAddClassEntryOpen(false)
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        })
      } else {
        console.error("Error adding timetable entry:", error)
        toast({
          title: "Error",
          description: "Failed to add timetable entry. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit exam timetable entry
  const handleSubmitExamTimetable = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      examEntrySchema.parse(examTimetableFormData)

      // Generate a unique ID
      const entryId = `EX_${Date.now().toString().slice(-6)}`

      // Add timestamp and metadata
      const currentDate = new Date()
      const entryData = {
        ...examTimetableFormData,
        id: entryId,
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
        created_at: Timestamp.fromDate(currentDate),
        type: "exam",
      }

      // Save to Firestore
      await setDoc(doc(db, "timetable", entryId), entryData)

      // Show success message
      toast({
        title: "Success",
        description: "Exam timetable entry added successfully",
      })

      // Refresh timetable entries
      fetchAllTimetableEntries()

      // Reset form and close dialog
      setExamTimetableFormData({
        class_id: selectedClassId,
        date: "",
        start_time: "",
        end_time: "",
        subject: "",
        room: "",
        examiner: "",
        type: "exam",
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
      })
      setIsAddExamEntryOpen(false)
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        })
      } else {
        console.error("Error adding exam timetable entry:", error)
        toast({
          title: "Error",
          description: "Failed to add exam timetable entry. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete timetable entry
  const handleDeleteEntry = async (entryId: string) => {
    if (confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "timetable", entryId))

        toast({
          title: "Success",
          description: "Entry deleted successfully",
        })

        fetchTimetableEntries(selectedClassId)
      } catch (error) {
        console.error("Error deleting entry:", error)
        toast({
          title: "Error",
          description: "Failed to delete entry",
          variant: "destructive",
        })
      }
    }
  }

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Not Assigned"
  }

  // Group class timetable entries by day
  const groupedByDay = timetableEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = []
      }
      acc[entry.day].push(entry)
      return acc
    },
    {} as Record<string, TimetableEntry[]>,
  )

  // Days of the week in order
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Get form range based on school stage
  const getFormRange = (stage: string) => {
    switch (stage) {
      case "primary":
        return "Primary 1 - 6"
      case "junior-secondary":
        return "JSS 1 - 3"
      case "senior-secondary":
        return "SSS 1 - 3"
      default:
        return "All Classes"
    }
  }

  // Add a new function to handle adding a new entry from the draft timetable
  const handleAddFromDraft = (day: string, period: { start: string; end: string }) => {
    setClassTimetableFormData({
      ...classTimetableFormData,
      day,
      start_time: period.start,
      end_time: period.end,
      school_id: schoolInfo.school_id,
      schoolname: schoolInfo.schoolName,
    })
    setIsAddClassEntryOpen(true)
  }

  // Add a new function to handle adding a new exam entry from the draft timetable
  const handleAddExamFromDraft = (day: string, period: { start: string; end: string }) => {
    // Get current date in YYYY-MM-DD format
    const today = new Date()
    const formattedDate = today.toISOString().split("T")[0]

    setExamTimetableFormData({
      ...examTimetableFormData,
      date: formattedDate,
      start_time: period.start,
      end_time: period.end,
      school_id: schoolInfo.school_id,
      schoolname: schoolInfo.schoolName,
    })
    setIsAddExamEntryOpen(true)
  }

  const getDayOrder = (day: string) => {
    const order = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }
    return order[day as keyof typeof order] || 8
  }

  const sortedClassTimetable = timetableEntries
    .filter((entry) => entry.type === "class")
    .sort((a, b) => {
      const dayOrderA = getDayOrder(a.day)
      const dayOrderB = getDayOrder(b.day)
      if (dayOrderA !== dayOrderB) {
        return dayOrderA - dayOrderB
      }
      return a.start_time.localeCompare(b.start_time)
    })

  const sortedExamTimetable = timetableEntries
    .filter((entry) => entry.type === "exam")
    .sort((a, b) => {
      if (a.date && b.date) {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
      }
      return a.start_time.localeCompare(b.start_time)
    })

  // Group timetable by day
  const groupedTimetable = sortedClassTimetable.reduce(
    (acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = []
      }
      acc[entry.day].push(entry)
      return acc
    },
    {} as Record<string, TimetableEntry[]>,
  )

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Master Timetable - All Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="class" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="class" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Class Timetable</span>
                </TabsTrigger>
                <TabsTrigger value="exam" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Exam Timetable</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="class">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !selectedFormId ? (
                  <div className="text-center py-8 text-muted-foreground">Please select a form to view timetable.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table className="border">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Day</TableHead>
                            <TableHead className="w-[120px]">Form</TableHead>
                            {DEFAULT_TIME_PERIODS.filter(p => p.type === "class").map((period) => (
                              <TableHead key={`${period.start}-${period.end}`} className="text-center min-w-[120px]">
                                {formatTime(period.start)}<br />-<br />{formatTime(period.end)}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daysOfWeek.slice(0, 5).map((day) => (
                            <TableRow key={day}>
                              <TableCell className="font-medium">{day}</TableCell>
                              <TableCell className="font-medium text-sm">
                                {schoolInfo.stage ? getFormRange(schoolInfo.stage) : "All Classes"}
                              </TableCell>
                              {DEFAULT_TIME_PERIODS.filter(p => p.type === "class").map((period) => {
                                // Find if there's an entry for this day and time period
                                const entry = sortedClassTimetable.find(
                                  (e) => e.day === day && e.start_time === period.start && e.end_time === period.end,
                                )

                                return (
                                  <TableCell key={`${day}-${period.start}-${period.end}`} className="h-16 align-middle text-center">
                                    {entry ? (
                                      <div className="p-1 bg-gray-50 rounded-md border border-gray-200 text-xs">
                                        <div className="font-medium">{entry.subject}</div>
                                        <div className="text-muted-foreground truncate">
                                          {entry.teacher_id ? getTeacherName(entry.teacher_id) : "Not Assigned"}
                                        </div>
                                        <div className="text-muted-foreground">{entry.room || "N/A"}</div>
                                        <div className="mt-1 flex justify-center">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4"
                                            onClick={() => handleDeleteEntry(entry.id)}
                                          >
                                            <Trash2 className="h-2 w-2" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-full flex items-center justify-center"
                                        onClick={() => handleAddFromDraft(day, period)}
                                      >
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                        <span className="sr-only">
                                          Add {day} {period.start} class
                                        </span>
                                      </Button>
                                    )}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="exam">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !selectedClassId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Please select a class to view exam timetable.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedExamTimetable.length === 0 ? (
                      <div className="text-center py-2 text-muted-foreground">
                        No exam timetable entries found for this class. Use the draft timetable below to add exams.
                      </div>
                    ) : null}
                    <div className="overflow-x-auto">
                      <Table className="border">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Time</TableHead>
                            {daysOfWeek.slice(0, 5).map((day) => (
                              <TableHead key={day}>{day}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DEFAULT_TIME_PERIODS.map((period) => (
                            <TableRow key={`${period.start}-${period.end}`}>
                              <TableCell className="font-medium">
                                {formatTime(period.start)} - {formatTime(period.end)}
                              </TableCell>
                              {daysOfWeek.slice(0, 5).map((day) => {
                                // Find if there's an exam entry for this day and time period
                                // For exams, we need to check if there's an entry with the same time period
                                // but we don't have a direct day field for exams, so we'll need to check
                                // if there's an exam scheduled for the current day
                                const today = new Date()
                                const dayIndex = daysOfWeek.indexOf(day)

                                // Calculate the date for this day of the week
                                const targetDate = new Date(today)
                                const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1 // Convert Sunday (0) to 6
                                const daysToAdd = (dayIndex - currentDayIndex + 7) % 7
                                targetDate.setDate(today.getDate() + daysToAdd)

                                // Format date as YYYY-MM-DD
                                const formattedDate = targetDate.toISOString().split("T")[0]

                                // Find exam entry for this date and time period
                                const entry = sortedExamTimetable.find(
                                  (e) =>
                                    e.date === formattedDate &&
                                    e.start_time === period.start &&
                                    e.end_time === period.end,
                                )

                                return (
                                  <TableCell key={day} className="h-16 align-middle">
                                    {entry ? (
                                      <div className="p-1 bg-amber-50 rounded-md border border-amber-100">
                                        <div className="font-medium text-sm">{entry.subject}</div>
                                        <div className="text-xs text-muted-foreground flex justify-between">
                                          <span>{entry.examiner || "Not Assigned"}</span>
                                          <span>{entry.room || "N/A"}</span>
                                        </div>
                                        <div className="mt-1 flex justify-end">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => handleDeleteEntry(entry.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-full flex items-center justify-center"
                                        onClick={() => handleAddExamFromDraft(day, period)}
                                      >
                                        <Plus className="h-5 w-5 text-muted-foreground" />
                                        <span className="sr-only">
                                          Add {day} {period.start} exam
                                        </span>
                                      </Button>
                                    )}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Class Timetable Dialog */}
        <Dialog open={isAddClassEntryOpen} onOpenChange={setIsAddClassEntryOpen}>
          <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Class Timetable Entry</DialogTitle>
              <DialogDescription>Add a new entry to the class timetable for {selectedClassName}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitClassTimetable} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="day">Day</Label>
                  <Select
                    value={classTimetableFormData.day}
                    onValueChange={(value) => handleClassTimetableSelectChange("day", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={classTimetableFormData.subject}
                    onValueChange={(value) => handleClassTimetableSelectChange("subject", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={classTimetableFormData.start_time}
                    onChange={handleClassTimetableInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={classTimetableFormData.end_time}
                    onChange={handleClassTimetableInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <Select
                    value={classTimetableFormData.teacher_id}
                    onValueChange={(value) => handleClassTimetableSelectChange("teacher_id", value)}
                  >
                    <SelectTrigger className="w-full">
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
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input id="room" value={classTimetableFormData.room} onChange={handleClassTimetableInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Add Entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Exam Timetable Dialog */}
        <Dialog open={isAddExamEntryOpen} onOpenChange={setIsAddExamEntryOpen}>
          <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Exam Timetable Entry</DialogTitle>
              <DialogDescription>Add a new entry to the exam timetable for {selectedClassName}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitExamTimetable} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={examTimetableFormData.date}
                    onChange={handleExamTimetableInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={examTimetableFormData.subject}
                    onValueChange={(value) => handleExamTimetableSelectChange("subject", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={examTimetableFormData.start_time}
                    onChange={handleExamTimetableInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={examTimetableFormData.end_time}
                    onChange={handleExamTimetableInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="examiner">Examiner</Label>
                  <Input id="examiner" value={examTimetableFormData.examiner} onChange={handleExamTimetableInputChange} />
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input id="room" value={examTimetableFormData.room} onChange={handleExamTimetableInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Add Entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
