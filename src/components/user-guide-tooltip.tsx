"use client"

import { useState, useEffect } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { IconInfoCircle, IconX } from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface UserGuideTooltipProps {
  id: string
  title: string
  content: string
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  showOnce?: boolean
  delay?: number
  highlight?: boolean
}

export function UserGuideTooltip({
  id,
  title,
  content,
  children,
  side = "top",
  showOnce = true,
  delay = 500,
  highlight = true
}: UserGuideTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if this tooltip has been dismissed
    const dismissed = localStorage.getItem(`tooltip-dismissed-${id}`)
    if (dismissed === 'true') {
      setIsDismissed(true)
      return
    }

    // Show tooltip after delay if not shown before
    if (showOnce && !hasBeenShown && !isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        setHasBeenShown(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [id, showOnce, hasBeenShown, isDismissed, delay])

  const handleDismiss = () => {
    setIsOpen(false)
    setIsDismissed(true)
    localStorage.setItem(`tooltip-dismissed-${id}`, 'true')
  }

  if (isDismissed && showOnce) {
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div className={cn(
            "relative inline-block",
            highlight && isOpen && "ring-2 ring-primary ring-offset-2 rounded-md"
          )}>
            {children}
            {!isDismissed && (
              <div className="absolute -top-2 -right-2 z-10">
                <div className="relative">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm flex items-center gap-1">
                      <IconInfoCircle className="h-4 w-4 text-primary" />
                      {title}
                    </p>
                    <p className="text-sm text-muted-foreground">{content}</p>
                  </div>
                  {showOnce && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={handleDismiss}
                    >
                      <IconX className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Quick tour component for multiple steps
interface TourStep {
  id: string
  selector: string
  title: string
  content: string
  position?: "top" | "bottom" | "left" | "right"
}

export function ProductTour({ steps }: { steps: TourStep[] }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [hasCompletedTour, setHasCompletedTour] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('product-tour-completed')
    if (completed === 'true') {
      setHasCompletedTour(true)
    } else {
      // Start tour after a delay
      const timer = setTimeout(() => setIsActive(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const handleSkip = () => {
    completeTour()
  }

  const completeTour = () => {
    setIsActive(false)
    setHasCompletedTour(true)
    localStorage.setItem('product-tour-completed', 'true')
  }

  if (!isActive || hasCompletedTour) return null

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleSkip} />
      
      {/* Highlight current element */}
      {currentStepData && (
        <div
          className="absolute ring-4 ring-primary ring-offset-4 rounded-lg pointer-events-none"
          style={{
            // This would need to be calculated based on the selector
            // For now, we'll just show the tooltip
          }}
        />
      )}

      {/* Tour tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg shadow-lg p-6 max-w-md pointer-events-auto"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{currentStepData.content}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button size="sm" onClick={handleNext}>
                {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 