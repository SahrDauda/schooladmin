import Image from "next/image"
import { cn } from "@/lib/utils"

interface SchoolTechLogoProps {
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function SchoolTechLogo({ size = "md", className }: SchoolTechLogoProps) {
  // Define sizes for different variants
  const sizes = {
    xs: { width: 60, height: 30 },
    sm: { width: 120, height: 60 },
    md: { width: 180, height: 90 },
    lg: { width: 240, height: 120 },
  }

  const { width, height } = sizes[size]

  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Asset%2020%402x-sSj2DTCgSIFvuyWMEl5rDibRxRtPLq.png"
        alt="SchoolTech Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  )
}
