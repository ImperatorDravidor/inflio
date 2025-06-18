"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  IconVideo, 
  IconFileText, 
  IconScissors, 
  IconArticle, 
  IconBrandTwitter, 
  IconDownload,
  IconTrash,
  IconClock,
  IconPlayerPlay,
  IconCopy,
  IconCheck,
  IconSparkles,
  IconArrowLeft,
  IconArrowRight,
  IconExternalLink,
  IconLoader2,
  IconWand,
  IconSettings,
  IconChartBar,
  IconShare2,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconLanguage,
  IconSearch,
  IconVideoOff,
  IconEye,
  IconFileDownload,
  IconMaximize,
  IconX,
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, ClipData, BlogPost, SocialPost, TranscriptionData } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { formatDuration, formatFileSize } from "@/lib/video-utils"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { TranscriptionService } from "@/lib/transcription-service"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  const transcriptionScrollRef = useRef<HTMLDivElement>(null)
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false)
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState(0)
  const [isExportingClips, setIsExportingClips] = useState(false)
  const [exportingClipId, setExportingClipId] = useState<string | null>(null)
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null)

  useEffect(() => {
    loadProject()
  }, [projectId])

  // Auto-redirect if processing
  useEffect(() => {
    if (project && project.status === 'processing') {
      const timer = setTimeout(() => {
        router.push(`/studio/processing/${projectId}`)
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [project, projectId, router])

  // Update active segment based on video time
  useEffect(() => {
    if (!videoRef.current || !project?.transcription) return

    const handleTimeUpdate = () => {
      const time = videoRef.current!.currentTime
      setCurrentTime(time)
      
      const activeSegment = TranscriptionService.getSegmentAtTime(
        project.transcription!.segments,
        time
      )
      
      if (activeSegment && activeSegment.id !== activeSegmentId) {
        setActiveSegmentId(activeSegment.id)
        
        // Auto-scroll to active segment
        if (transcriptionScrollRef.current) {
          const element = document.getElementById(`segment-${activeSegment.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
    }

    videoRef.current.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [project?.transcription, activeSegmentId])

  const loadProject = async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      
      // Debug clip durations
      if (proj.folders.clips.length > 0) {
        console.log("Clip durations:", proj.folders.clips.map(c => ({
          id: c.id,
          title: c.title,
          duration: c.duration,
          startTime: c.startTime,
          endTime: c.endTime,
          calculated: c.endTime - c.startTime
        })))
      }
      
      setProject(proj)
    } catch (error) {
      console.error("Failed to load project:", error)
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
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
      await loadProject();
      setActiveTab("blog");
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

  const handleSegmentClick = (segment: TranscriptionData['segments'][0]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = segment.start
      videoRef.current.play()
    }
  }

  const handleDownloadTranscript = async (format: 'txt' | 'srt' | 'vtt') => {
    try {
      const response = await fetch(`/api/process-transcription?projectId=${projectId}&format=${format}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project!.title}-${format === 'txt' ? 'transcript' : 'subtitles'}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Downloaded ${format.toUpperCase()} file`)
    } catch (error) {
      toast.error(`Failed to download ${format} file`)
    }
  }

  const exportBlogAsMarkdown = (post: BlogPost) => {
    // Create markdown content with frontmatter
    const markdown = `---
title: ${post.title}
date: ${new Date(post.createdAt).toISOString()}
tags: ${post.tags.join(', ')}
seo_title: ${post.seoTitle}
seo_description: ${post.seoDescription}
reading_time: ${post.readingTime} minutes
---

# ${post.title}

${post.excerpt}

${post.content}

## Tags
${post.tags.map(tag => `- ${tag}`).join('\n')}
`

    // Create blob and download
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${post.title.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Blog post exported as Markdown')
  }

  const handleExportClip = async (clipId: string) => {
    if (!project?.klap_project_id) {
      toast.error("Klap project ID not found")
      return
    }

    setExportingClipId(clipId)
    toast.info("Exporting clip...")

    try {
      const response = await fetch('/api/process-klap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          clipIds: [clipId],
          klapFolderId: project.klap_project_id
        })
      })

      if (!response.ok) {
        throw new Error("Failed to export clip")
      }

      const result = await response.json()
      toast.success("Clip exported successfully!")
      
      // Reload project to get updated clip data
      await loadProject()
    } catch (error) {
      toast.error("Failed to export clip")
      console.error("Export error:", error)
    } finally {
      setExportingClipId(null)
    }
  }

  const handleExportAllClips = async () => {
    if (!project?.klap_project_id || !project.folders.clips.length) {
      toast.error("No clips to export")
      return
    }

    setIsExportingClips(true)
    toast.info(`Exporting ${project.folders.clips.length} clips...`)

    try {
      const clipIds = project.folders.clips.map(clip => clip.id)
      const response = await fetch('/api/process-klap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          clipIds,
          klapFolderId: project.klap_project_id
        })
      })

      if (!response.ok) {
        throw new Error("Failed to export clips")
      }

      const result = await response.json()
      toast.success(`Successfully exported ${result.exportedClips.length} clips!`)
      
      // Reload project to get updated clip data
      await loadProject()
    } catch (error) {
      toast.error("Failed to export clips")
      console.error("Export error:", error)
    } finally {
      setIsExportingClips(false)
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
  const searchResults = searchQuery && project.transcription
    ? TranscriptionService.searchTranscription(project.transcription.segments, searchQuery)
    : []
  const displaySegments = searchQuery ? searchResults : (project.transcription?.segments || [])

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
                Your video is being processed. Redirecting to processing view...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
      
      <div className="relative mx-auto max-[1600px] px-4 animate-in">
        {/* Streamlined Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/projects')}
              className="hover:bg-primary/10"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <IconSettings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <IconShare2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <IconClock className="h-4 w-4" />
                {formatDuration(project.metadata.duration)}
              </span>
              <span>•</span>
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
              {project.transcription && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <IconLanguage className="h-4 w-4" />
                    {project.transcription.language.toUpperCase()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid - Video Left, Transcription Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Video Player & Content Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden border-primary/20 shadow-lg">
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

            {/* AI Actions Bar */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg gradient-premium-subtle">
                      <IconWand className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">AI Actions</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={handleGenerateBlog} 
                      disabled={isGeneratingBlog || !project.transcription} 
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
                          {project.folders.blog.length > 0 ? "Regenerate Blog" : "Generate Blog"}
                        </>
                      )}
                    </Button>
                    
                    <Button size="sm" variant="outline" disabled>
                      <IconBrandTwitter className="mr-2 h-4 w-4"/>
                      Social Posts
                      <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                    </Button>
                    
                    <Button size="sm" variant="outline" disabled>
                      <IconScissors className="mr-2 h-4 w-4"/>
                      More Clips
                      <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b">
                  <div className="px-6 pt-6 pb-2">
                    <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                      <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-3">
                        <IconChartBar className="h-5 w-5" />
                        <span className="text-xs font-medium">Overview</span>
                        <span className="text-xs text-muted-foreground">Project Stats</span>
                      </TabsTrigger>
                      <TabsTrigger value="clips" className="flex flex-col items-center gap-1 py-3">
                        <IconScissors className="h-5 w-5" />
                        <span className="text-xs font-medium">Video Clips</span>
                        <span className="text-xs text-muted-foreground">{stats.totalClips} generated</span>
                      </TabsTrigger>
                      <TabsTrigger value="transcription" className="flex flex-col items-center gap-1 py-3">
                        <IconFileText className="h-5 w-5" />
                        <span className="text-xs font-medium">Transcription</span>
                        <span className="text-xs text-muted-foreground">{project.transcription ? 'Available' : 'Not ready'}</span>
                      </TabsTrigger>
                      <TabsTrigger value="blog" className="flex flex-col items-center gap-1 py-3">
                        <IconArticle className="h-5 w-5" />
                        <span className="text-xs font-medium">Blog Posts</span>
                        <span className="text-xs text-muted-foreground">{stats.totalBlogs > 0 ? `${stats.totalBlogs} created` : 'Generate'}</span>
                      </TabsTrigger>
                      <TabsTrigger value="social" className="flex flex-col items-center gap-1 py-3">
                        <IconShare2 className="h-5 w-5" />
                        <span className="text-xs font-medium">Social Media</span>
                        <span className="text-xs text-muted-foreground">{stats.totalSocialPosts > 0 ? `${stats.totalSocialPosts} posts` : 'Coming soon'}</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <TabsContent value="overview" className="mt-0">
                      <div className="space-y-6">
                        {/* Project Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-primary/10">
                                  <IconScissors className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold">{stats.totalClips}</p>
                                  <p className="text-sm text-muted-foreground">Video Clips</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-green-500/10">
                                  <IconFileText className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold">{project.transcription ? '1' : '0'}</p>
                                  <p className="text-sm text-muted-foreground">Transcription</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-blue-500/10">
                                  <IconArticle className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold">{stats.totalBlogs}</p>
                                  <p className="text-sm text-muted-foreground">Blog Posts</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-purple-500/10">
                                  <IconShare2 className="h-6 w-6 text-purple-500" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold">{stats.totalSocialPosts}</p>
                                  <p className="text-sm text-muted-foreground">Social Posts</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Top Clips Preview */}
                        {project.folders.clips.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Top Performing Clips</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab('clips')}
                                className="text-primary"
                              >
                                View All
                                <IconArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {[...project.folders.clips]
                                .sort((a, b) => (b.score || 0) - (a.score || 0))
                                .slice(0, 3)
                                .map((clip, index) => (
                                  <div key={clip.id} className="relative group cursor-pointer"
                                    onClick={() => {
                                      setSelectedClip(clip)
                                      setShowVideoModal(true)
                                    }}
                                  >
                                    <div className="aspect-[9/16] relative bg-black rounded-lg overflow-hidden">
                                      {clip.exportUrl ? (
                                        <>
                                          <video
                                            src={clip.exportUrl}
                                            className="w-full h-full object-cover"
                                            poster={clip.thumbnail || `${clip.exportUrl}#t=0.1`}
                                            muted
                                            loop
                                            playsInline
                                            preload="metadata"
                                            controls={false}
                                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.pause()
                                              e.currentTarget.currentTime = 0
                                            }}
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                                                <IconPlayerPlay className="h-6 w-6 text-black" />
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800">
                                          <IconVideoOff className="h-10 w-10 text-gray-600" />
                                        </div>
                                      )}
                                      
                                      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
                                      
                                      <div className="absolute top-2 left-2">
                                        <Badge className={cn(
                                          "font-bold text-xs",
                                          index === 0 ? "bg-yellow-500 text-black" : 
                                          index === 1 ? "bg-gray-300 text-black" : 
                                          "bg-orange-500 text-white"
                                        )}>
                                          #{index + 1}
                                        </Badge>
                                      </div>
                                      
                                      <div className="absolute top-2 right-2">
                                        <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                          <IconSparkles className="h-3 w-3" />
                                          {Math.round((clip.score || 0) * 100)}
                                        </div>
                                      </div>
                                      
                                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                                      
                                      <div className="absolute bottom-2 left-2 right-2">
                                        <p className="text-white text-xs font-medium truncate">
                                          {clip.title || `Clip ${index + 1}`}
                                        </p>
                                        <p className="text-white/80 text-xs">
                                          {formatDuration(clip.duration || (clip.endTime - clip.startTime))}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="clips" className="mt-0">
                      {project.folders.clips.length > 0 ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h2 className="text-2xl font-bold">
                                {project.folders.clips.length} AI-Generated Clips
                              </h2>
                              <p className="text-sm text-muted-foreground mt-1">
                                Ranked by viral potential • Best to worst
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportAllClips}
                                disabled={isExportingClips}
                              >
                                {isExportingClips ? (
                                  <>
                                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Exporting...
                                  </>
                                ) : (
                                  <>
                                    <IconDownload className="h-4 w-4 mr-2" />
                                    Download All
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Virality Score Legend - Compact */}
                          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <IconSparkles className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Score Guide:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                  <span><strong>90+</strong> Viral</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                                  <span><strong>70-89</strong> High</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                  <span><strong>50-69</strong> Good</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                                  <span><strong>&lt;50</strong> Low</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Clips List - Large Format */}
                          <div className="space-y-6 max-w-5xl mx-auto">
                            {[...project.folders.clips]
                              .sort((a, b) => (b.score || 0) - (a.score || 0))
                              .map((clip: ClipData, index: number) => (
                              <motion.div
                                key={clip.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Card className={cn(
                                  "overflow-hidden border-2 transition-all hover:shadow-xl",
                                  (clip.score || 0) >= 0.9 ? "border-red-500/30 hover:border-red-500/50" :
                                  (clip.score || 0) >= 0.7 ? "border-orange-500/30 hover:border-orange-500/50" :
                                  (clip.score || 0) >= 0.5 ? "border-yellow-500/30 hover:border-yellow-500/50" :
                                  "border-gray-500/30 hover:border-gray-500/50"
                                )}>
                                  <div className="flex flex-col lg:flex-row">
                                    {/* Left: Video Player */}
                                    <div className="lg:w-[300px] bg-black flex items-center justify-center p-4">
                                      <div className="relative w-full max-w-[200px]">
                                        <div 
                                          className="aspect-[9/16] relative bg-black rounded-lg overflow-hidden cursor-pointer group"
                                          onClick={() => {
                                            setSelectedClip(clip)
                                            setShowVideoModal(true)
                                          }}
                                        >
                                          {clip.exportUrl ? (
                                            <>
                                              <video
                                                src={clip.exportUrl}
                                                className="w-full h-full object-cover"
                                                poster={clip.thumbnail || `${clip.exportUrl}#t=0.1`}
                                                muted
                                                loop
                                                playsInline
                                                preload="metadata"
                                                controls={false}
                                                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.pause()
                                                  e.currentTarget.currentTime = 0
                                                }}
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                                                    <IconPlayerPlay className="h-8 w-8 text-black" />
                                                  </div>
                                                </div>
                                              </div>
                                            </>
                                          ) : (
                                            <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800">
                                              <div className="text-center">
                                                <IconVideoOff className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                                                <p className="text-xs text-gray-500">Processing...</p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Rank Badge */}
                                          <div className="absolute top-3 left-3">
                                            <Badge className={cn(
                                              "font-bold text-sm px-3 py-1.5",
                                              index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black" : 
                                              index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400 text-black" : 
                                              index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white" :
                                              "bg-black/70 text-white"
                                            )}>
                                              #{index + 1}
                                            </Badge>
                                          </div>
                                          
                                          {/* Duration */}
                                          <div className="absolute bottom-3 right-3">
                                            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-medium">
                                              {formatDuration(clip.duration || (clip.endTime - clip.startTime))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Right: Clip Details */}
                                    <div className="flex-1 p-6 space-y-4">
                                      {/* Header with Title and Actions */}
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <h3 className="text-xl font-bold mb-1">
                                            {clip.title || `Clip ${index + 1}`}
                                          </h3>
                                          {clip.description && (
                                            <p className="text-sm text-muted-foreground">{clip.description}</p>
                                          )}
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedClip(clip)
                                              setShowVideoModal(true)
                                            }}
                                          >
                                            <IconMaximize className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            disabled={!clip.exportUrl}
                                            onClick={() => {
                                              if (clip.exportUrl) {
                                                const link = document.createElement('a')
                                                link.href = clip.exportUrl
                                                link.download = `${clip.title || 'clip'}.mp4`
                                                document.body.appendChild(link)
                                                link.click()
                                                document.body.removeChild(link)
                                                toast.success('Download started')
                                              }
                                            }}
                                          >
                                            <IconDownload className="h-4 w-4 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {/* Virality Score Section */}
                                      <div className={cn(
                                        "p-4 rounded-lg border",
                                        (clip.score || 0) >= 0.9 ? "bg-red-500/10 border-red-500/30" :
                                        (clip.score || 0) >= 0.7 ? "bg-orange-500/10 border-orange-500/30" :
                                        (clip.score || 0) >= 0.5 ? "bg-yellow-500/10 border-yellow-500/30" :
                                        "bg-gray-500/10 border-gray-500/30"
                                      )}>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-3">
                                            <div className={cn(
                                              "p-2 rounded-lg",
                                              (clip.score || 0) >= 0.9 ? "bg-gradient-to-br from-red-500 to-pink-500" :
                                              (clip.score || 0) >= 0.7 ? "bg-gradient-to-br from-orange-500 to-yellow-500" :
                                              (clip.score || 0) >= 0.5 ? "bg-gradient-to-br from-yellow-500 to-green-500" :
                                              "bg-gradient-to-br from-gray-500 to-gray-600"
                                            )}>
                                              <IconSparkles className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-muted-foreground">Virality Score</p>
                                              <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold">{Math.round((clip.score || 0) * 100)}</span>
                                                <span className="text-lg text-muted-foreground">/100</span>
                                              </div>
                                            </div>
                                          </div>
                                          <Badge className={cn(
                                            "text-sm px-3 py-1",
                                            (clip.score || 0) >= 0.9 ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" :
                                            (clip.score || 0) >= 0.7 ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white" :
                                            (clip.score || 0) >= 0.5 ? "bg-gradient-to-r from-yellow-500 to-green-500 text-black" :
                                            "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                                          )}>
                                            {(clip.score || 0) >= 0.9 ? "🔥 Viral Potential" :
                                             (clip.score || 0) >= 0.7 ? "⚡ High Engagement" :
                                             (clip.score || 0) >= 0.5 ? "✨ Good Content" :
                                             "💡 Needs Improvement"}
                                          </Badge>
                                        </div>
                                        
                                        {/* Score Bar */}
                                        <div className="relative h-2 bg-black/20 rounded-full overflow-hidden mb-3">
                                          <motion.div
                                            className={cn(
                                              "absolute left-0 top-0 h-full rounded-full",
                                              (clip.score || 0) >= 0.9 ? "bg-gradient-to-r from-red-500 to-pink-500" :
                                              (clip.score || 0) >= 0.7 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
                                              (clip.score || 0) >= 0.5 ? "bg-gradient-to-r from-yellow-500 to-green-500" :
                                              "bg-gray-400"
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(clip.score || 0) * 100}%` }}
                                            transition={{ duration: 0.8, delay: index * 0.05 }}
                                          />
                                        </div>
                                        
                                        {/* Virality Explanation */}
                                        <div className="space-y-2">
                                          <p className="text-sm font-medium">Why this score?</p>
                                          {clip.viralityExplanation ? (
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                              {clip.viralityExplanation}
                                            </p>
                                          ) : (
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                              <div>
                                                <p className="font-medium mb-1">✅ Strengths:</p>
                                                <ul className="text-muted-foreground space-y-0.5 text-xs">
                                                  <li>• Strong visual appeal</li>
                                                  <li>• Optimal {formatDuration(clip.duration || (clip.endTime - clip.startTime))} duration</li>
                                                  <li>• Engaging content hook</li>
                                                </ul>
                                              </div>
                                              <div>
                                                <p className="font-medium mb-1">💡 To improve:</p>
                                                <ul className="text-muted-foreground space-y-0.5 text-xs">
                                                  <li>• Add trending audio</li>
                                                  <li>• Include captions/text</li>
                                                  <li>• Use hashtags wisely</li>
                                                </ul>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Additional Info */}
                                      <div className="flex items-center gap-4 text-sm">
                                        {clip.type && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">Type:</span>
                                            <Badge variant="outline" className="capitalize">{clip.type}</Badge>
                                          </div>
                                        )}
                                        {clip.tags && clip.tags.length > 0 && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Tags:</span>
                                            <div className="flex gap-1">
                                              {clip.tags.slice(0, 3).map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-xs">
                                                  {tag}
                                                </Badge>
                                              ))}
                                              {clip.tags.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">
                                                  +{clip.tags.length - 3}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                          
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconScissors className="h-16 w-16 text-primary/50" />}
                          title="No clips generated yet"
                          description="Clips will appear here after processing"
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="blog" className="mt-0">
                      {project.folders.blog.length > 0 ? (
                        <div className="space-y-6">
                          {project.folders.blog.map((post: BlogPost) => (
                            <Card key={post.id} className="overflow-hidden">
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-xl">{post.title}</CardTitle>
                                    <CardDescription>{post.excerpt}</CardDescription>
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
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>{post.readingTime} min read</span>
                                  <span>•</span>
                                  <span>{post.content.split(' ').length} words</span>
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
                                <div className={cn(
                                  "prose prose-sm max-w-none dark:prose-invert",
                                  expandedBlogId !== post.id && "line-clamp-6"
                                )}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {post.content}
                                  </ReactMarkdown>
                                </div>
                                <div className="flex gap-2 mt-4">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setExpandedBlogId(expandedBlogId === post.id ? null : post.id)}
                                  >
                                    <IconExternalLink className="h-4 w-4 mr-2" />
                                    {expandedBlogId === post.id ? "Show Less" : "View Full Post"}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => exportBlogAsMarkdown(post)}
                                  >
                                    <IconDownload className="h-4 w-4 mr-2" />
                                    Export Markdown
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconArticle className="h-16 w-16 text-primary/50" />}
                          title="No blog post yet"
                          description="Generate a blog post from your video's transcript"
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
                              <Card key={post.id} className="overflow-hidden">
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
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconBrandTwitter className="h-16 w-16 text-primary/50" />}
                          title="No social posts yet"
                          description="Social media posts will appear here after generation"
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="transcription" className="mt-0">
                      {project.transcription ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h2 className="text-2xl font-bold">Full Transcription</h2>
                              <p className="text-sm text-muted-foreground mt-1">
                                {project.transcription.segments.length} segments • {project.transcription.text.split(' ').length} words • {project.transcription.language.toUpperCase()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadTranscript('txt')}
                              >
                                <IconFileDownload className="h-4 w-4 mr-2" />
                                Download TXT
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadTranscript('srt')}
                              >
                                <IconFileDownload className="h-4 w-4 mr-2" />
                                Download SRT
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(project.transcription!.text, 'full-transcript')}
                              >
                                {copiedId === 'full-transcript' ? (
                                  <IconCheck className="h-4 w-4" />
                                ) : (
                                  <IconCopy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Search Bar */}
                          <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search in transcription..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                            {searchQuery && (
                              <Badge 
                                variant="secondary" 
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                              >
                                {searchResults.length} results
                              </Badge>
                            )}
                          </div>
                          
                          {/* Full Text View */}
                          <Card>
                            <CardContent className="p-6">
                              <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-wrap leading-relaxed">
                                  {searchQuery ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: project.transcription.text.replace(
                                          new RegExp(searchQuery, 'gi'),
                                          (match: string) => `<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">${match}</mark>`
                                        ),
                                      }}
                                    />
                                  ) : (
                                    project.transcription.text
                                  )}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Segments View */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Timestamped Segments</h3>
                            <div className="space-y-3">
                              {displaySegments.map((segment) => (
                                <Card
                                  key={segment.id}
                                  className={cn(
                                    "cursor-pointer transition-all hover:shadow-md",
                                    activeSegmentId === segment.id && "ring-2 ring-primary"
                                  )}
                                  onClick={() => handleSegmentClick(segment)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSegmentClick(segment)
                                        }}
                                      >
                                        <IconPlayerPlay className="h-4 w-4" />
                                      </Button>
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-muted-foreground">
                                            {formatDuration(segment.start)} - {formatDuration(segment.end)}
                                          </span>
                                          {segment.confidence && (
                                            <Badge variant="outline" className="text-xs">
                                              {(segment.confidence * 100).toFixed(0)}% confidence
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm leading-relaxed">
                                          {searchQuery && 'matchedText' in segment ? (
                                            <span
                                              dangerouslySetInnerHTML={{
                                                __html: (segment as any).matchedText.replace(
                                                  new RegExp(searchQuery, 'gi'),
                                                  (match: string) => `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
                                                ),
                                              }}
                                            />
                                          ) : (
                                            segment.text
                                          )}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          copyToClipboard(segment.text, segment.id)
                                        }}
                                      >
                                        {copiedId === segment.id ? (
                                          <IconCheck className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <IconCopy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          icon={<IconFileText className="h-16 w-16 text-primary/50" />}
                          title="No transcription available"
                          description="Transcription will be generated during video processing"
                        />
                      )}
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </Card>
          </div>

          {/* Transcription Panel - Right Side */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 h-[calc(100vh-120px)] overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconFileText className="h-5 w-5 text-primary" />
                    Transcription
                  </CardTitle>
                  {project.transcription && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadTranscript('txt')}
                        title="Download as text"
                      >
                        <IconDownload className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {project.transcription && (
                  <p className="text-sm text-muted-foreground">
                    {project.transcription.segments.length} segments • {project.transcription.text.split(' ').length} words
                  </p>
                )}
              </CardHeader>
              
              {project.transcription ? (
                <>
                  <div className="px-4 pb-3">
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transcription..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                      />
                      {searchQuery && (
                        <Badge 
                          variant="secondary" 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                        >
                          {searchResults.length} results
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="flex-1 px-4" ref={transcriptionScrollRef}>
                    <div className="space-y-2 pb-4">
                      {displaySegments.map((segment) => (
                        <div
                          key={segment.id}
                          id={`segment-${segment.id}`}
                          className={cn(
                            "group relative p-3 rounded-lg border transition-all cursor-pointer",
                            "hover:bg-muted/50",
                            activeSegmentId === segment.id
                              ? "border-primary bg-primary/5"
                              : "border-transparent"
                          )}
                          onClick={() => handleSegmentClick(segment)}
                        >
                          <div className="flex items-start gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSegmentClick(segment)
                              }}
                            >
                              <IconPlayerPlay className="h-3 w-3" />
                            </Button>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <IconClock className="h-3 w-3" />
                                <span>{formatDuration(segment.start)} - {formatDuration(segment.end)}</span>
                                {segment.confidence && (
                                  <span className="ml-auto">
                                    {(segment.confidence * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed">
                                {searchQuery && 'matchedText' in segment ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: (segment as any).matchedText.replace(
                                        new RegExp(searchQuery, 'gi'),
                                        (match: string) => `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
                                      ),
                                    }}
                                  />
                                ) : (
                                  segment.text
                                )}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(segment.text, segment.id)
                              }}
                            >
                              {copiedId === segment.id ? (
                                <IconCheck className="h-3 w-3 text-green-600" />
                              ) : (
                                <IconCopy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={<IconFileText className="h-12 w-12 text-primary/50" />}
                    title="No transcription"
                    description="Transcription will appear here"
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {/* Video Modal */}
      {showVideoModal && selectedClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setShowVideoModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10"
              onClick={() => setShowVideoModal(false)}
            >
              <IconX className="h-6 w-6" />
            </Button>
            
            <div className="bg-background rounded-lg overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left: Video Player */}
                <div className="bg-black flex items-center justify-center">
                  <div className="w-full max-w-sm">
                    <div className="aspect-[9/16] relative">
                      {selectedClip.exportUrl ? (
                        <video
                          src={selectedClip.exportUrl}
                          className="w-full h-full object-contain"
                          controls
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <IconVideoOff className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-400">Video not available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right: Clip Details */}
                <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
                  {/* Title and Stats */}
                  <div>
                    <h2 className="text-2xl font-bold mb-3">{selectedClip.title || 'Untitled Clip'}</h2>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconClock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Duration</p>
                          <p className="font-medium">{formatDuration(selectedClip.duration || selectedClip.endTime - selectedClip.startTime)}</p>
                        </div>
                      </div>
                      {selectedClip.createdAt && (
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <IconClock className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Created</p>
                            <p className="font-medium">{new Date(selectedClip.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Prominent Virality Score Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <IconSparkles className="h-5 w-5 text-primary" />
                      Virality Score Analysis
                    </h3>
                    
                    {/* Large Visual Score Display */}
                    <div className={cn(
                      "relative p-6 rounded-xl",
                      (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30" :
                      (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30" :
                      (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-br from-yellow-500/20 to-green-500/20 border-yellow-500/30" :
                      "bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-500/30",
                      "border-2"
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Overall Score</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">{Math.round((selectedClip.score || 0) * 100)}</span>
                            <span className="text-2xl text-muted-foreground">/100</span>
                          </div>
                        </div>
                        <div className={cn(
                          "p-4 rounded-full",
                          (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-br from-red-500 to-pink-500" :
                          (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-br from-orange-500 to-yellow-500" :
                          (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-br from-yellow-500 to-green-500" :
                          "bg-gradient-to-br from-gray-500 to-gray-600"
                        )}>
                          <IconSparkles className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Score Bar */}
                      <div className="space-y-2">
                        <div className="relative h-4 bg-black/20 rounded-full overflow-hidden">
                          <motion.div
                            className={cn(
                              "absolute left-0 top-0 h-full rounded-full",
                              (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-r from-red-500 to-pink-500" :
                              (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
                              (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-r from-yellow-500 to-green-500" :
                              "bg-gray-400"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${(selectedClip.score || 0) * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Poor</span>
                          <span>Average</span>
                          <span>Good</span>
                          <span>Excellent</span>
                          <span>Viral</span>
                        </div>
                      </div>
                      
                      {/* Performance Badge */}
                      <div className="mt-4 flex items-center justify-center">
                        <Badge className={cn(
                          "text-sm px-4 py-1",
                          (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" :
                          (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white" :
                          (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-r from-yellow-500 to-green-500 text-black" :
                          "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                        )}>
                          {(selectedClip.score || 0) >= 0.9 ? "🔥 Viral Potential" :
                           (selectedClip.score || 0) >= 0.7 ? "⚡ High Engagement" :
                           (selectedClip.score || 0) >= 0.5 ? "✨ Good Content" :
                           "💡 Needs Improvement"}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Detailed Explanation */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Why this score?</p>
                      {selectedClip.viralityExplanation ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedClip.viralityExplanation}
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="font-medium mb-1">✅ Strengths:</p>
                            <ul className="text-muted-foreground space-y-0.5 text-xs">
                              <li>• Strong visual appeal</li>
                              <li>• Optimal {formatDuration(selectedClip.duration || selectedClip.endTime - selectedClip.startTime)} duration</li>
                              <li>• Engaging content hook</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium mb-1">💡 To improve:</p>
                            <ul className="text-muted-foreground space-y-0.5 text-xs">
                              <li>• Add trending audio</li>
                              <li>• Include captions/text</li>
                              <li>• Use hashtags wisely</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Transcript */}
                  {selectedClip.transcript && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <IconFileText className="h-5 w-5 text-primary" />
                        Transcript
                      </h3>
                      <div className="p-4 rounded-lg bg-muted/30 border max-h-48 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{selectedClip.transcript}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {selectedClip.tags && selectedClip.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedClip.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => {
                        if (selectedClip.exportUrl) {
                          const link = document.createElement('a')
                          link.href = selectedClip.exportUrl
                          link.download = `${selectedClip.title || 'clip'}.mp4`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          toast.success('Download started')
                        }
                      }}
                      disabled={!selectedClip.exportUrl}
                    >
                      <IconDownload className="h-5 w-5 mr-2" />
                      Download Video
                    </Button>
                    {selectedClip.transcript && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          copyToClipboard(selectedClip.transcript!, 'clip-transcript')
                          toast.success('Transcript copied to clipboard')
                        }}
                      >
                        <IconCopy className="h-5 w-5 mr-2" />
                        Copy Transcript
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 