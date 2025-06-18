"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandFacebook,
  IconPhoto,
  IconWand,
  IconSend,
  IconDeviceFloppy,
  IconArrowLeft,
  IconSparkles,
  IconTemplate,
  IconAlertCircle
} from "@tabler/icons-react"
import { useAuth } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { SocialIntegration, CreatePostRequest, SocialMediaServiceClient } from "@/lib/social/types"
import { AnimatedBackground } from "@/components/animated-background"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ProjectService } from "@/lib/services"
import { ROUTES } from "@/lib/constants"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

const platformIcons = {
  youtube: IconBrandYoutube,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  linkedin: IconBrandLinkedin,
  twitter: IconBrandTwitter,
  x: IconBrandTwitter,
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram
}

const platformColors = {
  youtube: "text-red-500 bg-red-50 dark:bg-red-950/20",
  instagram: "text-pink-500 bg-pink-50 dark:bg-pink-950/20",
  tiktok: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20",
  linkedin: "text-blue-700 bg-blue-50 dark:bg-blue-950/20",
  twitter: "text-sky-500 bg-sky-50 dark:bg-sky-950/20",
  x: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20",
  facebook: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
  threads: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20"
}

const platformCharLimits = {
  youtube: 5000,
  instagram: 2200,
  tiktok: 2200,
  linkedin: 3000,
  twitter: 280,
  x: 280,
  facebook: 63206,
  threads: 500
}

function ComposeSocialPostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId } = useAuth()
  const [integrations, setIntegrations] = useState<SocialIntegration[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [publishDate, setPublishDate] = useState<Date>(new Date())
  const [schedulePost, setSchedulePost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mediaUrls] = useState<string[]>([])
  
  
  const socialService = new SocialMediaServiceClient()
  const projectId = searchParams.get('projectId')
  const dateParam = searchParams.get('date')
  const contentParam = searchParams.get('content')

  // Set initial values from URL parameters
  useEffect(() => {
    if (dateParam) {
      setPublishDate(new Date(dateParam))
    }
    if (contentParam) {
      setContent(decodeURIComponent(contentParam))
    }
  }, [dateParam, contentParam])

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 's',
      ctrlKey: true,
      description: 'Save draft',
      action: () => handleSave('draft')
    },
    {
      key: 'Enter',
      ctrlKey: true,
      description: 'Schedule post',
      action: () => handleSave('scheduled')
    }
  ]

  useKeyboardShortcuts({ shortcuts })

  useEffect(() => {
    if (userId) {
      loadIntegrations()
    }
    if (projectId) {
      loadProject()
    }
  }, [userId, projectId])

  const loadProject = async () => {
    if (!projectId) return
    
    try {
      const projectData = await ProjectService.getProject(projectId)
      if (projectData) {
        // Pre-fill content with project title/description
        setContent(`Check out our latest video: ${projectData.title}\n\n${projectData.description}`)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const data = await socialService.getIntegrations(userId!)
      setIntegrations(data.filter(i => !i.disabled))
      
      // Pre-select all active integrations
      setSelectedPlatforms(data.filter(i => !i.disabled).map(i => i.id))
    } catch (error) {
      console.error('Failed to load integrations:', error)
      toast.error('Failed to load social accounts')
    } finally {
      setLoading(false)
    }
  }

  const handlePlatformToggle = (integrationId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(integrationId) 
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    )
  }

  const generateWithAI = () => {
    // TODO: Implement AI content generation
    toast.info('AI content generation coming soon!')
  }

  const loadTemplate = () => {
    // TODO: Implement template loading
    toast.info('Template loading coming soon!')
  }

  const handleSave = async (state: 'draft' | 'scheduled') => {
    if (!content.trim()) {
      toast.error('Please enter some content')
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform')
      return
    }

    try {
      setSubmitting(true)
      
      const selectedIntegrations = integrations.filter(i => selectedPlatforms.includes(i.id))
      const platforms = selectedIntegrations.map(i => i.platform)
      
      const request: CreatePostRequest = {
        integration_ids: selectedPlatforms,
        platforms: platforms,
        content,
        title: title.trim() || undefined,
        media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        hashtags: hashtags.trim() ? hashtags.split(' ').filter(h => h.startsWith('#')) : undefined,
        publish_date: state === 'scheduled' ? publishDate.toISOString() : new Date().toISOString(),
        project_id: projectId || undefined
      }

      await socialService.createPost(userId!, request)
      
      toast.success(state === 'scheduled' ? 'Post scheduled!' : 'Draft saved!')
      
      // Navigate back to social dashboard or project
      if (projectId) {
        router.push(ROUTES.PROJECT_DETAIL(projectId))
      } else {
        router.push(ROUTES.SOCIAL)
      }
    } catch (error) {
      console.error('Failed to save post:', error)
      toast.error('Failed to save post')
    } finally {
      setSubmitting(false)
    }
  }

  const getCharacterCount = () => {
    const selectedIntegrations = integrations.filter(i => selectedPlatforms.includes(i.id))
    const platforms = selectedIntegrations.map(i => i.platform)
    const minLimit = Math.min(...platforms.map(p => platformCharLimits[p]))
    return {
      current: content.length,
      limit: minLimit,
      percentage: (content.length / minLimit) * 100
    }
  }

  const charCount = getCharacterCount()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative container max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/social')}
              >
                <IconArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">Create Post</h1>
            </div>
            <p className="text-muted-foreground">Share your content across multiple platforms</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadTemplate}
            >
              <IconTemplate className="h-4 w-4 mr-2" />
              Use Template
            </Button>
            <Button
              variant="outline"
              onClick={generateWithAI}
            >
              <IconWand className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Write your post content. It will be adapted for each platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    placeholder="Enter a title for platforms that support it"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className={cn(
                      "text-sm",
                      charCount.percentage > 100 ? "text-red-600" : 
                      charCount.percentage > 80 ? "text-yellow-600" : 
                      "text-muted-foreground"
                    )}>
                      {charCount.current} / {charCount.limit} characters
                    </p>
                    {charCount.percentage > 100 && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <IconAlertCircle className="h-4 w-4" />
                        Exceeds limit for some platforms
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input
                    id="hashtags"
                    placeholder="#contentcreation #socialmedia"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate hashtags with spaces
                  </p>
                </div>

                <div>
                  <Label htmlFor="media">Media</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <IconPhoto className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop images or videos here
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Choose Files
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduling</CardTitle>
                <CardDescription>
                  Choose when to publish your post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="schedule">Schedule for later</Label>
                    <p className="text-sm text-muted-foreground">
                      Post at a specific date and time
                    </p>
                  </div>
                  <Switch
                    id="schedule"
                    checked={schedulePost}
                    onCheckedChange={setSchedulePost}
                  />
                </div>

                {schedulePost && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={publishDate.toISOString().split('T')[0]}
                          onChange={(e) => {
                            const date = new Date(e.target.value)
                            date.setHours(publishDate.getHours())
                            date.setMinutes(publishDate.getMinutes())
                            setPublishDate(date)
                          }}
                        />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={publishDate.toTimeString().slice(0, 5)}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':')
                            const date = new Date(publishDate)
                            date.setHours(parseInt(hours))
                            date.setMinutes(parseInt(minutes))
                            setPublishDate(date)
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your local time: {publishDate.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platform Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Platforms</CardTitle>
                <CardDescription>
                  Choose where to publish your post
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integrations.length > 0 ? (
                  <div className="space-y-3">
                    {integrations.map((integration) => {
                      const Icon = platformIcons[integration.platform]
                      const isSelected = selectedPlatforms.includes(integration.id)
                      
                      return (
                        <motion.div
                          key={integration.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                              isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                            )}
                            onClick={() => handlePlatformToggle(integration.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg", platformColors[integration.platform])}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{integration.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {integration.platform}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={isSelected}
                              onCheckedChange={() => handlePlatformToggle(integration.id)}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IconAlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No social accounts connected
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/social')}
                    >
                      Connect Accounts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSparkles className="h-5 w-5 text-purple-600" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                  <p className="text-sm font-medium mb-1">Best time to post</p>
                  <p className="text-xs text-muted-foreground">
                    Tuesday 10:00 AM - High engagement expected
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                  <p className="text-sm font-medium mb-1">Trending hashtags</p>
                  <p className="text-xs text-muted-foreground">
                    #ContentCreator #SocialMediaTips #Growth
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="w-full">
                  Get more suggestions
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full gradient-premium"
                size="lg"
                onClick={() => handleSave('scheduled')}
                disabled={submitting || selectedPlatforms.length === 0 || !content.trim()}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconSend className="h-4 w-4 mr-2" />
                    Schedule Post
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSave('draft')}
              >
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 

export default function ComposeSocialPost() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ComposeSocialPostContent />
    </Suspense>
  )
}