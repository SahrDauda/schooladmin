"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PageSkeleton } from "@/components/loading-skeleton"

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAuth?: boolean
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
    const { user, admin, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && requireAuth) {
            if (!user || !admin) {
                router.push("/")
            }
        }
    }, [user, admin, loading, requireAuth, router])

    if (loading) {
        return <PageSkeleton />
    }

    if (requireAuth && (!user || !admin)) {
        return null // Will redirect to login
    }

    return <>{children}</>
} 