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
    const { user, admin, loading, refreshAdminData } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && requireAuth && !user) {
            router.push("/")
        }
    }, [user, loading, requireAuth, router])

    useEffect(() => {
        if (!loading && user && !admin) {
            void refreshAdminData()
        }
    }, [loading, user, admin, refreshAdminData])

    if (loading) {
        return <PageSkeleton />
    }

    if (requireAuth && !user) {
        return null
    }

    if (requireAuth && user && !admin) {
        return <PageSkeleton />
    }

    return <>{children}</>
}
