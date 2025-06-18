"use client"

import { useEffect, useState, useCallback } from "react"
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

const taskDetails = {
  transcription: {
    icon: IconFileText,
    title: "AI Transcription",
    description: "Converting speech to text using advanced AI",
    color: "from-violet-500 to-purple-500",
    estimatedTime: { min: 1, max: 3 }
  },
  clips: {
    icon: IconScissors,
    title: "Smart Clips",
    description: "Identifying and extracting key moments",
    color: "from-pink-500 to-rose-500",
    estimatedTime: { min: 5, max: 7 }
  },
  blog: {
    icon: IconArticle,
    title: "Blog Generation",
    description: "Creating SEO-optimized blog posts",
    color: "from-emerald-500 to-teal-500",
    estimatedTime: { min: 3, max: 5 }
  },
  social: {
    icon: IconBrandTwitter,
    title: "Social Media",
    description: "Crafting platform-specific content",
    color: "from-blue-500 to-cyan-500",
    estimatedTime: { min: 2, max: 3 }
  },
  podcast: {
    icon: IconMicrophone,
    title: "Podcast Optimization",
    description: "Generating chapters and show notes",
    color: "from-amber-500 to-orange-500",
    estimatedTime: { min: 4, max: 6 }
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
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [transcriptionStatus, setTranscriptionStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')

  const loadProject = useCallback(async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      setProject(proj)
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

    setProcessingStarted(true)
    setStartTime(new Date())
    toast.info("Starting AI processing...")
    
    await ProjectService.updateProject(projectId, { status: 'processing' })
    await ProjectService.updateTaskProgress(projectId, 'transcription', 10, 'processing')
    await ProjectService.updateTaskProgress(projectId, 'clips', 10, 'processing')

    try {
      // Start Klap processing
      const klapPromise = fetch('/api/process-klap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url
        })
      }).then(async (response) => {
        if (response.ok) {
          // Start polling for Klap progress
          const pollKlapProgress = async () => {
            try {
              const updatedProject = await ProjectService.getProject(projectId)
              const clipsTask = updatedProject?.tasks.find(t => t.type === 'clips')
              if (clipsTask && clipsTask.status === 'processing') {
                // Estimate progress based on time elapsed (Klap usually takes 5-7 minutes)
                const elapsed = Date.now() - new Date(clipsTask.startedAt!).getTime()
                const estimatedDuration = 6 * 60 * 1000 // 6 minutes
                const progress = Math.min(90, Math.floor((elapsed / estimatedDuration) * 90))
                await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing')
              }
            } catch (error) {
              console.error('Error polling Klap progress:', error)
            }
          }
          
          // Poll every 5 seconds
          const klapInterval = setInterval(pollKlapProgress, 5000)
          
          const result = await response.json()
          clearInterval(klapInterval)
          
          // Update to 100% when complete
          await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
          return { success: true, result }
        } else {
          await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
          throw new Error('Klap processing failed')
        }
      })

      // Start transcription processing
      const transcriptionPromise = fetch('/api/process-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url,
          language: 'en'
        })
      }).then(async (response) => {
        if (response.ok) {
          // Transcription is usually faster, update progress more quickly
          await ProjectService.updateTaskProgress(projectId, 'transcription', 50, 'processing')
          const result = await response.json()
          await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')
          return { success: true, result }
        } else {
          await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
          throw new Error('Transcription failed')
        }
      })

      // Wait for both to complete
      const [klapResult, transcriptionResult] = await Promise.allSettled([klapPromise, transcriptionPromise])

      // Handle results
      if (klapResult.status === 'fulfilled') {
        toast.success("Clips generated successfully!")
      } else {
        console.error("Klap processing failed:", klapResult)
        toast.error("Failed to generate clips")
      }

      if (transcriptionResult.status === 'fulfilled') {
        toast.success("Transcription completed!")
      } else {
        console.error("Transcription failed:", transcriptionResult)
        toast.warning("Transcription failed, but clips were generated")
      }

      // Refresh the project data to show the new content
      await loadProject()
      
      // Update the main project status
      await ProjectService.updateProject(projectId, { status: 'ready' })

      // Redirect to the project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectId}`)
      }, 2000)

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
    loadProject()
    
    // Start polling for updates
    const interval = setInterval(async () => {
      await loadProject()
      await checkTranscriptionStatus()
    }, 2000) // Poll every 2 seconds
    
    setPollingInterval(interval)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // Check if all tasks are complete
    if (project) {
      const allTasksComplete = project.tasks.every(
        task => task.status === 'completed' || task.status === 'failed'
      )
      
      if (allTasksComplete && pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [project, pollingInterval])

  useEffect(() => {
    if (project && !processingStarted && project.status !== 'ready' && project.status !== 'processing') {
      startKlapProcessing()
    }
  }, [project, processingStarted, startKlapProcessing])

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
    return <WorkflowLoading title="Loading Project" description="Fetching project details..." />
  }

  if (!project) return null

  const overallProgress = calculateOverallProgress()
  const stats = ProjectService.getProjectStats(project)

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

  return (
    <div className="relative">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative mx-auto max-w-6xl animate-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-premium-subtle backdrop-blur-sm text-primary text-sm mb-4 animate-float">
            <IconSparkles className="h-4 w-4" />
            AI Processing in Progress
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Processing <span className="gradient-text">{project.title}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI is analyzing your video and generating amazing content
          </p>
          {startTime && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <IconClock className="h-4 w-4" />
              {formatTimeRemaining() || "Processing..."}
            </div>
          )}
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-1 gradient-premium" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  {stats.completedTasks} of {stats.totalTasks} tasks completed
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold gradient-text">{overallProgress}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Processing Tasks */}
        <div className="grid gap-6 mb-8">
          {project.tasks.map((task) => {
            const detail = taskDetails[task.type]
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
        {stats.totalClips > 0 || stats.totalBlogs > 0 || stats.totalSocialPosts > 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/5">
                  <IconScissors className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalClips}</div>
                  <div className="text-sm text-muted-foreground">Video Clips</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/5">
                  <IconArticle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalBlogs}</div>
                  <div className="text-sm text-muted-foreground">Blog Posts</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/5">
                  <IconBrandTwitter className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalSocialPosts}</div>
                  <div className="text-sm text-muted-foreground">Social Posts</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/5">
                  <IconMicrophone className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.podcastChapters}</div>
                  <div className="text-sm text-muted-foreground">Podcast Chapters</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          {project.status === 'ready' && (
            <Button 
              size="lg" 
              className="gradient-premium hover:opacity-90 transition-opacity"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              View Project
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