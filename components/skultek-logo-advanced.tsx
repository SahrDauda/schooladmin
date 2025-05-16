interface SkulTekLogoAdvancedProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
  textClassName?: string
}

export function SkulTekLogoAdvanced({
  size = "md",
  className = "",
  showText = true,
  textClassName = "",
}: SkulTekLogoAdvancedProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center ${sizeClasses[size]} rounded-md bg-gradient-to-br from-[#1E3A5F] to-[#2563eb] text-white shadow-md ${className}`}
      >
        <span className="font-bold">S</span>
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} text-[#1E3A5F] ${textClassName}`}>
          Skult<span className="text-[#2563eb]">ɛ</span>k
        </span>
      )}
    </div>
  )
}
