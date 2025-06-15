import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

interface InflioLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function InflioLogo({ className, size = "md" }: InflioLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const sizes = {
    sm: { logo: "h-12" },
    md: { logo: "h-16" },
    lg: { logo: "h-20" },
    xl: { logo: "h-24" }
  }
  
  // Calculate width based on aspect ratio (1618:677)
  const aspectRatio = 1618 / 677
  const logoHeights = {
    sm: 48,
    md: 64,
    lg: 80,
    xl: 96
  }
  const logoWidth = Math.round(logoHeights[size] * aspectRatio)

  // Determine which logo to use based on theme
  const logoSrc = mounted && (theme === "dark" || resolvedTheme === "dark") 
    ? "/infliologodark.svg" 
    : "/infliologo.svg"

  return (
    <div className={cn("flex items-center", className)}>
      {mounted ? (
        <Image
          src={logoSrc}
          alt="Inflio"
          width={logoWidth}
          height={logoHeights[size]}
          className={cn("object-contain", sizes[size].logo)}
          priority
        />
      ) : (
        // Placeholder to prevent layout shift
        <div className={cn("bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse", sizes[size].logo)} 
             style={{ width: logoWidth }} />
      )}
    </div>
  )
} 
