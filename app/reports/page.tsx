"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Download,
  Calendar,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface ReportData {
  students: any[]
  teachers: any[]
  classes: any[]
  grades: any[]
  attendance: any[]
  teacherAttendance: any[]
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [schoolInfo, setSchoolInfo] = useState({ school_id: "", schoolName: "" })
  const [reportData, setReportData] = useState<ReportData>({
    students: [],
    teachers: [],
    classes: [],
    grades: [],
    attendance: [],
    teacherAttendance: [],
  })
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedReport, setSelectedReport] = useState("overview")

  useEffect(() => {
    const loadSchoolInfo = async () => {
      const info = await getCurrentSchoolInfo()
      setSchoolInfo(info)
    }

    loadSchoolInfo()
  }, [])

  useEffect(() => {
    if (schoolInfo.school_id) {
      fetchReportData()
    }
  }, [schoolInfo.school_id])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const [studentsSnapshot, teachersSnapshot, classesSnapshot, gradesSnapshot, attendanceSnapshot, teacherAttendanceSnapshot] = await Promise.all([
        getDocs(query(collection(db, "students"), where("school_id", "==", schoolInfo.school_id))),
        getDocs(query(collection(db, "teachers"), where("school_id", "==", schoolInfo.school_id))),
        getDocs(query(collection(db, "classes"), where("school_id", "==", schoolInfo.school_id))),
        getDocs(query(collection(db, "grades"), where("school_id", "==", schoolInfo.school_id), orderBy("created_at", "desc"), limit(100))),
        getDocs(query(collection(db, "attendance"), where("school_id", "==", schoolInfo.school_id), orderBy("date", "desc"), limit(50))),
        getDocs(query(collection(db, "teacher_sign_in"), where("school_id", "==", schoolInfo.school_id), orderBy("created_at", "desc"), limit(50))),
      ])

      setReportData({
        students: studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        teachers: teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        classes: classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        grades: gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        attendance: attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        teacherAttendance: teacherAttendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      })
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (type: string) => {
    try {
      toast({
        title: "Generating Report",
        description: `Generating ${type} report...`,
      })
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Report Generated",
        description: `${type} report has been generated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    }
  }

  const exportReport = async (type: string) => {
    try {
      toast({
        title: "Exporting Report",
        description: `Exporting ${type} report...`,
      })
      
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Report Exported",
        description: `${type} report has been exported successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      })
    }
  }

  // Calculate summary statistics
  const summaryStats = {
    totalStudents: reportData.students.length,
    totalTeachers: reportData.teachers.length,
    totalClasses: reportData.classes.length,
    averageAttendance: reportData.attendance.length > 0 
      ? Math.round(reportData.attendance.reduce((sum, record) => sum + (record.attendance_percentage || 0), 0) / reportData.attendance.length)
      : 0,
    teacherAttendanceRate: reportData.teacherAttendance.length > 0 
      ? Math.round((reportData.teacherAttendance.filter(record => record.status === "signed_in").length / reportData.teacherAttendance.length) * 100)
      : 0,
  }

  // Prepare chart data
  const attendanceChartData = reportData.attendance.slice(0, 7).map(record => ({
    date: record.date,
    attendance: record.attendance_percentage || 0,
  }))

  const classDistributionData = reportData.classes.map(cls => ({
    name: cls.name,
    students: cls.students_count || 0,
    capacity: cls.capacity || 0,
  }))

  const genderDistributionData = [
    {
      name: "Male",
      value: reportData.students.filter(s => s.gender === "Male").length,
      color: "#3b82f6"
    },
    {
      name: "Female", 
      value: reportData.students.filter(s => s.gender === "Female").length,
      color: "#ec4899"
    }
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive school reports and performance analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generateReport("comprehensive")}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button onClick={() => exportReport("all")}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">Teaching staff</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.averageAttendance}%</div>
              <p className="text-xs text-muted-foreground">Student attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Teacher Attendance</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.teacherAttendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Staff attendance</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Attendance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="attendance" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gender Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={genderDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {genderDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Class Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Class Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="students" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.attendance.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{record.class_name}</p>
                          <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
                        <Badge variant="outline">{record.attendance_percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportData.classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => generateReport("academic")}>
                      Generate Academic Report
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Average Grade</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.students.slice(0, 10).map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>{`${student.firstname} ${student.lastname}`}</TableCell>
                            <TableCell>{student.class}</TableCell>
                            <TableCell>85%</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-[200px]"
                    />
                    <Button variant="outline" onClick={() => generateReport("attendance")}>
                      Generate Attendance Report
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.attendance.slice(0, 10).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.class_name}</TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.present_count}</TableCell>
                            <TableCell>{record.absent_count}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{record.attendance_percentage}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Staff Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => generateReport("staff")}>
                      Generate Staff Report
                    </Button>
                    <Button variant="outline" onClick={() => exportReport("staff")}>
                      Export Staff Data
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teacher</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Classes</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.teachers.map((teacher) => (
                          <TableRow key={teacher.id}>
                            <TableCell>{`${teacher.firstname} ${teacher.lastname}`}</TableCell>
                            <TableCell>{teacher.subject || "Not assigned"}</TableCell>
                            <TableCell>
                              {reportData.classes.filter(cls => cls.teacher_id === teacher.id).length}
                            </TableCell>
                            <TableCell>95%</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 