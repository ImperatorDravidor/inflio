"use client"

<<<<<<< HEAD
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
=======
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
>>>>>>> 7184e73 (Add new files and configurations for project setup)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
<<<<<<< HEAD
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  IconScissors,
  IconArticle,
  IconShare2,
  IconVideo,
  IconPlayerPlay,
  IconClock,
  IconPhoto,
  IconSparkles,
  IconAlertCircle,
  IconFileText,
  IconRocket,
  IconArrowRight,
  IconX,
  IconLoader2
} from "@tabler/icons-react"
import { Project, ClipData, BlogPost } from "@/lib/project-types"
import { formatDuration } from "@/lib/video-utils"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useClerkUser } from "@/hooks/use-clerk-user"
import { toast } from "sonner"
import { StagingSessionsService } from "@/lib/staging/staging-sessions-service"
=======
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  IconLoader2, 
  IconSparkles, 
  IconArrowRight,
  IconScissors,
  IconVideo,
  IconPhoto,
  IconArticle,
  IconShare2,
  IconFileText,
  IconAlertCircle,
  IconCheck,
  IconPlayerPlay,
  IconEye,
  IconClock,
  IconTrendingUp,
  IconRobot,
  IconTransform,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconCalendarStats,
  IconChartBar,
  IconBolt,
  IconSettings,
  IconRefresh,
  IconArrowsShuffle,
  IconWand,
  IconDownload,
  IconUpload,
  IconCopy,
  IconFileExport,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarTime,
  IconChevronRight,
  IconFilter,
  IconSortAscending,
  IconLayoutGrid,
  IconLayoutList
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/video-utils"
import { Project } from "@/lib/project-types"
import { useClerkUser } from "@/hooks/use-clerk-user"
import { StagingSessionsService } from "@/lib/staging/staging-sessions-service"
import { format, addDays, setHours, setMinutes, isSameDay } from "date-fns"
>>>>>>> 7184e73 (Add new files and configurations for project setup)

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'social' | 'longform' | 'image' | 'carousel'
  title: string
  description?: string
  selected: boolean
  ready: boolean
  metadata?: any
  preview?: string
<<<<<<< HEAD
=======
  score?: number
  duration?: number
  exportUrl?: string
  publicationCaptions?: Record<string, string>
  viralityExplanation?: string
  transcript?: string
  scheduledTime?: Date
  platforms?: string[]
  [key: string]: any
>>>>>>> 7184e73 (Add new files and configurations for project setup)
}

interface PublishingWorkflowProps {
  project: Project
  onPublish: (selectedContent: ContentItem[]) => void
  onEditBlog?: (blogId: string) => void
  className?: string
}

<<<<<<< HEAD
=======
interface BulkOperation {
  id: string
  name: string
  description: string
  icon: any
  action: (items: ContentItem[]) => Promise<void>
  applicable: (item: ContentItem) => boolean
}

interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  condition: (item: ContentItem) => boolean
  action: string
  config?: any
}

interface TimeSlot {
  time: string
  engagement: number
  platform: string
}

// Best posting times based on platform analytics
const OPTIMAL_TIMES: Record<string, TimeSlot[]> = {
  instagram: [
    { time: '07:00', engagement: 85, platform: 'instagram' },
    { time: '12:00', engagement: 92, platform: 'instagram' },
    { time: '17:00', engagement: 88, platform: 'instagram' },
    { time: '19:00', engagement: 95, platform: 'instagram' }
  ],
  tiktok: [
    { time: '06:00', engagement: 90, platform: 'tiktok' },
    { time: '10:00', engagement: 87, platform: 'tiktok' },
    { time: '14:00', engagement: 82, platform: 'tiktok' },
    { time: '19:00', engagement: 93, platform: 'tiktok' }
  ],
  twitter: [
    { time: '09:00', engagement: 88, platform: 'twitter' },
    { time: '12:00', engagement: 85, platform: 'twitter' },
    { time: '17:00', engagement: 90, platform: 'twitter' },
    { time: '22:00', engagement: 83, platform: 'twitter' }
  ],
  linkedin: [
    { time: '07:30', engagement: 91, platform: 'linkedin' },
    { time: '12:00', engagement: 88, platform: 'linkedin' },
    { time: '17:30', engagement: 86, platform: 'linkedin' }
  ]
}

