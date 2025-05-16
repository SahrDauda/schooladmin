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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, UserPlus, Search, Mail, Phone, BookOpen, Calendar, Edit, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, Timestamp, deleteDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { z } from "zod"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getCurrentSchoolInfo } from "@/lib/school-utils"

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
  salary: z.string().transform((val) => Number.parseInt(val) || 0),
  status: z.string().min(1, "Status is required"),
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
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    qualification: "",
    subject: "",
    joining_date: "",
    salary: "",
    status: "Active",
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
        ...doc.data(),
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

      // Add timestamp and metadata
      const currentDate = new Date()
      const teacherData = {
        ...formData,
        id: teacherId,
        school_id: schoolInfo.school_id,
        schoolName: schoolInfo.schoolName, // Include school name
        created_at: Timestamp.fromDate(currentDate),
      }

      // Save to Firestore
      await setDoc(doc(db, "teachers", teacherId), teacherData)

      // Show success message
      toast({
        title: "Success",
        description: "Teacher added successfully",
      })

      // Refresh the teachers list
      await fetchTeachers()

      // Reset form
      setFormData({
        firstname: "",
        lastname: "",
        gender: "",
        email: "",
        phone: "",
        address: "",
        qualification: "",
        subject: "",
        joining_date: "",
        salary: "",
        status: "Active",
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
        await deleteDoc(doc(db, "teachers", teacherId))

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

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Teachers</CardTitle>
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
                <TabsList>
                  <TabsTrigger value="personal">Personal Information</TabsTrigger>
                  <TabsTrigger value="professional">Professional Information</TabsTrigger>
                </TabsList>
                <TabsContent value="personal" className="space-y-4">
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstname">First Name</Label>
                        <Input id="firstname" value={formData.firstname} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="lastname">Last Name</Label>
                        <Input id="lastname" value={formData.lastname} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select onValueChange={(value) => handleSelectChange("gender", value)}>
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
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={formData.phone} onChange={handleInputChange} />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={formData.address} onChange={handleInputChange} />
                      </div>
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="professional" className="space-y-4">
                  <form onSubmit={handleSubmitTeacher} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="qualification">Qualification</Label>
                        <Input id="qualification" value={formData.qualification} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" value={formData.subject} onChange={handleInputChange} />
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
                      <div>
                        <Label htmlFor="salary">Salary</Label>
                        <Input id="salary" type="number" value={formData.salary} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select defaultValue="Active" onValueChange={(value) => handleSelectChange("status", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="On Leave">On Leave</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            teacher.status === "Active"
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
                      <div>
                        <Label htmlFor="edit_status">Status</Label>
                        <Select
                          value={editFormData.status}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              status: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="On Leave">On Leave</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedTeacher.status === "Active"
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
