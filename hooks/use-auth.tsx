"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
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
    hasLoggedInBefore?: boolean
    firstLoginAt?: any
}

interface AuthContextType {
    user: User | null
    admin: AdminData | null
    loading: boolean
    signOut: () => Promise<void>
    refreshAdminData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [admin, setAdmin] = useState<AdminData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user)

            if (user) {
                try {
                    // Query Firestore for admin by email
                    const adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", user.email))
                    const querySnapshot = await getDocs(adminQuery)

                    if (!querySnapshot.empty) {
                        const adminDoc = querySnapshot.docs[0]
                        const adminData = adminDoc.data() as AdminData
                        setAdmin({
                            ...adminData,
                            id: adminDoc.id
                        })
                    } else {
                        // Admin document doesn't exist, sign out
                        await firebaseSignOut(auth)
                        setAdmin(null)
                        router.push("/")
                    }
                } catch (error) {
                    console.error("Error fetching admin data:", error)
                    await firebaseSignOut(auth)
                    setAdmin(null)
                    router.push("/")
                }
            } else {
                setAdmin(null)
            }

            setLoading(false)
        })

        return () => unsubscribe()
    }, [router])

    const signOut = async () => {
        try {
            await firebaseSignOut(auth)
            setAdmin(null)
            router.push("/")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    const refreshAdminData = async () => {
        if (!user) return

        try {
            const adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", user.email))
            const querySnapshot = await getDocs(adminQuery)

            if (!querySnapshot.empty) {
                const adminDoc = querySnapshot.docs[0]
                const adminData = adminDoc.data() as AdminData
                setAdmin({
                    ...adminData,
                    id: adminDoc.id
                })
            }
        } catch (error) {
            console.error("Error refreshing admin data:", error)
        }
    }

    const value = {
        user,
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