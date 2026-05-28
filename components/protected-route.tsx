"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PageSkeleton } from "@/components/loading-skeleton"

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAuth?: boolean
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
    const { user, admin, loading } = useAuth()
    const router = useRouter()
    const [loadingTimeout, setLoadingTimeout] = useState(false)

    // Timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingTimeout(true)
        }, 5000) // Max 5 seconds
        
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        // Only redirect after loading is complete OR timeout reached
        if ((!loading || loadingTimeout) && requireAuth) {
            if (!user || !admin) {
                router.push("/")
            }
        }
    }, [user, admin, loading, loadingTimeout, requireAuth, router])

    // Show skeleton only while loading (with timeout protection)
    if (loading && !loadingTimeout) {
        return <PageSkeleton />
    }

    if (requireAuth && (!user || !admin)) {
        return null // Will redirect to login
    }

    return <>{children}</>
} 
