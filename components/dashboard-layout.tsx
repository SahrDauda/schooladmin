"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  Calendar,
  FileText,
  BookOpen,
  MessageSquare,
  Menu,
  Bell,
  Settings,
  LogOut,
  UserCog,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ConnectionStatus } from "@/components/ui/connection-status"
import { SchoolTechLogo } from "@/components/school-tech-logo"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminName, setAdminName] = useState("Admin User")
  const [adminRole, setAdminRole] = useState("Administrator")
  const [isMobile, setIsMobile] = useState(false)

  const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: Users },
    { name: "Classes", href: "/classes", icon: BookOpen },
    { name: "Teachers", href: "/teachers", icon: GraduationCap },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { name: "Timetable", href: "/timetable", icon: Calendar },
    { name: "Grades", href: "/grades", icon: FileText },
    { name: "Subjects", href: "/subjects", icon: BookOpen },
    { name: "Reports", href: "/reports", icon: MessageSquare },
    { name: "Administrators", href: "/admin", icon: UserCog },
  ]

  useEffect(() => {
    const adminId = localStorage.getItem("adminId")
    if (!adminId && pathname !== "/") {
      router.push("/")
      return
    }

    const storedName = localStorage.getItem("adminName")
    const storedRole = localStorage.getItem("adminRole")

    if (storedName) setAdminName(storedName)
    if (storedRole) setAdminRole(storedRole)

    if (adminId) {
      const fetchAdminData = async () => {
        try {
          const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            if (adminData.name) {
              setAdminName(adminData.name)
              localStorage.setItem("adminName", adminData.name)
            }
            if (adminData.role) {
              setAdminRole(adminData.role)
              localStorage.setItem("adminRole", adminData.role)
            }
          }
        } catch (error) {
          console.error("Error fetching admin data:", error)
        }
      }

      fetchAdminData()
    }
  }, [pathname, router])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("adminId")
    localStorage.removeItem("adminName")
    localStorage.removeItem("adminRole")
    router.push("/")
  }

  const handleNavigation = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <header className="fixed top-0 right-0 z-40 w-full md:w-[calc(100%-16rem)] border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-expanded={sidebarOpen}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 md:text-center">
            <h1 className="text-lg font-semibold">School Admin Panel</h1>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-[#1E3A5F] text-white",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <SchoolTechLogo size="xs" className="py-1" />
            <span className="text-lg font-bold">Skultɛk</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/5 hover:text-white",
                  )}
                  onClick={handleNavigation}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-md px-4 py-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback className="bg-white/10 text-white">
                {adminName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{adminName}</span>
              <span className="text-xs text-gray-400">{adminRole}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className={cn("pt-24", "md:ml-64", "min-h-screen", "p-6")}>{children}</main>

      <ConnectionStatus />
    </div>
  )
}
