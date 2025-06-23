"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  IconFileDownload,
  IconMaximize,
  IconX,
  IconPhoto,
  IconQuote,
  IconEye,
  IconLayoutGrid,
  IconInfoCircle,
  IconCamera,
  IconSticker,
  IconEdit,
  IconDots,
  IconClipboardCopy,
  IconRocket,
} from "@tabler/icons-react"
import { CheckCircle2 } from "lucide-react"
import { ProjectService } from "@/lib/services"
import { Project, ClipData, BlogPost, SocialPost, TranscriptionData } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { formatDuration } from "@/lib/video-utils"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { TranscriptionService } from "@/lib/transcription-service"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PublishingWorkflow } from "@/components/publishing-workflow"
import { EnhancedTranscriptEditor } from "@/components/enhanced-transcript-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { predefinedStyles, type ImageSuggestion } from "@/lib/ai-image-service"
import { BlogGenerationDialog, type BlogGenerationOptions } from "@/components/blog-generation-dialog"
import { ImageCarousel } from "@/components/image-carousel"

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
  const [showBlogDialog, setShowBlogDialog] = useState(false)
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isExportingClips, setIsExportingClips] = useState(false)
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null)
  const [showPublishingWorkflow, setShowPublishingWorkflow] = useState(false)
  
  // Image generation states
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<ImageSuggestion | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("gradient")
  const [selectedQuality, setSelectedQuality] = useState("medium")
  const [selectedSize, setSelectedSize] = useState("1024x1024")
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const [streamingProgress, setStreamingProgress] = useState(0)
  const [carouselSlides, setCarouselSlides] = useState<{ [key: string]: number }>({})  // Track slide count for each suggestion
  const [hasSubtitles, setHasSubtitles] = useState(false)

  useEffect(() => {
    loadProject()
  }, [projectId])

  // Load generated images when graphics tab is active
  useEffect(() => {
    if (activeTab === 'graphics' && project?.folders?.images) {
      setGeneratedImages(project.folders.images)
    }
  }, [activeTab, project?.folders?.images])

  // Auto-redirect if processing
  useEffect(() => {
    if (project) {
      const progress = ProjectService.calculateProjectProgress(project)
      // Only redirect if actually processing (not at 100%)
      if (project.status === 'processing' && progress < 100) {
        const timer = setTimeout(() => {
          router.push(`/studio/processing/${projectId}`)
        }, 1500)
        
        return () => clearTimeout(timer)
      }
    }
  }, [project, projectId, router])

  // Update active segment based on video time
  useEffect(() => {
    if (!videoRef.current || !project?.transcription) return

    const handleTimeUpdate = () => {
      const time = videoRef.current!.currentTime
      
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

  const handleGenerateBlog = async (options: BlogGenerationOptions) => {
    if (!project?.transcription) {
      toast.error("A transcription is required to generate a blog post.");
      return;
    }
    
    if (!project?.content_analysis?.keywords || project.content_analysis.keywords.length === 0) {
      toast.warning("Content analysis is still processing. Please wait a moment and try again.");
      return;
    }
    
    setIsGeneratingBlog(true);
    setShowBlogDialog(false);
    toast.info(`AI is creating a ${options.length}-word ${options.style} blog post... This may take a few moments.`);

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to generate blog post.");
      }

      const result = await response.json();
      toast.success("Blog post created successfully! 🎉");
      await loadProject();
      setActiveTab("blog");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error generating blog post. Please try again.");
      console.error("Blog generation error:", error);
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
      } catch {
        console.error('Failed to delete project')
        toast.error('Failed to delete project')
      }
    }
  }

  const handlePublishContent = (selectedContent: any[]) => {
    // Save selected content to session storage to pass to publish page
    sessionStorage.setItem('selectedContent', JSON.stringify(selectedContent))
    router.push(`/projects/${projectId}/publish`)
  }

  const handleEditBlog = (blogId: string) => {
    // Navigate to blog editor with project context
    router.push(`/projects/${projectId}/blog/${blogId}`)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success("Copied to clipboard")
    } catch {
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
    } catch {
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
  
  const handleDeleteBlog = async (blogId: string, blogTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${blogTitle}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      // Filter out the blog post
      const updatedBlogFolder = project!.folders.blog.filter((post: BlogPost) => post.id !== blogId)
      const updatedFolders = {
        ...project!.folders,
        blog: updatedBlogFolder
      }
      
      // Update project in database
      await ProjectService.updateProject(project!.id, { 
        folders: updatedFolders
      })
      
      toast.success('Blog post deleted successfully')
      await loadProject() // Reload to get updated data
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast.error('Failed to delete blog post')
    }
  }
  
  const handleDuplicateBlog = async (post: BlogPost) => {
    try {
      // Create a duplicate with a new ID and updated title
      const duplicatedPost = {
        ...post,
        id: crypto.randomUUID(),
        title: `${post.title} (Copy)`,
        createdAt: new Date().toISOString(),
        status: 'draft'
      }
      
      // Add to blog folder
      const updatedBlogFolder = [...project!.folders.blog, duplicatedPost]
      const updatedFolders = {
        ...project!.folders,
        blog: updatedBlogFolder
      }
      
      // Update project in database
      await ProjectService.updateProject(project!.id, { 
        folders: updatedFolders
      })
      
      toast.success('Blog post duplicated successfully')
      await loadProject() // Reload to get updated data
    } catch (error) {
      console.error('Error duplicating blog post:', error)
      toast.error('Failed to duplicate blog post')
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

  const loadImageSuggestions = async () => {
    if (!project?.content_analysis?.keywords || project.content_analysis.keywords.length === 0) {
      toast.warning("Content analysis is still processing. Please wait and try again.")
      return
    }

    setLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/image-suggestions?projectId=${project.id}`)
      if (!response.ok) {
        throw new Error("Failed to load suggestions")
      }
      
      const data = await response.json()
      setImageSuggestions(data.suggestions)
    } catch (error) {
      toast.error("Failed to load image suggestions")
      console.error("Suggestions error:", error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const generateImage = async (prompt: string) => {
    setGeneratingImage(true)
    setStreamingProgress(0)
    
    try {
      // First try streaming, fallback to regular POST
      const useStreaming = false // TODO: Enable when streaming is ready
      
      if (useStreaming) {
        const params = new URLSearchParams({
          projectId: project!.id,
          prompt,
          quality: selectedQuality,
          size: selectedSize,
          style: selectedStyle
        })
        
        const eventSource = new EventSource(`/api/generate-images?${params}`)
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)
          
          if (data.type === 'progress') {
            setStreamingProgress(data.progress)
          } else if (data.type === 'complete') {
            const newImage = {
              id: crypto.randomUUID(),
              url: `data:image/png;base64,${data.image}`,
              prompt,
              style: selectedStyle,
              quality: selectedQuality,
              size: selectedSize,
              createdAt: new Date().toISOString()
            }
            setGeneratedImages(prev => [newImage, ...prev])
            toast.success("Image generated successfully!")
            eventSource.close()
          } else if (data.type === 'error') {
            toast.error(`Error: ${data.error}`)
            eventSource.close()
          }
        }
        
        eventSource.onerror = () => {
          toast.error("Connection error during image generation")
          eventSource.close()
          setGeneratingImage(false)
        }
      } else {
        // Regular POST request
        const response = await fetch('/api/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project!.id,
            prompt,
            quality: selectedQuality,
            size: selectedSize,
            style: selectedStyle,
            n: 1
          })
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.details || 'Failed to generate image')
        }
        
        const result = await response.json()
        if (result.images && result.images.length > 0) {
          setGeneratedImages(prev => [...result.images, ...prev])
          toast.success("Image generated successfully!")
          await loadProject() // Reload to get saved images
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate image")
      console.error("Image generation error:", error)
    } finally {
      setGeneratingImage(false)
      setStreamingProgress(0)
    }
  }

  const handleGenerateFromSuggestion = async (suggestion: ImageSuggestion) => {
    setSelectedSuggestion(suggestion)
    setCustomPrompt(suggestion.prompt)
    setSelectedStyle(suggestion.style || 'gradient')
    setSelectedQuality(suggestion.recommendedQuality)
    setSelectedSize(suggestion.recommendedSize)
    
    // If it's a carousel, generate multiple images
    if (suggestion.type === 'carousel') {
      const slides = carouselSlides[suggestion.id] || 3
      setGeneratingImage(true)
      toast.info(`Generating ${slides}-slide carousel...`)
      
      try {
        // Generate all slides with different prompts
        const prompts = []
        for (let i = 0; i < slides; i++) {
          prompts.push(`${suggestion.prompt} - Slide ${i + 1} of ${slides}, ${suggestion.description}`)
        }
        
        const response = await fetch('/api/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project!.id,
            prompt: prompts[0], // Use first prompt as base
            quality: suggestion.recommendedQuality,
            size: suggestion.recommendedSize,
            style: suggestion.style || 'gradient',
            n: slides,  // Generate multiple images
            isCarousel: true,
            carouselPrompts: prompts
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate carousel')
        }
        
        const result = await response.json()
        if (result.images && result.images.length > 0) {
          setGeneratedImages(prev => [...result.images, ...prev])
          toast.success(`Carousel with ${slides} slides generated!`)
          await loadProject()
        }
      } catch (error) {
        toast.error("Failed to generate carousel")
        console.error("Carousel generation error:", error)
      } finally {
        setGeneratingImage(false)
      }
    } else {
      // Single image generation
      generateImage(suggestion.prompt)
    }
  }

  const handleGenerateCustom = () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }
    generateImage(customPrompt)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4 shadow-xl border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
              <IconLoader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Loading Project</CardTitle>
            <CardDescription className="text-base">
              Fetching your project details...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!project) return null

  const stats = ProjectService.getProjectStats(project)
  const totalImages = project.folders.images?.length || 0
  const progress = ProjectService.calculateProjectProgress(project)
  const isProcessing = project.status === 'processing' && progress < 100
  const searchResults = searchQuery && project.transcription
    ? TranscriptionService.searchTranscription(project.transcription.segments, searchQuery)
    : []
  const displaySegments = searchQuery ? searchResults : (project.transcription?.segments || [])

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      {/* Processing Overlay - Only show if actually processing */}
      {isProcessing && (
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
        {/* Enhanced Header with Powerful Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/projects')}
              className="mb-2"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              All Projects
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/settings`)}>
                <IconSettings className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Project Info with Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {project.title}
                  </h1>
                  <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                    {project.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-muted-foreground text-lg mb-3">{project.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
              
              {/* Powerful Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={() => setShowPublishingWorkflow(true)}
                  disabled={stats.totalClips === 0 && stats.totalBlogs === 0 && totalImages === 0}
                >
                  <IconRocket className="h-5 w-5 mr-2" />
                  Publish Content
                  {(stats.totalClips + stats.totalBlogs + totalImages > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.totalClips + stats.totalBlogs + totalImages} items
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/studio/processing/${projectId}`)}
                >
                  <IconWand className="h-4 w-4 mr-2" />
                  View Processing
                </Button>
              </div>
            </div>
          </div>

          {/* Content Generation Progress Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconSparkles className="h-5 w-5 text-primary" />
                    Content Generation Status
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI has analyzed your video and generated content
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{stats.overallProgress}%</p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
              
              {/* Ready Status Badges */}
              <div className="flex gap-3 mb-4">
                {hasSubtitles && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Long-form Ready (Subtitles applied)
                  </Badge>
                )}
                {!hasSubtitles && (
                  <Badge variant="outline" className="text-muted-foreground px-3 py-1">
                    Apply subtitles to prepare for long-form publishing
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <div className={cn(
                    "p-2 rounded-lg",
                    project.transcription ? "bg-green-500/20" : "bg-gray-500/20"
                  )}>
                    <IconFileText className={cn(
                      "h-5 w-5",
                      project.transcription ? "text-green-500" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">Transcript</p>
                    <p className="text-xs text-muted-foreground">
                      {project.transcription ? "Ready" : "Processing"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <div className={cn(
                    "p-2 rounded-lg",
                    stats.totalClips > 0 ? "bg-purple-500/20" : "bg-gray-500/20"
                  )}>
                    <IconScissors className={cn(
                      "h-5 w-5",
                      stats.totalClips > 0 ? "text-purple-500" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{stats.totalClips} Clips</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalClips > 0 ? "Generated" : "Processing"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <div className={cn(
                    "p-2 rounded-lg",
                    stats.totalBlogs > 0 ? "bg-blue-500/20" : "bg-gray-500/20"
                  )}>
                    <IconArticle className={cn(
                      "h-5 w-5",
                      stats.totalBlogs > 0 ? "text-blue-500" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{stats.totalBlogs} Blogs</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalBlogs > 0 ? "Created" : "Generate"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <div className={cn(
                    "p-2 rounded-lg",
                    totalImages > 0 ? "bg-pink-500/20" : "bg-gray-500/20"
                  )}>
                    <IconPhoto className={cn(
                      "h-5 w-5",
                      totalImages > 0 ? "text-pink-500" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{totalImages} Images</p>
                    <p className="text-xs text-muted-foreground">
                      {totalImages > 0 ? "Created" : "Generate"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <div className={cn(
                    "p-2 rounded-lg",
                    stats.totalSocialPosts > 0 ? "bg-orange-500/20" : "bg-gray-500/20"
                  )}>
                    <IconShare2 className={cn(
                      "h-5 w-5",
                      stats.totalSocialPosts > 0 ? "text-orange-500" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{stats.totalSocialPosts} Social</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalSocialPosts > 0 ? "Ready" : "Generate"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Generate more content based on your video's AI analysis
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBlogDialog(true)}
                    disabled={isGeneratingBlog || !project.transcription}
                  >
                    <IconWand className="h-4 w-4 mr-2" />
                    Generate Blog
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('graphics')}
                  >
                    <IconPhoto className="h-4 w-4 mr-2" />
                    Create Images
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                
                {/* Status Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {/* Long-form Ready */}
                  {hasSubtitles && (
                    <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Long-form Ready
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Video Info Bar */}
              {project.metadata?.duration && (
                <CardContent className="p-3 border-t bg-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <IconClock className="h-4 w-4" />
                        {formatDuration(project.metadata.duration)}
                      </span>
                      {project.transcription && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <IconLanguage className="h-4 w-4" />
                          {project.transcription.language.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {project.folders.clips.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {project.folders.clips.length} clips
                        </Badge>
                      )}
                      {hasSubtitles && (
                        <Badge variant="secondary" className="text-xs">
                          Subtitles applied
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
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
                      onClick={() => setShowBlogDialog(true)} 
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
                      <TabsTrigger value="graphics" className="flex flex-col items-center gap-1 py-3">
                        <IconSparkles className="h-5 w-5" />
                        <span className="text-xs font-medium">Social Graphics</span>
                        <span className="text-xs text-muted-foreground">{project.folders.images?.length || 0} generated</span>
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
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                <div className="p-3 rounded-lg bg-pink-500/10">
                                  <IconPhoto className="h-6 w-6 text-pink-500" />
                                </div>
                                <div>
                                  <p className="text-2xl font-bold">{(stats as any).totalImages || project.folders.images?.length || 0}</p>
                                  <p className="text-sm text-muted-foreground">AI Images</p>
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

                        {/* Content Analysis Section */}
                        {project.content_analysis && (
                          <div className="space-y-6 mt-8">
                            <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <IconSparkles className="h-5 w-5 text-primary" />
                                AI Content Analysis
                              </h3>
                              
                              {/* Keywords and Topics */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Keywords */}
                                <Card className="border-primary/20">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-primary/10">
                                        <IconSearch className="h-4 w-4 text-primary" />
                                      </div>
                                      Keywords
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                      {project.content_analysis.keywords.map((keyword: string, idx: number) => (
                                        <Badge 
                                          key={idx} 
                                          variant="secondary"
                                          className="bg-primary/10 hover:bg-primary/20 transition-colors cursor-default"
                                        >
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Topics */}
                                <Card className="border-primary/20">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-accent/10">
                                        <IconArticle className="h-4 w-4 text-accent" />
                                      </div>
                                      Main Topics
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                      {project.content_analysis.topics.map((topic: string, idx: number) => (
                                        <Badge 
                                          key={idx} 
                                          variant="outline"
                                          className="border-accent/50 text-accent hover:bg-accent/10 transition-colors cursor-default"
                                        >
                                          {topic}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Summary & Sentiment */}
                              <Card className="border-primary/20 mt-4">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Content Summary</CardTitle>
                                    <Badge 
                                      variant={
                                        project.content_analysis.sentiment === 'positive' ? 'default' :
                                        project.content_analysis.sentiment === 'negative' ? 'destructive' :
                                        'secondary'
                                      }
                                      className={cn(
                                        project.content_analysis.sentiment === 'positive' && 'bg-green-500/10 text-green-600 border-green-500/20',
                                        project.content_analysis.sentiment === 'neutral' && 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                                      )}
                                    >
                                      {project.content_analysis.sentiment} sentiment
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {project.content_analysis.summary}
                                  </p>
                                </CardContent>
                              </Card>

                              {/* Key Moments */}
                              {project.content_analysis.keyMoments.length > 0 && (
                                <Card className="border-primary/20 mt-4">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg bg-yellow-500/10">
                                        <IconClock className="h-4 w-4 text-yellow-600" />
                                      </div>
                                      Key Moments
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      {project.content_analysis.keyMoments.map((moment: { timestamp: number; description: string }, idx: number) => (
                                        <div 
                                          key={idx}
                                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                          onClick={() => {
                                            if (videoRef.current) {
                                              videoRef.current.currentTime = moment.timestamp
                                              videoRef.current.play()
                                              // Scroll to video if needed
                                              videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                            }
                                          }}
                                        >
                                          <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium text-primary">
                                            {Math.floor(moment.timestamp / 60)}:{String(Math.floor(moment.timestamp % 60)).padStart(2, '0')}
                                          </div>
                                          <p className="text-sm flex-1">{moment.description}</p>
                                          <IconPlayerPlay className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Content Suggestions */}
                              {project.content_analysis.contentSuggestions && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                  {/* Blog Ideas */}
                                  <Card className="border-blue-500/20 bg-blue-500/5">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <IconArticle className="h-4 w-4 text-blue-500" />
                                        Blog Ideas
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="space-y-1 text-sm">
                                        {project.content_analysis.contentSuggestions.blogPostIdeas.map((idea: string, idx: number) => (
                                          <li key={idx} className="text-muted-foreground">• {idea}</li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>

                                  {/* Social Hooks */}
                                  <Card className="border-purple-500/20 bg-purple-500/5">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <IconShare2 className="h-4 w-4 text-purple-500" />
                                        Social Hooks
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="space-y-1 text-sm">
                                        {project.content_analysis.contentSuggestions.socialMediaHooks.map((hook: string, idx: number) => (
                                          <li key={idx} className="text-muted-foreground">• {hook}</li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>

                                  {/* Short Form Ideas */}
                                  <Card className="border-green-500/20 bg-green-500/5">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <IconVideo className="h-4 w-4 text-green-500" />
                                        Short Form Ideas
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="space-y-1 text-sm">
                                        {project.content_analysis.contentSuggestions.shortFormContent.map((idea: string, idx: number) => (
                                          <li key={idx} className="text-muted-foreground">• {idea}</li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
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
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <IconDots className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleEditBlog(post.id)}>
                                        <IconEdit className="h-4 w-4 mr-2" />
                                        Edit Post
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDuplicateBlog(post)}>
                                        <IconClipboardCopy className="h-4 w-4 mr-2" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => copyToClipboard(post.content, post.id)}>
                                        <IconCopy className="h-4 w-4 mr-2" />
                                        Copy Content
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => exportBlogAsMarkdown(post)}>
                                        <IconDownload className="h-4 w-4 mr-2" />
                                        Export as Markdown
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleDeleteBlog(post.id, post.title)}
                                      >
                                        <IconTrash className="h-4 w-4 mr-2" />
                                        Delete Post
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                            onClick: () => setShowBlogDialog(true)
                          }}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="social" className="mt-0">
                      <div className="space-y-6">
                        {/* Header with action buttons */}
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">Social Media Content</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Ready-to-publish posts and graphics for all platforms
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => setActiveTab('graphics')}
                              variant="outline"
                              size="sm"
                            >
                              <IconPhoto className="h-4 w-4 mr-2" />
                              Create Graphics
                            </Button>
                            {(project.folders.social.length > 0 || (project.folders.images?.length || 0) > 0) && (
                              <Button 
                                onClick={() => router.push(`/projects/${projectId}/publish`)}
                                size="sm"
                              >
                                <IconRocket className="h-4 w-4 mr-2" />
                                Publish All
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Combined Social Content */}
                        {(project.folders.social.length > 0 || (project.folders.images?.length || 0) > 0) ? (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {/* Social Posts */}
                            {project.folders.social.map((post: SocialPost) => {
                              const PlatformIcon = platformIcons[post.platform]
                              const platformColor = platformColors[post.platform]
                              
                              return (
                                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <PlatformIcon className={cn("h-5 w-5", platformColor)} />
                                        <Badge variant="outline">{post.platform}</Badge>
                                        <Badge variant="secondary">Text Post</Badge>
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
                                    <p className="text-sm whitespace-pre-wrap line-clamp-4">{post.content}</p>
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

                            {/* AI-Generated Images */}
                            {project.folders.images?.map((image: any) => (
                              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square relative bg-muted">
                                  <img
                                    src={image.url}
                                    alt={image.prompt}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 left-2 flex gap-2">
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                      AI Image
                                    </Badge>
                                    {image.type === 'carousel-slide' && (
                                      <Badge variant="secondary">
                                        Slide {image.slideNumber}/{image.totalSlides}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <CardContent className="p-4">
                                  <p className="text-sm font-medium line-clamp-2 mb-2">
                                    {image.prompt}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                    <Badge variant="outline">{image.style}</Badge>
                                    <span>•</span>
                                    <span>{image.size}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => {
                                        const link = document.createElement('a')
                                        link.href = image.url
                                        link.download = `ai-image-${image.id}.png`
                                        link.click()
                                      }}
                                    >
                                      <IconDownload className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => copyToClipboard(image.url, image.id)}
                                    >
                                      {copiedId === image.id ? (
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
                        ) : (
                          <EmptyState
                            icon={<IconShare2 className="h-16 w-16 text-primary/50" />}
                            title="No social content yet"
                            description="Create posts and graphics for your social media channels"
                            action={{
                              label: "Create Graphics",
                              onClick: () => setActiveTab('graphics')
                            }}
                          />
                        )}

                        {/* Summary Stats */}
                        {(project.folders.social.length > 0 || (project.folders.images?.length || 0) > 0) && (
                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Ready to publish</p>
                                  <p className="text-2xl font-bold">
                                    {project.folders.social.length + (project.folders.images?.length || 0)} items
                                  </p>
                                </div>
                                <div className="flex gap-4 text-sm">
                                  <div className="text-center">
                                    <p className="font-bold">{project.folders.social.length}</p>
                                    <p className="text-muted-foreground">Text Posts</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold">{project.folders.images?.length || 0}</p>
                                    <p className="text-muted-foreground">Images</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="graphics" className="mt-0">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">AI Social Graphics</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Generate stunning visuals for social media using AI
                            </p>
                          </div>
                          {!loadingSuggestions && imageSuggestions.length === 0 && (
                            <Button 
                              onClick={loadImageSuggestions}
                              disabled={!project.content_analysis?.keywords}
                            >
                              <IconWand className="h-4 w-4 mr-2" />
                              Get AI Suggestions
                            </Button>
                          )}
                        </div>

                        {/* Image Generation Controls */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Create New Image</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="prompt">Prompt</Label>
                              <Textarea
                                id="prompt"
                                placeholder="Describe the image you want to generate..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="style">Style</Label>
                                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                                  <SelectTrigger id="style">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {predefinedStyles.map(style => (
                                      <SelectItem key={style.id} value={style.id}>
                                        {style.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="quality">Quality</Label>
                                <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                                  <SelectTrigger id="quality">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low (Fast)</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High (Slow)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="size">Size</Label>
                                <Select value={selectedSize} onValueChange={setSelectedSize}>
                                  <SelectTrigger id="size">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1024x1024">Square (1:1)</SelectItem>
                                    <SelectItem value="1536x1024">Landscape (3:2)</SelectItem>
                                    <SelectItem value="1024x1536">Portrait (2:3)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Button
                              onClick={handleGenerateCustom}
                              disabled={generatingImage || !customPrompt.trim()}
                              className="w-full"
                            >
                              {generatingImage ? (
                                <>
                                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating... {streamingProgress > 0 && `(${streamingProgress}%)`}
                                </>
                              ) : (
                                <>
                                  <IconSparkles className="h-4 w-4 mr-2" />
                                  Generate Image
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* AI Suggestions */}
                        {loadingSuggestions ? (
                          <Card>
                            <CardContent className="p-12 text-center">
                              <IconLoader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                              <p className="text-muted-foreground">Analyzing your content...</p>
                            </CardContent>
                          </Card>
                        ) : imageSuggestions.length > 0 ? (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                              <IconSticker className="h-5 w-5 text-primary" />
                              AI Suggestions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {imageSuggestions.map((suggestion) => {
                                const typeConfig = {
                                  quote: { 
                                    icon: IconQuote, 
                                    color: 'from-purple-500 to-pink-500',
                                    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
                                    iconColor: 'text-purple-600 dark:text-purple-400',
                                    emoji: '💬'
                                  },
                                  visual: { 
                                    icon: IconEye, 
                                    color: 'from-blue-500 to-cyan-500',
                                    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
                                    iconColor: 'text-blue-600 dark:text-blue-400',
                                    emoji: '🎨'
                                  },
                                  carousel: { 
                                    icon: IconLayoutGrid, 
                                    color: 'from-green-500 to-emerald-500',
                                    bgColor: 'bg-green-100 dark:bg-green-900/20',
                                    iconColor: 'text-green-600 dark:text-green-400',
                                    emoji: '🎠'
                                  },
                                  infographic: { 
                                    icon: IconInfoCircle, 
                                    color: 'from-amber-500 to-orange-500',
                                    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
                                    iconColor: 'text-amber-600 dark:text-amber-400',
                                    emoji: '📊'
                                  },
                                  thumbnail: { 
                                    icon: IconCamera, 
                                    color: 'from-red-500 to-rose-500',
                                    bgColor: 'bg-red-100 dark:bg-red-900/20',
                                    iconColor: 'text-red-600 dark:text-red-400',
                                    emoji: '🎬'
                                  }
                                }[suggestion.type] || { 
                                  icon: IconPhoto, 
                                  color: 'from-gray-500 to-gray-600',
                                  bgColor: 'bg-gray-100 dark:bg-gray-900/20',
                                  iconColor: 'text-gray-600 dark:text-gray-400',
                                  emoji: '🖼️'
                                }
                                
                                const TypeIcon = typeConfig.icon
                                
                                return (
                                  <Card 
                                    key={suggestion.id}
                                    className={cn(
                                      "cursor-pointer transition-all hover:shadow-xl overflow-hidden group",
                                      selectedSuggestion?.id === suggestion.id && "ring-2 ring-primary"
                                    )}
                                    onClick={() => handleGenerateFromSuggestion(suggestion)}
                                  >
                                    <div className={cn(
                                      "h-1 bg-gradient-to-r",
                                      typeConfig.color
                                    )} />
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "p-2 rounded-lg",
                                            typeConfig.bgColor
                                          )}>
                                            <TypeIcon className={cn("h-5 w-5", typeConfig.iconColor)} />
                                          </div>
                                          <div>
                                            <Badge variant="secondary" className="font-semibold capitalize">
                                              {typeConfig.emoji} {suggestion.type}
                                            </Badge>
                                          </div>
                                        </div>
                                        {suggestion.type === 'carousel' && (
                                          <Select 
                                            value={(carouselSlides[suggestion.id] || 3).toString()}
                                            onValueChange={(value) => {
                                              setCarouselSlides(prev => ({ ...prev, [suggestion.id]: parseInt(value) }))
                                            }}
                                          >
                                            <SelectTrigger className="h-7 w-20" onClick={(e) => e.stopPropagation()}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="3">3 slides</SelectItem>
                                              <SelectItem value="5">5 slides</SelectItem>
                                              <SelectItem value="7">7 slides</SelectItem>
                                              <SelectItem value="10">10 slides</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <p className="text-sm font-semibold line-clamp-2">{suggestion.description}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                        "{suggestion.prompt}"
                                      </p>
                                      <div className="flex items-center justify-between pt-2">
                                        <Badge variant="outline" className="text-xs">
                                          <IconWand className="h-3 w-3 mr-1" />
                                          {suggestion.style}
                                        </Badge>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                        >
                                          Generate
                                          <IconSparkles className="h-3 w-3 ml-1" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}

                        {/* Generated Images Gallery */}
                        {generatedImages.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                              <IconPhoto className="h-5 w-5 text-primary" />
                              Generated Images
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(() => {
                                // Group images by carousel
                                const carousels = new Map<string, any[]>()
                                const singleImages: any[] = []
                                
                                generatedImages.forEach(image => {
                                  if (image.carouselId) {
                                    const existing = carousels.get(image.carouselId) || []
                                    carousels.set(image.carouselId, [...existing, image])
                                  } else {
                                    singleImages.push(image)
                                  }
                                })
                                
                                return (
                                  <>
                                    {/* Render carousels */}
                                    {Array.from(carousels.entries()).map(([carouselId, images]) => (
                                      <ImageCarousel
                                        key={carouselId}
                                        carouselId={carouselId}
                                        images={images}
                                        onCopy={copyToClipboard}
                                        copiedId={copiedId}
                                      />
                                    ))}
                                    
                                    {/* Render single images */}
                                    {singleImages.map((image) => (
                                      <Card key={image.id} className="overflow-hidden">
                                        <div className="aspect-square relative bg-muted">
                                          <img
                                            src={image.url}
                                            alt={image.prompt}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <CardContent className="p-4">
                                          <p className="text-sm font-medium line-clamp-2 mb-2">
                                            {image.prompt}
                                          </p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline">{image.style}</Badge>
                                            <span>•</span>
                                            <span>{image.size}</span>
                                            <span>•</span>
                                            <span>{image.quality}</span>
                                          </div>
                                          <div className="mt-3 flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                const link = document.createElement('a')
                                                link.href = image.url
                                                link.download = `ai-image-${image.id}.png`
                                                link.click()
                                              }}
                                            >
                                              <IconDownload className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => copyToClipboard(image.url, image.id)}
                                            >
                                              {copiedId === image.id ? (
                                                <IconCheck className="h-4 w-4 text-green-600" />
                                              ) : (
                                                <IconCopy className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {!loadingSuggestions && imageSuggestions.length === 0 && generatedImages.length === 0 && (
                          <EmptyState
                            icon={<IconSparkles className="h-16 w-16 text-primary/50" />}
                            title="No images yet"
                            description="Get AI suggestions or create your own custom images"
                            action={project.content_analysis?.keywords ? {
                              label: "Get AI Suggestions",
                              onClick: loadImageSuggestions
                            } : undefined}
                          />
                        )}
                      </div>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </Card>
          </div>

          {/* Enhanced Transcription Panel - Right Side */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 h-[calc(100vh-120px)] overflow-hidden">
              {project.transcription ? (
                <div className="h-full">
                  <EnhancedTranscriptEditor
                    segments={project.transcription.segments.map(s => ({
                      start: s.start,
                      end: s.end,
                      text: s.text
                    }))}
                    onSegmentsChange={(updatedSegments) => {
                      const updatedTranscription = {
                        ...project.transcription!,
                        segments: project.transcription!.segments.map((originalSegment, index) => ({
                          ...originalSegment,
                          text: updatedSegments[index]?.text || originalSegment.text,
                          start: updatedSegments[index]?.start || originalSegment.start,
                          end: updatedSegments[index]?.end || originalSegment.end
                        })),
                        text: updatedSegments.map(s => s.text).join(' ')
                      }
                      setProject(prev => prev ? { ...prev, transcription: updatedTranscription } : null)
                    }}
                    projectId={projectId}
                    videoUrl={project.video_url}
                    videoDuration={project.metadata?.duration}
                    onSegmentClick={(segment) => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = segment.start
                        videoRef.current.play()
                      }
                    }}
                    onVideoUrlUpdate={(newVideoUrl, vttUrl) => {
                      // Update the video element
                      if (videoRef.current && newVideoUrl && newVideoUrl !== project.video_url) {
                        const currentTime = videoRef.current.currentTime
                        const wasPlaying = !videoRef.current.paused
                        
                        videoRef.current.src = newVideoUrl
                        videoRef.current.load()
                        
                        videoRef.current.addEventListener('loadeddata', () => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = currentTime
                            if (wasPlaying) videoRef.current.play()
                          }
                        }, { once: true })
                        
                        // Update project video URL
                        setProject(prev => prev ? { ...prev, video_url: newVideoUrl } : null)
                      }
                      
                      // Add subtitle track if VTT URL is provided
                      if (videoRef.current && vttUrl) {
                        const existingTracks = videoRef.current.querySelectorAll('track')
                        existingTracks.forEach(track => track.remove())
                        
                        const track = document.createElement('track')
                        track.kind = 'subtitles'
                        track.label = 'English'
                        track.srclang = 'en'
                        track.src = vttUrl
                        track.default = true
                        videoRef.current.appendChild(track)
                      }
                      
                      // Mark as having subtitles
                      setHasSubtitles(true)
                      
                      toast.success("Subtitles applied! Your long-form content is ready.")
                    }}
                  />
                </div>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={<IconFileText className="h-12 w-12 text-primary/50" />}
                    title="No transcription"
                    description="Transcription will appear here once processing is complete"
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
                            <IconVideoOff className="h-16 w-16 mx-auto mb-2 text-gray-600" />
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
                            <span className="text-3xl font-bold">{Math.round((selectedClip.score || 0) * 100)}</span>
                            <span className="text-lg text-muted-foreground">/100</span>
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
                        <div className="relative h-2 bg-black/20 rounded-full overflow-hidden">
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

      {/* Publishing Workflow Modal */}
      {showPublishingWorkflow && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-5xl w-full">
            <PublishingWorkflow
              project={project}
              onPublish={handlePublishContent}
              onEditBlog={handleEditBlog}
              className="shadow-2xl"
            />
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => setShowPublishingWorkflow(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Blog Generation Dialog */}
      <BlogGenerationDialog 
        isOpen={showBlogDialog}
        onClose={() => setShowBlogDialog(false)}
        onGenerate={handleGenerateBlog}
        isGenerating={isGeneratingBlog}
      />
    </div>
  )
} 