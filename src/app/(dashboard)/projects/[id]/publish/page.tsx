"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  IconSparkles, 
  IconFileText, 
  IconScissors, 
  IconArticle, 
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconArrowLeft,
  IconPlayerPlay,
  IconClock,
  IconCalendar,
  IconEye,
  IconRocket,
  IconChevronLeft,
  IconChevronRight,
  IconBrandX,
  IconBrandFacebook
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, ClipData, BlogPost, SocialPost } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimatedBackground } from "@/components/animated-background"
import { formatDuration } from "@/lib/video-utils"
import { cn } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import { SocialAuthChecker } from "@/lib/social/auth-check"

interface PublishableContent {
  id: string
  type: 'clip' | 'blog' | 'social'
  title: string
  content: ClipData | BlogPost | SocialPost
  selected: boolean
  platforms: {
    twitter: boolean
    linkedin: boolean
    instagram: boolean
    tiktok: boolean
    youtube: boolean
    facebook: boolean
  }
  scheduledDate?: Date
  caption?: string
}

interface PublishStep {
  id: string
  title: string
  icon: Icon
  complete: boolean
}

const platformInfo = {
  twitter: {
    name: 'X (Twitter)',
    icon: IconBrandX,
    color: 'bg-black',
    textColor: 'text-white',
    limits: {
      video: { maxLength: 140, aspectRatio: '1:1 or 16:9' },
      text: { maxLength: 280 }
    }
  },
  linkedin: {
    name: 'LinkedIn',
    icon: IconBrandLinkedin,
    color: 'bg-blue-700',
    textColor: 'text-white',
    limits: {
      video: { maxLength: 600, aspectRatio: '1:1 or 16:9' },
      text: { maxLength: 3000 }
    }
  },
  instagram: {
    name: 'Instagram',
    icon: IconBrandInstagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    textColor: 'text-white',
    limits: {
      video: { maxLength: 90, aspectRatio: '9:16 or 1:1' },
      text: { maxLength: 2200 }
    }
  },
  tiktok: {
    name: 'TikTok',
    icon: IconBrandTiktok,
    color: 'bg-black',
    textColor: 'text-white',
    limits: {
      video: { maxLength: 180, aspectRatio: '9:16' },
      text: { maxLength: 2200 }
    }
  },
  youtube: {
    name: 'YouTube Shorts',
    icon: IconBrandYoutube,
    color: 'bg-red-600',
    textColor: 'text-white',
    limits: {
      video: { maxLength: 60, aspectRatio: '9:16' },
      text: { maxLength: 5000 }
    }
  },
  facebook: {
    name: 'Facebook',
    icon: IconBrandFacebook,
    color: 'bg-blue-600',
    textColor: 'text-white',
    limits: {
      video: { maxLength: 240, aspectRatio: 'Any' },
      text: { maxLength: 63206 }
    }
  }
}

