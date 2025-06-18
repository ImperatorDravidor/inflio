"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  IconArrowRight,
  IconArrowLeft,
  IconPlayerPlay,
  IconClock,
  IconCalendar,
  IconCheck,
  IconX,
  IconExternalLink,
  IconEye,
  IconSchedule,
  IconRocket,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
  IconBrandX,
  IconBrandFacebook
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, ClipData, BlogPost, SocialPost } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimatedBackground } from "@/components/animated-background"
import { formatDuration } from "@/lib/video-utils"
import { cn } from "@/lib/utils"

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
  icon: any
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
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [publishableContent, setPublishableContent] = useState<PublishableContent[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
    tiktok: false,
    youtube: false,
    facebook: false
  })
  const [defaultScheduleDate, setDefaultScheduleDate] = useState<Date>(new Date())
  const [isPublishing, setIsPublishing] = useState(false)

  const steps: PublishStep[] = [
    { id: 'content', title: 'Select Content', icon: IconFileText, complete: false },
    { id: 'platforms', title: 'Choose Platforms', icon: IconBrandTwitter, complete: false },
    { id: 'schedule', title: 'Schedule Posts', icon: IconCalendar, complete: false },
    { id: 'review', title: 'Review & Publish', icon: IconRocket, complete: false }
  ]

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
      initializePublishableContent(proj)
    } catch (error) {
      console.error("Failed to load project:", error)
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const initializePublishableContent = (proj: Project) => {
    const content: PublishableContent[] = []

    // Add clips
    proj.folders.clips.forEach(clip => {
      content.push({
        id: `clip-${clip.id}`,
        type: 'clip',
        title: clip.title || 'Untitled Clip',
        content: clip,
        selected: true,
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
      content.push({
        id: `blog-${blog.id}`,
        type: 'blog',
        title: blog.title,
        content: blog,
        selected: false,
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
      // TODO: Implement actual publishing logic here
      // This would integrate with your social media APIs
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      toast.success(`Successfully scheduled ${selectedContent.length} posts!`)
      
      // Update project status
      await ProjectService.updateProject(projectId, { status: 'published' })
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
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

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Select Content */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Content to Publish</CardTitle>
                    <CardDescription>
                      Choose which clips and posts you want to share
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Video Clips */}
                      {project.folders.clips.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <IconScissors className="h-5 w-5 text-primary" />
                            Video Clips ({project.folders.clips.length})
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {publishableContent
                              .filter(item => item.type === 'clip')
                              .map(item => {
                                const clip = item.content as ClipData
                                return (
                                  <div
                                    key={item.id}
                                    className={cn(
                                      "relative cursor-pointer rounded-lg overflow-hidden transition-all",
                                      item.selected && "ring-2 ring-primary"
                                    )}
                                    onClick={() => handleContentSelection(item.id)}
                                  >
                                    <div className="aspect-[9/16] bg-black">
                                      {clip.exportUrl ? (
                                        <video
                                          src={clip.exportUrl}
                                          className="w-full h-full object-cover"
                                          poster={clip.thumbnail}
                                          muted
                                        />
                                      ) : (
                                        <div className="flex items-center justify-center h-full">
                                          <IconPlayerPlay className="h-10 w-10 text-gray-600" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute top-2 right-2">
                                      <Checkbox
                                        checked={item.selected}
                                        className="border-white"
                                      />
                                    </div>
                                    <div className="absolute bottom-2 left-2 right-2">
                                      <p className="text-white text-sm font-medium line-clamp-1">
                                        {item.title}
                                      </p>
                                      <p className="text-white/80 text-xs">
                                        {formatDuration(clip.duration)}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Blog Posts */}
                      {project.folders.blog.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <IconArticle className="h-5 w-5 text-primary" />
                            Blog Posts ({project.folders.blog.length})
                          </h3>
                          <div className="space-y-3">
                            {publishableContent
                              .filter(item => item.type === 'blog')
                              .map(item => {
                                const blog = item.content as BlogPost
                                return (
                                  <Card
                                    key={item.id}
                                    className={cn(
                                      "cursor-pointer transition-all",
                                      item.selected && "ring-2 ring-primary"
                                    )}
                                    onClick={() => handleContentSelection(item.id)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-4">
                                        <Checkbox
                                          checked={item.selected}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex-1">
                                          <h4 className="font-medium">{blog.title}</h4>
                                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                            {blog.excerpt}
                                          </p>
                                          <div className="flex gap-2 mt-2">
                                            {blog.tags.slice(0, 3).map(tag => (
                                              <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Choose Platforms */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Platforms for Each Content</CardTitle>
                    <CardDescription>
                      Choose where each piece of content should be published
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {publishableContent
                      .filter(item => item.selected)
                      .map(item => (
                        <div key={item.id} className="space-y-3">
                          <div className="flex items-center gap-3">
                            {item.type === 'clip' ? (
                              <IconScissors className="h-5 w-5 text-primary" />
                            ) : (
                              <IconArticle className="h-5 w-5 text-primary" />
                            )}
                            <h4 className="font-medium">{item.title}</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-8">
                            {Object.entries(platformInfo).map(([key, platform]) => {
                              const isClip = item.type === 'clip'
                              const clip = isClip ? item.content as ClipData : null
                              const duration = clip ? clip.duration : 0
                              const Icon = platform.icon
                              const disabled = isClip && duration > platform.limits.video.maxLength
                              
                              return (
                                <label
                                  key={key}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                    item.platforms[key as keyof typeof item.platforms] && !disabled
                                      ? "border-primary bg-primary/10"
                                      : "border-border",
                                    disabled && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Checkbox
                                    checked={item.platforms[key as keyof typeof item.platforms]}
                                    disabled={disabled}
                                    onCheckedChange={() => !disabled && handlePlatformToggle(item.id, key)}
                                  />
                                  <Icon className="h-5 w-5" />
                                  <span className="text-sm font-medium">{platform.name}</span>
                                  {disabled && (
                                    <span className="text-xs text-destructive">
                                      Too long
                                    </span>
                                  )}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Schedule Posts */}
            {currentStep === 2 && (
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
                          .filter(([_, selected]) => selected)
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

            {/* Step 4: Review & Publish */}
            {currentStep === 3 && (
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
                                .filter(([_, selected]) => selected)
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