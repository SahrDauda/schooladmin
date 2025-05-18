"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, RefreshCw, UserCheck } from "lucide-react"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"

interface TeacherAttendanceQRProps {
  schoolId: string
  schoolName: string
}

export function TeacherAttendanceQR({ schoolId, schoolName }: TeacherAttendanceQRProps) {
  const [qrValue, setQrValue] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(15)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedTeachers, setScannedTeachers] = useState<string[]>([])

  // Generate a new QR code value
  const generateQRValue = useCallback(() => {
    const timestamp = Date.now()
    const randomValue = Math.random().toString(36).substring(2, 8)
    return `TCHR-${schoolId}-${timestamp}-${randomValue}`
  }, [schoolId])

  // Initialize the QR code and start the timer
  useEffect(() => {
    const newQRValue = generateQRValue()
    setQrValue(newQRValue)

    // Set up the countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          // Reset timer and generate new QR code
          setQrValue(generateQRValue())
          return 15
        }
        return prevTime - 1
      })
    }, 1000)

    // Clean up on unmount
    return () => clearInterval(timer)
  }, [generateQRValue])

  // Function to simulate scanning the QR code (for demo purposes)
  const simulateScan = async (teacherId = "TCH123456") => {
    setIsScanning(true)
    try {
      // Check if teacher exists
      const teacherDocRef = doc(db, "teachers", teacherId)
      const teacherDoc = await getDoc(teacherDocRef)

      if (!teacherDoc.exists()) {
        toast({
          title: "Error",
          description: "Teacher not found",
          variant: "destructive",
        })
        setIsScanning(false)
        return
      }

      const teacherData = teacherDoc.data()

      // Create attendance record
      const today = new Date()
      const dateString = today.toISOString().split("T")[0]
      const attendanceId = `TCHR_ATT_${teacherId}_${dateString}`

      // Create or update the attendance record
      await setDoc(
        doc(db, "teacher_attendance", attendanceId),
        {
          teacher_id: teacherId,
          teacher_name: `${teacherData.firstname} ${teacherData.lastname}`,
          date: dateString,
          timestamp: serverTimestamp(),
          status: "present",
          check_in_time: today.toLocaleTimeString(),
          school_id: schoolId,
          schoolName: schoolName,
          qr_code: qrValue,
        },
        { merge: true },
      )

      // Add to scanned teachers list for UI
      setScannedTeachers((prev) => [...prev, `${teacherData.firstname} ${teacherData.lastname}`])

      toast({
        title: "Success",
        description: `Attendance marked for ${teacherData.firstname} ${teacherData.lastname}`,
      })
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      })
    }
    setIsScanning(false)
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Teacher Attendance QR Code</CardTitle>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            Refreshes in: <span className="text-blue-600">{timeRemaining}s</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative p-4 bg-white rounded-md shadow-sm">
          <QRCodeSVG
            value={qrValue}
            size={200}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "/placeholder.svg?height=40&width=40",
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Teachers can scan this QR code to mark their attendance for today. The code refreshes every 15 seconds for
            security.
          </p>

          <div className="flex justify-center gap-2">
            <Button
              onClick={() => {
                setQrValue(generateQRValue())
                setTimeRemaining(15)
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh Code
            </Button>

            <Button variant="outline" onClick={() => simulateScan()} disabled={isScanning}>
              <UserCheck className="h-4 w-4 mr-2" />
              {isScanning ? "Processing..." : "Simulate Scan"}
            </Button>
          </div>

          {scannedTeachers.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Recently Scanned:</h4>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-sm space-y-1">
                  {scannedTeachers.map((teacher, index) => (
                    <li key={index} className="text-green-600 flex items-center">
                      <UserCheck className="h-3 w-3 mr-1" /> {teacher}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
