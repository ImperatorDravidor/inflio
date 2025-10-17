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
  IconSquareOff,
  IconPlaylist,
  IconArticle,
  IconPhotoScan
} from '@tabler/icons-react'
import React from 'react'
import type { Project, ClipData, BlogPost, SocialPost, GeneratedImage } from '@/lib/project-types'
import ReactMarkdown from 'react-markdown'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'image' | 'social' | 'caption' | 'thread' | 'quote' | 'longform'
  title: string
  description?: string
  content?: string
  thumbnail?: string
  duration?: number
  wordCount?: number
  hasSubtitles?: boolean
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
  imageUrl?: string
  videoUrl?: string
  captions?: any[]
  thread?: string[]
  quoteText?: string
  quoteAuthor?: string
  hasSubtitles?: boolean
}

interface EnhancedPublishingWorkflowV3Props {
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
    description: 'Short-form video content',
    gridCols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
  },
  longform: {
    icon: IconPlayerPlay,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    hoverBg: 'hover:bg-cyan-100 dark:hover:bg-cyan-950/30',
    label: 'Long Form Video',
    description: 'Full-length video with subtitles',
    gridCols: 'grid-cols-1 md:grid-cols-2'
  },
  blog: {
    icon: IconFileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-950/30',
    label: 'Blog Post',
    description: 'Long-form written content',
    gridCols: 'grid-cols-1 md:grid-cols-2'
  },
  image: {
    icon: IconPhoto,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    hoverBg: 'hover:bg-green-100 dark:hover:bg-green-950/30',
    label: 'Image',
    description: 'Visual content and graphics',
    gridCols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
  },
  social: {
    icon: IconHash,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-950/30',
    label: 'Social Post',
    description: 'Platform-specific social content',
    gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  },
  caption: {
    icon: IconMessageCircle,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    hoverBg: 'hover:bg-pink-100 dark:hover:bg-pink-950/30',
    label: 'Caption',
    description: 'Video captions and descriptions',
    gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  },
  thread: {
    icon: IconLayoutBoard,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-950/30',
    label: 'Thread',
    description: 'Multi-part social thread',
    gridCols: 'grid-cols-1 md:grid-cols-2'
  },
  quote: {
    icon: IconQuote,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-950/30',
    label: 'Quote Card',
    description: 'Inspirational quote graphics',
    gridCols: 'grid-cols-2 sm:grid-cols-3'
  }
}

// Content preview components
const ClipPreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-3">
    <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden group mx-auto" style={{ maxWidth: '200px' }}>
      {item.thumbnail || item.videoUrl ? (
        <>
          {item.videoUrl && (
            <video
              src={item.videoUrl}
              poster={item.thumbnail}
              className="w-full h-full object-cover"
              muted
              playsInline
              onMouseEnter={(e) => {
                e.currentTarget.play().catch(() => {})
              }}
              onMouseLeave={(e) => {
                e.currentTarget.pause()
                e.currentTarget.currentTime = 0
              }}
            />
          )}
          {!item.videoUrl && item.thumbnail && (
            <img 
              src={item.thumbnail} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center justify-center">
              <IconPlayerPlay className="h-10 w-10 text-white drop-shadow-lg mb-2" />
              <span className="text-xs text-white/80">Preview on hover</span>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 p-4">
          <IconVideo className="h-12 w-12 text-white/80 mb-2" />
          <span className="text-xs text-white/60">No preview</span>
        </div>
      )}
      {item.duration && (
        <Badge className="absolute top-2 right-2 bg-black/90 text-white text-xs backdrop-blur">
          {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
        </Badge>
      )}
    </div>
    
    {/* Metadata */}
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-center line-clamp-2">{item.title}</h4>
      {item.viralityScore && (
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <IconTrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium">{item.viralityScore}%</span>
          </div>
        </div>
      )}
    </div>
  </div>
)

const BlogPreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-4">
    {item.thumbnail && (
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-4">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>
    )}
    
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold line-clamp-2 mb-2">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}
      </div>
      
      <div className="prose prose-sm dark:prose-invert max-h-32 overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
        {item.content ? (
          <ReactMarkdown>{item.content.slice(0, 400) + '...'}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground italic">No content preview available</p>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {item.wordCount && (
          <span className="flex items-center gap-1">
            <IconFileText className="h-3 w-3" />
            {item.wordCount.toLocaleString()} words
          </span>
        )}
        {item.tags && item.tags.length > 0 && (
          <span className="flex items-center gap-1">
            <IconHash className="h-3 w-3" />
            {item.tags.length} tags
          </span>
        )}
        <span className="flex items-center gap-1">
          <IconClock className="h-3 w-3" />
          {Math.ceil((item.wordCount || 200) / 200)} min read
        </span>
      </div>
    </div>
  </div>
)

const ImagePreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-3">
    <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden group">
      {item.imageUrl || item.thumbnail ? (
        <>
          <img 
            src={item.imageUrl || item.thumbnail || ''} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-white/90 backdrop-blur"
              onClick={(e) => {
                e.stopPropagation()
                window.open(item.imageUrl || item.thumbnail || '', '_blank')
              }}
            >
              <IconMaximize className="h-4 w-4" />
              View Full Size
            </Button>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-500 to-teal-600 p-4">
          <IconPhoto className="h-12 w-12 text-white/80 mb-2" />
          <span className="text-xs text-white/60">No image</span>
        </div>
      )}
    </div>
    
    <div className="text-center space-y-1">
      <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
      {item.metadata?.style && (
        <Badge variant="outline" className="text-xs">
          {item.metadata.style}
        </Badge>
      )}
    </div>
  </div>
)

const SocialPreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-3">
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[120px]">
      <p className="text-sm whitespace-pre-wrap line-clamp-6">{item.content || item.description}</p>
    </div>
    {item.platforms && item.platforms.length > 0 && (
      <div className="flex items-center justify-center gap-2">
        {item.platforms.map(platform => {
          const Icon = platformIcons[platform as keyof typeof platformIcons]
          return Icon ? (
            <div key={platform} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : null
        })}
      </div>
    )}
    {item.tags && item.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 justify-center">
        {item.tags.slice(0, 3).map((tag, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            #{tag}
          </Badge>
        ))}
        {item.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{item.tags.length - 3}
          </Badge>
        )}
      </div>
    )}
  </div>
)

const ThreadPreview = ({ item }: { item: ContentItem }) => (
  <div className="space-y-3">
    {item.thread?.slice(0, 3).map((tweet, idx) => (
      <div key={idx} className="relative">
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-muted-foreground mt-0.5">{idx + 1}.</span>
            <p className="line-clamp-3 flex-1">{tweet}</p>
          </div>
        </div>
        {idx < 2 && item.thread && idx < item.thread.length - 1 && (
          <div className="absolute left-6 top-full h-3 w-px bg-gray-300 dark:bg-gray-700" />
        )}
      </div>
    ))}
    {item.thread && item.thread.length > 3 && (
      <p className="text-xs text-muted-foreground text-center">
        +{item.thread.length - 3} more tweets
      </p>
    )}
  </div>
)

const QuotePreview = ({ item }: { item: ContentItem }) => (
  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg text-center space-y-3">
    <IconQuote className="h-8 w-8 text-amber-600 mx-auto opacity-50" />
    <p className="text-lg font-medium italic line-clamp-4">"{item.quoteText}"</p>
    {item.quoteAuthor && (
      <p className="text-sm text-muted-foreground">— {item.quoteAuthor}</p>
    )}
  </div>
)

// Content type sections with icons
const ContentTypeSection = ({ 
  type, 
  items, 
  selectedIds,
  onToggleSelection,
  getContentPreview 
}: {
  type: string
  items: ContentItem[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  getContentPreview: (item: ContentItem) => React.ReactNode
}) => {
  const config = contentTypeConfig[type as keyof typeof contentTypeConfig]
  if (!config || items.length === 0) return null

  const sectionIcons = {
    clip: IconPlaylist,
    longform: IconPlayerPlay,
    blog: IconArticle,
    image: IconPhotoScan,
    social: IconHash,
    caption: IconMessageCircle,
    thread: IconLayoutBoard,
    quote: IconQuote
  }

  const SectionIcon = sectionIcons[type as keyof typeof sectionIcons] || config.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <SectionIcon className={cn("h-5 w-5", config.color)} />
          {config.label}
          <Badge variant="secondary" className="ml-2">{items.length}</Badge>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const allSelected = items.every(item => selectedIds.has(item.id))
            items.forEach(item => {
              if (allSelected) {
                selectedIds.delete(item.id)
              } else {
                selectedIds.add(item.id)
              }
              onToggleSelection(item.id)
            })
          }}
        >
          {items.every(item => selectedIds.has(item.id)) ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <div className={cn("grid gap-4", config.gridCols)}>
        {items.map((item, index) => (
          <ContentCard
            key={item.id}
            item={item}
            index={index}
            isSelected={selectedIds.has(item.id)}
            onToggle={onToggleSelection}
            getContentPreview={getContentPreview}
          />
        ))}
      </div>
    </div>
  )
}

