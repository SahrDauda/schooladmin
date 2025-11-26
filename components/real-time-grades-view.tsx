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
  TrendingUp,
  Users,
  GraduationCap,
  Download,
  FileText,
  AlertCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
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
  created_at: string
  updated_at: string
}

interface Student {
  id: string
  firstname: string
  lastname: string
  class: string
  class_id?: string
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
    if (schoolId) {
      fetchData()
      setupRealTimeListener()
    }
  }, [schoolId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch all related data
      const [
        { data: studentsData },
        { data: teachersData },
        { data: subjectsData },
        { data: classesData },
        { data: gradesData }
      ] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', schoolId),
        supabase.from('teachers').select('*').eq('school_id', schoolId),
        supabase.from('subjects').select('*').eq('school_id', schoolId),
        supabase.from('classes').select('*').eq('school_id', schoolId),
        supabase.from('grades').select('*').eq('school_id', schoolId).order('created_at', { ascending: false })
      ])

      if (studentsData) setStudents(studentsData)
      if (teachersData) setTeachers(teachersData)
      if (subjectsData) setSubjects(subjectsData)
      if (classesData) setClasses(classesData)
      if (gradesData) setGrades(gradesData)

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
    const channel = supabase
      .channel('grades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newGrade = payload.new as GradeData
            setGrades(prev => [newGrade, ...prev])

            // Show notification for new grades
            const student = students.find(s => s.id === newGrade.student_id)
            const teacher = teachers.find(t => t.id === newGrade.teacher_id)
            const subject = subjects.find(sub => sub.id === newGrade.subject_id)

            if (student && subject) {
              toast({
                title: "New Grade Posted",
                description: `${teacher ? `${teacher.firstname} ${teacher.lastname}` : 'A teacher'} posted a grade for ${student.firstname} ${student.lastname} in ${subject.name}`,
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            setGrades(prev => prev.map(g => g.id === payload.new.id ? payload.new as GradeData : g))
          } else if (payload.eventType === 'DELETE') {
            setGrades(prev => prev.filter(g => g.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Filter grades based on selected criteria
  const filteredGrades = grades.filter(grade => {
    const student = students.find(s => s.id === grade.student_id)
    const teacher = teachers.find(t => t.id === grade.teacher_id)
    const subject = subjects.find(s => s.id === grade.subject_id)

    if (!student || !subject) return false

    const matchesTerm = !selectedTerm || grade.term === selectedTerm
    const matchesYear = !selectedYear || grade.year === selectedYear
    // Check class match - handle both direct class string and class_id relation
    const studentClassId = student.class_id
    const studentClassName = student.class
    const matchesClass = selectedClass === "all" ||
      studentClassId === selectedClass ||
      studentClassName === selectedClass ||
      (classes.find(c => c.id === selectedClass)?.name === studentClassName)

    const matchesSubject = selectedSubject === "all" || grade.subject_id === selectedSubject
    const matchesSearch = !searchTerm ||
      student.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher && (teacher.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.lastname.toLowerCase().includes(searchTerm.toLowerCase())))

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
    teachersPosted: new Set(filteredGrades.map(g => g.teacher_id).filter(Boolean)).size,
    subjectsCovered: new Set(filteredGrades.map(g => g.subject_id)).size,
  }

  const getClassName = (classId?: string, className?: string) => {
    if (className) return className
    if (!classId) return "Unknown Class"
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
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
                          {student ? getClassName(student.class_id, student.class) : "Unknown"}
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