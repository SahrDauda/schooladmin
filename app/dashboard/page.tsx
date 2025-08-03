"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore"
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
import { getCurrentSchoolInfo, getTotalStudentCount } from "@/lib/school-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"


type SchoolAdmin = {
  id: string
  schoolname?: string
  schoolName?: string
  academicYear?: string
  school_id?: string
  // add any other fields you use
}

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
  const [genderStats, setGenderStats] = useState({
    totalMale: 0,
    totalFemale: 0,
    genderByClass: [] as any[]
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schoolId, setSchoolId] = useState("")
  const [schoolStage, setSchoolStage] = useState<string | undefined>(undefined)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Check if this is first time login
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const checkFirstTimeLogin = () => {
        const adminId = localStorage.getItem("adminId")
        if (adminId) {
          // Check if this is the first time login by checking if password was just set
          const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore")
          if (hasLoggedInBefore === "false") {
            setIsFirstTimeLogin(true)
            setShowPasswordModal(true)
          }
        }
      }
      
      checkFirstTimeLogin()
    }
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)

    try {
      // Validate passwords
      if (password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        })
        return
      }

      if (password !== confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure both passwords are the same.",
          variant: "destructive",
        })
        return
      }

      // Update password in Firestore
      const adminId = localStorage.getItem("adminId")
      if (adminId) {
        await updateDoc(doc(db, "schooladmin", adminId), {
          password: password
        })

        // Mark as logged in for the first time
        localStorage.setItem("hasLoggedInBefore", "true")

        toast({
          title: "Password Set Successfully",
          description: "Your password has been set. Welcome to the system!",
        })

        setShowPasswordModal(false)
        setPassword("")
        setConfirmPassword("")
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  // Attendance data for chart
  const attendanceData = [
    { month: "Jan", attendance: 92 },
    { month: "Feb", attendance: 95 },
    { month: "Mar", attendance: 88 },
    { month: "Apr", attendance: 91 },
    { month: "May", attendance: 94 },
    { month: "Jun", attendance: 89 },
  ]

  // Optimized data loading with skeleton UI
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        console.log("Fetching dashboard data...")
        
        const schoolInfo = await getCurrentSchoolInfo()
        console.log("School info:", schoolInfo)
        
        setSchoolName(schoolInfo.schoolName)
        setSchoolStage(schoolInfo.stage)
        const schoolId = schoolInfo.school_id

        if (schoolId && schoolId !== "unknown" && schoolId !== "error") {
          // Use Promise.all to fetch data in parallel
          const [studentsSnapshot, teachersSnapshot, classesSnapshot] = await Promise.all([
            getDocs(query(collection(db, "students"), where("school_id", "==", schoolId))),
            getDocs(query(collection(db, "teachers"), where("school_id", "==", schoolId))),
            getDocs(query(collection(db, "classes"), where("school_id", "==", schoolId))),
          ])

          const studentsList = studentsSnapshot.docs.map((doc) => doc.data())
          const teachersList = teachersSnapshot.docs.map((doc) => doc.data())
          const classesList = classesSnapshot.docs.map((doc) => doc.data())

          // Get accurate total student count using utility function
          const totalStudentCount = await getTotalStudentCount(schoolId)

          // Calculate special needs statistics
          const studentsWithDisabilities = studentsList.filter((student) => student.disability === "Yes")
          const studentsWithMedicalConditions = studentsList.filter((student) => student.sick === "Yes")

          // Count disability types
          const disabilityTypes: Record<string, number> = {}
          studentsWithDisabilities.forEach((student) => {
            const type = student.disability_type || "Unspecified"
            disabilityTypes[type] = (disabilityTypes[type] || 0) + 1
          })

          // Count medical condition types
          const medicalConditionTypes: Record<string, number> = {}
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

          // Calculate gender statistics
          const maleStudents = studentsList.filter((student) => student.gender === "Male")
          const femaleStudents = studentsList.filter((student) => student.gender === "Female")
          
          // Calculate gender by class
          const genderByClass: any[] = []
          const classGroups = studentsList.reduce((acc: any, student) => {
            const className = student.class || "Unknown"
            if (!acc[className]) {
              acc[className] = { male: 0, female: 0 }
            }
            if (student.gender === "Male") {
              acc[className].male++
            } else if (student.gender === "Female") {
              acc[className].female++
            }
            return acc
          }, {})

          Object.entries(classGroups).forEach(([className, counts]: [string, any]) => {
            genderByClass.push({
              class: className,
              male: counts.male,
              female: counts.female,
              total: counts.male + counts.female
            })
          })

          setGenderStats({
            totalMale: maleStudents.length,
            totalFemale: femaleStudents.length,
            genderByClass
          })

          // Update stats
          setStats([
            {
              title: "Total Students",
              value: totalStudentCount.toString(),
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
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Check for refresh flag from students page
    const checkRefreshFlag = () => {
      const refreshFlag = localStorage.getItem("refreshClasses")
      if (refreshFlag === "true") {
        localStorage.removeItem("refreshClasses")
        fetchData()
      }
    }

    // Set up interval to check for refresh flag
    const interval = setInterval(checkRefreshFlag, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [])



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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col space-y-4">
            {/* Skeleton for school info */}
            <div className="flex flex-col gap-2">
              <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-md"></div>
              <div className="h-4 w-40 bg-gray-200 animate-pulse rounded-md"></div>
            </div>

            {/* Skeleton for stat cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="flex flex-col justify-between">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded-md"></div>
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-6 w-12 bg-gray-200 animate-pulse rounded-md"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Dashboard Unavailable</h2>
            <p className="text-muted-foreground">Please try refreshing the page or contact support if the problem persists.</p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{schoolName}</h1>
              {schoolStage && (
                <Card className="py-1 px-3 flex items-center shadow-none border-none" style={{ backgroundColor: schoolStage === 'Primary' ? '#fee2e2' : schoolStage === 'Junior Secondary' ? '#dbeafe' : schoolStage === 'Senior Secondary' ? '#dcfce7' : '#f3f4f6' }}>
                  <span className="font-semibold text-sm" style={{ color: schoolStage === 'Primary' ? '#b91c1c' : schoolStage === 'Junior Secondary' ? '#1d4ed8' : schoolStage === 'Senior Secondary' ? '#15803d' : '#6b7280' }}>
                    {schoolStage}
                  </span>
                </Card>
              )}
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Academic Year: {academicYear}</p>
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
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
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

        {/* Gender Statistics Section */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Total Male vs Female</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Male", value: genderStats.totalMale, color: "#3b82f6" },
                        { name: "Female", value: genderStats.totalFemale, color: "#ec4899" }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ec4899" />
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
              <CardTitle className="text-lg md:text-xl">Gender Distribution by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderStats.genderByClass}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#3b82f6" name="Male" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="female" fill="#ec4899" name="Female" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-[500px] w-[90%]">
          <DialogHeader>
            <DialogTitle className="text-center">
              {isFirstTimeLogin ? "Set Your Password" : "Change Password"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                {isFirstTimeLogin ? "Setting password for:" : "Changing password for:"}
              </p>
              <p className="font-medium">
                {typeof window !== "undefined" && localStorage.getItem("adminName") 
                  ? localStorage.getItem("adminName") 
                  : "Admin"}
              </p>
              {isFirstTimeLogin && (
                <p className="text-xs text-muted-foreground mt-2">
                  Welcome! Please set your password to complete your account setup.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordModal(false)}
                disabled={changingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? (isFirstTimeLogin ? "Setting..." : "Changing...") : (isFirstTimeLogin ? "Set Password" : "Change Password")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
