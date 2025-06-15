"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
  IconShare2,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconLanguage,
  IconHeadphones,
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, ClipData, BlogPost, SocialPost, PodcastData, ProcessingTask } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { formatDuration, formatFileSize } from "@/lib/video-utils"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"
import { TranscriptionViewer } from "@/components/transcription-viewer"
import { TranscriptionEditor } from "@/components/transcription-editor"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.2 }
  }
}

const platformIcons = {
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  'youtube-short': IconBrandYoutube
}

const platformColors = {
  twitter: 'text-blue-500',
  linkedin: 'text-blue-700',
  instagram: 'text-pink-500',
  tiktok: 'text-gray-900',
  'youtube-short': 'text-red-600'
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false)
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null)

  useEffect(() => {
    loadProject()
  }, [projectId])

  // Add auto-redirect to processing page
  useEffect(() => {
    if (project && project.status === 'processing') {
      // Redirect to processing page after a short delay to show the overlay briefly
      const timer = setTimeout(() => {
        router.push(`/studio/processing/${projectId}`)
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [project, projectId, router])

  const loadProject = async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      setProject(proj)
      
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
      
      {/* Processing Overlay */}
      {project.status === 'processing' && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 shadow-2xl border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                <IconLoader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">Project Loading</CardTitle>
              <CardDescription className="text-base">
                Your video is being processed by our AI. This may take a few minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing progress</span>
                  <span className="font-medium">{stats.completedTasks}/{stats.totalTasks} tasks</span>
                </div>
                <Progress value={ProjectService.calculateProjectProgress(project)} className="h-2" />
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push(`/studio/processing/${projectId}`)}
              >
                <IconEye className="h-4 w-4 mr-2" />
                View Detailed Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="relative mx-auto max-w-7xl animate-in">
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
            className="hover:bg-primary/10"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
                {project.description && (
                  <p className="text-lg text-muted-foreground max-w-3xl">
                    {project.description}
                  </p>
                )}
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-sm">
                  <IconClock className="h-3 w-3 mr-1" />
                  {new Date(project.created_at).toLocaleDateString()}
                </Badge>
                <Badge variant={project.status === 'ready' ? 'default' : 'secondary'}>
                  {project.status === 'processing' && <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {project.status}
                </Badge>
                {project.transcription && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <IconLanguage className="h-3 w-3 mr-1" />
                    {project.transcription.language || 'English'}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <IconEdit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <IconShare2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IconClock className="h-4 w-4 text-primary" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(project.metadata.duration)}</div>
            </CardContent>
          </Card>
          
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IconFileText className="h-4 w-4 text-green-600" />
                Read Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estimatedReadTime} min</div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IconScissors className="h-4 w-4 text-blue-600" />
                Clips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalClips}</div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IconMessageCircle className="h-4 w-4 text-purple-600" />
                Word Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{transcriptWordCount.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IconFolder className="h-4 w-4 text-orange-600" />
                File Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatFileSize(project.metadata.size)}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player & Content Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden border-primary/20 shadow-xl">
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
                  {project.video_url ? (
                    <video
                      ref={videoRef}
                      src={project.video_url}
                      className="w-full h-full"
                      controls
                      poster={project.thumbnail_url}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <IconVideo className="h-20 w-20 text-primary/30" />
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Content Tabs */}
            <Card className="border-primary/10">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <IconFileText className="h-4 w-4" />
                      Transcript
                    </TabsTrigger>
                    <TabsTrigger value="clips" className="flex items-center gap-2">
                      <IconScissors className="h-4 w-4" />
                      Clips ({stats.totalClips})
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="flex items-center gap-2">
                      <IconArticle className="h-4 w-4" />
                      Blog ({stats.totalBlogs})
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex items-center gap-2">
                      <IconShare2 className="h-4 w-4" />
                      Social ({stats.totalSocialPosts})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="p-6"
                  >
                    <TabsContent value="overview" className="mt-0">
                      {project.transcription ? (
                        <div className="space-y-6">
                          <TranscriptionEditor
                            transcription={project.transcription}
                            projectId={project.id}
                            onUpdate={async (updated) => {
                              await loadProject() // Refresh project data
                            }}
                          />
                          <TranscriptionViewer
                            transcription={project.transcription}
                            videoElement={videoRef.current}
                            projectId={project.id}
                            projectTitle={project.title}
                          />
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconFileText className="h-16 w-16 text-primary/50" />}
                          title="No transcription available"
                          description="Process this video to generate a transcript."
                          action={{
                            label: "Generate Transcript",
                            onClick: async () => {
                              toast.info("Starting transcription...")
                              try {
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
                                  throw new Error('Failed to start transcription')
                                }
                                
                                toast.success("Transcription started! This may take a few minutes.")
                                
                                // Start polling for updates
                                const interval = setInterval(async () => {
                                  await loadProject()
                                  const proj = await ProjectService.getProject(projectId)
                                  if (proj?.transcription) {
                                    clearInterval(interval)
                                  }
                                }, 3000)
                                
                                setTimeout(() => clearInterval(interval), 300000) // Stop after 5 minutes
                              } catch (error) {
                                toast.error("Failed to start transcription")
                              }
                            }
                          }}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="clips" className="mt-0">
                      {project.folders.clips.length > 0 ? (
                        <div className="grid gap-4">
                          {project.folders.clips.map((clip: ClipData) => (
                            <motion.div
                              key={clip.id}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              whileHover={{ scale: 1.02 }}
                            >
                              <Card className="overflow-hidden hover:shadow-lg transition-all border-primary/10">
                                <CardContent className="p-0 flex">
                                  <div className="w-48 h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 relative">
                                    {clip.thumbnail ? (
                                      <Image 
                                        src={clip.thumbnail} 
                                        alt={clip.title}
                                        width={192}
                                        height={128}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <IconVideo className="h-8 w-8 text-primary/50" />
                                      </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs">
                                      {formatDuration(clip.duration)}
                                    </div>
                                  </div>
                                  <div className="flex-1 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <h3 className="font-semibold">{clip.title}</h3>
                                      <Badge variant="secondary" className="text-xs">
                                        {clip.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{clip.description}</p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <IconChartBar className="h-3 w-3" />
                                          Score: {(clip.score * 100).toFixed(0)}%
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <IconClock className="h-3 w-3" />
                                          {clip.startTime}s - {clip.endTime}s
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        {clip.previewUrl && (
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => window.open(clip.previewUrl, '_blank')}
                                          >
                                            <IconEye className="h-4 w-4 mr-1"/>
                                            Preview
                                          </Button>
                                        )}
                                        {clip.exportUrl && (
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => window.open(clip.exportUrl, '_blank')}
                                          >
                                            <IconDownload className="h-4 w-4 mr-1"/>
                                            Download
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconScissors className="h-16 w-16 text-primary/50" />}
                          title="No clips generated yet"
                          description="Use the AI Processing panel to generate video clips"
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="blog" className="mt-0">
                      {project.folders.blog.length > 0 ? (
                        <div className="grid gap-6">
                          {project.folders.blog.map((post: BlogPost) => (
                            <motion.div
                              key={post.id}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              <Card className="overflow-hidden hover:shadow-lg transition-all border-primary/10">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <CardTitle className="text-2xl">{post.title}</CardTitle>
                                      <CardDescription className="text-base">{post.excerpt}</CardDescription>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(post.content, post.id)}
                                    >
                                      {copiedId === post.id ? (
                                        <IconCheck className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <IconCopy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <IconClock className="h-4 w-4" />
                                      {post.readingTime} min read
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <IconMessageCircle className="h-4 w-4" />
                                      {post.content.split(' ').length} words
                                    </span>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {post.tags.map(tag => (
                                      <Badge key={tag} variant="secondary">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                  <Separator className="my-4" />
                                  <div className="prose prose-sm max-w-none">
                                    <div className="space-y-4">
                                      {post.sections.slice(0, 2).map((section, idx) => (
                                        <div key={idx}>
                                          <h3 className="font-semibold mb-2">{section.heading}</h3>
                                          <p className="text-muted-foreground line-clamp-3">
                                            {section.content}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                    {post.sections.length > 2 && (
                                      <p className="text-sm text-muted-foreground mt-4">
                                        ... and {post.sections.length - 2} more sections
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-2 mt-6">
                                    <Button variant="outline">
                                      <IconExternalLink className="h-4 w-4 mr-2" />
                                      View Full Post
                                    </Button>
                                    <Button variant="outline">
                                      <IconDownload className="h-4 w-4 mr-2" />
                                      Export as Markdown
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconArticle className="h-16 w-16 text-primary/50" />}
                          title="No blog post yet"
                          description="Generate a blog post from your video's transcript."
                          action={isGeneratingBlog || !project.transcription ? undefined : { 
                            label: "Generate Blog Post", 
                            onClick: handleGenerateBlog
                          }}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="social" className="mt-0">
                      {project.folders.social.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {project.folders.social.map((post: SocialPost) => {
                            const PlatformIcon = platformIcons[post.platform]
                            const platformColor = platformColors[post.platform]
                            
                            return (
                              <motion.div
                                key={post.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.02 }}
                              >
                                <Card className="overflow-hidden hover:shadow-lg transition-all border-primary/10">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <PlatformIcon className={cn("h-5 w-5", platformColor)} />
                                        <Badge variant="outline">{post.platform}</Badge>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(post.content, post.id)}
                                      >
                                        {copiedId === post.id ? (
                                          <IconCheck className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <IconCopy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                                    {post.hashtags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-3">
                                        {post.hashtags.map((tag, idx) => (
                                          <span key={idx} className="text-xs text-primary">
                                            #{tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {post.engagement && (
                                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                                        <span>{post.engagement.likes} likes</span>
                                        <span>{post.engagement.shares} shares</span>
                                        <span>{post.engagement.comments} comments</span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )
                          })}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconBrandTwitter className="h-16 w-16 text-primary/50" />}
                          title="No social posts generated yet"
                          description="Generate social media posts from your video content."
                        />
                      )}
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg gradient-premium-subtle">
                      <IconWand className="h-5 w-5 text-primary" />
                    </div>
                    AI Actions
                  </CardTitle>
                  <CardDescription>
                    Generate content from your video
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleGenerateBlog} 
                    disabled={isGeneratingBlog || !project.transcription} 
                    className="w-full justify-start"
                    variant={project.folders.blog.length > 0 ? "outline" : "default"}
                  >
                    {isGeneratingBlog ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconArticle className="mr-2 h-4 w-4"/>
                        {project.folders.blog.length > 0 ? "Regenerate Blog Post" : "Generate Blog Post"}
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <IconBrandTwitter className="mr-2 h-4 w-4"/>
                    Generate Social Posts
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <IconScissors className="mr-2 h-4 w-4"/>
                    Generate Video Clips
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <IconHeadphones className="mr-2 h-4 w-4"/>
                    Generate Podcast
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Video Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconVideo className="h-5 w-5" />
                    Video Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Resolution</p>
                    <p className="font-medium">{project.metadata.width}x{project.metadata.height}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Format</p>
                    <p className="font-medium">{project.metadata.format.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Codec</p>
                    <p className="font-medium">{project.metadata.codec}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">FPS</p>
                    <p className="font-medium">{project.metadata.fps}</p>
                  </div>
                  <Separator className="my-4" />
                  <Button variant="outline" className="w-full">
                    <IconDownload className="h-4 w-4 mr-2" />
                    Download Original
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Processing Status */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <IconLoader2 className="h-5 w-5 animate-spin" />
                      Processing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={75} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      AI is analyzing your video content...
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 