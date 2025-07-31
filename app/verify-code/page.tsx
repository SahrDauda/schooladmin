"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export default function VerifyCodePage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail")
    if (!storedEmail) {
      toast({
        title: "Session Expired",
        description: "Please request a new verification code.",
        variant: "destructive",
      })
      router.push("/forgot-password")
      return
    }
    setEmail(storedEmail)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if verification code exists and is valid
      const codeQuery = query(
        collection(db, "passwordResetCodes"),
        where("email", "==", email),
        where("code", "==", code),
        where("used", "==", false)
      )
      const querySnapshot = await getDocs(codeQuery)

      if (querySnapshot.empty) {
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or has expired.",
          variant: "destructive",
        })
        return
      }

      const codeDoc = querySnapshot.docs[0]
      const codeData = codeDoc.data()

      // Check if code has expired
      const now = new Date()
      const expiresAt = codeData.expiresAt.toDate()
      
      if (now > expiresAt) {
        toast({
          title: "Code Expired",
          description: "The verification code has expired. Please request a new one.",
          variant: "destructive",
        })
        return
      }

      // Mark code as used
      await updateDoc(doc(db, "passwordResetCodes", codeDoc.id), {
        used: true
      })

      toast({
        title: "Code Verified",
        description: "Verification successful. Please create your new password.",
      })

      // Store email in sessionStorage for the new password page
      sessionStorage.setItem("resetEmail", email)
      router.push("/new-password")
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify code.",
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
          <CardTitle className="text-center">Verify Code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Enter the 4-digit verification code sent to:
              </p>
              <p className="font-medium">{email}</p>
            </div>
            <Input
              type="text"
              placeholder="Enter 4-digit code"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={4}
              pattern="[0-9]{4}"
              required
              disabled={loading}
              className="text-center text-lg tracking-widest"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full"
              onClick={() => router.push("/forgot-password")}
            >
              Back to Forgot Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 