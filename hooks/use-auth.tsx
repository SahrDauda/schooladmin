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
    firstLoginAt?: unknown
    gender?: string
    admin_images?: string
    schoolStage?: string
    schoolName?: string
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

async function fetchAdminProfile(currentUser: User): Promise<AdminData | null> {
    try {
        let adminData: Record<string, unknown> | null = null

        const { data: byId, error: byIdError } = await supabase
            .from("schooladmin")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle()

        if (byIdError) {
            console.error("[fetchAdminProfile] UUID query error:", byIdError.message)
        } else if (byId) {
            adminData = byId
        }

        if (!adminData && currentUser.email) {
            const normalizedEmail = currentUser.email.trim().toLowerCase()

            const { data: byEmail, error: byEmailError } = await supabase
                .from("schooladmin")
                .select("*")
                .eq("email", normalizedEmail)
                .maybeSingle()

            if (byEmailError) {
                console.error("[fetchAdminProfile] email query error:", byEmailError.message)
            } else if (byEmail) {
                adminData = byEmail
            }
        }

        if (!adminData && currentUser.email) {
            const { data: byEmailAddress, error: byEmailAddressError } = await supabase
                .from("schooladmin")
                .select("*")
                .eq("emailaddress", currentUser.email.trim().toLowerCase())
                .maybeSingle()

            if (byEmailAddressError) {
                console.error("[fetchAdminProfile] emailaddress query error:", byEmailAddressError.message)
            } else if (byEmailAddress) {
                adminData = byEmailAddress
            }
        }

        if (adminData) {
            let schoolStage = ""
            const schoolId = adminData.school_id as string | undefined

            if (schoolId) {
                const { data: school, error: schoolError } = await supabase
                    .from("schools")
                    .select("stage")
                    .eq("id", schoolId)
                    .maybeSingle()

                if (schoolError) {
                    console.error("[fetchAdminProfile] school stage error:", schoolError.message)
                } else if (school) {
                    schoolStage = school.stage || ""
                }
            }

            return {
                ...(adminData as AdminData),
                id: adminData.id as string,
                schoolStage,
                schoolName: (adminData.schoolname as string) || (adminData.schoolName as string) || "",
            }
        }

        const userRole = currentUser.user_metadata?.role
        if (userRole === "Teacher" || userRole === "Staff") {
            return {
                id: currentUser.id,
                emailaddress: currentUser.email || "",
                role: userRole,
                school_id: "",
            } as AdminData
        }

        console.warn("[fetchAdminProfile] No admin record for:", currentUser.email)
        return null
    } catch (error) {
        console.error("[fetchAdminProfile]", error)
        return null
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [admin, setAdmin] = useState<AdminData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let active = true

        const loadAdminProfile = async (currentUser: User, replaceExisting = true) => {
            const profile = await fetchAdminProfile(currentUser)
            if (!active) return

            if (profile) {
                setAdmin(profile)
            } else if (replaceExisting) {
                setAdmin(null)
            }
        }

        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error("[initializeAuth]", error.message)
                }

                if (!active) return

                if (initialSession?.user) {
                    setSession(initialSession)
                    setUser(initialSession.user)
                    await loadAdminProfile(initialSession.user)
                } else {
                    setSession(null)
                    setUser(null)
                    setAdmin(null)
                }
            } catch (error) {
                console.error("[initializeAuth]", error)
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!active) return

            if (event === "SIGNED_OUT") {
                setSession(null)
                setUser(null)
                setAdmin(null)
                setLoading(false)
                return
            }

            if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    // Never wipe an existing admin profile when a background refresh fails.
                    await loadAdminProfile(newSession.user, event === "SIGNED_IN" || event === "INITIAL_SESSION")
                } else {
                    setAdmin(null)
                }

                if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
                    setLoading(false)
                }
            }
        })

        return () => {
            active = false
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setAdmin(null)
            router.push("/")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    const refreshAdminData = async () => {
        if (!user) return

        const profile = await fetchAdminProfile(user)
        if (profile) {
            setAdmin(profile)
        }
    }

    const value = {
        user,
        session,
        admin,
        loading,
        signOut,
        refreshAdminData,
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
