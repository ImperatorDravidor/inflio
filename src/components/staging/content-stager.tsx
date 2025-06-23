"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { 
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandX,
  IconBrandFacebook,
  IconSparkles,
  IconHash,
  IconAt,
  IconLink,
  IconPhoto,
  IconVideo,
  IconArticle,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconCopy,
  IconEye,
  IconBulb,
  IconTrendingUp,
  IconEdit,
  IconCalendar
} from "@tabler/icons-react"
import { StagedContent } from "@/lib/staging/staging-service"
import { Platform } from "@/lib/social/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContentStagerProps {
  content: StagedContent[]
  onUpdate: (content: StagedContent[]) => void
  onNext: () => void
}

const platformIcons = {
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  x: IconBrandX,
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram
}

const platformColors = {
  instagram: 'from-purple-500 to-pink-500',
  linkedin: 'from-blue-600 to-blue-700',
  tiktok: 'from-black to-gray-800',
  youtube: 'from-red-500 to-red-600',
  x: 'from-gray-900 to-black',
  facebook: 'from-blue-500 to-blue-600',
  threads: 'from-gray-800 to-black'
}

const contentTypeIcons = {
  clip: IconVideo,
  blog: IconArticle,
  image: IconPhoto,
  carousel: IconPhoto
}

// Platform character limits
const PLATFORM_LIMITS = {
  instagram: { caption: 2200, hashtags: 30, hashtagChars: 2200 },
  facebook: { caption: 63206, hashtags: 0, hashtagChars: 0 },
  x: { caption: 280, hashtags: 280, hashtagChars: 280 },
  linkedin: { caption: 3000, hashtags: 3000, hashtagChars: 3000 },
  tiktok: { caption: 2200, hashtags: 100, hashtagChars: 2200 },
  youtube: { caption: 5000, hashtags: 15, hashtagChars: 500 },
  threads: { caption: 500, hashtags: 0, hashtagChars: 0 }
}