// Individual content card
const ContentCard = ({ 
  item, 
  index, 
  isSelected, 
  onToggle,
  getContentPreview,
  viewMode = 'grid'
}: { 
  item: ContentItem
  index: number
  isSelected: boolean
  onToggle: (id: string) => void
  getContentPreview: (item: ContentItem) => React.ReactNode
  viewMode?: 'grid' | 'list'
}) => {
  const config = contentTypeConfig[item.type as keyof typeof contentTypeConfig]
  const [showPreview, setShowPreview] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 h-full",
          config.borderColor,
          isSelected && config.bgColor,
          config.hoverBg,
          isSelected && "ring-2 ring-primary shadow-lg",
          "hover:shadow-md"
        )}
        onClick={() => onToggle(item.id)}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Selection checkbox */}
          <div className="flex items-start justify-between mb-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(item.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDots className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPreview(true)
                  }}
                >
                  <IconEye className="h-4 w-4 mr-2" />
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content preview */}
          <div className="flex-1">
            {getContentPreview(item)}
          </div>

          {/* Status badges */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
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
            </div>
            
            <span className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detail preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {config.icon && <config.icon className={cn("h-5 w-5", config.color)} />}
              {item.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {getContentPreview(item)}
            {/* Additional details */}
            <div className="mt-6 space-y-4">
              {item.tags && item.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.metadata && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Metadata</h4>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export function EnhancedPublishingWorkflowV3({ 
  project, 
  onPublish, 
  className 
}: EnhancedPublishingWorkflowV3Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'score'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isNavigating, setIsNavigating] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

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
    
    // Add long form content (when subtitles are available)
    const folders = project.folders as any
    if (folders?.longform?.length) {
      folders.longform.forEach((video: any) => {
        items.push({
          id: `longform-${video.id}`,
          type: 'longform',
          title: video.title || 'Full Video',
          description: video.description || 'Full-length video with subtitles',
          thumbnail: video.thumbnail,
          duration: video.duration,
          videoUrl: video.videoUrl,
          hasSubtitles: video.hasSubtitles,
          createdAt: video.createdAt || new Date().toISOString(),
          ready: true,
          metadata: video
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

  const handleContinue = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one content item')
      return
    }
    
    setIsNavigating(true)
    toast.success(`Moving ${selectedIds.size} items to staging...`)
    
    if (onPublish) {
      // Give visual feedback before calling the callback
      setTimeout(() => {
        onPublish(Array.from(selectedIds))
        setIsNavigating(false)
      }, 300)
    } else {
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
      case 'longform':
        return <ClipPreview item={item} /> // Reuse ClipPreview for longform videos
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

  // Group content by type for grid view
  const contentByType = useMemo(() => {
    const grouped: Record<string, ContentItem[]> = {}
    filteredContent.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = []
      }
      grouped[item.type].push(item)
    })
    return grouped
  }, [filteredContent])

  // Calculate statistics
  const stats = useMemo(() => {
    const selected = contentItems.filter(item => selectedIds.has(item.id))
    const selectedByType: Record<string, number> = {}
    
    selected.forEach(item => {
      selectedByType[item.type] = (selectedByType[item.type] || 0) + 1
    })
    
    const totalDuration = selected
      .filter(item => item.type === 'clip')
      .reduce((sum, item) => sum + (item.duration || 0), 0)
      
    const totalWords = selected
      .filter(item => item.type === 'blog')
      .reduce((sum, item) => sum + (item.wordCount || 0), 0)
    
    return {
      selectedByType,
      totalDuration,
      totalWords,
      totalSelected: selected.length
    }
  }, [contentItems, selectedIds])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'a',
        ctrlKey: true,
        description: 'Select all items',
        action: selectAll
      },
      {
        key: 'd',
        ctrlKey: true,
        description: 'Deselect all items',
        action: deselectAll
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
        key: 'Enter',
        ctrlKey: true,
        description: 'Continue to staging',
        action: () => {
          if (selectedIds.size > 0) {
            handleContinue()
          }
        }
      }
    ],
    enabled: true
  })

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-auto space-y-6 pb-20">
        {/* Header */}
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
                  size="icon"
                  onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                >
                  <IconCommand className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard shortcuts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Badge variant="secondary" className="gap-1">
            <IconChecks className="h-3 w-3" />
            {selectedIds.size} / {contentItems.length}
          </Badge>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {showKeyboardShortcuts && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+A</kbd>
                <span className="text-muted-foreground">Select all</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+D</kbd>
                <span className="text-muted-foreground">Deselect all</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
                <span className="text-muted-foreground">Search</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd>
                <span className="text-muted-foreground">Continue</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Statistics */}
      {selectedIds.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <IconChecks className="h-4 w-4 text-primary" />
                <span className="font-medium">{stats.totalSelected} items selected</span>
              </div>
              
              {stats.totalDuration > 0 && (
                <div className="flex items-center gap-2">
                  <IconVideo className="h-4 w-4 text-purple-600" />
                  <span>{Math.floor(stats.totalDuration / 60)}m {stats.totalDuration % 60}s of video</span>
                </div>
              )}
              
              {stats.totalWords > 0 && (
                <div className="flex items-center gap-2">
                  <IconFileText className="h-4 w-4 text-blue-600" />
                  <span>{stats.totalWords.toLocaleString()} words</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 ml-auto">
                {Object.entries(stats.selectedByType).map(([type, count]) => {
                  const config = contentTypeConfig[type as keyof typeof contentTypeConfig]
                  if (!config) return null
                  
                  return (
                    <div key={type} className="flex items-center gap-1">
                      <config.icon className={cn("h-4 w-4", config.color)} />
                      <span>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(contentTypeConfig).map(([type, config]) => {
                  const count = contentTypeCounts[type] || 0
                  if (count === 0) return null
                  
                  return (
                    <SelectItem key={type} value={type}>
                      {config.label} ({count})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

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

      {/* Content Grid */}
      <ScrollArea className="h-[600px] pr-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="max-w-md mx-auto space-y-4">
                {searchQuery || filterType !== 'all' ? (
                  <>
                    <IconSearch className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold mb-1">No results found</h3>
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
                      className="gap-2"
                    >
                      <IconX className="h-4 w-4" />
                      Clear filters
                    </Button>
                  </>
                ) : contentItems.length === 0 ? (
                  <>
                    <div className="relative">
                      <IconSparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div className="absolute -top-2 -right-2 h-6 w-6 bg-yellow-500 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">No content generated yet</h3>
                      <p className="text-muted-foreground">
                        Start by generating clips, blog posts, or social content from your video
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" size="sm" className="gap-2">
                        <IconVideo className="h-4 w-4" />
                        Generate Clips
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <IconFileText className="h-4 w-4" />
                        Create Blog
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <IconPhoto className="h-4 w-4" />
                        Generate Images
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <IconAlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
                      <p className="text-muted-foreground">
                        Unable to load content. Please refresh the page
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : filterType === 'all' ? (
          <div className="space-y-8">
            {Object.entries(contentByType).map(([type, items]) => (
              <ContentTypeSection
                key={type}
                type={type}
                items={items}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                getContentPreview={getContentPreview}
              />
            ))}
          </div>
        ) : (
          <div className={cn("grid gap-4", contentTypeConfig[filterType as keyof typeof contentTypeConfig]?.gridCols)}>
            {filteredContent.map((item, index) => (
              <ContentCard
                key={item.id}
                item={item}
                index={index}
                isSelected={selectedIds.has(item.id)}
                onToggle={toggleSelection}
                getContentPreview={getContentPreview}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      </div>

      {/* Sticky Actions at Bottom */}
      <div className="sticky bottom-0 bg-background border-t mt-auto">
        <Card className="rounded-none border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedIds.size > 0 ? (
                  <span className="flex items-center gap-2">
                    <IconChecks className="h-4 w-4 text-primary" />
                    <span>Selected <strong>{selectedIds.size}</strong> items to publish</span>
                  </span>
                ) : (
                  <>Select content to continue</>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    className="gap-2"
                  >
                    <IconX className="h-4 w-4" />
                    Clear Selection
                  </Button>
                )}
                <Button
                  onClick={handleContinue}
                  disabled={selectedIds.size === 0 || isNavigating}
                  size="lg"
                  className={cn(
                    "gap-2 min-w-[200px] transition-all",
                    selectedIds.size > 0 && "shadow-md scale-105"
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
      </div>
    </div>
  )
} 