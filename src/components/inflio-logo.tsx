import { cn } from "@/lib/utils"

interface InflioLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function InflioLogo({ className, showText = true, size = "md" }: InflioLogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-2xl" },
    lg: { icon: "h-10 w-10", text: "text-3xl" }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-premium rounded-lg blur-xl opacity-50 animate-pulse" />
        
        {/* Logo icon */}
        <div className={cn(
          "relative gradient-premium rounded-lg p-2 shadow-premium",
          sizes[size].icon
        )}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Minimalist "I" design */}
            <path
              d="M12 4L12 20"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M8 4L16 4"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M8 20L16 20"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      
      {showText && (
        <span className={cn(
          "font-semibold tracking-tight gradient-text",
          sizes[size].text
        )}>
          Inflio
        </span>
      )}
    </div>
  )
} 