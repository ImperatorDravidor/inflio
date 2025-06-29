"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'social' | 'longform' | 'image' | 'carousel'
  title: string
  description?: string
  selected: boolean
  ready: boolean
  metadata?: any
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
  const { user } = useClerkUser()
  const [selectedContent, setSelectedContent] = useState<Record<string, boolean>>({})
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
      preview: clip.exportUrl || undefined
    })),

    // Blog posts
    ...project.folders.blog.map(blog => ({
      id: `blog-${blog.id}`,
      type: 'blog' as const,
      title: blog.title,
      description: `${blog.readingTime} min read`,
      selected: false,
      ready: true,
      metadata: {
        ...blog,
        projectId: project.id
      },
      preview: blog.excerpt || blog.content?.substring(0, 200) + '...'
    })),

    // Social posts
    ...project.folders.social.map((post, index) => ({
      id: `social-${index}`,
      type: 'social' as const,
      title: `Social Post ${index + 1}`,
      description: post.platform || 'Multi-platform',
      selected: false,
      ready: true,
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

  const handleContentToggle = (itemId: string) => {
    setSelectedContent(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleSelectAll = () => {
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
      default: return IconFileText
    }
  }

  const handleContinue = async () => {
    if (!user?.id) {
      toast.error('Please sign in to continue')
      return
    }

    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) return

    setIsNavigating(true)
    
    try {
      // Save staging session
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
      
      // Navigate to staging page
      router.push(`/projects/${project.id}/stage`)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error in handleContinue:', error)
      }
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsNavigating(false)
    }
  }

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
} 