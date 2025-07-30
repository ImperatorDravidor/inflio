"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconVideo,
  IconFileText,
  IconPhoto,
  IconSparkles,
  IconArrowRight,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconClock,
  IconEye,
  IconCheck,
  IconX,
  IconSortAscending,
  IconSortDescending,
  IconPlayerPlay,
  IconHash,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandFacebook,
  IconChevronRight,
  IconInfoCircle,
  IconAdjustments,
  IconSquareCheck,
  IconSquare,
  IconMaximize,
  IconQuote,
  IconMessageCircle,
  IconLayoutGrid,
  IconList,
  IconChecks,
  IconLayoutBoard,
  IconBrandMedium,
  IconBrandReddit,
  IconBulb,
  IconTrendingUp,
  IconLanguage,
  IconBolt,
  IconDots,
  IconCopy,
  IconTrash,
  IconEdit,
  IconChartBar,
  IconCommand,
  IconLoader2,
  IconAlertCircle,
  IconCheckbox,
  IconSquareOff
} from '@tabler/icons-react'
import React from 'react'
import type { Project, ClipData, BlogPost, SocialPost, GeneratedImage } from '@/lib/project-types'
import ReactMarkdown from 'react-markdown'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'image' | 'social' | 'caption' | 'thread' | 'quote'
  title: string
  description?: string
  content?: string
  thumbnail?: string
  duration?: number
  wordCount?: number
  tags?: string[]
  platforms?: string[]
  createdAt: string
  ready: boolean
  metadata?: any
  viralityScore?: number
  engagement?: {
    likes?: number
    shares?: number
    views?: number
  }
  // Additional fields for different content types
  imageUrl?: string
  videoUrl?: string
  captions?: any[]
  thread?: string[]
  quoteText?: string
  quoteAuthor?: string
}

interface EnhancedPublishingWorkflowV2Props {
  project: Project
  onPublish?: (selectedIds: string[]) => void
  className?: string
}

const platformIcons = {
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  facebook: IconBrandFacebook,
  medium: IconBrandMedium,
  reddit: IconBrandReddit,
}

const contentTypeConfig = {
  clip: {
    icon: IconVideo,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-950/30',
    label: 'Video Clip',
    description: 'Short-form video content'
  },
  blog: {
    icon: IconFileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-950/30',
    label: 'Blog Post',
    description: 'Long-form written content'
  },
  image: {
    icon: IconPhoto,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    hoverBg: 'hover:bg-green-100 dark:hover:bg-green-950/30',
    label: 'Image',
    description: 'Visual content and graphics'
  },
  social: {
    icon: IconHash,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-950/30',
    label: 'Social Post',
    description: 'Platform-specific social content'
  },
  caption: {
    icon: IconMessageCircle,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    hoverBg: 'hover:bg-pink-100 dark:hover:bg-pink-950/30',
    label: 'Caption',
    description: 'Video captions and descriptions'
  },
  thread: {
    icon: IconLayoutBoard,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-950/30',
    label: 'Thread',
    description: 'Multi-part social thread'
  },
  quote: {
    icon: IconQuote,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-950/30',
    label: 'Quote Card',
    description: 'Inspirational quote graphics'
  }
}

// Content preview components
const ClipPreview = ({ item }: { item: ContentItem }) => (
  <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
    {item.thumbnail ? (
      <>
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <IconPlayerPlay className="h-12 w-12 text-white" />
        </div>
      </>
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <IconVideo className="h-12 w-12 text-white/80" />
      </div>
    )}
    {item.duration && (
      <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
        {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
      </Badge>
    )}
  </div>
)

const BlogPreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-3">
    <div className="prose prose-sm dark:prose-invert max-h-40 overflow-hidden relative">
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
      {item.content ? (
        <ReactMarkdown>{item.content.slice(0, 300) + '...'}</ReactMarkdown>
      ) : (
        <p className="text-muted-foreground">{item.description || 'No preview available'}</p>
      )}
    </div>
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      {item.wordCount && (
        <span className="flex items-center gap-1">
          <IconFileText className="h-3 w-3" />
          {item.wordCount} words
        </span>
      )}
      {item.tags && item.tags.length > 0 && (
        <span className="flex items-center gap-1">
          <IconHash className="h-3 w-3" />
          {item.tags.length} tags
        </span>
      )}
    </div>
  </div>
)

