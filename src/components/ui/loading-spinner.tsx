import { cn } from "@/lib/utils"
import { IconLoader2 } from "@tabler/icons-react"
import { motion } from "framer-motion"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "primary" | "secondary" | "dots" | "pulse"
  className?: string
  label?: string
}

export function LoadingSpinner({ 
  size = "md", 
  variant = "default",
  className,
  label
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-full bg-primary",
              size === "sm" ? "h-1.5 w-1.5" :
              size === "md" ? "h-2 w-2" :
              size === "lg" ? "h-2.5 w-2.5" :
              "h-3 w-3"
            )}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <motion.div
          className="absolute inset-0 rounded-full bg-primary"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        />
        <div className="relative h-full w-full rounded-full bg-primary" />
        {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
      </div>
    )
  }

  const colorClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary"
  }

  return (
    <div className={cn("flex items-center", className)}>
      <IconLoader2 
        className={cn(
          "animate-spin",
          sizeClasses[size],
          colorClasses[variant as keyof typeof colorClasses]
        )}
      />
      {label && <span className="ml-2 text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}

export function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <LoadingSpinner size="xl" variant="primary" />
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      </motion.div>
    </div>
  )
} 