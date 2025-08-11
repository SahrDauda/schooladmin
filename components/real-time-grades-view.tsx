"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { 
  Eye, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  Calendar,
  RefreshCw,
  Download,
  FileText,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { exportStudentReportToPDF } from "@/lib/student-report-pdf"

interface RealTimeGradesViewProps {
  schoolId: string
}

interface GradeData {
  id: string
  student_id: string
  subject_id: string
  term: string
  year: string
  score: number
  comment?: string
  teacher_id: string
  school_id: string
  created_at: Date
  updated_at: Date
}

interface Student {
  id: string
  firstname: string
  lastname: string
  class: string
  school_id: string
}

interface Teacher {
  id: string
  firstname: string
  lastname: string
  subject: string
}

interface Subject {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
}

export default function RealTimeGradesView({ schoolId }: RealTimeGradesViewProps) {
  const [grades, setGrades] = useState<GradeData[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"recent" | "summary" | "detailed">("recent")

  // Terms and years
  const terms = ["First Term", "Second Term", "Third Term"]
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  useEffect(() => {
    fetchData()
    setupRealTimeListener()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all related data
      const [studentsSnapshot, teachersSnapshot, subjectsSnapshot, classesSnapshot] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "teachers")),
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "classes")),
      ])

      setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setTeachers(teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))

      // Set default term and year
      const currentMonth = new Date().getMonth()
      if (currentMonth < 4) setSelectedTerm("First Term")
      else if (currentMonth < 8) setSelectedTerm("Second Term")
      else setSelectedTerm("Third Term")
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeListener = () => {
    // Listen for real-time updates to grades
    const gradesQuery = query(
      collection(db, "grades"),
      where("school_id", "==", schoolId),
      orderBy("created_at", "desc")
    )

    const unsubscribe = onSnapshot(gradesQuery, (snapshot) => {
      const gradesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setGrades(gradesData)
      
      // Show notification for new grades
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newGrade = change.doc.data()
          const student = students.find(s => s.id === newGrade.student_id)
          const teacher = teachers.find(t => t.id === newGrade.teacher_id)
          const subject = subjects.find(sub => sub.id === newGrade.subject_id)
          
          if (student && teacher && subject) {
            toast({
              title: "New Grade Posted",
              description: `${teacher.firstname} ${teacher.lastname} posted a grade for ${student.firstname} ${student.lastname} in ${subject.name}`,
            })
          }
        }
      })
    })

    return unsubscribe
  }

  // Filter grades based on selected criteria
  const filteredGrades = grades.filter(grade => {
    const student = students.find(s => s.id === grade.student_id)
    const teacher = teachers.find(t => t.id === grade.teacher_id)
    const subject = subjects.find(s => s.id === grade.subject_id)
    
    if (!student || !teacher || !subject) return false

    const matchesTerm = !selectedTerm || grade.term === selectedTerm
    const matchesYear = !selectedYear || grade.year === selectedYear
    const matchesClass = selectedClass === "all" || student.class === selectedClass
    const matchesSubject = selectedSubject === "all" || grade.subject_id === selectedSubject
    const matchesSearch = !searchTerm || 
      student.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastname.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesTerm && matchesYear && matchesClass && matchesSubject && matchesSearch
  })

  // Get recent grades (last 24 hours)
  const recentGrades = grades.filter(grade => {
    const gradeDate = new Date(grade.created_at)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return gradeDate > yesterday
  })

  // Calculate summary statistics
  const summaryStats = {
    totalGrades: filteredGrades.length,
    averageScore: filteredGrades.length > 0 
      ? Math.round(filteredGrades.reduce((sum, g) => sum + g.score, 0) / filteredGrades.length)
      : 0,
    teachersPosted: new Set(filteredGrades.map(g => g.teacher_id)).size,
    subjectsCovered: new Set(filteredGrades.map(g => g.subject_id)).size,
  }

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student ? `${student.firstname} ${student.lastname}` : "Unknown Student"
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Unknown Teacher"
  }

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId)
    return cls ? cls.name : "Unknown Class"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-bold"
    if (score >= 60) return "text-blue-600 font-bold"
    if (score >= 40) return "text-yellow-600 font-bold"
    return "text-red-600 font-bold"
  }

  const handleExportReport = (student: Student) => {
    const studentGrades = grades.filter(g => g.student_id === student.id)
    exportStudentReportToPDF({
      student,
      grades: studentGrades,
      subjects,
      classes,
      teachers,
      schoolInfo: { school_id: schoolId, schoolName: "" }
    })
    toast({
      title: "Success",
      description: `Report exported for ${student.firstname} ${student.lastname}`,
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalGrades}</div>
            <p className="text-xs text-muted-foreground">
              {selectedTerm} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Class average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers Posted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.teachersPosted}</div>
            <p className="text-xs text-muted-foreground">
              Active teachers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Covered</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.subjectsCovered}</div>
            <p className="text-xs text-muted-foreground">
              Different subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Terms</SelectItem>
                {terms.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
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

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
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

            <Input
              placeholder="Search students/teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* View Modes */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Recent Grade Postings (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentGrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent grade postings
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Posted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentGrades.slice(0, 10).map((grade) => {
                      const student = students.find(s => s.id === grade.student_id)
                      const teacher = teachers.find(t => t.id === grade.teacher_id)
                      const subject = subjects.find(s => s.id === grade.subject_id)
                      
                      return (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">
                            {student ? `${student.firstname} ${student.lastname}` : "Unknown"}
                          </TableCell>
                          <TableCell>{subject ? subject.name : "Unknown"}</TableCell>
                          <TableCell>
                            <span className={getScoreColor(grade.score)}>
                              {grade.score}%
                            </span>
                          </TableCell>
                          <TableCell>{teacher ? `${teacher.firstname} ${teacher.lastname}` : "Unknown"}</TableCell>
                          <TableCell>{formatDate(grade.created_at)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(new Set(filteredGrades.map(g => g.student_id))).map(studentId => {
                    const student = students.find(s => s.id === studentId)
                    const studentGrades = filteredGrades.filter(g => g.student_id === studentId)
                    const average = Math.round(studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length)
                    const subjectsCount = new Set(studentGrades.map(g => g.subject_id)).size
                    
                    return (
                      <TableRow key={studentId}>
                        <TableCell className="font-medium">
                          {student ? `${student.firstname} ${student.lastname}` : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {student ? getClassName(student.class) : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subjectsCount} subjects</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={getScoreColor(average)}>
                            {average}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {student && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportReport(student)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => {
                    const student = students.find(s => s.id === grade.student_id)
                    const teacher = teachers.find(t => t.id === grade.teacher_id)
                    const subject = subjects.find(s => s.id === grade.subject_id)
                    
                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">
                          {student ? `${student.firstname} ${student.lastname}` : "Unknown"}
                        </TableCell>
                        <TableCell>{subject ? subject.name : "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{grade.term}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={getScoreColor(grade.score)}>
                            {grade.score}%
                          </span>
                        </TableCell>
                        <TableCell>{teacher ? `${teacher.firstname} ${teacher.lastname}` : "Unknown"}</TableCell>
                        <TableCell>{formatDate(grade.created_at)}</TableCell>
                        <TableCell>
                          {grade.comment ? (
                            <span className="text-sm text-muted-foreground">
                              {grade.comment}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 