>>>>>>> 7184e73 (Add new files and configurations for project setup)
export function PublishingWorkflow({ 
  project, 
  onPublish, 
  onEditBlog,
  className 
}: PublishingWorkflowProps) {
  const router = useRouter()
  const { user } = useClerkUser()
  const [selectedContent, setSelectedContent] = useState<Record<string, boolean>>({})
<<<<<<< HEAD
  const [selectedContentItems, setSelectedContentItems] = useState<ContentItem[]>([])
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Add effect to handle highlight animation when scrolled to
  useEffect(() => {
    const handleHighlight = () => {
      setIsHighlighted(true)
      setTimeout(() => setIsHighlighted(false), 2000)
    }

    // Check if we just scrolled to this element
    const element = document.getElementById('publish-content-selection')
    if (element) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            handleHighlight()
          }
        })
      }, { threshold: 0.5 })

      observer.observe(element)
      return () => observer.disconnect()
    }
  }, [])

  // Prepare content items without mock data
=======
  const [isNavigating, setIsNavigating] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState<string | null>(null)
  const [showAutomation, setShowAutomation] = useState(false)
  const [publishingQueue, setPublishingQueue] = useState<ContentItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'title'>('score')
  const [showScheduler, setShowScheduler] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [scheduledItems, setScheduledItems] = useState<Record<string, Date>>({})
  
  // Automation rules
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: 'auto-publish-high',
      name: 'Auto-publish high performers',
      enabled: false,
      condition: (item) => (item.score || 0) >= 85,
      action: 'publish-immediately'
    },
    {
      id: 'schedule-optimal',
      name: 'Schedule at optimal times',
      enabled: true,
      condition: (item) => item.type === 'clip',
      action: 'schedule-optimal'
    },
    {
      id: 'cross-post',
      name: 'Cross-post to all platforms',
      enabled: false,
      condition: (item) => (item.score || 0) >= 70,
      action: 'cross-post'
    }
  ])

  // Prepare content items
>>>>>>> 7184e73 (Add new files and configurations for project setup)
  const contentItems: ContentItem[] = [
    // Long form video
    ...(project.video_url ? [{
      id: 'longform-main',
      type: 'longform' as const,
      title: project.title || 'Full Video',
      description: `${formatDuration(project.metadata?.duration || 0)} • Original content`,
      selected: false,
      ready: true,
      metadata: {
        url: project.video_url,
        duration: project.metadata?.duration,
        thumbnail: project.thumbnail_url,
        projectId: project.id,
        transcription: project.transcription,
        contentAnalysis: project.content_analysis
      },
      preview: project.video_url
    }] : []),

    // Video clips
    ...project.folders.clips.map(clip => ({
      id: `clip-${clip.id}`,
      type: 'clip' as const,
      title: clip.title || 'Untitled Clip',
      description: formatDuration(clip.duration),
      selected: false,
      ready: !!clip.exportUrl,
      metadata: {
        ...clip,
        projectId: project.id,
        projectContext: project.content_analysis?.summary
      },
<<<<<<< HEAD
      preview: clip.exportUrl || undefined
    })),

    // Blog posts
=======
      preview: clip.exportUrl || undefined,
      exportUrl: clip.exportUrl,
      publicationCaptions: clip.publicationCaptions,
      viralityExplanation: clip.viralityExplanation,
      score: clip.score,
      transcript: clip.transcript,
      duration: clip.duration
    })),

    // Other content types...
>>>>>>> 7184e73 (Add new files and configurations for project setup)
    ...project.folders.blog.map(blog => ({
      id: `blog-${blog.id}`,
      type: 'blog' as const,
      title: blog.title,
      description: `${blog.readingTime} min read`,
      selected: false,
      ready: true,
<<<<<<< HEAD
      metadata: {
        ...blog,
        projectId: project.id
      },
      preview: blog.excerpt || blog.content?.substring(0, 200) + '...'
    })),

    // Social posts
=======
      metadata: blog
    })),

>>>>>>> 7184e73 (Add new files and configurations for project setup)
    ...project.folders.social.map((post, index) => ({
      id: `social-${index}`,
      type: 'social' as const,
      title: `Social Post ${index + 1}`,
      description: post.platform || 'Multi-platform',
      selected: false,
      ready: true,
<<<<<<< HEAD
      metadata: {
        ...post,
        projectId: project.id,
        index
      },
      preview: post.content
    })),

    // AI-generated images
    ...(project.folders.images?.map((image: any) => ({
      id: `image-${image.id}`,
      type: 'image' as const,
      title: 'AI Generated Image',
      description: image.style,
      selected: false,
      ready: true,
      metadata: {
        ...image,
        projectId: project.id
      },
      preview: image.url
    })) || [])
  ]