export function ContentStager({ content, onUpdate, onNext }: ContentStagerProps) {
  const [selectedContent, setSelectedContent] = useState<string>(content[0]?.id || '')
  const [editedContent, setEditedContent] = useState<StagedContent[]>(content)
  const [autoHashtags, setAutoHashtags] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [viewMode, setViewMode] = useState<'detail' | 'overview'>('detail')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  const currentItem = editedContent.find(item => item.id === selectedContent)

  useEffect(() => {
    // Update parent when content changes
    onUpdate(editedContent)
    // Validate all content
    validateAllContent()
  }, [editedContent])

  const validateAllContent = () => {
    const errors: Record<string, string[]> = {}
    
    editedContent.forEach(item => {
      const itemErrors: string[] = []
      
      item.platforms.forEach(platform => {
        const platformData = item.platformContent[platform]
        
        if (!platformData?.caption || platformData.caption.length === 0) {
          itemErrors.push(`Missing caption for ${platform}`)
        }
        
        if (platformData && !platformData.isValid) {
          platformData.validationErrors?.forEach(err => {
            itemErrors.push(`${platform}: ${err}`)
          })
        }
        
        // Check required fields based on content type
        if (item.type === 'image' || item.type === 'carousel') {
          if (!platformData?.altText || platformData.altText.length === 0) {
            itemErrors.push(`Missing alt text for ${platform}`)
          }
        }
        
        // Platform-specific validation
        if (platform === 'instagram' && (!platformData?.hashtags || platformData.hashtags.length < 3)) {
          itemErrors.push(`Instagram: Add at least 3 hashtags for better reach`)
        }
      })
      
      if (itemErrors.length > 0) {
        errors[item.id] = itemErrors
      }
    })
    
    setValidationErrors(errors)
    return errors
  }

  const handlePlatformContentUpdate = (
    contentId: string, 
    platform: Platform, 
    field: string, 
    value: any
  ) => {
    const updated = editedContent.map(item => {
      if (item.id === contentId) {
        const updatedPlatformContent = {
          ...item.platformContent[platform],
          [field]: value
        }
        
        // Update character count and validation
        if (field === 'caption' || field === 'hashtags') {
          const caption = field === 'caption' ? value : (item.platformContent[platform]?.caption || '')
          const hashtags = field === 'hashtags' ? value : (item.platformContent[platform]?.hashtags || [])
          const hashtagText = hashtags.map((tag: string) => `#${tag}`).join(' ')
          const totalLength = caption.length + (hashtagText ? hashtagText.length + 1 : 0)
          const limit = PLATFORM_LIMITS[platform]
          
          updatedPlatformContent.characterCount = totalLength
          updatedPlatformContent.isValid = totalLength <= limit.caption
          updatedPlatformContent.validationErrors = totalLength > limit.caption 
            ? [`Content exceeds ${limit.caption} character limit (${totalLength} characters)`]
            : []
        }
        
        return {
          ...item,
          platformContent: {
            ...item.platformContent,
            [platform]: updatedPlatformContent
          }
        }
      }
      return item
    })
    setEditedContent(updated)
  }

  const handleHashtagUpdate = (contentId: string, platform: Platform, hashtags: string[]) => {
    handlePlatformContentUpdate(contentId, platform, 'hashtags', hashtags)
  }

  const addHashtag = (contentId: string, platform: Platform, hashtag: string) => {
    if (!hashtag.trim()) return
    
    const item = editedContent.find(i => i.id === contentId)
    const currentHashtags = item?.platformContent[platform]?.hashtags || []
    const cleanHashtag = hashtag.replace('#', '').trim()
    
    const limit = PLATFORM_LIMITS[platform]
    if (currentHashtags.length >= limit.hashtags && limit.hashtags > 0) {
      toast.error(`Maximum ${limit.hashtags} hashtags allowed on ${platform}`)
      return
    }
    
    if (!currentHashtags.includes(cleanHashtag)) {
      handleHashtagUpdate(contentId, platform, [...currentHashtags, cleanHashtag])
    }
  }

  const removeHashtag = (contentId: string, platform: Platform, hashtag: string) => {
    const item = editedContent.find(i => i.id === contentId)
    const currentHashtags = item?.platformContent[platform]?.hashtags || []
    handleHashtagUpdate(contentId, platform, currentHashtags.filter(h => h !== hashtag))
  }

  const generateSmartCaption = async (contentId: string, platform: Platform) => {
    const key = `${contentId}-${platform}`
    setIsGenerating({ ...isGenerating, [key]: true })
    
    try {
      // Call AI service to generate caption
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentItem?.originalData,
          platform,
          type: currentItem?.type
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate caption')
      
      const { caption, hashtags, suggestions } = await response.json()
      
      handlePlatformContentUpdate(contentId, platform, 'caption', caption)
      if (hashtags && hashtags.length > 0) {
        handleHashtagUpdate(contentId, platform, hashtags)
      }
      
      // Store AI suggestions for later use
      setAiSuggestions({
        ...aiSuggestions,
        [key]: suggestions
      })
      
      toast.success('Smart caption generated!')
    } catch (error) {
      console.error('Error generating caption:', error)
      toast.error('Failed to generate caption')
      // Use fallback caption
      const fallbackCaptions = getSmartCaptionFallback(currentItem?.type || 'clip', platform)
      handlePlatformContentUpdate(contentId, platform, 'caption', fallbackCaptions)
    } finally {
      setIsGenerating({ ...isGenerating, [key]: false })
    }
  }

  const getSmartCaptionFallback = (contentType: string, platform: Platform): string => {
    const templates: Record<Platform, Record<string, string>> = {
      instagram: {
        clip: "🎬 Check out this amazing video!\n\nWhat do you think? Let me know in the comments! 👇\n\n#video #content #viral",
        blog: "📖 New article alert! Swipe up to read more about this fascinating topic.\n\nSave this post for later! 📌",
        image: "✨ Sometimes a picture says it all.\n\nDouble tap if you agree! ❤️"
      },
      linkedin: {
        clip: "Excited to share this insightful video with my network.\n\nKey takeaways:\n→ \n→ \n→ \n\nWhat has been your experience?",
        blog: "Just published a new article exploring [topic].\n\nIn this piece, I discuss:\n• \n• \n• \n\nWould love to hear your thoughts!",
        image: "Visual insights often reveal patterns we might otherwise miss.\n\nWhat observations do you draw from this?"
      },
      x: {
        clip: "🎥 New video alert!\n\nCheck it out and let me know what you think 👇",
        blog: "Just published: [Title]\n\nKey insights inside 🧵",
        image: "This speaks for itself 👀"
      },
      tiktok: {
        clip: "Wait for it... 🤯\n\n#fyp #viral #trending",
        blog: "POV: You just found the best article 📚",
        image: "Save this for later! 📌"
      },
      facebook: {
        clip: "🎬 Just shared a new video!\n\nWhat are your thoughts?",
        blog: "📖 New article is live!\n\nWould love to hear your perspective.",
        image: "Sometimes images tell the best stories 📸"
      },
      youtube: {
        clip: "New video is up! 🎬\n\nTimestamps in description 👇",
        blog: "Blog post about this topic linked below 📝",
        image: "Visual content for your feed 🎨"
      },
      threads: {
        clip: "New video dropped 🎬\n\nThoughts?",
        blog: "Just wrote about this...\n\nLet's discuss 💬",
        image: "Visual storytelling at its finest 📸"
      }
    }
    
    const platformTemplates = templates[platform]
    if (!platformTemplates) return "Check out this amazing content!"
    
    return platformTemplates[contentType] || platformTemplates.clip || "Check out this amazing content!"
  }

  const copyToAllPlatforms = (sourceplatform: Platform, field: 'caption' | 'hashtags') => {
    if (!currentItem) return
    
    const sourceContent = currentItem.platformContent[sourceplatform]
    if (!sourceContent) return
    
    const value = sourceContent[field]
    
    currentItem.platforms.forEach(platform => {
      if (platform !== sourceplatform) {
        handlePlatformContentUpdate(currentItem.id, platform, field, value)
      }
    })
    
    toast.success(`${field === 'caption' ? 'Caption' : 'Hashtags'} copied to all platforms`)
  }

  const suggestTrendingHashtags = async (contentId: string, platform: Platform) => {
    // In production, fetch from trending API
    const trending = {
      instagram: ['trending', 'viral', 'instagood', 'photooftheday', 'instadaily'],
      tiktok: ['fyp', 'foryoupage', 'viral', 'trending', 'foryou'],
      linkedin: ['business', 'entrepreneur', 'leadership', 'innovation', 'professional'],
      x: ['breaking', 'trending', 'tech', 'news', 'viral'],
      facebook: ['trending', 'viral', 'sharethis', 'mustread', 'amazing'],
      youtube: ['youtube', 'youtuber', 'subscribe', 'video', 'vlog'],
      threads: ['threads', 'meta', 'conversation', 'discussion', 'community']
    }
    
    const platformTrending = trending[platform] || []
    const item = editedContent.find(i => i.id === contentId)
    const currentHashtags = item?.platformContent[platform]?.hashtags || []
    
    // Add only new trending hashtags
    const newTrending = platformTrending.filter(tag => !currentHashtags.includes(tag))
    
    if (newTrending.length > 0) {
      handleHashtagUpdate(contentId, platform, [...currentHashtags, ...newTrending.slice(0, 3)])
      toast.success('Added trending hashtags')
    }
  }

  const isContentReady = (item: StagedContent) => {
    return item.platforms.every(platform => {
      const platformData = item.platformContent[platform]
      return platformData?.caption && 
             platformData.caption.length > 0 && 
             platformData.isValid !== false &&
             (item.type !== 'image' && item.type !== 'carousel' || platformData.altText)
    })
  }

  const getCompletionStats = () => {
    const total = editedContent.length
    const ready = editedContent.filter(isContentReady).length
    const percentage = total > 0 ? Math.round((ready / total) * 100) : 0
    return { total, ready, percentage }
  }

  const handleProceed = () => {
    const errors = validateAllContent()
    if (Object.keys(errors).length > 0) {
      // Show error toast with first error
      const firstError = Object.values(errors)[0][0]
      toast.error(`Please complete all required fields: ${firstError}`)
      
      // Switch to overview mode to show all errors
      setViewMode('overview')
      return
    }
    
    onNext()
  }

  const stats = getCompletionStats()
  const allContentReady = stats.ready === stats.total && stats.total > 0

  if (!currentItem && viewMode === 'detail') {
    return <div>No content selected</div>
  }

  const ContentTypeIcon = contentTypeIcons[currentItem?.type || 'clip']

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Progress Overview with Action Buttons */}
        <Card className={cn(
          "border-2 transition-all",
          !allContentReady && "border-orange-500/50 bg-orange-50/5"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Content Preparation Progress</p>
                <span className="text-sm text-muted-foreground">{stats.ready} of {stats.total} ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'detail' ? 'overview' : 'detail')}
                >
                  <IconEye className="h-4 w-4 mr-2" />
                  {viewMode === 'detail' ? 'Overview' : 'Details'}
                </Button>
                <Button
                  onClick={handleProceed}
                  disabled={!allContentReady}
                  className={cn(
                    "transition-all",
                    !allContentReady && "animate-pulse"
                  )}
                >
                  {allContentReady ? (
                    <>
                      <IconCalendar className="h-4 w-4 mr-2" />
                      Proceed to Scheduling
                    </>
                  ) : (
                    <>
                      <IconAlertCircle className="h-4 w-4 mr-2" />
                      Complete All Fields
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Progress 
              value={stats.percentage} 
              className={cn(
                "h-3 transition-all",
                stats.percentage === 100 ? "bg-green-100" : "bg-orange-100"
              )}
            />
            {!allContentReady && Object.keys(validationErrors).length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                  ⚠️ Required fields missing:
                </p>
                <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                  {Object.entries(validationErrors).slice(0, 3).map(([contentId, errors]) => {
                    const content = editedContent.find(c => c.id === contentId)
                    return (
                      <li key={contentId} className="flex items-start gap-2">
                        <span className="font-medium">{content?.title}:</span>
                        <span>{errors[0]}</span>
                      </li>
                    )
                  })}
                  {Object.keys(validationErrors).length > 3 && (
                    <li className="text-orange-600 dark:text-orange-400">
                      ...and {Object.keys(validationErrors).length - 3} more issues
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Mode Switch */}
        {viewMode === 'overview' ? (
          // Bird's Eye Overview Mode
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Overview</CardTitle>
                <CardDescription>
                  Complete all required fields for each content piece across all platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {editedContent.map((item) => {
                    const Icon = contentTypeIcons[item.type]
                    const ready = isContentReady(item)
                    const itemErrors = validationErrors[item.id] || []
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "border rounded-lg p-4 transition-all",
                          !ready && "border-orange-500 bg-orange-50/5",
                          selectedContent === item.id && "ring-2 ring-primary"
                        )}
                      >
                        {/* Content Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              ready ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContent(item.id)
                              setViewMode('detail')
                            }}
                          >
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>

                        {/* Platform Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {item.platforms.map((platform) => {
                            const PlatformIcon = platformIcons[platform]
                            const platformData = item.platformContent[platform]
                            const hasCaption = platformData?.caption && platformData.caption.length > 0
                            const hasAltText = item.type === 'image' || item.type === 'carousel' 
                              ? platformData?.altText && platformData.altText.length > 0
                              : true
                            const isValid = platformData?.isValid !== false
                            const platformReady = hasCaption && hasAltText && isValid
                            
                            return (
                              <div
                                key={platform}
                                className={cn(
                                  "p-3 rounded-lg border transition-all",
                                  platformReady 
                                    ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                                    : "bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <PlatformIcon className="h-4 w-4" />
                                    <span className="text-sm font-medium capitalize">{platform}</span>
                                  </div>
                                  {platformReady ? (
                                    <IconCheck className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <IconAlertCircle className="h-4 w-4 text-orange-600" />
                                  )}
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "inline-block w-2 h-2 rounded-full",
                                      hasCaption ? "bg-green-500" : "bg-orange-500"
                                    )} />
                                    <span className="text-muted-foreground">Caption</span>
                                  </div>
                                  {(item.type === 'image' || item.type === 'carousel') && (
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "inline-block w-2 h-2 rounded-full",
                                        hasAltText ? "bg-green-500" : "bg-orange-500"
                                      )} />
                                      <span className="text-muted-foreground">Alt Text</span>
                                    </div>
                                  )}
                                  {platformData?.characterCount && (
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "inline-block w-2 h-2 rounded-full",
                                        isValid ? "bg-green-500" : "bg-red-500"
                                      )} />
                                      <span className="text-muted-foreground">
                                        {platformData.characterCount}/{PLATFORM_LIMITS[platform].caption}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Errors */}
                        {itemErrors.length > 0 && (
                          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                              Issues to fix:
                            </p>
                            <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-0.5">
                              {itemErrors.map((error, idx) => (
                                <li key={idx}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Existing detail view content
          <>
            {/* Content Selector */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Content</CardTitle>
                    <CardDescription>Choose content to customize for each platform</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {editedContent.map((item) => {
                      const Icon = contentTypeIcons[item.type]
                      const ready = isContentReady(item)
                      const hasErrors = validationErrors[item.id]?.length > 0
                      
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            onClick={() => setSelectedContent(item.id)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              selectedContent === item.id 
                                ? "border-primary bg-primary/10 shadow-sm" 
                                : "hover:bg-accent/50",
                              hasErrors && "border-orange-500 bg-orange-50/5"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-full",
                              ready ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                              {hasErrors && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {validationErrors[item.id][0]}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.analytics?.estimatedReach && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="text-xs">
                                      <IconTrendingUp className="h-3 w-3 mr-1" />
                                      {(item.analytics.estimatedReach / 1000).toFixed(1)}k
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Estimated reach: {item.analytics.estimatedReach.toLocaleString()}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {ready ? (
                                <IconCheck className="h-5 w-5 text-green-500" />
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <IconAlertCircle className="h-5 w-5 text-orange-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Incomplete fields</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Platform Content Editor */}
            {currentItem && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ContentTypeIcon className="h-5 w-5" />
                        {currentItem.title}
                      </CardTitle>
                      <CardDescription>
                        Customize content for each platform • {currentItem.type}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="auto-hashtags" className="text-sm">Smart Hashtags</Label>
                        <Switch
                          id="auto-hashtags"
                          checked={autoHashtags}
                          onCheckedChange={setAutoHashtags}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={currentItem.platforms[0]} className="w-full">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${currentItem.platforms.length}, 1fr)` }}>
                      {currentItem.platforms.map((platform) => {
                        const Icon = platformIcons[platform]
                        const platformData = currentItem.platformContent[platform]
                        const isValid = platformData?.isValid !== false
                        
                        return (
                          <TabsTrigger 
                            key={platform} 
                            value={platform} 
                            className={cn(
                              "flex items-center gap-2",
                              !isValid && "text-destructive"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{platform}</span>
                            {!isValid && (
                              <IconAlertCircle className="h-3 w-3 ml-1" />
                            )}
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {currentItem.platforms.map((platform) => {
                      const platformData = currentItem.platformContent[platform] || {
                        caption: '',
                        hashtags: [],
                        cta: '',
                        altText: '',
                        characterCount: 0,
                        isValid: true
                      }
                      const limit = PLATFORM_LIMITS[platform]
                      const key = `${currentItem.id}-${platform}`
                      const suggestions = aiSuggestions[key]

                      return (
                        <TabsContent key={platform} value={platform} className="space-y-4 mt-6">
                          {/* Caption */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`caption-${platform}`}>Caption</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToAllPlatforms(platform, 'caption')}
                                >
                                  <IconCopy className="h-4 w-4 mr-1" />
                                  Copy to All
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateSmartCaption(currentItem.id, platform)}
                                  disabled={isGenerating[key]}
                                >
                                  <IconSparkles className={cn(
                                    "h-4 w-4 mr-2",
                                    isGenerating[key] && "animate-spin"
                                  )} />
                                  {isGenerating[key] ? 'Generating...' : 'AI Caption'}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <Textarea
                                id={`caption-${platform}`}
                                value={platformData.caption || ''}
                                onChange={(e) => handlePlatformContentUpdate(
                                  currentItem.id, 
                                  platform, 
                                  'caption', 
                                  e.target.value
                                )}
                                placeholder={`Write an engaging ${platform} caption...`}
                                className={cn(
                                  "min-h-[120px] pr-16",
                                  !platformData.isValid && "border-destructive focus-visible:ring-destructive"
                                )}
                                maxLength={limit.caption}
                              />
                              <div className={cn(
                                "absolute bottom-2 right-2 text-xs px-2 py-1 rounded",
                                (platformData.characterCount || 0) > limit.caption * 0.9 
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {platformData.characterCount || 0}/{limit.caption}
                              </div>
                            </div>
                            
                            {!platformData.isValid && platformData.validationErrors?.map((error, i) => (
                              <p key={i} className="text-xs text-destructive flex items-center gap-1">
                                <IconAlertCircle className="h-3 w-3" />
                                {error}
                              </p>
                            ))}
                            
                            {suggestions && (
                              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                                <p className="text-xs font-medium flex items-center gap-1">
                                  <IconBulb className="h-3 w-3" />
                                  AI Suggestions
                                </p>
                                <p className="text-xs text-muted-foreground">{suggestions.tip}</p>
                              </div>
                            )}
                          </div>

                          {/* Hashtags */}
                          {limit.hashtags > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Hashtags ({platformData.hashtags?.length || 0}/{limit.hashtags})</Label>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToAllPlatforms(platform, 'hashtags')}
                                  >
                                    <IconCopy className="h-4 w-4 mr-1" />
                                    Copy
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => suggestTrendingHashtags(currentItem.id, platform)}
                                  >
                                    <IconTrendingUp className="h-4 w-4 mr-1" />
                                    Trending
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 min-h-[32px]">
                                <AnimatePresence>
                                  {platformData.hashtags?.map((tag) => (
                                    <motion.div
                                      key={tag}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-destructive/10"
                                        onClick={() => removeHashtag(currentItem.id, platform, tag)}
                                      >
                                        #{tag} ×
                                      </Badge>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                              
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add hashtag..."
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      addHashtag(currentItem.id, platform, e.currentTarget.value)
                                      e.currentTarget.value = ''
                                    }
                                  }}
                                  disabled={platformData.hashtags?.length >= limit.hashtags}
                                />
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                    if (input.value) {
                                      addHashtag(currentItem.id, platform, input.value)
                                      input.value = ''
                                    }
                                  }}
                                  disabled={platformData.hashtags?.length >= limit.hashtags}
                                >
                                  <IconHash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Platform-specific fields */}
                          {currentItem.type === 'image' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`alt-${platform}`}>Alt Text (Accessibility)</Label>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Describe the image for screen readers and accessibility</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Input
                                id={`alt-${platform}`}
                                value={platformData.altText || ''}
                                onChange={(e) => handlePlatformContentUpdate(
                                  currentItem.id,
                                  platform,
                                  'altText',
                                  e.target.value
                                )}
                                placeholder="Describe the image content..."
                              />
                            </div>
                          )}

                          {['instagram', 'facebook', 'linkedin'].includes(platform) && (
                            <div className="space-y-2">
                              <Label htmlFor={`cta-${platform}`}>Call to Action</Label>
                              <Select
                                value={platformData.cta || ''}
                                onValueChange={(value) => handlePlatformContentUpdate(
                                  currentItem.id,
                                  platform,
                                  'cta',
                                  value
                                )}
                              >
                                <SelectTrigger id={`cta-${platform}`}>
                                  <SelectValue placeholder="Select a CTA..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Learn More">Learn More</SelectItem>
                                  <SelectItem value="Shop Now">Shop Now</SelectItem>
                                  <SelectItem value="Sign Up">Sign Up</SelectItem>
                                  <SelectItem value="Download">Download</SelectItem>
                                  <SelectItem value="Get Started">Get Started</SelectItem>
                                  <SelectItem value="Contact Us">Contact Us</SelectItem>
                                  <SelectItem value="Watch More">Watch More</SelectItem>
                                  <SelectItem value="Book Now">Book Now</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {platform === 'linkedin' && currentItem.type === 'blog' && (
                            <div className="space-y-2">
                              <Label htmlFor={`link-${platform}`}>Article Link</Label>
                              <div className="flex gap-2">
                                <Input
                                  id={`link-${platform}`}
                                  value={platformData.link || ''}
                                  onChange={(e) => handlePlatformContentUpdate(
                                    currentItem.id,
                                    platform,
                                    'link',
                                    e.target.value
                                  )}
                                  placeholder="https://..."
                                  type="url"
                                  className="flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    // Auto-generate blog link
                                    const blogUrl = `${window.location.origin}/blog/${currentItem.originalData.id}`
                                    handlePlatformContentUpdate(currentItem.id, platform, 'link', blogUrl)
                                  }}
                                >
                                  <IconLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Platform Tips */}
                          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              {platform.charAt(0).toUpperCase() + platform.slice(1)} Best Practices:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {getPlatformTips(platform).map((tip, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-primary">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TabsContent>
                      )
                    })}
                  </Tabs>

                  {/* Preview Panel */}
                  <AnimatePresence>
                    {showPreview && currentItem && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6"
                      >
                        <Card className="bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Post Preview</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-48">
                              <div className="space-y-4">
                                {currentItem.platforms.map(platform => {
                                  const Icon = platformIcons[platform]
                                  const data = currentItem.platformContent[platform]
                                  
                                  return (
                                    <div key={platform} className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm font-medium">
                                        <Icon className="h-4 w-4" />
                                        {platform}
                                      </div>
                                      <div className="p-3 rounded-lg bg-background text-sm whitespace-pre-wrap">
                                        {data?.caption || <span className="text-muted-foreground">No caption</span>}
                                        {data?.hashtags && data.hashtags.length > 0 && (
                                          <div className="mt-2 text-primary">
                                            {data.hashtags.map(tag => `#${tag}`).join(' ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

// Helper function for platform tips
function getPlatformTips(platform: Platform): string[] {
  const tips = {
    instagram: [
      "Use 5-10 relevant hashtags for best reach",
      "Include a clear call-to-action",
      "Emojis increase engagement by 47%"
    ],
    linkedin: [
      "Professional tone works best",
      "Include industry insights",
      "Posts with 3-5 hashtags get 2x engagement"
    ],
    x: [
      "Keep it concise and punchy",
      "Use 1-2 hashtags maximum",
      "Thread multiple tweets for long content"
    ],
    tiktok: [
      "Hook viewers in first 3 seconds",
      "Use trending sounds and hashtags",
      "Keep captions short and engaging"
    ],
    facebook: [
      "Questions increase engagement",
      "Native video performs best",
      "Tag relevant pages when appropriate"
    ],
    youtube: [
      "Include timestamps for long videos",
      "Use SEO-friendly descriptions",
      "Add 5-15 relevant tags"
    ],
    threads: [
      "Start conversations",
      "Be authentic and personal",
      "Reply to comments quickly"
    ]
  }
  
  return tips[platform] || []
} 