"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardCheck, Calendar, Search, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { doc, setDoc, collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedClass, setSelectedClass] = useState("")
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: string }>({})
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0,
  })
  const [teacherAttendanceRecords, setTeacherAttendanceRecords] = useState<any[]>([])
  const [teacherAttendanceLoading, setTeacherAttendanceLoading] = useState(false)

  useEffect(() => {
    const loadSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      setSchoolInfo(info)
    }

    loadSchoolInfo()
  }, [])

  const fetchClasses = async () => {
    try {
      if (!schoolInfo.school_id) return

      const classesRef = collection(db, "classes")
      const q = query(classesRef, where("school_id", "==", schoolInfo.school_id))
      const querySnapshot = await getDocs(classesRef)

      const classesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setClasses(classesList)
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchStudentsByClass = async (classId: string) => {
    setIsLoading(true)
    try {
      if (!schoolInfo.school_id) return

      const studentsRef = collection(db, "students")
      const q = query(
        studentsRef,
        where("school_id", "==", schoolInfo.school_id),
        where("class", "==", classId),
        orderBy("lastname", "asc"),
      )
      const querySnapshot = await getDocs(q)

      const studentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setStudents(studentsList)

      // Initialize attendance data
      const initialAttendanceData: { [key: string]: string } = {}
      studentsList.forEach((student) => {
        initialAttendanceData[student.id] = "present"
      })
      setAttendanceData(initialAttendanceData)

      // Update summary
      updateAttendanceSummary(initialAttendanceData, studentsList.length)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAttendanceRecords = async (classId: string, date: string) => {
    setIsLoading(true)
    try {
      if (!schoolInfo.school_id) return

      const attendanceRef = collection(db, "attendance")
      const q = query(
        attendanceRef,
        where("school_id", "==", schoolInfo.school_id),
        where("class_id", "==", classId),
        where("date", "==", date),
      )
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const record = querySnapshot.docs[0].data()
        setAttendanceRecords([
          {
            id: querySnapshot.docs[0].id,
            ...record,
          },
        ])

        // Set attendance data from record
        if (record.students) {
          setAttendanceData(record.students)
          updateAttendanceSummary(record.students, students.length)
        }
      } else {
        setAttendanceRecords([])

        // Reset to default attendance (all present)
        const initialAttendanceData: { [key: string]: string } = {}
        students.forEach((student) => {
          initialAttendanceData[student.id] = "present"
        })
        setAttendanceData(initialAttendanceData)
        updateAttendanceSummary(initialAttendanceData, students.length)
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAttendanceSummary = (data: { [key: string]: string }, totalStudents: number) => {
    const present = Object.values(data).filter((status) => status === "present").length
    const absent = Object.values(data).filter((status) => status === "absent").length
    const late = Object.values(data).filter((status) => status === "late").length
    const percentage = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0

    setAttendanceSummary({
      present,
      absent,
      late,
      total: totalStudents,
      percentage,
    })
  }

  useEffect(() => {
    if (schoolInfo.school_id) {
      fetchClasses()
    }
  }, [schoolInfo.school_id])

  useEffect(() => {
    if (selectedClass && selectedDate && schoolInfo.school_id) {
      fetchStudentsByClass(selectedClass)
      fetchAttendanceRecords(selectedClass, selectedDate)
    }
  }, [selectedClass, selectedDate, schoolInfo.school_id])

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData((prev) => {
      const newData = { ...prev, [studentId]: status }
      updateAttendanceSummary(newData, students.length)
      return newData
    })
  }

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast({
        title: "Warning",
        description: "Please select a class and date",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Generate a unique ID
      const attendanceId = `ATT_${selectedClass}_${selectedDate.replace(/-/g, "")}`

      // Get class name
      const classObj = classes.find((c) => c.id === selectedClass)
      const className = classObj ? classObj.name : ""

      // Create attendance record
      const attendanceRecord = {
        id: attendanceId,
        class_id: selectedClass,
        class_name: className,
        date: selectedDate,
        students: attendanceData,
        present_count: attendanceSummary.present,
        absent_count: attendanceSummary.absent,
        late_count: attendanceSummary.late,
        total_students: attendanceSummary.total,
        attendance_percentage: attendanceSummary.percentage,
        created_at: Timestamp.fromDate(new Date()),
        school_id: schoolInfo.school_id,
        schoolname: schoolInfo.schoolName,
      }

      // Save to Firestore
      await setDoc(doc(db, "attendance", attendanceId), attendanceRecord)

      // Show success message
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      })

      // Refresh attendance records
      fetchAttendanceRecords(selectedClass, selectedDate)
    } catch (error) {
      console.error("Error recording attendance:", error)
      toast({
        title: "Error",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    return (
      student.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Present</span>
          </div>
        )
      case "absent":
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Absent</span>
          </div>
        )
      case "late":
        return (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span>Late</span>
          </div>
        )
      default:
        return null
    }
  }

  const fetchTeacherAttendance = async (date: string) => {
    setTeacherAttendanceLoading(true)
    try {
      if (!schoolInfo.school_id) return

      const attendanceRef = collection(db, "teacher_attendance")
      const q = query(attendanceRef, where("school_id", "==", schoolInfo.school_id), where("date", "==", date))
      const querySnapshot = await getDocs(q)

      const records = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setTeacherAttendanceRecords(records)
    } catch (error) {
      console.error("Error fetching teacher attendance:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher attendance records",
        variant: "destructive",
      })
    } finally {
      setTeacherAttendanceLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Attendance</CardTitle>
          <Button onClick={() => setIsMarkingAttendance(true)} disabled={!selectedClass || students.length === 0}>
            <ClipboardCheck className="w-4 h-4 mr-2" />
            <span>Mark Attendance</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Total Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Present</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.present}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Absent</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.absent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>Late</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.late}</div>
              </CardContent>
            </Card>
          </div>
          <Tabs defaultValue="students">
            <TabsList className="mb-4">
              <TabsTrigger value="students">Student Attendance</TabsTrigger>
              <TabsTrigger value="teachers">Teacher Attendance</TabsTrigger>
            </TabsList>
            <TabsContent value="students">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-4">
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="w-full md:w-auto">
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.level} {cls.section || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-auto flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full md:w-auto"
                    />
                  </div>
                  <div className="w-full md:w-auto relative">
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
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !selectedClass ? (
                <div className="text-center py-8 text-muted-foreground">Please select a class to view attendance.</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No students found in this class.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{`${student.firstname} ${student.lastname}`}</TableCell>
                          <TableCell>{student.id}</TableCell>
                          <TableCell>
                            {isMarkingAttendance ? (
                              <Select
                                value={attendanceData[student.id] || "present"}
                                onValueChange={(value) => handleAttendanceChange(student.id, value)}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              getStatusBadge(attendanceData[student.id] || "present")
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {isMarkingAttendance && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setIsMarkingAttendance(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmitAttendance} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Attendance"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="teachers">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full md:w-auto"
                  />
                  <Button variant="outline" onClick={() => fetchTeacherAttendance(selectedDate)}>
                    View Records
                  </Button>
                </div>

                {teacherAttendanceLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : teacherAttendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No teacher attendance records found for this date.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Teacher Name</TableHead>
                          <TableHead>Check-in Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacherAttendanceRecords.map((record, index) => (
                          <TableRow key={record.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{record.teacher_name}</TableCell>
                            <TableCell>{record.check_in_time || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>Present</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
