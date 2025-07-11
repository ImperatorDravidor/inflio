"use client"

<<<<<<< HEAD
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { 
  IconCheck,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  IconX,
  IconPlus,
  IconTrash,
  IconEye,
  IconChevronRight,
  IconChevronLeft,
  IconSparkles,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandX,
  IconBrandFacebook,
  IconHash,
  IconClock,
  IconTargetArrow,
  IconShare2
} from "@tabler/icons-react"
import { StagedContent } from "@/lib/staging/staging-service"
import { Platform } from "@/lib/social/types"
import { getContentForm, validateField, ContentType, FieldDefinition } from "@/lib/staging/content-forms"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { getStatusClasses, getPlatformClasses, getFieldClasses, getTaskClasses } from "@/lib/design-tokens"

interface EnhancedContentStagerProps {
  content: StagedContent[]
  onUpdate: (content: StagedContent[]) => void
  onNext: () => void
}

const platformIcons: Record<string, any> = {
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  'youtube-short': IconBrandYoutube,
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

const platformNames = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  'youtube-short': 'YouTube Shorts',
  x: 'X (Twitter)',
  facebook: 'Facebook',
  threads: 'Threads'
}

interface TaskItem {
  id: string
  label: string
  description?: string
  platform: Platform
  field: string
  completed: boolean
  required: boolean
  error?: string
}

interface PlatformContentData {
  [key: string]: any
}

