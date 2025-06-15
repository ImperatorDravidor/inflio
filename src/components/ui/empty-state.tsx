import { ReactNode } from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost'
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon && (
          <div className="mb-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <Button
            variant={action.variant || 'default'}
            onClick={action.onClick}
            size="sm"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 
