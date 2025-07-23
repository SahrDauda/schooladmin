"use client"

import type React from "react"

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
import { BookOpen, Users, GraduationCap, Plus, Search, Edit, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, Timestamp, deleteDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { getCurrentSchoolInfo } from "@/lib/school-utils"

interface Class {
  id: string
  name: string
  level: string
  section?: string
  capacity: number
  teacher_id?: string
  description?: string
  students_count?: number
  school_id?: string
}

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  level: z.string().min(1, "Level is required"),
  section: z.string().optional(),
  capacity: z.string().transform((val) => Number.parseInt(val) || 0),
  teacher_id: z.string().optional(),
  description: z.string().optional(),
})

export default function ClassesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [isViewClassOpen, setIsViewClassOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    section: "",
    capacity: "",
    teacher_id: "",
    description: "",
    school_id: "",
  })
  const [editFormData, setEditFormData] = useState(formData)

  useEffect(() => {
    const loadSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      setSchoolInfo(info)
      setFormData((prev) => ({ ...prev, school_id: info.school_id }))
    }

    loadSchoolInfo()
  }, [])

  const fetchClasses = async () => {
    setIsLoading(true)
    try {
      if (!schoolInfo.school_id) return

      // Fetch classes
      const classesRef = collection(db, "classes")
      const classesQuery = query(classesRef, where("school_id", "==", schoolInfo.school_id))
      const classesSnapshot = await getDocs(classesQuery)

      // When mapping Firestore docs to Class[]
      const classesList: Class[] = classesSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Class)
      );

      // Fetch students to count by class
      const studentsRef = collection(db, "students")
      const studentsQuery = query(studentsRef, where("school_id", "==", schoolInfo.school_id))
      const studentsSnapshot = await getDocs(studentsQuery)

      // Count students for each class
      const studentCounts: { [classId: string]: number } = {}
      studentsSnapshot.docs.forEach((doc) => {
        const studentData = doc.data()
        if (studentData.class) {
          if (!studentCounts[studentData.class]) {
            studentCounts[studentData.class] = 0
          }
          studentCounts[studentData.class]++
        }
      })

      // Update class objects with accurate student counts
      const updatedClasses = classesList.map((cls) => ({
        ...cls,
        students_count: studentCounts[cls.id] || 0,
      }))

      // Sort the classes by level client-side instead of in the query
      const sortedClasses = updatedClasses.sort((a, b) => {
        // Extract numeric part for proper sorting (e.g., "JSS 1" -> 1, "SSS 3" -> 3)
        const levelA = a.level.split(" ").pop() || ""
        const levelB = b.level.split(" ").pop() || ""

        // First sort by level type (JSS, SSS)
        const typeA = a.level.split(" ")[0] || ""
        const typeB = b.level.split(" ")[0] || ""

        if (typeA !== typeB) {
          return typeA.localeCompare(typeB)
        }

        // Then sort by level number
        return Number.parseInt(levelA) - Number.parseInt(levelB)
      })

      setClasses(sortedClasses)
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      if (!schoolInfo.school_id) return

      const teachersRef = collection(db, "teachers")
      const q = query(teachersRef, where("school_id", "==", schoolInfo.school_id))
      const querySnapshot = await getDocs(q)

      const teachersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setTeachers(teachersList)
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

  useEffect(() => {
    if (schoolInfo.school_id) {
      fetchClasses()
      fetchTeachers()
    }
  }, [schoolInfo.school_id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    // If "none" is selected for teacher_id, set it to an empty string in the database
    if (field === "teacher_id" && value === "none") {
      setFormData((prev) => ({ ...prev, [field]: "" }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Validate form data
      classSchema.parse(formData)

      // Generate a unique ID
      const classId = `CL${Date.now().toString().slice(-6)}`

      // Add timestamp and metadata
      const currentDate = new Date()
      const classData = {
        ...formData,
        id: classId,
        school_id: schoolInfo.school_id,
        schoolName: schoolInfo.schoolName, // Add school name to the record
        created_at: Timestamp.fromDate(currentDate),
        students_count: 0,
      }

      // Save to Firestore
      await setDoc(doc(db, "classes", classId), classData)

      // Show success message
      toast({
        title: "Success",
        description: "Class added successfully",
      })

      // Refresh the classes list
      await fetchClasses()

      // Reset form
      setFormData({
        name: "",
        level: "",
        section: "",
        capacity: "",
        teacher_id: "",
        description: "",
        school_id: schoolInfo.school_id,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        })
      } else {
        console.error("Error adding class:", error)
        toast({
          title: "Error",
          description: "Failed to add class. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await setDoc(doc(db, "classes", selectedClass.id), {
        ...editFormData,
        school_id: schoolInfo.school_id,
        schoolName: schoolInfo.schoolName, // Add school name to the record
        updated_at: Timestamp.fromDate(new Date()),
      })

      toast({
        title: "Success",
        description: "Class information updated successfully",
      })

      await fetchClasses()
      setIsViewClassOpen(false)
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update class information",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "classes", classId))

        toast({
          title: "Success",
          description: "Class deleted successfully",
        })

        await fetchClasses()
        setIsViewClassOpen(false)
      } catch (error) {
        console.error("Error deleting class:", error)
        toast({
          title: "Error",
          description: "Failed to delete class",
          variant: "destructive",
        })
      }
    }
  }

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.id?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLevel = selectedLevel === "all" || cls.level === selectedLevel

    return matchesSearch && matchesLevel
  })

  // Calculate dashboard metrics
  const totalClasses = classes.length
  const totalStudentsInClasses = classes.reduce((sum, cls) => sum + (cls.students_count || 0), 0)
  const totalCapacity = classes.reduce((sum, cls) => sum + (cls.capacity || 0), 0)
  const occupancyRate = totalCapacity > 0 ? Math.round((totalStudentsInClasses / totalCapacity) * 100) : 0

  // Get unique level options from classes data
  const levelOptions = [...new Set(classes.map((cls) => cls.level))].sort()

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Not Assigned"
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Classes</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Class</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Class</DialogTitle>
                  <DialogDescription>Fill out the form below to add a new class.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitClass} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Class Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Mathematics"
                      />
                    </div>
                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Select onValueChange={(value) => handleSelectChange("level", value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JSS 1">JSS 1</SelectItem>
                          <SelectItem value="JSS 2">JSS 2</SelectItem>
                          <SelectItem value="JSS 3">JSS 3</SelectItem>
                          <SelectItem value="SSS 1">SSS 1</SelectItem>
                          <SelectItem value="SSS 2">SSS 2</SelectItem>
                          <SelectItem value="SSS 3">SSS 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        placeholder="e.g. A, B, C"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity?.toString() || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. 30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher_id">Class Teacher</Label>
                      <Select onValueChange={(value) => handleSelectChange("teacher_id", value)}>
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
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief description of the class"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Add Class"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span>Total Classes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClasses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Total Students</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStudentsInClasses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-green-500" />
                    <span>Total Capacity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCapacity}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-amber-500" />
                    <span>Occupancy Rate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{occupancyRate}%</div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-4">
              <div className="flex items-center space-x-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search classes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-[250px] pl-8"
                  />
                </div>
                <Select onValueChange={(value) => setSelectedLevel(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levelOptions.map((level, index) => (
                      <SelectItem key={index} value={level}>
                        {level}
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
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No classes found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((cls) => (
                      <TableRow
                        key={cls.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest("button")) {
                            setSelectedClass(cls)
                            setEditFormData({
                              name: cls.name || "",
                              level: cls.level || "",
                              section: cls.section || "",
                              capacity: cls.capacity?.toString() || "",
                              teacher_id: cls.teacher_id || "",
                              description: cls.description || "",
                              school_id: cls.school_id || "",
                            })
                            setIsViewClassOpen(true)
                          }
                        }}
                      >
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.level}</TableCell>
                        <TableCell>{cls.section || "-"}</TableCell>
                        <TableCell>{cls.students_count || 0}</TableCell>
                        <TableCell>{cls.capacity || "-"}</TableCell>
                        <TableCell>{cls.teacher_id ? getTeacherName(cls.teacher_id) : "Not Assigned"}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedClass(cls)
                              setEditFormData({
                                name: cls.name || "",
                                level: cls.level || "",
                                section: cls.section || "",
                                capacity: cls.capacity?.toString() || "",
                                teacher_id: cls.teacher_id || "",
                                description: cls.description || "",
                                school_id: cls.school_id || "",
                              })
                              setIsViewClassOpen(true)
                              setIsEditing(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteClass(cls.id)}
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
            {selectedClass && (
              <Dialog
                open={isViewClassOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsViewClassOpen(false)
                    setIsEditing(false)
                  }
                }}
                modal
              >
                <DialogContent className="sm:max-w-[600px] w-[90%] max-h-[85vh] overflow-y-auto">
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Class Information</DialogTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? "Cancel Edit" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsViewClassOpen(false)
                          setIsEditing(false)
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </DialogHeader>

                  {isEditing ? (
                    <form onSubmit={handleUpdateClass} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_name">Class Name</Label>
                          <Input
                            id="edit_name"
                            value={editFormData.name}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_level">Level</Label>
                          <Select
                            value={editFormData.level}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                level: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="JSS 1">JSS 1</SelectItem>
                              <SelectItem value="JSS 2">JSS 2</SelectItem>
                              <SelectItem value="JSS 3">JSS 3</SelectItem>
                              <SelectItem value="SSS 1">SSS 1</SelectItem>
                              <SelectItem value="SSS 2">SSS 2</SelectItem>
                              <SelectItem value="SSS 3">SSS 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit_section">Section</Label>
                          <Input
                            id="edit_section"
                            value={editFormData.section}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                section: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_capacity">Capacity</Label>
                          <Input
                            id="edit_capacity"
                            type="number"
                            value={editFormData.capacity}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                capacity: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_teacher_id">Class Teacher</Label>
                          <Select
                            value={editFormData.teacher_id || "none"}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                teacher_id: value === "none" ? "" : value,
                              }))
                            }
                          >
                            <SelectTrigger>
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
                        <div className="md:col-span-2">
                          <Label htmlFor="edit_description">Description</Label>
                          <Input
                            id="edit_description"
                            value={editFormData.description}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-bold">Class Name</Label>
                        <p>{selectedClass.name}</p>
                      </div>
                      <div>
                        <Label className="font-bold">Level</Label>
                        <p>{selectedClass.level}</p>
                      </div>
                      <div>
                        <Label className="font-bold">Section</Label>
                        <p>{selectedClass.section || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="font-bold">Capacity</Label>
                        <p>{selectedClass.capacity || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="font-bold">Students</Label>
                        <p>{selectedClass.students_count || 0}</p>
                      </div>
                      <div>
                        <Label className="font-bold">Class Teacher</Label>
                        <p>{selectedClass.teacher_id ? getTeacherName(selectedClass.teacher_id) : "Not Assigned"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="font-bold">Description</Label>
                        <p>{selectedClass.description || "N/A"}</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