export function EnhancedContentStager({ content, onUpdate, onNext }: EnhancedContentStagerProps) {
  const [selectedContent, setSelectedContent] = useState<string>(content[0]?.id || '')
  const [editedContent, setEditedContent] = useState<StagedContent[]>(content)
  const [currentPlatform, setCurrentPlatform] = useState<Platform | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})

  const currentItem = editedContent.find(item => item.id === selectedContent)

  // Map content types for form selection
  const getContentTypeForForm = (type: string): ContentType => {
    const mapping: Record<string, ContentType> = {
      'clip': 'video',
      'blog': 'article',
      'image': 'image',
      'carousel': 'carousel',
      'social': 'video',
      'longform': 'video'
    }
    return mapping[type] || 'video'
  }

  // Generate tasks for current content and platform
  useEffect(() => {
    if (currentItem && currentPlatform) {
      generateTasks()
    }
  }, [selectedContent, currentPlatform])

  // Auto-select first platform
  useEffect(() => {
    if (currentItem && currentItem.platforms && currentItem.platforms.length > 0 && !currentPlatform) {
      setCurrentPlatform(currentItem.platforms[0])
    }
  }, [currentItem])

  const generateTasks = () => {
    if (!currentItem || !currentPlatform) return

    const contentType = getContentTypeForForm(currentItem.type)
    const formDef = getContentForm(currentPlatform, contentType)
    
    if (!formDef) {
      setTasks([])
      return
    }

    const platformData = (currentItem.platformContent[currentPlatform] as PlatformContentData) || {}
    const newTasks: TaskItem[] = []

    // Add tasks for each field
    formDef.fields.forEach(field => {
      const value = platformData[field.name]
      const error = validateField(field, value)
      
      newTasks.push({
        id: `${currentPlatform}-${field.name}`,
        label: field.label,
        description: field.helpText,
        platform: currentPlatform,
        field: field.name,
        completed: !error && value !== undefined && value !== '',
        required: field.required,
        error: error || undefined
      })
    })

    // Sort tasks: incomplete required first, then incomplete optional, then completed
    newTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.required !== b.required) return a.required ? -1 : 1
      return 0
    })

    setTasks(newTasks)
  }

  const handleFieldUpdate = (field: string, value: any) => {
    if (!currentItem || !currentPlatform) return

    const updated = editedContent.map(item => {
      if (item.id === currentItem.id) {
        return {
          ...item,
          platformContent: {
            ...item.platformContent,
            [currentPlatform]: {
              ...(item.platformContent[currentPlatform] as PlatformContentData || {}),
              [field]: value
            }
          }
        }
      }
      return item
    })

    setEditedContent(updated)
    onUpdate(updated)
    
    // Regenerate tasks after update
    setTimeout(generateTasks, 100)
  }

  const renderField = (field: FieldDefinition) => {
    if (!currentItem || !currentPlatform) return null
    
    const platformData = (currentItem.platformContent[currentPlatform] as PlatformContentData) || {}
    const value = platformData[field.name] || ''
    const error = validateField(field, value)
    const fieldState = error ? 'error' : value ? 'success' : 'default'
    const fieldClasses = getFieldClasses(fieldState)

    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
              {field.helpText && (
                <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => handleFieldUpdate(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className={cn(fieldClasses.border, fieldClasses.focus)}
            />
            {field.maxLength && (
              <p className="text-xs text-muted-foreground">
                {value.length}/{field.maxLength} characters
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldUpdate(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className={cn("min-h-[120px]", fieldClasses.border, fieldClasses.focus)}
            />
            {field.maxLength && (
              <Progress 
                value={(value.length / field.maxLength) * 100} 
                className={cn(
                  "h-2",
                  value.length > field.maxLength * 0.9 && "bg-amber-100",
                  value.length > field.maxLength && "bg-destructive/20"
                )}
              />
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldUpdate(field.name, val)}
            >
              <SelectTrigger className={cn(fieldClasses.border, fieldClasses.focus)}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )

      case 'tags':
        const tags = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id={field.name}
                  placeholder={field.placeholder}
                  className={cn(fieldClasses.border, fieldClasses.focus)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.currentTarget
                      const newTag = input.value.trim().replace(/^#/, '')
                      if (newTag && !tags.includes(newTag)) {
                        handleFieldUpdate(field.name, [...tags, newTag])
                        input.value = ''
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Add tag"
                  onClick={() => {
                    const input = document.getElementById(field.name) as HTMLInputElement
                    const newTag = input.value.trim().replace(/^#/, '')
                    if (newTag && !tags.includes(newTag)) {
                      handleFieldUpdate(field.name, [...tags, newTag])
                      input.value = ''
                    }
                  }}
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="pr-1">
                    #{tag}
                    <button
                      onClick={() => handleFieldUpdate(field.name, tags.filter((_, i) => i !== idx))}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${tag}`}
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldUpdate(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm font-normal">
              {field.label}
            </Label>
          </div>
        )

      case 'url':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type="url"
              value={value}
              onChange={(e) => handleFieldUpdate(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={cn(fieldClasses.border, fieldClasses.focus)}
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )

      default:
        return (
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>
              Field type "{field.type}" is not yet implemented. Coming soon!
            </AlertDescription>
          </Alert>
        )
    }
  }

  const generateAIContent = async () => {
    if (!currentItem || !currentPlatform) return

    setIsGenerating({ [currentPlatform]: true })
    
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            id: currentItem.id,
            title: currentItem.title,
            description: currentItem.description,
            type: currentItem.type,
            duration: currentItem.duration,
            thumbnail: currentItem.thumbnailUrl,
            originalData: currentItem.originalData
          },
          platform: currentPlatform
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Caption generation failed:', error)
        throw new Error(error.error || 'Failed to generate content')
      }
      
      const result = await response.json()
      
      // Update multiple fields at once
      const contentType = getContentTypeForForm(currentItem.type)
      const formDef = getContentForm(currentPlatform, contentType)
      
      if (formDef) {
        const updates: Record<string, any> = {}
        
        // Map AI response to form fields
        if (result.caption) {
          const captionField = formDef.fields.find(f => 
            ['caption', 'tweet', 'text', 'description'].includes(f.name)
          )
          if (captionField) updates[captionField.name] = result.caption
        }
        
        if (result.title) {
          const titleField = formDef.fields.find(f => 
            ['title', 'headline'].includes(f.name)
          )
          if (titleField) updates[titleField.name] = result.title
        }
        
        if (result.hashtags && Array.isArray(result.hashtags)) {
          const hashtagField = formDef.fields.find(f => 
            ['hashtags', 'tags'].includes(f.name)
          )
          if (hashtagField) updates[hashtagField.name] = result.hashtags
        }
        
        // Apply all updates
        Object.entries(updates).forEach(([field, value]) => {
          handleFieldUpdate(field, value)
        })
      }
      
      toast.success('AI content generated successfully!')
    } catch (error) {
      console.error('AI generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI content'
      toast.error(errorMessage)
    } finally {
      setIsGenerating({ [currentPlatform]: false })
    }
  }

  const getCompletionStats = () => {
    const totalTasks = tasks.filter(t => t.required).length
    const completedTasks = tasks.filter(t => t.required && t.completed).length
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return { total: totalTasks, completed: completedTasks, percentage }
  }

  const getPlatformCompletion = (platform: Platform) => {
    if (!currentItem) return { complete: false, percentage: 0 }
    
    const contentType = getContentTypeForForm(currentItem.type)
    const formDef = getContentForm(platform, contentType)
    
    if (!formDef) return { complete: false, percentage: 0 }
    
    const platformData = (currentItem.platformContent[platform] as PlatformContentData) || {}
    const requiredFields = formDef.fields.filter(f => f.required)
    const completedFields = requiredFields.filter(f => {
      const error = validateField(f, platformData[f.name])
      return !error && platformData[f.name] !== undefined && platformData[f.name] !== ''
    })
    
    const percentage = requiredFields.length > 0 
      ? Math.round((completedFields.length / requiredFields.length) * 100)
      : 0
      
    return { complete: percentage === 100, percentage }
  }

  const isAllContentReady = () => {
    return editedContent.every(item => 
      item.platforms.every(platform => getPlatformCompletion(platform).complete)
    )
  }

  const stats = getCompletionStats()

  if (!currentItem) {
    return <div className="text-center py-8">No content selected</div>
  }

  const contentType = getContentTypeForForm(currentItem.type)
  const formDef = currentPlatform ? getContentForm(currentPlatform, contentType) : null

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Preparation</CardTitle>
              <CardDescription>
                Complete all required fields for each platform
              </CardDescription>
            </div>
            <Button
              onClick={onNext}
              disabled={!isAllContentReady()}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              Continue to Schedule
              <IconChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Content & Platform Selection */}
        <div className="space-y-4">
          {/* Content Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {editedContent.map(item => {
                const isComplete = item.platforms.every(p => getPlatformCompletion(p).complete)
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedContent(item.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedContent === item.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.type}</p>
                      </div>
                      {isComplete ? (
                        <IconCircleCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <IconCircleX className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Platform Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Platforms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentItem.platforms.map(platform => {
                const Icon = platformIcons[platform]
                const { complete, percentage } = getPlatformCompletion(platform)
                
                return (
                  <button
                    key={platform}
                    onClick={() => setCurrentPlatform(platform)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      currentPlatform === platform 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg text-white bg-gradient-to-br",
                        platformColors[platform]
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{platformNames[platform]}</p>
                        <Progress value={percentage} className="h-1.5 mt-1" />
                      </div>
                      {complete && (
                        <IconCircleCheck className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Task Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Task Checklist</CardTitle>
                <Badge variant={stats.percentage === 100 ? "default" : "secondary"}>
                  {stats.completed}/{stats.total}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg transition-all",
                      task.completed ? "opacity-60" : "bg-accent/30"
                    )}
                  >
                    <Checkbox
                      checked={task.completed}
                      disabled
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm font-medium",
                        task.completed && "line-through"
                      )}>
                        {task.label}
                        {task.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      )}
                      {task.error && !task.completed && (
                        <p className="text-xs text-red-500 mt-1">{task.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
=======
import { useState, useEffect } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  IconSparkles,
  IconPhoto,
  IconVideo,
  IconFileText,
  IconPlus,
  IconX,
  IconWand,
  IconGitMerge,
  IconLayoutGrid,
  IconDeviceMobile,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandTiktok,
  IconBrandFacebook,
  IconEye,
  IconPalette,
  IconTextPlus,
  IconPhotoPlus,
  IconArrowRight,
  IconInfoCircle,
  IconBulb,
  IconMagnet,
  IconRefresh,
  IconCopy,
  IconTrash,
  IconGripVertical,
  IconPhotoEdit,
  IconMovie,
  IconEdit,
  IconCheck,
  IconAlertCircle,
  IconLayoutCards,
  IconColumns,
  IconSquare,
  IconRectangle,
  IconDeviceDesktop,
  IconHash,
  IconAt,
  IconLink,
  IconChevronUp,
  IconChevronDown,
  IconLoader2,
  IconDeviceFloppy
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlatformFields } from "@/components/staging/platform-fields"

interface ContentItem {
  id: string
  type: 'clip' | 'blog' | 'social' | 'image' | 'carousel'
  content: any
  platforms: string[]
}

interface EnhancedPost {
  id: string
  type: 'simple' | 'media-rich' | 'carousel' | 'thread'
  title: string
  elements: PostElement[]
  platforms: string[]
  aiEnhancements: {
    emojis: boolean
    hashtags: boolean
    formatting: boolean
    cta: boolean
  }
  platformContent?: Record<string, string> // Added for multi-platform content
}

interface PostElement {
  id: string
  type: 'text' | 'image' | 'video' | 'clip'
  content: any
  position: number
  settings?: {
    imageStyle?: string
    textOverlay?: boolean
    filter?: string
  }
}

interface SmartSuggestion {
  id: string
  type: 'pairing' | 'enhancement' | 'template'
  title: string
  description: string
  action: () => void
  icon: typeof IconSparkles
}

const platformConfigs = {
  instagram: {
    name: 'Instagram',
    icon: IconBrandInstagram,
    color: 'from-pink-500 to-purple-500',
    formats: ['post', 'story', 'reel', 'carousel'],
    limits: { post: 2200, story: 0, reel: 2200 },
    aspectRatios: { post: '1:1', story: '9:16', reel: '9:16', carousel: '1:1' }
  },
  linkedin: {
    name: 'LinkedIn',
    icon: IconBrandLinkedin,
    color: 'from-blue-600 to-blue-700',
    formats: ['post', 'article', 'video'],
    limits: { post: 3000, article: 110000 },
    aspectRatios: { post: '1.91:1', video: '16:9' }
  },
  twitter: {
    name: 'Twitter/X',
    icon: IconBrandTwitter,
    color: 'from-gray-700 to-gray-900',
    formats: ['tweet', 'thread'],
    limits: { tweet: 280, thread: 25 * 280 },
    aspectRatios: { tweet: '16:9' }
  },
  tiktok: {
    name: 'TikTok',
    icon: IconBrandTiktok,
    color: 'from-gray-900 to-black',
    formats: ['video'],
    limits: { video: 2200 },
    aspectRatios: { video: '9:16' }
  }
}

// Helper function to get character limit for a platform
const getPlatformCharacterLimit = (platform: string): number => {
  const config = platformConfigs[platform as keyof typeof platformConfigs]
  if (!config) return 2200 // Default limit
  
  // Get the first available limit from the platform's limits object
  const limits = config.limits as any
  if (limits.post !== undefined) return limits.post
  if (limits.tweet !== undefined) return limits.tweet
  if (limits.video !== undefined) return limits.video
  if (limits.article !== undefined) return limits.article
  
  // Return the first value if none of the above match
  const firstLimit = Object.values(limits)[0]
  return typeof firstLimit === 'number' ? firstLimit : 2200
}

export function EnhancedContentStager({
  content,
  onUpdate,
  onNext
}: {
  content: ContentItem[]
  onUpdate: (content: any) => void
  onNext: () => void
}) {
  const [enhancedPosts, setEnhancedPosts] = useState<EnhancedPost[]>([])
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [aiProcessing, setAiProcessing] = useState<Record<string, boolean>>({})
  const [generationHistory, setGenerationHistory] = useState<string[]>([])
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [brandSettings, setBrandSettings] = useState({
    colors: [] as string[],
    voice: 'professional' as 'professional' | 'casual' | 'friendly' | 'bold',
    emojisLevel: 'moderate' as 'none' | 'minimal' | 'moderate' | 'heavy'
  })

  useEffect(() => {
    // Initialize smart suggestions based on content
    generateSmartSuggestions()
    // Auto-save draft every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (enhancedPosts.length > 0) {
        saveDraft()
      }
    }, 30000)
    
    return () => clearInterval(autoSaveInterval)
  }, [content, enhancedPosts])

  // Add draft saving functionality
  const saveDraft = () => {
    if (typeof window !== 'undefined') {
      const draft = {
        posts: enhancedPosts,
        savedAt: new Date().toISOString(),
        brandSettings
      }
      localStorage.setItem('content-stager-draft', JSON.stringify(draft))
    }
  }

  // Load draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('content-stager-draft')
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          const savedTime = new Date(draft.savedAt)
          const now = new Date()
          const hoursSince = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)
          
          // Only load if less than 24 hours old
          if (hoursSince < 24) {
            toast.info(
              <div className="flex items-center justify-between gap-2">
                <span>Found draft from {savedTime.toLocaleString()}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEnhancedPosts(draft.posts)
                    setBrandSettings(draft.brandSettings || brandSettings)
                    toast.success('Draft restored')
                  }}
                >
                  Restore
                </Button>
              </div>,
              { duration: 10000 }
            )
          }
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }
  }, [])

  const generateSmartSuggestions = () => {
    const suggestions: SmartSuggestion[] = []

    // Check for clips without images
    const clipsWithoutImages = content.filter(item => 
      item.type === 'clip' && !content.some(img => img.type === 'image')
    )

    if (clipsWithoutImages.length > 0) {
      suggestions.push({
        id: 'generate-clip-images',
        type: 'enhancement',
        title: 'Generate Cover Images for Clips',
        description: `Create eye-catching cover images for ${clipsWithoutImages.length} video clips`,
        action: () => generateCoverImages(clipsWithoutImages),
        icon: IconPhotoPlus
      })
    }

    // Check for long captions that could be threads
    const longCaptions = content.filter(item => 
      item.type === 'social' && item.content.length > 280
    )

    if (longCaptions.length > 0) {
      suggestions.push({
        id: 'create-threads',
        type: 'template',
        title: 'Convert to Threads',
        description: 'Break down long posts into engaging Twitter/LinkedIn threads',
        action: () => convertToThreads(longCaptions),
        icon: IconLayoutCards
      })
    }

    // Suggest carousel for multiple images
    const images = content.filter(item => item.type === 'image')
    if (images.length >= 3) {
      suggestions.push({
        id: 'create-carousel',
        type: 'pairing',
        title: 'Create Image Carousel',
        description: `Combine ${images.length} images into an engaging carousel post`,
        action: () => createCarousel(images),
        icon: IconLayoutGrid
      })
    }

    // AI pairing suggestions
    const clips = content.filter(item => item.type === 'clip')
    const captions = content.filter(item => item.type === 'social')
    
    if (clips.length > 0 && captions.length > 0) {
      suggestions.push({
        id: 'smart-pairing',
        type: 'pairing',
        title: 'Smart Content Pairing',
        description: 'AI will match clips with the best captions based on content',
        action: () => smartPairContent(),
        icon: IconGitMerge
      })
    }

    // Add new AI-powered suggestions
    if (clips.length > 0) {
      suggestions.push({
        id: 'create-teaser',
        type: 'enhancement',
        title: 'Generate Teaser Campaign',
        description: 'Create a multi-part teaser campaign to build anticipation',
        action: () => generateTeaserCampaign(clips[0]),
        icon: IconBulb
      })
    }

    setSmartSuggestions(suggestions)
  }

  const generateCoverImages = async (clips: ContentItem[]) => {
    setIsGeneratingImage(true)
    const processingId = `cover-images-${Date.now()}`
    setAiProcessing(prev => ({ ...prev, [processingId]: true }))
    
    try {
      const batchSize = 3 // Process in batches to avoid overwhelming the API
      for (let i = 0; i < clips.length; i += batchSize) {
        const batch = clips.slice(i, i + batchSize)
        
        await Promise.all(batch.map(async (clip) => {
          try {
            // Generate multiple style options
            const styles = ['thumbnail', 'social', 'quote'] as const
            const imagePromises = styles.map(style => 
              fetch('/api/generate-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: `Create an eye-catching ${style} image for: ${clip.content.title || 'video clip'}. 
                    ${clip.content.viralityExplanation ? `Context: ${clip.content.viralityExplanation}` : ''}
                    Style: modern, vibrant, social media optimized, ${brandSettings.colors.length > 0 ? `using colors ${brandSettings.colors.join(', ')}` : ''}`,
                  count: 1,
                  size: style === 'thumbnail' ? '1920x1080' : '1080x1080',
                  quality: 'hd'
                })
              }).then(res => res.ok ? res.json() : null)
            )

            const results = await Promise.all(imagePromises)
            const validResults = results.filter(r => r && r.urls && r.urls[0])
            
            if (validResults.length > 0) {
              // Create a media-rich post with multiple image options
              const newPost: EnhancedPost = {
                id: `post-${Date.now()}-${Math.random()}`,
                type: 'media-rich',
                title: clip.content.title || 'Video Post',
                elements: [
                  ...validResults.map((result, idx) => ({
                    id: `img-${idx}`,
                    type: 'image' as const,
                    content: { url: result.urls[0] },
                    position: idx,
                    settings: { 
                      textOverlay: idx === 0,
                      imageStyle: styles[idx] 
                    }
                  })),
                  {
                    id: `clip-elem`,
                    type: 'clip',
                    content: clip.content,
                    position: validResults.length
                  },
                  {
                    id: `text-elem`,
                    type: 'text',
                    content: clip.content.publicationCaptions?.instagram || '',
                    position: validResults.length + 1
                  }
                ],
                platforms: ['instagram', 'linkedin', 'facebook'],
                aiEnhancements: {
                  emojis: brandSettings.emojisLevel !== 'none',
                  hashtags: true,
                  formatting: true,
                  cta: true
                }
              }
              
              setEnhancedPosts(prev => [...prev, newPost])
              setGenerationHistory(prev => [...prev, `Generated ${validResults.length} images for "${clip.content.title}"`])
            }
          } catch (error) {
            console.error('Error generating images for clip:', error)
            toast.error(`Failed to generate images for "${clip.content.title}"`)
          }
        }))
        
        // Show progress
        toast.success(`Generated images for ${Math.min(i + batchSize, clips.length)} of ${clips.length} clips`)
      }
      
      toast.success('All cover images generated successfully!')
      saveDraft()
    } catch (error) {
      toast.error('Failed to generate some images. Please try again.')
    } finally {
      setIsGeneratingImage(false)
      setAiProcessing(prev => {
        const newState = { ...prev }
        delete newState[processingId]
        return newState
      })
    }
  }

  const convertToThreads = (longPosts: ContentItem[]) => {
    longPosts.forEach(post => {
      const text = post.content
      const chunks = []
      const words = text.split(' ')
      let currentChunk = ''
      
      words.forEach((word: string) => {
        if ((currentChunk + ' ' + word).length <= 250) {
          currentChunk += (currentChunk ? ' ' : '') + word
        } else {
          chunks.push(currentChunk)
          currentChunk = word
        }
      })
      
      if (currentChunk) chunks.push(currentChunk)
      
      const threadPost: EnhancedPost = {
        id: `thread-${Date.now()}`,
        type: 'thread',
        title: 'Thread Post',
        elements: chunks.map((chunk, index) => ({
          id: `thread-elem-${index}`,
          type: 'text' as const,
          content: `${index + 1}/${chunks.length} ${chunk}`,
          position: index
        })),
        platforms: ['twitter', 'linkedin'],
        aiEnhancements: {
          emojis: true,
          hashtags: true,
          formatting: true,
          cta: true
        }
      }
      
      setEnhancedPosts(prev => [...prev, threadPost])
    })
    
    toast.success('Threads created successfully!')
  }

  const createCarousel = (images: ContentItem[]) => {
    const carouselPost: EnhancedPost = {
      id: `carousel-${Date.now()}`,
      type: 'carousel',
      title: 'Image Carousel',
      elements: images.map((img, index) => ({
        id: `carousel-elem-${index}`,
        type: 'image' as const,
        content: img.content,
        position: index,
        settings: {
          filter: 'none'
        }
      })),
      platforms: ['instagram', 'linkedin', 'facebook'],
      aiEnhancements: {
        emojis: true,
        hashtags: true,
        formatting: true,
        cta: true
      }
    }
    
    setEnhancedPosts(prev => [...prev, carouselPost])
    toast.success('Carousel created!')
  }

  const smartPairContent = async () => {
    toast.info('AI is analyzing content for smart pairing...')
    
    // Simulate AI pairing logic
    setTimeout(() => {
      // This would be replaced with actual AI matching
      const clips = content.filter(item => item.type === 'clip')
      const captions = content.filter(item => item.type === 'social')
      
      clips.forEach((clip, index) => {
        if (captions[index]) {
          const pairedPost: EnhancedPost = {
            id: `paired-${Date.now()}-${index}`,
            type: 'media-rich',
            title: `Smart Paired Post ${index + 1}`,
            elements: [
              {
                id: `pair-clip-${index}`,
                type: 'clip',
                content: clip.content,
                position: 0
              },
              {
                id: `pair-text-${index}`,
                type: 'text',
                content: captions[index].content,
                position: 1
              }
            ],
            platforms: ['instagram', 'tiktok'],
            aiEnhancements: {
              emojis: true,
              hashtags: true,
              formatting: true,
              cta: true
            }
          }
          
          setEnhancedPosts(prev => [...prev, pairedPost])
        }
      })
      
      toast.success('Smart pairing complete!')
    }, 2000)
  }

  const generateTeaserCampaign = async (clip: ContentItem) => {
    const processingId = `teaser-${Date.now()}`
    setAiProcessing(prev => ({ ...prev, [processingId]: true }))
    
    try {
      // Generate a 3-part teaser campaign
      const teaserPosts: EnhancedPost[] = []
      
      // Day 1: Mystery post
      teaserPosts.push({
        id: `teaser-1-${Date.now()}`,
        type: 'simple',
        title: 'Teaser 1: Mystery',
        elements: [{
          id: 'text-1',
          type: 'text',
          content: `🤫 Something big is coming... \n\n${brandSettings.voice === 'casual' ? "You're not ready for this! 👀" : "Prepare to be amazed."}\n\n#ComingSoon #StayTuned`,
          position: 0
        }],
        platforms: ['instagram', 'twitter', 'linkedin'],
        aiEnhancements: {
          emojis: true,
          hashtags: true,
          formatting: true,
          cta: false
        }
      })
      
      // Day 2: Hint
      teaserPosts.push({
        id: `teaser-2-${Date.now()}`,
        type: 'simple',
        title: 'Teaser 2: Hint',
        elements: [{
          id: 'text-2',
          type: 'text',
          content: `🎯 Here's a hint: ${clip.content.title?.split(' ').slice(0, 3).join(' ')}...\n\n${brandSettings.voice === 'bold' ? "This changes EVERYTHING! 🚀" : "Get ready for something special ✨"}\n\n#AlmostHere #Excited`,
          position: 0
        }],
        platforms: ['instagram', 'twitter', 'linkedin'],
        aiEnhancements: {
          emojis: true,
          hashtags: true,
          formatting: true,
          cta: true
        }
      })
      
      // Day 3: Reveal
      teaserPosts.push({
        id: `teaser-3-${Date.now()}`,
        type: 'media-rich',
        title: 'Teaser 3: The Reveal',
        elements: [
          {
            id: 'clip-reveal',
            type: 'clip',
            content: clip.content,
            position: 0
          },
          {
            id: 'text-reveal',
            type: 'text',
            content: `🎉 IT'S HERE! ${clip.content.title}\n\n${clip.content.publicationCaptions?.instagram || ''}\n\n#NewRelease #MustWatch`,
            position: 1
          }
        ],
        platforms: ['instagram', 'twitter', 'linkedin', 'tiktok'],
        aiEnhancements: {
          emojis: true,
          hashtags: true,
          formatting: true,
          cta: true
        }
      })
      
      setEnhancedPosts(prev => [...prev, ...teaserPosts])
      toast.success('Teaser campaign created! Schedule these 1 day apart for maximum impact.')
      
    } catch (error) {
      toast.error('Failed to generate teaser campaign')
    } finally {
      setAiProcessing(prev => {
        const newState = { ...prev }
        delete newState[processingId]
        return newState
      })
    }
  }

  const generateImageForText = async (text: string, postId: string, elementId: string) => {
    const processingId = `img-gen-${postId}`
    setAiProcessing(prev => ({ ...prev, [processingId]: true }))
    
    try {
      // Show image style selector
      const imageStyle = await new Promise<string>((resolve) => {
        toast(
          <div className="space-y-2">
            <p className="font-medium">Choose image style:</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => resolve('quote')}>Quote</Button>
              <Button size="sm" onClick={() => resolve('key-points')}>Key Points</Button>
              <Button size="sm" onClick={() => resolve('visual-metaphor')}>Visual</Button>
            </div>
          </div>,
          {
            duration: 30000,
            onDismiss: () => resolve('quote')
          }
        )
      })
      
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a ${imageStyle} image for: "${text.slice(0, 100)}..." 
            Style: ${brandSettings.voice}, ${brandSettings.colors.length > 0 ? `using colors ${brandSettings.colors.join(', ')}` : ''}`,
          count: 1,
          size: '1080x1080',
          quality: 'hd'
        })
      })

      if (response.ok) {
        const { urls } = await response.json()
        
        // Add image element to post
        setEnhancedPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const newElement: PostElement = {
              id: `img-${Date.now()}`,
              type: 'image',
              content: { url: urls[0] },
              position: post.elements.length,
              settings: { 
                textOverlay: false,
                imageStyle 
              }
            }
            
            return {
              ...post,
              elements: [...post.elements, newElement]
            }
          }
          return post
        }))
        
        toast.success('Image generated!')
        setGenerationHistory(prev => [...prev, `Generated ${imageStyle} image`])
      }
    } catch (error) {
      toast.error('Failed to generate image')
    } finally {
      setAiProcessing(prev => {
        const newState = { ...prev }
        delete newState[processingId]
        return newState
      })
    }
  }

  const enhanceWithAI = async (postId: string) => {
    const processingId = `enhance-${postId}`
    setAiProcessing(prev => ({ ...prev, [processingId]: true }))
    
    const post = enhancedPosts.find(p => p.id === postId)
    if (!post) return
    
    try {
      // Make actual API call for AI enhancement
      const response = await fetch('/api/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.elements.find(e => e.type === 'text')?.content || '',
          platform: post.platforms[0],
          style: brandSettings.voice,
          includeEmojis: post.aiEnhancements.emojis,
          includeHashtags: post.aiEnhancements.hashtags,
          includeCTA: post.aiEnhancements.cta
        })
      })
      
      if (response.ok) {
        const { enhancedContent } = await response.json()
        
        setEnhancedPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              elements: p.elements.map(elem => {
                if (elem.type === 'text') {
                  return { ...elem, content: enhancedContent }
                }
                return elem
              })
            }
          }
          return p
        }))
        
        toast.success('Post enhanced with AI!')
        setGenerationHistory(prev => [...prev, `Enhanced post: "${post.title}"`])
      }
    } catch (error) {
      toast.error('Failed to enhance post')
    } finally {
      setAiProcessing(prev => {
        const newState = { ...prev }
        delete newState[processingId]
        return newState
      })
    }
  }

  const generateBulkAIContent = async () => {
    if (enhancedPosts.length === 0) {
      toast.error('Please create at least one post first')
      return
    }
    
    toast.info('AI is generating content for all posts and platforms...')
    const processingId = `bulk-ai-${Date.now()}`
    setAiProcessing(prev => ({ ...prev, [processingId]: true }))

    try {
      // For each post, generate content for all its platforms
      const enhancementPromises = enhancedPosts.map(async (post) => {
        const platformPromises = post.platforms.map(async (platform) => {
          try {
            // Get existing text content or generate base content
            const baseContent = post.elements.find(e => e.type === 'text')?.content || 
              `Check out this amazing ${post.type === 'media-rich' ? 'content' : post.type}!`
            
            const response = await fetch('/api/generate-social', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: baseContent,
                platform,
                style: brandSettings.voice,
                includeEmojis: post.aiEnhancements.emojis,
                includeHashtags: post.aiEnhancements.hashtags,
                includeCTA: post.aiEnhancements.cta,
                emojiLevel: brandSettings.emojisLevel,
                maxLength: getPlatformCharacterLimit(platform)
              })
            })

            if (response.ok) {
              const { enhancedContent } = await response.json()
              return { platform, content: enhancedContent, success: true }
            }
            return { platform, content: baseContent, success: false }
          } catch (error) {
            console.error(`Error generating content for ${platform}:`, error)
            return { platform, content: '', success: false }
          }
        })

        const platformResults = await Promise.all(platformPromises)
        return { postId: post.id, platformResults }
      })

      const results = await Promise.all(enhancementPromises)
      
      // Update posts with generated content
      setEnhancedPosts(prev => prev.map(post => {
        const postResults = results.find(r => r.postId === post.id)
        if (!postResults) return post
        
        // For now, we'll use the first successful platform's content as the main content
        const successfulResult = postResults.platformResults.find(r => r.success)
        if (!successfulResult) return post
        
        return {
          ...post,
          elements: post.elements.map(elem => {
            if (elem.type === 'text') {
              return { ...elem, content: successfulResult.content }
            }
            return elem
          }),
          // Store platform-specific content for future use
          platformContent: postResults.platformResults.reduce((acc, result) => ({
            ...acc,
            [result.platform]: result.content
          }), {})
        }
      }))

      const totalGenerated = results.reduce((acc, r) => 
        acc + r.platformResults.filter(pr => pr.success).length, 0
      )
      
      toast.success(`Generated ${totalGenerated} variations across all platforms!`)
      setGenerationHistory(prev => [...prev, `Bulk generated content for ${enhancedPosts.length} posts`])
      
    } catch (error) {
      console.error('Error in bulk AI generation:', error)
      toast.error('Failed to generate content for some posts')
    } finally {
      setAiProcessing(prev => {
        const newState = { ...prev }
        delete newState[processingId]
        return newState
      })
    }
  }

  const renderPostPreview = (post: EnhancedPost) => {
    const platform = platformConfigs[selectedPlatform as keyof typeof platformConfigs]
    
    return (
      <div className={cn(
        "mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden",
        previewMode === 'mobile' ? "max-w-sm" : "max-w-2xl"
      )}>
        {/* Platform Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80" />
            <div>
              <p className="font-semibold text-sm">Your Brand</p>
              <p className="text-xs text-muted-foreground">@yourbrand</p>
            </div>
          </div>
          <platform.icon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* Post Content */}
        <div className="overflow-hidden">
          {post.type === 'carousel' && (
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
              <ScrollArea className="h-full">
                <div className="flex gap-2 p-2">
                  {post.elements.filter(e => e.type === 'image').map((elem, idx) => (
                    <div key={elem.id} className="relative flex-shrink-0 w-full">
                      <img 
                        src={elem.content.url} 
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                        {idx + 1}/{post.elements.filter(e => e.type === 'image').length}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {post.type === 'media-rich' && (
            <div className="space-y-2">
              {post.elements.map(elem => (
                <div key={elem.id}>
                  {elem.type === 'image' && (
                    <div className="relative">
                      <img 
                        src={elem.content.url} 
                        alt=""
                        className="w-full object-cover"
                      />
                      {elem.settings?.textOverlay && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                          <p className="text-white font-bold text-lg">
                            {post.title}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {elem.type === 'clip' && (
                    <div className="relative aspect-[9/16] bg-black">
                      <video 
                        src={elem.content.exportUrl} 
                        className="w-full h-full object-contain"
                        controls
                      />
                    </div>
                  )}
                  
                  {elem.type === 'text' && (
                    <div className="p-4">
                      <p className="whitespace-pre-wrap text-sm">
                        {elem.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Engagement Bar */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-red-500" aria-label="Like">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="text-muted-foreground" aria-label="Comment">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button className="text-muted-foreground" aria-label="Share">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <button className="text-muted-foreground" aria-label="Save">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Add advanced options panel
  const renderAdvancedOptions = () => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Brand Settings</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {showAdvancedOptions && (
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Brand Voice</Label>
            <Select value={brandSettings.voice} onValueChange={(v: any) => setBrandSettings(prev => ({ ...prev, voice: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm">Emoji Usage</Label>
            <Select value={brandSettings.emojisLevel} onValueChange={(v: any) => setBrandSettings(prev => ({ ...prev, emojisLevel: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm">Brand Colors</Label>
            <div className="flex gap-2 mt-1">
              {brandSettings.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded cursor-pointer border-2 border-border"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    const newColors = [...brandSettings.colors]
                    newColors.splice(idx, 1)
                    setBrandSettings(prev => ({ ...prev, colors: newColors }))
                  }}
                />
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const color = prompt('Enter hex color (e.g., #FF5733):')
                  if (color && /^#[0-9A-F]{6}$/i.test(color)) {
                    setBrandSettings(prev => ({ ...prev, colors: [...prev.colors, color] }))
                  }
                }}
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )

  // Add generation history
  const renderGenerationHistory = () => (
    generationHistory.length > 0 && (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Generation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-24">
            <div className="space-y-1">
              {generationHistory.slice(-5).reverse().map((item, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString()} - {item}
                </p>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  )

  return (
    <div className="space-y-6">
      {/* AI Assistant Banner */}
      {showAIAssistant && smartSuggestions.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconMagnet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Content Assistant</CardTitle>
                  <CardDescription className="text-xs">
                    Smart suggestions based on your content
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAIAssistant(false)}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {smartSuggestions.map(suggestion => (
                <motion.div
                  key={suggestion.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all border-primary/10",
                      Object.values(aiProcessing).some(v => v) && "opacity-50 cursor-wait"
                    )}
                    onClick={() => {
                      if (!Object.values(aiProcessing).some(v => v)) {
                        suggestion.action()
                      } else {
                        toast.warning('Please wait for current process to complete')
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          suggestion.type === 'pairing' && "bg-blue-500/10",
                          suggestion.type === 'enhancement' && "bg-green-500/10",
                          suggestion.type === 'template' && "bg-purple-500/10"
                        )}>
                          <suggestion.icon className={cn(
                            "h-5 w-5",
                            suggestion.type === 'pairing' && "text-blue-500",
                            suggestion.type === 'enhancement' && "text-green-500",
                            suggestion.type === 'template' && "text-purple-500"
                          )} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                        <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Processing Indicator */}
      {Object.values(aiProcessing).some(v => v) && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <IconLoader2 className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                AI is processing your request...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Options Panel - Moved to top */}
      {renderAdvancedOptions()}

      {/* Generation History - Moved to top */}
      {renderGenerationHistory()}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Post Builder */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content Builder</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={saveDraft}
                    disabled={enhancedPosts.length === 0}
                  >
                    <IconDeviceFloppy className="h-4 w-4 mr-1" />
                    Save Draft
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const newPost: EnhancedPost = {
                        id: `manual-${Date.now()}`,
                        type: 'simple',
                        title: 'New Post',
                        elements: [{
                          id: 'text-1',
                          type: 'text',
                          content: '',
                          position: 0
                        }],
                        platforms: [selectedPlatform],
                        aiEnhancements: {
                          emojis: brandSettings.emojisLevel !== 'none',
                          hashtags: true,
                          formatting: true,
                          cta: false
                        }
                      }
                      setEnhancedPosts(prev => [...prev, newPost])
                    }}
                  >
                    <IconPlus className="h-4 w-4 mr-1" />
                    Create Post
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateBulkAIContent}
                    disabled={enhancedPosts.length === 0 || Object.values(aiProcessing).some(v => v)}
                  >
                    <IconWand className="h-4 w-4 mr-1" />
                    Generate All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {enhancedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <IconLayoutCards className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No posts created yet. Use AI suggestions or create manually.
                      </p>
                    </div>
                  ) : (
                    <Reorder.Group 
                      values={enhancedPosts} 
                      onReorder={setEnhancedPosts}
                      className="space-y-4"
                    >
                      {enhancedPosts.map(post => (
                        <Reorder.Item key={post.id} value={post}>
                          <Card className={cn(
                            "border-2 transition-all cursor-move",
                            selectedPost === post.id && "border-primary",
                            aiProcessing[`enhance-${post.id}`] && "opacity-75"
                          )}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <IconGripVertical className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <h4 className="font-medium">{post.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {post.type}
                                      </Badge>
                                      {post.platforms.map(platform => {
                                        const config = platformConfigs[platform as keyof typeof platformConfigs]
                                        const Icon = config?.icon
                                        return Icon ? (
                                          <Icon key={platform} className="h-3 w-3 text-muted-foreground" />
                                        ) : null
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedPost(post.id === selectedPost ? null : post.id)}
                                  >
                                    <IconEdit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => enhanceWithAI(post.id)}
                                    disabled={aiProcessing[`enhance-${post.id}`]}
                                  >
                                    {aiProcessing[`enhance-${post.id}`] ? (
                                      <IconLoader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <IconWand className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => {
                                      setEnhancedPosts(prev => prev.filter(p => p.id !== post.id))
                                      if (selectedPost === post.id) setSelectedPost(null)
                                    }}
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {post.elements.map(elem => (
                                  <div key={elem.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                    {elem.type === 'text' && <IconFileText className="h-4 w-4" />}
                                    {elem.type === 'image' && <IconPhoto className="h-4 w-4" />}
                                    {elem.type === 'video' && <IconVideo className="h-4 w-4" />}
                                    {elem.type === 'clip' && <IconMovie className="h-4 w-4" />}
                                    <span className="text-sm flex-1 truncate">
                                      {elem.type === 'text' ? elem.content.slice(0, 50) + '...' : elem.type}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              
                              {/* AI Enhancements */}
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium mb-2">AI Enhancements</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(post.aiEnhancements).map(([key, enabled]) => (
                                    <Badge 
                                      key={key} 
                                      variant={enabled ? "default" : "outline"}
                                      className="text-xs cursor-pointer"
                                      onClick={() => {
                                        setEnhancedPosts(prev => prev.map(p => 
                                          p.id === post.id 
                                            ? {
                                                ...p,
                                                aiEnhancements: {
                                                  ...p.aiEnhancements,
                                                  [key]: !enabled
                                                }
                                              }
                                            : p
                                        ))
                                      }}
                                    >
                                      {key}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </div>
              </ScrollArea>
>>>>>>> 7184e73 (Add new files and configurations for project setup)
            </CardContent>
          </Card>
        </div>

<<<<<<< HEAD
        {/* Right Panel - Form Fields */}
        <div className="lg:col-span-2">
          {currentPlatform && formDef ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg text-white bg-gradient-to-br",
                      platformColors[currentPlatform]
                    )}>
                      {platformIcons[currentPlatform] && (
                        <>{React.createElement(platformIcons[currentPlatform], { className: "h-5 w-5" })}</>
                      )}
                    </div>
                    <div>
                      <CardTitle>{platformNames[currentPlatform]} Content</CardTitle>
                      <CardDescription>
                        {contentType.charAt(0).toUpperCase() + contentType.slice(1)} requirements
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAIContent}
                    disabled={isGenerating[currentPlatform]}
                  >
                    <IconSparkles className={cn(
                      "h-4 w-4 mr-2",
                      isGenerating[currentPlatform] && "animate-spin"
                    )} />
                    AI Generate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div
                  key={`${currentItem.id}-${currentPlatform}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Media Requirements Alert */}
                  {formDef.mediaRequirements && (
                    <Alert>
                      <IconInfoCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Media Requirements:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                          {formDef.mediaRequirements.minDuration && (
                            <li>• Min duration: {formDef.mediaRequirements.minDuration}s</li>
                          )}
                          {formDef.mediaRequirements.maxDuration && (
                            <li>• Max duration: {formDef.mediaRequirements.maxDuration}s</li>
                          )}
                          {formDef.mediaRequirements.aspectRatio && (
                            <li>• Aspect ratios: {formDef.mediaRequirements.aspectRatio.join(', ')}</li>
                          )}
                          {formDef.mediaRequirements.formats && (
                            <li>• Formats: {formDef.mediaRequirements.formats.join(', ')}</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Form Fields */}
                  {formDef.fields.map(field => (
                    <div key={field.name}>
                      {renderField(field)}
                    </div>
                  ))}

                  {/* Platform Tips */}
                  <Alert className="bg-primary/5 border-primary/20">
                    <IconBrandInstagram className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Pro Tips for {platformNames[currentPlatform]}:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        {getPlatformTips(currentPlatform, contentType).map((tip, idx) => (
                          <li key={idx}>• {tip}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </motion.div>
=======
        {/* Right: Preview & Edit */}
        <div className="space-y-4">
          {/* Platform & Preview Controls */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview & Edit</CardTitle>
                <div className="flex items-center gap-2">
                  <Tabs value={previewMode} onValueChange={(v: any) => setPreviewMode(v)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="mobile" className="text-xs">
                        <IconDeviceMobile className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="desktop" className="text-xs">
                        <IconDeviceDesktop className="h-4 w-4" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <TabsList className="h-8">
                      {Object.entries(platformConfigs).map(([key, config]) => (
                        <TabsTrigger key={key} value={key} className="text-xs">
                          <config.icon className="h-4 w-4" />
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
          </Card>

          {selectedPost && enhancedPosts.find(p => p.id === selectedPost) ? (
            <Card>
              <CardContent className="p-6">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {/* Multi-Platform Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Platform Preview</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const post = enhancedPosts.find(p => p.id === selectedPost)
                            if (post) {
                              const allPlatforms = ['instagram', 'twitter', 'linkedin', 'tiktok']
                              setEnhancedPosts(prev => prev.map(p => 
                                p.id === selectedPost 
                                  ? { ...p, platforms: allPlatforms }
                                  : p
                              ))
                              toast.success('Post will be published to all platforms')
                            }
                          }}
                        >
                          <IconLayoutGrid className="h-4 w-4 mr-1" />
                          All Platforms
                        </Button>
                      </div>
                      {renderPostPreview(enhancedPosts.find(p => p.id === selectedPost)!)}
                    </div>

                    <Separator />

                    {/* Edit Elements */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Edit Content</h3>
                      <div className="space-y-4">
                        {enhancedPosts.find(p => p.id === selectedPost)!.elements.map(elem => (
                          <div key={elem.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">
                                {elem.type === 'text' && 'Text Content'}
                                {elem.type === 'image' && 'Image'}
                                {elem.type === 'clip' && 'Video Clip'}
                              </Label>
                              <div className="flex gap-2">
                                {elem.type === 'text' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateImageForText(
                                      elem.content, 
                                      selectedPost,
                                      elem.id
                                    )}
                                    disabled={aiProcessing[`img-gen-${selectedPost}`]}
                                  >
                                    <IconPhotoPlus className="h-4 w-4 mr-1" />
                                    Generate Image
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => {
                                    setEnhancedPosts(prev => prev.map(post => 
                                      post.id === selectedPost
                                        ? {
                                            ...post,
                                            elements: post.elements.filter(e => e.id !== elem.id)
                                          }
                                        : post
                                    ))
                                  }}
                                >
                                  <IconX className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {elem.type === 'text' && (
                              <div className="space-y-2">
                                <Textarea
                                  value={elem.content}
                                  onChange={(e) => {
                                    setEnhancedPosts(prev => prev.map(post => {
                                      if (post.id === selectedPost) {
                                        return {
                                          ...post,
                                          elements: post.elements.map(el => 
                                            el.id === elem.id 
                                              ? { ...el, content: e.target.value }
                                              : el
                                          )
                                        }
                                      }
                                      return post
                                    }))
                                  }}
                                  className="min-h-[100px]"
                                  placeholder="Enter your post content..."
                                />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{elem.content.length} characters</span>
                                  <span className={cn(
                                    elem.content.length > getPlatformCharacterLimit(selectedPlatform)
                                      ? "text-destructive"
                                      : ""
                                  )}>
                                    Max: {getPlatformCharacterLimit(selectedPlatform) || 'unlimited'}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {elem.type === 'image' && (
                              <div className="space-y-2">
                                <img 
                                  src={elem.content.url} 
                                  alt="" 
                                  className="w-full rounded-lg"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <IconPalette className="h-4 w-4 mr-1" />
                                    Apply Filter
                                  </Button>
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <IconTextPlus className="h-4 w-4 mr-1" />
                                    Add Text
                                  </Button>
                                </div>
                              </div>
                            )}

                            {elem.type === 'clip' && (
                              <div className="space-y-2">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                  <video 
                                    src={elem.content.exportUrl} 
                                    className="w-full h-full object-contain"
                                    controls
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Duration: {elem.content.duration || 'N/A'}s | 
                                  Score: {elem.content.score || 'N/A'}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add New Element */}
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Add Element</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const post = enhancedPosts.find(p => p.id === selectedPost)!
                                const newElement: PostElement = {
                                  id: `elem-${Date.now()}`,
                                  type: 'text',
                                  content: '',
                                  position: post.elements.length
                                }
                                setEnhancedPosts(prev => prev.map(p => 
                                  p.id === selectedPost
                                    ? { ...p, elements: [...p.elements, newElement] }
                                    : p
                                ))
                              }}
                            >
                              <IconTextPlus className="h-4 w-4 mr-1" />
                              Text
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
>>>>>>> 7184e73 (Add new files and configurations for project setup)
              </CardContent>
            </Card>
          ) : (
            <Card>
<<<<<<< HEAD
              <CardContent className="py-16 text-center">
                <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a platform to start preparing content
=======
              <CardContent className="py-24 text-center">
                <IconEye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a post to preview and edit
>>>>>>> 7184e73 (Add new files and configurations for project setup)
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
<<<<<<< HEAD
    </div>
  )
}

function getPlatformTips(platform: Platform, contentType: ContentType): string[] {
  const tips: Record<string, Record<string, string[]>> = {
    instagram: {
      video: [
        "Hook viewers in the first 3 seconds",
        "Use trending audio for better reach",
        "Add captions for accessibility",
        "Post Reels between 9-10 AM or 7-8 PM"
      ],
      image: [
        "Use all 10 carousel slides for maximum engagement",
        "First image should be attention-grabbing",
        "Consistent visual style builds brand",
        "Square (1:1) or portrait (4:5) performs best"
      ],
      story: [
        "Use interactive stickers to boost engagement",
        "Stories disappear after 24 hours",
        "Save important stories to Highlights",
        "Post 1-2 stories daily for best results"
      ]
    },
    tiktok: {
      video: [
        "Jump on trends early for viral potential",
        "Keep videos under 30 seconds for best engagement",
        "Use 3-5 relevant hashtags",
        "Post when your audience is most active"
      ]
    },
    youtube: {
      video: [
        "Optimize title with keywords",
        "First 125 characters of description are crucial",
        "Use custom thumbnails for 90% more views",
        "End screens increase watch time"
      ],
      short: [
        "Must be vertical and under 60 seconds",
        "Include #Shorts in title or description",
        "Hook viewers immediately",
        "Loop content for rewatches"
      ]
    },
    linkedin: {
      article: [
        "Professional tone resonates best",
        "Include industry insights and data",
        "Posts with images get 2x more engagement",
        "Publish Tuesday-Thursday, 9-10 AM"
      ],
      video: [
        "Native videos get 5x more engagement",
        "Keep professional but authentic",
        "Add captions for silent viewing",
        "3-minute videos perform best"
      ]
    },
    x: {
      video: [
        "Thread multiple tweets for context",
        "Tweet when news breaks in your niche",
        "Use 1-2 hashtags maximum",
        "Retweet with comment for engagement"
      ]
    },
    facebook: {
      video: [
        "Square videos take up more feed space",
        "Caption should provide context",
        "Tag relevant pages and people",
        "Live videos get 6x more engagement"
      ]
    },
    threads: {
      video: [
        "Keep conversational and authentic",
        "Engage with replies quickly",
        "Cross-post from Instagram when relevant",
        "Best times: lunch and evening"
      ]
    }
  }

  return tips[platform]?.[contentType] || [
    "Create authentic, engaging content",
    "Know your audience preferences",
    "Post consistently at optimal times",
    "Engage with your community"
  ]
=======

      {/* Continue Button */}
      <div className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {enhancedPosts.length} post{enhancedPosts.length !== 1 ? 's' : ''} created
        </div>
        <Button
          size="lg"
          onClick={() => {
            // Validate posts before continuing
            const invalidPosts = enhancedPosts.filter(post => 
              post.elements.every(elem => 
                elem.type === 'text' ? elem.content.trim() === '' : false
              )
            )
            
            if (invalidPosts.length > 0) {
              toast.error(`${invalidPosts.length} post(s) have no content`)
              return
            }
            
            // Convert enhanced posts to staged content format
            const stagedContent = enhancedPosts.map(post => ({
              ...post,
              // Add necessary fields for next step
            }))
            onUpdate(stagedContent)
            onNext()
          }}
          disabled={enhancedPosts.length === 0 || Object.values(aiProcessing).some(v => v)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          Continue to Scheduling
          <IconArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
>>>>>>> 7184e73 (Add new files and configurations for project setup)
} 