"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Users, BookOpen, GraduationCap, TrendingUp, Trophy, Download } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

// Mock data for demonstration
const mockClasses = [
  { id: "class-1", name: "JSS 1A", students: 35 },
  { id: "class-2", name: "JSS 1B", students: 32 },
  { id: "class-3", name: "JSS 2A", students: 30 },
  { id: "class-4", name: "JSS 2B", students: 28 },
  { id: "class-5", name: "JSS 3A", students: 33 },
  { id: "class-6", name: "JSS 3B", students: 31 },
]

const mockSubjects = [
  { id: "sub-1", name: "Mathematics", teacher: "Mr. Ibrahim Koroma" },
  { id: "sub-2", name: "English Language", teacher: "Mrs. Fatmata Sesay" },
  { id: "sub-3", name: "Integrated Science", teacher: "Mr. Mohamed Bangura" },
  { id: "sub-4", name: "Social Studies", teacher: "Mrs. Aminata Kamara" },
  { id: "sub-5", name: "Basic Technology", teacher: "Mr. Samuel Johnson" },
  { id: "sub-6", name: "Agricultural Science", teacher: "Mr. Joseph Williams" },
  { id: "sub-7", name: "Physical Education", teacher: "Mr. Abu Conteh" },
  { id: "sub-8", name: "French", teacher: "Mrs. Marie Cole" },
]

// Generate mock students for a class
const generateMockStudents = (classId: string) => {
  const firstNames = ["Abubakarr", "Fatmata", "Mohamed", "Aminata", "Ibrahim", "Mariama", "Sulaiman", "Hawa", "Alhaji", "Isatu", "Brima", "Kadiatu", "Foday", "Tenneh", "Santigie"]
  const lastNames = ["Kamara", "Sesay", "Bangura", "Koroma", "Conteh", "Mansaray", "Turay", "Kargbo", "Williams", "Cole", "Jalloh", "Fofanah", "Dumbuya", "Kallon", "Bah"]
  
  const classNum = parseInt(classId.split("-")[1]) || 1
  const numStudents = mockClasses.find(c => c.id === classId)?.students || 30
  
  return Array.from({ length: numStudents }, (_, i) => ({
    id: `student-${classId}-${i + 1}`,
    firstname: firstNames[(i + classNum) % firstNames.length],
    lastname: lastNames[(i * 2 + classNum) % lastNames.length],
    admissionNo: `${2024}/${String(classNum * 100 + i + 1).padStart(3, '0')}`,
  }))
}

// Generate mock grades for a student across all subjects
const generateStudentAllSubjectsGrades = (studentId: string) => {
  return mockSubjects.map(subject => {
    const term1Test1 = Math.floor(Math.random() * 30) + 50
    const term1Test2 = Math.floor(Math.random() * 30) + 50
    const term1Mean = Math.round((term1Test1 + term1Test2) / 2)
    
    const term2Test1 = Math.floor(Math.random() * 30) + 50
    const term2Test2 = Math.floor(Math.random() * 30) + 50
    const term2Mean = Math.round((term2Test1 + term2Test2) / 2)
    
    const term3Test1 = Math.floor(Math.random() * 30) + 50
    const term3Test2 = Math.floor(Math.random() * 30) + 50
    const term3Mean = Math.round((term3Test1 + term3Test2) / 2)
    
    const yearlyMean = Math.round((term1Mean + term2Mean + term3Mean) / 3)
    
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      teacher: subject.teacher,
      term1: { test1: term1Test1, test2: term1Test2, mean: term1Mean, rank: Math.floor(Math.random() * 30) + 1 },
      term2: { test1: term2Test1, test2: term2Test2, mean: term2Mean, rank: Math.floor(Math.random() * 30) + 1 },
      term3: { test1: term3Test1, test2: term3Test2, mean: term3Mean, rank: Math.floor(Math.random() * 30) + 1 },
      yearlyMean,
      yearlyRank: Math.floor(Math.random() * 30) + 1,
    }
  })
}

