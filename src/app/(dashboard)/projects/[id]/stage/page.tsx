"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedBackground } from "@/components/animated-background"
import { EnhancedContentStager } from "@/components/staging/enhanced-content-stager"
import { SchedulingWizard } from "@/components/staging/scheduling-wizard"
import { StagingReview } from "@/components/staging/staging-review"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  IconArrowLeft,
  IconCalendar,
  IconSparkles,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconDeviceFloppy,
  IconTrash,
  IconInfoCircle
} from "@tabler/icons-react"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProjectService } from "@/lib/project-service"
import { StagingService } from "@/lib/staging/staging-service"
import { useClerkUser } from "@/hooks/use-clerk-user"
import { cn } from "@/lib/utils"
import { StagingSessionsService } from "@/lib/staging/staging-sessions-service"

interface StagingStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
}

interface StagingDraft {
  projectId: string
  savedAt: string
  currentStep: number
  stagedContent: any[]
  scheduledPosts: any[]
  version: number
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
  const [hasDraft, setHasDraft] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Load draft on mount
  useEffect(() => {
    if (projectId && user?.id) {
      checkForDraft()
      loadProjectAndContent()
    }
  }, [projectId, user])

  // Auto-save draft when content changes
  useEffect(() => {
    if (isDirty && stagedContent.length > 0) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft(true)
      }, 3000) // Auto-save after 3 seconds of inactivity

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
      }
    }
  }, [stagedContent, scheduledPosts, currentStep, isDirty])

  // Prevent navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const checkForDraft = () => {
    const draftKey = `staging-draft-${projectId}`
    const savedDraft = localStorage.getItem(draftKey)
    
    if (savedDraft) {
      try {
        const draft: StagingDraft = JSON.parse(savedDraft)
        setHasDraft(true)
        
        // Show toast to load draft
        const toastId = toast.info(
          <div className="flex items-center justify-between gap-4">
            <span>You have a saved draft from {new Date(draft.savedAt).toLocaleString()}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem(draftKey)
                  setHasDraft(false)
                  toast.dismiss(toastId)
                }}
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  loadDraft(draft)
                  toast.dismiss(toastId)
                }}
              >
                Load Draft
              </Button>
            </div>
          </div>,
          {
            duration: 10000
          }
        )
      } catch (error) {
        console.error('Error parsing draft:', error)
      }
    }
  }

  const loadDraft = (draft: StagingDraft) => {
    setCurrentStep(draft.currentStep)
    setStagedContent(draft.stagedContent)
    setScheduledPosts(draft.scheduledPosts)
    setIsDirty(false)
    toast.success('Draft loaded successfully')
  }

  const saveDraft = async (isAutoSave = false) => {
    setSavingDraft(true)
    
    try {
      const draft: StagingDraft = {
        projectId,
        savedAt: new Date().toISOString(),
        currentStep,
        stagedContent,
        scheduledPosts,
        version: 1
      }
      
      const draftKey = `staging-draft-${projectId}`
      localStorage.setItem(draftKey, JSON.stringify(draft))
      
      setIsDirty(false)
      
      if (!isAutoSave) {
        toast.success('Draft saved successfully')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    } finally {
      setSavingDraft(false)
    }
  }

  const clearDraft = () => {
    const draftKey = `staging-draft-${projectId}`
    localStorage.removeItem(draftKey)
    setHasDraft(false)
  }

  const clearAllFields = () => {
    setShowClearDialog(true)
  }

  const handleClearAllConfirm = () => {
    // Reset all content to initial state
    const clearedContent = stagedContent.map(item => {
      const platformContent: any = {}
      
      // Reset platform content for each platform
      item.platforms.forEach((platform: string) => {
        platformContent[platform] = {
          caption: '',
          hashtags: [],
          cta: '',
          characterCount: 0,
          isValid: true,
          validationErrors: [],
          altText: '',
          link: ''
        }
      })
      
      return {
        ...item,
        platformContent
      }
    })
    
    setStagedContent(clearedContent)
    setScheduledPosts([])
    setCurrentStep(0)
    setIsDirty(false)
    clearDraft()
    
    toast.success('All fields cleared')
    setShowClearDialog(false)
  }

  const loadProjectAndContent = async () => {
    if (!user?.id) {
      toast.error('Please sign in to continue')
      router.push('/signin')
      return
    }

    try {
      setLoading(true)
      
      // Load project data
      const projectData = await ProjectService.getProject(projectId)
      
      if (!projectData) {
        toast.error('Project not found')
        router.push(`/projects`)
        return
      }
      
      setProject(projectData)
      
      // Check if we have selected content from PublishingWorkflow
      const selectedContentData = sessionStorage.getItem('selectedContent')
      
      if (selectedContentData) {
        try {
          const parsedContent = JSON.parse(selectedContentData)
        
          // Initialize staged content from selected items
          const content = parsedContent.map((item: any) => {
            const platforms = determinePlatformsForContent(item)
          const platformContent: any = {}
          
          // Initialize platform content for each platform
          platforms.forEach((platform: string) => {
            platformContent[platform] = {
              caption: '',
              hashtags: [],
              cta: '',
              characterCount: 0,
              isValid: true,
              validationErrors: [],
              altText: '',
              link: ''
            }
          })
          
          // Extract media URLs based on content type
          let mediaUrls: string[] = []
            if (item.type === 'clip' && item.exportUrl) {
              mediaUrls = [item.exportUrl]
            } else if (item.type === 'image' && item.url) {
              mediaUrls = [item.url]
            } else if (item.thumbnail) {
              mediaUrls = [item.thumbnail]
          }
          
          // Map content type to expected values
          const mappedType = (() => {
            switch (item.type) {
              case 'video':
              case 'clip':
                return 'clip'
              case 'longform':
                return 'clip' // Long form videos are also clips for staging
              case 'social':
                return 'blog' // Social posts are text-based like blogs
              case 'blog':
                return 'blog'
              case 'image':
                return 'image'
              case 'carousel':
                return 'carousel'
              default:
                console.warn(`Unknown content type: ${item.type}, defaulting to clip`)
                return 'clip' // Default to clip for unknown types
            }
          })()
          
          return {
            id: item.id || Math.random().toString(36).substr(2, 9),
              type: mappedType,
              title: item.title || item.name || 'Untitled',
              description: item.description || item.content || '',
              originalData: {
                ...item,
                ...item.metadata, // Include all metadata
                projectId: projectId,
                projectContext: projectData.content_analysis || projectData.description,
                score: item.score || item.metadata?.score,
                viralityExplanation: item.viralityExplanation || item.metadata?.viralityExplanation,
                transcript: item.transcript || item.metadata?.transcript,
                tags: item.tags || item.metadata?.tags,
                publicationCaptions: item.publicationCaptions || item.metadata?.publicationCaptions,
                url: item.exportUrl || item.metadata?.url || item.preview,
                thumbnail: item.thumbnail || item.metadata?.thumbnail
              },
              platforms,
            platformContent,
            mediaUrls,
              thumbnailUrl: item.thumbnail || item.url,
              duration: item.duration,
            analytics: {
                estimatedReach: item.score ? Math.floor(item.score * 10000) : 5000
            }
          }
        })
        
        setStagedContent(content)
          
          // Clear the session storage
          sessionStorage.removeItem('selectedContent')
        } catch (error) {
          console.error('Error parsing selected content:', error)
          toast.error('Failed to load selected content')
          router.push(`/projects/${projectId}`)
          return
        }
      } else {
        // No content selected
        toast.error('No content selected. Please select content to publish.')
        router.push(`/projects/${projectId}`)
        return
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading project:', error)
      }
      toast.error('Failed to load project data')
      router.push(`/projects/${projectId}`)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to determine platforms based on content type
  const determinePlatformsForContent = (item: any) => {
    switch (item.type) {
      case 'clip':
        return ['instagram', 'tiktok', 'youtube-short']
      case 'longform':
        return ['youtube', 'facebook']
      case 'blog':
        return ['linkedin', 'x', 'facebook']
      case 'image':
        return ['instagram', 'facebook', 'linkedin', 'threads']
      case 'social':
        return ['instagram', 'x', 'threads']
      default:
        return ['instagram', 'x']
    }
  }

  const handleContentUpdate = (updatedContent: any[]) => {
    setStagedContent(updatedContent)
    setIsDirty(true)
  }

  const handleSchedulingComplete = (scheduled: any[]) => {
    setScheduledPosts(scheduled)
    setCurrentStep(2)
    setIsDirty(true)
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
      
      // Clear draft after successful publish
      clearDraft()
      
      toast.success('Content scheduled successfully!')
      
      // Show info about demo mode
      setTimeout(() => {
        toast.info('Note: Posts are scheduled in demo mode. Connect social accounts in Settings to publish for real.', {
          duration: 5000
        })
      }, 1000)
      
      // Redirect to social calendar
      router.push('/social/calendar')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error publishing content:', error)
      }
      toast.error('Failed to schedule content')
    } finally {
      setPublishing(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      if (isDirty) {
        setShowExitDialog(true)
    } else {
      router.push(`/projects/${projectId}`)
      }
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleExitWithoutSave = () => {
    clearDraft()
    router.push(`/projects/${projectId}`)
  }

  const handleExitWithSave = async () => {
    await saveDraft()
    router.push(`/projects/${projectId}`)
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
          <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
            
            <div className="flex items-center gap-2">
              {isDirty && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <IconInfoCircle className="h-3 w-3 mr-1" />
                  Unsaved changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveDraft()}
                disabled={savingDraft || !isDirty}
              >
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                {savingDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFields}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
          
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
            <EnhancedContentStager
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

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save your progress?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them as a draft before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-background text-foreground border hover:bg-accent"
              onClick={handleExitWithoutSave}
            >
              Don't Save
            </AlertDialogAction>
            <AlertDialogAction onClick={handleExitWithSave}>
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all fields?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all content you've entered. Your selected items will remain, but all captions, hashtags, and scheduling information will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 