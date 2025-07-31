"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Check if email exists in schooladmin collection
      const adminQuery = query(collection(db, "schooladmin"), where("emailaddress", "==", email))
      const querySnapshot = await getDocs(adminQuery)
      
      if (querySnapshot.empty) {
        toast({
          title: "Email Not Found",
          description: "No account found with this email address.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Generate 4-digit verification code
      const verificationCode = generateVerificationCode()
      
      // Store verification code in Firestore with expiration (10 minutes)
      const expirationTime = new Date()
      expirationTime.setMinutes(expirationTime.getMinutes() + 10)
      
      await addDoc(collection(db, "passwordResetCodes"), {
        email: email,
        code: verificationCode,
        createdAt: new Date(),
        expiresAt: expirationTime,
        used: false
      })

      // Send email with verification code
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Password Reset Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You have requested to reset your password. Use the verification code below to proceed:</p>
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
              </div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
          `
        })
      })

      if (response.ok) {
        toast({
          title: "Verification Code Sent",
          description: "A 4-digit verification code has been sent to your email.",
        })
        // Store email in sessionStorage for the verification page
        sessionStorage.setItem("resetEmail", email)
        router.push("/verify-code")
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send verification code.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-xl shadow-lg p-8">
        <CardHeader>
          <CardTitle className="text-center">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            className="w-full mt-4"
            onClick={() => router.push("/")}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 