// Generate mock grades for all students in a subject
const generateSubjectGrades = (subjectId: string, students: any[]) => {
  return students.map((student, index) => {
    const term1Test1 = Math.floor(Math.random() * 30) + 50
    const term1Test2 = Math.floor(Math.random() * 30) + 50
    const term1Mean = Math.round((term1Test1 + term1Test2) / 2)
    
    const term2Test1 = Math.floor(Math.random() * 30) + 50
    const term2Test2 = Math.floor(Math.random() * 30) + 50
    const term2Mean = Math.round((term2Test1 + term2Test2) / 2)
    
    const term3Test1 = Math.floor(Math.random() * 30) + 50
    const term3Test2 = Math.floor(Math.random() * 30) + 50
    const term3Mean = Math.round((term3Test1 + term3Test2) / 2)
    
    const yearlyMean = Math.round((term1Mean + term2Mean + term3Mean) / 3)
    
    return {
      studentId: student.id,
      studentName: `${student.firstname} ${student.lastname}`,
      admissionNo: student.admissionNo,
      term1: { test1: term1Test1, test2: term1Test2, mean: term1Mean, rank: index + 1 },
      term2: { test1: term2Test1, test2: term2Test2, mean: term2Mean, rank: Math.floor(Math.random() * students.length) + 1 },
      term3: { test1: term3Test1, test2: term3Test2, mean: term3Mean, rank: Math.floor(Math.random() * students.length) + 1 },
      yearlyMean,
      yearlyRank: Math.floor(Math.random() * students.length) + 1,
    }
  }).sort((a, b) => b.yearlyMean - a.yearlyMean).map((g, i) => ({ ...g, term1: { ...g.term1, rank: i + 1 }, yearlyRank: i + 1 }))
}

const getOrdinalSuffix = (num: number): string => {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return "st"
  if (j === 2 && k !== 12) return "nd"
  if (j === 3 && k !== 13) return "rd"
  return "th"
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 font-semibold"
  if (score >= 65) return "text-blue-600 font-semibold"
  if (score >= 50) return "text-yellow-600 font-semibold"
  return "text-red-600 font-semibold"
}

const getGradeBadge = (score: number) => {
  if (score >= 80) return <Badge className="bg-green-100 text-green-800">A</Badge>
  if (score >= 65) return <Badge className="bg-blue-100 text-blue-800">B</Badge>
  if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">C</Badge>
  if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">D</Badge>
  return <Badge className="bg-red-100 text-red-800">F</Badge>
}

