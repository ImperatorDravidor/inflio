"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedBackground } from "@/components/animated-background"
import { WorkflowHeader } from "@/components/workflow-header"
import { EnhancedContentStager } from "@/components/staging/enhanced-content-stager"
import { AISchedulingAssistant } from "@/components/staging/ai-scheduling-assistant"
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
  const stepParam = searchParams.get('step')
  
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  // Initialize step from URL parameter or default to 2 (Prepare Content)
  const [currentStep, setCurrentStep] = useState(() => {
    const step = stepParam ? parseInt(stepParam) : 2
    // Ensure step is within valid range (2-4 for staging steps)
    return Math.min(Math.max(step, 2), 4)
  })
  const [stagedContent, setStagedContent] = useState<any[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [publishing, setPublishing] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [contentLoaded, setContentLoaded] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track if we've already loaded content to prevent re-runs
  const hasLoadedContent = useRef(false)
  
  // Load draft on mount
  useEffect(() => {
    if (projectId && user?.id && !hasLoadedContent.current) {
      hasLoadedContent.current = true
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
    // Adjust step number for new 5-step workflow
    // Old drafts had steps 0-2, new has steps 2-4 for the same content
    const adjustedStep = draft.currentStep < 2 ? draft.currentStep + 2 : draft.currentStep
    setCurrentStep(adjustedStep)
    setStagedContent(draft.stagedContent)
    setScheduledPosts(draft.scheduledPosts)
    setContentLoaded(true)
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
    setCurrentStep(2) // Reset to Prepare Content (3rd step)
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
      
      // Load project data with better error handling
      let projectData = null
      try {
        projectData = await ProjectService.getProject(projectId)
        
        if (!projectData) {
          console.error('Project not found for ID:', projectId)
          toast.error('Project not found. Please try again from the projects page.')
          router.push(`/projects`)
          return
        }
        
        setProject(projectData)
        console.log('Project loaded successfully:', projectData.title || projectData.id)
      } catch (projectError) {
        console.error('Error loading project:', projectError)
        toast.error('Failed to load project. Please try again.')
        router.push(`/projects`)
        return
      }
      
      // Check if we have selected content from PublishingWorkflow
      const selectedContentData = sessionStorage.getItem('selectedContent')
      console.log('Staging page - checking for selectedContent in sessionStorage')
      console.log('Available sessionStorage keys:', Object.keys(sessionStorage))
      console.log('selectedContent data:', selectedContentData)
      
      if (selectedContentData) {
        try {
          const parsedContent = JSON.parse(selectedContentData)
          console.log('Staging page - parsed content:', parsedContent)
          console.log('Number of items:', parsedContent.length)
        
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
          setContentLoaded(true)
          
          // Keep sessionStorage available for the entire session
          // Only clear when user navigates away or publishes successfully
        } catch (error) {
          console.error('Error parsing selected content:', error)
          toast.error('Failed to load selected content')
          router.push(`/projects/${projectId}`)
          return
        }
      } else {
        // Only redirect if we're certain there's no content and we're not still loading
        if (!stagedContent.length && !contentLoaded && !loading) {
          console.log('No content in sessionStorage and no staged content')
          
          // Give a bit more time for any pending state updates
          setTimeout(() => {
            // Double-check before redirecting
            if (!stagedContent.length && !contentLoaded) {
              toast.error('No content selected. Please select content to publish.')
              router.push(`/projects/${projectId}`)
            }
          }, 500)
          return
        }
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
          // YouTube Shorts are still under 'youtube' platform
          return ['instagram', 'tiktok', 'youtube']
        case 'longform':
          // Long form videos are for full-length platforms
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
    setCurrentStep(4) // Go to Review & Publish (5th step)
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
      
      // Clear draft and sessionStorage after successful publish
      clearDraft()
      sessionStorage.removeItem('selectedContent')
      sessionStorage.removeItem('selectedContentIds')
      
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
    if (currentStep > 2) { // Can't go back before Prepare Content (step 3)
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
    if (currentStep < 4) { // Maximum step is 4 (Review & Publish)
      setCurrentStep(currentStep + 1)
    }
  }

  const handleExitWithoutSave = () => {
    clearDraft()
    sessionStorage.removeItem('selectedContent')
    sessionStorage.removeItem('selectedContentIds')
    router.push(`/projects/${projectId}`)
  }

  const handleExitWithSave = async () => {
    await saveDraft()
    router.push(`/projects/${projectId}`)
  }

  if (loading && !contentLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      {/* Global Workflow Header */}
      <WorkflowHeader currentStep={currentStep} projectId={projectId} />
      
      <div className="relative max-w-7xl mx-auto px-4 py-8 pt-24">
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


        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 2 && (
            <EnhancedContentStager
              content={stagedContent}
              onUpdate={handleContentUpdate}
              onNext={handleNext}
            />
          )}
          
          {currentStep === 3 && (
            <AISchedulingAssistant
              content={stagedContent}
              onComplete={handleSchedulingComplete}
              onBack={() => setCurrentStep(2)}
            />
          )}
          
          {currentStep === 4 && (
            <StagingReview
              scheduledPosts={scheduledPosts}
              onPublish={handlePublish}
              onBack={() => setCurrentStep(3)}
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