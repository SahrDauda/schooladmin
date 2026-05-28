"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Lock, Mail, Eye, EyeOff, UserPlus } from "lucide-react"
import { SchoolTechLogo } from "@/components/school-tech-logo"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { admin, loading: authLoading } = useAuth()
  const [emailaddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (admin) {
      router.push("/dashboard")
    }
  }, [admin, router])

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
      // Use Supabase Auth for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailaddress,
        password: password,
      })

      if (authError) throw authError
      
      // Auth change will be handled by AuthProvider/hooks
      // But we check if it's an admin specifically here for faster feedback
      const user = authData.user
      if (user) {
          const { data: adminData } = await supabase
            .from('schooladmin')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()
            
          if (!adminData) {
              // If not found in schooladmin, reject login
              await supabase.auth.signOut()
              throw new Error("No admin account found for this user.")
          }
      }

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", emailaddress)
      } else {
        localStorage.removeItem("rememberedEmail")
      }

      router.push("/dashboard")
      
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

  // Splash screen with timeout - prevent hanging indefinitely
  const [splashTimeout, setSplashTimeout] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashTimeout(true)
    }, 3000) // Max 3 seconds for session check
    
    return () => clearTimeout(timer)
  }, [])

  // Show splash only briefly, then proceed
  if (authLoading && !splashTimeout) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
              <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                      <SchoolTechLogo size="lg" className="relative z-10" />
                  </div>
                  <div className="text-center space-y-2">
                      <h1 className="text-3xl font-bold text-white tracking-tight">Skultek</h1>
                      <p className="text-blue-100 text-sm font-medium">School Management System</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-blue-600">
        <CardHeader className="space-y-1 text-center p-6">
          <div className="flex justify-center mb-4">
            <SchoolTechLogo size="md" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
          <CardDescription className="text-gray-500">Log in to manage your school</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="emailaddress"
                    type="email"
                    placeholder="Admin Email"
                    className="pl-10 h-11"
                    value={emailaddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-10 h-11 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              {errorMessage && <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">{errorMessage}</div>}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors shadow-md"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Sign In to Dashboard"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-6 bg-gray-50 border-t rounded-b-lg">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push("/add-admin")}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add School (Demo)
          </Button>
          <p className="text-xs text-center text-gray-400">
            &copy; {new Date().getFullYear()} Skultɛk School Management System. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