const ImagePreview = ({ item }: { item: ContentItem }) => (
  <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
    {item.imageUrl || item.thumbnail ? (
      <img 
        src={item.imageUrl || item.thumbnail || ''} 
        alt={item.title}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600">
        <IconPhoto className="h-12 w-12 text-white/80" />
      </div>
    )}
  </div>
)

const SocialPreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-3">
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <p className="text-sm whitespace-pre-wrap">{item.content || item.description}</p>
    </div>
    {item.platforms && item.platforms.length > 0 && (
      <div className="flex items-center gap-2">
        {item.platforms.map(platform => {
          const Icon = platformIcons[platform as keyof typeof platformIcons]
          return Icon ? (
            <Icon key={platform} className="h-4 w-4 text-muted-foreground" />
          ) : null
        })}
      </div>
    )}
  </div>
)

const ThreadPreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-2">
    {item.thread?.slice(0, 2).map((tweet, idx) => (
      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
        <p className="line-clamp-2">{tweet}</p>
      </div>
    ))}
    {item.thread && item.thread.length > 2 && (
      <p className="text-xs text-muted-foreground text-center">
        +{item.thread.length - 2} more tweets
      </p>
    )}
  </div>
)

const QuotePreview = ({ item }: { item: ContentItem }) => (
  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg">
    <IconQuote className="h-6 w-6 text-amber-600 mb-2" />
    <p className="text-lg font-medium italic mb-2">"{item.quoteText}"</p>
    {item.quoteAuthor && (
      <p className="text-sm text-muted-foreground">— {item.quoteAuthor}</p>
    )}
  </div>
)

