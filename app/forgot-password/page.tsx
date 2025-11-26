"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Mail, Key, Lock, CheckCircle } from "lucide-react"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      toast({
        title: "Code Sent",
        description: data.message || "Please check your email for the verification code.",
      })
      setStep('otp')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    // In this flow, we verify the OTP along with the password reset request
    // But we can do a basic length check here
    if (otp.length < 6) {
      toast({
        title: "Invalid Code",
        description: "Verification code must be at least 6 digits",
        variant: "destructive",
      })
      return
    }
    setStep('password')
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      toast({
        title: "Success",
        description: "Password updated successfully! Redirecting to login...",
      })

      setTimeout(() => {
        router.push("/")
      }, 2000)

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      })
      // If OTP was invalid, maybe go back to OTP step?
      if (error.message.includes('verification code')) {
        setStep('otp')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {step === 'email' && "Forgot Password"}
            {step === 'otp' && "Enter Verification Code"}
            {step === 'password' && "Reset Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'email' && "Enter your email to receive a verification code"}
            {step === 'otp' && `We sent a code to ${email}`}
            {step === 'password' && "Create a new secure password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@school.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="pl-9 tracking-widest"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right cursor-pointer hover:text-primary" onClick={() => setStep('email')}>
                  Wrong email?
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Continue
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  )
}