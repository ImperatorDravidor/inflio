"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  IconBolt
} from '@tabler/icons-react'
import React from 'react'
import type { Project, ClipData, BlogPost } from '@/lib/project-types'
import ReactMarkdown from 'react-markdown'

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

  // Convert project content to ContentItem format
  const contentItems = useMemo(() => {
    const items: ContentItem[] = []
    
    // Add clips
    if (project.clips?.length) {
      project.clips.forEach((clip: ClipData) => {
        items.push({
          id: `clip-${clip.id}`,
          type: 'clip',
          title: clip.title || `Clip ${clip.id}`,
          description: clip.description,
          thumbnail: clip.thumbnail_url,
          duration: clip.duration,
          tags: clip.tags,
          createdAt: clip.created_at || new Date().toISOString(),
          ready: !!clip.video_url,
          viralityScore: clip.virality_score,
          videoUrl: clip.video_url
        })
      })
    }
    
    // Add blog posts
    if (project.blog_posts?.length) {
      project.blog_posts.forEach((blog: BlogPost) => {
        items.push({
          id: `blog-${blog.id}`,
          type: 'blog',
          title: blog.title,
          description: blog.meta_description,
          content: blog.content,
          wordCount: blog.content?.split(' ').length,
          tags: blog.tags,
          createdAt: blog.created_at || new Date().toISOString(),
          ready: true,
          platforms: blog.platforms
        })
      })
    }
    
    // Add social graphics
    if (project.social_graphics?.length) {
      project.social_graphics.forEach((graphic: any) => {
        items.push({
          id: `image-${graphic.id}`,
          type: 'image',
          title: graphic.alt_text || 'Social Graphic',
          description: graphic.prompt,
          imageUrl: graphic.image_url,
          thumbnail: graphic.image_url,
          createdAt: graphic.created_at || new Date().toISOString(),
          ready: true,
          platforms: graphic.platforms
        })
      })
    }
    
    // Add captions
    if (project.optimized_captions?.length) {
      project.optimized_captions.forEach((caption: any, idx: number) => {
        items.push({
          id: `caption-${idx}`,
          type: 'caption',
          title: `${caption.platform} Caption`,
          description: caption.caption,
          content: caption.caption,
          platforms: [caption.platform],
          createdAt: new Date().toISOString(),
          ready: true,
          tags: caption.hashtags
        })
      })
    }
    
    // Add thread
    if (project.thread?.length) {
      items.push({
        id: 'thread-1',
        type: 'thread',
        title: 'Twitter/X Thread',
        description: project.thread[0],
        thread: project.thread,
        platforms: ['twitter'],
        createdAt: new Date().toISOString(),
        ready: true
      })
    }
    
    // Add quote cards
    if (project.quote_cards?.length) {
      project.quote_cards.forEach((quote: any, idx: number) => {
        items.push({
          id: `quote-${idx}`,
          type: 'quote',
          title: 'Quote Card',
          quoteText: quote.text,
          quoteAuthor: quote.author,
          imageUrl: quote.image_url,
          createdAt: new Date().toISOString(),
          ready: true
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
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Select Content to Publish</h2>
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
          
          <Badge variant="secondary" className="gap-1">
            <IconChecks className="h-3 w-3" />
            {selectedIds.size} / {contentItems.length} selected
          </Badge>
        </div>
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid/List */}
      <ScrollArea className="h-[600px] pr-4">
        <AnimatePresence mode="wait">
          {filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <IconInfoCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No content found matching your filters</p>
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? (
                <>Selected {selectedIds.size} items to stage for publishing</>
              ) : (
                <>Select content to continue</>
              )}
            </div>
            <Button
              onClick={handleContinue}
              disabled={selectedIds.size === 0 || isNavigating}
              className="gap-2"
            >
              {isNavigating ? (
                <>
                  <IconBolt className="h-4 w-4 animate-pulse" />
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