export function EnhancedPublishingWorkflowV2({ 
  project, 
  onPublish, 
  className 
}: EnhancedPublishingWorkflowV2Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'score'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isNavigating, setIsNavigating] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  
  // Load saved selections from sessionStorage
  useEffect(() => {
    const savedSelections = sessionStorage.getItem(`project-${project.id}-selections`)
    if (savedSelections) {
      try {
        const parsed = JSON.parse(savedSelections)
        setSelectedIds(new Set(parsed))
      } catch (e) {
        console.error('Failed to load saved selections:', e)
      }
    }
  }, [project.id])
  
  // Save selections when they change
  useEffect(() => {
    if (selectedIds.size > 0) {
      sessionStorage.setItem(
        `project-${project.id}-selections`, 
        JSON.stringify(Array.from(selectedIds))
      )
    } else {
      sessionStorage.removeItem(`project-${project.id}-selections`)
    }
  }, [selectedIds, project.id])
  
  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'a',
      ctrlKey: true,
      description: 'Select all items',
      action: () => selectAll()
    },
    {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      description: 'Deselect all items',
      action: () => deselectAll()
    },
    {
      key: '/',
      ctrlKey: true,
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[placeholder="Search content..."]') as HTMLInputElement
        searchInput?.focus()
      }
    },
    {
      key: 'g',
      description: 'Grid view',
      action: () => setViewMode('grid')
    },
    {
      key: 'l',
      description: 'List view',
      action: () => setViewMode('list')
    },
    {
      key: 'Escape',
      description: 'Close preview',
      action: () => {
        setShowPreview(false)
        setPreviewItem(null)
      }
    }
  ]
  
  useKeyboardShortcuts({ shortcuts, enabled: true })

  // Convert project content to ContentItem format
  const contentItems = useMemo(() => {
    const items: ContentItem[] = []
    
    // Add clips
    if (project.folders?.clips?.length) {
      project.folders.clips.forEach((clip: ClipData) => {
        items.push({
          id: `clip-${clip.id}`,
          type: 'clip',
          title: clip.title || `Clip ${clip.id}`,
          description: clip.description,
          thumbnail: clip.thumbnail,
          duration: clip.duration,
          tags: clip.tags,
          createdAt: clip.createdAt || new Date().toISOString(),
          ready: !!clip.exportUrl,
          viralityScore: clip.score,
          videoUrl: clip.previewUrl || clip.exportUrl
        })
      })
    }
    
    // Add blog posts
    if (project.folders?.blog?.length) {
      project.folders.blog.forEach((blog: BlogPost) => {
        items.push({
          id: `blog-${blog.id}`,
          type: 'blog',
          title: blog.title,
          description: blog.seoDescription,
          content: blog.content,
          wordCount: blog.content?.split(' ').length,
          tags: blog.tags,
          createdAt: blog.createdAt || new Date().toISOString(),
          ready: true,
          platforms: []
        })
      })
    }
    
    // Add social posts
    if (project.folders?.social?.length) {
      project.folders.social.forEach((social: SocialPost) => {
        items.push({
          id: `social-${social.id}`,
          type: 'social',
          title: `${social.platform} Post`,
          description: social.content,
          content: social.content,
          platforms: [social.platform],
          tags: social.hashtags,
          createdAt: social.createdAt || new Date().toISOString(),
          ready: social.status === 'published' || social.status === 'scheduled',
          metadata: social
        })
      })
    }
    
    // Add generated images
    if (project.folders?.images?.length) {
      project.folders.images.forEach((image: GeneratedImage) => {
        items.push({
          id: `image-${image.id}`,
          type: 'image',
          title: image.prompt?.slice(0, 50) + '...' || 'Generated Image',
          description: image.prompt,
          imageUrl: image.url || image.imageData,
          thumbnail: image.url || image.imageData,
          createdAt: image.createdAt || new Date().toISOString(),
          ready: true,
          metadata: image
        })
      })
    }
    
    return items
  }, [project])

  // Filter and sort content
  const filteredContent = useMemo(() => {
    let filtered = contentItems
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType)
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'score':
          comparison = (a.viralityScore || 0) - (b.viralityScore || 0)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [contentItems, filterType, searchQuery, sortBy, sortOrder])

  // Get content type counts
  const contentTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    contentItems.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1
    })
    return counts
  }, [contentItems])

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredContent.map(item => item.id)))
    toast.success(`Selected all ${filteredContent.length} items`)
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
    toast.info('Deselected all items')
  }
  
  const selectByType = (type: string) => {
    const typeItems = filteredContent.filter(item => item.type === type)
    const newSelection = new Set(selectedIds)
    typeItems.forEach(item => newSelection.add(item.id))
    setSelectedIds(newSelection)
    toast.success(`Selected ${typeItems.length} ${type} items`)
  }
  
  const invertSelection = () => {
    const newSelection = new Set<string>()
    filteredContent.forEach(item => {
      if (!selectedIds.has(item.id)) {
        newSelection.add(item.id)
      }
    })
    setSelectedIds(newSelection)
    toast.success('Inverted selection')
  }
  
  // Content statistics
  const stats = useMemo(() => {
    const selected = contentItems.filter(item => selectedIds.has(item.id))
    const totalDuration = selected
      .filter(item => item.type === 'clip')
      .reduce((sum, item) => sum + (item.duration || 0), 0)
    const totalWords = selected
      .filter(item => item.type === 'blog')
      .reduce((sum, item) => sum + (item.wordCount || 0), 0)
    const avgScore = selected
      .filter(item => item.viralityScore)
      .reduce((sum, item, _, arr) => sum + (item.viralityScore || 0) / arr.length, 0)
      
    return {
      totalDuration,
      totalWords,
      avgScore: Math.round(avgScore),
      readyCount: selected.filter(item => item.ready).length,
      processingCount: selected.filter(item => !item.ready).length
    }
  }, [contentItems, selectedIds])

  const handleContinue = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one content item')
      return
    }
    
    setIsNavigating(true)
    
    // If onPublish callback is provided, use it
    if (onPublish) {
      // Call the callback with selected IDs
      onPublish(Array.from(selectedIds))
      setIsNavigating(false)
    } else {
      // Otherwise, navigate directly
      sessionStorage.setItem('selectedContentIds', JSON.stringify(Array.from(selectedIds)))
      sessionStorage.setItem('projectData', JSON.stringify(project))
      
      setTimeout(() => {
        router.push(`/projects/${project.id}/stage`)
      }, 500)
    }
  }

  const getContentPreview = (item: ContentItem) => {
    switch (item.type) {
      case 'clip':
        return <ClipPreview item={item} />
      case 'blog':
        return <BlogPreview item={item} />
      case 'image':
        return <ImagePreview item={item} />
      case 'social':
      case 'caption':
        return <SocialPreview item={item} />
      case 'thread':
        return <ThreadPreview item={item} />
      case 'quote':
        return <QuotePreview item={item} />
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Select Content to Publish
              {isLoading && <IconLoader2 className="h-5 w-5 animate-spin" />}
            </h2>
            <p className="text-muted-foreground mt-1">
              Choose the content you want to stage for publishing across platforms
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <IconList className="h-4 w-4" /> : <IconLayoutGrid className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to {viewMode === 'grid' ? 'list' : 'grid'} view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <IconCommand className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">Keyboard Shortcuts</p>
                    <p>Ctrl+A: Select all</p>
                    <p>Ctrl+/: Search</p>
                    <p>G: Grid view</p>
                    <p>L: List view</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Badge variant="secondary" className="gap-1">
              <IconChecks className="h-3 w-3" />
              {selectedIds.size} / {contentItems.length} selected
            </Badge>
          </div>
        </div>
        
        {/* Statistics Bar */}
        {selectedIds.size > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <IconVideo className="h-4 w-4 text-purple-600" />
                  <span>{Math.floor(stats.totalDuration / 60)} min video</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconFileText className="h-4 w-4 text-blue-600" />
                  <span>{stats.totalWords.toLocaleString()} words</span>
                </div>
                {stats.avgScore > 0 && (
                  <div className="flex items-center gap-2">
                    <IconTrendingUp className="h-4 w-4 text-green-600" />
                    <span>{stats.avgScore}% avg score</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-green-600" />
                  <span>{stats.readyCount} ready</span>
                </div>
                {stats.processingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <IconClock className="h-4 w-4 text-orange-600" />
                    <span>{stats.processingCount} processing</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Types ({contentItems.length})
                </SelectItem>
                {Object.entries(contentTypeConfig).map(([type, config]) => {
                  const count = contentTypeCounts[type] || 0
                  if (count === 0) return null
                  
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("h-4 w-4", config.color)} />
                        {config.label} ({count})
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="score">Score</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <IconSortAscending className="h-4 w-4" /> : <IconSortDescending className="h-4 w-4" />}
            </Button>

            {/* Select Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <IconCheckbox className="h-4 w-4" />
                  Select
                  <IconChevronRight className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Selection Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={selectAll}>
                  <IconChecks className="h-4 w-4 mr-2" />
                  Select All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={deselectAll}>
                  <IconSquareOff className="h-4 w-4 mr-2" />
                  Deselect All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={invertSelection}>
                  <IconAdjustments className="h-4 w-4 mr-2" />
                  Invert Selection
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Select by Type</DropdownMenuLabel>
                {Object.entries(contentTypeConfig).map(([type, config]) => {
                  const count = contentTypeCounts[type] || 0
                  if (count === 0) return null
                  
                  return (
                    <DropdownMenuItem 
                      key={type}
                      onClick={() => selectByType(type)}
                    >
                      <config.icon className={cn("h-4 w-4 mr-2", config.color)} />
                      {config.label} ({count})
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid/List */}
      <ScrollArea className="h-[600px] pr-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
            )}>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mx-auto max-w-sm space-y-4">
                  {searchQuery || filterType !== 'all' ? (
                    <>
                      <IconSearch className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">No results found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search or filters to find content
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchQuery('')
                          setFilterType('all')
                        }}
                      >
                        Clear filters
                      </Button>
                    </>
                  ) : contentItems.length === 0 ? (
                    <>
                      <IconSparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">No content generated yet</h3>
                        <p className="text-muted-foreground">
                          Generate some content from your video to get started
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <IconAlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Something went wrong</h3>
                        <p className="text-muted-foreground">
                          Unable to load content. Please try refreshing the page
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
            )}>
              {filteredContent.map((item, index) => {
                const config = contentTypeConfig[item.type as keyof typeof contentTypeConfig]
                const isSelected = selectedIds.has(item.id)
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "group cursor-pointer transition-all duration-200",
                        config.borderColor,
                        isSelected && config.bgColor,
                        config.hoverBg,
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => toggleSelection(item.id)}
                    >
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              config.bgColor
                            )}>
                              <config.icon className={cn("h-5 w-5", config.color)} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Preview */}
                        <div className="mb-3">
                          {getContentPreview(item)}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {item.ready ? (
                              <Badge variant="secondary" className="text-xs">
                                <IconCheck className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <IconClock className="h-3 w-3 mr-1" />
                                Processing
                              </Badge>
                            )}
                            {item.viralityScore && (
                              <Badge variant="outline" className="text-xs">
                                <IconTrendingUp className="h-3 w-3 mr-1" />
                                {item.viralityScore}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewItem(item)
                                      setShowPreview(true)
                                    }}
                                  >
                                    <IconMaximize className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Preview</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconDots className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleSelection(item.id)
                                  }}
                                >
                                  {isSelected ? (
                                    <>
                                      <IconSquareOff className="h-4 w-4 mr-2" />
                                      Deselect
                                    </>
                                  ) : (
                                    <>
                                      <IconSquareCheck className="h-4 w-4 mr-2" />
                                      Select
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(item.content || item.description || item.title)
                                    toast.success('Copied to clipboard')
                                  }}
                                >
                                  <IconCopy className="h-4 w-4 mr-2" />
                                  Copy content
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewItem(item)
                                    setShowPreview(true)
                                  }}
                                >
                                  <IconEye className="h-4 w-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Actions */}
      <Card className="relative overflow-hidden">
        {isNavigating && (
          <div className="absolute top-0 left-0 right-0 h-1">
            <Progress className="h-1" value={75} />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">
                {selectedIds.size > 0 ? (
                  <>
                    {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
                  </>
                ) : (
                  <>No items selected</>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedIds.size > 0 ? (
                  <>Ready to stage for publishing across platforms</>
                ) : (
                  <>Select at least one content item to continue</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && !isNavigating && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  className="text-muted-foreground"
                >
                  Clear selection
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={selectedIds.size === 0 || isNavigating}
                size="default"
                className={cn(
                  "gap-2 min-w-[160px]",
                  isNavigating && "animate-pulse"
                )}
              >
                {isNavigating ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    Continue to Staging
                    <IconArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {contentTypeConfig[previewItem.type as keyof typeof contentTypeConfig].icon && 
                    React.createElement(contentTypeConfig[previewItem.type as keyof typeof contentTypeConfig].icon, {
                      className: cn("h-5 w-5", contentTypeConfig[previewItem.type as keyof typeof contentTypeConfig].color)
                    })
                  }
                  {previewItem.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {previewItem.type === 'clip' && previewItem.videoUrl && (
                  <video
                    src={previewItem.videoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                )}
                {previewItem.type === 'blog' && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{previewItem.content || ''}</ReactMarkdown>
                  </div>
                )}
                {previewItem.type === 'image' && (
                  <img
                    src={previewItem.imageUrl || previewItem.thumbnail || ''}
                    alt={previewItem.title}
                    className="w-full rounded-lg"
                  />
                )}
                {previewItem.type === 'thread' && (
                  <div className="space-y-3">
                    {previewItem.thread?.map((tweet, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                          <p className="flex-1">{tweet}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {previewItem.type === 'quote' && (
                  <QuotePreview item={previewItem} />
                )}
                {(previewItem.type === 'social' || previewItem.type === 'caption') && (
                  <SocialPreview item={previewItem} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 