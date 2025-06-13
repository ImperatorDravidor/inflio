"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { IconSparkles, IconLoader2 } from "@tabler/icons-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"

// Project Card Skeleton
export function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-in">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gradient-to-br from-primary/5 to-accent/5">
          <Skeleton className="w-full h-full" />
          <div className="absolute bottom-2 right-2">
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Projects Grid Skeleton
export function ProjectsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Processing Progress Component
export function ProcessingProgress({ 
  progress, 
  currentStep, 
  totalSteps, 
  label = "Processing..."
}: {
  progress: number
  currentStep?: number
  totalSteps?: number
  label?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="sm" />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
      </div>
      
      <div className="relative w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" />
        <div 
          className="relative gradient-premium h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {currentStep && totalSteps && (
        <div className="text-sm text-muted-foreground text-center">
          Step {currentStep} of {totalSteps}
        </div>
      )}
    </div>
  )
}

// Upload Progress with Preview
export function UploadProgress({ 
  progress, 
  fileName,
  fileSize,
  onCancel 
}: {
  progress: number
  fileName: string
  fileSize: string
  onCancel?: () => void
}) {
  return (
    <div className="space-y-4 p-6 border rounded-xl bg-card/50 backdrop-blur-sm animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 gradient-premium rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-16 h-16 gradient-premium rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">{fileName}</p>
            <p className="text-sm text-muted-foreground">{fileSize}</p>
          </div>
        </div>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="relative w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" />
          <div 
            className="relative gradient-premium h-3 rounded-full transition-all duration-300 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <IconSparkles className="h-4 w-4 animate-pulse" />
            Uploading...
          </span>
          <span className="font-medium">{Math.round(progress)}% complete</span>
        </div>
      </div>
    </div>
  )
}

// Feature Card Skeleton
export function FeatureCardSkeleton() {
  return (
    <Card className="animate-in">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center animate-in">
      <div className="bg-card p-8 rounded-2xl shadow-2xl border gradient-premium-subtle">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <span className="font-semibold text-lg">{message}</span>
        </div>
      </div>
    </div>
  )
}

// Shimmer effect for content loading
export function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted rounded-lg", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
} 