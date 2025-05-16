interface SkulTekLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function SkulTekLogo({ size = "md", className = "" }: SkulTekLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return (
    <div
      className={`flex items-center justify-center ${sizeClasses[size]} rounded-md bg-[#1E3A5F] text-white ${className}`}
    >
      <span className="font-bold text-lg">S</span>
      <span className="text-xs absolute translate-y-1">k</span>
    </div>
  )
}
