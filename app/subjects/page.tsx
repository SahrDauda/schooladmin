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
import { Plus, Pencil, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, where, Timestamp, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Subject {
  id: string
  name: string
  code: string
  department?: string
  description?: string
  level?: string
  created_at?: Timestamp
  updated_at?: Timestamp
}

interface Department {
  id: string
  name: string
  school_id: string
  schoolname: string
  created_at?: Timestamp
  updated_at?: Timestamp
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

  // State for loading
  const [isLoading, setIsLoading] = useState(true)

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  
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

  // State for filter
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")

  // Load school info
  useEffect(() => {
    const loadSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      console.log("School info loaded:", info)
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

        // Sort subjects by name
        subjectsList.sort((a, b) => a.name.localeCompare(b.name))
        setSubjects(subjectsList)

        // Fetch departments (only for Senior Secondary)
        if (schoolInfo.stage === "Senior Secondary") {
          const departmentsRef = collection(db, "departments")
          const departmentsQuery = query(departmentsRef, where("school_id", "==", schoolInfo.school_id))
          const departmentsSnapshot = await getDocs(departmentsQuery)
          const departmentsList: Department[] = departmentsSnapshot.docs.map(
            (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Department),
          )

          // Sort departments by name
          departmentsList.sort((a, b) => a.name.localeCompare(b.name))
          setDepartments(departmentsList)
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
      // Generate a unique ID for new departments
      const departmentId = `DEPT_${Date.now().toString().slice(-6)}`

      // Add timestamp and metadata
      const currentDate = new Date()
      const departmentData = {
        ...departmentFormData,
        id: departmentId,
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
        created_at: Timestamp.fromDate(currentDate),
      }

      // Save to Firestore
      await setDoc(doc(db, "departments", departmentId), departmentData)

      // Show success message
      toast({
        title: "Success",
        description: "Department added successfully",
      })

      // Refresh departments list
      const updatedDepartments = [...departments, { ...departmentData }]
      updatedDepartments.sort((a, b) => a.name.localeCompare(b.name))
      setDepartments(updatedDepartments)

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

      // Generate a unique ID for new subjects
      const subjectId = selectedSubject ? selectedSubject.id : `SUB_${Date.now().toString().slice(-6)}`

      // Add timestamp and metadata
      const currentDate = new Date()
      const subjectData = {
        ...formData,
        id: subjectId,
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
        updated_at: Timestamp.fromDate(currentDate),
        ...(selectedSubject ? {} : { created_at: Timestamp.fromDate(currentDate) }),
      }

      // Save to Firestore
      await setDoc(doc(db, "subjects", subjectId), subjectData)

      // Show success message
      toast({
        title: "Success",
        description: `Subject ${selectedSubject ? "updated" : "added"} successfully`,
      })

      // Refresh subjects list
      const updatedSubjects = [...subjects]
      const existingIndex = updatedSubjects.findIndex((s) => s.id === subjectId)

      if (existingIndex >= 0) {
        updatedSubjects[existingIndex] = { ...subjectData }
      } else {
        updatedSubjects.push({ ...subjectData })
      }

      // Sort subjects by name
      updatedSubjects.sort((a, b) => a.name.localeCompare(b.name))
      setSubjects(updatedSubjects)

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
        await deleteDoc(doc(db, "subjects", selectedSubject.id))

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
  console.log("School stage:", schoolInfo.stage, "Level options:", levelOptions, "Is Senior Secondary:", isSeniorSecondary)
  
  // Debug: Check if stage matches exactly
  console.log("Stage comparison:", {
    stage: schoolInfo.stage,
    isPrimary: schoolInfo.stage === "Primary",
    isJuniorSecondary: schoolInfo.stage === "Junior Secondary", 
    isSeniorSecondary: schoolInfo.stage === "Senior Secondary"
  })

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
                      {levels.filter((c): c is string => !!c).map((level) => (
                        <SelectItem key={level} value={level}>
                          {level === "all" ? "All Levels" : level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {subjects.length === 0
                    ? "No subjects found. Add your first subject to get started."
                    : "No subjects match your search criteria."}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Code</TableHead>
                        <TableHead>Subject Name</TableHead>
                        {isSeniorSecondary && <TableHead>Department</TableHead>}
                        <TableHead>Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.map((subject) => (
                        <TableRow
                          key={subject.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenDetailsDialog(subject)}
                        >
                          <TableCell className="font-medium">{subject.code}</TableCell>
                          <TableCell>{subject.name}</TableCell>
                          {isSeniorSecondary && <TableCell>{subject.department || "—"}</TableCell>}
                          <TableCell>{subject.level || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Subject Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
              <DialogDescription>Add a new subject to the system.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name *</Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code *</Label>
                  <div className="flex gap-2">
                    <Input id="code" value={formData.code} onChange={handleInputChange} required />
                    <Button type="button" variant="outline" onClick={generateSubjectCode} className="whitespace-nowrap">
                      Generate
                    </Button>
                  </div>
                </div>
                {isSeniorSecondary && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
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
                  <Select value={formData.level} onValueChange={(value) => handleSelectChange("level", value)}>
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={handleInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Subject Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>Update subject information.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name *</Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code *</Label>
                  <div className="flex gap-2">
                    <Input id="code" value={formData.code} onChange={handleInputChange} required />
                    <Button type="button" variant="outline" onClick={generateSubjectCode} className="whitespace-nowrap">
                      Generate
                    </Button>
                  </div>
                </div>
                {isSeniorSecondary && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
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
                  <Select value={formData.level} onValueChange={(value) => handleSelectChange("level", value)}>
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={handleInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Subject Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] w-[90%]">
            <DialogHeader>
              <DialogTitle>Subject Details</DialogTitle>
            </DialogHeader>
            {selectedSubject && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Subject Code</h3>
                    <p className="text-base font-medium">{selectedSubject.code}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Subject Name</h3>
                    <p className="text-base font-medium">{selectedSubject.name}</p>
                  </div>
                  {isSeniorSecondary && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                      <p className="text-base">{selectedSubject.department || "—"}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Level</h3>
                    <p className="text-base">{selectedSubject.level || "—"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="text-base">{selectedSubject.description || "No description provided."}</p>
                  </div>
                  {selectedSubject.created_at && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                      <p className="text-sm">{selectedSubject.created_at.toDate().toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedSubject.updated_at && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                      <p className="text-sm">{selectedSubject.updated_at.toDate().toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex justify-between sm:justify-end gap-2">
                  <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button onClick={handleOpenEditDialog} className="w-full sm:w-auto">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Department Dialog */}
        <Dialog open={isAddDepartmentDialogOpen} onOpenChange={setIsAddDepartmentDialogOpen}>
          <DialogContent className="sm:max-w-[500px] w-[90%]">
            <DialogHeader>
              <DialogTitle>Add Department</DialogTitle>
              <DialogDescription>Add a new department/faculty to the school.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitDepartment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input 
                  id="name" 
                  value={departmentFormData.name} 
                  onChange={handleDepartmentInputChange} 
                  placeholder="e.g., Science, Commercial, Arts"
                  required 
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmittingDepartment}>
                  {isSubmittingDepartment ? "Saving..." : "Save Department"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
