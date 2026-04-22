"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  FileText,
  Accessibility,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Target,
  Zap,
  ShieldAlert,
  Search,
  PlusCircle,
  Settings
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
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts"
import Link from "next/link"
import { getCurrentSchoolInfo, getTotalStudentCount } from "@/lib/school-utils"
import { useAuth } from "@/hooks/use-auth"
import FirstLoginModal from "@/components/first-login-modal"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function Dashboard() {
  const { admin } = useAuth()
  const [schoolInfo, setSchoolInfo] = useState({ name: "Loading...", stage: "", id: "" })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    students: { total: 0, trend: "+4%" },
    teachers: { total: 0, trend: "+1" },
    classes: { total: 0, trend: "Stable" },
    attendance: { rate: 0, trend: "-2%" }
  })
  
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false)

  // Real-time Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const info = await getCurrentSchoolInfo()
        setSchoolInfo({ name: info.schoolName, stage: info.stage || "Senior Secondary", id: info.school_id })
        
        if (info.school_id && info.school_id !== "unknown") {
          // 1. Parallel collection fetching
          const [students, teachers, classes, logs] = await Promise.all([
            getTotalStudentCount(info.school_id),
            supabase.from("teachers").select("id", { count: "exact" }).eq("school_id", info.school_id),
            supabase.from("classes").select("id", { count: "exact" }).eq("school_id", info.school_id),
            supabase.from("audit_logs").select("*").eq("school_id", info.school_id).order("created_at", { ascending: false }).limit(5)
          ])

          setStats({
            students: { total: students, trend: "+3.2%" },
            teachers: { total: teachers.count || 0, trend: "Stable" },
            classes: { total: classes.count || 0, trend: "+1 new" },
            attendance: { rate: 94.5, trend: "+1.2%" }
          })
          
          setAuditLogs(logs.data || [])
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err)
      } finally {
        setLoading(false)
      }
    }

    if (admin) fetchDashboardData()
  }, [admin])

  // Mock Performance Data
  const performanceData = [
    { name: "Week 1", score: 65, avg: 60 },
    { name: "Week 2", score: 72, avg: 65 },
    { name: "Week 3", score: 68, avg: 66 },
    { name: "Week 4", score: 85, avg: 70 },
  ]

  const enrolmentData = [
    { month: "Jan", count: 400 },
    { month: "Feb", count: 420 },
    { month: "Mar", count: 450 },
    { month: "Apr", count: 470 },
    { month: "May", count: 490 },
    { month: "Jun", count: 520 },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-900">{schoolInfo.name}</h1>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase px-3 py-1 font-bold tracking-widest text-[10px]">
                {schoolInfo.stage}
              </Badge>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> 2023-2024 Academic Session • Second Term
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 shadow-sm">
              <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
            </Button>
            <Link href="/reports">
              <Button size="sm" className="gap-2 shadow-md bg-slate-900">
                <FileText className="h-4 w-4" /> Generate Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Global KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Total Enrollment" 
            value={stats.students.total.toLocaleString()} 
            trend={stats.students.trend} 
            icon={Users} 
            color="indigo" 
          />
          <KPICard 
            title="Faculty Members" 
            value={stats.teachers.total} 
            trend={stats.teachers.trend} 
            icon={GraduationCap} 
            color="emerald" 
          />
          <KPICard 
            title="Active Classes" 
            value={stats.classes.total} 
            trend={stats.classes.trend} 
            icon={BookOpen} 
            color="amber" 
          />
          <KPICard 
            title="Daily Attendance" 
            value={`${stats.attendance.rate}%`} 
            trend={stats.attendance.trend} 
            icon={ClipboardCheck} 
            color="blue" 
            isTrendPositive={stats.attendance.trend.startsWith('+')} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Academic Pulse */}
          <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-white/70 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" /> Academic Pulse
                </CardTitle>
                <CardDescription>Average student performance across all subjects.</CardDescription>
              </div>
              <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs px-3 bg-white shadow-sm">Termly</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs px-3">Weekly</Button>
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  <Line type="monotone" dataKey="avg" stroke="#94A3B8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Registry Summary */}
          <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Enrollment Progress</CardTitle>
                <CardDescription>Target: 600 Students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Current Enrollment</span>
                    <span className="text-indigo-600">{Math.round((stats.students.total / 600) * 100)}%</span>
                  </div>
                  <Progress value={(stats.students.total / 600) * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-black text-slate-800">42</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">New Admissons</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-slate-800">12</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Withdrawals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 bg-indigo-600 text-white overflow-hidden relative">
              <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/10" />
              <CardHeader>
                <CardTitle className="text-lg font-bold">Pending Tasks</CardTitle>
                <CardDescription className="text-indigo-100">Action items requiring attention.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/20">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Verify 12 New Admissions</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/20">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">Set Termly Broadsheets</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Audit Log */}
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4" /> System Audit Feed
                </CardTitle>
                <Link href="/audit-logs">
                  <Button variant="ghost" size="sm" className="text-xs">View Full Log</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic text-sm">
                    No recent activity logs found.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className={cn(
                        "p-2 rounded-lg",
                        log.action === 'INSERT' ? "bg-emerald-50 text-emerald-600" :
                        log.action === 'UPDATE' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                      )}>
                        {log.action === 'INSERT' ? <PlusCircle className="h-4 w-4" /> : 
                         log.action === 'UPDATE' ? <Zap className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {log.table_name.replace(/_/g, ' ').toUpperCase()} {log.action.toLowerCase()}
                        </p>
                        <p className="text-xs text-slate-500 truncate">Modified ID: {log.record_id.slice(-8)}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Launch Panel */}
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quick Launch Panel</CardTitle>
              <CardDescription>Instant access to core administrative modules.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <QuickAction 
                title="Add Student" 
                href="/students/add" 
                icon={Users} 
                description="Fast-track admission"
              />
              <QuickAction 
                title="Schedule" 
                href="/timetable" 
                icon={Calendar} 
                description="Manage room slots"
              />
              <QuickAction 
                title="Grading Engine" 
                href="/academic-setup" 
                icon={Settings} 
                description="Config formulas"
              />
              <QuickAction 
                title="Reports" 
                href="/reports" 
                icon={FileText} 
                description="Print broadsheets"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <FirstLoginModal
        isOpen={showFirstLoginModal}
        onClose={() => setShowFirstLoginModal(false)}
        userId={admin?.id || ""}
        userEmail={admin?.email || ""}
      />
    </DashboardLayout>
  )
}

function KPICard({ title, value, trend, icon: Icon, color, isTrendPositive = true }: any) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500"
  }

  return (
    <Card className="border-none shadow-lg shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className={cn("absolute right-0 top-0 h-full w-1.5", colorMap[color])} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
        <div className={cn("p-2 rounded-xl text-white shadow-lg", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-black text-slate-900">{value}</div>
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full",
            isTrendPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            <TrendingUp className={cn("h-3 w-3", !isTrendPositive && "rotate-180")} />
            {trend}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickAction({ title, href, icon: Icon, description }: any) {
  return (
    <Link href={href}>
      <div className="group p-4 rounded-2xl border bg-white hover:bg-slate-900 hover:border-slate-900 transition-all duration-300 cursor-pointer shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-white/10 group-hover:text-white transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold group-hover:text-white">{title}</p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-400">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

function HistoryIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}
