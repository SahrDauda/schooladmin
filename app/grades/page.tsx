"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, BookOpen, User, Users, GraduationCap } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentSchoolInfo } from "@/lib/school-utils"

export default function GradesPage() {
  const [activeTab, setActiveTab] = useState("students")
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })

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

  // Filter grades based on selected filters
  const filteredGrades = grades.filter((grade) => {
    const matchesSearch =
      grade.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.subject_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesClass = selectedClass === "all" || grade.class_id === selectedClass
    const matchesStudent = selectedStudent === "all" || grade.student_id === selectedStudent
    const matchesSubject = selectedSubject === "all" || grade.subject_id === selectedSubject
    const matchesTerm = selectedTerm === "all" || grade.term === selectedTerm

    return matchesSearch && matchesClass && matchesStudent && matchesSubject && matchesTerm
  })

  // Group grades by student
  const gradesByStudent = students.map((student) => {
    const studentGrades = grades.filter((grade) => grade.student_id === student.id)
    return {
      student,
      grades: studentGrades,
    }
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

  // Get grade letter based on score
  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    return "F"
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
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[250px] pl-8"
                />
              </div>
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
              ) : gradesByStudent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No grades found.</div>
              ) : (
                <div className="space-y-6">
                  {gradesByStudent
                    .filter((item) => item.grades.length > 0)
                    .filter(
                      (item) =>
                        item.student.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.student.lastname.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .filter(
                      (item) =>
                        selectedClass === "all" ||
                        item.student.class_id === selectedClass ||
                        item.student.class === getClassName(selectedClass),
                    )
                    .map((item) => (
                      <Card key={item.student.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 py-3">
                          <CardTitle className="text-lg">
                            {item.student.firstname} {item.student.lastname} - {item.student.class}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Comments</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.grades
                                .filter((grade) => selectedTerm === "all" || grade.term === selectedTerm)
                                .map((grade) => (
                                  <TableRow key={grade.id}>
                                    <TableCell>{getSubjectName(grade.subject_id)}</TableCell>
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
                                    <TableCell>{grade.comments || "No comments"}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
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
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader className="bg-muted/50 py-3">
                        <CardTitle className="text-lg">{getSubjectName(selectedSubject)} - Student Grades</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
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
                              .map((grade) => (
                                <TableRow key={grade.id}>
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
    </DashboardLayout>
  )
}