export default function AdminGradesPage() {
  const [activeTab, setActiveTab] = useState("class-grades")
  
  // Class Grades state
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [classStudents, setClassStudents] = useState<any[]>([])
  const [studentGrades, setStudentGrades] = useState<any[]>([])
  
  // Subject Grades state
  const [subjectSelectedClass, setSubjectSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [subjectClassStudents, setSubjectClassStudents] = useState<any[]>([])
  const [subjectGrades, setSubjectGrades] = useState<any[]>([])

  // Handle class selection for Class Grades tab
  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId)
    setSelectedStudent(null)
    setStudentGrades([])
    const students = generateMockStudents(classId)
    setClassStudents(students)
  }

  // Handle student selection
  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student)
    const grades = generateStudentAllSubjectsGrades(student.id)
    setStudentGrades(grades)
  }

  // Handle class selection for Subject Grades tab
  const handleSubjectClassSelect = (classId: string) => {
    setSubjectSelectedClass(classId)
    setSelectedSubject("")
    setSubjectGrades([])
    const students = generateMockStudents(classId)
    setSubjectClassStudents(students)
  }

  // Handle subject selection
  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId)
    const grades = generateSubjectGrades(subjectId, subjectClassStudents)
    setSubjectGrades(grades)
  }

  // Calculate student overall stats
  const calculateStudentStats = () => {
    if (studentGrades.length === 0) return null
    
    const totalYearlyMean = Math.round(
      studentGrades.reduce((sum, g) => sum + g.yearlyMean, 0) / studentGrades.length
    )
    
    // Simulated class ranking based on overall performance
    const overallRank = Math.floor(Math.random() * 30) + 1
    const totalStudents = mockClasses.find(c => c.id === selectedClass)?.students || 30
    
    return {
      totalYearlyMean,
      overallRank,
      totalStudents,
    }
  }

  const studentStats = calculateStudentStats()

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 mt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">School Admin Grades View</h1>
            <p className="text-muted-foreground">View student results by class or subject</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Academic Year:</span>
            <Badge variant="outline">2024/2025</Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockClasses.length}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockClasses.reduce((sum, c) => sum + c.students, 0)}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSubjects.length}</div>
              <p className="text-xs text-muted-foreground">Academic subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">School Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67%</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="class-grades" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Class Grades
            </TabsTrigger>
            <TabsTrigger value="subject-grades" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subject Grades
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Class Grades */}
          <TabsContent value="class-grades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select a Class</CardTitle>
                <CardDescription>Choose a class to view all students and their grades</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedClass} onValueChange={handleClassSelect}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.students} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Student List */}
            {selectedClass && !selectedStudent && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Students in {mockClasses.find(c => c.id === selectedClass)?.name}
                  </CardTitle>
                  <CardDescription>Click on a student to view their grades across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead>Admission No.</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.map((student, index) => (
                        <TableRow 
                          key={student.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleStudentSelect(student)}
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{student.admissionNo}</TableCell>
                          <TableCell className="font-medium">
                            {student.firstname} {student.lastname}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              View Grades
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Individual Student Grades View */}
            {selectedStudent && (
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedStudent(null)
                    setStudentGrades([])
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Student List
                </Button>

                {/* Student Info Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">
                          {selectedStudent.firstname} {selectedStudent.lastname}
                        </CardTitle>
                        <CardDescription>
                          {mockClasses.find(c => c.id === selectedClass)?.name} | Admission No: {selectedStudent.admissionNo}
                        </CardDescription>
                      </div>
                      {studentStats && (
                        <div className="flex items-center gap-4">
                          <div className="text-center px-4 py-2 bg-primary/10 rounded-lg">
                            <p className="text-sm text-muted-foreground">Overall Average</p>
                            <p className={`text-2xl font-bold ${getScoreColor(studentStats.totalYearlyMean)}`}>
                              {studentStats.totalYearlyMean}%
                            </p>
                          </div>
                          <div className="text-center px-4 py-2 bg-amber-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Class Rank</p>
                            <p className="text-2xl font-bold text-amber-600 flex items-center gap-1">
                              <Trophy className="h-5 w-5" />
                              {studentStats.overallRank}{getOrdinalSuffix(studentStats.overallRank)}
                            </p>
                            <p className="text-xs text-muted-foreground">of {studentStats.totalStudents}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Grade Sheet - Matching the physical grade sheet format */}
                <Card>
                  <CardHeader className="text-center border-b bg-muted/30">
                    <CardTitle className="text-lg">GRADE SHEET FOR 2024/2025 SCHOOL YEAR</CardTitle>
                    <CardDescription>
                      Student: {selectedStudent.firstname} {selectedStudent.lastname} | 
                      Form: {mockClasses.find(c => c.id === selectedClass)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 overflow-x-auto">
                    <Table className="border-collapse min-w-[900px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="border bg-muted text-center w-12" rowSpan={2}>No</TableHead>
                          <TableHead className="border bg-muted w-[180px]" rowSpan={2}>Subject</TableHead>
                          <TableHead className="border bg-muted text-center" colSpan={4}>FIRST TERM</TableHead>
                          <TableHead className="border bg-muted text-center" colSpan={4}>SECOND TERM</TableHead>
                          <TableHead className="border bg-muted text-center" colSpan={4}>THIRD TERM</TableHead>
                          <TableHead className="border bg-muted text-center" colSpan={2}>YEARLY MEAN</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead className="border bg-muted/50 text-center w-12">T1</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">T2</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">T1</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">T2</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">T1</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">T2</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                          <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentGrades.map((grade, index) => (
                          <TableRow key={grade.subjectId}>
                            <TableCell className="border text-center font-medium">{index + 1}</TableCell>
                            <TableCell className="border font-medium">{grade.subjectName}</TableCell>
                            {/* First Term */}
                            <TableCell className="border text-center">{grade.term1.test1}</TableCell>
                            <TableCell className="border text-center">{grade.term1.test2}</TableCell>
                            <TableCell className={`border text-center ${getScoreColor(grade.term1.mean)}`}>
                              {grade.term1.mean}
                            </TableCell>
                            <TableCell className="border text-center">{grade.term1.rank}</TableCell>
                            {/* Second Term */}
                            <TableCell className="border text-center">{grade.term2.test1}</TableCell>
                            <TableCell className="border text-center">{grade.term2.test2}</TableCell>
                            <TableCell className={`border text-center ${getScoreColor(grade.term2.mean)}`}>
                              {grade.term2.mean}
                            </TableCell>
                            <TableCell className="border text-center">{grade.term2.rank}</TableCell>
                            {/* Third Term */}
                            <TableCell className="border text-center">{grade.term3.test1}</TableCell>
                            <TableCell className="border text-center">{grade.term3.test2}</TableCell>
                            <TableCell className={`border text-center ${getScoreColor(grade.term3.mean)}`}>
                              {grade.term3.mean}
                            </TableCell>
                            <TableCell className="border text-center">{grade.term3.rank}</TableCell>
                            {/* Yearly Mean */}
                            <TableCell className={`border text-center font-bold ${getScoreColor(grade.yearlyMean)}`}>
                              {grade.yearlyMean}
                            </TableCell>
                            <TableCell className="border text-center font-bold">{grade.yearlyRank}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Subject Grades */}
          <TabsContent value="subject-grades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Class and Subject</CardTitle>
                <CardDescription>Choose a class and subject to view all student grades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Class</label>
                    <Select value={subjectSelectedClass} onValueChange={handleSubjectClassSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({cls.students} students)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Select 
                      value={selectedSubject} 
                      onValueChange={handleSubjectSelect}
                      disabled={!subjectSelectedClass}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={subjectSelectedClass ? "Select a subject..." : "Select a class first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Grades Table */}
            {selectedSubject && subjectGrades.length > 0 && (
              <Card>
                <CardHeader className="text-center border-b bg-muted/30">
                  <CardTitle className="text-lg">GRADE SHEET FOR 2024/2025 SCHOOL YEAR</CardTitle>
                  <CardDescription className="space-y-1">
                    <p>Subject: <span className="font-semibold">{mockSubjects.find(s => s.id === selectedSubject)?.name}</span></p>
                    <p>Form: <span className="font-semibold">{mockClasses.find(c => c.id === subjectSelectedClass)?.name}</span></p>
                    <p>Teacher In Charge: <span className="font-semibold">{mockSubjects.find(s => s.id === selectedSubject)?.teacher}</span></p>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 overflow-x-auto">
                  <Table className="border-collapse min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border bg-muted text-center w-12" rowSpan={2}>No</TableHead>
                        <TableHead className="border bg-muted w-[180px]" rowSpan={2}>NAME</TableHead>
                        <TableHead className="border bg-muted text-center" colSpan={4}>FIRST TERM</TableHead>
                        <TableHead className="border bg-muted text-center" colSpan={4}>SECOND TERM</TableHead>
                        <TableHead className="border bg-muted text-center" colSpan={4}>THIRD TERM</TableHead>
                        <TableHead className="border bg-muted text-center" colSpan={2}>YEARLY MEAN</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="border bg-muted/50 text-center w-12">T1</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">T2</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">T1</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">T2</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">T1</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">T2</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Mn</TableHead>
                        <TableHead className="border bg-muted/50 text-center w-12">Rk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectGrades.map((grade, index) => (
                        <TableRow key={grade.studentId}>
                          <TableCell className="border text-center font-medium">{index + 1}</TableCell>
                          <TableCell className="border font-medium">{grade.studentName}</TableCell>
                          {/* First Term */}
                          <TableCell className="border text-center">{grade.term1.test1}</TableCell>
                          <TableCell className="border text-center">{grade.term1.test2}</TableCell>
                          <TableCell className={`border text-center ${getScoreColor(grade.term1.mean)}`}>
                            {grade.term1.mean}
                          </TableCell>
                          <TableCell className="border text-center">{grade.term1.rank}</TableCell>
                          {/* Second Term */}
                          <TableCell className="border text-center">{grade.term2.test1}</TableCell>
                          <TableCell className="border text-center">{grade.term2.test2}</TableCell>
                          <TableCell className={`border text-center ${getScoreColor(grade.term2.mean)}`}>
                            {grade.term2.mean}
                          </TableCell>
                          <TableCell className="border text-center">{grade.term2.rank}</TableCell>
                          {/* Third Term */}
                          <TableCell className="border text-center">{grade.term3.test1}</TableCell>
                          <TableCell className="border text-center">{grade.term3.test2}</TableCell>
                          <TableCell className={`border text-center ${getScoreColor(grade.term3.mean)}`}>
                            {grade.term3.mean}
                          </TableCell>
                          <TableCell className="border text-center">{grade.term3.rank}</TableCell>
                          {/* Yearly Mean */}
                          <TableCell className={`border text-center font-bold ${getScoreColor(grade.yearlyMean)}`}>
                            {grade.yearlyMean}
                          </TableCell>
                          <TableCell className="border text-center font-bold">{grade.yearlyRank}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
