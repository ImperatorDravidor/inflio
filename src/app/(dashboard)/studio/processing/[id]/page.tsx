"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  IconSparkles, 
  IconFileText, 
  IconScissors, 
  IconArticle, 
  IconBrandTwitter,
  IconMicrophone,
  IconCheck,
  IconX,
  IconLoader2,
  IconClock,
  IconFolder,
  IconArrowRight,
  IconRefresh
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, ProcessingTask } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimatedBackground } from "@/components/animated-background"
import { WorkflowLoading } from "@/components/workflow-loading"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const taskDetails = {
  transcription: {
    icon: IconFileText,
    title: "AI Content Analysis & Transcription",
    description: "Converting speech to text and analyzing content using advanced AI",
    color: "from-violet-500 to-purple-500",
    estimatedTime: { min: 1, max: 3 }
  },
  clips: {
    icon: IconScissors,
    title: "Smart Clips",
    description: "Identifying and extracting key moments",
    color: "from-pink-500 to-rose-500",
    estimatedTime: { min: 10, max: 20 }
  }
}

export default function ProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingStarted, setProcessingStarted] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [estimatedEndTime, setEstimatedEndTime] = useState<Date | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [transcriptionStatus, setTranscriptionStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle')
  const redirectingRef = useRef(false) // Add flag to prevent multiple redirects

  const loadProject = useCallback(async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      setProject(proj)
      
      // Check and update transcription status
      const transcriptionTask = proj.tasks.find(t => t.type === 'transcription')
      if (transcriptionTask) {
        if (transcriptionTask.status === 'completed' && proj.transcription?.text) {
          setTranscriptionStatus('completed')
        } else if (transcriptionTask.status === 'failed') {
          setTranscriptionStatus('failed')
        } else if (transcriptionTask.status === 'processing') {
          setTranscriptionStatus('processing')
        }
      }
    } catch (error) {
      console.error("Failed to load project:", error)
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  const startKlapProcessing = useCallback(async () => {
    if (!project || !project.video_url) {
      toast.error("Project data or video URL is missing.")
      return
    }

    console.log('[Processing] Starting processing for project:', projectId)
    console.log('[Processing] Project tasks:', project.tasks)
    console.log('[Processing] Video URL:', project.video_url)

    // Check if transcription task exists, if not add it
    const hasTranscriptionTask = project.tasks.some(t => t.type === 'transcription')
    if (!hasTranscriptionTask) {
      console.log('[Processing] No transcription task found, adding it...')
      const transcriptionTask = {
        id: crypto.randomUUID(),
        type: 'transcription' as const,
        status: 'pending' as const,
        progress: 0
      }
      project.tasks.push(transcriptionTask)
      await ProjectService.updateProject(projectId, { tasks: project.tasks })
    }

    setProcessingStarted(true)
    setStartTime(new Date())
    toast.info("Starting AI processing...")
    
    await ProjectService.updateProject(projectId, { status: 'processing' })
    await ProjectService.updateTaskProgress(projectId, 'transcription', 10, 'processing')
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing')

    try {
      console.log('[Processing] Starting Klap processing...')
      // Start Klap processing
      const klapPromise = fetch('/api/process-klap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url
        })
      }).then(async (response) => {
        if (response.ok) {
          const result = await response.json()
          await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
          return { success: true, result }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
          
          // Handle specific error codes
          if (response.status === 503) {
            console.error('Klap service unavailable:', errorData)
            throw new Error('Video clip generation service is temporarily unavailable. The transcription will still be processed.')
          } else if (response.status === 401) {
            throw new Error('Authentication failed. Please sign in again.')
          } else {
            throw new Error(errorData.error || 'Failed to generate video clips')
          }
        }
      })

      console.log('[Processing] Starting transcription processing...')
      // Start transcription processing
      const transcriptionPromise = fetch('/api/process-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url,
          language: 'en'
        })
      }).then(async (response) => {
        console.log('[Processing] Transcription response status:', response.status)
        if (response.ok) {
          // Transcription is usually faster, update progress more quickly
          const result = await response.json()
          console.log('[Processing] Transcription result:', result)
          return { success: true, result }
        } else {
          const errorText = await response.text()
          console.error('[Processing] Transcription failed:', errorText)
          await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
          throw new Error('Transcription failed: ' + errorText)
        }
      }).catch(async (error) => {
        console.error('[Processing] Transcription error:', error)
        await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
        throw error
      })

      console.log('[Processing] Waiting for both promises...')
      // Wait for both to complete
      const [klapResult, transcriptionResult] = await Promise.allSettled([klapPromise, transcriptionPromise])

      console.log('[Processing] Results:', { 
        klap: klapResult.status, 
        transcription: transcriptionResult.status 
      })

      // Handle results
      let anySuccess = false
      let allFailed = true
      
      if (klapResult.status === 'fulfilled') {
        anySuccess = true
        allFailed = false
      } else {
        console.error("Klap processing failed:", klapResult.reason)
        // Check if it's a service unavailable error
        if (klapResult.reason?.message?.includes('temporarily unavailable')) {
          toast.warning("Video clips service is unavailable. Continuing with transcription only.", {
            duration: 5000
          })
        } else {
          toast.error("Failed to generate video clips")
        }
      }

      if (transcriptionResult.status === 'fulfilled') {
        anySuccess = true
        allFailed = false
        toast.success("AI analysis completed successfully!")
      } else {
        console.error("Transcription failed:", transcriptionResult.reason)
        toast.error("Failed to complete AI analysis")
      }

      // If at least one service succeeded, continue
      if (anySuccess) {
        // Update the main project status
        await ProjectService.updateProject(projectId, { status: 'draft' })
      
      // Then refresh the project data to show the new content
      await loadProject()

        // Show appropriate message based on what succeeded
        if (klapResult.status === 'rejected' && transcriptionResult.status === 'fulfilled') {
          toast.info("AI analysis complete! Video clips could not be generated at this time.", {
            duration: 4000
          })
        }

      // Redirect to the project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectId}`)
      }, 1500)
      } else {
        // Both services failed
        toast.error("Processing failed. Please try again later.", {
          duration: 5000
        })
        await ProjectService.updateProject(projectId, { status: 'draft' })
        setProcessingStarted(false)
      }

    } catch (error) {
      console.error("Processing failed:", error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred during processing.")
      await ProjectService.updateProject(projectId, { status: 'draft' }) // Revert status
      setProcessingStarted(false)
    }

  }, [project, projectId, router, loadProject])

  const checkTranscriptionStatus = useCallback(async () => {
    if (!project || transcriptionStatus === 'completed' || transcriptionStatus === 'failed') return

    try {
      // Check if transcription is complete by looking at the project
      const updatedProject = await ProjectService.getProject(projectId)
      if (updatedProject?.transcription && updatedProject.transcription.text) {
        setTranscriptionStatus('completed')
        await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')
      } else {
        const transcriptionTask = updatedProject?.tasks.find(t => t.type === 'transcription')
        if (transcriptionTask?.status === 'failed') {
          setTranscriptionStatus('failed')
        } else if (transcriptionTask?.status === 'processing') {
          setTranscriptionStatus('processing')
        }
      }
    } catch (error) {
      console.error('Error checking transcription status:', error)
    }
  }, [project, projectId, transcriptionStatus])

  useEffect(() => {
    const initializeProject = async () => {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      
      setProject(proj)
      setLoading(false)
      
      const progress = ProjectService.calculateProjectProgress(proj)
      
      // Check transcription status on initial load
      const transcriptionTask = proj.tasks.find(t => t.type === 'transcription')
      if (transcriptionTask) {
        if (transcriptionTask.status === 'completed' && proj.transcription?.text) {
          setTranscriptionStatus('completed')
        } else if (transcriptionTask.status === 'failed') {
          setTranscriptionStatus('failed')
        } else if (transcriptionTask.status === 'processing') {
          setTranscriptionStatus('processing')
        }
      }
      
      // If project is complete, redirect immediately
      if ((proj.status === 'ready' || progress === 100) && !redirectingRef.current) {
        redirectingRef.current = true // Set flag to prevent duplicate redirects
        if (proj.status !== 'draft') {
          // Set status to draft when processing completes
          await ProjectService.updateProject(projectId, { status: 'draft' })
        }
        router.push(`/projects/${projectId}`)
        return
      }
      
      // Only start polling if actually processing
      if (proj.status === 'processing' && progress < 100) {
        const interval = setInterval(async () => {
          const updatedProject = await ProjectService.getProject(projectId)
          if (updatedProject) {
            setProject(updatedProject)
            
            // Check if transcription is complete (AI analysis done)
            const transcriptionTask = updatedProject.tasks.find(t => t.type === 'transcription')
            const isTranscriptionComplete = transcriptionTask?.status === 'completed' && updatedProject.transcription?.text
            
            // Check if clips are still processing
            const clipsTask = updatedProject.tasks.find(t => t.type === 'clips')
            const areClipsProcessing = clipsTask && clipsTask.status === 'processing'
            
            // If clips are processing, check actual Klap status
            if (areClipsProcessing && updatedProject.klap_project_id) {
              try {
                const klapStatusResponse = await fetch(`/api/process-klap?projectId=${projectId}`)
                if (klapStatusResponse.ok) {
                  const klapStatus = await klapStatusResponse.json()
                  // The GET endpoint updates progress internally, we just need to reload
                  if (klapStatus.status !== 'processing' || klapStatus.clipsCount > 0) {
                    // Status changed or clips are ready, reload project
                    const refreshedProject = await ProjectService.getProject(projectId)
                    if (refreshedProject) {
                      setProject(refreshedProject)
                    }
                  }
                }
              } catch (error) {
                console.error('Error checking Klap status:', error)
              }
            }
            
            // Redirect as soon as transcription is done, even if clips are still processing
            if (isTranscriptionComplete && !redirectingRef.current) {
              redirectingRef.current = true // Set flag to prevent duplicate redirects
              clearInterval(interval)
              pollingIntervalRef.current = null
              
              // Update project status to indicate it's ready to view (but clips might still be processing)
              if (updatedProject.status !== 'draft') {
                await ProjectService.updateProject(projectId, { status: 'draft' })
              }
              
              // Show a different toast if clips are still processing
              if (areClipsProcessing) {
                toast.success("AI analysis complete! Redirecting to your project. Clips are still generating in the background.", {
                  duration: 5000
                })
              }
              
              // Redirect to project page
              setTimeout(() => {
                router.push(`/projects/${projectId}`)
              }, 1500)
              return
            }
            
            const updatedProgress = ProjectService.calculateProjectProgress(updatedProject)
            
            // Also redirect if everything is complete
            if ((updatedProject.status === 'ready' || updatedProgress === 100) && !redirectingRef.current) {
              redirectingRef.current = true // Set flag to prevent duplicate redirects
              clearInterval(interval)
              pollingIntervalRef.current = null
              
              // Ensure status is updated to draft
              if (updatedProject.status !== 'draft') {
                await ProjectService.updateProject(projectId, { status: 'draft' })
              }
              
              // Redirect to project page
              setTimeout(() => {
                router.push(`/projects/${projectId}`)
              }, 1500)
              return
            }
          }
          await checkTranscriptionStatus()
        }, 15000) // Poll every 15 seconds (reduced frequency to avoid duplicate calls)
        
        pollingIntervalRef.current = interval
      }
    }
    
    initializeProject()
    
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [projectId, router])

  useEffect(() => {
    // Check if all tasks are complete
    if (project) {
      const allTasksComplete = project.tasks.every(
        task => task.status === 'completed' || task.status === 'failed'
      )
      
      if (allTasksComplete && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        
        // Ensure project status is updated to 'draft' if not already
        if (project.status === 'processing') {
          ProjectService.updateProject(projectId, { status: 'draft' })
            .then(() => {
              // Reload project to get updated status
              loadProject()
            })
            .catch((error) => {
              console.error('Failed to update project status:', error)
            })
        }
      }
    }
  }, [project, projectId, loadProject])

  useEffect(() => {
    if (project && !processingStarted) {
      const progress = ProjectService.calculateProjectProgress(project)
      
      // Only start processing if not already complete
      if (project.status !== 'ready' && progress < 100) {
        // If status is 'processing' but progress is 0, it's a fresh start
        if (project.status === 'processing' && progress === 0) {
          startKlapProcessing()
        } else if (project.status !== 'processing') {
          // Status is draft or something else, start processing
          startKlapProcessing()
        }
      } else if (progress === 100 && project.status === 'processing') {
        // Project is complete but status wasn't updated, fix it
        ProjectService.updateProject(projectId, { status: 'draft' })
          .then(() => router.push(`/projects/${projectId}`))
      }
    }
  }, [project, processingStarted, startKlapProcessing, projectId, router])

  // Update timer every second
  useEffect(() => {
    if (startTime && estimatedEndTime && project?.status === 'processing') {
      const interval = setInterval(() => {
        // Force re-render to update time
        setStartTime(prev => prev ? new Date(prev) : null)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [startTime, estimatedEndTime, project?.status])

  const calculateOverallProgress = () => {
    if (!project) return 0
    return ProjectService.calculateProjectProgress(project)
  }

  const getTaskStatus = (task: ProcessingTask) => {
    if (task.status === 'completed') return 'success'
    if (task.status === 'failed') return 'error'
    if (task.status === 'processing') return 'processing'
    return 'pending'
  }

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <IconCheck className="h-4 w-4" />
      case 'error':
        return <IconX className="h-4 w-4" />
      case 'processing':
        return <IconLoader2 className="h-4 w-4 animate-spin" />
      default:
        return <IconClock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <WorkflowLoading 
        title="Loading Project" 
        description="Fetching project details and workflow status..."
        showSteps={false}
      />
    )
  }

  if (!project) return null

  const overallProgress = calculateOverallProgress()
  const stats = ProjectService.getProjectStats(project)
  const activeTask = project.tasks.find(t => t.status === 'processing')

  const formatTimeRemaining = () => {
    if (!startTime || !estimatedEndTime) return null
    
    const now = new Date()
    const elapsed = now.getTime() - startTime.getTime()
    const total = estimatedEndTime.getTime() - startTime.getTime()
    const remaining = Math.max(0, total - elapsed)
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    if (minutes === 0 && seconds === 0) return "Processing..."
    return `${minutes}m ${seconds}s remaining`
  }

  const isProcessingComplete = project.status === 'draft' || project.status === 'ready' || overallProgress === 100

  return (
    <div className="relative">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative mx-auto max-w-6xl animate-in">
        {/* Header */}
        <div className="text-center mb-10">
          {isProcessingComplete ? (
            <>
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <IconCheck className="h-4 w-4" />
                Processing Complete!
              </motion.div>
              <h1 className="text-4xl font-bold mb-3">
                <span className="gradient-text">{project.title}</span> is Ready!
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your content has been successfully generated
              </p>
            </>
          ) : (
            <>
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-premium-subtle backdrop-blur-sm text-primary text-sm mb-4"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <IconSparkles className="h-4 w-4" />
                AI Processing in Progress
              </motion.div>
              <h1 className="text-4xl font-bold mb-3">
                Processing <span className="gradient-text">{project.title}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our AI is analyzing your video and generating amazing content
              </p>
              {startTime && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <IconClock className="h-4 w-4" />
                  <span className="font-medium">{formatTimeRemaining() || "Processing..."}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 overflow-hidden">
            <div className={cn(
              "h-2 gradient-premium",
              !isProcessingComplete && "animate-gradient-x"
            )} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Overall Progress</CardTitle>
                  <CardDescription>
                    {stats.completedTasks} of {stats.totalTasks} tasks completed
                  </CardDescription>
                </div>
                <div className="text-right">
                  <motion.div 
                    className="text-3xl font-bold gradient-text"
                    key={overallProgress}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {overallProgress}%
                  </motion.div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={overallProgress} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Processing Tasks */}
        <div className="grid gap-6 mb-8">
          {project.tasks
            .filter(task => task.type === 'transcription' || task.type === 'clips')
            .map((task) => {
            const detail = taskDetails[task.type as 'transcription' | 'clips']
            const Icon = detail.icon
            const status = getTaskStatus(task)
            
            return (
              <Card 
                key={task.id} 
                className={`overflow-hidden transition-all duration-300 ${
                  task.status === 'processing' ? 'shadow-lg scale-[1.02]' : ''
                }`}
              >
                <div className={`h-1 bg-gradient-to-r ${detail.color} ${
                  task.status === 'processing' ? 'animate-pulse' : ''
                }`} />
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Icon */}
                    <div className={`relative p-4 rounded-xl bg-gradient-to-br ${detail.color} text-white shadow-lg`}>
                      <Icon className="h-8 w-8" />
                      {task.status === 'processing' && (
                        <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Task Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{detail.title}</h3>
                        <Badge 
                          variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
                          className="gap-1"
                        >
                          {getTaskIcon(status)}
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{detail.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <IconClock className="h-3 w-3" />
                        <span>Estimated: {detail.estimatedTime.min}-{detail.estimatedTime.max} minutes</span>
                      </div>
                      {task.status === 'processing' && (
                        <div className="space-y-2 mt-2">
                          <Progress value={task.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              Processing...
                            </span>
                            <span>{task.progress}%</span>
                          </div>
                        </div>
                      )}
                      {task.completedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed in {Math.round((new Date(task.completedAt).getTime() - new Date(task.startedAt!).getTime()) / 60000)} minutes
                        </p>
                      )}
                      {task.status === 'failed' && task.type === 'transcription' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="mt-2"
                          onClick={async () => {
                            toast.info("Retrying transcription...")
                            try {
                              await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'processing')
                              const response = await fetch('/api/process-transcription', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  projectId: project.id,
                                  videoUrl: project.video_url,
                                  language: 'en'
                                })
                              })
                              
                              if (!response.ok) {
                                throw new Error('Failed to retry transcription')
                              }
                              
                              toast.success("Transcription retry started!")
                              await loadProject()
                            } catch (error) {
                              toast.error("Failed to retry transcription")
                              await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
                            }
                          }}
                        >
                          <IconRefresh className="h-4 w-4 mr-2" />
                          Retry Transcription
                        </Button>
                      )}
                    </div>
                    
                    {/* Progress Circle */}
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="url(#gradient)"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(task.progress / 100) * 176} 176`}
                          className="transition-all duration-500"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(124 58 237)" />
                            <stop offset="100%" stopColor="rgb(236 72 153)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">{task.progress}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Content Preview */}
        {stats.totalClips > 0 ? (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFolder className="h-5 w-5 text-primary" />
                Generated Content
              </CardTitle>
              <CardDescription>
                Preview of the content being created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="text-center p-6 rounded-lg bg-primary/5">
                  <IconScissors className="h-10 w-10 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold">{stats.totalClips}</div>
                  <div className="text-sm text-muted-foreground">Video Clips Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          {(project.status === 'ready' || project.status === 'draft') && overallProgress === 100 && (
            <Button 
              size="lg" 
              className="gradient-premium hover:opacity-90 transition-opacity"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              View Results
              <IconArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => router.push('/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  )
} 