"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore"
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
    gender?: string
    admin_images?: string
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
                    // Query Firestore for admin by email - check both emailaddress and email fields
                    console.log("Looking for admin with email:", user.email)

                    // Try emailaddress field first
                    let adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", user.email))
                    let querySnapshot = await getDocs(adminQuery)

                    // If no results, try email field
                    if (querySnapshot.empty) {
                        console.log("No admin found with emailaddress, trying email field")
                        adminQuery = query(collection(db, "schooladmin"), where("email", "==", user.email))
                        querySnapshot = await getDocs(adminQuery)
                    }

                    console.log("Admin query results:", querySnapshot.size, "documents found")

                    if (!querySnapshot.empty) {
                        const adminDoc = querySnapshot.docs[0]
                        const adminData = adminDoc.data() as AdminData
                        console.log("Admin document data:", adminData)

                        const resolvedAdmin: AdminData = {
                            ...adminData,
                            id: adminDoc.id
                        }
                        setAdmin(resolvedAdmin)

                        // Ensure rules alignment: mirror essential fields under schooladmin/{auth.uid}
                        try {
                            if (user.uid && adminDoc.id !== user.uid) {
                                const adminRefByUid = doc(db, "schooladmin", user.uid)
                                const mirrored = {
                                    role: adminData.role || "Principal",
                                    school_id: adminData.school_id || adminData.id || "",
                                    emailaddress: user.email || adminData.emailaddress || adminData.email || "",
                                    name: adminData.adminname || adminData.adminName || adminData.name || "Admin User",
                                }
                                await setDoc(adminRefByUid, mirrored, { merge: true })
                                console.log("Mirrored admin profile to schooladmin/", user.uid)
                            }
                        } catch (mirrorErr) {
                            console.warn("Failed to mirror admin doc by UID:", mirrorErr)
                        }

                        // Backward compatibility: populate localStorage for components still using it
                        try {
                            localStorage.setItem("adminId", resolvedAdmin.id)
                            const name = resolvedAdmin.adminname || resolvedAdmin.adminName || resolvedAdmin.name || "Admin User"
                            localStorage.setItem("adminName", name)
                            if (resolvedAdmin.gender) localStorage.setItem("adminGender", resolvedAdmin.gender)
                            localStorage.setItem("adminRole", resolvedAdmin.role || "Principal")
                            if (user.email) localStorage.setItem("adminEmail", user.email)
                        } catch { }
                    } else {
                        // Admin document doesn't exist, sign out
                        console.log("No admin document found, signing out")
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

        return () => unsubscribe()
    }, [router])

    const signOut = async () => {
        try {
            await firebaseSignOut(auth)
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
        if (!user) return

        try {
            // Try emailaddress field first
            let adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", user.email))
            let querySnapshot = await getDocs(adminQuery)

            // If no results, try email field
            if (querySnapshot.empty) {
                adminQuery = query(collection(db, "schooladmin"), where("email", "==", user.email))
                querySnapshot = await getDocs(adminQuery)
            }

            if (!querySnapshot.empty) {
                const adminDoc = querySnapshot.docs[0]
                const adminData = adminDoc.data() as AdminData
                const resolvedAdmin: AdminData = {
                    ...adminData,
                    id: adminDoc.id
                }
                setAdmin(resolvedAdmin)
                // Attempt mirroring again on refresh
                try {
                    if (user.uid && adminDoc.id !== user.uid) {
                        const adminRefByUid = doc(db, "schooladmin", user.uid)
                        const mirrored = {
                            role: adminData.role || "Principal",
                            school_id: adminData.school_id || adminData.id || "",
                            emailaddress: user.email || adminData.emailaddress || adminData.email || "",
                            name: adminData.adminname || adminData.adminName || adminData.name || "Admin User",
                        }
                        await setDoc(adminRefByUid, mirrored, { merge: true })
                    }
                } catch { }
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