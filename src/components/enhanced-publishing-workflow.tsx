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
  IconSquare
} from '@tabler/icons-react'
import React from 'react'
import type { Project, ClipData, BlogPost } from '@/lib/project-types'

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'image' | 'social'
  title: string
  description?: string
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
}

interface EnhancedPublishingWorkflowProps {
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
}

const contentTypeConfig = {
  clip: {
    icon: IconVideo,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Video Clip',
    description: 'Short-form video content'
  },
  blog: {
    icon: IconFileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Blog Post',
    description: 'Long-form written content'
  },
  image: {
    icon: IconPhoto,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Image',
    description: 'Visual content and graphics'
  },
  social: {
    icon: IconHash,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Social Post',
    description: 'Platform-specific social content'
  }
}

export function EnhancedPublishingWorkflow({ 
  project, 
  onPublish, 
  className 
}: EnhancedPublishingWorkflowProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'clip' | 'blog' | 'image' | 'social'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'score'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isNavigating, setIsNavigating] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Convert project content to ContentItem format
  const contentItems = useMemo(() => {
    const items: ContentItem[] = []
    
    // Add clips
    if (project.folders?.clips?.length > 0) {
      items.push(...project.folders.clips.map(clip => ({
        id: clip.id,
        type: 'clip' as const,
        title: clip.title || 'Untitled Clip',
        description: clip.transcript?.substring(0, 150) + '...',
        thumbnail: clip.thumbnail,
        duration: clip.duration,
        tags: clip.tags || [],
        platforms: ['tiktok', 'instagram', 'youtube'],
        createdAt: clip.createdAt || new Date().toISOString(),
        ready: true,
        viralityScore: clip.score,
        metadata: clip
      })))
    }
    
    // Add blog posts
    if (project.folders?.blog?.length > 0) {
      items.push(...project.folders.blog.map(blog => ({
        id: blog.id,
        type: 'blog' as const,
        title: blog.title,
        description: blog.excerpt,
        wordCount: blog.content.split(' ').length,
        tags: blog.tags,
        platforms: ['medium', 'linkedin', 'wordpress'],
        createdAt: blog.createdAt,
        ready: true,
        metadata: { seoScore: 85 } // Mock SEO score
      })))
    }
    
    // Add generated images
    if (project.folders?.images && project.folders.images.length > 0) {
      items.push(...project.folders.images.map((image: any, index) => ({
        id: `image-${index}`,
        type: 'image' as const,
        title: image.prompt || `Generated Image ${index + 1}`,
        description: image.prompt,
        thumbnail: image.url,
        tags: [],
        platforms: ['instagram', 'pinterest', 'twitter'],
        createdAt: new Date().toISOString(),
        ready: true,
        metadata: image
      })))
    }
    
    // Add social posts
    if (project.folders?.social?.length > 0) {
      items.push(...project.folders.social.map((post, index) => ({
        id: `social-${index}`,
        type: 'social' as const,
        title: `Social Post ${index + 1}`,
        description: post.content,
        tags: post.hashtags || [],
        platforms: [post.platform],
        createdAt: post.createdAt || new Date().toISOString(),
        ready: true,
        metadata: { platform: post.platform }
      })))
    }
    
    return items
  }, [project])

  // Filter and sort content
  const filteredAndSortedContent = useMemo(() => {
    let filtered = contentItems
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType)
    }
    
    // Apply search filter
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

  // Grouped content by type
  const groupedContent = useMemo(() => {
    return filteredAndSortedContent.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, ContentItem[]>)
  }, [filteredAndSortedContent])

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    const allIds = new Set(filteredAndSortedContent.filter(item => item.ready).map(item => item.id))
    setSelectedIds(allIds)
  }

  const handleClearAll = () => {
    setSelectedIds(new Set())
  }

  const handleSelectType = (type: string) => {
    const typeIds = filteredAndSortedContent
      .filter(item => item.type === type && item.ready)
      .map(item => item.id)
    
    const newSelected = new Set(selectedIds)
    typeIds.forEach(id => newSelected.add(id))
    setSelectedIds(newSelected)
  }

  const handleContinue = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one content item')
      return
    }
    
    setIsNavigating(true)
    
    // Store selected content IDs
    sessionStorage.setItem('selectedContentIds', JSON.stringify(Array.from(selectedIds)))
    
    // Navigate to staging page
    setTimeout(() => {
      router.push(`/projects/${project.id}/stage`)
    }, 500)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault()
            handleSelectAll()
            break
          case 'd':
            e.preventDefault()
            handleClearAll()
            break
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredAndSortedContent])

  const selectedCount = selectedIds.size
  const totalCount = contentItems.length
  const readyCount = contentItems.filter(item => item.ready).length

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <IconSparkles className="h-6 w-6 text-primary" />
              Publish Your Content
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Select the content you want to publish and we'll help you optimize it for each platform
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Badge variant="secondary" className="text-base px-4 py-2">
                  <IconSquareCheck className="h-4 w-4 mr-1" />
                  {selectedCount} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-muted-foreground"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleContinue}
                    disabled={selectedCount === 0 || isNavigating}
                    size="lg"
                    className={cn(
                      "bg-gradient-to-r from-blue-600 to-purple-600",
                      "hover:from-blue-700 hover:to-purple-700",
                      "transition-all duration-300",
                      selectedCount > 0 && "shadow-lg hover:shadow-xl"
                    )}
                  >
                    {isNavigating ? (
                      <>
                        <IconSparkles className="h-5 w-5 mr-2 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        Continue to Stage
                        <IconArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Continue with {selectedCount} selected items</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {contentItems.length === 0 ? (
          <div className="text-center py-12">
            <IconInfoCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Generate some content first (clips, blog posts, or images) to get started with publishing.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-40">
                    <IconFilter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="clip">Video Clips</SelectItem>
                    <SelectItem value="blog">Blog Posts</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="social">Social Posts</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <IconAdjustments className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="score">Sort by Score</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? (
                    <IconSortAscending className="h-4 w-4" />
                  ) : (
                    <IconSortDescending className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex rounded-lg border">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            {totalCount > 1 && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedCount === 0 ? (
                      <>Select content to publish • {readyCount} items ready</>
                    ) : (
                      <>{selectedCount} of {readyCount} items selected</>
                    )}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSelectAll}
                      disabled={selectedCount === readyCount}
                    >
                      Select All
                    </Button>
                    
                    {Object.keys(groupedContent).map(type => (
                      <Button
                        key={type}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSelectType(type)}
                        className="gap-1"
                      >
                        {React.createElement(contentTypeConfig[type as keyof typeof contentTypeConfig].icon, {
                          className: "h-3 w-3"
                        })}
                        {groupedContent[type].length}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+A</kbd> Select all • 
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded ml-2">Ctrl+D</kbd> Deselect all
                </p>
              </div>
            )}
            
            {/* Content Grid/List */}
            <ScrollArea className="h-[500px]">
              <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4"
                  >
                    {filteredAndSortedContent.map((item, index) => (
                      <ContentCard
                        key={item.id}
                        item={item}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={handleToggleSelect}
                        index={index}
                        viewMode="grid"
                        isHovered={hoveredItem === item.id}
                        onHover={setHoveredItem}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 pr-4"
                  >
                    {filteredAndSortedContent.map((item, index) => (
                      <ContentCard
                        key={item.id}
                        item={item}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={handleToggleSelect}
                        index={index}
                        viewMode="list"
                        isHovered={hoveredItem === item.id}
                        onHover={setHoveredItem}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
            
            {/* Status Bar */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{totalCount} total items</span>
                <span>{readyCount} ready to publish</span>
                {filteredAndSortedContent.length < totalCount && (
                  <span>{filteredAndSortedContent.length} matching filter</span>
                )}
              </div>
              
              {selectedCount > 0 && (
                <p className="text-sm font-medium text-primary">
                  Ready to publish {selectedCount} items →
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Content Card Component
function ContentCard({
  item,
  isSelected,
  onToggleSelect,
  index,
  viewMode,
  isHovered,
  onHover
}: {
  item: ContentItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  index: number
  viewMode: 'grid' | 'list'
  isHovered: boolean
  onHover: (id: string | null) => void
}) {
  const config = contentTypeConfig[item.type]
  const Icon = config.icon
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer",
          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
          !item.ready && "opacity-50"
        )}
        onClick={() => item.ready && onToggleSelect(item.id)}
        onMouseEnter={() => onHover(item.id)}
        onMouseLeave={() => onHover(null)}
      >
        <Checkbox
          checked={isSelected}
          disabled={!item.ready}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5"
        />
        
        <div className={cn(
          "p-2 rounded-lg",
          config.bgColor
        )}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-16 h-16 object-cover rounded"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{item.title}</h4>
            {item.viralityScore && (
              <Badge variant="secondary" className="text-xs">
                Score: {item.viralityScore}%
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {item.duration && <span>{formatDuration(item.duration)}</span>}
          {item.wordCount && <span>{item.wordCount} words</span>}
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        
        {item.platforms && (
          <div className="flex gap-1">
            {item.platforms.map(platform => {
              const PlatformIcon = platformIcons[platform as keyof typeof platformIcons]
              return PlatformIcon ? (
                <PlatformIcon key={platform} className="h-4 w-4 text-muted-foreground" />
              ) : null
            })}
          </div>
        )}
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative group cursor-pointer",
        !item.ready && "opacity-50 pointer-events-none"
      )}
      onClick={() => item.ready && onToggleSelect(item.id)}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Card className={cn(
        "h-full transition-all duration-300",
        isSelected && "ring-2 ring-primary",
        config.borderColor,
        "hover:shadow-lg"
      )}>
        {/* Selection Indicator */}
        <div className={cn(
          "absolute top-3 right-3 z-10 transition-all",
          isSelected ? "scale-100" : "scale-0 group-hover:scale-100"
        )}>
          <div className={cn(
            "p-1 rounded-full",
            isSelected ? "bg-primary text-primary-foreground" : "bg-background border"
          )}>
            {isSelected ? (
              <IconCheck className="h-4 w-4" />
            ) : (
              <IconSquare className="h-4 w-4" />
            )}
          </div>
        </div>
        
        {/* Thumbnail or Icon */}
        {item.thumbnail ? (
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className={cn(
              "absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-sm",
              config.bgColor
            )}>
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            {item.duration && (
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
                {formatDuration(item.duration)}
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            "h-32 flex items-center justify-center rounded-t-lg",
            config.bgColor
          )}>
            <Icon className={cn("h-12 w-12", config.color)} />
          </div>
        )}
        
        <CardContent className="p-4 space-y-3">
          <div>
            <h4 className="font-medium line-clamp-1">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            {item.wordCount && <span>{item.wordCount} words</span>}
            {item.viralityScore && (
              <Badge variant="secondary" className="text-xs">
                {item.viralityScore}%
              </Badge>
            )}
          </div>
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Platforms */}
          {item.platforms && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Optimized for:</span>
              <div className="flex gap-1">
                {item.platforms.map(platform => {
                  const PlatformIcon = platformIcons[platform as keyof typeof platformIcons]
                  return PlatformIcon ? (
                    <TooltipProvider key={platform}>
                      <Tooltip>
                        <TooltipTrigger>
                          <PlatformIcon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{platform}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 