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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [admin, setAdmin] = useState<AdminData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let active = true

        const fetchAdminProfile = async (currentUser: User): Promise<AdminData | null> => {
            try {
                // Coerce a PostgrestBuilder into a real Promise so
                // Promise.race (used inside withTimeout) accepts it.
                const toPromise = <T,>(q: PromiseLike<T>): Promise<T> =>
                    Promise.resolve(q)

                // Race a query against a 5 s timeout.
                const withTimeout = <T,>(
                    q: PromiseLike<T>,
                    ms = 5000
                ): Promise<T | null> =>
                    Promise.race([
                        toPromise(q),
                        new Promise<null>((resolve) =>
                            setTimeout(() => resolve(null), ms)
                        ),
                    ])

                // 1. Primary: query by UUID
                let admins: any = null
                const byId = await withTimeout(
                    supabase
                        .from('schooladmin')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle()
                )
                if (byId) {
                    if ((byId as any).error) {
                        console.error("Auth UUID query error:", (byId as any).error.message || (byId as any).error)
                    } else if ((byId as any).data) {
                        admins = (byId as any).data
                    }
                }

                // 2. Fallback: query by email column
                if (!admins && currentUser.email) {
                    const byEmail = await withTimeout(
                        supabase
                            .from('schooladmin')
                            .select('*')
                            .eq('email', currentUser.email)
                            .maybeSingle()
                    )
                    if (byEmail) {
                        if ((byEmail as any).error) {
                            console.error("Auth email query error:", (byEmail as any).error.message || (byEmail as any).error)
                        } else if ((byEmail as any).data) {
                            admins = (byEmail as any).data
                        }
                    }
                }

                if (admins) {
                    const adminData = admins as any
                    console.log("Admin document data:", adminData)

                    let schoolStage = ""
                    if (adminData.school_id) {
                        try {
                            const { data: school } = await supabase
                                .from('schools')
                                .select('stage')
                                .eq('id', adminData.school_id)
                                .single()
                            if (school) {
                                schoolStage = school.stage || ""
                            }
                        } catch (e) {
                            console.error("Error fetching school stage in auth:", e)
                        }
                    }

                    return {
                        ...adminData,
                        id: adminData.id,
                        schoolStage: schoolStage,
                        schoolName: adminData.schoolname || adminData.schoolName || ""
                    }
                }

                // Fallback: check metadata role
                const userRole = currentUser.user_metadata?.role
                if (userRole === "Teacher" || userRole === "Staff") {
                    console.log("User is a Staff member, allowing access")
                    return {
                        id: currentUser.id,
                        emailaddress: currentUser.email || "",
                        role: userRole,
                        school_id: "",
                    } as any
                }

                console.warn("No admin document found for user:", currentUser.email)
                return null
            } catch (error) {
                console.error("Error in fetchAdminProfile:", error)
                return null
            }
        }

        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession()
                
                if (!active) return

                if (initialSession?.user) {
                    setSession(initialSession)
                    setUser(initialSession.user)
                    
                    const adminProfile = await fetchAdminProfile(initialSession.user)
                    if (active) {
                        setAdmin(adminProfile)
                    }
                } else {
                    setSession(null)
                    setUser(null)
                    setAdmin(null)
                }
            } catch (error) {
                console.error("Error initializing auth session:", error)
                if (active) {
                    setAdmin(null)
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        initializeAuth()

        // Set a backup timeout to prevent infinite loading in case initialization hangs
        const loadingTimeout = setTimeout(() => {
            if (active) {
                setLoading((currentLoading) => {
                    if (currentLoading) {
                        console.log("Auth loading timeout reached, forcing loading to false")
                        return false
                    }
                    return currentLoading
                })
            }
        }, 6000)

        // Listen for auth events (sign in, sign out, token refresh, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!active) return

            // Handle actual authentication state changes
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                setSession(newSession)
                setUser(newSession?.user ?? null)
                
                if (newSession?.user) {
                    // Only set loading to true if we are not already showing dashboard (e.g. initial login)
                    const adminProfile = await fetchAdminProfile(newSession.user)
                    if (active) {
                        setAdmin(adminProfile)
                    }
                }
            } else if (event === "SIGNED_OUT") {
                setSession(null)
                setUser(null)
                setAdmin(null)
            }
        })

        return () => {
            active = false
            clearTimeout(loadingTimeout)
            subscription.unsubscribe()
        }
    }, [router])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            setAdmin(null)
            router.push("/")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    const refreshAdminData = async () => {
        if (!user) return

        try {
            // 1. Primary Check: Query by UUID
            let { data: adminData } = await supabase
                .from('schooladmin')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()

            // 2. Fallback: Query by email column
            if (!adminData && user.email) {
                const { data: byEmail } = await supabase
                    .from('schooladmin')
                    .select('*')
                    .eq('email', user.email)
                    .maybeSingle()
                if (byEmail) {
                    adminData = byEmail
                }
            }

            if (adminData) {
                let schoolStage = ""
                if (adminData.school_id) {
                    try {
                        const { data: school } = await supabase
                            .from('schools')
                            .select('stage')
                            .eq('id', adminData.school_id)
                            .single()
                        if (school) {
                            schoolStage = school.stage || ""
                        }
                    } catch (e) {
                        console.error("Error fetching school stage in refresh:", e)
                    }
                }

                const resolvedAdmin: AdminData = {
                    ...adminData as any,
                    id: adminData.id,
                    schoolStage: schoolStage,
                    schoolName: (adminData as any).schoolname || adminData.schoolName || ""
                }
                setAdmin(resolvedAdmin)
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
