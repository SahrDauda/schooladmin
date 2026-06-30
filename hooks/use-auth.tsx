"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchApi } from "@/lib/api-client"

export interface AdminData {
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

// Admin data type matches what the backend /api/auth/me returns
interface AuthContextType {
    user: any | null // kept for compatibility, same as admin
    session: any | null
    admin: AdminData | null
    loading: boolean
    signOut: () => Promise<void>
    refreshAdminData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null)
    const [session, setSession] = useState<any | null>(null)
    const [admin, setAdmin] = useState<AdminData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let active = true

        const initializeAuth = async () => {
            try {
                const response = await fetchApi<AdminData>('/auth/me');
                
                if (!active) return

                if (response.success && response.data) {
                    setAdmin(response.data)
                    setUser(response.data) // map user to admin for compatibility
                    setSession({ user: response.data })
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

        return () => {
            active = false
        }
    }, [])

    const signOut = async () => {
        try {
            await fetchApi('/auth/logout', { method: 'POST' })
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

        const response = await fetchApi<AdminData>('/auth/me');
        if (response.success && response.data) {
            setAdmin(response.data)
            setUser(response.data)
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