=======
      metadata: post
    }))
  ]

  // Bulk operations
  const bulkOperations: BulkOperation[] = [
    {
      id: 'generate-gifs',
      name: 'Convert to GIFs',
      description: 'Create shareable GIFs from video clips',
      icon: IconTransform,
      applicable: (item) => item.type === 'clip' && !!item.duration && item.duration <= 10,
      action: async (items) => {
        const applicableItems = items.filter(item => item.type === 'clip' && item.duration && item.duration <= 10)
        
        for (const item of applicableItems) {
          try {
            const response = await fetch('/api/convert-to-gif', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                videoUrl: item.exportUrl,
                duration: item.duration,
                projectId: project.id
              })
            })

            if (response.ok) {
              const { gifUrl } = await response.json()
              toast.success(`GIF created for "${item.title}"`)
              
              // Add GIF as new content item
              contentItems.push({
                id: `gif-${item.id}`,
                type: 'image',
                title: `${item.title} (GIF)`,
                description: 'Animated GIF',
                selected: true,
                ready: true,
                metadata: { url: gifUrl, sourceClip: item.id },
                preview: gifUrl
              })
            }
          } catch (error) {
            toast.error(`Failed to convert "${item.title}" to GIF`)
          }
        }
      }
    },
    {
      id: 'create-threads',
      name: 'Generate Threads',
      description: 'Break down content into Twitter/LinkedIn threads',
      icon: IconArrowsShuffle,
      applicable: (item) => item.type === 'blog' || (item.type === 'clip' && !!item.transcript),
      action: async (items) => {
        const applicableItems = items.filter(item => 
          item.type === 'blog' || (item.type === 'clip' && item.transcript)
        )

        for (const item of applicableItems) {
          try {
            const content = item.type === 'blog' 
              ? item.metadata.content 
              : item.transcript

            const response = await fetch('/api/generate-thread', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content,
                title: item.title,
                platform: 'twitter' // or 'linkedin'
              })
            })

            if (response.ok) {
              const { thread } = await response.json()
              toast.success(`Thread created from "${item.title}"`)
              
              // Add thread as new content
              contentItems.push({
                id: `thread-${item.id}`,
                type: 'social',
                title: `${item.title} (Thread)`,
                description: `${thread.length} parts`,
                selected: true,
                ready: true,
                metadata: { thread, source: item.id }
              })
            }
          } catch (error) {
            toast.error(`Failed to create thread from "${item.title}"`)
          }
        }
      }
    },
    {
      id: 'optimize-captions',
      name: 'Optimize All Captions',
      description: 'AI rewrites captions for maximum engagement',
      icon: IconWand,
      applicable: (item) => item.type === 'clip' && !!item.publicationCaptions,
      action: async (items) => {
        const clips = items.filter(item => item.type === 'clip' && item.publicationCaptions)
        
        const response = await fetch('/api/optimize-captions-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clips: clips.map(clip => ({
              id: clip.id,
              title: clip.title,
              captions: clip.publicationCaptions,
              score: clip.score,
              transcript: clip.transcript
            }))
          })
        })

        if (response.ok) {
          const { optimizedClips } = await response.json()
          toast.success(`Optimized captions for ${clips.length} clips`)
          
          // Update clips with optimized captions
          optimizedClips.forEach((optimized: any) => {
            const clip = contentItems.find(item => item.id === optimized.id)
            if (clip) {
              clip.publicationCaptions = optimized.captions
            }
          })
        }
      }
    },
    {
      id: 'generate-variations',
      name: 'Create A/B Variants',
      description: 'Generate multiple versions for testing',
      icon: IconCopy,
      applicable: (item) => item.type === 'clip' || item.type === 'social',
      action: async (items) => {
        const applicable = items.filter(item => 
          item.type === 'clip' || item.type === 'social'
        )

        for (const item of applicable) {
          const response = await fetch('/api/generate-ab-variants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: item.publicationCaptions || item.metadata,
              type: item.type,
              variants: 2 // Create 2 variants
            })
          })

          if (response.ok) {
            const { variants } = await response.json()
            toast.success(`Created ${variants.length} variants for "${item.title}"`)
            
            // Add variants as new items
            variants.forEach((variant: any, index: number) => {
              contentItems.push({
                ...item,
                id: `${item.id}-variant-${index + 1}`,
                title: `${item.title} (Variant ${String.fromCharCode(65 + index)})`,
                metadata: { ...item.metadata, variant }
              })
            })
          }
        }
      }
    }
  ]

  // Filter and sort content
  const filteredContent = contentItems
    .filter(item => filterType === 'all' || item.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'date':
          return 0 // Would sort by creation date if available
        default:
          return 0
      }
    })

