"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  TrendingUp,
  Download,
  Calendar,
  Search,
  Zap,
  Activity,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Shapes,
  Mail
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { cn } from "@/lib/utils"

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState("")
  const [reportData, setReportData] = useState({
    students: [] as any[],
    teachers: [] as any[],
    classes: [] as any[],
    attendance: [] as any[],
    performance: [] as any[],
  })

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const adminId = localStorage.getItem("adminId")
      const { data: admin } = await supabase.from('schooladmin').select('school_id').eq('id', adminId).single()
      const schoolId = admin?.school_id || adminId

      // Fetch in parallel
      const [students, teachers, classes, attendance, grades] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', schoolId),
        supabase.from('teachers').select('*').eq('school_id', schoolId),
        supabase.from('classes').select('*').eq('school_id', schoolId),
        supabase.from('attendance').select('*').eq('school_id', schoolId).limit(100),
        supabase.from('grades').select('*').eq('school_id', schoolId),
      ])

      setReportData({
        students: students.data || [],
        teachers: teachers.data || [],
        classes: classes.data || [],
        attendance: attendance.data || [],
        performance: grades.data || [],
      })
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to sync analytics data.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Derived Analytics Mock/Real
  const subjectPerformance = [
    { subject: "Mathematics", avg: 72, pass: 88 },
    { subject: "English", avg: 85, pass: 95 },
    { subject: "Physics", avg: 64, pass: 70 },
    { subject: "Chemistry", avg: 68, pass: 75 },
    { subject: "Biology", avg: 77, pass: 82 },
  ]

  const enrollmentTrend = [
    { year: "2020", count: 320 },
    { year: "2021", count: 380 },
    { year: "2022", count: 450 },
    { year: "2023", count: 580 },
  ]

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-indigo-600" /> Statistics & Intelligence
            </h1>
            <p className="text-slate-500 font-medium">International standard academic auditing & growth tracking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 rounded-xl shadow-sm">
              <Download className="h-4 w-4" /> Export Data
            </Button>
            <Button className="gap-2 rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700">
              <Mail className="h-4 w-4" /> Share with MBSSE
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit border">
            <TabsTrigger value="overview" className="rounded-xl px-6 py-2 data-[state=active]:shadow-md">Overview</TabsTrigger>
            <TabsTrigger value="academic" className="rounded-xl px-6 py-2 data-[state=active]:shadow-md">subject metrics</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-xl px-6 py-2 data-[state=active]:shadow-md">Attendance Map</TabsTrigger>
            <TabsTrigger value="demographics" className="rounded-xl px-6 py-2 data-[state=active]:shadow-md">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Enrollment Growth */}
              <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" /> Enrollment Velocity
                  </CardTitle>
                  <CardDescription>Year-over-year student population growth.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enrollmentTrend}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Heat */}
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-400" /> Academic Heat
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Top performing classes this term.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { class: "SSS 3 Science", score: 92, status: "Apex" },
                    { class: "JSS 2 Alpha", score: 88, status: "Rising" },
                    { class: "SSS 1 Art", score: 84, status: "Rising" },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span>{item.class}</span>
                        <span className="text-orange-400">{item.score}%</span>
                      </div>
                      <Progress value={item.score} className="h-1 bg-white/10" indicatorClassName="bg-orange-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic">
            <Card className="border-none shadow-xl shadow-slate-200/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Shapes className="h-5 w-5 text-indigo-500" /> Subject Analytics
                  </CardTitle>
                  <CardDescription>Comparative analysis of pass rates and average scores.</CardDescription>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Streams" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="h-[400px] pt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="circle" />
                    <Bar dataKey="avg" name="Avg Score" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={24} />
                    <Bar dataKey="pass" name="Pass Rate %" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card className="border-none shadow-xl shadow-slate-200/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" /> Attendance Heatmap
                </CardTitle>
                <CardDescription>Monthly visual breakdown of school-wide attendance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {/* Mock Heatmap Grid */}
                  {Array.from({length: 31}).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-12 rounded-xl flex items-center justify-center text-[10px] font-bold border",
                        i % 5 === 0 ? "bg-red-50 text-red-700 border-red-100" : 
                        i % 7 === 0 ? "bg-slate-50 text-slate-400 border-slate-100 italic" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-t pt-6">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /> High (&gt;90%)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-400 rounded-sm" /> Normal (75-90%)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-sm" /> Critical (&lt;75%)</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl shadow-slate-200/50">
                <CardHeader><CardTitle className="text-lg">Gender Balance</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: "Male", value: reportData.students.filter(s => s.gender === "Male").length },
                          { name: "Female", value: reportData.students.filter(s => s.gender === "Female").length }
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#6366F1" />
                        <Cell fill="#EC4899" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 bg-indigo-600 text-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Standard Broadsheet Export</CardTitle>
                  <CardDescription className="text-indigo-100">Official formatting for term-end records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl bg-white/10 border border-white/20 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Combined Termly Broadsheet</p>
                      <p className="text-[10px] text-indigo-100 uppercase tracking-tighter">Ready for Download</p>
                    </div>
                    <Button size="icon" variant="ghost" className="hover:bg-white/20"><Download className="h-4 w-4" /></Button>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10 border border-white/20 flex items-center justify-between opacity-50">
                    <div>
                      <p className="font-bold text-sm">MBSSE Compliance Export</p>
                      <p className="text-[10px] text-indigo-100 uppercase tracking-tighter">Locked until Term End</p>
                    </div>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}