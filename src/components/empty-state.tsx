import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  iconClassName?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className, 
  iconClassName 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      {icon && (
        <div className="relative mb-6">
          <div className="absolute inset-0 gradient-premium rounded-full blur-2xl opacity-20 animate-pulse" />
          <div className={cn("relative", iconClassName)}>
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-6 max-w-md">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="gradient-premium hover:opacity-90 transition-opacity">
          {action.label}
        </Button>
      )}
    </div>
  )
} 