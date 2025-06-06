"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, BookOpen, User, Users, GraduationCap, Eye, EyeOff, X } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Student {
  id: string
  firstname: string
  lastname: string
  class: string
  class_id: string
  teacher_id?: string
  [key: string]: any
}

interface Grade {
  id: string
  student_id: string
  subject_id: string
  class_id: string
  score: number
  term: string
  comments?: string
  [key: string]: any
}

interface Teacher {
  id: string
  firstname: string
  lastname: string
  [key: string]: any
}

export default function GradesPage() {
  const [activeTab, setActiveTab] = useState("students")
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [showStudentsWithoutGrades, setShowStudentsWithoutGrades] = useState(true)
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null)
  const [showFullResults, setShowFullResults] = useState(false)

  // Fetch school info
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      setSchoolInfo(info)
    }
    fetchSchoolInfo()
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch classes
        const classesRef = collection(db, "classes")
        const classesSnapshot = await getDocs(classesRef)
        const classesList = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setClasses(classesList)

        // Fetch teachers
        const teachersRef = collection(db, "teachers")
        const teachersSnapshot = await getDocs(teachersRef)
        const teachersList = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setTeachers(teachersList)

        // Fetch students
        const studentsRef = collection(db, "students")
        const studentsQuery = query(studentsRef, orderBy("lastname", "asc"))
        const studentsSnapshot = await getDocs(studentsQuery)
        const studentsList = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setStudents(studentsList)

        // Fetch subjects
        const subjectsRef = collection(db, "subjects")
        const subjectsSnapshot = await getDocs(subjectsRef)
        const subjectsList = subjectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setSubjects(subjectsList)

        // Fetch grades
        const gradesRef = collection(db, "grades")
        const gradesSnapshot = await getDocs(gradesRef)
        const gradesList = gradesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setGrades(gradesList)

        console.log("Fetched data:", {
          students: studentsList.length,
          teachers: teachersList.length,
          grades: gradesList.length,
          classes: classesList.length,
          subjects: subjectsList.length,
        })
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

  // Filter students based on search and class
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesClass =
      selectedClass === "all" ||
      student.class_id === selectedClass ||
      student.class === selectedClass ||
      getClassName(selectedClass) === student.class

    const matchesSelection = !showSelectedOnly || selectedStudents.includes(student.id)

    // Check if student has grades
    const hasGrades = grades.some((grade) => grade.student_id === student.id)
    const shouldShow = showStudentsWithoutGrades || hasGrades

    return matchesSearch && matchesClass && matchesSelection && shouldShow
  })

  // Group grades by subject
  const gradesBySubject = subjects.map((subject) => {
    const subjectGrades = grades.filter((grade) => grade.subject_id === subject.id)
    return {
      subject,
      grades: subjectGrades,
    }
  })

  // Calculate statistics
  const totalGrades = grades.length
  const averageGrade =
    grades.length > 0 ? Math.round(grades.reduce((sum, grade) => sum + (grade.score || 0), 0) / grades.length) : 0
  const passingGrades = grades.filter((grade) => (grade.score || 0) >= 50).length
  const passingRate = grades.length > 0 ? Math.round((passingGrades / grades.length) * 100) : 0

  // Get student name by ID
  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    return student ? `${student.firstname} ${student.lastname}` : "Unknown Student"
  }

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "No Teacher Assigned"
  }

  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  // Get class name by ID
  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId)
    return cls ? cls.name : "Unknown Class"
  }

  // Get class teacher by class ID
  const getClassTeacher = (classId: string) => {
    const cls = classes.find((c) => c.id === classId)
    return cls?.teacher_id ? getTeacherName(cls.teacher_id) : "No Teacher Assigned"
  }

  // Get grade letter based on score
  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    return "F"
  }

  // Student selection functions
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleSelectAll = () => {
    const visibleStudentIds = filteredStudents.map((student) => student.id)

    if (selectedStudents.length === visibleStudentIds.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(visibleStudentIds)
    }
  }

  const clearSelection = () => {
    setSelectedStudents([])
    setShowSelectedOnly(false)
  }

  // Get student grades for display
  const getStudentGrades = (studentId: string) => {
    return grades.filter((grade) => {
      const matchesStudent = grade.student_id === studentId
      const matchesTerm = selectedTerm === "all" || grade.term === selectedTerm
      return matchesStudent && matchesTerm
    })
  }

  // Calculate student average
  const getStudentAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId)
    if (studentGrades.length === 0) return 0
    return Math.round(studentGrades.reduce((sum, grade) => sum + (grade.score || 0), 0) / studentGrades.length)
  }

  // Get student status
  const getStudentStatus = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId)
    if (studentGrades.length === 0) return "No Grades"
    const average = getStudentAverage(studentId)
    return average >= 50 ? "Passing" : "Failing"
  }

  // Get student's primary term (most recent or most common)
  const getStudentPrimaryTerm = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId)
    if (studentGrades.length === 0) return "No Term"

    // Count terms
    const termCounts = studentGrades.reduce(
      (acc, grade) => {
        acc[grade.term] = (acc[grade.term] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Return the term with most grades
    return Object.entries(termCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "No Term"
  }

  // Get student grades organized by subject and term
  const getStudentGradesBySubjectAndTerm = (studentId: string) => {
    const studentGrades = grades.filter((grade) => grade.student_id === studentId)

    // Group by subject
    const gradesBySubject = subjects.reduce(
      (acc, subject) => {
        const subjectGrades = studentGrades.filter((grade) => grade.subject_id === subject.id)
        if (subjectGrades.length > 0) {
          acc[subject.name] = subjectGrades
        }
        return acc
      },
      {} as Record<string, Grade[]>,
    )

    // Calculate term averages
    const terms = ["First Term", "Second Term", "Third Term"]
    const termAverages = terms.reduce(
      (acc, term) => {
        const termGrades = studentGrades.filter((grade) => grade.term === term)
        if (termGrades.length > 0) {
          acc[term] = Math.round(termGrades.reduce((sum, grade) => sum + grade.score, 0) / termGrades.length)
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate overall average
    const overallAverage =
      studentGrades.length > 0
        ? Math.round(studentGrades.reduce((sum, grade) => sum + grade.score, 0) / studentGrades.length)
        : 0

    return { gradesBySubject, termAverages, overallAverage }
  }

  // Handle row click
  const handleRowClick = (student: Student) => {
    setSelectedStudentForModal(student)
  }

  // Handle view full results
  const handleViewFullResults = () => {
    setShowFullResults(true)
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Grades</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[150px]">
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
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="First Term">First Term</SelectItem>
                <SelectItem value="Second Term">Second Term</SelectItem>
                <SelectItem value="Third Term">Third Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>Total Grades</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGrades}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
                <div className="text-xs text-muted-foreground">
                  {students.filter((s) => grades.some((g) => g.student_id === s.id)).length} with grades
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <span>Average Grade</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageGrade}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-amber-500" />
                  <span>Passing Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{passingRate}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[250px] pl-8"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {selectedStudents.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setShowSelectedOnly(!showSelectedOnly)}>
                    {showSelectedOnly ? "Show All" : "Show Selected Only"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="students" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By Student</span>
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>By Subject</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all"
                          checked={
                            filteredStudents.length > 0 &&
                            filteredStudents.every((student) => selectedStudents.includes(student.id))
                          }
                          onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                          Select All Visible Students
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStudentsWithoutGrades(!showStudentsWithoutGrades)}
                        >
                          {showStudentsWithoutGrades ? (
                            <EyeOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Eye className="h-4 w-4 mr-1" />
                          )}
                          {showStudentsWithoutGrades ? "Hide" : "Show"} Students Without Grades
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredStudents.length} of {students.length} students
                    </div>
                  </div>

                  {/* Students Table */}
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={
                                  filteredStudents.length > 0 &&
                                  filteredStudents.every((student) => selectedStudents.includes(student.id))
                                }
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No students found matching your criteria.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredStudents.map((student) => {
                              const isSelected = selectedStudents.includes(student.id)
                              const status = getStudentStatus(student.id)
                              const primaryTerm = getStudentPrimaryTerm(student.id)
                              const classTeacher =
                                getClassTeacher(student.class_id) || getTeacherName(student.teacher_id || "")

                              return (
                                <TableRow
                                  key={student.id}
                                  className={`${
                                    isSelected ? "bg-primary/5 border-primary/20" : ""
                                  } hover:bg-muted/50 transition-colors cursor-pointer`}
                                  onClick={() => handleRowClick(student)}
                                >
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleStudentSelect(student.id)}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {student.firstname} {student.lastname}
                                  </TableCell>
                                  <TableCell>{student.class || getClassName(student.class_id) || "No Class"}</TableCell>
                                  <TableCell>{classTeacher}</TableCell>
                                  <TableCell>{primaryTerm}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        status === "Passing"
                                          ? "default"
                                          : status === "Failing"
                                            ? "destructive"
                                            : "outline"
                                      }
                                    >
                                      {status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="subjects">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSubject === "all" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gradesBySubject
                        .filter((item) => item.grades.length > 0)
                        .filter((item) => item.subject.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item) => (
                          <Card key={item.subject.id}>
                            <CardHeader className="bg-muted/50 py-3">
                              <CardTitle className="text-lg">{item.subject.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Average Score:</span>
                                  <span className="font-medium">
                                    {item.grades.length > 0
                                      ? Math.round(
                                          item.grades.reduce((sum, grade) => sum + (grade.score || 0), 0) /
                                            item.grades.length,
                                        )
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Highest Score:</span>
                                  <span className="font-medium">
                                    {item.grades.length > 0
                                      ? Math.max(...item.grades.map((grade) => grade.score || 0))
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Lowest Score:</span>
                                  <span className="font-medium">
                                    {item.grades.length > 0
                                      ? Math.min(...item.grades.map((grade) => grade.score || 0))
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Number of Students:</span>
                                  <span className="font-medium">{item.grades.length}</span>
                                </div>
                                {selectedStudents.length > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Selected Students:</span>
                                    <span className="font-medium">
                                      {
                                        item.grades.filter((grade) => selectedStudents.includes(grade.student_id))
                                          .length
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader className="bg-muted/50 py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{getSubjectName(selectedSubject)} - Student Grades</CardTitle>
                          {selectedStudents.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {
                                grades
                                  .filter((grade) => grade.subject_id === selectedSubject)
                                  .filter((grade) => selectedStudents.includes(grade.student_id)).length
                              }{" "}
                              selected students shown
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <Checkbox
                                  checked={
                                    grades
                                      .filter((grade) => grade.subject_id === selectedSubject)
                                      .filter((grade) => selectedTerm === "all" || grade.term === selectedTerm)
                                      .filter((grade) => selectedClass === "all" || grade.class_id === selectedClass)
                                      .every((grade) => selectedStudents.includes(grade.student_id)) &&
                                    grades
                                      .filter((grade) => grade.subject_id === selectedSubject)
                                      .filter((grade) => selectedTerm === "all" || grade.term === selectedTerm)
                                      .filter((grade) => selectedClass === "all" || grade.class_id === selectedClass)
                                      .length > 0
                                  }
                                  onCheckedChange={() => {
                                    const subjectStudentIds = grades
                                      .filter((grade) => grade.subject_id === selectedSubject)
                                      .filter((grade) => selectedTerm === "all" || grade.term === selectedTerm)
                                      .filter((grade) => selectedClass === "all" || grade.class_id === selectedClass)
                                      .map((grade) => grade.student_id)

                                    const allSelected = subjectStudentIds.every((id) => selectedStudents.includes(id))

                                    if (allSelected) {
                                      setSelectedStudents((prev) =>
                                        prev.filter((id) => !subjectStudentIds.includes(id)),
                                      )
                                    } else {
                                      setSelectedStudents((prev) => [...new Set([...prev, ...subjectStudentIds])])
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Term</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grades
                              .filter((grade) => grade.subject_id === selectedSubject)
                              .filter((grade) => selectedTerm === "all" || grade.term === selectedTerm)
                              .filter((grade) => selectedClass === "all" || grade.class_id === selectedClass)
                              .filter((grade) => !showSelectedOnly || selectedStudents.includes(grade.student_id))
                              .map((grade) => (
                                <TableRow
                                  key={grade.id}
                                  className={`${
                                    selectedStudents.includes(grade.student_id) ? "bg-primary/5 border-primary/20" : ""
                                  }`}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedStudents.includes(grade.student_id)}
                                      onCheckedChange={() => handleStudentSelect(grade.student_id)}
                                    />
                                  </TableCell>
                                  <TableCell>{getStudentName(grade.student_id)}</TableCell>
                                  <TableCell>{getClassName(grade.class_id)}</TableCell>
                                  <TableCell>{grade.term}</TableCell>
                                  <TableCell>{grade.score}%</TableCell>
                                  <TableCell>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        grade.score >= 70
                                          ? "bg-green-100 text-green-800"
                                          : grade.score >= 50
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {getGradeLetter(grade.score)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Student Grades Modal */}
      <Dialog open={!!selectedStudentForModal} onOpenChange={() => setSelectedStudentForModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedStudentForModal?.firstname} {selectedStudentForModal?.lastname} - Grade Report
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedStudentForModal && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-1">
                {(() => {
                  const { gradesBySubject, termAverages, overallAverage } = getStudentGradesBySubjectAndTerm(
                    selectedStudentForModal.id,
                  )

                  return (
                    <>
                      {/* Student Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <span className="text-sm text-muted-foreground">Class:</span>
                          <div className="font-medium">
                            {selectedStudentForModal.class || getClassName(selectedStudentForModal.class_id)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Teacher:</span>
                          <div className="font-medium">{getClassTeacher(selectedStudentForModal.class_id)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Overall Average:</span>
                          <div
                            className={`font-bold text-lg ${overallAverage >= 70 ? "text-green-600" : overallAverage >= 50 ? "text-yellow-600" : "text-red-600"}`}
                          >
                            {overallAverage}% ({getGradeLetter(overallAverage)})
                          </div>
                        </div>
                      </div>

                      {/* Term Averages */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Term Averages</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(termAverages).map(([term, average]) => (
                            <Card key={term}>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">{term}</div>
                                  <div
                                    className={`text-2xl font-bold ${average >= 70 ? "text-green-600" : average >= 50 ? "text-yellow-600" : "text-red-600"}`}
                                  >
                                    {average}%
                                  </div>
                                  <div className="text-sm">({getGradeLetter(average)})</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Grades by Subject */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Grades by Subject</h3>
                        <div className="space-y-4">
                          {Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => (
                            <Card key={subjectName}>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">{subjectName}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {subjectGrades.map((grade) => (
                                    <div key={grade.id} className="p-3 border rounded-lg">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">{grade.term}</span>
                                        <Badge
                                          variant={
                                            grade.score >= 70
                                              ? "default"
                                              : grade.score >= 50
                                                ? "secondary"
                                                : "destructive"
                                          }
                                        >
                                          {grade.score}% ({getGradeLetter(grade.score)})
                                        </Badge>
                                      </div>
                                      {grade.comments && (
                                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                          {grade.comments}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* View Full Results Button */}
                      <div className="flex justify-center pt-4">
                        <Button onClick={handleViewFullResults} size="lg">
                          View Full Result
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Results View */}
      <Dialog open={showFullResults} onOpenChange={setShowFullResults}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Complete Academic Results - {selectedStudentForModal?.firstname} {selectedStudentForModal?.lastname}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowFullResults(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedStudentForModal && (
            <ScrollArea className="max-h-[80vh]">
              <div className="space-y-6 p-1">
                {(() => {
                  const { gradesBySubject, termAverages, overallAverage } = getStudentGradesBySubjectAndTerm(
                    selectedStudentForModal.id,
                  )

                  return (
                    <>
                      {/* Header with School Info */}
                      <div className="text-center border-b pb-4">
                        <h1 className="text-2xl font-bold">{schoolInfo.schoolName}</h1>
                        <h2 className="text-xl">Academic Report Card</h2>
                        <div className="mt-2 text-muted-foreground">Academic Year 2024/2025</div>
                      </div>

                      {/* Student Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Student Name:</span>
                            <span>
                              {selectedStudentForModal.firstname} {selectedStudentForModal.lastname}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Student ID:</span>
                            <span>{selectedStudentForModal.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Class:</span>
                            <span>
                              {selectedStudentForModal.class || getClassName(selectedStudentForModal.class_id)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Class Teacher:</span>
                            <span>{getClassTeacher(selectedStudentForModal.class_id)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Overall Average:</span>
                            <span
                              className={`font-bold ${overallAverage >= 70 ? "text-green-600" : overallAverage >= 50 ? "text-yellow-600" : "text-red-600"}`}
                            >
                              {overallAverage}% ({getGradeLetter(overallAverage)})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <Badge variant={overallAverage >= 50 ? "default" : "destructive"}>
                              {overallAverage >= 50 ? "PASSED" : "FAILED"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Comprehensive Grades Table */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Complete Grade Report</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>First Term</TableHead>
                              <TableHead>Second Term</TableHead>
                              <TableHead>Third Term</TableHead>
                              <TableHead>Average</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>Comments</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => {
                              const termScores = {
                                "First Term": subjectGrades.find((g) => g.term === "First Term")?.score || 0,
                                "Second Term": subjectGrades.find((g) => g.term === "Second Term")?.score || 0,
                                "Third Term": subjectGrades.find((g) => g.term === "Third Term")?.score || 0,
                              }
                              const subjectAverage = Math.round(
                                subjectGrades.reduce((sum, grade) => sum + grade.score, 0) / subjectGrades.length,
                              )
                              const latestComment = subjectGrades.sort((a, b) => {
                                const termOrder = { "First Term": 1, "Second Term": 2, "Third Term": 3 }
                                return (
                                  termOrder[b.term as keyof typeof termOrder] -
                                  termOrder[a.term as keyof typeof termOrder]
                                )
                              })[0]?.comments

                              return (
                                <TableRow key={subjectName}>
                                  <TableCell className="font-medium">{subjectName}</TableCell>
                                  <TableCell>{termScores["First Term"] || "-"}</TableCell>
                                  <TableCell>{termScores["Second Term"] || "-"}</TableCell>
                                  <TableCell>{termScores["Third Term"] || "-"}</TableCell>
                                  <TableCell className="font-medium">{subjectAverage}%</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        subjectAverage >= 70
                                          ? "default"
                                          : subjectAverage >= 50
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {getGradeLetter(subjectAverage)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate">{latestComment || "No comments"}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Term Summary */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Term Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(termAverages).map(([term, average]) => (
                            <Card key={term}>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <div className="text-lg font-semibold">{term}</div>
                                  <div
                                    className={`text-3xl font-bold ${average >= 70 ? "text-green-600" : average >= 50 ? "text-yellow-600" : "text-red-600"}`}
                                  >
                                    {average}%
                                  </div>
                                  <div className="text-lg">({getGradeLetter(average)})</div>
                                  <Badge variant={average >= 50 ? "default" : "destructive"} className="mt-2">
                                    {average >= 50 ? "PASSED" : "FAILED"}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t pt-4 text-center text-sm text-muted-foreground">
                        <p>This report was generated on {new Date().toLocaleDateString()}</p>
                        <p>{schoolInfo.schoolName} - Academic Management System</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
