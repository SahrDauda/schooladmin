"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"
import { useFirebaseConnection } from "@/hooks/use-firebase-connection"
import type { QuerySnapshot } from "firebase/firestore"
import { SchoolTechLogo } from "@/components/school-tech-logo"
import { sendWelcomeNotification } from "@/lib/notification-utils"
import { setDoc } from "firebase/firestore"

export default function LoginPage() {
  const router = useRouter()
  const [emailaddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { isConnected } = useFirebaseConnection()

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setEmailAddress(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleForgotPassword = () => {
    router.push("/forgot-password")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    try {
      console.log("Attempting login with email:", emailaddress)
      const userCredential = await signInWithEmailAndPassword(auth, emailaddress, password)
      const user = userCredential.user
      console.log("Firebase Auth successful, user:", user.uid, user.email)

      // Check if user exists in schooladmin collection by email
      const adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", emailaddress))
      let querySnapshot = await getDocs(adminQuery)

      if (querySnapshot.empty) {
        // Try email field
        const adminQuery2 = query(collection(db, "schooladmin"), where("email", "==", emailaddress))
        querySnapshot = await getDocs(adminQuery2)
      }

      console.log("Admin query results:", querySnapshot.size, "documents found")

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0]
        const adminData = adminDoc.data() as any
        console.log("Admin document data:", adminData)

        // Ensure an admin profile exists at schooladmin/<uid> for security rules to recognize role
        try {
          const profileDocRef = doc(db, "schooladmin", user.uid)
          const profileDocSnap = await getDoc(profileDocRef)
          if (!profileDocSnap.exists()) {
            const normalizedData = {
              // Required by rules
              emailaddress: adminData.emailaddress || adminData.email || user.email || emailaddress,
              email: adminData.email || adminData.emailaddress || user.email || emailaddress,
              password: typeof adminData.password === "string" && adminData.password.length >= 6 ? adminData.password : password,
              name: adminData.name || adminData.adminname || adminData.adminName || "Admin User",
              role: adminData.role || "Principal",
              school_id: adminData.school_id || adminData.id || adminDoc.id,
              // Preserve other fields
              ...adminData,
            }
            await setDoc(profileDocRef, normalizedData, { merge: true })
            console.log("Synchronized admin profile to UID path")
          }
        } catch (syncErr) {
          console.warn("Could not ensure admin profile under UID:", syncErr)
        }

        // Store admin info in localStorage for backward compatibility - use UID for consistency with rules
        localStorage.setItem("adminId", user.uid)
        localStorage.setItem("adminName", adminData.adminname || adminData.adminName || adminData.name || "Admin User")
        localStorage.setItem("adminRole", adminData.role || "Principal")
        localStorage.setItem("adminEmail", emailaddress)

        if (adminData.gender) {
          localStorage.setItem("adminGender", adminData.gender)
        }

        // Check if this is first time login
        const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore")
        if (hasLoggedInBefore === "false" || !hasLoggedInBefore) {
          localStorage.setItem("hasLoggedInBefore", "false")
          router.push("/dashboard")
        } else {
          router.push("/dashboard")
        }
      } else {
        console.error("No admin document found for email:", emailaddress)
        setErrorMessage("No admin record found for this email address.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setErrorMessage(err.message || "An error occurred during login.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setErrorMessage("")

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      console.log("Google Sign-In successful, user:", user.uid, user.email)

      // Check if user exists in schooladmin collection by email
      const adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", user.email))
      let querySnapshot = await getDocs(adminQuery)

      if (querySnapshot.empty) {
        // Try email field
        const adminQuery2 = query(collection(db, "schooladmin"), where("email", "==", user.email))
        querySnapshot = await getDocs(adminQuery2)
      }

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0]
        const adminData = adminDoc.data() as any

        // Create/update admin profile at schooladmin/<uid>
        const profileDocRef = doc(db, "schooladmin", user.uid)
        const normalizedData = {
          emailaddress: user.email,
          email: user.email,
          name: adminData.name || adminData.adminname || adminData.adminName || user.displayName || "Admin User",
          role: adminData.role || "Principal",
          school_id: adminData.school_id || adminData.id || adminDoc.id,
          googleAuth: true,
          lastLogin: Timestamp.now(),
          ...adminData,
        }
        await setDoc(profileDocRef, normalizedData, { merge: true })

        // Store admin info in localStorage
        localStorage.setItem("adminId", user.uid)
        localStorage.setItem("adminName", adminData.adminname || adminData.adminName || adminData.name || user.displayName || "Admin User")
        localStorage.setItem("adminRole", adminData.role || "Principal")
        localStorage.setItem("adminEmail", user.email || "")
        localStorage.setItem("hasLoggedInBefore", "true")

        if (adminData.gender) {
          localStorage.setItem("adminGender", adminData.gender)
        }

        router.push("/dashboard")
      } else {
        setErrorMessage("No admin record found for this Google account. Please contact your administrator.")
        await auth.signOut()
      }
    } catch (err: any) {
      console.error("Google Sign-In error:", err)
      setErrorMessage(err.message || "An error occurred during Google Sign-In.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center p-4 sm:p-6">
          <div className="flex justify-center mb-4">
            <SchoolTechLogo size="md" />
          </div>
          <CardDescription className="text-base sm:text-lg">Welcome to the School Admin panel</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    id="emailaddress"
                    type="email"
                    placeholder="Email Address"
                    className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                    value={emailaddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-10 h-10 sm:h-11 text-sm sm:text-base pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="rememberMe" className="text-xs sm:text-sm text-gray-600">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs sm:text-sm text-[#1E3A5F] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              {errorMessage && <div className="text-xs sm:text-sm text-red-500 mt-2">{errorMessage}</div>}
              <Button
                type="submit"
                className="w-full h-10 sm:h-11 text-sm sm:text-base bg-[#1E3A5F]"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {loading ? "Signing in..." : "Sign in with Google"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-center text-muted-foreground">
            This system is for authorized school administrators only
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
