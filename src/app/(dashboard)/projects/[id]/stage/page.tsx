"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedBackground } from "@/components/animated-background"
import { ContentStager } from "@/components/staging/content-stager"
import { SchedulingWizard } from "@/components/staging/scheduling-wizard"
import { StagingReview } from "@/components/staging/staging-review"
import { 
  IconArrowLeft,
  IconCalendar,
  IconSparkles,
  IconCheck,
  IconAlertCircle,
  IconClock
} from "@tabler/icons-react"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProjectService } from "@/lib/project-service"
import { StagingService } from "@/lib/staging/staging-service"
import { useClerkUser } from "@/hooks/use-clerk-user"
import { cn } from "@/lib/utils"

interface StagingStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
}

export default function ProjectStagePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useClerkUser()
  
  const projectId = params.id as string
  const selectedContent = searchParams.get('content')?.split(',') || []
  
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [stagedContent, setStagedContent] = useState<any[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [publishing, setPublishing] = useState(false)

  const steps: StagingStep[] = [
    {
      id: 'content',
      title: 'Prepare Content',
      description: 'Add platform-specific details',
      completed: currentStep > 0,
      current: currentStep === 0
    },
    {
      id: 'schedule',
      title: 'Schedule Posts',
      description: 'AI-powered optimal timing',
      completed: currentStep > 1,
      current: currentStep === 1
    },
    {
      id: 'review',
      title: 'Review & Publish',
      description: 'Final review before publishing',
      completed: currentStep > 2,
      current: currentStep === 2
    }
  ]

  useEffect(() => {
    if (projectId && user?.id) {
      loadProjectAndContent()
    }
  }, [projectId, user])

  const loadProjectAndContent = async () => {
    try {
      setLoading(true)
      
      // Load project data with user ID for proper filtering
      const projectData = await ProjectService.getProject(projectId, user?.id)
      
      if (!projectData) {
        toast.error('Project not found')
        router.push(`/projects`)
        return
      }
      
      setProject(projectData)
      
      // Initialize staged content from selected items
      if (selectedContent.length > 0) {
        const content = await StagingService.initializeStagedContent(
          projectId,
          selectedContent,
          projectData
        )
        setStagedContent(content)
      } else {
        // Redirect back if no content selected
        router.push(`/projects/${projectId}`)
        return
      }
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project data')
      router.push(`/projects/${projectId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleContentUpdate = (updatedContent: any[]) => {
    setStagedContent(updatedContent)
  }

  const handleSchedulingComplete = (scheduled: any[]) => {
    setScheduledPosts(scheduled)
    setCurrentStep(2)
  }

  const handlePublish = async () => {
    if (!user?.id) return
    
    try {
      setPublishing(true)
      
      // Create social posts in database
      await StagingService.publishScheduledContent(
        user.id,
        projectId,
        scheduledPosts
      )
      
      toast.success('Content scheduled successfully!')
      
      // Redirect to social calendar
      router.push('/social/calendar')
    } catch (error) {
      console.error('Error publishing content:', error)
      toast.error('Failed to schedule content')
    } finally {
      setPublishing(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push(`/projects/${projectId}`)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Content Staging</h1>
              <p className="text-muted-foreground mt-2">
                Prepare and schedule your content for social media
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {project?.title}
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      step.completed && "bg-primary border-primary text-primary-foreground",
                      step.current && "border-primary text-primary",
                      !step.completed && !step.current && "border-muted-foreground/30"
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
                      step.current && "text-primary"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
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

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 0 && (
            <ContentStager
              content={stagedContent}
              onUpdate={handleContentUpdate}
              onNext={handleNext}
            />
          )}
          
          {currentStep === 1 && (
            <SchedulingWizard
              content={stagedContent}
              onComplete={handleSchedulingComplete}
              onBack={() => setCurrentStep(0)}
            />
          )}
          
          {currentStep === 2 && (
            <StagingReview
              scheduledPosts={scheduledPosts}
              onPublish={handlePublish}
              onBack={() => setCurrentStep(1)}
              publishing={publishing}
            />
          )}
        </div>
      </div>
    </div>
  )
} 