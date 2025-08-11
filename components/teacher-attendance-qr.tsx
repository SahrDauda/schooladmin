"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, RefreshCw, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import Image from "next/image"

interface QRCodeData {
  qr_code_id: string
  location: string
  timestamp: string
  school_id: string
  generated_by: string
}

export default function TeacherAttendanceQR() {
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const generateQRCode = async () => {
    try {
      // Get admin info from localStorage
      const adminId = localStorage.getItem("adminId")
      const adminName = localStorage.getItem("adminName") || "Principal"
      
      if (!adminId) {
        toast({
          title: "Error",
          description: "Unable to generate QR code. Please log in again.",
          variant: "destructive",
        })
        return
      }

      // Get school info dynamically
      const schoolInfo = await getCurrentSchoolInfo()
      console.log("Debug - schoolInfo:", schoolInfo)
      
      if (!schoolInfo.school_id || schoolInfo.school_id === "unknown" || schoolInfo.school_id === "error") {
        toast({
          title: "Error",
          description: "Unable to get school information. Please try again.",
          variant: "destructive",
        })
        return
      }

          const qrCodeId = `QR_${Date.now().toString().slice(-6)}`
      const location = "School Main Gate" // This could be made configurable
      const timestamp = new Date().toISOString()

      const data: QRCodeData = {
        qr_code_id: qrCodeId,
        location: location,
        timestamp: timestamp,
        school_id: schoolInfo.school_id,
        generated_by: adminId
      }

      setQrData(data)
      setIsActive(true)
      setTimeLeft(15) // 15 seconds
      setAutoRefresh(true)

      toast({
        title: "QR Code Generated",
        description: "Teachers can now scan this QR code to sign in.",
      })
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      })
    }
  }

  const startAutoRefresh = () => {
    setAutoRefresh(true)
    generateQRCode()
  }

  const stopAutoRefresh = () => {
    setAutoRefresh(false)
    setIsActive(false)
    setTimeLeft(0)
  }

  // Auto-refresh timer - generates new QR code every 15 seconds
  useEffect(() => {
    if (!autoRefresh || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Generate new QR code when timer reaches 0
          generateQRCode()
          return 15 // Reset to 15 seconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRefresh, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Teacher Attendance QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrData ? (
          <div className="text-center py-8">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground mb-4">
              Generate a QR code for teachers to scan and sign in
            </p>
            <Button onClick={startAutoRefresh} className="w-full">
              <QrCode className="h-4 w-4 mr-2" />
              Start QR Code Generation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline">Expired</Badge>
                )}
              </div>
              {isActive && (
                <div className="text-sm text-muted-foreground">
                  Expires in: {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {/* QR Code with Logo */}
            <div className="flex justify-center">
              <div className="p-4 border rounded-lg bg-white relative">
                <QRCodeSVG
                  value={JSON.stringify(qrData)}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
                {/* Logo overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-full p-2 shadow-lg">
                    <Image
                      src="/schooltech.png"
                      alt="School Logo"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">QR Code ID:</span>
                <span className="font-mono">{qrData.qr_code_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span>{qrData.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated:</span>
                <span>{new Date(qrData.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={stopAutoRefresh}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Stop Generation
              </Button>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Teachers should scan this QR code using their mobile device 
                to sign in for the day. The code refreshes automatically every 15 seconds for security.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
