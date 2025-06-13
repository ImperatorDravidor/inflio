"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  IconVideo, 
  IconFileText, 
  IconScissors, 
  IconArticle, 
  IconBrandTwitter, 
  IconMicrophone,
  IconDownload,
  IconEdit,
  IconTrash,
  IconClock,
  IconEye,
  IconPlayerPlay,
  IconCopy,
  IconCheck,
  IconSparkles,
  IconArrowLeft,
  IconFolder,
  IconExternalLink,
  IconLoader2,
  IconWand,
  IconSettings,
  IconChartBar,
  IconMessageCircle,
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/db-migration"
import { Project, ClipData, BlogPost, SocialPost, PodcastData, ProcessingTask } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { formatDuration, formatFileSize } from "@/lib/video-utils"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"
import { ProcessingProgress } from "@/components/loading-states"
import { TranscriptionViewer } from "@/components/transcription-viewer"

interface ProcessingOptions {
  transcription: boolean
  clips: boolean
  blog: boolean
  social: boolean
  podcast: boolean
  clipDuration: number
  blogStyle: "professional" | "casual" | "technical"
  socialPlatforms: string[]
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("video")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false)
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    transcription: true,
    clips: true,
    blog: true,
    social: true,
    podcast: false,
    clipDuration: 60,
    blogStyle: "professional",
    socialPlatforms: ["twitter", "linkedin"]
  })

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      setProject(proj)
      
      // Set processing options from project settings
      setProcessingOptions({
        transcription: true,
        clips: proj.settings.autoGenerateClips,
        blog: true,
        social: true,
        podcast: false,
        clipDuration: proj.settings.clipDuration,
        blogStyle: proj.settings.blogStyle,
        socialPlatforms: proj.settings.socialPlatforms
      })
      
      // Check if project is currently processing
      if (proj.status === 'processing') {
        setIsProcessing(true)
        startPolling()
      }
    } catch (error) {
      console.error("Failed to load project:", error)
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    const interval = setInterval(async () => {
      const proj = await ProjectService.getProject(projectId)
      if (proj) {
        setProject(proj)
        if (proj.status !== 'processing') {
          clearInterval(interval)
          setIsProcessing(false)
          toast.success("Processing completed!")
        }
      }
    }, 2000)
  }

  const startProcessing = async () => {
    if (!project) return

    setIsProcessing(true)
    setActiveTab("processing")

    try {
      // Update project status
      await ProjectService.updateProject(projectId, { 
        status: 'processing',
        settings: {
          ...project.settings,
          autoGenerateClips: processingOptions.clips,
          clipDuration: processingOptions.clipDuration,
          blogStyle: processingOptions.blogStyle,
          socialPlatforms: processingOptions.socialPlatforms
        }
      })

      // Create tasks for selected options
      const selectedTasks: ProcessingTask['type'][] = []
      if (processingOptions.transcription) selectedTasks.push('transcription')
      if (processingOptions.clips) selectedTasks.push('clips')
      if (processingOptions.blog) selectedTasks.push('blog')
      if (processingOptions.social) selectedTasks.push('social')
      if (processingOptions.podcast) selectedTasks.push('podcast')

      // Here you would make actual API calls to process content
      // For now, simulate processing
      for (const taskType of selectedTasks) {
        await ProjectService.updateTaskProgress(projectId, taskType, 0, 'processing')
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // In real implementation, you would:
        // 1. Call transcription API if needed
        // 2. Call content generation APIs
        // 3. Store results in project folders
        
        await ProjectService.updateTaskProgress(projectId, taskType, 100, 'completed')
      }

      // Update project status
      await ProjectService.updateProject(projectId, { status: 'ready' })
      
      // Reload project
      await loadProject()
      
      setIsProcessing(false)
      setActiveTab("overview")
      toast.success("Content generated successfully!")
      
    } catch (error) {
      console.error("Processing error:", error)
      toast.error("Failed to process content")
      setIsProcessing(false)
    }
  }

  const handleGenerateBlog = async () => {
    if (!project?.transcription) {
      toast.error("A transcription is required to generate a blog post.");
      return;
    }
    
    setIsGeneratingBlog(true);
    toast.info("AI is writing your blog post... This may take a moment.");

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          transcriptText: project.transcription.text,
          blogStyle: project.settings.blogStyle,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate blog post.");
      }

      toast.success("Blog post created successfully!");
      await loadProject(); // Refresh project data
      setActiveTab("blog"); // Switch to the blog tab
    } catch (error) {
      toast.error("Error generating blog post. Please try again.");
    } finally {
      setIsGeneratingBlog(false);
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await ProjectService.deleteProject(projectId)
        toast.success('Project deleted successfully')
        router.push('/projects')
      } catch (error) {
        console.error('Failed to delete project:', error)
        toast.error('Failed to delete project')
      }
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success("Copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy")
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

  const stats = ProjectService.getProjectStats(project)
  const transcriptWordCount = project.transcription?.text.split(' ').length || 0;
  const estimatedReadTime = Math.ceil(transcriptWordCount / 200);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative mx-auto max-w-7xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
            className="mb-4"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <IconEdit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Duration</CardTitle>
                    <IconClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(project.metadata.duration)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Read Time</CardTitle>
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{estimatedReadTime} min</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clips</CardTitle>
                    <IconScissors className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalClips}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Word Count</CardTitle>
                    <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{transcriptWordCount.toLocaleString()}</div>
                </CardContent>
            </Card>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content: Video + Tabs */}
            <div className="lg:col-span-2">
                 <Card className="overflow-hidden mb-8">
                    <div className="aspect-video bg-black">
                  {project.video_url ? (
                    <video
                            ref={videoRef}
                      src={project.video_url}
                      className="w-full h-full"
                      controls
                      poster={project.thumbnail_url}
                    >
                      <source src={project.video_url} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <IconVideo className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Transcript</TabsTrigger>
                        <TabsTrigger value="clips">Clips ({stats.totalClips})</TabsTrigger>
                        <TabsTrigger value="blog">Blog ({stats.totalBlogs})</TabsTrigger>
                        <TabsTrigger value="social">Social ({stats.totalSocialPosts})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        {project.transcription ? (
                            <TranscriptionViewer
                                transcription={project.transcription}
                                videoElement={videoRef.current}
                                projectId={project.id}
                                projectTitle={project.title}
                            />
                        ) : (
                            <EmptyState
                                icon={<IconFileText className="h-16 w-16 text-primary/50" />}
                                title="No transcription available"
                                description="Process this video to generate a transcript."
                            />
            )}
          </TabsContent>

          <TabsContent value="clips" className="mt-6">
            {project.folders.clips.length > 0 ? (
              <div className="grid gap-4">
                {project.folders.clips.map((clip: ClipData) => (
                  <Card key={clip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardContent className="p-0 flex">
                        <div className="w-48 h-32 bg-muted flex-shrink-0">
                          {clip.thumbnail ? (
                                            <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover"/>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IconVideo className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                              <h3 className="font-semibold">{clip.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{clip.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span>Score: {(clip.score * 100).toFixed(0)}%</span>
                          </div>
                                        <div className="flex gap-2 mt-2">
                                            {clip.previewUrl && <Button size="sm" variant="outline" onClick={() => window.open(clip.previewUrl, '_blank')}><IconEye className="h-4 w-4 mr-1"/>Preview</Button>}
                                            {clip.exportUrl && <Button size="sm" variant="outline" onClick={() => window.open(clip.exportUrl, '_blank')}><IconDownload className="h-4 w-4 mr-1"/>Download</Button>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconScissors className="h-16 w-16 text-primary/50" />}
                title="No clips generated yet"
                description="Use the AI Processing tab to generate video clips"
              />
            )}
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            {project.folders.blog.length > 0 ? (
              <div className="grid gap-4">
                {project.folders.blog.map((post: BlogPost) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                          <CardTitle>{post.title}</CardTitle>
                          <CardDescription>{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>{post.readingTime} min read</span>
                                            <div className="flex flex-wrap gap-2">
                                                {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconArticle className="h-16 w-16 text-primary/50" />}
                                title="No blog post yet"
                                description="Generate a blog post from your video's transcript."
                                action={{ label: "Generate Blog Post", onClick: handleGenerateBlog }}
              />
            )}
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            {project.folders.social.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {project.folders.social.map((post: SocialPost) => (
                            <Card key={post.id}>
                    <CardHeader>
                        <Badge>{post.platform}</Badge>
                    </CardHeader>
                    <CardContent>
                                    <p className="text-sm">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconBrandTwitter className="h-16 w-16 text-primary/50" />}
                title="No social posts generated yet"
                            description="Generate social media posts from your video content."
              />
            )}
          </TabsContent>
        </Tabs>
            </div>

            {/* Side Panel: Actions & Info */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><IconWand className="h-5 w-5"/> AI Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button onClick={handleGenerateBlog} disabled={isGeneratingBlog || !project.transcription} className="w-full">
                            <IconArticle className="mr-2 h-4 w-4"/>
                            {isGeneratingBlog ? "Generating..." : "Generate Blog Post"}
                        </Button>
                        <Button variant="outline" className="w-full" disabled>
                            <IconBrandTwitter className="mr-2 h-4 w-4"/>
                            Generate Social Posts (Coming soon)
                        </Button>
                         <Button variant="outline" className="w-full" disabled>
                            <IconScissors className="mr-2 h-4 w-4"/>
                            Regenerate Clips (Coming soon)
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><IconChartBar className="h-5 w-5"/> Project Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Status</span>
                           <Badge variant={project.status === 'ready' ? 'default' : 'secondary'}>{project.status}</Badge>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Created</span>
                           <span>{new Date(project.created_at).toLocaleDateString()}</span>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">File Size</span>
                           <span>{formatFileSize(project.metadata.size)}</span>
                       </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">Resolution</span>
                           <span>{project.metadata.width}x{project.metadata.height}</span>
                       </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  )
} 