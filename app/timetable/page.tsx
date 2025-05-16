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
import { Calendar, Clock, Plus, Trash2, BookOpen, FileText } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, where, orderBy, Timestamp, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

// Default time periods for class timetable
const DEFAULT_TIME_PERIODS = [
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
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

export default function TimetablePage() {
  // State for tabs
  const [activeTab, setActiveTab] = useState("class")

  // State for classes and teachers
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  // State for timetable entries
  const [classTimetableEntries, setClassTimetableEntries] = useState<any[]>([])
  const [examTimetableEntries, setExamTimetableEntries] = useState<any[]>([])

  // State for selected class
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedClassName, setSelectedClassName] = useState("")

  // State for loading
  const [isLoading, setIsLoading] = useState(true)

  // State for dialogs
  const [isAddClassEntryOpen, setIsAddClassEntryOpen] = useState(false)
  const [isAddExamEntryOpen, setIsAddExamEntryOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

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
  })

  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch classes and teachers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch classes
        const classesRef = collection(db, "classes")
        const classesQuery = query(classesRef, orderBy("name", "asc"))
        const classesSnapshot = await getDocs(classesQuery)
        const classesList = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setClasses(classesList)

        // Fetch teachers
        const teachersRef = collection(db, "teachers")
        const teachersQuery = query(teachersRef, orderBy("lastname", "asc"))
        const teachersSnapshot = await getDocs(teachersQuery)
        const teachersList = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setTeachers(teachersList)

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

    fetchData()
  }, [])

  // Fetch timetable entries when selected class changes
  useEffect(() => {
    if (selectedClassId) {
      fetchTimetableEntries(selectedClassId)
    }
  }, [selectedClassId])

  // Fetch timetable entries
  const fetchTimetableEntries = async (classId: string) => {
    setIsLoading(true)
    try {
      // Fetch class timetable entries
      const classTimetableRef = collection(db, "timetable")
      const classTimetableQuery = query(
        classTimetableRef,
        where("class_id", "==", classId),
        where("type", "==", "class"),
        orderBy("day", "asc"),
        orderBy("start_time", "asc"),
      )
      const classTimetableSnapshot = await getDocs(classTimetableQuery)
      const classTimetableList = classTimetableSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setClassTimetableEntries(classTimetableList)

      // Fetch exam timetable entries
      const examTimetableRef = collection(db, "timetable")
      const examTimetableQuery = query(
        examTimetableRef,
        where("class_id", "==", classId),
        where("type", "==", "exam"),
        orderBy("date", "asc"),
        orderBy("start_time", "asc"),
      )
      const examTimetableSnapshot = await getDocs(examTimetableQuery)
      const examTimetableList = examTimetableSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setExamTimetableEntries(examTimetableList)
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
      fetchTimetableEntries(selectedClassId)

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
      fetchTimetableEntries(selectedClassId)

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
  const groupedByDay = classTimetableEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = []
      }
      acc[entry.day].push(entry)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Days of the week in order
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Add a new function to handle adding a new entry from the draft timetable
  const handleAddFromDraft = (day: string, period: { start: string; end: string }) => {
    setClassTimetableFormData({
      ...classTimetableFormData,
      day,
      start_time: period.start,
      end_time: period.end,
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
    })
    setIsAddExamEntryOpen(true)
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Timetable</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} - {cls.level} {cls.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              ) : !selectedClassId ? (
                <div className="text-center py-8 text-muted-foreground">Please select a class to view timetable.</div>
              ) : classTimetableEntries.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-2 text-muted-foreground">
                    No timetable entries found for this class. Use the draft timetable below to add subjects.
                  </div>
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
                            {daysOfWeek.slice(0, 5).map((day) => (
                              <TableCell key={day} className="h-16 align-middle">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full h-full flex items-center justify-center"
                                  onClick={() => handleAddFromDraft(day, period)}
                                >
                                  <Plus className="h-5 w-5 text-muted-foreground" />
                                  <span className="sr-only">
                                    Add {day} {period.start} class
                                  </span>
                                </Button>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
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
                              // Find if there's an entry for this day and time period
                              const entry = classTimetableEntries.find(
                                (e) => e.day === day && e.start_time === period.start && e.end_time === period.end,
                              )

                              return (
                                <TableCell
                                  key={day}
                                  className={`h-16 align-middle ${isCurrentTimePeriod(day, period) ? "bg-yellow-50" : ""}`}
                                >
                                  {entry ? (
                                    <div className="p-1 bg-blue-50 rounded-md border border-blue-100">
                                      <div className="font-medium text-sm">{entry.subject}</div>
                                      <div className="text-xs text-muted-foreground flex justify-between">
                                        <span>
                                          {entry.teacher_id ? getTeacherName(entry.teacher_id) : "Not Assigned"}
                                        </span>
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
                                      onClick={() => handleAddFromDraft(day, period)}
                                    >
                                      <Plus className="h-5 w-5 text-muted-foreground" />
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
                  {examTimetableEntries.length === 0 ? (
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
                              const entry = examTimetableEntries.find(
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

                  {examTimetableEntries.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Upcoming Exams</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Examiner</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {examTimetableEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{entry.date}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {entry.start_time} - {entry.end_time}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{entry.subject}</TableCell>
                              <TableCell>{entry.room || "N/A"}</TableCell>
                              <TableCell>{entry.examiner || "N/A"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
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
                <Input id="subject" value={classTimetableFormData.subject} onChange={handleClassTimetableInputChange} />
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
                    <SelectItem value="not_assigned">Not Assigned</SelectItem>
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
                <Input id="subject" value={examTimetableFormData.subject} onChange={handleExamTimetableInputChange} />
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
    </DashboardLayout>
  )
}
