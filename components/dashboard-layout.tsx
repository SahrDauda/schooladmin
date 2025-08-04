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
  X,
  CheckCheck,
  User,
  Shield,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SchoolTechLogo } from "@/components/school-tech-logo"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: 'welcome' | 'password_change' | 'system' | 'info'
  read: boolean
  created_at: Timestamp
  admin_id: string
  action_url?: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminName, setAdminName] = useState("Admin User")
  const [adminRole, setAdminRole] = useState("Principal")
  const [adminGender, setAdminGender] = useState("")
  const [adminImage, setAdminImage] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)

  const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: Users },
    { name: "Classes", href: "/classes", icon: BookOpen },
    { name: "Teachers", href: "/teachers", icon: GraduationCap },
    { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { name: "Timetable", href: "/timetable", icon: Calendar },
    { name: "Grades", href: "/grades", icon: FileText },
    { name: "Subjects", href: "/subjects", icon: BookOpen },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Reports", href: "/reports", icon: MessageSquare },
  ]

  useEffect(() => {
    const adminId = localStorage.getItem("adminId")
    if (!adminId && pathname !== "/") {
      router.push("/")
      return
    }

    const storedName = localStorage.getItem("adminName")
    const storedRole = localStorage.getItem("adminRole")
    const storedGender = localStorage.getItem("adminGender")

    if (storedName) setAdminName(storedName)
    if (storedGender) setAdminGender(storedGender)
    // Always set role to "Principal" regardless of database value
    setAdminRole("Principal")

    if (adminId) {
      const fetchAdminData = async () => {
        try {
          const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
                      if (adminData.adminname) {
            setAdminName(adminData.adminname)
            localStorage.setItem("adminName", adminData.adminname)
          } else if (adminData.adminName) {
            setAdminName(adminData.adminName)
            localStorage.setItem("adminName", adminData.adminName)
          } else if (adminData.name) {
              setAdminName(adminData.name)
              localStorage.setItem("adminName", adminData.name)
            }
          
          // Set gender for title
          if (adminData.gender) {
            setAdminGender(adminData.gender)
            localStorage.setItem("adminGender", adminData.gender)
          }
            // Always set role to "Principal" and store it
            setAdminRole("Principal")
            localStorage.setItem("adminRole", "Principal")
            
            // Set admin image
            if (adminData.admin_images) {
              setAdminImage(adminData.admin_images)
            }
          }
        } catch (error) {
          console.error("Error fetching admin data:", error)
        }
      }

      fetchAdminData()
      fetchNotifications()
    }
  }, [pathname, router])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch notifications when adminId is available
  useEffect(() => {
    const adminId = localStorage.getItem("adminId")
    if (adminId) {
      fetchNotifications()
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  const handleNavigation = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const getFormattedName = () => {
    let title = ""
    if (adminGender === "Male") {
      title = "Mr "
    } else if (adminGender === "Female") {
      title = "Mrs "
    }
    return title + adminName
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    const adminId = localStorage.getItem("adminId")
    if (!adminId) {
      console.log("No adminId found, skipping notification fetch")
      return
    }

    console.log("Fetching notifications for adminId:", adminId)
    setLoadingNotifications(true)
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(
        notificationsRef,
        where("admin_id", "==", adminId),
        orderBy("created_at", "desc"),
        limit(10)
      )
      const snapshot = await getDocs(q)
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[]
      
      console.log("Fetched notifications:", notificationsList)
      setNotifications(notificationsList)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId)
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      })
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      
      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, "notifications", notification.id), { read: true })
      }
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <User className="h-4 w-4 text-green-600" />
      case 'password_change':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'system':
        return <Bell className="h-4 w-4 text-orange-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Welcome</Badge>
      case 'password_change':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">Security</Badge>
      case 'system':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">System</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Info</Badge>
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
          
          {/* Notifications Dropdown */}
          <DropdownMenu onOpenChange={(open) => {
            if (open) {
              fetchNotifications()
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96">
              <div className="flex items-center justify-between p-2 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 px-2">
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-64">
                {loadingNotifications ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          notification.read 
                            ? 'hover:bg-gray-50' 
                            : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              {getNotificationBadge(notification.type)}
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.created_at?.toDate?.() 
                                ? notification.created_at.toDate().toLocaleDateString()
                                : new Date().toLocaleDateString()
                              }
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              disabled={markingAsRead === notification.id}
                              className="h-6 w-6 p-0"
                            >
                              {markingAsRead === notification.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => router.push("/notifications")}
                  >
                    View all notifications
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg">
              <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
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
          <div className="flex flex-col items-center gap-3 rounded-md px-4 py-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={adminImage} alt="Admin Profile" />
              <AvatarFallback className="bg-white/10 text-white text-lg">
                {getInitials(adminName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-medium text-white">{getFormattedName()}</span>
              <span className="text-xs text-gray-400">{adminRole}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className={cn("pt-16", "md:ml-64", "min-h-screen", "p-6")}>{children}</main>
    </div>
  )
}
