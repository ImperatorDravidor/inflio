"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import {
  IconScissors,
  IconArticle,
  IconShare2,
  IconVideo,
  IconCheck,
  IconX,
  IconEdit,
  IconEye,
  IconPlayerPlay,
  IconClock,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandFacebook,
  IconPhoto,
  IconTrendingUp,
  IconSparkles,
  IconAlertCircle,
  IconFileText,
  IconTarget,
  IconUsers,
  IconCalendar,
  IconDownload
} from "@tabler/icons-react"
import { Project, ClipData, BlogPost, SocialPost } from "@/lib/project-types"
import { formatDuration } from "@/lib/video-utils"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'social' | 'longform' | 'image' | 'carousel'
  title: string
  description?: string
  selected: boolean
  ready: boolean
  metadata?: any
  viralityScore?: number
  estimatedReach?: number
  platforms?: string[]
  preview?: string
}

interface PublishingWorkflowProps {
  project: Project
  onPublish: (selectedContent: ContentItem[]) => void
  onEditBlog?: (blogId: string) => void
  className?: string
}

export function PublishingWorkflow({ 
  project, 
  onPublish, 
  onEditBlog,
  className 
}: PublishingWorkflowProps) {
  const router = useRouter()
  const [selectedContent, setSelectedContent] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("all")
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null)

  // Prepare enhanced content items
  const contentItems: ContentItem[] = [
    // Long form video (only one per project)
    ...(project.video_url ? [{
      id: 'longform-main',
      type: 'longform' as const,
      title: project.title || 'Long Form Video',
      description: `Full video • ${project.transcription ? 'Transcribed' : 'No transcript'} • ${project.content_analysis ? 'Analyzed' : 'Not analyzed'}`,
      selected: false,
      ready: true,
      metadata: {
        url: project.video_url,
        transcription: project.transcription,
        analysis: project.content_analysis,
        duration: project.transcription?.duration
      },
      viralityScore: project.content_analysis ? calculateOverallScore(project.content_analysis) : 0,
      estimatedReach: project.content_analysis ? estimateReach(project.content_analysis) : 0,
      platforms: ['youtube', 'linkedin', 'facebook'],
      preview: project.transcription?.text?.substring(0, 200) + '...'
    }] : []),

    // Video clips
    ...project.folders.clips.map(clip => ({
      id: `clip-${clip.id}`,
      type: 'clip' as const,
      title: clip.title || 'Untitled Clip',
      description: `${formatDuration(clip.duration)} • Virality: ${Math.round((clip.score || 0) * 10)}/10`,
      selected: false,
      ready: !!clip.exportUrl,
      metadata: clip,
      viralityScore: clip.score || 0,
      estimatedReach: Math.floor((clip.score || 0) * 10000),
      platforms: determineBestPlatforms(clip),
      preview: clip.transcript?.substring(0, 150) + '...'
    })),

    // Blog posts
    ...project.folders.blog.map(blog => ({
      id: `blog-${blog.id}`,
      type: 'blog' as const,
      title: blog.title,
      description: `${blog.readingTime} min read • ${blog.tags.length} tags • ${blog.excerpt?.length || 0} chars`,
      selected: false,
      ready: true,
      metadata: blog,
      estimatedReach: blog.readingTime * 1000, // Rough estimate
      platforms: ['linkedin', 'x', 'facebook', 'threads'],
      preview: blog.excerpt || blog.content?.substring(0, 200) + '...'
    })),

    // Social posts
    ...project.folders.social.map((post, index) => ({
      id: `social-${index}`,
      type: 'social' as const,
      title: `Social Post ${index + 1}`,
      description: `${post.platform || 'Multi-platform'} • ${post.content?.length || 0} chars`,
      selected: false,
      ready: true,
      metadata: post,
      platforms: post.platform ? [post.platform] : ['instagram', 'x'],
      preview: post.content
    })),

    // AI-generated images and carousels
    ...(project.folders.images?.reduce((acc: ContentItem[], image: any) => {
      if (image.type === 'carousel-slide') {
        // Group carousel slides
        const carouselId = `carousel-${image.carouselId || 'default'}`
        const existing = acc.find(item => item.id === carouselId)
        
        if (existing) {
          existing.description = `${(existing.metadata.slides?.length || 0) + 1} slides • ${image.style}`
          existing.metadata.slides = [...(existing.metadata.slides || []), image]
        } else {
          acc.push({
            id: carouselId,
            type: 'carousel' as const,
            title: `AI Carousel`,
            description: `1 slide • ${image.style}`,
            selected: false,
            ready: true,
            metadata: { slides: [image], style: image.style },
            platforms: ['instagram', 'linkedin', 'facebook'],
            preview: image.prompt
          })
        }
      } else {
        acc.push({
          id: `image-${image.id}`,
          type: 'image' as const,
          title: 'AI Generated Image',
          description: `${image.style} • ${image.size || '1024x1024'}`,
          selected: false,
          ready: true,
          metadata: image,
          platforms: ['instagram', 'facebook', 'linkedin', 'threads'],
          preview: image.prompt
        })
      }
      return acc
    }, []) || [])
  ]

  const handleContentToggle = (itemId: string) => {
    setSelectedContent(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleSelectAll = (type?: string) => {
    const itemsToSelect = type 
      ? contentItems.filter(item => item.type === type)
      : contentItems.filter(item => item.ready)

    const newSelection = { ...selectedContent }
    itemsToSelect.forEach(item => {
      newSelection[item.id] = true
    })
    setSelectedContent(newSelection)
  }

  const handleDeselectAll = () => {
    setSelectedContent({})
  }

  const getSelectedItems = () => {
    return contentItems.filter(item => selectedContent[item.id])
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'clip': return IconScissors
      case 'blog': return IconArticle
      case 'social': return IconShare2
      case 'longform': return IconVideo
      case 'image': return IconPhoto
      case 'carousel': return IconPhoto
      default: return IconCheck
    }
  }

  const getViralityColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    if (score >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getContentCounts = () => {
    const counts = {
      all: contentItems.length,
      clip: 0,
      blog: 0,
      social: 0,
      longform: 0,
      image: 0,
      carousel: 0
    }

    contentItems.forEach(item => {
      if (item.type in counts) {
        counts[item.type]++
      }
    })

    return counts
  }

  const counts = getContentCounts()
  const selectedCount = Object.values(selectedContent).filter(v => v).length
  const totalEstimatedReach = getSelectedItems().reduce((sum, item) => sum + (item.estimatedReach || 0), 0)

  const filteredItems = activeTab === 'all' 
    ? contentItems 
    : contentItems.filter(item => item.type === activeTab)

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconTarget className="h-5 w-5" />
                Select Content for Social Publishing
              </CardTitle>
              <CardDescription>
                Choose content to optimize and schedule across social media platforms
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <>
                  <div className="text-right text-sm">
                    <Badge variant="secondary" className="mb-1">
                      {selectedCount} selected
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Est. reach: {(totalEstimatedReach / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeselectAll}
                  >
                    Clear
                  </Button>
                </>
              )}
              <Button
                size="sm"
                onClick={() => {
                  const selectedIds = Object.keys(selectedContent).filter(id => selectedContent[id])
                  router.push(`/projects/${project.id}/stage?content=${selectedIds.join(',')}`)
                }}
                disabled={selectedCount === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <IconSparkles className="h-4 w-4 mr-2" />
                Continue to AI Staging
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="longform" disabled={counts.longform === 0}>
                Long Form ({counts.longform})
              </TabsTrigger>
              <TabsTrigger value="clip" disabled={counts.clip === 0}>
                Clips ({counts.clip})
              </TabsTrigger>
              <TabsTrigger value="blog" disabled={counts.blog === 0}>
                Articles ({counts.blog})
              </TabsTrigger>
              <TabsTrigger value="image" disabled={counts.image === 0}>
                Images ({counts.image})
              </TabsTrigger>
              <TabsTrigger value="social" disabled={counts.social === 0}>
                Social ({counts.social})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <IconAlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No {activeTab === 'all' ? 'content' : activeTab} available</p>
                      <p className="text-sm">Create some content first to get started with social publishing</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {filteredItems.map((item, index) => {
                        const Icon = getContentIcon(item.type)
                        const isSelected = selectedContent[item.id] || false
                        
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "group relative overflow-hidden rounded-lg border transition-all duration-200",
                              isSelected && "border-primary bg-primary/5 shadow-md",
                              !item.ready && "opacity-60",
                              item.ready && "hover:shadow-sm hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-start gap-4 p-4">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleContentToggle(item.id)}
                                disabled={!item.ready}
                                className="mt-1"
                              />
                              
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    <Label className="font-medium cursor-pointer text-base" htmlFor={item.id}>
                                      {item.title}
                                    </Label>
                                    {!item.ready && (
                                      <Badge variant="outline" className="text-xs">
                                        Processing
                                      </Badge>
                                    )}
                                    {item.type === 'longform' && (
                                      <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500">
                                        Master Content
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {item.viralityScore !== undefined && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="flex items-center gap-1">
                                            <IconTrendingUp className={cn("h-4 w-4", getViralityColor(item.viralityScore * 10))} />
                                            <span className={cn("text-sm font-medium", getViralityColor(item.viralityScore * 10))}>
                                              {Math.round(item.viralityScore * 10)}/10
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Virality Score: {Math.round(item.viralityScore * 10)}/10</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    
                                    {item.estimatedReach && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="flex items-center gap-1">
                                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                              {(item.estimatedReach / 1000).toFixed(1)}k
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Estimated reach: {item.estimatedReach.toLocaleString()}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                                
                                {item.preview && (
                                  <div className="p-3 bg-muted/30 rounded-md">
                                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                                      "{item.preview}"
                                    </p>
                                  </div>
                                )}
                                
                                {item.platforms && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Best for:</span>
                                    <div className="flex gap-1">
                                      {item.platforms.slice(0, 3).map(platform => {
                                        const PlatformIcon = getPlatformIcon(platform)
                                        return (
                                          <PlatformIcon key={platform} className="h-4 w-4 text-muted-foreground" />
                                        )
                                      })}
                                      {item.platforms.length > 3 && (
                                        <span className="text-xs text-muted-foreground">+{item.platforms.length - 3}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {item.type === 'clip' && item.metadata?.exportUrl && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Button size="sm" variant="ghost" asChild>
                                        <a href={item.metadata.exportUrl} target="_blank" rel="noopener noreferrer">
                                          <IconPlayerPlay className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Play video</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                {item.type === 'blog' && onEditBlog && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => onEditBlog(item.metadata.id)}
                                      >
                                        <IconEdit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit article</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                {(item.type === 'image' || item.type === 'carousel') && item.metadata?.url && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Button size="sm" variant="ghost" asChild>
                                        <a href={item.metadata.url || item.metadata.slides?.[0]?.url} target="_blank" rel="noopener noreferrer">
                                          <IconEye className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View image</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => setPreviewItem(item)}
                                    >
                                      <IconFileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Preview details</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                  <IconCheck className="h-3 w-3" />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>

              {filteredItems.length > 0 && (
                <div className="mt-6 pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectAll(activeTab === 'all' ? undefined : activeTab)}
                      >
                        <IconCheck className="h-4 w-4 mr-2" />
                        Select All {activeTab !== 'all' && activeTab}
                      </Button>
                      
                      {selectedCount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {selectedCount} items selected • Est. {(totalEstimatedReach / 1000).toFixed(1)}k reach
                        </div>
                      )}
                    </div>
                    
                    {selectedCount > 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const selectedIds = Object.keys(selectedContent).filter(id => selectedContent[id])
                          router.push(`/projects/${project.id}/stage?content=${selectedIds.join(',')}`)
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <IconSparkles className="h-4 w-4 mr-2" />
                        Stage Selected Content
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Helper functions
function calculateOverallScore(analysis: any): number {
  if (!analysis) return 0
  // Simple scoring based on available analysis
  let score = 0.5 // Base score
  if (analysis.keywords?.length > 5) score += 0.2
  if (analysis.topics?.length > 3) score += 0.2
  if (analysis.sentiment === 'positive') score += 0.1
  return Math.min(score, 1)
}

function estimateReach(analysis: any): number {
  if (!analysis) return 1000
  const baseReach = 5000
  const keywordBonus = (analysis.keywords?.length || 0) * 100
  const topicBonus = (analysis.topics?.length || 0) * 200
  return baseReach + keywordBonus + topicBonus
}

function determineBestPlatforms(clip: ClipData): string[] {
  const platforms: string[] = []
  const duration = clip.duration || 0
  const score = clip.score || 0
  
  // Short clips are good for TikTok and Instagram
  if (duration <= 60) {
    platforms.push('tiktok', 'instagram')
  }
  
  // Medium clips work well on Instagram and YouTube
  if (duration <= 300) {
    platforms.push('instagram', 'youtube')
  }
  
  // High-scoring content works on all platforms
  if (score > 0.7) {
    platforms.push('x', 'linkedin', 'facebook')
  }
  
  // Professional content for LinkedIn
  if (clip.title?.toLowerCase().includes('business') || 
      clip.title?.toLowerCase().includes('professional')) {
    platforms.push('linkedin')
  }
  
  return [...new Set(platforms)] // Remove duplicates
}

function getPlatformIcon(platform: string) {
  const icons: Record<string, any> = {
    instagram: IconBrandInstagram,
    linkedin: IconBrandLinkedin,
    tiktok: IconBrandTiktok,
    youtube: IconBrandYoutube,
    x: IconBrandTwitter,
    facebook: IconBrandFacebook
  }
  return icons[platform] || IconShare2
} 