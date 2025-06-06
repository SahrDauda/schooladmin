"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Download } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  generateRandomGrade,
  generateRandomRank,
  getPromotionStatus,
  getStatusStyling,
  limitedAcademicSubjects,
  generateMockGradeData,
} from "@/lib/grade-utils"
import { exportStudentReportToPDF } from "@/lib/student-report-pdf"
import { toast } from "@/hooks/use-toast"

export default function StudentResultPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const [student, setStudent] = useState<any>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("academic")

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get school info
        const info = await getCurrentSchoolInfo()
        setSchoolInfo(info)

        // Get student data
        const studentDoc = await getDoc(doc(db, "students", studentId))
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() })
        } else {
          throw new Error("Student not found")
        }

        // Get grades
        const gradesQuery = query(collection(db, "grades"), where("student_id", "==", studentId))
        const gradesSnapshot = await getDocs(gradesQuery)
        const gradesList = gradesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setGrades(gradesList)

        // Get subjects
        const subjectsSnapshot = await getDocs(collection(db, "subjects"))
        const subjectsList = subjectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setSubjects(subjectsList)

        // Get classes
        const classesSnapshot = await getDocs(collection(db, "classes"))
        const classesList = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setClasses(classesList)

        // Get teachers
        const teachersSnapshot = await getDocs(collection(db, "teachers"))
        const teachersList = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setTeachers(teachersList)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (studentId) {
      fetchData()
    }
  }, [studentId])

  // Helper functions
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

  const getClassTeacher = () => {
    if (!student?.class_id) return "Not Assigned"
    const cls = classes.find((c) => c.id === student.class_id)
    if (!cls?.teacher_id) return "Not Assigned"
    return getTeacherName(cls.teacher_id)
  }

  // Group subjects by category
  // Use limited academic subjects (max 8)
  const academicSubjects = limitedAcademicSubjects

  const effectiveTraits = [
    "Class Participation",
    "Sociability",
    "Helpfulness",
    "Neatness",
    "Initiative",
    "Self - Discipline",
    "Demeanor",
    "Sportsmanship",
    "Dependability/Reliability",
    "School & Community Involvement",
  ]

  const psychomotorSkills = [
    "Physical Dexterity",
    "Stamina",
    "Physical Ability",
    "Indiv. Prowess - ball games",
    "Sporting Prowess - Games etc.",
    "Ability to function as Team",
    "Sporting Prowess",
    "Drawing & Painting",
    "Physical co-ordination",
    "Voice control - Talking/Singing",
    "Musical instrument playing skill",
    "Bodily control, sense of balance",
  ]

  // Calculate term statistics with mock data
  const calculateTermStats = (term: string) => {
    const termGrades = grades.filter((grade) => grade.term === term)

    if (termGrades.length === 0) {
      // Generate mock data for the term
      const mockScores = academicSubjects.map(() => generateRandomGrade())
      const total = mockScores.reduce((sum, score) => sum + score, 0)
      const percentage = Math.round(total / mockScores.length)
      const position = generateRandomRank()

      return { total, percentage, position: `${position}${getOrdinalSuffix(position)}` }
    }

    const total = termGrades.reduce((sum, grade) => sum + (grade.score || 0), 0)
    const percentage = Math.round(total / termGrades.length)
    const position = generateRandomRank()

    return { total, percentage, position: `${position}${getOrdinalSuffix(position)}` }
  }

  // Helper function for ordinal suffix
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }

  const term1Stats = calculateTermStats("First Term")
  const term2Stats = calculateTermStats("Second Term")
  const term3Stats = calculateTermStats("Third Term")

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle PDF export
  const handleExportPDF = () => {
    if (!student) return

    const studentData = {
      student,
      schoolInfo,
      grades,
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

  // Go back to grades page
  const handleBack = () => {
    router.push("/grades")
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!student) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Student Not Found</h2>
              <p className="text-muted-foreground mt-2">The requested student record could not be found.</p>
              <Button onClick={handleBack} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Grades
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="print:p-0">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Grades
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Result
            </Button>
          </div>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="text-center border-b print:py-2">
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {student.firstname?.[0]}
                  {student.lastname?.[0]}
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl">{schoolInfo.schoolName}</CardTitle>
            <p className="text-lg font-medium">STUDENT PROGRESS REPORT</p>
            <p className="text-muted-foreground">Academic Year 2024/2025</p>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Student Info */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Name:</span> {student.firstname} {student.lastname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Class:</span> {student.class || getClassName(student.class_id)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Class Teacher:</span> {getClassTeacher()}
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    // Calculate overall average from actual grades or use mock data
                    const studentGrades = grades.filter((grade) => grade.student_id === student.id)
                    let overallAverage = 0

                    if (studentGrades.length > 0) {
                      overallAverage = Math.round(
                        studentGrades.reduce((sum, grade) => sum + grade.score, 0) / studentGrades.length,
                      )
                    } else {
                      // Generate mock overall average
                      const mockAverages = academicSubjects.map(() => {
                        const term1 = generateMockGradeData()
                        const term2 = generateMockGradeData()
                        const term3 = generateMockGradeData()
                        return Math.round((term1.mean + term2.mean + term3.mean) / 3)
                      })
                      overallAverage = Math.round(mockAverages.reduce((sum, avg) => sum + avg, 0) / mockAverages.length)
                    }

                    const status = getPromotionStatus(overallAverage)
                    const styling = getStatusStyling(status)

                    return (
                      <div className={`px-4 py-2 rounded-lg border ${styling}`}>
                        <p className="text-sm font-medium">Academic Status</p>
                        <p className="text-lg font-bold">{status}</p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            <Tabs defaultValue="academic" className="print:hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="academic">Academic Subjects</TabsTrigger>
                <TabsTrigger value="effective">Effective Traits</TabsTrigger>
                <TabsTrigger value="psychomotor">Psychomotor Skills</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-6 print:mt-2">
              {/* Academic Subjects Table */}
              <div className={`${activeTab === "academic" ? "" : "print:block hidden"}`}>
                <h3 className="text-lg font-semibold mb-2 print:text-base">SUBJECTS</h3>
                <div className="overflow-x-auto">
                  <Table className="border-collapse w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border w-[200px] bg-muted">SUBJECTS</TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 1 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 2 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 3 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={2}>
                          Year
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="border"></TableHead>
                        {/* Term 1 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Term 2 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Term 3 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Year */}
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicSubjects.map((subject) => {
                        // Find actual grades for this subject
                        const subjectId = subjects.find((s) => s.name === subject)?.id
                        const subjectGrades = subjectId ? grades.filter((g) => g.subject_id === subjectId) : []

                        // Get term grades or generate mock data
                        const term1Grade = subjectGrades.find((g) => g.term === "First Term")
                        const term2Grade = subjectGrades.find((g) => g.term === "Second Term")
                        const term3Grade = subjectGrades.find((g) => g.term === "Third Term")

                        // Generate mock data for missing terms
                        const term1Data = term1Grade
                          ? {
                              score1: term1Grade.score,
                              score2: generateRandomGrade(),
                              mean: term1Grade.score,
                              rank: term1Grade.rank || generateRandomRank(),
                            }
                          : generateMockGradeData()

                        const term2Data = term2Grade
                          ? {
                              score1: term2Grade.score,
                              score2: generateRandomGrade(),
                              mean: term2Grade.score,
                              rank: term2Grade.rank || generateRandomRank(),
                            }
                          : generateMockGradeData()

                        const term3Data = term3Grade
                          ? {
                              score1: term3Grade.score,
                              score2: generateRandomGrade(),
                              mean: term3Grade.score,
                              rank: term3Grade.rank || generateRandomRank(),
                            }
                          : generateMockGradeData()

                        // Calculate year average
                        const yearAvg = Math.round((term1Data.mean + term2Data.mean + term3Data.mean) / 3)
                        const yearRank = generateRandomRank()

                        return (
                          <TableRow key={subject}>
                            <TableCell className="border font-medium">{subject}</TableCell>
                            {/* Term 1 */}
                            <TableCell className="border text-center">{term1Data.score1}</TableCell>
                            <TableCell className="border text-center">{term1Data.score2}</TableCell>
                            <TableCell className="border text-center">{term1Data.mean}</TableCell>
                            <TableCell className="border text-center">{term1Data.rank}</TableCell>
                            {/* Term 2 */}
                            <TableCell className="border text-center">{term2Data.score1}</TableCell>
                            <TableCell className="border text-center">{term2Data.score2}</TableCell>
                            <TableCell className="border text-center">{term2Data.mean}</TableCell>
                            <TableCell className="border text-center">{term2Data.rank}</TableCell>
                            {/* Term 3 */}
                            <TableCell className="border text-center">{term3Data.score1}</TableCell>
                            <TableCell className="border text-center">{term3Data.score2}</TableCell>
                            <TableCell className="border text-center">{term3Data.mean}</TableCell>
                            <TableCell className="border text-center">{term3Data.rank}</TableCell>
                            {/* Year */}
                            <TableCell className="border text-center">{yearAvg}</TableCell>
                            <TableCell className="border text-center">{yearRank}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Effective Traits Table */}
              <div className={`mt-8 ${activeTab === "effective" ? "" : "print:block hidden"}`}>
                <h3 className="text-lg font-semibold mb-2 print:text-base">EFFECTIVE</h3>
                <div className="overflow-x-auto">
                  <Table className="border-collapse w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border w-[200px] bg-muted"></TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 1 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 2 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 3 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={2}>
                          Annual
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="border"></TableHead>
                        {/* Term 1 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Term 2 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Term 3 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Annual */}
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {effectiveTraits.map((trait) => {
                        const term1Data = generateMockGradeData()
                        const term2Data = generateMockGradeData()
                        const term3Data = generateMockGradeData()
                        const yearAvg = Math.round((term1Data.mean + term2Data.mean + term3Data.mean) / 3)
                        const yearRank = generateRandomRank()

                        return (
                          <TableRow key={trait}>
                            <TableCell className="border font-medium">{trait}</TableCell>
                            {/* Term 1 */}
                            <TableCell className="border text-center">{term1Data.score1}</TableCell>
                            <TableCell className="border text-center">{term1Data.score2}</TableCell>
                            <TableCell className="border text-center">{term1Data.mean}</TableCell>
                            <TableCell className="border text-center">{term1Data.rank}</TableCell>
                            {/* Term 2 */}
                            <TableCell className="border text-center">{term2Data.score1}</TableCell>
                            <TableCell className="border text-center">{term2Data.score2}</TableCell>
                            <TableCell className="border text-center">{term2Data.mean}</TableCell>
                            <TableCell className="border text-center">{term2Data.rank}</TableCell>
                            {/* Term 3 */}
                            <TableCell className="border text-center">{term3Data.score1}</TableCell>
                            <TableCell className="border text-center">{term3Data.score2}</TableCell>
                            <TableCell className="border text-center">{term3Data.mean}</TableCell>
                            <TableCell className="border text-center">{term3Data.rank}</TableCell>
                            {/* Year */}
                            <TableCell className="border text-center">{yearAvg}</TableCell>
                            <TableCell className="border text-center">{yearRank}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Psychomotor Skills Table */}
              <div className={`mt-8 ${activeTab === "psychomotor" ? "" : "print:block hidden"}`}>
                <h3 className="text-lg font-semibold mb-2 print:text-base">PSYCHOMOTOR</h3>
                <div className="overflow-x-auto">
                  <Table className="border-collapse w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border w-[200px] bg-muted"></TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 1 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 2 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={4}>
                          Term 3 Rating
                        </TableHead>
                        <TableHead className="border text-center bg-muted" colSpan={2}>
                          Annual
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="border"></TableHead>
                        {/* Term 1 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Term 2 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Term 3 */}
                        <TableHead className="border text-center w-10">1</TableHead>
                        <TableHead className="border text-center w-10">2</TableHead>
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                        {/* Annual */}
                        <TableHead className="border text-center w-10">Mn</TableHead>
                        <TableHead className="border text-center w-10">Rnk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {psychomotorSkills.map((skill) => {
                        const term1Data = generateMockGradeData()
                        const term2Data = generateMockGradeData()
                        const term3Data = generateMockGradeData()
                        const yearAvg = Math.round((term1Data.mean + term2Data.mean + term3Data.mean) / 3)
                        const yearRank = generateRandomRank()

                        return (
                          <TableRow key={skill}>
                            <TableCell className="border font-medium">{skill}</TableCell>
                            {/* Term 1 */}
                            <TableCell className="border text-center">{term1Data.score1}</TableCell>
                            <TableCell className="border text-center">{term1Data.score2}</TableCell>
                            <TableCell className="border text-center">{term1Data.mean}</TableCell>
                            <TableCell className="border text-center">{term1Data.rank}</TableCell>
                            {/* Term 2 */}
                            <TableCell className="border text-center">{term2Data.score1}</TableCell>
                            <TableCell className="border text-center">{term2Data.score2}</TableCell>
                            <TableCell className="border text-center">{term2Data.mean}</TableCell>
                            <TableCell className="border text-center">{term2Data.rank}</TableCell>
                            {/* Term 3 */}
                            <TableCell className="border text-center">{term3Data.score1}</TableCell>
                            <TableCell className="border text-center">{term3Data.score2}</TableCell>
                            <TableCell className="border text-center">{term3Data.mean}</TableCell>
                            <TableCell className="border text-center">{term3Data.rank}</TableCell>
                            {/* Year */}
                            <TableCell className="border text-center">{yearAvg}</TableCell>
                            <TableCell className="border text-center">{yearRank}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Term Summary */}
              <div className="mt-8 print:mt-4">
                <h3 className="text-lg font-semibold mb-2 print:text-base">TERM SUMMARY</h3>
                <Table className="border-collapse w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border bg-muted"></TableHead>
                      <TableHead className="border text-center bg-muted">TERM 1</TableHead>
                      <TableHead className="border text-center bg-muted">TERM 2</TableHead>
                      <TableHead className="border text-center bg-muted">TERM 3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="border font-medium">Total Scores</TableCell>
                      <TableCell className="border text-center">{term1Stats.total}</TableCell>
                      <TableCell className="border text-center">{term2Stats.total}</TableCell>
                      <TableCell className="border text-center">{term3Stats.total}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="border font-medium">Percentage %</TableCell>
                      <TableCell className="border text-center">{term1Stats.percentage}%</TableCell>
                      <TableCell className="border text-center">{term2Stats.percentage}%</TableCell>
                      <TableCell className="border text-center">{term3Stats.percentage}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="border font-medium">Position</TableCell>
                      <TableCell className="border text-center">{term1Stats.position}</TableCell>
                      <TableCell className="border text-center">{term2Stats.position}</TableCell>
                      <TableCell className="border text-center">{term3Stats.position}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="border font-medium">Time Present</TableCell>
                      <TableCell className="border text-center">___________</TableCell>
                      <TableCell className="border text-center">___________</TableCell>
                      <TableCell className="border text-center">___________</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="border font-medium">Time Absent</TableCell>
                      <TableCell className="border text-center">___________</TableCell>
                      <TableCell className="border text-center">___________</TableCell>
                      <TableCell className="border text-center">___________</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Comments Section */}
              <div className="mt-8 print:mt-4">
                <h3 className="text-lg font-semibold mb-4 print:text-base">COMMENTS & SIGNATURES</h3>
                <div className="space-y-6">
                  <div>
                    <p className="font-medium mb-2">Class Teacher's Comment:</p>
                    <div className="border-b border-gray-300 h-8 mb-2"></div>
                    <p className="text-sm">Signature: ________________________</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Principal's Comment:</p>
                    <div className="border-b border-gray-300 h-8 mb-2"></div>
                    <p className="text-sm">Signature: ________________________</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
