"use client"

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
import { PlatformContentPreview } from "./platform-content-preview"

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
  const [showPreview, setShowPreview] = useState(true)

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

  // Map platform-specific caption field names
  const getCaptionFieldName = (platform: Platform): string => {
    const captionFieldMap: Record<Platform, string> = {
      'instagram': 'caption',
      'tiktok': 'caption',
      'linkedin': 'caption',
      'facebook': 'caption',
      'youtube': 'description',
      'x': 'tweet',
      'threads': 'text'
    }
    return captionFieldMap[platform] || 'caption'
  }

  // Initialize platform content with existing captions from clips
  useEffect(() => {
    if (content && content.length > 0) {
      const initializedContent = content.map(item => {
        // If it's a clip and has original data with publication captions
        if (item.type === 'clip' && item.originalData?.publicationCaptions) {
          const updatedPlatformContent = { ...item.platformContent }
          
          // Map publication captions to platform content
          Object.entries(item.originalData.publicationCaptions).forEach(([platform, caption]) => {
            if (caption && typeof caption === 'string') {
              const mappedPlatform = platform === 'twitter' ? 'x' : platform as Platform
              
              // Skip if platform is not in the item's platforms list
              if (!item.platforms.includes(mappedPlatform)) return
              
              // Get the correct field name for this platform
              const captionField = getCaptionFieldName(mappedPlatform)
              
              // Extract hashtags from caption
              const hashtagRegex = /#\w+/g
              const hashtags = (caption.match(hashtagRegex) || []).map(tag => tag.slice(1))
              const captionWithoutTags = caption.replace(hashtagRegex, '').trim()
              
              // If platform content doesn't exist or caption field is empty, populate it
              const existingPlatformContent = updatedPlatformContent[mappedPlatform] || {}
              const existingCaptionValue = existingPlatformContent[captionField as keyof typeof existingPlatformContent]
              
              if (!existingCaptionValue) {
                // Properly access hashtags with type safety
                const existingHashtags: string[] = (existingPlatformContent as any).hashtags || []
                
                updatedPlatformContent[mappedPlatform] = {
                  caption: '',  // Ensure required fields have default values
                  hashtags: hashtags.length > 0 ? hashtags : existingHashtags,
                  ...existingPlatformContent,
                  [captionField]: caption, // Use full caption including hashtags
                  characterCount: caption.length,
                  isValid: true
                }
                
                // For YouTube, also set the title if not present
                if (mappedPlatform === 'youtube' && !updatedPlatformContent[mappedPlatform]?.title) {
                  updatedPlatformContent[mappedPlatform] = {
                    ...updatedPlatformContent[mappedPlatform]!,
                    title: item.title || 'Video Clip'
                  }
                }
              }
            }
          })
          
          return {
            ...item,
            platformContent: updatedPlatformContent
          }
        }
        return item
      })
      
      setEditedContent(initializedContent)
    }
  }, [content])

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
            // Pass all the rich context data
            score: currentItem.originalData?.score,
            scoreReasoning: currentItem.originalData?.viralityExplanation,
            transcript: currentItem.originalData?.transcript,
            sentiment: currentItem.originalData?.sentiment,
            analytics: currentItem.analytics,
            originalData: currentItem.originalData
          },
          platform: currentPlatform,
          projectId: currentItem.originalData?.projectId,
          projectContext: currentItem.originalData?.projectContext
        })
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error('Caption generation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        // Throw with the actual error message from the server
        throw new Error(errorData.error || errorData.message || `Failed to generate content (${response.status})`)
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
      
      // More detailed error handling
      let errorMessage = 'Failed to generate AI content'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'error' in error) {
        errorMessage = (error as any).error
      }
      
      // Check for specific error types
      if (errorMessage.includes('OPENAI_API_KEY')) {
        errorMessage = 'AI service is not configured. Please contact support.'
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      toast.error(errorMessage, {
        description: 'You can still fill in the content manually.'
      })
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
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Form Fields and Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Toggle Preview Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <IconEye className={cn("h-4 w-4 mr-2", showPreview && "text-primary")} />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>

          <div className={cn(
            "grid gap-6",
            showPreview ? "lg:grid-cols-2" : "lg:grid-cols-1"
          )}>
            {/* Form Section */}
            <div>
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
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select a platform to start preparing content
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview Section */}
            {showPreview && currentPlatform && currentItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PlatformContentPreview
                  content={currentItem}
                  platform={currentPlatform}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Footer */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {editedContent.length} items ready for scheduling
          </div>
          <Button
            onClick={() => {
              // Demo mode: Allow proceeding even with incomplete fields
              const isDemoMode = true
              
              if (isDemoMode) {
                toast.info('Proceeding to scheduling (Demo Mode)')
                onNext()
              } else {
                // Production validation would go here
                onNext()
              }
            }}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <IconSparkles className="mr-2 h-5 w-5" />
            Continue to Smart Scheduling
          </Button>
        </div>
      </div>
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
} 