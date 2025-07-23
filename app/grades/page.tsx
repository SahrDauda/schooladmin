"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, MessageSquare, Users, GraduationCap, TrendingUp, Download, FileText } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { useRouter } from "next/navigation"
import { getPromotionStatus, getStatusStyling } from "@/lib/grade-utils"
import { exportStudentReportToPDF, exportMultipleStudentReports } from "@/lib/student-report-pdf"

export default function GradesPage() {
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false)
  const [isCommentOpen, setIsCommentOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<any>(null)
  const [comment, setComment] = useState("")
  const [newGrade, setNewGrade] = useState({
    student_id: "",
    subject_id: "",
    term: "",
    score: "",
    comment: "",
  })

  // Helper functions (moved to top)
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId)
    return cls ? cls.name : "Unknown Class"
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Unknown Teacher"
  }

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    return student ? `${student.firstname} ${student.lastname}` : "Unknown Student"
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const info = await getCurrentSchoolInfo()
        setSchoolInfo(info)

        const [studentsSnapshot, gradesSnapshot, subjectsSnapshot, classesSnapshot, teachersSnapshot] =
          await Promise.all([
            getDocs(collection(db, "students")),
            getDocs(collection(db, "grades")),
            getDocs(collection(db, "subjects")),
            getDocs(collection(db, "classes")),
            getDocs(collection(db, "teachers")),
          ])

        setStudents(studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setGrades(gradesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setSubjects(subjectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setClasses(classesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setTeachers(teachersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastname?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "all" || student.class_id === selectedClass
    return matchesSearch && matchesClass
  })

  // Get grades for selected subject
  const subjectGrades = selectedSubject ? grades.filter((grade) => grade.subject_id === selectedSubject) : []

  // Calculate statistics
  const totalStudents = students.length
  const totalGrades = grades.length
  const averageScore = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : 0
  const gradesWithComments = grades.filter((g) => g.comment && g.comment.trim() !== "").length

  // Handle add grade
  const handleAddGrade = async () => {
    try {
      await addDoc(collection(db, "grades"), {
        ...newGrade,
        score: Number.parseInt(newGrade.score),
        created_at: new Date(),
      })

      toast({
        title: "Success",
        description: "Grade added successfully!",
      })

      setIsAddGradeOpen(false)
      setNewGrade({ student_id: "", subject_id: "", term: "", score: "", comment: "" })

      // Refresh grades
      const gradesSnapshot = await getDocs(collection(db, "grades"))
      setGrades(gradesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error("Error adding grade:", error)
      toast({
        title: "Error",
        description: "Failed to add grade. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle comment update
  const handleUpdateComment = async () => {
    if (!selectedGrade) return

    try {
      await updateDoc(doc(db, "grades", selectedGrade.id), {
        comment: comment,
        updated_at: new Date(),
      })

      toast({
        title: "Success",
        description: "Comment updated successfully!",
      })

      setIsCommentOpen(false)
      setComment("")
      setSelectedGrade(null)

      // Refresh grades
      const gradesSnapshot = await getDocs(collection(db, "grades"))
      setGrades(gradesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error("Error updating comment:", error)
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle export single student report
  const handleExportStudentReport = (student: any) => {
    const studentData = {
      student,
      schoolInfo,
      grades: grades.filter((g) => g.student_id === student.id),
      subjects,
      classes,
      teachers,
    }

    exportStudentReportToPDF(studentData)

    toast({
      title: "Success",
      description: `Report exported for ${student.firstname} ${student.lastname}`,
    })
  }

  // Handle export multiple reports
  const handleExportMultipleReports = () => {
    const studentsData = filteredStudents.map((student) => ({
      student,
      schoolInfo,
      grades: grades.filter((g) => g.student_id === student.id),
      subjects,
      classes,
      teachers,
    }))

    exportMultipleStudentReports(studentsData)

    toast({
      title: "Success",
      description: `Exporting ${filteredStudents.length} student reports...`,
    })
  }

  // Handle view full result
  const handleViewFullResult = (student: any) => {
    router.push(`/grades/student/${student.id}`)
  }

  // Open comment dialog
  const openCommentDialog = (grade: any) => {
    setSelectedGrade(grade)
    setComment(grade.comment || "")
    setIsCommentOpen(true)
  }

  // Quick comment buttons
  const quickComments = [
    "Excellent work!",
    "Good effort, keep it up!",
    "Needs improvement",
    "Well done!",
    "Please see me after class",
    "Outstanding performance!",
  ]

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Grades Management</h1>
            <p className="text-muted-foreground">Manage student grades and academic performance</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportMultipleReports} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All Reports
            </Button>
            <Button onClick={() => setIsAddGradeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Grade
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGrades}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gradesWithComments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">Students Overview</TabsTrigger>
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
          </TabsList>

          {/* Students Overview Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Students Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Click on a row to view detailed student results</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Grades</TableHead>
                      <TableHead>Average Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const studentGrades = grades.filter((g) => g.student_id === student.id)
                      const averageScore =
                        studentGrades.length > 0
                          ? Math.round(studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length)
                          : 0
                      const status = getPromotionStatus(averageScore)
                      const styling = getStatusStyling(status)

                      return (
                        <TableRow
                          key={student.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleViewFullResult(student)}
                        >
                          <TableCell className="font-medium">
                            {student.firstname} {student.lastname}
                          </TableCell>
                          <TableCell>{student.class || getClassName(student.class_id)}</TableCell>
                          <TableCell>{studentGrades.length}</TableCell>
                          <TableCell>{averageScore}%</TableCell>
                          <TableCell>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${styling}`}>{status}</div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" onClick={() => handleExportStudentReport(student)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Subject Tab */}
          <TabsContent value="subjects">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject to view grades" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedSubject && (
                <Card>
                  <CardHeader>
                    <CardTitle>{getSubjectName(selectedSubject)} - Grades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectGrades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">{getStudentName(grade.student_id)}</TableCell>
                            <TableCell>
                              {(() => {
                                const student = students.find((s) => s.id === grade.student_id)
                                return student ? student.class || getClassName(student.class_id) : "Unknown"
                              })()}
                            </TableCell>
                            <TableCell>{grade.term}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  grade.score >= 70 ? "default" : grade.score >= 50 ? "secondary" : "destructive"
                                }
                              >
                                {grade.score}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {grade.comment ? (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                                      {grade.comment}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No comment</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => openCommentDialog(grade)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Grade Dialog */}
        <Dialog open={isAddGradeOpen} onOpenChange={setIsAddGradeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Grade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={newGrade.student_id}
                onValueChange={(value) => setNewGrade({ ...newGrade, student_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstname} {student.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newGrade.subject_id}
                onValueChange={(value) => setNewGrade({ ...newGrade, subject_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={newGrade.term} onValueChange={(value) => setNewGrade({ ...newGrade, term: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Term">First Term</SelectItem>
                  <SelectItem value="Second Term">Second Term</SelectItem>
                  <SelectItem value="Third Term">Third Term</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Score (0-100)"
                value={newGrade.score}
                onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
                min="0"
                max="100"
              />

              <Textarea
                placeholder="Comment (optional)"
                value={newGrade.comment}
                onChange={(e) => setNewGrade({ ...newGrade, comment: e.target.value })}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddGradeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGrade}>Add Grade</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Grade Comment</DialogTitle>
            </DialogHeader>
            {selectedGrade && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Student:</strong> {getStudentName(selectedGrade.student_id)}
                  </p>
                  <p className="text-sm">
                    <strong>Subject:</strong> {getSubjectName(selectedGrade.subject_id)}
                  </p>
                  <p className="text-sm">
                    <strong>Term:</strong> {selectedGrade.term}
                  </p>
                  <p className="text-sm">
                    <strong>Score:</strong> {selectedGrade.score}%
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Comments:</label>
                  <div className="flex flex-wrap gap-2">
                    {quickComments.map((quickComment) => (
                      <Button key={quickComment} variant="outline" size="sm" onClick={() => setComment(quickComment)}>
                        {quickComment}
                      </Button>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder="Enter your comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{comment.length}/500 characters</p>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCommentOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateComment}>Save Comment</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
