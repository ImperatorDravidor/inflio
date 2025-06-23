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
import {
  IconScissors,
  IconArticle,
  IconShare2,
  IconMicrophone,
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
  IconPhoto
} from "@tabler/icons-react"
import { Project, ClipData, BlogPost, SocialPost } from "@/lib/project-types"
import { formatDuration } from "@/lib/video-utils"
import { cn } from "@/lib/utils"

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'social' | 'podcast' | 'image'
  title: string
  description?: string
  selected: boolean
  ready: boolean
  metadata?: any
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

  // Prepare content items
  const contentItems: ContentItem[] = [
    // Video clips
    ...project.folders.clips.map(clip => ({
      id: `clip-${clip.id}`,
      type: 'clip' as const,
      title: clip.title || 'Untitled Clip',
      description: `${formatDuration(clip.duration)} • Score: ${Math.round((clip.score || 0) * 100)}`,
      selected: false,
      ready: !!clip.exportUrl,
      metadata: clip
    })),
    // Blog posts
    ...project.folders.blog.map(blog => ({
      id: `blog-${blog.id}`,
      type: 'blog' as const,
      title: blog.title,
      description: `${blog.readingTime} min read • ${blog.tags.length} tags`,
      selected: false,
      ready: true,
      metadata: blog
    })),
    // Social posts
    ...project.folders.social.map((post, index) => ({
      id: `social-${index}`,
      type: 'social' as const,
      title: `Social Post ${index + 1}`,
      description: post.platform || 'Multi-platform',
      selected: false,
      ready: true,
      metadata: post
    })),
    // AI-generated images
    ...(project.folders.images?.map((image: any) => ({
      id: `image-${image.id}`,
      type: 'image' as const,
      title: image.type === 'carousel-slide' 
        ? `Carousel - Slide ${image.slideNumber}` 
        : 'AI Image',
      description: `${image.style} • ${image.size}`,
      selected: false,
      ready: true,
      metadata: image
    })) || []),
    // Podcast (if available)
    ...(project.folders.podcast ? [{
      id: 'podcast-1',
      type: 'podcast' as const,
      title: 'Podcast Episode',
      description: 'Audio version with chapters',
      selected: false,
      ready: true,
      metadata: project.folders.podcast
    }] : [])
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
      : contentItems

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
      case 'podcast': return IconMicrophone
      case 'image': return IconPhoto
      default: return IconCheck
    }
  }

  const getContentCounts = () => {
    const counts = {
      all: contentItems.length,
      clip: 0,
      blog: 0,
      social: 0,
      podcast: 0,
      image: 0
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

  const filteredItems = activeTab === 'all' 
    ? contentItems 
    : contentItems.filter(item => item.type === activeTab)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Content to Publish</CardTitle>
            <CardDescription>
              Choose which content you want to push to social media platforms
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedCount} selected
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeselectAll}
                >
                  Deselect All
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
            >
              <IconShare2 className="h-4 w-4 mr-2" />
              Continue to Staging
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
            <TabsTrigger value="clip" disabled={counts.clip === 0}>
              Clips ({counts.clip})
            </TabsTrigger>
            <TabsTrigger value="blog" disabled={counts.blog === 0}>
              Blog ({counts.blog})
            </TabsTrigger>
            <TabsTrigger value="social" disabled={counts.social === 0}>
              Social ({counts.social})
            </TabsTrigger>
            <TabsTrigger value="image" disabled={counts.image === 0}>
              Images ({counts.image})
            </TabsTrigger>
            <TabsTrigger value="podcast" disabled={counts.podcast === 0}>
              Podcast ({counts.podcast})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {activeTab === 'all' ? 'content' : activeTab} available
                  </div>
                ) : (
                  filteredItems.map(item => {
                    const Icon = getContentIcon(item.type)
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border transition-all",
                          selectedContent[item.id] && "border-primary bg-primary/5",
                          !item.ready && "opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={selectedContent[item.id] || false}
                          onCheckedChange={() => handleContentToggle(item.id)}
                          disabled={!item.ready}
                        />
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Label className="font-medium cursor-pointer" htmlFor={item.id}>
                              {item.title}
                            </Label>
                            {!item.ready && (
                              <Badge variant="outline" className="text-xs">
                                Processing
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.type === 'clip' && item.metadata?.exportUrl && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={item.metadata.exportUrl} target="_blank" rel="noopener noreferrer">
                                <IconPlayerPlay className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {item.type === 'blog' && onEditBlog && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => onEditBlog(item.metadata.id)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                          )}
                          {item.type === 'image' && item.metadata?.url && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={item.metadata.url} target="_blank" rel="noopener noreferrer">
                                <IconEye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {item.type !== 'image' && (
                            <Button size="sm" variant="ghost">
                              <IconEye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            {filteredItems.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectAll(activeTab === 'all' ? undefined : activeTab)}
                  className="w-full"
                >
                  Select All {activeTab !== 'all' && activeTab}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 