"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useClerkUser } from "@/hooks/use-clerk-user"
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
  IconPlus,
  IconShare,
  IconCalendar,
  IconUser,
  IconAlertCircle,
  IconFilePlus,
  IconBrandMedium,
  IconMail,
  IconMessageCircle,
  IconBrandReddit,
  IconLayoutGridAdd,
  IconChevronDown,
  IconHash,
  IconUsers,
} from "@tabler/icons-react"
import { CheckCircle2 } from "lucide-react"
import { ProjectService } from "@/lib/services"
import { Project, ClipData, BlogPost, SocialPost, TranscriptionData } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { formatDuration, generateVideoThumbnailFromUrl } from "@/lib/video-utils"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { TranscriptionService } from "@/lib/transcription-service"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PublishingWorkflow } from "@/components/publishing-workflow"
import { EnhancedPublishingWorkflow } from "@/components/enhanced-publishing-workflow"
import { useProject } from "@/hooks/use-project"
import { VideoErrorState } from "@/components/video-error-state"
import { TranscriptModal } from "@/components/transcript-modal"
import { ErrorBoundary } from "@/components/error-boundary"


import { EnhancedTranscriptEditor } from "@/components/enhanced-transcript-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { predefinedStyles, type ImageSuggestion } from "@/lib/ai-image-service"
import { BlogGenerationDialog, type BlogGenerationOptions } from "@/components/blog-generation-dialog"
import { ImageCarousel } from "@/components/image-carousel"
import { ThumbnailCreatorV2 } from "@/components/thumbnail-creator-v2"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { EnhancedContentStager } from "@/components/staging/enhanced-content-stager"
import { StagingReview } from "@/components/staging/staging-review"
import { StagingService } from "@/lib/staging/staging-service"
import { PersonaManager } from "@/components/persona-manager"
import { StagingSessionsService } from "@/lib/staging/staging-sessions-service"
import type { StagedContent } from "@/lib/staging/staging-service"
import { ThreadGeneratorComponent } from "@/components/thread-generator"
import { VideoChapters } from "@/components/video-chapters"
import { QuoteCardsGenerator } from "@/components/quote-cards-generator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import type { Platform } from "@/lib/social/types"
import { PersonaSelector } from "@/components/persona-selector"
import type { Persona } from "@/lib/types/persona"
import { PersonaConfigureDialog } from "@/components/persona-configure-dialog"
import { SocialGraphicsGenerator } from "@/components/social-graphics-generator"
import { SocialGraphicsDisplay } from "@/components/social-graphics-display"
import { UserGuideTooltip } from "@/components/user-guide-tooltip"
import { ProjectPageSkeleton } from "@/components/loading-skeleton"


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

function ProjectDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useClerkUser()
  const projectId = params.id as string
  const videoRef = useRef<HTMLVideoElement>(null)
  const transcriptionScrollRef = useRef<HTMLDivElement>(null)
  
  const { project, loading, error, reload: loadProject, setProject } = useProject(projectId)
  
  // Access control check
  const isOwner = project?.user_id === user?.id
  const hasAccess = !project?.user_id || isOwner // Allow access if no user_id (legacy) or is owner
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false)
  const [showBlogDialog, setShowBlogDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isExportingClips, setIsExportingClips] = useState(false)
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [expandedBlogId, setExpandedBlogId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState<string>("realistic")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({})
  const [showTranscriptModal, setShowTranscriptModal] = useState(false)
  const [selectedTranscript, setSelectedTranscript] = useState<string>("")
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  
  // Image generation states
  const [selectedQuality, setSelectedQuality] = useState("medium")
  const [selectedSize, setSelectedSize] = useState("1024x1024")
  const [streamingProgress, setStreamingProgress] = useState(0)
  const [selectedSuggestion, setSelectedSuggestion] = useState<ImageSuggestion | null>(null)
  const [carouselSlides, setCarouselSlides] = useState<{ [key: string]: number }>({})
  const [hasSubtitles, setHasSubtitles] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [defaultThumbnail, setDefaultThumbnail] = useState<string>("")
  const [usePersonaForGraphics, setUsePersonaForGraphics] = useState(true)
  
  const [isActivelyProcessing, setIsActivelyProcessing] = useState(false)
  
  // Content Selection Dialog States
  const [showContentSelectionDialog, setShowContentSelectionDialog] = useState(false)
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set())
  const [contentPreviewId, setContentPreviewId] = useState<string | null>(null)
  
  // Thread Generator State
  const [threadGeneratorState, setThreadGeneratorState] = useState<{
    isOpen: boolean
    content: string
    title: string
  }>({ isOpen: false, content: '', title: '' })

  // Persona state
  const [selectedPersona, setSelectedPersona] = useState<any>(null)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>(undefined)
  const [loadingPersona, setLoadingPersona] = useState(false)

  // Project loading is handled by useProject hook
  
  // Generate default thumbnail from video if no thumbnail exists
  useEffect(() => {
    async function generateDefaultThumbnail() {
      if (project?.video_url && !project.thumbnail_url && !defaultThumbnail) {
        try {
          const thumbnail = await generateVideoThumbnailFromUrl(project.video_url, 2)
          setDefaultThumbnail(thumbnail)
        } catch (error) {
          console.error("Failed to generate default thumbnail:", error)
        }
      }
    }
    
    generateDefaultThumbnail()
  }, [project?.video_url, project?.thumbnail_url, defaultThumbnail])
  
  // Update actively processing state based on clips task
  useEffect(() => {
    if (project) {
      const clipsTask = project.tasks.find(t => t.type === 'clips')
      const isClipsProcessing = clipsTask && clipsTask.status === 'processing'
      setIsActivelyProcessing(isClipsProcessing || false)
    }
  }, [project])
  
  // Load persona from project or local storage
  useEffect(() => {
    async function loadPersona() {
      if (project && !selectedPersona) {
        setLoadingPersona(true)
        try {
          // First check project metadata
          const selectedId = (project as any).selected_persona_id || (project.metadata as any)?.currentPersona?.id
          if (selectedId) {
            const personas = JSON.parse(localStorage.getItem('personas') || '[]')
            const persona = personas.find((p: any) => p.id === selectedId)
            if (persona) {
              setSelectedPersona(persona)
              setSelectedPersonaId(persona.id)
            }
          }
        } catch (error) {
          console.error('Failed to load persona:', error)
        } finally {
          setLoadingPersona(false)
        }
      }
    }
    loadPersona()
  }, [project])
  

  
  // Update modal duration when selected clip changes
  useEffect(() => {
    if (showVideoModal && selectedClip?.exportUrl) {
      const video = document.createElement('video')
      video.src = selectedClip.exportUrl
      
      const handleMetadata = () => {
        const durationElement = document.querySelector(`[data-modal-clip-duration="${selectedClip.id}"]`)
        if (durationElement && video.duration) {
          durationElement.textContent = formatDuration(video.duration)
        }
      }
      
      video.addEventListener('loadedmetadata', handleMetadata)
      video.load()
      
      // Cleanup
      return () => {
        video.removeEventListener('loadedmetadata', handleMetadata)
        video.src = '' // Release video resources
      }
    }
  }, [showVideoModal, selectedClip])

  // Load generated images when graphics tab is active
  useEffect(() => {
    if (activeTab === 'graphics' && project?.folders?.images) {
      setGeneratedImages(project.folders.images)
    }
  }, [activeTab, project?.folders?.images])
  
  // Update durations after clips tab is active
  useEffect(() => {
    if (activeTab === 'clips' && project?.folders?.clips) {
      // Give DOM time to render
      const videos: HTMLVideoElement[] = []
      const timer = setTimeout(() => {
        project.folders.clips.forEach((clip: ClipData) => {
          if (clip.exportUrl) {
            const durationEl = document.querySelector(`[data-duration-id="${clip.id}"]`)
            if (durationEl && durationEl.textContent === '--:--') {
              const video = document.createElement('video')
              videos.push(video) // Track for cleanup
              video.src = clip.exportUrl
              video.crossOrigin = 'anonymous'
              
              const handleMetadata = () => {
                if (video.duration && !isNaN(video.duration)) {
                  durationEl.textContent = formatDuration(video.duration)
                } else {
                  durationEl.textContent = '0:00'
                }
              }
              
              const handleError = () => {
                durationEl.textContent = '0:00'
              }
              
              video.addEventListener('loadedmetadata', handleMetadata)
              video.addEventListener('error', handleError)
              
              // Force load
              video.load()
            }
          }
        })
      }, 300)
      
      return () => {
        clearTimeout(timer)
        // Clean up all video elements
        videos.forEach(video => {
          video.src = ''
          video.load() // Reset the video element
        })
      }
    }
  }, [activeTab, project?.folders?.clips])

  // Auto-redirect if processing and transcription not complete
  useEffect(() => {
    if (project) {
      const transcriptionTask = project.tasks.find(t => t.type === 'transcription')
      const isTranscriptionComplete = transcriptionTask?.status === 'completed' || 
        (project.transcription && project.transcription.text)
      
      // Only redirect if transcription is not complete
      if (project.status === 'processing' && !isTranscriptionComplete) {
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
      if (!videoRef.current) return;
      const time = videoRef.current.currentTime
      
      const activeSegment = TranscriptionService.getSegmentAtTime(
        project.transcription!.segments,
        time
      )
      
      if (activeSegment && activeSegment.id !== activeSegmentId) {
        setActiveSegmentId(activeSegment.id)
        
        // Auto-scroll to active segment with smooth animation
        if (transcriptionScrollRef.current) {
          const element = document.getElementById(`segment-${activeSegment.id}`)
          if (element) {
            // Calculate scroll position to center the segment
            const containerRect = transcriptionScrollRef.current.getBoundingClientRect()
            const elementRect = element.getBoundingClientRect()
            const scrollTop = transcriptionScrollRef.current.scrollTop
            const elementTop = elementRect.top - containerRect.top + scrollTop
            const scrollPosition = elementTop - (containerRect.height / 2) + (elementRect.height / 2)
            
            // Smooth scroll to position
            transcriptionScrollRef.current.scrollTo({
              top: Math.max(0, scrollPosition),
              behavior: 'smooth'
            })
          }
        }
      }
    }

    const video = videoRef.current;
    video.addEventListener('timeupdate', handleTimeUpdate)
    
    // Also handle seeking
    video.addEventListener('seeked', handleTimeUpdate)
    
    return () => {
      video?.removeEventListener('timeupdate', handleTimeUpdate)
      video?.removeEventListener('seeked', handleTimeUpdate)
    }
  }, [project?.transcription, activeSegmentId])

  // loadProject is provided by useProject hook
  
  // Handle project not found error
  useEffect(() => {
    if (error === "Project not found" && !loading) {
      router.push("/projects")
    }
  }, [error, loading, router])

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
    // Save selected content to session storage to pass to staging page
    sessionStorage.setItem('selectedContent', JSON.stringify(selectedContent))
    router.push(`/projects/${projectId}/stage`)
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
      const duplicatedPost: BlogPost = {
        ...post,
        id: `blog_${Date.now()}_copy`,
        title: `${post.title} (Copy)`,
        createdAt: new Date().toISOString()
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
    setIsGeneratingImage(true)
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
        
        // Add persona photos if available
        if (selectedPersona && selectedPersona.photos.length > 0) {
          params.append('hasPersona', 'true')
          params.append('personaName', selectedPersona.name)
        }
        
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
          setIsGeneratingImage(false)
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
            n: 1,
            // Include persona photos if enabled and available
            personalPhotos: usePersonaForGraphics && selectedPersona?.photos ? 
              selectedPersona.photos.map((photo: any) => photo.url) : [],
            personaName: usePersonaForGraphics ? selectedPersona?.name : undefined
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
      setIsGeneratingImage(false)
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
      setIsGeneratingImage(true)
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
            // Include persona photos if enabled and available
            personalPhotos: usePersonaForGraphics && selectedPersona?.photos ? 
              selectedPersona.photos.map((photo: any) => photo.url) : [],
            personaName: usePersonaForGraphics ? selectedPersona?.name : undefined,
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
        setIsGeneratingImage(false)
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



  if (loading || loadingPersona) {
    return <ProjectPageSkeleton />
  }

  if (!project) return null

  // Access denied check
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
              <IconAlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/projects')}
              className="w-full"
            >
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = ProjectService.getProjectStats(project)
  const totalImages = project.folders.images?.length || 0
  const progress = ProjectService.calculateProjectProgress(project)
  
  // Check if transcription is complete
  const transcriptionTask = project.tasks.find(t => t.type === 'transcription')
  const isTranscriptionComplete = transcriptionTask?.status === 'completed' || 
    (project.transcription && project.transcription.text)
  
  // Only show processing overlay if transcription is not complete
  const isProcessing = project.status === 'processing' && !isTranscriptionComplete
  const searchResults = searchQuery && project.transcription
    ? TranscriptionService.searchTranscription(project.transcription.segments, searchQuery)
    : []
  const displaySegments = searchQuery ? searchResults : (project.transcription?.segments || [])
  const clipsTask = project.tasks.find(t => t.type === 'clips')

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
              <CardTitle className="text-2xl">Transcription Processing</CardTitle>
              <CardDescription className="text-base">
                AI is analyzing your video. Redirecting to processing view...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
      
      <div className="relative mx-auto max-w-[1920px] px-4 py-6 animate-in">
        {/* Enhanced Header with Better Organization */}
        <div className="mb-8 space-y-6">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/projects')}
              className="gap-2 hover:bg-primary/10"
            >
              <IconArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">All Projects</span>
            </Button>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigator.share({ 
                  title: project.title, 
                  text: `Check out my video: ${project.title}`,
                  url: window.location.href 
                }).catch(() => {
                  // Fallback to copy URL
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Link copied to clipboard')
                })}
                className="hover:bg-primary/10"
              >
                <IconShare className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <IconDots className="h-4 w-4" />
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push(`/projects/${projectId}/settings`)}>
                    <IconSettings className="h-4 w-4 mr-2" />
                    Project Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const projectData = JSON.stringify(project, null, 2)
                    const blob = new Blob([projectData], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${project.title}-data.json`
                    a.click()
                    URL.revokeObjectURL(url)
                    toast.success('Project data exported')
                  }}>
                    <IconFileDownload className="h-4 w-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)} 
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Project Header with Enhanced Info */}
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 space-y-4">
                {/* Title and Status */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 flex-wrap">
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    {project.title}
                  </h1>
                    <div className="flex items-center gap-2">
                      {isActivelyProcessing && (
                        <Badge variant="secondary" className="animate-pulse">
                          <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing
                        </Badge>
                      )}
                      <Badge 
                        variant={project.status === 'published' ? 'default' : 'secondary'}
                        className="font-medium"
                      >
                        {project.status === 'published' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : 'Draft'}
                  </Badge>
                      {project.folders.clips.length > 0 && (
                        <Badge variant="outline" className="font-medium">
                          {project.folders.clips.length} Clips
                        </Badge>
                      )}
                </div>
                  </div>
                  
                  {/* Persona Selector */}
                  <div className="flex items-center gap-3">
                    <PersonaSelector
                      userId={user?.id || ''}
                      projectId={projectId}
                      selectedPersonaId={selectedPersonaId}
                      onSelect={(persona: Persona | null) => {
                        setSelectedPersona(persona)
                        setSelectedPersonaId(persona?.id || undefined)
                      }}
                      showCreateButton={true}
                      allowGlobalCreation={true}
                    />
                    {selectedPersona && (
                      <Badge variant="secondary" className="gap-1">
                        <IconUser className="h-3 w-3" />
                        AI will use {selectedPersona.name}'s photos
                      </Badge>
                    )}
                  </div>
                  
                {project.description && (
                    <p className="text-muted-foreground text-base lg:text-lg max-w-3xl">
                      {project.description}
                    </p>
                )}
                </div>
                
                {/* Project Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <IconClock className="h-4 w-4" />
                    <span className="font-medium">{formatDuration(project.metadata.duration)}</span>
                  </div>
                  
                  <div className="h-4 w-px bg-border" />
                  
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    <span>{new Date(project.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  
                  {project.transcription && (
                    <>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <IconLanguage className="h-4 w-4" />
                        <span className="font-medium">{project.transcription.language.toUpperCase()}</span>
                      </div>
                    </>
                  )}
                  
                  {project.metadata?.size && (
                    <>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <IconFileText className="h-4 w-4" />
                        <span>{(project.metadata.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Primary Actions - Better Organized */}
              <div className="flex flex-col gap-3 min-w-[280px]">
                {/* Main CTA */}
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  onClick={() => setShowContentSelectionDialog(true)}
                  disabled={stats.totalClips === 0 && stats.totalBlogs === 0 && totalImages === 0}
                >
                  <IconRocket className="h-5 w-5 mr-2" />
                  Publish Content
                  {(stats.totalClips + stats.totalBlogs + totalImages > 0) && (
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                      {stats.totalClips + stats.totalBlogs + totalImages}
                    </Badge>
                  )}
                </Button>
                
                {/* Processing View Link - Show if clips are still processing */}
                {(() => {
                  const clipsTask = project.tasks.find(t => t.type === 'clips')
                  const areClipsProcessing = clipsTask && 
                    clipsTask.status === 'processing' && clipsTask.progress < 100
                  
                  if (areClipsProcessing) {
                    return (
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => router.push(`/studio/processing/${projectId}`)}
                        className="w-full justify-center bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border-primary/20"
                      >
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Clips Processing ({clipsTask.progress}%)
                      </Button>
                    )
                  }
                  
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/studio/processing/${projectId}`)}
                      className="w-full justify-center text-muted-foreground hover:text-primary"
                    >
                      <IconWand className="h-4 w-4 mr-2" />
                      View Processing Details
                    </Button>
                  )
                })()}
                
                {/* Configure Persona Button */}
                                    <UserGuideTooltip
                      id="configure-persona"
                      title="Add your persona"
                      content="Create a professional persona to feature in all your AI-generated content"
                      side="left"
                      delay={2000}
                    >
                      <PersonaConfigureDialog
                        onPersonaCreated={(persona) => {
                          setSelectedPersona(persona)
                          toast.success(`Persona "${persona.name}" created successfully!`)
                        }}
                      >
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full justify-center gap-2"
                        >
                          <IconUsers className="h-4 w-4" />
                          Configure Persona
                        </Button>
                      </PersonaConfigureDialog>
                    </UserGuideTooltip>
              </div>
            </div>
          </div>

          {/* Enhanced Content Generation Progress Card */}
          <Card className="border-2 border-primary/10 bg-gradient-to-br from-background via-primary/5 to-accent/5 shadow-xl">
            <CardContent className="p-6">
              {/* Header with Progress */}
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                    <IconSparkles className="h-5 w-5 text-primary" />
                    </div>
                    AI Content Generation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Automated content creation from your video
                  </p>
                </div>
                
                {/* Progress Circle */}
                <div className="relative">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted-foreground/20"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(stats.overallProgress / 100) * 226} 226`}
                      className="text-primary transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{stats.overallProgress}%</span>
                  </div>
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="space-y-4 mb-6">
                {/* Clips Processing Status */}
                {clipsTask && clipsTask.status === 'processing' && (
                  <Alert className="border-orange-500/20 bg-orange-500/10">
                    <IconLoader2 className="h-4 w-4 animate-spin text-orange-600" />
                    <AlertTitle className="text-orange-900 dark:text-orange-200">Clips Processing</AlertTitle>
                    <AlertDescription className="text-orange-800 dark:text-orange-300">
                      AI is generating short-form clips from your video. This page will auto-refresh.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Ready Status */}
                {hasSubtitles ? (
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900 dark:text-green-200">Long-form Ready</AlertTitle>
                    <AlertDescription className="text-green-800 dark:text-green-300">
                      Your video has subtitles applied and is ready for YouTube publishing.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-blue-500/20 bg-blue-500/10">
                    <IconInfoCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900 dark:text-blue-200">Subtitle Enhancement Available</AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-300">
                      Apply subtitles to make your video accessible and boost engagement.
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto p-0 ml-2 text-blue-700 dark:text-blue-400"
                        onClick={() => router.push(`/studio/processing/${projectId}`)}
                      >
                        Apply now →
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Content Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Transcript */}
                <Card className={cn(
                  "border transition-all cursor-pointer hover:shadow-md",
                  project.transcription 
                    ? "border-green-500/20 bg-green-500/5 hover:border-green-500/40" 
                    : "border-muted"
                )}
                onClick={() => project.transcription && setActiveTab('overview')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                        project.transcription ? "bg-green-500/20" : "bg-muted"
                  )}>
                    <IconFileText className={cn(
                          "h-4 w-4",
                          project.transcription ? "text-green-600" : "text-muted-foreground"
                    )} />
                  </div>
                      {project.transcription && (
                        <IconCheck className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">Transcript</p>
                    <p className="text-xs text-muted-foreground">
                      {project.transcription ? "Complete" : "Processing"}
                    </p>
                  </CardContent>
                </Card>
                
                {/* Clips */}
                <Card className={cn(
                  "border transition-all cursor-pointer hover:shadow-md",
                  stats.totalClips > 0 
                    ? "border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40" 
                    : clipsTask?.status === 'processing'
                    ? "border-orange-500/20 bg-orange-500/5"
                    : "border-muted"
                )}
                onClick={() => stats.totalClips > 0 && setActiveTab('clips')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                        stats.totalClips > 0 ? "bg-purple-500/20" : 
                        clipsTask?.status === 'processing' ? "bg-orange-500/20" : "bg-muted"
                  )}>
                    <IconScissors className={cn(
                          "h-4 w-4",
                          stats.totalClips > 0 ? "text-purple-600" : 
                          clipsTask?.status === 'processing' ? "text-orange-600 animate-pulse" : 
                          "text-muted-foreground"
                    )} />
                  </div>
                      {stats.totalClips > 0 && (
                        <span className="text-lg font-bold text-purple-600">{stats.totalClips}</span>
                      )}
                    </div>
                    <p className="font-semibold text-sm">Video Clips</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalClips > 0 ? "Ready" : 
                       clipsTask?.status === 'processing' ? "Generating..." : "Not started"}
                    </p>
                  </CardContent>
                </Card>
                
                {/* Blog Posts */}
                <Card className={cn(
                  "border transition-all cursor-pointer hover:shadow-md",
                  stats.totalBlogs > 0 
                    ? "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40" 
                    : "border-muted hover:border-primary/20"
                )}
                onClick={() => stats.totalBlogs > 0 ? setActiveTab('blog') : setShowBlogDialog(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                        stats.totalBlogs > 0 ? "bg-blue-500/20" : "bg-muted"
                  )}>
                    <IconArticle className={cn(
                          "h-4 w-4",
                          stats.totalBlogs > 0 ? "text-blue-600" : "text-muted-foreground"
                    )} />
                  </div>
                      {stats.totalBlogs > 0 ? (
                        <span className="text-lg font-bold text-blue-600">{stats.totalBlogs}</span>
                      ) : (
                        <IconPlus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">Blog Posts</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalBlogs > 0 ? "Created" : "Generate"}
                    </p>
                  </CardContent>
                </Card>
                
                {/* AI Images */}
                <Card className={cn(
                  "border transition-all cursor-pointer hover:shadow-md",
                  totalImages > 0 
                    ? "border-pink-500/20 bg-pink-500/5 hover:border-pink-500/40" 
                    : "border-muted hover:border-primary/20"
                )}
                onClick={() => setActiveTab('graphics')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                        totalImages > 0 ? "bg-pink-500/20" : "bg-muted"
                  )}>
                    <IconPhoto className={cn(
                          "h-4 w-4",
                          totalImages > 0 ? "text-pink-600" : "text-muted-foreground"
                    )} />
                  </div>
                      {totalImages > 0 ? (
                        <span className="text-lg font-bold text-pink-600">{totalImages}</span>
                      ) : (
                        <IconPlus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">AI Images</p>
                    <p className="text-xs text-muted-foreground">
                      {totalImages > 0 ? "Created" : "Generate"}
                    </p>
                  </CardContent>
                </Card>
                
                {/* Social Posts */}
                <Card className={cn(
                  "border transition-all cursor-pointer hover:shadow-md",
                  stats.totalSocialPosts > 0 
                    ? "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40" 
                    : "border-muted hover:border-primary/20"
                )}
                onClick={() => router.push(`/projects/${projectId}/stage`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                        stats.totalSocialPosts > 0 ? "bg-orange-500/20" : "bg-muted"
                  )}>
                    <IconShare2 className={cn(
                          "h-4 w-4",
                          stats.totalSocialPosts > 0 ? "text-orange-600" : "text-muted-foreground"
                    )} />
                  </div>
                      {stats.totalSocialPosts > 0 ? (
                        <span className="text-lg font-bold text-orange-600">{stats.totalSocialPosts}</span>
                      ) : (
                        <IconPlus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">Social Posts</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalSocialPosts > 0 ? "Staged" : "Create"}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions Footer */}
              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconSparkles className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Powered by AI content analysis
                </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowBlogDialog(true)}
                    disabled={isGeneratingBlog || !project.transcription}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <IconWand className="h-4 w-4 mr-1" />
                    Generate Blog
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveTab('graphics')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <IconPhoto className="h-4 w-4 mr-1" />
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
            {/* Video Player Card */}
            <Card className="overflow-hidden">
              {/* Video Header */}
              <div className="px-4 py-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconVideo className="h-5 w-5 text-primary" />
                  <div>
                      <h3 className="font-semibold text-sm">Video Player</h3>
                      <p className="text-xs text-muted-foreground">
                        {project.thumbnail_url ? 'Custom thumbnail' : 'Default thumbnail'}
                    </p>
                  </div>
                  </div>
                  
                  {/* Thumbnail Actions */}
                  <div className="flex items-center gap-1">
                  <ThumbnailCreatorV2
                    projectId={project.id}
                    projectTitle={project.title}
                    projectVideoUrl={project.video_url}
                    contentAnalysis={project.content_analysis}
                    currentThumbnail={project.thumbnail_url}
                    selectedPersona={selectedPersona}
                    onThumbnailUpdate={async (newThumbnailUrl: string) => {
                      setThumbnailUrl(newThumbnailUrl)
                      await loadProject()
                        toast.success('Thumbnail updated!')
                    }}
                  />
                    
                    {project.thumbnail_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(project.thumbnail_url!, '_blank')}
                      >
                        <IconDownload className="h-4 w-4" />
                        <span className="sr-only">Download thumbnail</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Video Container */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                {project.video_url ? (
                  <>
                    {/* Loading Overlay */}
                    {videoLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 pointer-events-none">
                        <div className="text-center">
                          <IconLoader2 className="h-10 w-10 animate-spin text-white/70 mx-auto" />
                          <p className="text-white/60 text-sm mt-2">Loading video...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Thumbnail Display (when video is not playing) */}
                    {(project.thumbnail_url || defaultThumbnail) && !videoLoading && (
                      <div className="absolute inset-0 z-5 group cursor-pointer"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.play()
                            setVideoLoading(false)
                          }
                        }}
                        style={{ display: videoRef.current?.paused === false ? 'none' : 'flex' }}
                      >
                        <img 
                          src={project.thumbnail_url || defaultThumbnail} 
                          alt="Video thumbnail" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-xl group-hover:scale-110 transition-transform">
                            <IconPlayerPlay className="h-12 w-12 text-black" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Video Element */}
                    <video
                      ref={videoRef}
                      src={project.video_url}
                      poster={project.thumbnail_url || thumbnailUrl || defaultThumbnail || undefined}
                      className="w-full aspect-video bg-black"
                      controls
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget
                        if (!project.metadata?.duration || project.metadata.duration !== video.duration) {
                          setProject(prev => prev ? {
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              duration: video.duration
                            }
                          } : null)
                        }
                      }}
                      onError={(e) => {
                        console.error("Video error:", e)
                        setVideoLoading(false)
                        toast.error("Failed to load video")
                      }}
                      onLoadStart={() => {
                        setVideoLoading(true)
                      }}
                      onCanPlay={() => {
                        setVideoLoading(false)
                      }}
                      onLoadedData={() => {
                        setVideoLoading(false)
                      }}
                    >
                      <source src={project.video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </>
                ) : (
                  <div className="relative aspect-video bg-black flex items-center justify-center">
                    <div className="text-center">
                      <IconVideo className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No video uploaded</p>
                    </div>
                  </div>
                )}
              </div>
              
              
              {/* Video Info Bar */}
              <div className="px-4 py-3 border-t bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-4">
                    {project.metadata?.duration && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <IconClock className="h-4 w-4" />
                        <span className="font-medium">{formatDuration(project.metadata.duration)}</span>
                      </div>
                    )}
                    
                      {project.transcription && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                          <IconLanguage className="h-4 w-4" />
                        <span className="font-medium">{project.transcription.language.toUpperCase()}</span>
                      </div>
                      )}
                    
                    {project.metadata?.width && project.metadata?.height && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <IconMaximize className="h-4 w-4" />
                        <span>{project.metadata.width}×{project.metadata.height}</span>
                    </div>
                    )}
                  </div>
                  
                    <div className="flex items-center gap-2">
                      {project.folders.clips.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                        <IconScissors className="h-3 w-3 mr-1" />
                          {project.folders.clips.length} clips
                        </Badge>
                      )}
                      {hasSubtitles && (
                      <Badge variant="outline" className="text-xs border-green-600/50 text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Subtitles
                        </Badge>
                      )}
                    </div>
                  </div>
              </div>
            </Card>

            {/* Quick AI Actions Bar */}
            <Card className="border border-primary/10 overflow-hidden">
              <CardContent className="p-4 bg-gradient-to-r from-background to-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <IconWand className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">AI Quick Actions</p>
                      <p className="text-xs text-muted-foreground">Generate content instantly</p>
                  </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm"
                      onClick={() => setShowBlogDialog(true)} 
                      disabled={isGeneratingBlog || !project.transcription} 
                      variant={project.folders.blog.length > 0 ? "outline" : "default"}
                      className={project.folders.blog.length > 0 ? "" : "bg-gradient-to-r from-primary to-primary/80"}
                    >
                      {isGeneratingBlog ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin"/>
                          Generating...
                        </>
                      ) : (
                        <>
                          <IconArticle className="mr-2 h-4 w-4"/>
                          {project.folders.blog.length > 0 ? "New Blog" : "Generate Blog"}
                        </>
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <IconPlus className="h-4 w-4 mr-2" />
                          More
                          <IconChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setActiveTab('graphics')}>
                          <IconPhoto className="h-4 w-4 mr-2" />
                          Generate Images
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <IconScissors className="h-4 w-4 mr-2" />
                          More Clips
                          <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <IconSticker className="h-4 w-4 mr-2" />
                          Auto Captions
                          <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Content Tabs */}
            <Card className="shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b bg-gradient-to-r from-background to-muted/20 rounded-t-lg overflow-hidden">
                  <div className="px-6 pt-6 pb-0">
                    <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-muted/50">
                      <TabsTrigger 
                        value="overview" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <IconChartBar className="h-5 w-5" />
                        <span className="text-xs font-medium">Overview</span>
                        <span className="text-[10px] text-muted-foreground">Analysis</span>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="clips" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm relative"
                      >
                        <IconScissors className="h-5 w-5" />
                        <span className="text-xs font-medium">Clips</span>
                        <span className="text-[10px] text-muted-foreground">
                          {stats.totalClips} items
                        </span>
                        {clipsTask?.status === 'processing' && (
                          <div className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                        )}
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="blog" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <IconArticle className="h-5 w-5" />
                        <span className="text-xs font-medium">Blog</span>
                        <span className="text-[10px] text-muted-foreground">
                          {stats.totalBlogs} posts
                        </span>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="graphics" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <IconPhoto className="h-5 w-5" />
                        <span className="text-xs font-medium">Graphics</span>
                        <span className="text-[10px] text-muted-foreground">
                          {totalImages} images
                        </span>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="quotes" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <IconQuote className="h-5 w-5" />
                        <span className="text-xs font-medium">Quotes</span>
                        <span className="text-[10px] text-muted-foreground">
                          Cards
                        </span>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="social" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <IconShare2 className="h-5 w-5" />
                        <span className="text-xs font-medium">Social</span>
                        <span className="text-[10px] text-muted-foreground">
                          {stats.totalSocialPosts} posts
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <div className="p-6">
                  <TabsContent value="overview" className="mt-0 space-y-6">
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
                        {project.folders.clips && project.folders.clips.length > 0 && (
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
                                        className="absolute inset-0 w-full h-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                            controls={false}
                                        crossOrigin="anonymous"
                                        onLoadedMetadata={(e) => {
                                          // Set initial frame to 1 second
                                          const video = e.currentTarget
                                          video.currentTime = 1
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.pause()
                                          e.currentTarget.currentTime = 1
                                            }}
                                            onError={(e) => {
                                              console.error('Video loading error:', e)
                                              // Optionally hide the video element on error
                                              e.currentTarget.style.display = 'none'
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
                                          className="border-accent/50 text-foreground/80 hover:bg-accent/10 hover:text-foreground transition-colors cursor-default"
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

                              {/* Video Chapters */}
                              <div className="mt-4">
                                <VideoChapters
                                  projectId={project.id}
                                  videoDuration={project.metadata?.duration || 0}
                                  hasTranscript={!!project.transcription}
                                />
                              </div>

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
                    </TabsContent>

                    <TabsContent value="clips" className="mt-0">
                      {project.folders.clips.length > 0 ? (
                      <>
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
                          
                        {/* Clips List - Horizontal Layout */}
                        <div className="space-y-4">
                            {[...project.folders.clips]
                              .sort((a, b) => (b.score || 0) - (a.score || 0))
                              .map((clip: ClipData, index: number) => {
                                // More detailed scoring tiers
                                const getScoreTier = (score: number) => {
                                  const scorePercent = score * 100
                                if (scorePercent >= 95) return { label: "🚀 Guaranteed Viral", color: "from-purple-600 to-pink-600", textColor: "text-purple-600", borderColor: "border-purple-500/50", bgColor: "bg-purple-50 dark:bg-purple-950/20" }
                                if (scorePercent >= 90) return { label: "🔥 Viral Potential", color: "from-red-500 to-pink-500", textColor: "text-red-600", borderColor: "border-red-500/50", bgColor: "bg-red-50 dark:bg-red-950/20" }
                                if (scorePercent >= 85) return { label: "💎 Exceptional", color: "from-orange-500 to-red-500", textColor: "text-orange-600", borderColor: "border-orange-500/50", bgColor: "bg-orange-50 dark:bg-orange-950/20" }
                                if (scorePercent >= 80) return { label: "⭐ Outstanding", color: "from-yellow-500 to-orange-500", textColor: "text-yellow-700", borderColor: "border-yellow-500/50", bgColor: "bg-yellow-50 dark:bg-yellow-950/20" }
                                if (scorePercent >= 75) return { label: "✨ Very Good", color: "from-green-500 to-yellow-500", textColor: "text-green-700", borderColor: "border-green-500/50", bgColor: "bg-green-50 dark:bg-green-950/20" }
                                if (scorePercent >= 70) return { label: "👍 Good", color: "from-blue-500 to-green-500", textColor: "text-blue-700", borderColor: "border-blue-500/50", bgColor: "bg-blue-50 dark:bg-blue-950/20" }
                                if (scorePercent >= 65) return { label: "📈 Above Average", color: "from-indigo-500 to-blue-500", textColor: "text-indigo-700", borderColor: "border-indigo-500/50", bgColor: "bg-indigo-50 dark:bg-indigo-950/20" }
                                if (scorePercent >= 60) return { label: "✓ Decent", color: "from-gray-500 to-indigo-500", textColor: "text-gray-700", borderColor: "border-gray-500/50", bgColor: "bg-gray-50 dark:bg-gray-950/20" }
                                if (scorePercent >= 50) return { label: "💡 Has Potential", color: "from-gray-400 to-gray-500", textColor: "text-gray-600", borderColor: "border-gray-400/50", bgColor: "bg-gray-50 dark:bg-gray-950/20" }
                                return { label: "🔄 Needs Work", color: "from-gray-300 to-gray-400", textColor: "text-gray-500", borderColor: "border-gray-300/50", bgColor: "bg-gray-50 dark:bg-gray-950/20" }
                                }
                                
                                const tier = getScoreTier(clip.score || 0)
                                
                                return (
                              <motion.div
                                key={`${clip.id}_${index}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Card className={cn(
                                    "overflow-hidden transition-all hover:shadow-xl border-2",
                                    tier.borderColor,
                                    tier.bgColor
                                  )}>
                                    <div className="flex flex-col md:flex-row">
                                      {/* Video Preview - Left Side */}
                                      <div className="relative md:w-64 aspect-[9/16] md:aspect-auto bg-black cursor-pointer group"
                                onClick={() => {
                                  setSelectedClip(clip)
                                  setShowVideoModal(true)
                                }}>
                                    {clip.exportUrl && !videoErrors[clip.id] ? (
                                      <>
                                        <video
                                          src={clip.exportUrl}
                                          className="absolute inset-0 w-full h-full object-cover"
                                          muted
                                          playsInline
                                          preload="metadata"
                                          controls={false}
                                          crossOrigin="anonymous"

                                              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.pause()
                                            e.currentTarget.currentTime = 1
                                          }}
                                          onError={() => {
                                            console.error(`Failed to load video for clip ${clip.id}`)
                                            setVideoErrors(prev => ({ ...prev, [clip.id]: true }))
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                      </>
                                    ) : (
                                      <VideoErrorState />
                                    )}
                                    
                                    {/* Rank Badge */}
                                    {index < 3 && (
                                      <div className="absolute top-3 left-3">
                                        <Badge className={cn(
                                          "font-bold text-sm px-3 py-1.5 shadow-lg",
                                          index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black" : 
                                          index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400 text-black" : 
                                          "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
                                        )}>
                                          #{index + 1}
                                        </Badge>
                                      </div>
                                    )}
                                    
                                        {/* Play overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <div className="bg-white rounded-full p-3 shadow-xl">
                                            <IconPlayerPlay className="h-8 w-8 text-black" />
                                      </div>
                                    </div>
                                    
                                    {/* Duration */}
                                    <div className="absolute bottom-3 right-3">
                                      <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-medium">
                                            <span data-duration-id={clip.id}>
                                              {clip.duration ? formatDuration(clip.duration) : formatDuration(clip.endTime - clip.startTime)}
                                            </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                      {/* Clip Details - Right Side */}
                                      <div className="flex-1 p-6 space-y-4">
                                    <div>
                                          <h3 className="text-xl font-semibold mb-2">
                                        {clip.title || 'Untitled Clip'}
                                      </h3>
                                          <div className="flex items-center gap-3 mb-3">
                                        <Badge className={cn(
                                              "text-sm font-medium",
                                          "bg-gradient-to-r", tier.color,
                                          "text-white border-0"
                                        )}>
                                          {tier.label}
                                        </Badge>
                                            <span className={cn("text-2xl font-bold", tier.textColor)}>
                                              {Math.round((clip.score || 0) * 100)}/100
                                            </span>
                                      </div>
                                    </div>
                                        
                                        {/* Virality Score Explanation */}
                                        {(clip.viralityExplanation || clip.description) && (
                                          <div className="bg-background rounded-lg p-4 border">
                                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                              <IconSparkles className="h-4 w-4 text-primary" />
                                              AI Analysis
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                              {clip.viralityExplanation || clip.description}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {/* Clip Transcript - Moved below score */}
                                        
                                        {/* Tags */}
                                        {clip.tags && clip.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {clip.tags.map((tag: string, idx: number) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                    
                                    {/* Clip Metadata */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="text-muted-foreground">Duration</span>
                                            <p className="font-medium">{formatDuration(clip.duration || (clip.endTime - clip.startTime))}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Time Range</span>
                                            <p className="font-medium">
                                              {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
                                            </p>
                                          </div>
                                        </div>
                                    
                                    {/* Score Progress */}
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Virality Score</span>
                                            <span className="font-medium">
                                              {clip.score >= 0.8 ? "Excellent" :
                                               clip.score >= 0.7 ? "Good" :
                                               clip.score >= 0.6 ? "Fair" :
                                               "Needs Improvement"}
                                        </span>
                                      </div>
                                          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                          className={cn(
                                            "absolute left-0 top-0 h-full rounded-full",
                                            "bg-gradient-to-r", tier.color
                                          )}
                                          initial={{ width: 0 }}
                                          animate={{ width: `${(clip.score || 0) * 100}%` }}
                                          transition={{ duration: 1, delay: index * 0.1 }}
                                        />
                                      </div>
                                    </div>
                                    
                                        {/* Clip Transcript */}
                                        {clip.transcript && (
                                          <div className="bg-muted/50 rounded-lg p-4 cursor-pointer hover:bg-muted/70 transition-colors"
                                               onClick={(e) => {
                                                 e.stopPropagation()
                                                 setSelectedTranscript(clip.transcript || '')
                                                 setShowTranscriptModal(true)
                                               }}
                                          >
                                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                              <IconFileText className="h-4 w-4 text-primary" />
                                              Transcript
                                              <span className="text-xs text-muted-foreground ml-auto">Click to expand</span>
                                            </h4>
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                              {clip.transcript}
                                            </p>
                                          </div>
                                        )}
                                    
                                        {/* Quick Actions */}
                                        <div className="flex items-center gap-2 pt-2">
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => {
                                              setSelectedClip(clip)
                                              setShowVideoModal(true)
                                            }}
                                          >
                                            <IconPlayerPlay className="h-4 w-4 mr-2" />
                                            Play
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={async () => {
                                              if (clip.exportUrl) {
                                                const a = document.createElement('a')
                                                a.href = clip.exportUrl
                                                a.download = `clip-${index + 1}.mp4`
                                                a.click()
                                              }
                                            }}
                                          >
                                            <IconDownload className="h-4 w-4 mr-2" />
                                            Download
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(clip.title || 'Untitled Clip', clip.id)}
                                          >
                                            {copiedId === clip.id ? (
                                              <IconCheck className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <IconCopy className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                </Card>
                              </motion.div>
                              )
                            })}
                          </div>
                      </>
                      ) : (() => {
                        // Check if clips are currently being generated
                        const clipsTask = project.tasks.find(t => t.type === 'clips');
                        const isClipsProcessing = clipsTask && clipsTask.status === 'processing';
                        
                        if (isClipsProcessing) {
                          // Clips are being generated, show progress
                          return (
                            <Card className="overflow-hidden">
                              <div className="h-2 gradient-premium animate-gradient-x" />
                              <CardContent className="p-8">
                                <div className="flex flex-col items-center text-center space-y-4">
                                  <div className="relative">
                                    <IconScissors className="h-16 w-16 text-primary/30" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <IconLoader2 className="h-8 w-8 text-primary animate-spin" />
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold mb-2">Generating Clips</h3>
                                    <p className="text-muted-foreground mb-4">
                                      AI is analyzing your video to create viral short-form clips. This typically takes 10-15 minutes.
                                    </p>
                                    <div className="max-w-xs mx-auto space-y-2">
                                      <Progress value={clipsTask.progress || 0} className="h-2" />
                                      <p className="text-sm text-muted-foreground">
                                        {clipsTask.progress || 0}% complete
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <IconInfoCircle className="h-4 w-4" />
                                    <span>You can work on other content while clips are being generated</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        } else {
                          // No clips and not processing - show empty state
                          return (
                        <EmptyState
                          icon={<IconScissors className="h-16 w-16 text-primary/50" />}
                          title="No clips generated yet"
                          description="Generate short-form clips from your video content"
                          action={{
                            label: "Generate Clips",
                            onClick: async () => {
                              const toastId = toast.loading('Starting clip generation...')
                              try {
                                const response = await fetch(`/api/projects/${project.id}/process`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    workflow: 'clips',
                                    projectId: project.id 
                                  })
                                })
                                
                                if (!response.ok) {
                                  const error = await response.json()
                                  throw new Error(error.error || 'Failed to start clip generation')
                                }
                                
                                    toast.success('Clip generation started! This may take 10-15 minutes.', { id: toastId })
                                    // Refresh the page to show processing status
                                    loadProject()
                              } catch (error) {
                                toast.error(
                                  error instanceof Error ? error.message : 'Failed to generate clips', 
                                  { id: toastId }
                                )
                                console.error('Clip generation error:', error)
                              }
                            }
                          }}
                        />
                          );
                        }
                      })()}
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
                                      <DropdownMenuItem onClick={() => setThreadGeneratorState({ isOpen: true, content: post.content, title: post.title })}>
                                        <IconBrandTwitter className="h-4 w-4 mr-2" />
                                        Generate Thread
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

                        {/* Social Content Info */}
                        {project.transcription && project.content_analysis ? (
                          <Card>
                            <CardContent className="p-6 text-center">
                              <IconShare2 className="h-12 w-12 mx-auto text-primary/30 mb-4" />
                              <h3 className="font-semibold mb-2">Social Media Ready</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Your content is ready to be staged for social media publishing
                              </p>
                              <Button 
                                onClick={() => router.push(`/projects/${projectId}/stage`)}
                                className="gap-2"
                              >
                                <IconRocket className="h-4 w-4" />
                                Stage Content
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="p-8 text-center">
                              <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <h3 className="text-lg font-semibold mb-2">Transcript Required</h3>
                              <p className="text-muted-foreground">
                                Generate a transcript first to create AI-powered social posts
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Divider */}
                        {project.folders.social.length > 0 && (
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Saved Posts
                              </span>
                            </div>
                          </div>
                        )}

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

                                                      {/* Social Graphics Display */}
                          <div className="col-span-full">
                            <Card>
                              <CardHeader>
                                <CardTitle>Social Graphics Library</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <SocialGraphicsDisplay 
                                  projectId={project.id}
                                  onSchedule={(graphic) => {
                                    // TODO: Implement scheduling
                                    toast.info("Scheduling feature coming soon!")
                                  }}
                                  onEdit={(graphic) => {
                                    // TODO: Implement editing
                                    toast.info("Edit feature coming soon!")
                                  }}
                                />
                              </CardContent>
                            </Card>
                          </div>

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
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Create New Image</CardTitle>
                              {selectedPersona && (
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={usePersonaForGraphics}
                                      onChange={(e) => setUsePersonaForGraphics(e.target.checked)}
                                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Use Persona</span>
                                  </label>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="p-1 rounded-full bg-primary/10">
                                      <IconUser className="h-3 w-3 text-primary" />
                                    </div>
                                    <span>{selectedPersona.name}</span>
                                  </div>
                                </div>
                              )}
                            </div>
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

                            <div className="flex gap-2">
                              <Button
                                onClick={handleGenerateCustom}
                                disabled={isGeneratingImage || !customPrompt.trim()}
                                className="flex-1"
                              >
                                {isGeneratingImage ? (
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
                              <SocialGraphicsGenerator
                                projectId={project.id}
                                projectTitle={project.title}
                                contentAnalysis={project.content_analysis}
                                selectedPersona={selectedPersona}
                                onGraphicsGenerated={(graphics) => {
                                  loadProject() // Reload to show new graphics
                                  toast.success(`Generated ${graphics.length} social graphics!`)
                                }}
                              />
                            </div>
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
                                  },
                                  concept: { 
                                    icon: IconSparkles, 
                                    color: 'from-indigo-500 to-purple-500',
                                    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
                                    iconColor: 'text-indigo-600 dark:text-indigo-400',
                                    emoji: '💡'
                                  },
                                  hook: { 
                                    icon: IconRocket, 
                                    color: 'from-pink-500 to-rose-500',
                                    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
                                    iconColor: 'text-pink-600 dark:text-pink-400',
                                    emoji: '🪝'
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
                                      "cursor-pointer transition-all hover:shadow-xl group relative",
                                      selectedSuggestion?.id === suggestion.id && "ring-2 ring-primary"
                                    )}
                                    onClick={() => handleGenerateFromSuggestion(suggestion)}
                                  >
                                    <div className={cn(
                                      "absolute inset-x-0 top-0 h-2 bg-gradient-to-r",
                                      typeConfig.color
                                    )} />
                                    <CardHeader className="pb-3 pt-4">
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

                    <TabsContent value="quotes" className="mt-0">
                      <div className="space-y-6">
                        <QuoteCardsGenerator
                          projectId={project.id}
                          hasTranscript={!!project.transcription}
                          projectTitle={project.title}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="publish" className="mt-0">
                      <PublishingWorkflow
                        project={project}
                        onPublish={handlePublishContent}
                        className="border-0 shadow-none"
                      />
                    </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* Enhanced Transcription Panel - Right Side */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 h-[calc(100vh-120px)] overflow-hidden border-2 border-primary/10 shadow-xl">
              {project.transcription ? (
                <div className="h-full flex flex-col">
                  {/* Transcription Header */}
                  <div className="p-5 border-b bg-gradient-to-br from-primary/5 via-background to-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconFileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Transcript & Subtitles</h3>
                          <p className="text-xs text-muted-foreground">
                            Edit segments for perfect subtitle timing
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10">
                            <IconDots className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadTranscript('txt')}>
                            <IconFileDownload className="h-4 w-4 mr-2" />
                            Download as TXT
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadTranscript('srt')}>
                            <IconFileDownload className="h-4 w-4 mr-2" />
                            Download as SRT
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadTranscript('vtt')}>
                            <IconFileDownload className="h-4 w-4 mr-2" />
                            Download as VTT
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            const fullTranscript = project.transcription!.text
                            copyToClipboard(fullTranscript, 'full-transcript')
                            toast.success('Full transcript copied!')
                          }}>
                            <IconCopy className="h-4 w-4 mr-2" />
                            Copy Full Text
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-background/60 backdrop-blur-sm rounded-lg p-2.5 border border-border/50">
                        <div className="flex items-center gap-2">
                          <IconLanguage className="h-4 w-4 text-primary/70" />
                          <div>
                            <p className="text-xs font-medium">Language</p>
                            <p className="text-sm font-semibold">{project.transcription.language.toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-background/60 backdrop-blur-sm rounded-lg p-2.5 border border-border/50">
                        <div className="flex items-center gap-2">
                          <IconFileText className="h-4 w-4 text-primary/70" />
                          <div>
                            <p className="text-xs font-medium">Segments</p>
                            <p className="text-sm font-semibold">{project.transcription.segments.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-background/60 backdrop-blur-sm rounded-lg p-2.5 border border-border/50">
                        <div className="flex items-center gap-2">
                          <IconArticle className="h-4 w-4 text-primary/70" />
                          <div>
                            <p className="text-xs font-medium">Words</p>
                            <p className="text-sm font-semibold">{project.transcription.text.split(' ').length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Transcript Editor */}
                  <div className="flex-1 overflow-hidden">
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
                        
                        // Force track to be showing
                        const handleTrackLoad = () => {
                          if (videoRef.current && videoRef.current.textTracks[0]) {
                            videoRef.current.textTracks[0].mode = 'showing'
                          }
                        }
                        
                        track.addEventListener('load', handleTrackLoad, { once: true })
                        
                        videoRef.current.appendChild(track)
                      }
                      
                      // Mark as having subtitles
                      setHasSubtitles(true)
                      
                      toast.success("Subtitles applied! Your long-form content is ready.")
                    }}
                  />
                  </div>
                </div>
              ) : (
                <CardContent className="h-full flex items-center justify-center">
                  <EmptyState
                    icon={<IconFileText className="h-12 w-12 text-primary/30" />}
                    title="No transcription yet"
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
            
            <div className="rounded-lg overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left: Video Player */}
                <div className="bg-black relative flex items-center justify-center">
                  <div className="w-full max-w-sm">
                    <div className="aspect-[9/16] relative bg-black rounded-lg overflow-hidden">
                      {selectedClip.exportUrl ? (
                        <video
                          key={selectedClip.id}
                          src={selectedClip.exportUrl}
                          className="w-full h-full object-contain"
                          controls
                          controlsList="nodownload"
                          autoPlay
                          playsInline
                          muted={false}
                          crossOrigin="anonymous"
                          onLoadedMetadata={(e) => {
                            const durationElement = document.querySelector(`[data-modal-clip-duration="${selectedClip.id}"]`)
                            if (durationElement && e.currentTarget.duration) {
                              durationElement.textContent = formatDuration(e.currentTarget.duration)
                            }
                          }}
                          onError={(e) => {
                            console.error(`Failed to load video for clip ${selectedClip.id}`)
                            // Try to fall back to previewUrl if exportUrl fails
                            if (e.currentTarget.src === selectedClip.exportUrl && selectedClip.previewUrl) {
                              console.log('Falling back to preview URL')
                              e.currentTarget.src = selectedClip.previewUrl
                            } else {
                              // Show error state
                              e.currentTarget.style.display = 'none'
                              const parent = e.currentTarget.parentElement
                              if (parent && !parent.querySelector('.error-state')) {
                                const errorDiv = document.createElement('div')
                                errorDiv.className = 'error-state flex flex-col items-center justify-center h-full text-gray-400'
                                errorDiv.innerHTML = `
                                  <svg class="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                  </svg>
                                  <p class="text-sm">Video playback failed</p>
                                  <p class="text-xs mt-1">The video might still be processing</p>
                                `
                                parent.appendChild(errorDiv)
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <IconVideoOff className="h-16 w-16 mx-auto mb-2 text-gray-600" />
                            <p className="text-gray-400">Video not available</p>
                            <p className="text-xs text-gray-500 mt-1">The clip might still be processing</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right: Clip Details */}
                <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh] bg-background">
                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClip.title || 'Untitled Clip'}</h2>
                  </div>
                  
                  {/* Transcript - Primary Focus */}
                  {selectedClip.transcript && (
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border-2 border-primary/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                        <IconFileText className="h-5 w-5 text-primary" />
                        Transcript
                      </h3>
                      <div className="max-h-64 overflow-y-auto pr-2">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedClip.transcript}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Virality Score Details */}
                  <div className={cn(
                    "p-6 rounded-xl border-2 relative overflow-hidden",
                    (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-br from-red-500/20 via-pink-500/10 to-transparent border-red-500/40" :
                    (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-br from-orange-500/20 via-yellow-500/10 to-transparent border-orange-500/40" :
                    (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-br from-yellow-500/20 via-green-500/10 to-transparent border-yellow-500/40" :
                    "bg-gradient-to-br from-gray-500/20 via-gray-600/10 to-transparent border-gray-500/40"
                  )}>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-3 rounded-xl shadow-lg",
                            (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-br from-red-500 to-pink-500" :
                            (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-br from-orange-500 to-yellow-500" :
                            (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-br from-yellow-500 to-green-500" :
                            "bg-gradient-to-br from-gray-500 to-gray-600"
                          )}>
                            <IconSparkles className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Virality Score Analysis</h3>
                            <div className="flex items-baseline gap-2">
                              <span className={cn(
                                "text-3xl font-bold",
                                (selectedClip.score || 0) >= 0.9 ? "text-red-600" :
                                (selectedClip.score || 0) >= 0.7 ? "text-orange-600" :
                                (selectedClip.score || 0) >= 0.5 ? "text-yellow-600" :
                                "text-gray-600"
                              )}>{Math.round((selectedClip.score || 0) * 100)}</span>
                              <span className="text-lg text-muted-foreground">/100</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-sm px-4 py-1.5 font-semibold shadow-md",
                          (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0" :
                          (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0" :
                          (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-r from-yellow-500 to-green-500 text-black border-0" :
                          "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
                        )}>
                          {(selectedClip.score || 0) >= 0.9 ? "🔥 Viral Potential" :
                           (selectedClip.score || 0) >= 0.7 ? "⚡ High Engagement" :
                           (selectedClip.score || 0) >= 0.5 ? "✨ Good Content" :
                           "💡 Needs Improvement"}
                        </Badge>
                      </div>
                      
                      {/* Score Bar */}
                      <div className="mb-4">
                        <div className="relative h-3 bg-black/10 rounded-full overflow-hidden">
                          <motion.div
                            className={cn(
                              "absolute left-0 top-0 h-full rounded-full shadow-lg",
                              (selectedClip.score || 0) >= 0.9 ? "bg-gradient-to-r from-red-500 via-pink-500 to-red-400" :
                              (selectedClip.score || 0) >= 0.7 ? "bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-400" :
                              (selectedClip.score || 0) >= 0.5 ? "bg-gradient-to-r from-yellow-500 via-green-500 to-yellow-400" :
                              "bg-gradient-to-r from-gray-500 to-gray-400"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${(selectedClip.score || 0) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                      
                      {/* Detailed Explanation */}
                      {selectedClip.viralityExplanation && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">Analysis:</span> {selectedClip.viralityExplanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Clip Duration */}
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <IconClock className="h-4 w-4" />
                      Duration
                    </div>
                    <p className="font-semibold text-lg">{formatDuration(selectedClip.duration || (selectedClip.endTime - selectedClip.startTime))}</p>
                  </div>
                  
                  {/* Tags */}
                  {selectedClip.tags && selectedClip.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <IconHash className="h-5 w-5 text-primary" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedClip.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-sm">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  

                  
                  {/* Platform Captions (if available) */}
                  {selectedClip.publicationCaptions && Object.keys(selectedClip.publicationCaptions).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <IconShare2 className="h-5 w-5 text-primary" />
                        Platform Captions
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(selectedClip.publicationCaptions).map(([platform, caption]) => (
                          <div key={platform} className="p-3 rounded-lg bg-muted/30 border">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="capitalize">
                                {platform}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  copyToClipboard(caption as string, `${platform}-caption`)
                                  toast.success(`${platform} caption copied!`)
                                }}
                              >
                                <IconCopy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{caption as string}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t">
                    {selectedClip.transcript && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          copyToClipboard(selectedClip.transcript!, 'clip-transcript')
                          toast.success('Transcript copied to clipboard')
                        }}
                      >
                        <IconCopy className="h-4 w-4 mr-2" />
                        Copy Transcript
                      </Button>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => {
                        setShowVideoModal(false)
                        // Navigate to staging with this clip selected
                        const contentToStage = [{
                          id: selectedClip.id,
                          type: 'clip',
                          title: selectedClip.title || 'Untitled Clip',
                          description: selectedClip.description || '',
                          exportUrl: selectedClip.exportUrl,
                          thumbnail: selectedClip.thumbnail,
                          duration: selectedClip.duration,
                          score: selectedClip.score,
                          viralityExplanation: selectedClip.viralityExplanation,
                          transcript: selectedClip.transcript,
                          tags: selectedClip.tags,
                          publicationCaptions: selectedClip.publicationCaptions,
                          startTime: selectedClip.startTime,
                          endTime: selectedClip.endTime,
                          metadata: selectedClip
                        }]
                        sessionStorage.setItem('selectedContent', JSON.stringify(contentToStage))
                        router.push(`/projects/${projectId}/stage`)
                      }}
                    >
                      <IconRocket className="h-4 w-4 mr-2" />
                      Publish This Clip
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}


      
      {/* Blog Generation Dialog */}
      <BlogGenerationDialog 
        isOpen={showBlogDialog}
        onClose={() => setShowBlogDialog(false)}
        onGenerate={handleGenerateBlog}
        isGenerating={isGeneratingBlog}
      />

      {/* Copy Success Alert */}
      {copiedId && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert>
            <IconCheck className="h-4 w-4" />
            <AlertDescription>Copied to clipboard!</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Delete Project Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                All content associated with this project will be permanently deleted, including:
                <ul className="mt-2 ml-4 list-disc text-sm">
                  <li>Video and transcription</li>
                  <li>{stats.totalClips} video clips</li>
                  <li>{stats.totalBlogs} blog posts</li>
                  <li>{totalImages} AI-generated images</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              setIsDeleteDialogOpen(false)
              handleDelete()
            }}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Content Selection Dialog */}
      <Dialog open={showContentSelectionDialog} onOpenChange={setShowContentSelectionDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <div className="h-full overflow-auto">
            <EnhancedPublishingWorkflow 
              project={project}
              onPublish={(selectedIds) => {
                setShowContentSelectionDialog(false)
                
                // Store selected content IDs
                sessionStorage.setItem('selectedContentIds', JSON.stringify(selectedIds))
                
                // Navigate to staging page
                router.push(`/projects/${project.id}/stage`)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Transcript Modal */}
      <TranscriptModal
        isOpen={showTranscriptModal}
        onClose={() => {
          setShowTranscriptModal(false)
          setSelectedTranscript("")
        }}
        transcript={selectedTranscript}
      />
      
      {/* Thread Generator */}
      {threadGeneratorState.isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" onClick={() => setThreadGeneratorState({ isOpen: false, content: '', title: '' })} />
          <div className="relative z-50">
            <ThreadGeneratorComponent
              content={threadGeneratorState.content}
              title={threadGeneratorState.title}
              sourceType="blog"
              onThreadGenerated={(thread) => {
                toast.success('Thread generated successfully!')
                console.log('Generated thread:', thread)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage() {
  return (
    <ErrorBoundary>
      <ProjectDetailPageContent />
    </ErrorBoundary>
  )
} 