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
  IconArrowRight
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/db-migration"
import { Project, ProcessingTask } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimatedBackground } from "@/components/animated-background"

const taskDetails = {
  transcription: {
    icon: IconFileText,
    title: "AI Transcription",
    description: "Converting speech to text using advanced AI",
    color: "from-violet-500 to-purple-500",
    estimatedTime: { min: 5, max: 7 }
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

  const simulateProcessing = useCallback(async () => {
    if (!project || processingStarted) return

    setProcessingStarted(true)
    setStartTime(new Date())
    
    // Calculate total estimated time
    let maxTime = 0
    const parallelTasks = ['transcription', 'clips']
    const dependentTasks = ['blog', 'social', 'podcast']
    
    // Check which tasks are included
    const hasParallelTasks = project.tasks.some(t => parallelTasks.includes(t.type))
    const hasDependentTasks = project.tasks.some(t => dependentTasks.includes(t.type))
    
    if (hasParallelTasks) {
      maxTime = 7 // Max 7 minutes for parallel tasks
    }
    
    if (hasDependentTasks) {
      const maxDependentTime = Math.max(
        ...project.tasks
          .filter(t => dependentTasks.includes(t.type))
          .map(t => taskDetails[t.type].estimatedTime.max)
      )
      maxTime += maxDependentTime
    }
    
    setEstimatedEndTime(new Date(Date.now() + maxTime * 60 * 1000))
    
    // Update project status
    await ProjectService.updateProject(projectId, { status: 'processing' })

    // Simulate realistic processing with proper timing
    await processTasksWithRealisticTiming()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projectId, processingStarted])

  const processTasksWithRealisticTiming = async () => {
    if (!project) return

    // Process transcription and clips in parallel (5-7 minutes)
    const parallelTasks = project.tasks.filter(t => ['transcription', 'clips'].includes(t.type))
    const dependentTasks = project.tasks.filter(t => ['blog', 'social', 'podcast'].includes(t.type))

    // Start parallel tasks
    if (parallelTasks.length > 0) {
      await Promise.all(parallelTasks.map(task => processTaskWithRealisticProgress(task, 5, 7)))
    }

    // Then process dependent tasks
    for (const task of dependentTasks) {
      const detail = taskDetails[task.type]
      await processTaskWithRealisticProgress(task, detail.estimatedTime.min, detail.estimatedTime.max)
    }

    // Update project status to ready
    await ProjectService.updateProject(projectId, { status: 'ready' })
    toast.success("All processing completed! Your content is ready.")
    
    // Redirect to project details after a delay
    setTimeout(() => {
      router.push(`/projects/${projectId}`)
    }, 2000)
  }

  const processTaskWithRealisticProgress = async (
    task: ProcessingTask, 
    minMinutes: number, 
    maxMinutes: number
  ) => {
    // Start the task
    await ProjectService.updateTaskProgress(projectId, task.type, 0, 'processing')
    
    // For clips task, use Klap API
    if (task.type === 'clips' && project?.video_url) {
      try {
        const response = await fetch('/api/process-klap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            videoUrl: project.video_url
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to process clips with Klap')
        }

        const result = await response.json()
        toast.success(`Generated ${result.clips.length} clips!`)
      } catch (error) {
        console.error('Klap processing error:', error)
        await ProjectService.updateTaskProgress(projectId, task.type, 0, 'failed')
        toast.error('Failed to generate clips')
        return
      }
    } 
    // For transcription task, use Whisper API
    else if (task.type === 'transcription' && project?.video_url) {
      try {
        const response = await fetch('/api/process-transcription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            videoUrl: project.video_url,
            language: project.settings?.language || 'en'
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to transcribe video')
        }

        const result = await response.json()
        toast.success(`Transcription completed! ${result.segmentCount} segments found.`)
      } catch (error) {
        console.error('Transcription error:', error)
        await ProjectService.updateTaskProgress(projectId, task.type, 0, 'failed')
        toast.error('Failed to transcribe video')
        return
      }
    }
    else {
      // For other tasks, use simulated progress
      const actualMinutes = minMinutes + Math.random() * (maxMinutes - minMinutes)
      const totalMilliseconds = actualMinutes * 60 * 1000
      const updateInterval = 2000 // Update every 2 seconds
      const totalUpdates = Math.floor(totalMilliseconds / updateInterval)
      
      for (let i = 0; i <= totalUpdates; i++) {
        const progress = Math.min(100, Math.round((i / totalUpdates) * 100))
        await ProjectService.updateTaskProgress(projectId, task.type, progress, 'processing')
        await loadProject()
        await new Promise(resolve => setTimeout(resolve, updateInterval))
      }
      
      // Complete the task
      await ProjectService.updateTaskProgress(projectId, task.type, 100, 'completed')
      
      // Add mock content when task completes
      await addMockContent(task.type)
    }
    
    toast.success(`${taskDetails[task.type].title} completed!`)
  }

  const addMockContent = async (taskType: ProcessingTask['type']) => {
    if (!project) return

    switch (taskType) {
      case 'clips':
        await ProjectService.addToFolder(projectId, 'clips', {
          id: `clip-${Date.now()}`,
          title: "Key Moment: Introduction",
          description: "The opening segment with strong hook",
          startTime: 0,
          endTime: 60,
          duration: 60,
          thumbnail: project.thumbnail_url,
          tags: ['intro', 'highlight'],
          score: 0.95,
          type: 'highlight'
        })
        break
      // Add other content types as needed
    }
  }

  useEffect(() => {
    loadProject()
  }, [loadProject])

  useEffect(() => {
    if (project && !processingStarted && project.status === 'draft') {
      simulateProcessing()
    }
  }, [project, processingStarted, simulateProcessing])

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
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    )
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
                            <span>Processing...</span>
                            <span>{task.progress}%</span>
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