"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, Save, X, CheckCircle, AlertCircle } from "lucide-react"
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface GradePostingFormProps {
  teacherId: string
  teacherSubject: string
  schoolId: string
  onGradePosted: () => void
}

interface Student {
  id: string
  firstname: string
  lastname: string
  class: string
  school_id: string
}

interface GradeData {
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

export default function GradePostingForm({ 
  teacherId, 
  teacherSubject, 
  schoolId, 
  onGradePosted 
}: GradePostingFormProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [isPosting, setIsPosting] = useState(false)
  const [isBulkPosting, setIsBulkPosting] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkGrades, setBulkGrades] = useState<{ [studentId: string]: { score: string; comment: string } }>({})
  const [existingGrades, setExistingGrades] = useState<any[]>([])

  // Terms and years
  const terms = ["First Term", "Second Term", "Third Term"]
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch teacher's assigned classes
      const classesQuery = query(
        collection(db, "classes"),
        where("teacher_id", "==", teacherId)
      )
      const classesSnapshot = await getDocs(classesQuery)
      const teacherClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setClasses(teacherClasses)

      // Fetch subjects
      const subjectsSnapshot = await getDocs(collection(db, "subjects"))
      const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setSubjects(subjectsData)

      // Set default subject to teacher's subject
      if (teacherSubject) {
        const teacherSubjectObj = subjectsData.find(s => s.name === teacherSubject)
        if (teacherSubjectObj) {
          setSelectedSubject(teacherSubjectObj.id)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    }
  }

  const fetchStudentsByClass = async (classId: string) => {
    try {
      const studentsQuery = query(
        collection(db, "students"),
        where("class", "==", classId),
        where("school_id", "==", schoolId)
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setStudents(studentsData)

      // Initialize bulk grades
      const initialBulkGrades: { [studentId: string]: { score: string; comment: string } } = {}
      studentsData.forEach(student => {
        initialBulkGrades[student.id] = { score: "", comment: "" }
      })
      setBulkGrades(initialBulkGrades)

      // Check for existing grades
      await checkExistingGrades(classId)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
    }
  }

  const checkExistingGrades = async (classId: string) => {
    if (!selectedSubject || !selectedTerm || !selectedYear) return

    try {
      const gradesQuery = query(
        collection(db, "grades"),
        where("subject_id", "==", selectedSubject),
        where("term", "==", selectedTerm),
        where("year", "==", selectedYear),
        where("teacher_id", "==", teacherId)
      )
      const gradesSnapshot = await getDocs(gradesQuery)
      const existingGradesData = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setExistingGrades(existingGradesData)

      // Pre-fill existing grades in bulk form
      const updatedBulkGrades = { ...bulkGrades }
      existingGradesData.forEach(grade => {
        if (updatedBulkGrades[grade.student_id]) {
          updatedBulkGrades[grade.student_id] = {
            score: grade.score.toString(),
            comment: grade.comment || ""
          }
        }
      })
      setBulkGrades(updatedBulkGrades)
    } catch (error) {
      console.error("Error checking existing grades:", error)
    }
  }

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass(selectedClass)
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm && selectedYear) {
      checkExistingGrades(selectedClass)
    }
  }, [selectedSubject, selectedTerm, selectedYear])

  const handleBulkGradePost = async () => {
    if (!selectedSubject || !selectedTerm || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select all required fields",
        variant: "destructive",
      })
      return
    }

    setIsBulkPosting(true)
    try {
      const gradesToPost: GradeData[] = []
      const gradesToUpdate: { id: string; data: Partial<GradeData> }[] = []

      for (const [studentId, gradeData] of Object.entries(bulkGrades)) {
        if (gradeData.score.trim()) {
          const gradeInfo: GradeData = {
            student_id: studentId,
            subject_id: selectedSubject,
            term: selectedTerm,
            year: selectedYear,
            score: parseInt(gradeData.score),
            comment: gradeData.comment.trim() || undefined,
            teacher_id: teacherId,
            school_id: schoolId,
            created_at: new Date(),
            updated_at: new Date(),
          }

          // Check if grade already exists
          const existingGrade = existingGrades.find(g => g.student_id === studentId)
          if (existingGrade) {
            gradesToUpdate.push({
              id: existingGrade.id,
              data: {
                score: gradeInfo.score,
                comment: gradeInfo.comment,
                updated_at: new Date(),
              }
            })
          } else {
            gradesToPost.push(gradeInfo)
          }
        }
      }

      // Post new grades
      for (const grade of gradesToPost) {
        await addDoc(collection(db, "grades"), grade)
      }

      // Update existing grades
      for (const gradeUpdate of gradesToUpdate) {
        await updateDoc(doc(db, "grades", gradeUpdate.id), gradeUpdate.data)
      }

      toast({
        title: "Success",
        description: `Posted ${gradesToPost.length} new grades and updated ${gradesToUpdate.length} existing grades`,
      })

      setShowBulkForm(false)
      onGradePosted()
    } catch (error) {
      console.error("Error posting grades:", error)
      toast({
        title: "Error",
        description: "Failed to post grades",
        variant: "destructive",
      })
    } finally {
      setIsBulkPosting(false)
    }
  }

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student ? `${student.firstname} ${student.lastname}` : "Unknown Student"
  }

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId)
    return cls ? cls.name : "Unknown Class"
  }

  return (
    <div className="space-y-6">
      {/* Grade Posting Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Post Grades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
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
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
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
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && selectedSubject && selectedTerm && selectedYear && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {getClassName(selectedClass)}
                </Badge>
                <Badge variant="outline">
                  {getSubjectName(selectedSubject)}
                </Badge>
                <Badge variant="outline">
                  {selectedTerm} {selectedYear}
                </Badge>
                <Badge variant="outline">
                  {students.length} Students
                </Badge>
              </div>
              <Button onClick={() => setShowBulkForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Post Grades
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Grade Posting Dialog */}
      <Dialog open={showBulkForm} onOpenChange={setShowBulkForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Post Grades - {getClassName(selectedClass)} - {getSubjectName(selectedSubject)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedTerm}</Badge>
                <Badge variant="outline">{selectedYear}</Badge>
              </div>
              <Button 
                onClick={handleBulkGradePost} 
                disabled={isBulkPosting}
                className="flex items-center gap-2"
              >
                {isBulkPosting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Post All Grades
                  </>
                )}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score (0-100)</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const existingGrade = existingGrades.find(g => g.student_id === student.id)
                  const gradeData = bulkGrades[student.id] || { score: "", comment: "" }
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstname} {student.lastname}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={gradeData.score}
                          onChange={(e) => setBulkGrades(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id], score: e.target.value }
                          }))}
                          placeholder="Enter score"
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={gradeData.comment}
                          onChange={(e) => setBulkGrades(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id], comment: e.target.value }
                          }))}
                          placeholder="Optional comment"
                          className="min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        {existingGrade ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Edit className="h-3 w-3 mr-1" />
                            Update
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <Plus className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 