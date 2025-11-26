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
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Subject {
  id: string
  name: string
  code: string
  department?: string
  description?: string
  level?: string
  assigned_teacher?: string | null
  assigned_teacher_name?: string | null
  created_at?: string
  updated_at?: string
}

interface Department {
  id: string
  name: string
  school_id: string
  schoolname: string
  created_at?: string
  updated_at?: string
}

interface Teacher {
  id: string
  firstname?: string
  lastname?: string
  name?: string
  email?: string
  school_id?: string
}

// Validation schema
const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  department: z.string().optional(),
  description: z.string().optional(),
  level: z.string().optional(),
})

// Stage-specific level options
const getLevelOptions = (stage: string) => {
  switch (stage) {
    case "Primary":
      return [
        "All",
        "Prep 1",
        "Prep 2",
        "Prep 3",
        "Prep 4",
        "Prep 5",
        "Prep 6"
      ]
    case "Junior Secondary":
      return [
        "All",
        "JSS 1",
        "JSS 2",
        "JSS 3"
      ]
    case "Senior Secondary":
      return [
        "All",
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

export default function SubjectsPage() {
  // State for subjects
  const [subjects, setSubjects] = useState<Subject[]>([])

  // State for departments
  const [departments, setDepartments] = useState<Department[]>([])

  // State for teachers
  const [teachers, setTeachers] = useState<Teacher[]>([])

  // State for loading
  const [isLoading, setIsLoading] = useState(true)

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")

  // State for department dialogs
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] = useState(false)
  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    school_id: "",
    schoolname: "",
  })
  const [isSubmittingDepartment, setIsSubmittingDepartment] = useState(false)

  // State for school info
  const [schoolInfo, setSchoolInfo] = useState<{ school_id: string; schoolName: string; stage?: string }>({ school_id: "", schoolName: "", stage: "" })

  // State for form data
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "",
    description: "",
    level: "",
    school_id: "",
    schoolname: "",
  })

  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for search
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectCodeSearchQuery, setSubjectCodeSearchQuery] = useState("")
  const [isSearchingSubjectCode, setIsSearchingSubjectCode] = useState(false)

  // State for filter
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")

  // Load school info
  useEffect(() => {
    const loadSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      console.log("🏫 School info loaded:", info)

      setSchoolInfo(info)
      setFormData((prev) => ({ ...prev, school_id: info.school_id, schoolname: info.schoolName }))
    }

    loadSchoolInfo()
  }, [])

  // Fetch subjects and departments
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolInfo.school_id) return

      setIsLoading(true)
      try {
        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', schoolInfo.school_id)
          .order('name')

        if (subjectsError) throw subjectsError
        setSubjects(subjectsData || [])

        // Fetch departments (only for Senior Secondary)
        if (schoolInfo.stage === "Senior Secondary") {
          const { data: departmentsData, error: departmentsError } = await supabase
            .from('departments')
            .select('*')
            .eq('school_id', schoolInfo.school_id)
            .order('name')

          if (departmentsError) throw departmentsError
          setDepartments(departmentsData || [])
        }

        // Fetch teachers
        const { data: teachersData, error: teachersError } = await supabase
          .from('teachers')
          .select('*')
          .eq('school_id', schoolInfo.school_id)
          .order('firstname')

        if (teachersError) throw teachersError
        setTeachers(teachersData || [])

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
  }, [schoolInfo.school_id, schoolInfo.stage])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Generate subject code
  const generateSubjectCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'

    let code = ''
    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }

    setFormData((prev) => ({ ...prev, code }))
  }

  // Search subject by code
  const searchSubjectByCode = async () => {
    if (!subjectCodeSearchQuery) {
      toast({
        title: "Error",
        description: "Please enter a subject code to search",
        variant: "destructive",
      })
      return
    }

    setIsSearchingSubjectCode(true)
    try {
      console.log('Searching for subject code:', subjectCodeSearchQuery)

      // Search in the local subjects array
      const foundSubject = subjects.find(subject =>
        subject.code.toLowerCase() === subjectCodeSearchQuery.toLowerCase()
      )

      if (foundSubject) {
        // Auto-populate form with subject data
        setFormData((prev) => ({
          ...prev,
          name: foundSubject.name || prev.name,
          code: foundSubject.code || prev.code,
          department: foundSubject.department || prev.department,
          description: foundSubject.description || prev.description,
          level: foundSubject.level || prev.level,
        }))

        console.log('Form updated with subject data')

        toast({
          title: "Success",
          description: `Subject information retrieved for ${foundSubject.name}`,
        })
      } else {
        throw new Error('Subject not found')
      }
    } catch (error) {
      console.error('Subject search failed:', error)

      let errorMessage = "Subject search failed"
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          errorMessage = `Subject code "${subjectCodeSearchQuery}" not found in the database`
        }
      }

      toast({
        title: "Subject Not Found",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSearchingSubjectCode(false)
    }
  }

  // Handle department form input changes
  const handleDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setDepartmentFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Open add department dialog
  const handleOpenAddDepartmentDialog = () => {
    setDepartmentFormData({
      name: "",
      school_id: schoolInfo.school_id,
      schoolname: schoolInfo.schoolName,
    })
    setIsAddDepartmentDialogOpen(true)
  }

  // Submit department form
  const handleSubmitDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingDepartment(true)

    try {
      const departmentData = {
        ...departmentFormData,
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
      }

      const { data, error } = await supabase
        .from('departments')
        .insert(departmentData)
        .select()
        .single()

      if (error) throw error

      // Show success message
      toast({
        title: "Success",
        description: "Department added successfully",
      })

      // Refresh departments list
      if (data) {
        const updatedDepartments = [...departments, data]
        updatedDepartments.sort((a, b) => a.name.localeCompare(b.name))
        setDepartments(updatedDepartments)
      }

      // Reset form and close dialog
      setDepartmentFormData({
        name: "",
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
      })
      setIsAddDepartmentDialogOpen(false)
    } catch (error) {
      console.error("Error saving department:", error)
      toast({
        title: "Error",
        description: "Failed to save department. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingDepartment(false)
    }
  }

  // Open add dialog
  const handleOpenAddDialog = () => {
    setFormData({
      name: "",
      code: "",
      department: "",
      description: "",
      level: "",
      school_id: schoolInfo.school_id,
      schoolname: schoolInfo.schoolName,
    })
    setIsAddDialogOpen(true)
  }

  // Open details dialog
  const handleOpenDetailsDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDetailsDialogOpen(true)
  }

  // Open edit dialog from details modal
  const handleOpenEditDialog = () => {
    if (!selectedSubject) return

    setFormData({
      name: selectedSubject.name || "",
      code: selectedSubject.code || "",
      department: selectedSubject.department || "",
      description: selectedSubject.description || "",
      level: selectedSubject.level || "",
      school_id: schoolInfo.school_id,
      schoolname: schoolInfo.schoolName,
    })
    setIsDetailsDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      subjectSchema.parse(formData)

      const subjectData = {
        ...formData,
        school_id: schoolInfo.school_id,
        // schoolname: schoolInfo.schoolName, // Not needed if not in schema, but kept for compatibility if needed
      }

      let data, error

      if (selectedSubject) {
        // Update existing subject
        const result = await supabase
          .from('subjects')
          .update({ ...subjectData, updated_at: new Date().toISOString() })
          .eq('id', selectedSubject.id)
          .select()
          .single()

        data = result.data
        error = result.error
      } else {
        // Create new subject
        const result = await supabase
          .from('subjects')
          .insert(subjectData)
          .select()
          .single()

        data = result.data
        error = result.error
      }

      if (error) throw error

      // Show success message
      toast({
        title: "Success",
        description: `Subject ${selectedSubject ? "updated" : "added"} successfully`,
      })

      // Refresh subjects list
      if (data) {
        const updatedSubjects = selectedSubject
          ? subjects.map(s => s.id === selectedSubject.id ? data : s)
          : [...subjects, data]

        updatedSubjects.sort((a, b) => a.name.localeCompare(b.name))
        setSubjects(updatedSubjects)
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        code: "",
        department: "",
        description: "",
        level: "",
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
      })
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      setSelectedSubject(null)
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        })
      } else {
        console.error("Error saving subject:", error)
        toast({
          title: "Error",
          description: "Failed to save subject. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete subject
  const handleDelete = async () => {
    if (!selectedSubject) return

    if (confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      try {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', selectedSubject.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Subject deleted successfully",
        })

        // Update local state
        setSubjects(subjects.filter((subject) => subject.id !== selectedSubject.id))
        setIsDetailsDialogOpen(false)
        setSelectedSubject(null)
      } catch (error) {
        console.error("Error deleting subject:", error)
        toast({
          title: "Error",
          description: "Failed to delete subject",
          variant: "destructive",
        })
      }
    }
  }

  const handleOpenAssignTeacherDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setSelectedTeacher(subject.assigned_teacher || "")
    setIsAssignTeacherDialogOpen(true)
  }

  const handleAssignTeacher = async () => {
    if (!selectedSubject || !selectedTeacher) return

    try {
      const teacher = teachers.find(t => t.id === selectedTeacher)
      if (!teacher) {
        toast({
          title: "Error",
          description: "Selected teacher not found",
          variant: "destructive",
        })
        return
      }

      const teacherName = teacher.firstname && teacher.lastname
        ? `${teacher.firstname} ${teacher.lastname}`
        : teacher.name || "Teacher"
      const teacherEmail = teacher.email || ""

      // Update subject with assigned teacher
      const { error: subjectError } = await supabase
        .from('subjects')
        .update({
          assigned_teacher: selectedTeacher,
          assigned_teacher_name: teacherName,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubject.id)

      if (subjectError) throw subjectError

      // Update teacher document with assigned subject
      // Note: This overwrites any previous subject assignment for the teacher, matching previous logic
      const { error: teacherError } = await supabase
        .from('teachers')
        .update({
          subject: selectedSubject.name,
          subject_id: selectedSubject.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTeacher)

      if (teacherError) throw teacherError

      // Send notification to teacher
      try {
        const { sendTeacherSubjectAssignmentNotification } = await import("@/lib/notification-utils")
        await sendTeacherSubjectAssignmentNotification(
          selectedTeacher,
          teacherName,
          teacherEmail,
          selectedSubject.name,
          selectedSubject.code,
          schoolInfo.school_id
        )
      } catch (error) {
        console.error("Error sending teacher notification:", error)
        // Don't fail the assignment if notification fails
      }

      // Update local state
      setSubjects(subjects.map(subject =>
        subject.id === selectedSubject.id
          ? { ...subject, assigned_teacher: selectedTeacher, assigned_teacher_name: teacherName }
          : subject
      ))

      toast({
        title: "Success",
        description: `Teacher assigned to ${selectedSubject.name}`,
      })

      setIsAssignTeacherDialogOpen(false)
      setSelectedSubject(null)
      setSelectedTeacher("")
    } catch (error) {
      console.error("Error assigning teacher:", error)
      toast({
        title: "Error",
        description: "Failed to assign teacher",
        variant: "destructive",
      })
    }
  }

  const handleUnassignTeacher = async (subject: Subject) => {
    if (!subject.assigned_teacher) return

    try {
      // Get teacher details for notification
      const teacher = teachers.find(t => t.id === subject.assigned_teacher)
      const teacherName = teacher?.firstname && teacher?.lastname
        ? `${teacher.firstname} ${teacher.lastname}`
        : teacher?.name || "Teacher"
      const teacherEmail = teacher?.email || ""

      // Update subject to remove assigned teacher
      const { error: subjectError } = await supabase
        .from('subjects')
        .update({
          assigned_teacher: null,
          assigned_teacher_name: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subject.id)

      if (subjectError) throw subjectError

      // Update teacher document to remove assigned subject
      const { error: teacherError } = await supabase
        .from('teachers')
        .update({
          subject: null,
          subject_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subject.assigned_teacher)

      if (teacherError) throw teacherError

      // Send notification to teacher about unassignment
      if (teacherName && teacherEmail) {
        try {
          const { sendTeacherSubjectUnassignmentNotification } = await import("@/lib/notification-utils")
          await sendTeacherSubjectUnassignmentNotification(
            subject.assigned_teacher,
            teacherName,
            teacherEmail,
            subject.name,
            subject.code,
            schoolInfo.school_id
          )
        } catch (error) {
          console.error("Error sending teacher unassignment notification:", error)
          // Don't fail the unassignment if notification fails
        }
      }

      // Update local state
      setSubjects(subjects.map(s =>
        s.id === subject.id
          ? { ...s, assigned_teacher: null, assigned_teacher_name: null } as Subject
          : s
      ))

      toast({
        title: "Success",
        description: `Teacher unassigned from ${subject.name}`,
      })
    } catch (error) {
      console.error("Error unassigning teacher:", error)
      toast({
        title: "Error",
        description: "Failed to unassign teacher",
        variant: "destructive",
      })
    }
  }

  // Filter subjects
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || subject.department === departmentFilter
    const matchesLevel = levelFilter === "all" || subject.level === levelFilter

    return matchesSearch && matchesDepartment && matchesLevel
  })

  // Get unique departments and levels for filters
  const departmentFilters = ["all", ...[...new Set(subjects.map((s) => s.department))].filter(Boolean)]
  const levels = ["all", ...[...new Set(subjects.map((s) => s.level))].filter(Boolean)]

  // Get stage-specific level options
  const levelOptions = getLevelOptions(schoolInfo.stage || "")
  const isSeniorSecondary = schoolInfo.stage === "Senior Secondary"

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Subjects</CardTitle>
            <div className="flex gap-2">
              {isSeniorSecondary && (
                <Button variant="outline" onClick={handleOpenAddDepartmentDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              )}
              <Button onClick={handleOpenAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  {isSeniorSecondary && (
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentFilters.filter((c): c is string => !!c).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept === "all" ? "All Departments" : dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.filter((c): c is string => !!c).map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl === "all" ? "All Levels" : lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      {isSeniorSecondary && <TableHead>Department</TableHead>}
                      <TableHead>Level</TableHead>
                      <TableHead>Assigned Teacher</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isSeniorSecondary ? 6 : 5} className="text-center py-8 text-muted-foreground">
                          No subjects found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.code}</TableCell>
                          <TableCell>{subject.name}</TableCell>
                          {isSeniorSecondary && <TableCell>{subject.department || "-"}</TableCell>}
                          <TableCell>{subject.level || "-"}</TableCell>
                          <TableCell>
                            {subject.assigned_teacher_name ? (
                              <div className="flex items-center gap-2">
                                <span>{subject.assigned_teacher_name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleUnassignTeacher(subject)}
                                  title="Unassign Teacher"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAssignTeacherDialog(subject)}
                              >
                                Assign
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDetailsDialog(subject)}
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Subject Dialog */}
        <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditDialogOpen ? "Edit Subject" : "Add Subject"}</DialogTitle>
              <DialogDescription>
                {isEditDialogOpen ? "Update subject details" : "Add a new subject to the curriculum"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g. MTH101"
                      required
                    />
                    <Button type="button" variant="outline" size="icon" onClick={generateSubjectCode} title="Generate Code">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
              </div>

              {/* Search by Code Button (Only in Add Mode) */}
              {isAddDialogOpen && (
                <div className="flex gap-2 items-end">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="searchCode">Search by Code (Auto-fill)</Label>
                    <Input
                      id="searchCode"
                      value={subjectCodeSearchQuery}
                      onChange={(e) => setSubjectCodeSearchQuery(e.target.value)}
                      placeholder="Enter code to search..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={searchSubjectByCode}
                    disabled={isSearchingSubjectCode || !subjectCodeSearchQuery}
                  >
                    {isSearchingSubjectCode ? "Searching..." : "Search"}
                  </Button>
                </div>
              )}

              {isSeniorSecondary && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleSelectChange("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Subject description..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddDialogOpen(false)
                  setIsEditDialogOpen(false)
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Department Dialog */}
        <Dialog open={isAddDepartmentDialogOpen} onOpenChange={setIsAddDepartmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Department</DialogTitle>
              <DialogDescription>Add a new department for Senior Secondary level</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitDepartment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={departmentFormData.name}
                  onChange={handleDepartmentInputChange}
                  placeholder="e.g. Science, Arts, Commercial"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDepartmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingDepartment}>
                  {isSubmittingDepartment ? "Adding..." : "Add Department"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Subject Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subject Details</DialogTitle>
            </DialogHeader>
            {selectedSubject && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedSubject.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Code</Label>
                    <p className="font-medium">{selectedSubject.code}</p>
                  </div>
                  {isSeniorSecondary && (
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="font-medium">{selectedSubject.department || "-"}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Level</Label>
                    <p className="font-medium">{selectedSubject.level || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Assigned Teacher</Label>
                    <p className="font-medium">{selectedSubject.assigned_teacher_name || "Not Assigned"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">{selectedSubject.description || "No description provided."}</p>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button onClick={handleOpenEditDialog}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Teacher Dialog */}
        <Dialog open={isAssignTeacherDialogOpen} onOpenChange={setIsAssignTeacherDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Teacher</DialogTitle>
              <DialogDescription>
                Assign a teacher to {selectedSubject?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Teacher</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstname} {teacher.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignTeacherDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignTeacher} disabled={!selectedTeacher}>
                  Assign Teacher
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
