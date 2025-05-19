"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  FileText,
  Accessibility,
  Activity,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { useFirebaseConnection } from "@/hooks/use-firebase-connection"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import Link from "next/link"
import { useOfflineStorage } from "@/hooks/use-offline-storage"
import { SyncManager } from "@/components/sync-manager"

export default function Dashboard() {
  const [schoolName, setSchoolName] = useState("Loading school name...")
  const [academicYear, setAcademicYear] = useState("2023-2024")
  const [stats, setStats] = useState([
    { title: "Total Students", value: "0", icon: Users, color: "bg-blue-100 text-blue-700" },
    { title: "Total Teachers", value: "0", icon: GraduationCap, color: "bg-green-100 text-green-700" },
    { title: "Total Classes", value: "0", icon: BookOpen, color: "bg-purple-100 text-purple-700" },
    { title: "Attendance Today", value: "0%", icon: ClipboardCheck, color: "bg-amber-100 text-amber-700" },
  ])
  const [specialNeedsStats, setSpecialNeedsStats] = useState({
    totalWithDisabilities: 0,
    totalWithMedicalConditions: 0,
    disabilityTypes: {},
    medicalConditionTypes: {},
  })
  const [loading, setLoading] = useState(true)
  const [schoolId, setSchoolId] = useState("")

  const { isConnected } = useFirebaseConnection()
  const { queryDocuments, getAll, downloadAllData } = useOfflineStorage()

  const attendanceData = [
    { month: "Jan", attendance: 92 },
    { month: "Feb", attendance: 95 },
    { month: "Mar", attendance: 88 },
    { month: "Apr", attendance: 91 },
    { month: "May", attendance: 94 },
    { month: "Jun", attendance: 89 },
  ]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Get current admin's school ID
        const adminId = localStorage.getItem("adminId")
        let currentSchoolId = ""
        let studentsList = []
        let teachersList = []
        let classesList = []

        // Try to get school admin data
        let schoolAdminData = []

        if (isConnected) {
          // Online mode - fetch from Firestore
          const adminSnapshot = await getDocs(collection(db, "schooladmin"))
          schoolAdminData = adminSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

          if (schoolAdminData.length > 0) {
            const schoolData = schoolAdminData[0]

            // Set school name from database
            if (schoolData.schoolname) {
              setSchoolName(schoolData.schoolname)
            } else if (schoolData.schoolName) {
              setSchoolName(schoolData.schoolName)
            }

            if (schoolData.academicYear) {
              setAcademicYear(schoolData.academicYear)
            }

            if (schoolData.school_id) {
              currentSchoolId = schoolData.school_id
              setSchoolId(currentSchoolId)
            }
          }

          // Fetch data with school ID filter
          if (currentSchoolId) {
            const studentsQuery = query(collection(db, "students"), where("school_id", "==", currentSchoolId))
            const teachersQuery = query(collection(db, "teachers"), where("school_id", "==", currentSchoolId))
            const classesQuery = query(collection(db, "classes"), where("school_id", "==", currentSchoolId))

            const [studentsSnapshot, teachersSnapshot, classesSnapshot] = await Promise.all([
              getDocs(studentsQuery),
              getDocs(teachersQuery),
              getDocs(classesQuery),
            ])

            studentsList = studentsSnapshot.docs.map((doc) => doc.data())
            teachersList = teachersSnapshot.docs.map((doc) => doc.data())
            classesList = classesSnapshot.docs.map((doc) => doc.data())

            // Download data for offline use
            await downloadAllData(currentSchoolId)
          }
        } else {
          // Offline mode - use IndexedDB
          schoolAdminData = await getAll("schooladmin")

          if (schoolAdminData.length > 0) {
            const schoolData = schoolAdminData[0]

            // Set school name from local database
            if (schoolData.schoolname) {
              setSchoolName(schoolData.schoolname)
            } else if (schoolData.schoolName) {
              setSchoolName(schoolData.schoolName)
            }

            if (schoolData.academicYear) {
              setAcademicYear(schoolData.academicYear)
            }

            if (schoolData.school_id) {
              currentSchoolId = schoolData.school_id
              setSchoolId(currentSchoolId)
            }
          }

          // Get data from IndexedDB with filtering
          if (currentSchoolId) {
            const studentsResult = await queryDocuments("students", [
              { field: "school_id", operator: "==", value: currentSchoolId },
            ])

            const teachersResult = await queryDocuments("teachers", [
              { field: "school_id", operator: "==", value: currentSchoolId },
            ])

            const classesResult = await queryDocuments("classes", [
              { field: "school_id", operator: "==", value: currentSchoolId },
            ])

            studentsList = studentsResult.success ? studentsResult.data : []
            teachersList = teachersResult.success ? teachersResult.data : []
            classesList = classesResult.success ? classesResult.data : []
          } else {
            // If no school ID, get all data
            studentsList = await getAll("students")
            teachersList = await getAll("teachers")
            classesList = await getAll("classes")
          }
        }

        // Calculate special needs statistics
        const studentsWithDisabilities = studentsList.filter((student) => student.disability === "Yes")
        const studentsWithMedicalConditions = studentsList.filter((student) => student.sick === "Yes")

        // Count disability types
        const disabilityTypes = {}
        studentsWithDisabilities.forEach((student) => {
          const type = student.disability_type || "Unspecified"
          disabilityTypes[type] = (disabilityTypes[type] || 0) + 1
        })

        // Count medical condition types
        const medicalConditionTypes = {}
        studentsWithMedicalConditions.forEach((student) => {
          const type = student.sick_type || "Unspecified"
          medicalConditionTypes[type] = (medicalConditionTypes[type] || 0) + 1
        })

        setSpecialNeedsStats({
          totalWithDisabilities: studentsWithDisabilities.length,
          totalWithMedicalConditions: studentsWithMedicalConditions.length,
          disabilityTypes,
          medicalConditionTypes,
        })

        // Update stats
        setStats([
          {
            title: "Total Students",
            value: studentsList.length.toString(),
            icon: Users,
            color: "bg-blue-100 text-blue-700",
          },
          {
            title: "Total Teachers",
            value: teachersList.length.toString(),
            icon: GraduationCap,
            color: "bg-green-100 text-green-700",
          },
          {
            title: "Total Classes",
            value: classesList.length.toString(),
            icon: BookOpen,
            color: "bg-purple-100 text-purple-700",
          },
          { title: "Attendance Today", value: "96%", icon: ClipboardCheck, color: "bg-amber-100 text-amber-700" },
        ])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: isConnected ? "Failed to load dashboard data" : "You're offline. Showing cached data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isConnected, getAll, queryDocuments, downloadAllData])

  // Prepare chart data for special needs
  const specialNeedsChartData = [
    { name: "With Disabilities", value: specialNeedsStats.totalWithDisabilities },
    { name: "With Medical Conditions", value: specialNeedsStats.totalWithMedicalConditions },
    {
      name: "Without Special Needs",
      value: Math.max(
        0,
        Number.parseInt(stats[0].value) -
          specialNeedsStats.totalWithDisabilities -
          specialNeedsStats.totalWithMedicalConditions,
      ),
    },
  ]

  // Colors for the pie chart
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658"]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{schoolName}</h1>
              <p className="text-sm md:text-base text-muted-foreground">Academic Year: {academicYear}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {schoolId && <SyncManager schoolId={schoolId} />}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Special Needs Section */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-purple-600" />
                <span>Students with Special Needs</span>
              </CardTitle>
              <Link href="/students?filter=special-needs">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Accessibility className="h-4 w-4 text-purple-600" />
                      <span>With Disabilities</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{specialNeedsStats.totalWithDisabilities}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-600" />
                      <span>With Medical Conditions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{specialNeedsStats.totalWithMedicalConditions}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={specialNeedsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {specialNeedsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm"
                  onClick={() => (window.location.href = "/students/add")}
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                  <span>Add Student</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm"
                  onClick={() => (window.location.href = "/timetable")}
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                  <span>Timetable</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm"
                  onClick={() => (window.location.href = "/attendance")}
                >
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                  <span>Attendance</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm"
                  onClick={() => (window.location.href = "/reports")}
                >
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                  <span>Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Monthly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="attendance" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Class Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { class: "JSS 1", average: 75 },
                      { class: "JSS 2", average: 82 },
                      { class: "JSS 3", average: 78 },
                      { class: "SSS 1", average: 85 },
                      { class: "SSS 2", average: 80 },
                      { class: "SSS 3", average: 88 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
