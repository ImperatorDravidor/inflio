"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  IconLoader2, 
  IconSparkles, 
  IconWand,
  IconCheck,
  IconClock,
  IconFileText,
  IconScissors,
  IconArticle,
  IconBrandTwitter,
  IconMicrophone
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface WorkflowStep {
  id: string
  icon: any
  title: string
  description: string
  status: 'pending' | 'active' | 'completed'
}

interface WorkflowLoadingProps {
  title?: string
  description?: string
  className?: string
  showSteps?: boolean
  progress?: number
  estimatedTime?: number // in seconds
  activeStep?: string
}

const defaultSteps: WorkflowStep[] = [
  {
    id: 'transcription',
    icon: IconFileText,
    title: 'Transcription',
    description: 'Converting speech to text',
    status: 'pending'
  },
  {
    id: 'clips',
    icon: IconScissors,
    title: 'Smart Clips',
    description: 'Identifying key moments',
    status: 'pending'
  },
  {
    id: 'blog',
    icon: IconArticle,
    title: 'Blog Generation',
    description: 'Creating written content',
    status: 'pending'
  },
  {
    id: 'social',
    icon: IconBrandTwitter,
    title: 'Social Media',
    description: 'Crafting social posts',
    status: 'pending'
  }
]

export function WorkflowLoading({ 
  title = "Processing Your Content", 
  description = "AI workflows are running. This may take a few moments...",
  className,
  showSteps = false,
  progress = 0,
  estimatedTime,
  activeStep
}: WorkflowLoadingProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [steps, setSteps] = useState(defaultSteps)

  useEffect(() => {
    if (activeStep) {
      setSteps(current => current.map(step => ({
        ...step,
        status: step.id === activeStep ? 'active' : 
                current.findIndex(s => s.id === activeStep) > current.findIndex(s => s.id === step.id) ? 'completed' : 'pending'
      })))
    }
  }, [activeStep])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className={cn("flex items-center justify-center min-h-[60vh]", className)}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="max-w-2xl w-full mx-4 shadow-2xl border-primary/20 overflow-hidden relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-primary animate-gradient-x" />
        </div>
        
        <CardHeader className="text-center relative pb-2">
          <motion.div 
            className="mx-auto mb-4 relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            
            {/* Rotating rings */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Center icon */}
            <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <IconWand className="h-12 w-12 text-primary" />
              
              {/* Orbiting sparkles */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <IconSparkles className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 h-4 w-4 text-yellow-500" />
                <IconSparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 h-4 w-4 text-purple-500" />
              </motion.div>
            </div>
          </motion.div>
          
          <CardTitle className="text-2xl">
            <span className="gradient-text font-bold">{title}</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>

          {/* Time indicators */}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <IconClock className="h-4 w-4" />
              <span>Elapsed: {formatTime(elapsedTime)}</span>
            </div>
            {estimatedTime && (
              <>
                <span>•</span>
                <span>Estimated: ~{Math.ceil(estimatedTime / 60)} min</span>
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Overall progress bar */}
          {progress > 0 && (
            <motion.div 
              className="space-y-2"
              variants={itemVariants}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}

          {/* Workflow steps */}
          {showSteps && (
            <motion.div className="space-y-3 mt-6" variants={itemVariants}>
              <AnimatePresence mode="wait">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = step.status === 'active'
                  const isCompleted = step.status === 'completed'
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-all",
                        isActive && "bg-primary/10 border border-primary/20",
                        isCompleted && "opacity-60"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-all",
                        isActive && "bg-primary text-primary-foreground animate-pulse",
                        isCompleted && "bg-muted text-muted-foreground",
                        !isActive && !isCompleted && "bg-muted/50 text-muted-foreground"
                      )}>
                        {isCompleted ? (
                          <IconCheck className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            isActive && "text-primary"
                          )}>
                            {step.title}
                          </p>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs animate-pulse">
                              <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />
                              Processing
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="outline" className="text-xs">
                              <IconCheck className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </div>

                      {isActive && (
                        <div className="w-12 h-12 relative">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-muted"
                            />
                            <motion.circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-primary"
                              strokeDasharray="126"
                              initial={{ strokeDashoffset: 126 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Simple loading indicators when steps aren't shown */}
          {!showSteps && (
            <motion.div className="space-y-3" variants={itemVariants}>
              {[
                "Analyzing video content",
                "Running AI workflows", 
                "Generating outputs"
              ].map((text, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className={cn(
                    "w-2 h-2 rounded-full bg-primary animate-pulse",
                    index === 1 && "animation-delay-200",
                    index === 2 && "animation-delay-400"
                  )} />
                  <span className="text-muted-foreground">{text}</span>
                </div>
              ))}
            </motion.div>
          )}
          
          {/* Animated loading bar */}
          <motion.div 
            className="mt-6 h-1 bg-muted rounded-full overflow-hidden"
            variants={itemVariants}
          >
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Fun fact or tip */}
          <motion.div 
            className="mt-4 p-3 bg-muted/50 rounded-lg"
            variants={itemVariants}
          >
            <p className="text-xs text-muted-foreground text-center">
              💡 <span className="italic">Did you know? Our AI analyzes over 50 different factors to create the perfect clips!</span>
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}