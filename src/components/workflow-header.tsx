"use client"

import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"
import { useRouter, usePathname } from "next/navigation"

interface WorkflowStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
}

interface WorkflowHeaderProps {
  currentStep?: number
  projectId?: string
  className?: string
}

export function WorkflowHeader({ 
  currentStep = 0, 
  projectId,
  className 
}: WorkflowHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Determine current step based on pathname if not explicitly provided
  const determineCurrentStep = () => {
    if (pathname.includes('/studio/upload') || pathname.includes('/studio/processing')) {
      return 0 // Upload step
    } else if (pathname.includes('/projects/') && pathname.includes('/stage')) {
      // Staging page - check for step parameter
      const urlStep = new URLSearchParams(window.location.search).get('step')
      return urlStep ? parseInt(urlStep) : 2 // Default to Prepare Content
    } else if (pathname.includes('/projects/') && projectId) {
      return 1 // Project step
    }
    return currentStep
  }
  
  const activeStep = determineCurrentStep()
  
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'upload',
      title: 'Upload',
      description: 'Upload content',
      completed: activeStep > 0,
      current: activeStep === 0
    },
    {
      id: 'project',
      title: 'Project',
      description: 'Create',
      completed: activeStep > 1,
      current: activeStep === 1
    },
    {
      id: 'content',
      title: 'Prepare Content',
      description: 'Add details',
      completed: activeStep > 2,
      current: activeStep === 2
    },
    {
      id: 'schedule',
      title: 'Schedule Posts',
      description: 'Set timing',
      completed: activeStep > 3,
      current: activeStep === 3
    },
    {
      id: 'review',
      title: 'Review & Publish',
      description: 'Final review',
      completed: activeStep > 4,
      current: activeStep === 4
    }
  ]
  
  const handleStepClick = (index: number) => {
    if (index === 0) {
      // Upload step - go to studio upload
      router.push('/studio/upload')
    } else if (index === 1 && projectId) {
      // Project step - go to project page
      router.push(`/projects/${projectId}`)
    } else if (index >= 2 && projectId) {
      // Staging steps - go to staging page with step parameter
      router.push(`/projects/${projectId}/stage?step=${index}`)
    }
  }
  
  return (
    <div className={cn("sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b", className)}>
      <div className="max-w-[1920px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index < workflowSteps.length - 1 && "flex-1"
              )}
            >
              <button
                className="flex flex-col items-center focus:outline-none disabled:cursor-not-allowed"
                onClick={() => handleStepClick(index)}
                disabled={!projectId && index > 0}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    step.completed && "bg-primary border-primary text-primary-foreground",
                    step.current && "border-primary text-primary bg-primary/10",
                    !step.completed && !step.current && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {step.completed ? (
                    <IconCheck className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    step.current && "text-primary",
                    !step.current && !step.completed && "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </button>
              {index < workflowSteps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] mx-4 mt-[-20px]",
                    step.completed ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