>>>>>>> 7184e73 (Add new files and configurations for project setup)
  const handleContentToggle = (itemId: string) => {
    setSelectedContent(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleSelectAll = () => {
<<<<<<< HEAD
    const newSelection: Record<string, boolean> = {}
    contentItems.forEach(item => {
      if (item.ready) {
        newSelection[item.id] = true
      }
    })
    setSelectedContent(newSelection)
  }

  const handleClearAll = () => {
    setSelectedContent({})
  }

=======
    const allReady = filteredContent.filter(item => item.ready)
    const allSelected = allReady.every(item => selectedContent[item.id])
    
    const newSelection: Record<string, boolean> = {}
    if (!allSelected) {
      allReady.forEach(item => {
        newSelection[item.id] = true
      })
    }
    setSelectedContent(newSelection)
  }

>>>>>>> 7184e73 (Add new files and configurations for project setup)
  const getSelectedItems = () => {
    return contentItems.filter(item => selectedContent[item.id])
  }

<<<<<<< HEAD
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'clip': return IconScissors
      case 'blog': return IconArticle
      case 'social': return IconShare2
      case 'longform': return IconVideo
      case 'image': return IconPhoto
      case 'carousel': return IconPhoto
      default: return IconFileText
    }
=======
  const handleBulkOperation = async (operation: BulkOperation) => {
    const selectedItems = getSelectedItems()
    const applicableItems = selectedItems.filter(operation.applicable)
    
    if (applicableItems.length === 0) {
      toast.error(`No applicable items for ${operation.name}`)
      return
    }

    setBulkProcessing(operation.id)
    
    try {
      await operation.action(applicableItems)
      
      // Refresh content list
      window.location.reload()
    } catch (error) {
      toast.error(`Failed to complete ${operation.name}`)
    } finally {
      setBulkProcessing(null)
    }
  }

  const handleScheduleItem = (itemId: string, date: Date, timeSlot?: TimeSlot) => {
    if (timeSlot) {
      const [hours, minutes] = timeSlot.time.split(':').map(Number)
      date = setHours(setMinutes(date, minutes), hours)
    }
    
    setScheduledItems(prev => ({
      ...prev,
      [itemId]: date
    }))
    
    toast.success(`Scheduled for ${format(date, 'MMM d, h:mm a')}`)
  }

  const applyAutomationRules = () => {
    const selectedItems = getSelectedItems()
    const queue: ContentItem[] = []

    selectedItems.forEach(item => {
      const applicableRules = automationRules.filter(rule => 
        rule.enabled && rule.condition(item)
      )

      if (applicableRules.length > 0) {
        // Apply the first matching rule
        const rule = applicableRules[0]
        
        switch (rule.action) {
          case 'publish-immediately':
            item.scheduledTime = new Date()
            break
          case 'schedule-optimal':
            // Find best time slot
            const platforms = item.platforms || ['instagram']
            const platformTimes = platforms.flatMap(p => OPTIMAL_TIMES[p] || [])
            const bestTime = platformTimes.sort((a, b) => b.engagement - a.engagement)[0]
            
            if (bestTime) {
              const [hours, minutes] = bestTime.time.split(':').map(Number)
              const scheduledDate = setHours(setMinutes(selectedDate || new Date(), minutes), hours)
              item.scheduledTime = scheduledDate
            }
            break
          case 'cross-post':
            item.platforms = ['instagram', 'tiktok', 'twitter', 'linkedin']
            break
        }
      }

      // Apply manual scheduling if set
      if (scheduledItems[item.id]) {
        item.scheduledTime = scheduledItems[item.id]
      }

      queue.push(item)
    })

    setPublishingQueue(queue)
    toast.success(`Applied automation rules to ${queue.length} items`)
  }

  const calculateOptimalTime = (item: ContentItem): string => {
    const platform = item.metadata?.platform || 'instagram'
    const times = OPTIMAL_TIMES[platform] || OPTIMAL_TIMES.instagram
    const bestTime = times.sort((a, b) => b.engagement - a.engagement)[0]
    return bestTime.time
>>>>>>> 7184e73 (Add new files and configurations for project setup)
  }

  const handleContinue = async () => {
    if (!user?.id) {
      toast.error('Please sign in to continue')
      return
    }

    const selectedItems = getSelectedItems()
<<<<<<< HEAD
    if (selectedItems.length === 0) return
=======
    
    if (selectedItems.length === 0) {
      toast.error('No content selected. Please select content to publish.')
      return
    }

    // Apply automation rules if enabled
    if (automationRules.some(rule => rule.enabled)) {
      applyAutomationRules()
    }
>>>>>>> 7184e73 (Add new files and configurations for project setup)

    setIsNavigating(true)
    
    try {
<<<<<<< HEAD
      // Save staging session
=======
      if (onPublish) {
        onPublish(publishingQueue.length > 0 ? publishingQueue : selectedItems)
        setIsNavigating(false)
        return
      }
      
      // Save and navigate
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      const result = await StagingSessionsService.saveStagingSession(
        user.id,
        project.id,
        {
          ids: selectedItems.map(item => item.id),
          items: selectedItems
        }
      )
      
      if (!result.success) {
        toast.error(result.error || 'Failed to save staging data')
        return
      }
      
<<<<<<< HEAD
      // Navigate to staging page
      router.push(`/projects/${project.id}/stage`)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error in handleContinue:', error)
      }
=======
      sessionStorage.setItem('selectedContent', JSON.stringify(selectedItems))
      router.push(`/projects/${project.id}/stage`)
    } catch (error) {
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsNavigating(false)
    }
  }

