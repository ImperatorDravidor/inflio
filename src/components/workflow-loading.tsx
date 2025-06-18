"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconLoader2, IconSparkles, IconWand } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface WorkflowLoadingProps {
  title?: string
  description?: string
  className?: string
}

export function WorkflowLoading({ 
  title = "Processing Your Content", 
  description = "AI workflows are running. This may take a few moments...",
  className 
}: WorkflowLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[60vh]", className)}>
      <Card className="max-w-md w-full mx-4 shadow-2xl border-primary/20 overflow-hidden relative">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] animate-gradient-x opacity-20" />
        
        <CardHeader className="text-center relative">
          <div className="mx-auto mb-4 relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin-slow" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            
            {/* Center icon with pulse */}
            <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse">
              <IconWand className="h-12 w-12 text-primary" />
              
              {/* Floating sparkles */}
              <IconSparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500 animate-float" />
              <IconSparkles className="absolute -bottom-1 -left-2 h-4 w-4 text-purple-500 animate-float-delayed" />
            </div>
          </div>
          
          <CardTitle className="text-2xl">
            <span className="gradient-text font-bold">{title}</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Progress indicators */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">Analyzing video content</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse animation-delay-200" />
              <span className="text-muted-foreground">Running AI workflows</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse animation-delay-400" />
              <span className="text-muted-foreground">Generating outputs</span>
            </div>
          </div>
          
          {/* Loading bar */}
          <div className="mt-6 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-purple-500 animate-loading-bar" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}