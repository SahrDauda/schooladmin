"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AdminData {
    id: string
    adminname?: string
    adminName?: string
    name?: string
    emailaddress: string
    email?: string
    role: string
    school_id: string
    hasloggedinbefore?: boolean
    firstLoginAt?: any
    gender?: string
    admin_images?: string
}

interface AuthContextType {
    user: User | null
    session: Session | null
    admin: AdminData | null
    loading: boolean
    signOut: () => Promise<void>
    refreshAdminData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [admin, setAdmin] = useState<AdminData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                try {
                    console.log("Looking for admin with email:", session.user.email)

                    // Query Supabase for admin by email
                    // Try emailaddress field first
                    let { data: admins, error } = await supabase
                        .from('schooladmin')
                        .select('*')
                        .eq('emailaddress', session.user.email)

                    if (error || !admins || admins.length === 0) {
                        // If no results, try email field
                        const { data: adminsByEmail, error: errorByEmail } = await supabase
                            .from('schooladmin')
                            .select('*')
                            .eq('email', session.user.email)

                        if (!errorByEmail && adminsByEmail && adminsByEmail.length > 0) {
                            admins = adminsByEmail
                        }
                    }

                    if (admins && admins.length > 0) {
                        const adminData = admins[0] as AdminData
                        console.log("Admin document data:", adminData)

                        const resolvedAdmin: AdminData = {
                            ...adminData,
                            id: adminData.id // Assuming id is part of the returned data
                        }
                        setAdmin(resolvedAdmin)

                        // Backward compatibility: populate localStorage
                        try {
                            localStorage.setItem("adminId", resolvedAdmin.id)
                            const name = resolvedAdmin.adminname || resolvedAdmin.adminName || resolvedAdmin.name || "Admin User"
                            localStorage.setItem("adminName", name)
                            if (resolvedAdmin.gender) localStorage.setItem("adminGender", resolvedAdmin.gender)
                            localStorage.setItem("adminRole", resolvedAdmin.role || "Principal")
                            if (session.user.email) localStorage.setItem("adminEmail", session.user.email)
                        } catch { }
                    } else {
                        console.log("No admin document found, signing out")
                        await supabase.auth.signOut()
                        setAdmin(null)
                        router.push("/")
                    }
                } catch (error) {
                    console.error("Error fetching admin data:", error)
                    await supabase.auth.signOut()
                    setAdmin(null)
                    router.push("/")
                }
            } else {
                setAdmin(null)
                try {
                    localStorage.removeItem("adminId")
                    localStorage.removeItem("adminName")
                    localStorage.removeItem("adminGender")
                    localStorage.removeItem("adminRole")
                    localStorage.removeItem("adminEmail")
                } catch { }
            }
            setLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            setAdmin(null)
            try {
                localStorage.removeItem("adminId")
                localStorage.removeItem("adminName")
                localStorage.removeItem("adminGender")
                localStorage.removeItem("adminRole")
                localStorage.removeItem("adminEmail")
            } catch { }
            router.push("/")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    const refreshAdminData = async () => {
        if (!user || !user.email) return

        try {
            let { data: admins, error } = await supabase
                .from('schooladmin')
                .select('*')
                .eq('emailaddress', user.email)

            if (error || !admins || admins.length === 0) {
                const { data: adminsByEmail, error: errorByEmail } = await supabase
                    .from('schooladmin')
                    .select('*')
                    .eq('email', user.email)

                if (!errorByEmail && adminsByEmail && adminsByEmail.length > 0) {
                    admins = adminsByEmail
                }
            }

            if (admins && admins.length > 0) {
                const adminData = admins[0] as AdminData
                const resolvedAdmin: AdminData = {
                    ...adminData,
                    id: adminData.id
                }
                setAdmin(resolvedAdmin)

                try {
                    localStorage.setItem("adminId", resolvedAdmin.id)
                    const name = resolvedAdmin.adminname || resolvedAdmin.adminName || resolvedAdmin.name || "Admin User"
                    localStorage.setItem("adminName", name)
                    if (resolvedAdmin.gender) localStorage.setItem("adminGender", resolvedAdmin.gender)
                    localStorage.setItem("adminRole", resolvedAdmin.role || "Principal")
                } catch { }
            }
        } catch (error) {
            console.error("Error refreshing admin data:", error)
        }
    }

    const value = {
        user,
        session,
        admin,
        loading,
        signOut,
        refreshAdminData
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}