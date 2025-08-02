"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"
import { useFirebaseConnection } from "@/hooks/use-firebase-connection"
import type { QuerySnapshot } from "firebase/firestore"
import { SchoolTechLogo } from "@/components/school-tech-logo"

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
      // Use Firebase Auth for authentication
      const userCredential = await signInWithEmailAndPassword(auth, emailaddress, password)
      const user = userCredential.user

      // Query Firestore for admin by emailaddress field
      const adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", user.email))
      const querySnapshot = await getDocs(adminQuery)
      if (querySnapshot.empty) {
        throw new Error("No admin record found for this user.")
      }
      const adminDoc = querySnapshot.docs[0]
      const adminData = adminDoc.data()

      // Store admin info in localStorage for session management
      localStorage.setItem("adminId", adminDoc.id)
      localStorage.setItem("adminName", adminData.adminname || adminData.adminName || adminData.name || "Admin User")
      localStorage.setItem("adminRole", adminData.role || "Administrator")

      // If remember me is checked, store the email in localStorage
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", emailaddress)
      } else {
        localStorage.removeItem("rememberedEmail")
      }

      // Check if this is the first time login
      const isFirstTimeLogin = !adminData.hasLoggedInBefore
      
      if (isFirstTimeLogin) {
        // Mark as logged in for the first time
        const adminRef = doc(db, "schooladmin", adminDoc.id)
        await updateDoc(adminRef, {
          hasLoggedInBefore: true,
          firstLoginAt: Timestamp.fromDate(new Date())
        })
        
        // Redirect to new password page
        router.push("/new-password")
      } else {
        // Redirect to dashboard
        router.push("/dashboard")
      }
    } catch (err) {
      const error = err as Error
      console.error("Login error:", error)
      setErrorMessage(error.message || "Login failed. Please try again.")

      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
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
