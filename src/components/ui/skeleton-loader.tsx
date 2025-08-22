"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  count?: number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = "bg-muted rounded animate-pulse"
  
  const variantClasses = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
    card: "rounded-lg"
  }
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent bg-[length:200%_100%] animate-shimmer",
    none: ""
  }
  
  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || (variant === 'circular' ? 40 : '100%'),
        height: height || (variant === 'circular' ? 40 : variant === 'text' ? 16 : 100)
      }}
    />
  ))
  
  return count > 1 ? (
    <div className="space-y-2">
      {elements}
    </div>
  ) : (
    elements[0]
  )
}

// Preset skeleton components for common use cases
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 rounded-lg border bg-card", className)}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
      </div>
    </div>
  )
}

export function SkeletonPost({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-lg border bg-card", className)}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="flex-1">
          <Skeleton variant="text" width="30%" height={14} />
        </div>
        <Skeleton variant="rectangular" width={60} height={20} />
      </div>
      <Skeleton variant="rectangular" width="100%" height={200} className="mb-3" />
      <Skeleton variant="text" count={3} />
      <div className="flex gap-2 mt-3">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={14} />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
          <Skeleton variant="rectangular" width={80} height={28} />
        </motion.div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted/50 p-3 border-b">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton key={i} variant="text" height={14} />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="p-3">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }, (_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  height={16}
                  width={colIndex === 0 ? "100%" : "80%"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={200} height={32} />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={100} height={40} />
          <Skeleton variant="rectangular" width={100} height={40} />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="p-6 rounded-lg border bg-card">
            <Skeleton variant="text" width="60%" height={14} className="mb-2" />
            <Skeleton variant="text" width="40%" height={28} />
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}