<<<<<<< HEAD
  useEffect(() => {
    const selected = getSelectedItems()
    setSelectedContentItems(selected)
  }, [selectedContent])

  const selectedCount = Object.values(selectedContent).filter(v => v).length

  // Group content by type
  const groupedContent = contentItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, ContentItem[]>)

  return (
    <Card 
      className={cn(
        "border-0 transition-all duration-500",
        isHighlighted && "ring-2 ring-primary ring-offset-2",
        className
      )} 
      id="publish-content-selection"
    >
      <CardHeader className={cn(
        "pb-4",
        isHighlighted && "animate-pulse"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <IconRocket className="h-5 w-5" />
              Select Content to Publish
            </CardTitle>
            <CardDescription className="mt-1">
              Choose the content you want to publish and continue to the staging tool
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {selectedCount} selected
              </Badge>
            )}
            <Button
              onClick={handleContinue}
              disabled={selectedCount === 0 || isNavigating}
              className={cn(
                "bg-gradient-to-r from-blue-600 to-purple-600",
                "hover:from-blue-700 hover:to-purple-700",
                (selectedCount === 0 || isNavigating) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isNavigating ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Continue to Stage
                  <IconArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {contentItems.length === 0 ? (
          <div className="text-center py-16">
            <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Content Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Generate some content first (clips, blog posts, or images) to get started with publishing.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            {contentItems.length > 1 && (
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="text-sm text-muted-foreground">
                  {selectedCount === 0 ? 
                    "Select content to publish by clicking the cards below" : 
                    `${selectedCount} of ${contentItems.length} items selected`
                  }
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    disabled={selectedCount === contentItems.filter(item => item.ready).length}
                  >
                    Select All
                  </Button>
                  {selectedCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearAll}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Long Form Video */}
                {groupedContent.longform && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wide">
                      <IconVideo className="h-4 w-4" />
                      Long Form Video
                    </h3>
                    <div className="space-y-3">
                      {groupedContent.longform.map(item => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          isSelected={selectedContent[item.id] || false}
                          onToggle={handleContentToggle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Clips */}
                {groupedContent.clip && groupedContent.clip.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wide">
                      <IconScissors className="h-4 w-4" />
                      Video Clips ({groupedContent.clip.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupedContent.clip.map(item => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          isSelected={selectedContent[item.id] || false}
                          onToggle={handleContentToggle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Blog Posts */}
                {groupedContent.blog && groupedContent.blog.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wide">
                      <IconArticle className="h-4 w-4" />
                      Blog Posts ({groupedContent.blog.length})
                    </h3>
                    <div className="space-y-3">
                      {groupedContent.blog.map(item => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          isSelected={selectedContent[item.id] || false}
                          onToggle={handleContentToggle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Images */}
                {groupedContent.image && groupedContent.image.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wide">
                      <IconPhoto className="h-4 w-4" />
                      AI Generated Images ({groupedContent.image.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {groupedContent.image.map(item => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          isSelected={selectedContent[item.id] || false}
                          onToggle={handleContentToggle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Posts */}
                {groupedContent.social && groupedContent.social.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2 text-sm uppercase text-muted-foreground tracking-wide">
                      <IconShare2 className="h-4 w-4" />
                      Social Posts ({groupedContent.social.length})
                    </h3>
                    <div className="space-y-3">
                      {groupedContent.social.map(item => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          isSelected={selectedContent[item.id] || false}
                          onToggle={handleContentToggle}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Action Bar */}
            {selectedCount > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Selected content:</span>
                    <div className="flex items-center gap-2">
                      {Object.entries(
                        getSelectedItems().reduce((acc, item) => {
                          acc[item.type] = (acc[item.type] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => {
                        const Icon = getContentIcon(type)
                        return (
                          <Badge key={type} variant="secondary" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {count} {type}{count > 1 ? 's' : ''}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                  <Button
                    onClick={handleContinue}
                    disabled={isNavigating}
                    className={cn(
                      "bg-gradient-to-r from-blue-600 to-purple-600",
                      "hover:from-blue-700 hover:to-purple-700",
                      isNavigating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isNavigating ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <IconSparkles className="h-4 w-4 mr-2" />
                        Continue with {selectedCount} items
                        <IconArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Content Card Component
function ContentCard({ 
  item, 
  isSelected, 
  onToggle 
}: { 
  item: ContentItem
  isSelected: boolean
  onToggle: (id: string) => void 
}) {
  const Icon = getContentIcon(item.type)
  
  const renderPreview = () => {
    switch (item.type) {
      case 'clip':
        return item.preview ? (
          <div 
            className="aspect-[9/16] bg-black rounded-lg overflow-hidden max-w-[160px] mx-auto relative"
            style={{ isolation: 'isolate' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <video
                src={item.preview}
                className="object-contain"
                style={{ 
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                muted
                playsInline
                preload="metadata"
                controls={false}
                onMouseEnter={(e) => {
                  const video = e.currentTarget
                  video.style.zIndex = '1'
                  video.play().catch(() => {})
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget
                  video.style.zIndex = 'auto'
                  video.pause()
                  video.currentTime = 0
                }}
              />
            </div>
          </div>
        ) : (
          <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center max-w-[160px] mx-auto">
            <IconVideo className="h-8 w-8 text-muted-foreground" />
          </div>
        )
      
      case 'longform':
        return item.preview ? (
          <div 
            className="aspect-video bg-black rounded-lg overflow-hidden relative"
            style={{ isolation: 'isolate' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <video
                src={item.preview}
                className="object-contain"
                style={{ 
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                muted
                playsInline
                preload="metadata"
                controls={false}
                poster={item.metadata?.thumbnail}
                onMouseEnter={(e) => {
                  const video = e.currentTarget
                  video.style.zIndex = '1'
                  video.play().catch(() => {})
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget
                  video.style.zIndex = 'auto'
                  video.pause()
                  video.currentTime = 0
                }}
              />
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <IconVideo className="h-8 w-8 text-muted-foreground" />
          </div>
        )
      
      case 'image':
        return item.preview ? (
          <div className="w-full h-full relative">
            <img 
              src={item.preview} 
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <IconPhoto className="h-8 w-8 text-muted-foreground" />
          </div>
        )
      
      case 'blog':
      case 'social':
        return null // These will be handled differently
      
      default:
        return null
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-lg border cursor-pointer transition-all",
        isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "hover:border-primary/50",
        !item.ready && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => item.ready && onToggle(item.id)}
    >
      <div className={cn(
        "p-4",
        item.type === 'image' && "p-2"
      )}>
        {/* Image type has a different layout */}
        {item.type === 'image' ? (
          <div className="space-y-2">
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
              {renderPreview()}
            </div>
            <div className="flex items-center gap-2 px-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(item.id)}
                disabled={!item.ready}
                className="flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{item.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Default layout for other content types */
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(item.id)}
              disabled={!item.ready}
              className="mt-0.5"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
                {!item.ready && (
                  <Badge variant="outline" className="text-xs">
                    Processing
                  </Badge>
                )}
              </div>
              
              {/* Preview for video content */}
              {(item.type === 'clip' || item.type === 'longform') && (
                <div className="mt-3">
                  {renderPreview()}
                </div>
              )}
              
              {/* Text preview for blog/social */}
              {(item.type === 'blog' || item.type === 'social') && item.preview && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  <p className="line-clamp-2">{item.preview}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function getContentIcon(type: string) {
  switch (type) {
    case 'clip': return IconScissors
    case 'blog': return IconArticle
    case 'social': return IconShare2
    case 'longform': return IconVideo
    case 'image': return IconPhoto
    case 'carousel': return IconPhoto
    default: return IconFileText
  }
=======
  const selectedCount = Object.values(selectedContent).filter(v => v).length
  const totalReady = contentItems.filter(item => item.ready).length
  const hasContent = Object.values(contentItems).length > 0

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Enhanced Header with Visual Polish */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Publishing Engine
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Transform and optimize content for maximum impact
              </p>
            </div>
            <div className="flex items-center gap-4">
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Switch
                  id="automation"
                  checked={showAutomation}
                  onCheckedChange={setShowAutomation}
                />
                <Label htmlFor="automation" className="flex items-center gap-2 cursor-pointer">
                  <IconRobot className="h-4 w-4" />
                  Automation
                </Label>
              </motion.div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-primary blur-2xl" />
        </div>
      </motion.div>

      {/* Smooth Automation Rules Transition */}
      <AnimatePresence>
        {showAutomation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automation Rules</CardTitle>
                <CardDescription>
                  Set rules to automatically process and schedule content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automationRules.map((rule, index) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => {
                            setAutomationRules(prev => prev.map(r => 
                              r.id === rule.id ? { ...r, enabled: checked } : r
                            ))
                          }}
                        />
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.id === 'auto-publish-high' && 'Content with score ≥ 85%'}
                            {rule.id === 'schedule-optimal' && 'Uses platform analytics for best times'}
                            {rule.id === 'cross-post' && 'Content with score ≥ 70%'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <IconSettings className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Bulk Operations Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedCount} items selected</p>
                    <p className="text-sm text-muted-foreground">Choose a bulk operation to transform content</p>
                  </div>
                  <div className="flex gap-2">
                    {bulkOperations.map(operation => {
                      const applicableCount = getSelectedItems().filter(operation.applicable).length
                      const Icon = operation.icon
                      
                      return (
                        <motion.div
                          key={operation.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkOperation(operation)}
                            disabled={applicableCount === 0 || bulkProcessing !== null}
                            className="gap-2"
                          >
                            {bulkProcessing === operation.id ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                            {operation.name}
                            {applicableCount > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {applicableCount}
                              </Badge>
                            )}
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasContent ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <motion.div 
              className="rounded-full bg-muted p-6 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <IconAlertCircle className="h-12 w-12 text-muted-foreground" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">No Content Available</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You need to generate some content before you can publish. Start by creating clips, blog posts, or social media content.
            </p>
            <Button 
              size="lg" 
              onClick={() => router.push(`/projects/${project.id}`)}
              className="gap-2"
            >
              <IconArrowRight className="h-4 w-4" />
              Back to Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Enhanced Content Grid with Calendar */}
          <div className="space-y-6">
            {/* Toolbar with Filters and View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Available Content</h2>
                <Badge variant="secondary">{filteredContent.length} items</Badge>
              </div>
              <div className="flex items-center gap-2">
                {/* Calendar Toggle */}
                <Popover open={showScheduler} onOpenChange={setShowScheduler}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "gap-2",
                        selectedDate && "text-primary"
                      )}
                    >
                      <IconCalendar className="h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Schedule'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Tabs defaultValue="calendar" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        <TabsTrigger value="optimal">Optimal Times</TabsTrigger>
                      </TabsList>
                      <TabsContent value="calendar" className="mt-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </TabsContent>
                      <TabsContent value="optimal" className="p-4">
                        <div className="space-y-4">
                          <p className="text-sm font-medium">Best times to post today:</p>
                          {Object.entries(OPTIMAL_TIMES).map(([platform, times]) => (
                            <div key={platform} className="space-y-2">
                              <p className="text-xs text-muted-foreground capitalize">{platform}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {times.map((slot) => (
                                  <Button
                                    key={`${platform}-${slot.time}`}
                                    variant="outline"
                                    size="sm"
                                    className="justify-between text-xs"
                                    onClick={() => {
                                      const selected = getSelectedItems()
                                      if (selected.length > 0) {
                                        selected.forEach(item => {
                                          handleScheduleItem(item.id, selectedDate || new Date(), slot)
                                        })
                                        setShowScheduler(false)
                                      }
                                    }}
                                  >
                                    <span>{slot.time}</span>
                                    <Badge variant="secondary" className="ml-1">
                                      {slot.engagement}%
                                    </Badge>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </PopoverContent>
                </Popover>

                {/* Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="clip">Video Clips</SelectItem>
                    <SelectItem value="longform">Full Videos</SelectItem>
                    <SelectItem value="blog">Blog Posts</SelectItem>
                    <SelectItem value="social">Social Posts</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="carousel">Carousels</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy as any}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">By Score</SelectItem>
                    <SelectItem value="title">By Title</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex items-center rounded-md border">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('list')}
                  >
                    <IconLayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <IconLayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedCount === totalReady ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Content Display with Smooth Transitions */}
            <ScrollArea className="h-[600px] pr-4">
              <AnimatePresence mode="popLayout">
                <motion.div 
                  className={cn(
                    "gap-4",
                    viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                      : "space-y-4"
                  )}
                  layout
                >
                  {filteredContent.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.2,
                        delay: index * 0.02
                      }}
                    >
                      <Card 
                        className={cn(
                          "transition-all hover:shadow-lg cursor-pointer",
                          selectedContent[item.id] && "ring-2 ring-primary",
                          !item.ready && "opacity-50",
                          viewMode === 'grid' && "h-full"
                        )}
                        onClick={() => item.ready && handleContentToggle(item.id)}
                      >
                        <CardContent className="p-4">
                          <div className={cn(
                            "gap-4",
                            viewMode === 'grid' ? "space-y-3" : "flex items-start"
                          )}>
                            <div 
                              className={viewMode === 'list' ? "mr-4" : ""}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={selectedContent[item.id] || false}
                                onCheckedChange={() => handleContentToggle(item.id)}
                                disabled={!item.ready}
                                className="mt-1"
                              />
                            </div>
                            
                            {/* Content Details */}
                            <div className="flex-1 space-y-3">
                              <div className={cn(
                                "justify-between",
                                viewMode === 'grid' ? "space-y-2" : "flex items-start"
                              )}>
                                <div className="space-y-1">
                                  <h4 className="font-medium line-clamp-2">{item.title}</h4>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                <div className={cn(
                                  "flex items-center gap-2",
                                  viewMode === 'grid' && "mt-2"
                                )}>
                                  {item.score && (
                                    <Badge 
                                      variant={item.score >= 80 ? "default" : item.score >= 60 ? "secondary" : "outline"}
                                      className="gap-1"
                                    >
                                      <IconTrendingUp className="h-3 w-3" />
                                      {item.score}%
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="capitalize">
                                    {item.type}
                                  </Badge>
                                  {scheduledItems[item.id] && (
                                    <Badge variant="secondary" className="gap-1">
                                      <IconCalendarTime className="h-3 w-3" />
                                      {format(scheduledItems[item.id], 'MMM d')}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Platform Captions Preview (List View Only) */}
                              {viewMode === 'list' && item.publicationCaptions && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {Object.entries(item.publicationCaptions).slice(0, 4).map(([platform, caption]) => (
                                    <div key={platform} className="text-xs p-2 bg-muted rounded">
                                      <p className="font-medium capitalize mb-1">{platform}</p>
                                      <p className="text-muted-foreground line-clamp-2">{caption as string}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Quick Actions */}
                              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                {item.type === 'clip' && (
                                  <>
                                    <Button variant="ghost" size="sm" className="h-8">
                                      <IconPlayerPlay className="h-4 w-4 mr-1" />
                                      Preview
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8">
                                      <IconDownload className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  </>
                                )}
                                {item.type === 'blog' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8"
                                    onClick={() => onEditBlog?.(item.metadata.id)}
                                  >
                                    <IconFileText className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8">
                                      <IconCalendarEvent className="h-4 w-4 mr-1" />
                                      Schedule
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">Quick Schedule</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleScheduleItem(item.id, new Date())}
                                        >
                                          Now
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleScheduleItem(item.id, addDays(new Date(), 1))}
                                        >
                                          Tomorrow
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleScheduleItem(item.id, addDays(new Date(), 7))}
                                        >
                                          Next Week
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setShowScheduler(true)}
                                        >
                                          Custom
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </div>

          {/* Enhanced Publishing Queue Preview */}
          <AnimatePresence>
            {publishingQueue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconCalendarStats className="h-5 w-5" />
                      Publishing Queue
                    </CardTitle>
                    <CardDescription>
                      {publishingQueue.length} items ready with automation rules applied
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {publishingQueue.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              <span className="text-sm font-medium">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.scheduledTime && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <IconClock className="h-3 w-3" />
                                  {format(item.scheduledTime, 'MMM d, h:mm a')}
                                </Badge>
                              )}
                              {item.platforms && (
                                <Badge variant="outline" className="text-xs">
                                  {item.platforms.length} platforms
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Sticky Action Bar */}
          <motion.div 
            className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="py-4">
              <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">
                      {selectedCount === 0 
                        ? 'Select content to continue' 
                        : `${selectedCount} items ready`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {automationRules.filter(r => r.enabled).length} automation rules active
                      {Object.keys(scheduledItems).length > 0 && 
                        ` • ${Object.keys(scheduledItems).length} items scheduled`
                      }
                    </p>
                  </div>
                  {selectedCount > 0 && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const items = getSelectedItems()
                          const data = items.map(item => ({
                            title: item.title,
                            type: item.type,
                            score: item.score,
                            platforms: Object.keys(item.publicationCaptions || {}),
                            scheduled: scheduledItems[item.id] 
                              ? format(scheduledItems[item.id], 'yyyy-MM-dd HH:mm')
                              : ''
                          }))
                          
                          const csv = [
                            ['Title', 'Type', 'Score', 'Platforms', 'Scheduled'],
                            ...data.map(row => [
                              row.title,
                              row.type,
                              row.score || 'N/A',
                              row.platforms.join(', '),
                              row.scheduled
                            ])
                          ].map(row => row.join(',')).join('\n')
                          
                          const blob = new Blob([csv], { type: 'text/csv' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `content-${project.id}-${Date.now()}.csv`
                          a.click()
                          
                          toast.success('Content list exported')
                        }}
                        className="gap-2"
                      >
                        <IconFileExport className="h-4 w-4" />
                        Export List
                      </Button>
                    </motion.div>
                  )}
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={handleContinue}
                    disabled={selectedCount === 0 || isNavigating}
                    className="min-w-[180px] gap-2"
                  >
                    {isNavigating ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IconBolt className="h-4 w-4" />
                        Continue to Staging
                        <IconChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
>>>>>>> 7184e73 (Add new files and configurations for project setup)
} 