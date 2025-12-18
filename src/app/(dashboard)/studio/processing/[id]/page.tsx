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
  IconArrowRight
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, ProcessingTask } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimatedBackground } from "@/components/animated-background"
import { WorkflowLoading } from "@/components/workflow-loading"
import { motion, AnimatePresence } from "framer-motion"
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
    description: "AI is generating viral-worthy clips with virality scoring",
    color: "from-pink-500 to-rose-500",
    estimatedTime: { min: 15, max: 30 }
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const redirectingRef = useRef(false)
  const lastProgressRef = useRef<{ transcription: number; clips: number }>({ transcription: 0, clips: 0 })

  const loadProject = useCallback(async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      
      // Ensure progress never goes backwards
      const updatedTasks = proj.tasks.map(task => {
        const lastProgress = task.type === 'transcription' 
          ? lastProgressRef.current.transcription 
          : task.type === 'clips' 
          ? lastProgressRef.current.clips 
          : 0
        
        // Update last progress reference
        if (task.type === 'transcription') {
          lastProgressRef.current.transcription = Math.max(task.progress, lastProgress)
        } else if (task.type === 'clips') {
          lastProgressRef.current.clips = Math.max(task.progress, lastProgress)
        }
        
        return {
          ...task,
          progress: Math.max(task.progress, lastProgress)
        }
      })
      
      setProject({ ...proj, tasks: updatedTasks })
    } catch (error) {
      console.error("Failed to load project:", error)
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  const startProcessing = useCallback(async () => {
    if (!project || !project.video_url) {
      toast.error("Project data or video URL is missing.")
      return
    }

    console.log('[Processing] Starting processing for project:', projectId)

    // Check if all tasks are complete
    const allComplete = project.tasks.every(t => t.status === 'completed')
    if (allComplete) {
      console.log('[Processing] All tasks complete, redirecting to posts tab...')
      router.push(`/projects/${projectId}?tab=posts`)
      return
    }

    setProcessingStarted(true)
    setStartTime(new Date())
    
    toast.info("Starting AI processing...")
    
    try {
      console.log('[Processing] Calling main process endpoint...')
      // Call the main process endpoint which handles both transcription and clips
      const response = await fetch(`/api/projects/${projectId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to start processing')
      }

      const result = await response.json()
      console.log('[Processing] Process started:', result)
      
      // Update project status
      setProject({ ...project, status: 'processing' })
      
      // Start polling immediately
      startPolling()

      toast.success("Processing started! This will take a few minutes.", {
        duration: 4000
      })

    } catch (error) {
      console.error("Processing failed:", error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred during processing.")
      await ProjectService.updateProject(projectId, { status: 'draft' }) // Revert status
      setProcessingStarted(false)
    }

  }, [project, projectId, router])

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    const pollProject = async () => {
      try {
        const updatedProject = await ProjectService.getProject(projectId)
        if (!updatedProject) return

        // Ensure progress never goes backwards
        const updatedTasks = updatedProject.tasks.map(task => {
          const lastProgress = task.type === 'transcription'
            ? lastProgressRef.current.transcription
            : task.type === 'clips'
            ? lastProgressRef.current.clips
            : 0

          // Update last progress reference
          if (task.type === 'transcription') {
            lastProgressRef.current.transcription = Math.max(task.progress, lastProgress)
          } else if (task.type === 'clips') {
            lastProgressRef.current.clips = Math.max(task.progress, lastProgress)
          }

          return {
            ...task,
            progress: Math.max(task.progress, lastProgress)
          }
        })

        setProject({ ...updatedProject, tasks: updatedTasks })

        // Check if ALL tasks are complete
        const allTasksComplete = updatedTasks.every(t => t.status === 'completed')

        // Redirect when ALL processing is done
        if (allTasksComplete && !redirectingRef.current) {
          redirectingRef.current = true
          clearInterval(pollingIntervalRef.current!)
          pollingIntervalRef.current = null

          toast.success("Processing complete! Loading your content...")

          setTimeout(() => {
            router.push(`/projects/${projectId}?tab=posts`)
          }, 1500)
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Poll immediately then every 3 seconds during active processing
    pollProject()
    pollingIntervalRef.current = setInterval(pollProject, 3000)
  }, [projectId, router])

  useEffect(() => {
    loadProject()
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [loadProject])

  useEffect(() => {
    if (project && !processingStarted && project.status !== 'ready') {
      const needsProcessing = project.tasks.some(t => t.status === 'pending')
      if (needsProcessing) {
        setProcessingStarted(true)
        setStartTime(new Date())
        startProcessing()
      } else if (project.status === 'processing') {
        // Resume polling if already processing
        startPolling()
      }
    }
  }, [project, processingStarted, startProcessing, startPolling])



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

  const getElapsedTime = () => {
    if (!startTime) return null
    
    const now = new Date()
    const elapsed = now.getTime() - startTime.getTime()
    
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  // Check if processing is actually complete by looking at task statuses
  const allTasksComplete = project.tasks.every(t => t.status === 'completed')
  const isProcessingComplete = allTasksComplete && overallProgress === 100

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
                  <span className="font-medium">Processing for {getElapsedTime()}</span>
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
                          <div className="relative">
                            <Progress value={task.progress} className="h-2 transition-all duration-500 ease-out" />
                            {task.status === 'processing' && (
                              <div className="absolute inset-0 h-2 overflow-hidden rounded-full">
                                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1.5 h-1.5 bg-green-500 rounded-full"
                              />
                              Processing...
                            </span>
                            <motion.span
                              key={task.progress}
                              initial={{ scale: 1.2, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {task.progress}%
                            </motion.span>
                          </div>
                        </div>
                      )}
                      {task.completedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed in {Math.round((new Date(task.completedAt).getTime() - new Date(task.startedAt!).getTime()) / 60000)} minutes
                        </p>
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
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="url(#gradient-${task.id})"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="176"
                          strokeDashoffset={176 - (task.progress / 100) * 176}
                          initial={{ strokeDashoffset: 176 }}
                          animate={{ strokeDashoffset: 176 - (task.progress / 100) * 176 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                        <defs>
                          <linearGradient id={`gradient-${task.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(124 58 237)" />
                            <stop offset="100%" stopColor="rgb(236 72 153)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span 
                          className="text-sm font-bold"
                          key={task.progress}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {task.progress}%
                        </motion.span>
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
              onClick={() => router.push(`/projects/${projectId}?tab=posts`)}
            >
              View AI Posts
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