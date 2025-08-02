"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"

export default function NewPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if this is a first-time login (from localStorage) or password reset (from sessionStorage)
    const adminId = localStorage.getItem("adminId")
    const storedEmail = sessionStorage.getItem("resetEmail")
    
    if (!adminId && !storedEmail) {
      toast({
        title: "Session Expired",
        description: "Please start the password reset process again.",
        variant: "destructive",
      })
      router.push("/forgot-password")
      return
    }
    
    // If adminId exists, this is first-time login
    if (adminId) {
      const adminName = localStorage.getItem("adminName")
      setEmail(localStorage.getItem("rememberedEmail") || "")
      setIsFirstTimeLogin(true)
    } else {
      // This is password reset flow
      setEmail(storedEmail || "")
      setIsFirstTimeLogin(false)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate passwords
      if (password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        })
        return
      }

      if (password !== confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure both passwords are the same.",
          variant: "destructive",
        })
        return
      }

      // Check if this is first-time login or password reset
      const adminId = localStorage.getItem("adminId")
      
      if (adminId) {
        // First-time login scenario
        // Update the password in the schooladmin document
        await updateDoc(doc(db, "schooladmin", adminId), {
          password: password
        })

        toast({
          title: "Password Set Successfully",
          description: "Your password has been set. Welcome to the system!",
        })

        // Clear any session storage
        sessionStorage.removeItem("resetEmail")

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        // Password reset scenario
        // Find the schooladmin document with this email
        const adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", email))
        const querySnapshot = await getDocs(adminQuery)

        if (querySnapshot.empty) {
          toast({
            title: "Account Not Found",
            description: "No account found with this email address.",
            variant: "destructive",
          })
          return
        }

        const adminDoc = querySnapshot.docs[0]

        // Update the password in the schooladmin document
        await updateDoc(doc(db, "schooladmin", adminDoc.id), {
          password: password
        })

        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated. You can now log in.",
        })

        // Clear session storage
        sessionStorage.removeItem("resetEmail")

        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">
            {isFirstTimeLogin ? "Set Your Password" : "Create New Password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                {isFirstTimeLogin ? "Setting password for:" : "Creating new password for:"}
              </p>
              <p className="font-medium">{email}</p>
              {isFirstTimeLogin && (
                <p className="text-xs text-muted-foreground mt-2">
                  Welcome! Please set your password to complete your account setup.
                </p>
              )}
            </div>
            
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isFirstTimeLogin ? "Setting..." : "Updating...") : (isFirstTimeLogin ? "Set Password" : "Update Password")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 