export default function PublishProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { userId } = useAuth()
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [publishableContent, setPublishableContent] = useState<PublishableContent[]>([])
  const [defaultScheduleDate, setDefaultScheduleDate] = useState<Date>(new Date())
  const [isPublishing, setIsPublishing] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)

  const steps: PublishStep[] = [
    { id: 'platforms', title: 'Choose Platforms', icon: IconBrandTwitter, complete: false },
    { id: 'schedule', title: 'Schedule Posts', icon: IconCalendar, complete: false },
    { id: 'review', title: 'Review & Publish', icon: IconRocket, complete: false }
  ]

  useEffect(() => {
    if (userId) {
      checkPlatformAuth()
    }
  }, [userId])

  const checkPlatformAuth = async () => {
    if (!userId) return
    
    setCheckingAuth(true)
    try {
      const connected = await SocialAuthChecker.getConnectedPlatforms(userId)
      setConnectedPlatforms(connected)
      
      // If no platforms are connected, redirect to social hub
      if (connected.length === 0) {
        toast.error("Please connect at least one social media platform first")
        setTimeout(() => {
          router.push('/social')
        }, 1500)
      }
    } catch (error) {
      console.error('Error checking platform auth:', error)
    } finally {
      setCheckingAuth(false)
    }
  }

  useEffect(() => {
    loadProject()
  }, [])

  const loadProject = async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      setProject(proj)
      
      // Check for pre-selected content from publishing workflow
      const selectedContentStr = sessionStorage.getItem('selectedContent')
      if (selectedContentStr) {
        const selectedContent = JSON.parse(selectedContentStr)
        sessionStorage.removeItem('selectedContent') // Clean up
        initializePublishableContent(proj, selectedContent)
      } else {
        initializePublishableContent(proj)
      }
    } catch (error) {
      console.error("Failed to load project:", error)
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const initializePublishableContent = (proj: Project, preSelectedContent?: any[]) => {
    const content: PublishableContent[] = []

    // Add clips
    proj.folders.clips.forEach(clip => {
      const isPreSelected = preSelectedContent?.some(item => item.id === `clip-${clip.id}`)
      content.push({
        id: `clip-${clip.id}`,
        type: 'clip',
        title: clip.title || 'Untitled Clip',
        content: clip,
        selected: isPreSelected || false,
        platforms: {
          twitter: false,
          linkedin: false,
          instagram: true,
          tiktok: true,
          youtube: true,
          facebook: false
        },
        caption: clip.description || ''
      })
    })

    // Add blog posts
    proj.folders.blog.forEach(blog => {
      const isPreSelected = preSelectedContent?.some(item => item.id === `blog-${blog.id}`)
      content.push({
        id: `blog-${blog.id}`,
        type: 'blog',
        title: blog.title,
        content: blog,
        selected: isPreSelected || false,
        platforms: {
          twitter: false,
          linkedin: true,
          instagram: false,
          tiktok: false,
          youtube: false,
          facebook: true
        }
      })
    })

    // Add AI-generated images
    if (proj.folders.images && proj.folders.images.length > 0) {
      proj.folders.images.forEach((image: any, index: number) => {
        const isPreSelected = preSelectedContent?.some(item => item.id === `image-${image.id}`)
        content.push({
          id: `image-${image.id}`,
          type: 'social' as const, // Treat images as social content
          title: image.type === 'carousel-slide' 
            ? `Carousel ${image.carouselId} - Slide ${image.slideNumber}` 
            : `AI Image: ${image.prompt.substring(0, 50)}...`,
          content: {
            id: image.id,
            platform: 'instagram' as const, // Default platform
            content: image.prompt,
            hashtags: [], // Extract hashtags from prompt if needed
            mediaUrl: image.url,
            status: 'draft' as const,
            createdAt: image.createdAt
          } as SocialPost,
          selected: isPreSelected || false,
          platforms: {
            twitter: true,
            linkedin: true,
            instagram: true,
            tiktok: false, // TikTok doesn't support static images
            youtube: false, // YouTube Shorts doesn't support static images
            facebook: true
          },
          caption: image.prompt || ''
        })
      })
    }

    // Add social posts
    proj.folders.social.forEach((social, index) => {
      const isPreSelected = preSelectedContent?.some(item => item.id === `social-${index}`)
      content.push({
        id: `social-${index}`,
        type: 'social',
        title: `Social Post ${index + 1}`,
        content: social,
        selected: isPreSelected || false,
        platforms: {
          twitter: true,
          linkedin: true,
          instagram: true,
          tiktok: false,
          youtube: false,
          facebook: true
        },
        caption: social.content || ''
      })
    })

    setPublishableContent(content)
  }

  const handleContentSelection = (contentId: string) => {
    setPublishableContent(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { ...item, selected: !item.selected }
          : item
      )
    )
  }

  const handlePlatformToggle = (contentId: string, platform: string) => {
    // Check if platform is connected
    if (!connectedPlatforms.includes(platform)) {
      toast.error(`Please connect your ${platform} account first`)
      router.push(`/social?connect=${platform}`)
      return
    }
    
    setPublishableContent(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { 
              ...item, 
              platforms: { 
                ...item.platforms, 
                [platform]: !item.platforms[platform as keyof typeof item.platforms] 
              }
            }
          : item
      )
    )
  }

  const handleScheduleChange = (contentId: string, date: Date | undefined) => {
    setPublishableContent(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { ...item, scheduledDate: date }
          : item
      )
    )
  }

  const handleCaptionChange = (contentId: string, caption: string) => {
    setPublishableContent(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { ...item, caption }
          : item
      )
    )
  }

  const handlePublish = async () => {
    const selectedContent = publishableContent.filter(item => item.selected)
    
    if (selectedContent.length === 0) {
      toast.error("Please select at least one piece of content to publish")
      return
    }

    const hasNoPlatforms = selectedContent.some(item => 
      !Object.values(item.platforms).some(p => p)
    )
    
    if (hasNoPlatforms) {
      toast.error("Each selected content must have at least one platform selected")
      return
    }

    setIsPublishing(true)
    
    try {
      // Create social posts for each selected content and platform
      const socialPosts = []
      
      for (const item of selectedContent) {
        const platforms = Object.entries(item.platforms)
          .filter(([_, selected]) => selected)
          .map(([platform]) => platform)
        
        for (const platform of platforms) {
          const postData = {
            projectId,
            contentType: item.type,
            contentId: item.content.id,
            platform,
            title: item.title,
            caption: item.caption || item.title,
            scheduledDate: item.scheduledDate || new Date(),
            status: 'scheduled' as const,
            mediaUrl: item.type === 'clip' ? (item.content as ClipData).exportUrl : undefined,
            thumbnail: item.type === 'clip' ? (item.content as ClipData).thumbnail : undefined,
            blogUrl: item.type === 'blog' ? `/blog/${(item.content as BlogPost).id}` : undefined,
          }
          
          socialPosts.push(postData)
        }
      }
      
      // Create social posts in the system
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          posts: socialPosts
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create social posts')
      }
      
      toast.success(`Successfully scheduled ${socialPosts.length} posts across ${selectedContent.length} pieces of content!`)
      
      // Update project status to published
      await ProjectService.updateProject(projectId, { status: 'published' })
      
      // Posts created successfully
      const result = await response.json()
      
      // Redirect to social calendar
      setTimeout(() => {
        router.push('/social/calendar')
      }, 1500)
      
    } catch (error) {
      console.error("Publishing failed:", error)
      toast.error("Failed to publish content")
    } finally {
      setIsPublishing(false)
    }
  }

  const getSelectedContentCount = () => publishableContent.filter(item => item.selected).length
  const getTotalPlatformCount = () => {
    return publishableContent.reduce((total, item) => {
      if (item.selected) {
        return total + Object.values(item.platforms).filter(p => p).length
      }
      return total
    }, 0)
  }

  if (loading || checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle>
              {checkingAuth ? "Checking social media connections..." : "Loading project..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Publish Your Content</h1>
          <p className="text-muted-foreground">
            Schedule and publish your content across multiple platforms
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === index
              const isComplete = currentStep > index
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                      isActive && "bg-primary text-primary-foreground",
                      isComplete && "bg-primary/20 text-primary",
                      !isActive && !isComplete && "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-12 h-0.5 mx-2",
                      isComplete ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Content Summary */}
        {publishableContent.filter(item => item.selected).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Selected Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {publishableContent.filter(item => item.selected).map(item => (
                  <Badge key={item.id} variant="secondary">
                    {item.type === 'clip' && <IconScissors className="h-3 w-3 mr-1" />}
                    {item.type === 'blog' && <IconArticle className="h-3 w-3 mr-1" />}
                    {item.type === 'social' && <IconBrandTwitter className="h-3 w-3 mr-1" />}
                    {item.title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Platform Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Platforms</CardTitle>
                    <CardDescription>
                      Choose where to publish each piece of content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {connectedPlatforms.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          No social media platforms connected
                        </p>
                        <Button onClick={() => router.push('/social')}>
                          Connect Platforms
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {publishableContent.filter(item => item.selected).map(item => (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              <h4 className="font-medium mb-3">{item.title}</h4>
                              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {Object.entries(platformInfo).map(([platformId, platform]) => {
                                  const Icon = platform.icon
                                  const isConnected = connectedPlatforms.includes(platformId)
                                  const isSelected = item.platforms[platformId as keyof typeof item.platforms]
                                  
                                  return (
                                    <button
                                      key={platformId}
                                      onClick={() => handlePlatformToggle(item.id, platformId)}
                                      disabled={!isConnected}
                                      className={cn(
                                        "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                                        isConnected && isSelected && "border-primary bg-primary/10",
                                        isConnected && !isSelected && "hover:border-primary/50",
                                        !isConnected && "opacity-50 cursor-not-allowed"
                                      )}
                                    >
                                      <Icon className="h-5 w-5" />
                                      <span className="text-xs">{platform.name}</span>
                                      {!isConnected && (
                                        <span className="text-xs text-muted-foreground">Not connected</span>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Schedule Posts */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Schedule Your Posts</CardTitle>
                        <CardDescription>
                          Set when each post should go live
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="bulk-schedule">Bulk schedule:</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <IconCalendar className="h-4 w-4 mr-2" />
                              {format(defaultScheduleDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={defaultScheduleDate}
                              onSelect={(date) => {
                                if (date) {
                                  setDefaultScheduleDate(date)
                                  // Apply to all unscheduled items
                                  setPublishableContent(prev => 
                                    prev.map(item => 
                                      item.selected && !item.scheduledDate
                                        ? { ...item, scheduledDate: date }
                                        : item
                                    )
                                  )
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {publishableContent
                      .filter(item => item.selected)
                      .map(item => {
                        const platformsSelected = Object.entries(item.platforms)
                          .filter(([, selected]) => selected)
                          .map(([platform]) => platformInfo[platform as keyof typeof platformInfo])
                        
                        return (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                  {item.type === 'clip' ? (
                                    <div className="w-16 h-28 bg-black rounded overflow-hidden flex-shrink-0">
                                      {(item.content as ClipData).exportUrl ? (
                                        <video
                                          src={(item.content as ClipData).exportUrl}
                                          className="w-full h-full object-cover"
                                          poster={(item.content as ClipData).thumbnail}
                                          muted
                                        />
                                      ) : (
                                        <div className="flex items-center justify-center h-full">
                                          <IconPlayerPlay className="h-6 w-6 text-gray-600" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                      <IconArticle className="h-8 w-8 text-primary" />
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <h4 className="font-medium">{item.title}</h4>
                                      <div className="flex gap-2 mt-1">
                                        {platformsSelected.map(platform => {
                                          const Icon = platform.icon
                                          return (
                                            <div
                                              key={platform.name}
                                              className={cn(
                                                "p-1.5 rounded",
                                                platform.color,
                                                platform.textColor
                                              )}
                                            >
                                              <Icon className="h-3.5 w-3.5" />
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            <IconCalendar className="h-4 w-4 mr-2" />
                                            {item.scheduledDate 
                                              ? format(item.scheduledDate, "PPP")
                                              : "Select date"
                                            }
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <Calendar
                                            mode="single"
                                            selected={item.scheduledDate}
                                            onSelect={(date) => handleScheduleChange(item.id, date)}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      
                                      <div className="flex items-center gap-2">
                                        <Switch id={`immediate-${item.id}`} />
                                        <Label htmlFor={`immediate-${item.id}`} className="text-sm">
                                          Post immediately
                                        </Label>
                                      </div>
                                    </div>
                                    
                                    {item.type === 'clip' && (
                                      <div className="space-y-2">
                                        <Label htmlFor={`caption-${item.id}`} className="text-sm">
                                          Caption
                                        </Label>
                                        <Textarea
                                          id={`caption-${item.id}`}
                                          value={item.caption}
                                          onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                                          placeholder="Add a caption for your post..."
                                          className="resize-none"
                                          rows={3}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Review & Publish */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Publishing Schedule</CardTitle>
                    <CardDescription>
                      Double-check everything before publishing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-lg bg-primary/10">
                                <IconFileText className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{getSelectedContentCount()}</p>
                                <p className="text-sm text-muted-foreground">Content Items</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-lg bg-primary/10">
                                <IconBrandTwitter className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{getTotalPlatformCount()}</p>
                                <p className="text-sm text-muted-foreground">Total Posts</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-lg bg-primary/10">
                                <IconCalendar className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold">
                                  {publishableContent.filter(item => 
                                    item.selected && item.scheduledDate
                                  ).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Scheduled</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Timeline Preview */}
                      <div>
                        <h3 className="font-semibold mb-4">Publishing Timeline</h3>
                        <div className="space-y-3">
                          {publishableContent
                            .filter(item => item.selected)
                            .sort((a, b) => {
                              if (!a.scheduledDate) return 1
                              if (!b.scheduledDate) return -1
                              return a.scheduledDate.getTime() - b.scheduledDate.getTime()
                            })
                            .map(item => {
                              const platformsSelected = Object.entries(item.platforms)
                                .filter(([, selected]) => selected)
                                .map(([platform]) => platformInfo[platform as keyof typeof platformInfo])
                              
                              return (
                                <div 
                                  key={item.id}
                                  className="flex items-center gap-4 p-4 rounded-lg border"
                                >
                                  <div className="flex-shrink-0">
                                    {item.scheduledDate ? (
                                      <div className="text-center">
                                        <div className="text-2xl font-bold">
                                          {format(item.scheduledDate, "d")}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {format(item.scheduledDate, "MMM")}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <IconClock className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {item.type === 'clip' ? (
                                        <IconScissors className="h-4 w-4 text-primary" />
                                      ) : (
                                        <IconArticle className="h-4 w-4 text-primary" />
                                      )}
                                      <span className="font-medium">{item.title}</span>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                      {platformsSelected.map(platform => {
                                        const Icon = platform.icon
                                        return (
                                          <div
                                            key={platform.name}
                                            className={cn(
                                              "p-1 rounded text-xs",
                                              platform.color,
                                              platform.textColor
                                            )}
                                          >
                                            <Icon className="h-3 w-3" />
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  
                                  <Button size="sm" variant="ghost">
                                    <IconEye className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Publish Button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="gradient-premium min-w-[200px]"
                    onClick={handlePublish}
                    disabled={isPublishing || getSelectedContentCount() === 0}
                  >
                    {isPublishing ? (
                      <>
                        <IconSparkles className="h-5 w-5 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <IconRocket className="h-5 w-5 mr-2" />
                        Publish {getSelectedContentCount()} Items
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            <IconChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep 
                    ? "w-8 bg-primary" 
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                )}
                onClick={() => setCurrentStep(index)}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
          
          <Button
            onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={currentStep === steps.length - 1}
          >
            Next
            <IconChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}