"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Camera,
  AlertCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import jsQR from "jsqr"

interface QRScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQRCodeScanned: (qrData: string) => void
  title?: string
  description?: string
}

export default function QRScannerModal({
  open,
  onOpenChange,
  onQRCodeScanned,
  title = "Scan QR Code",
  description = "Point your camera at the QR code to scan"
}: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setScanError("")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        
        // Wait for video to be ready, then start scanning
        videoRef.current.onloadedmetadata = () => {
          startQRScanning()
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setScanError("Unable to access camera. Please check permissions.")
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Get image data for QR detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        
        // Use jsQR to detect QR codes
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })
        
        if (code) {
          console.log("QR Code detected:", code.data)
          onQRCodeScanned(code.data)
          stopCamera()
          onOpenChange(false)
          return // Stop scanning after successful detection
        }
      }
      
      // Continue scanning if no QR code found
      if (isScanning) {
        scanIntervalRef.current = setTimeout(scanFrame, 100) // Scan every 100ms
      }
    }

    scanFrame()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Start camera when modal opens
      setTimeout(() => {
        startCamera()
      }, 100)
    } else {
      // Stop camera when modal closes
      stopCamera()
    }
    onOpenChange(newOpen)
  }

  const handleRetry = () => {
    setScanError("")
    startCamera()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[90%]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {scanError ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{scanError}</p>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg border"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white rounded-lg p-2">
                    <div className="w-48 h-48 border-2 border-green-500 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            {scanError && (
              <Button 
                onClick={handleRetry}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 