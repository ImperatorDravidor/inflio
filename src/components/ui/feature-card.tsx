"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { designSystem } from '@/lib/design-system'

interface FeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error'
  }
  gradient?: keyof typeof designSystem.colors.gradients
  stats?: Array<{
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'neutral'
  }>
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline' | 'ghost'
    icon?: ReactNode
  }>
  isNew?: boolean
  isPremium?: boolean
  disabled?: boolean
  className?: string
  delay?: number
}

export function FeatureCard({
  title,
  description,
  icon,
  onClick,
  badge,
  gradient,
  stats,
  actions,
  isNew,
  isPremium,
  disabled,
  className,
  delay = 0
}: FeatureCardProps) {
  const cardContent = (
    <>
      {/* Background gradient effect */}
      {gradient && (
        <div 
          className="absolute inset-0 rounded-xl opacity-10"
          style={{
            background: designSystem.colors.gradients[gradient]
          }}
        />
      )}

      {/* New/Premium badges */}
      {(isNew || isPremium) && (
        <div className="absolute -top-2 -right-2 z-10">
          {isNew && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
          {isPremium && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              Premium
            </Badge>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              className={cn(
                "p-3 rounded-lg",
                gradient 
                  ? "bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm"
                  : "bg-primary/10"
              )}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={cn(
                gradient ? "text-foreground" : "text-primary",
                "h-6 w-6"
              )}>
                {icon}
              </div>
            </motion.div>

            {/* Title and description */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{title}</h3>
                {badge && (
                  <Badge variant={badge.variant || 'secondary'} className="text-xs">
                    {badge.text}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>
          </div>

          {/* Click indicator for interactive cards */}
          {onClick && !disabled && (
            <motion.div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          )}
        </div>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.1 + index * 0.05 }}
              >
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.trend && (
                    <span className={cn(
                      "text-xs ml-1",
                      stat.trend === 'up' && "text-green-500",
                      stat.trend === 'down' && "text-red-500",
                      stat.trend === 'neutral' && "text-yellow-500"
                    )}>
                      {stat.trend === 'up' && '↑'}
                      {stat.trend === 'down' && '↓'}
                      {stat.trend === 'neutral' && '→'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick()
                }}
                disabled={disabled}
                className="flex-1"
              >
                {action.icon && <span className="mr-1.5">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        initial={false}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
    </>
  )

  const baseCard = (
    <motion.div
      className={cn(
        "relative group",
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        "transition-all duration-200",
        onClick && !disabled && "cursor-pointer hover:shadow-lg hover:border-primary/20",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={!disabled && onClick ? { scale: 1.02 } : {}}
      whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
    >
      {cardContent}
    </motion.div>
  )

  return baseCard
}

// Preset card variants for common use cases
export const FeatureCardPresets = {
  thumbnail: {
    title: "AI Thumbnails",
    description: "Generate stunning thumbnails with AI-powered creativity",
    gradient: "purple" as const,
    stats: [
      { label: "Generated", value: "0", trend: "neutral" as const },
      { label: "Avg Score", value: "0%", trend: "neutral" as const },
      { label: "Used", value: "0", trend: "neutral" as const }
    ]
  },
  posts: {
    title: "Social Posts",
    description: "Create engaging content for all your social platforms",
    gradient: "sunset" as const,
    stats: [
      { label: "Suggestions", value: "0", trend: "neutral" as const },
      { label: "Platforms", value: "0", trend: "neutral" as const },
      { label: "Scheduled", value: "0", trend: "neutral" as const }
    ]
  },
  longform: {
    title: "Long-form Editor",
    description: "Edit transcripts, add chapters, and generate subtitles",
    gradient: "ocean" as const,
    stats: [
      { label: "Duration", value: "0m", trend: "neutral" as const },
      { label: "Chapters", value: "0", trend: "neutral" as const },
      { label: "Words", value: "0", trend: "neutral" as const }
    ]
  },
  schedule: {
    title: "Smart Scheduling",
    description: "AI-optimized posting times for maximum engagement",
    gradient: "success" as const,
    stats: [
      { label: "Queued", value: "0", trend: "neutral" as const },
      { label: "Today", value: "0", trend: "neutral" as const },
      { label: "This Week", value: "0", trend: "neutral" as const }
    ]
  }
}