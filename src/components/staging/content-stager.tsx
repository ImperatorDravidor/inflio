"use client"

<<<<<<< HEAD
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
  IconCalendar,
  IconShare2,
  IconChevronDown,
  IconFileText
} from "@tabler/icons-react"
import { StagedContent } from "@/lib/staging/staging-service"
import { Platform } from "@/lib/social/types"
import { cn, countCharacters, getPlatformLimit, getPlatformHashtagLimit, getPlatformPreviewLength } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ContentStagerProps {
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
  threads: 'from-gray-800 to-black',
  'youtube-short': 'from-red-500 to-red-600'
}

const contentTypeIcons: Record<string, any> = {
  clip: IconVideo,
  blog: IconArticle,
  image: IconPhoto,
  carousel: IconPhoto,
  social: IconShare2,
  longform: IconVideo
}

export function ContentStager({ content, onUpdate, onNext }: ContentStagerProps) {
  // Ensure content is always an array
  const safeContent = Array.isArray(content) ? content : []
  
  const [selectedContent, setSelectedContent] = useState<string>(safeContent[0]?.id || '')
  const [editedContent, setEditedContent] = useState<StagedContent[]>(safeContent)
  const [autoHashtags, setAutoHashtags] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [viewMode, setViewMode] = useState<'detail' | 'overview'>('detail')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  const currentItem = editedContent.find(item => item.id === selectedContent)

  // Safety check to ensure currentItem has required properties
  useEffect(() => {
    if (currentItem && (!currentItem.platforms || !Array.isArray(currentItem.platforms))) {
      console.warn('Invalid content item detected, fixing platforms array')
      const fixedContent = editedContent.map(item => {
        if (item.id === currentItem.id) {
          return {
            ...item,
            platforms: (Array.isArray(item.platforms) ? item.platforms : ['instagram', 'x']) as Platform[]
          }
        }
        return item
      })
      setEditedContent(fixedContent)
    }
  }, [currentItem])

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
      
      if (item.platforms && Array.isArray(item.platforms)) {
        item.platforms.forEach((platform: Platform) => {
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
      }
      
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
          const fullText = caption + (hashtagText ? ' ' + hashtagText : '')
          const totalLength = countCharacters(fullText, platform)
          const limit = getPlatformLimit(platform)
          
          updatedPlatformContent.characterCount = totalLength
          updatedPlatformContent.isValid = totalLength <= limit
          updatedPlatformContent.validationErrors = totalLength > limit 
            ? [`Content exceeds ${limit} character limit (${totalLength} characters)`]
            : []
        }
        
=======
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconSparkles,
  IconArrowRight,
  IconLoader2,
  IconCopy,
  IconCheck,
  IconVideo,
  IconPhoto,
  IconArticle,
  IconChevronDown,
  IconChevronUp,
  IconSettings,
} from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { PlatformSpecificInputs } from './platform-specific-inputs'

interface ContentStagerProps {
  content: any[]
  onUpdate: (content: any[]) => void
  onNext: () => void
}

const platformConfigs = {
  instagram: {
    name: 'Instagram',
    icon: IconBrandInstagram,
    color: 'from-purple-500 to-pink-500',
    charLimit: 2200,
    bestPractices: 'Use emojis, hashtags, and engaging captions',
    tips: {
      clip: '• Use trending audio\n• Add location tags\n• Keep it under 30s for Reels',
      image: '• Write detailed alt text\n• Tag products if applicable\n• Use up to 30 hashtags',
      carousel: '• First slide is crucial\n• Tell a story across slides\n• Mix content types',
      blog: '• Share key insights\n• Use carousel for long content\n• Add link in bio'
    }
  },
  x: {
    name: 'X (Twitter)',
    icon: IconBrandX,
    color: 'from-gray-700 to-gray-900',
    charLimit: 280,
    bestPractices: 'Be concise, use trending hashtags',
    tips: {
      clip: '• Keep videos under 2:20\n• Add captions for accessibility\n• Tweet at peak hours',
      image: '• Use 16:9 ratio for best display\n• Add alt text\n• Limited to 4 images',
      carousel: '• Not supported - use thread instead\n• Break into multiple tweets\n• Number your threads',
      blog: '• Share key takeaway\n• Create a thread for details\n• Add relevant hashtags'
    }
  },
  linkedin: {
    name: 'LinkedIn',
    icon: IconBrandLinkedin,
    color: 'from-blue-600 to-blue-700',
    charLimit: 3000,
    bestPractices: 'Professional tone, industry insights',
    tips: {
      clip: '• Native video performs best\n• Add subtitles\n• Keep professional',
      image: '• Use high-quality visuals\n• Add context in caption\n• Tag relevant people',
      carousel: '• Perfect for case studies\n• Educational content works\n• PDF carousel option',
      blog: '• Publish as article\n• Share key insights\n• Tag industry leaders'
    }
  },
  facebook: {
    name: 'Facebook',
    icon: IconBrandFacebook,
    color: 'from-blue-500 to-blue-600',
    charLimit: 63206,
    bestPractices: 'Storytelling, questions, call-to-actions',
    tips: {
      clip: '• Upload natively\n• Add captions\n• Optimize for sound-off viewing',
      image: '• High resolution works best\n• Tell a story\n• Encourage reactions',
      carousel: '• Great for tutorials\n• Mix media types\n• Add descriptions',
      blog: '• Share personal angle\n• Ask questions\n• Include preview image'
    }
  }
}

export function ContentStager({ content, onUpdate, onNext }: ContentStagerProps) {
  const [stagedContent, setStagedContent] = useState(content)
  const [selectedItem, setSelectedItem] = useState<string | null>(content[0]?.id || null)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingItems, setGeneratingItems] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [showPlatformSettings, setShowPlatformSettings] = useState(false)

  // Initialize platform content for each item
  useEffect(() => {
    const initialized = content.map(item => {
      if (!item.platformContent) {
        const platforms = ['instagram', 'x', 'linkedin', 'facebook']
        const platformContent: Record<string, any> = {}
        
        platforms.forEach(platform => {
          platformContent[platform] = {
            caption: '',
            hashtags: [],
            characterCount: 0,
            isValid: true,
            validationErrors: [],
            generated: false,
            // Platform-specific data
            platformData: {}
          }
        })
        
        return { ...item, platformContent, platforms }
      }
      return item
    })
    
    setStagedContent(initialized)
  }, [content])

  const generateCopyForItem = async (itemId: string, platform?: string) => {
    const item = stagedContent.find(i => i.id === itemId)
    if (!item) return

    setGeneratingItems(prev => new Set(prev).add(itemId))
    
    try {
      const platformsToGenerate = platform ? [platform] : ['instagram', 'x', 'linkedin', 'facebook']
      
      for (const plat of platformsToGenerate) {
        // Prepare content based on item type
        let baseContent = ''
        let context = {}
        
        if (item.type === 'clip') {
          baseContent = item.transcript || item.title || ''
          context = {
            title: item.title,
            duration: item.duration,
            score: item.score,
            viralityExplanation: item.viralityExplanation,
            type: 'video_clip'
          }
        } else if (item.type === 'blog') {
          baseContent = item.content || item.summary || item.title || ''
          context = {
            title: item.title,
            type: 'blog_post',
            wordCount: item.wordCount
          }
        } else if (item.type === 'image') {
          baseContent = item.description || item.prompt || item.title || ''
          context = {
            title: item.title,
            type: 'image',
            style: item.style
          }
        }
        
        // Call AI to generate optimized copy
        const response = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: baseContent,
            platform: plat,
            context,
            style: 'professional',
            includeEmojis: true,
            includeHashtags: true,
            includeCTA: true,
            maxLength: platformConfigs[plat as keyof typeof platformConfigs].charLimit
          })
        })
        
        if (response.ok) {
          const { caption, hashtags } = await response.json()
          
          // Update the content
          setStagedContent(prev => prev.map(contentItem => {
            if (contentItem.id === itemId) {
              return {
                ...contentItem,
                platformContent: {
                  ...contentItem.platformContent,
                  [plat]: {
                    ...contentItem.platformContent[plat],
                    caption,
                    hashtags: hashtags || [],
                    characterCount: caption.length,
                    isValid: caption.length <= platformConfigs[plat as keyof typeof platformConfigs].charLimit,
                    validationErrors: [],
                    generated: true
                  }
                }
              }
            }
            return contentItem
          }))
        }
      }
      
      toast.success(platform ? `Generated ${platform} copy!` : 'Generated copy for all platforms!')
    } catch (error) {
      console.error('Error generating copy:', error)
      toast.error('Failed to generate copy. Please try again.')
    } finally {
      setGeneratingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const generateAllCopy = async () => {
    setIsGenerating(true)
    toast.info('Generating optimized copy for all content across all platforms...')
    
    try {
      // Process all items
      for (let i = 0; i < stagedContent.length; i++) {
        const item = stagedContent[i]
        await generateCopyForItem(item.id)
        
        // Show progress
        if (i < stagedContent.length - 1) {
          toast.info(`Processed ${i + 1} of ${stagedContent.length} items...`)
        }
      }
      
      toast.success('All copy generated successfully! 🎉')
    } catch (error) {
      toast.error('Failed to generate some content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const updateCaption = (itemId: string, platform: string, caption: string) => {
    setStagedContent(prev => prev.map(item => {
      if (item.id === itemId) {
>>>>>>> 7184e73 (Add new files and configurations for project setup)
        return {
          ...item,
          platformContent: {
            ...item.platformContent,
<<<<<<< HEAD
            [platform]: updatedPlatformContent
=======
            [platform]: {
              ...item.platformContent[platform],
              caption,
              characterCount: caption.length,
              isValid: caption.length <= platformConfigs[platform as keyof typeof platformConfigs].charLimit
            }
>>>>>>> 7184e73 (Add new files and configurations for project setup)
          }
        }
      }
      return item
<<<<<<< HEAD
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
    
    const hashtagLimit = getPlatformHashtagLimit(platform)
    if (currentHashtags.length >= hashtagLimit && hashtagLimit > 0) {
      toast.error(`Maximum ${hashtagLimit} hashtags allowed on ${platform}`)
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
      // Get the current item
      const item = editedContent.find(i => i.id === contentId)
      if (!item) {
        toast.error('Content item not found')
        return
      }
      
      // Get the project ID from the current item's original data
      const projectId = item.originalData?.projectId || 
                       (window.location.pathname.match(/projects\/([^\/]+)/)?.[1])
      
      // Prepare comprehensive content data
      const contentData = {
        id: item.id || '',
        title: item.title || '',
        description: item.description || '',
        type: item.type || 'clip',
        duration: item.duration,
        thumbnail: item.thumbnailUrl,
        // Include all virality and analysis data
        score: item.originalData?.score,
        scoreReasoning: item.originalData?.scoreReasoning,
        transcript: item.originalData?.transcript,
        sentiment: item.originalData?.sentiment,
        analytics: item.analytics,
        originalData: item.originalData
      }
      
      // Call AI service to generate caption
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentData,
          platform,
          projectId,
          projectContext: item.originalData?.projectContext
        })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to generate caption: ${errorData}`)
      }
      
      const { caption, hashtags, suggestions, cta, hook } = await response.json()
      
      // Update caption for the requested platform
      handlePlatformContentUpdate(contentId, platform, 'caption', caption)
      
      // Update hashtags for the requested platform (with proper limits)
      if (hashtags && hashtags.length > 0) {
        const platformHashtagLimit = getPlatformHashtagLimit(platform)
        const limitedHashtags = hashtags.slice(0, platformHashtagLimit)
        handleHashtagUpdate(contentId, platform, limitedHashtags)
      }
      
      // Update CTA if provided
      if (cta) {
        handlePlatformContentUpdate(contentId, platform, 'cta', cta)
      }
      
      // Generate platform-specific fields
      await generatePlatformSpecificFields(item, platform)
      
      // Auto-fill other platforms with adapted content
      if (item.platforms && item.platforms.length > 1) {
        // Generate adapted content for each platform
        const otherPlatforms = item.platforms.filter(p => p !== platform)
        
        // Show loading toast for bulk generation
        const toastId = toast.loading(`Generating content for ${otherPlatforms.length} other platforms...`)
        
        for (const otherPlatform of otherPlatforms) {
          try {
            // Generate platform-specific content
            const otherResponse = await fetch('/api/generate-caption', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: contentData,
                platform: otherPlatform,
                projectId,
                projectContext: item.originalData?.projectContext
              })
            })
            
            if (otherResponse.ok) {
              const otherData = await otherResponse.json()
              
              // Update caption for other platform
              handlePlatformContentUpdate(contentId, otherPlatform, 'caption', otherData.caption)
              
              // Update hashtags for other platform with proper limits
              if (otherData.hashtags && otherData.hashtags.length > 0) {
                const otherPlatformHashtagLimit = getPlatformHashtagLimit(otherPlatform)
                const limitedHashtags = otherData.hashtags.slice(0, otherPlatformHashtagLimit)
                handleHashtagUpdate(contentId, otherPlatform, limitedHashtags)
              }
              
              // Update CTA if provided
              if (otherData.cta) {
                handlePlatformContentUpdate(contentId, otherPlatform, 'cta', otherData.cta)
              }
              
              // Generate platform-specific fields for other platforms
              await generatePlatformSpecificFields(item, otherPlatform)
            }
          } catch (error) {
            console.warn(`Failed to generate content for ${otherPlatform}`, error)
            // Continue with other platforms even if one fails
          }
        }
        
        // Update loading toast
        toast.success('Smart captions generated for all platforms!', { id: toastId })
      } else {
        toast.success(`Smart caption generated for ${platform}!`)
      }
      
      // Store AI suggestions for later use
      setAiSuggestions({
        ...aiSuggestions,
        [key]: suggestions || { tip: 'AI-generated caption based on content analysis' }
      })
      
    } catch (error) {
      // Don't log to console in production to avoid Next.js error handling
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error generating caption:', error)
      }
      
      // Silently fall back to template captions
      const fallbackCaptions = getSmartCaptionFallback(currentItem?.type || 'clip', platform)
      handlePlatformContentUpdate(contentId, platform, 'caption', fallbackCaptions)
      
      // Show a more user-friendly message
      toast.error('Failed to generate AI caption. Using optimized template instead.')
    } finally {
      setIsGenerating({ ...isGenerating, [key]: false })
    }
  }

  // New function to generate platform-specific fields
  const generatePlatformSpecificFields = async (item: StagedContent, platform: Platform) => {
    // Generate alt text for images
    if ((item.type === 'image' || item.type === 'carousel') && !item.platformContent[platform]?.altText) {
      const altText = await generateAltText(item, platform)
      handlePlatformContentUpdate(item.id, platform, 'altText', altText)
    }
    
    // Generate YouTube title if needed
    if (platform === 'youtube' && !item.platformContent[platform]?.title) {
      const title = generateYouTubeTitle(item)
      handlePlatformContentUpdate(item.id, platform, 'title', title)
      
      // Also set category for clips
      if (item.type === 'clip') {
        const category = detectYouTubeCategory(item)
        handlePlatformContentUpdate(item.id, platform, 'category', category)
      }
    }
    
    // Generate LinkedIn article link for blogs
    if (platform === 'linkedin' && item.type === 'blog' && !item.platformContent[platform]?.link) {
      const blogUrl = `${window.location.origin}/blog/${item.originalData?.id || item.id}`
      handlePlatformContentUpdate(item.id, platform, 'link', blogUrl)
    }
    
    // Set Instagram location if available
    if (platform === 'instagram' && item.type === 'clip' && item.originalData?.location) {
      handlePlatformContentUpdate(item.id, platform, 'location', item.originalData.location)
    }
  }

  // Helper function to generate alt text for images
  const generateAltText = async (item: StagedContent, platform: Platform): Promise<string> => {
    // Use AI to analyze image content if available
    if (item.originalData?.imageAnalysis) {
      return item.originalData.imageAnalysis.description || ''
    }
    
    // Fallback to content-based alt text
    const contentType = item.type === 'carousel' ? 'carousel slide' : 'image'
    return `${contentType} showing ${item.title || 'visual content'} - ${item.description || 'see caption for details'}`
  }

  // Helper function to generate YouTube title
  const generateYouTubeTitle = (item: StagedContent): string => {
    const title = item.title || 'Untitled Video'
    // YouTube titles should be max 100 chars and SEO-friendly
    if (title.length > 100) {
      return title.substring(0, 97) + '...'
    }
    return title
  }

  // Helper function to detect YouTube category
  const detectYouTubeCategory = (item: StagedContent): string => {
    const content = (item.description + ' ' + (item.originalData?.transcript || '')).toLowerCase()
    
    if (content.includes('tech') || content.includes('software') || content.includes('code')) {
      return 'Science & Technology'
    } else if (content.includes('business') || content.includes('money') || content.includes('finance')) {
      return 'Business'
    } else if (content.includes('education') || content.includes('learn') || content.includes('tutorial')) {
      return 'Education'
    } else if (content.includes('game') || content.includes('gaming') || content.includes('play')) {
      return 'Gaming'
    } else if (content.includes('music') || content.includes('song') || content.includes('artist')) {
      return 'Music'
    } else if (content.includes('news') || content.includes('politics') || content.includes('government')) {
      return 'News & Politics'
    } else if (content.includes('lifestyle') || content.includes('fashion') || content.includes('beauty')) {
      return 'Lifestyle'
    }
    
    return 'Entertainment' // Default category
  }

  const getSmartCaptionFallback = (contentType: string, platform: Platform): string => {
    const templates: Record<string, Record<string, string>> = {
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
      'youtube-short': {
        clip: "Wait for the end! 🤯 #shorts #viral",
        blog: "Quick summary of my latest article 📚",
        image: "Visual story time! 🎨"
      },
      threads: {
        clip: "New video dropped 🎬\n\nThoughts?",
        blog: "Just wrote about this...\n\nLet's discuss 💬",
        image: "Visual storytelling at its finest 📸"
      }
    }
    
    // Add fallbacks for social and longform types
    Object.keys(templates).forEach(platform => {
      if (!templates[platform].social) {
        templates[platform].social = templates[platform].clip || "Check out this content!"
      }
      if (!templates[platform].longform) {
        templates[platform].longform = templates[platform].clip || "New video is live!"
      }
    })
    
    const platformTemplates = templates[platform]
    if (!platformTemplates) return "Check out this amazing content!"
    
    return platformTemplates[contentType] || platformTemplates.clip || "Check out this amazing content!"
  }

  const copyToAllPlatforms = (sourceplatform: Platform, field: 'caption' | 'hashtags' | 'all') => {
    if (!currentItem || !currentItem.platforms) {
      toast.error('No content selected')
      return
    }
    
    const sourceContent = currentItem.platformContent[sourceplatform]
    if (!sourceContent) {
      toast.error('Source platform content not found')
      return
    }
    
    if (field === 'all') {
      // Copy all fields from source platform
      let copiedCount = 0
      currentItem.platforms.forEach((platform: Platform) => {
        if (platform !== sourceplatform) {
          // Copy caption
          if (sourceContent.caption) {
            handlePlatformContentUpdate(currentItem.id, platform, 'caption', sourceContent.caption)
          }
          
          // Copy hashtags with platform limits
          if (sourceContent.hashtags && sourceContent.hashtags.length > 0) {
            const platformHashtagLimit = getPlatformHashtagLimit(platform)
            const limitedHashtags = sourceContent.hashtags.slice(0, platformHashtagLimit)
            handleHashtagUpdate(currentItem.id, platform, limitedHashtags)
          }
          
          // Copy CTA if applicable
          if (sourceContent.cta && ['instagram', 'facebook', 'linkedin'].includes(platform)) {
            handlePlatformContentUpdate(currentItem.id, platform, 'cta', sourceContent.cta)
          }
          
          // Copy alt text for images
          if (sourceContent.altText && (currentItem.type === 'image' || currentItem.type === 'carousel')) {
            handlePlatformContentUpdate(currentItem.id, platform, 'altText', sourceContent.altText)
          }
          
          copiedCount++
        }
      })
      
      toast.success(`All content copied to ${copiedCount} platforms`)
    } else {
      // Original single field copy logic
      const value = sourceContent[field]
      if (!value || (Array.isArray(value) && value.length === 0)) {
        toast.error(`No ${field} to copy`)
        return
      }
      
      let copiedCount = 0
      currentItem.platforms.forEach((platform: Platform) => {
        if (platform !== sourceplatform) {
          if (field === 'hashtags') {
            // Apply platform-specific hashtag limits
            const platformHashtagLimit = getPlatformHashtagLimit(platform)
            const limitedValue = Array.isArray(value) ? value.slice(0, platformHashtagLimit) : value
            handlePlatformContentUpdate(currentItem.id, platform, field, limitedValue)
          } else {
            handlePlatformContentUpdate(currentItem.id, platform, field, value)
          }
          copiedCount++
        }
      })
      
      if (copiedCount > 0) {
        toast.success(`${field === 'caption' ? 'Caption' : 'Hashtags'} copied to ${copiedCount} platforms`)
      }
    }
  }

  const suggestTrendingHashtags = async (contentId: string, platform: Platform) => {
    // In production, fetch from trending API
    const trending: Record<string, string[]> = {
      instagram: ['trending', 'viral', 'instagood', 'photooftheday', 'instadaily'],
      tiktok: ['fyp', 'foryoupage', 'viral', 'trending', 'foryou'],
      linkedin: ['business', 'entrepreneur', 'leadership', 'innovation', 'professional'],
      x: ['breaking', 'trending', 'tech', 'news', 'viral'],
      facebook: ['trending', 'viral', 'sharethis', 'mustread', 'amazing'],
      youtube: ['youtube', 'youtuber', 'subscribe', 'video', 'vlog'],
      'youtube-short': ['shorts', 'youtubeshorts', 'viral', 'trending', 'subscribe'],
      threads: ['threads', 'meta', 'conversation', 'discussion', 'community']
    }
    
    const platformTrending = trending[platform] || ['trending', 'viral', 'content', 'share', 'new']
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
    return (item.platforms || []).every(platform => {
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
    return <div className="text-center py-8 text-muted-foreground">No content selected</div>
  }

  // Additional safety check
  if (viewMode === 'detail' && currentItem && (!currentItem.platforms || currentItem.platforms.length === 0)) {
    return <div className="text-center py-8 text-muted-foreground">Invalid content format. Please go back and try again.</div>
  }

  const ContentTypeIcon = contentTypeIcons[currentItem?.type || 'clip']

  // Check if there's no content at all
  if (safeContent.length === 0 || editedContent.length === 0) {
    return (
      <div className="text-center py-16">
        <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Content Selected</h3>
        <p className="text-muted-foreground">
          Please go back and select content to publish.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Progress Overview with Action Buttons */}
        <Card className={cn(
          "border-2 transition-all",
                                    !allContentReady && "border-amber-500/50 bg-amber-50/5 dark:bg-amber-950/10"
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
                                        stats.percentage === 100 ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-muted"
              )}
            />
            {!allContentReady && Object.keys(validationErrors).length > 0 && (
                                <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    ⚠️ Required fields missing:
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
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
                    const Icon = contentTypeIcons[item.type] || IconShare2
                    const ready = isContentReady(item)
                    const itemErrors = validationErrors[item.id] || []
=======
    }))
  }

  const updatePlatformData = (itemId: string, platform: string, field: string, value: any) => {
    setStagedContent(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          platformContent: {
            ...item.platformContent,
            [platform]: {
              ...item.platformContent[platform],
              platformData: {
                ...item.platformContent[platform].platformData,
                [field]: value
              }
            }
          }
        }
      }
      return item
    }))
  }

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPlatform(platform)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const selectedContent = stagedContent.find(item => item.id === selectedItem)

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'clip': return IconVideo
      case 'blog': return IconArticle
      case 'image': return IconPhoto
      default: return IconArticle
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'clip': return 'Video Clip'
      case 'blog': return 'Blog Post'
      case 'image': return 'Image'
      case 'carousel': return 'Carousel'
      default: return 'Content'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Generate All */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">AI Copy Generation</CardTitle>
              <p className="text-muted-foreground mt-1">
                Generate optimized copy for each piece of content across all platforms
              </p>
            </div>
            <Button
              size="lg"
              onClick={generateAllCopy}
              disabled={isGenerating || stagedContent.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <IconLoader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <IconSparkles className="h-5 w-5 mr-2" />
                  AI Generate All
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Content List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Items ({stagedContent.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {stagedContent.map((item, index) => {
                    const Icon = getContentIcon(item.type)
                    const isSelected = selectedItem === item.id
                    const isGenerating = generatingItems.has(item.id)
                    const hasGeneratedContent = Object.values(item.platformContent || {}).some((p: any) => p.generated)
>>>>>>> 7184e73 (Add new files and configurations for project setup)
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
                        className={cn(
                          "border rounded-lg p-4 transition-all",
                                                        !ready && "border-amber-500/30 bg-muted/50",
                          selectedContent === item.id && "ring-2 ring-primary"
                        )}
                      >
                        {/* Content Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              ready ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-muted text-muted-foreground"
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
                          {(item.platforms || []).map((platform) => {
                            const PlatformIcon = platformIcons[platform] || IconShare2
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
                                      hasCaption ? "bg-primary" : "bg-muted-foreground"
                                    )} />
                                    <span className="text-muted-foreground">Caption</span>
                                  </div>
                                  {(item.type === 'image' || item.type === 'carousel') && (
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "inline-block w-2 h-2 rounded-full",
                                        hasAltText ? "bg-primary" : "bg-muted-foreground"
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
                                        {platformData.characterCount}/{getPlatformLimit(platform)}
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
                          <div className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg">
                                                          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                                Issues to fix:
                              </p>
                              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                              {itemErrors.map((error, idx) => (
                                <li key={idx}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
=======
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            isSelected && "ring-2 ring-primary",
                            isGenerating && "opacity-75"
                          )}
                          onClick={() => setSelectedItem(item.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                isSelected ? "bg-primary/20" : "bg-muted"
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate">{item.title}</h4>
                                  {hasGeneratedContent && (
                                    <IconCheck className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {getContentTypeLabel(item.type)}
                                  </Badge>
                                  {item.score && (
                                    <Badge variant="secondary" className="text-xs">
                                      Score: {item.score}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {isGenerating && (
                                <IconLoader2 className="h-4 w-4 animate-spin text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
>>>>>>> 7184e73 (Add new files and configurations for project setup)
                      </motion.div>
                    )
                  })}
                </div>
<<<<<<< HEAD
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
=======
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Platform Copies */}
        <div className="lg:col-span-2">
          {selectedContent ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedContent.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customize copy for each platform
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateCopyForItem(selectedContent.id)}
                    disabled={generatingItems.has(selectedContent.id)}
                  >
                    {generatingItems.has(selectedContent.id) ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconSparkles className="h-4 w-4 mr-1" />
                        Generate All
                      </>
                    )}
>>>>>>> 7184e73 (Add new files and configurations for project setup)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
<<<<<<< HEAD
                <div className="space-y-2">
                  {editedContent.map((item) => {
                      const Icon = contentTypeIcons[item.type] || IconShare2
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
                              hasErrors && "border-amber-500/30 bg-amber-50/5 dark:bg-amber-950/10"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-full",
                              ready ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20" : "bg-muted text-muted-foreground"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                                                          {hasErrors && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
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
                                <IconCheck className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <IconAlertCircle className="h-5 w-5 text-amber-500" />
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
                  <Tabs defaultValue={currentItem.platforms?.[0] || 'instagram'} className="w-full">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${currentItem.platforms?.length || 1}, 1fr)` }}>
                      {(currentItem.platforms || []).map((platform) => {
                        const Icon = platformIcons[platform] || IconShare2
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

                    {(currentItem.platforms || []).map((platform) => {
                      const platformData = currentItem.platformContent[platform] || {
                        caption: '',
                        hashtags: [],
                        cta: '',
                        altText: '',
                        characterCount: 0,
                        isValid: true
                      }
                      const platformLimit = getPlatformLimit(platform)
                      const hashtagLimit = getPlatformHashtagLimit(platform)
                      const key = `${currentItem.id}-${platform}`
                      const suggestions = aiSuggestions[key]

                      return (
                        <TabsContent key={platform} value={platform} className="space-y-4 mt-6">
                          {/* Caption */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`caption-${platform}`}>Caption</Label>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <IconCopy className="h-4 w-4 mr-1" />
                                      Copy
                                      <IconChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => copyToAllPlatforms(platform, 'caption')}>
                                      <IconFileText className="h-4 w-4 mr-2" />
                                      Copy Caption Only
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => copyToAllPlatforms(platform, 'hashtags')}>
                                      <IconHash className="h-4 w-4 mr-2" />
                                      Copy Hashtags Only
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => copyToAllPlatforms(platform, 'all')}>
                                      <IconCopy className="h-4 w-4 mr-2" />
                                      Copy All Content
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                                  {isGenerating[key] ? 'Generating...' : 'AI Generate All'}
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
                                maxLength={platformLimit}
                              />
                              <div className={cn(
                                "absolute bottom-2 right-2 text-xs px-2 py-1 rounded",
                                (platformData.characterCount || 0) > platformLimit * 0.9 
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {platformData.characterCount || 0}/{platformLimit}
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
                          {hashtagLimit > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Hashtags ({platformData.hashtags?.length || 0}/{hashtagLimit})</Label>
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
                                  disabled={platformData.hashtags?.length >= hashtagLimit}
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
                                  disabled={platformData.hashtags?.length >= hashtagLimit}
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

                          {/* YouTube-specific fields */}
                          {platform === 'youtube' && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`title-${platform}`}>Video Title</Label>
                                  <Badge variant="outline" className="text-xs">Required</Badge>
                                </div>
                                <Input
                                  id={`title-${platform}`}
                                  value={(platformData as any).title || ''}
                                  onChange={(e) => handlePlatformContentUpdate(
                                    currentItem.id,
                                    platform,
                                    'title',
                                    e.target.value
                                  )}
                                  placeholder="Engaging video title (max 100 characters)"
                                  maxLength={100}
                                  className={!(platformData as any).title ? "border-orange-500" : ""}
                                />
                                <p className="text-xs text-muted-foreground">
                                  {((platformData as any).title || '').length}/100 • First 70 characters show in search
                                </p>
                              </div>

                              {currentItem.type === 'clip' && (
                                <div className="space-y-2">
                                  <Label htmlFor={`category-${platform}`}>Category</Label>
                                  <Select
                                    value={(platformData as any).category || ''}
                                    onValueChange={(value) => handlePlatformContentUpdate(
                                      currentItem.id,
                                      platform,
                                      'category',
                                      value
                                    )}
                                  >
                                    <SelectTrigger id={`category-${platform}`}>
                                      <SelectValue placeholder="Select category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Education">Education</SelectItem>
                                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                                      <SelectItem value="Science & Technology">Science & Technology</SelectItem>
                                      <SelectItem value="Business">Business</SelectItem>
                                      <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                                      <SelectItem value="Gaming">Gaming</SelectItem>
                                      <SelectItem value="Music">Music</SelectItem>
                                      <SelectItem value="News & Politics">News & Politics</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </>
                          )}

                          {/* Instagram location for clips */}
                          {platform === 'instagram' && currentItem.type === 'clip' && (
                            <div className="space-y-2">
                              <Label htmlFor={`location-${platform}`}>Location (Optional)</Label>
                              <Input
                                id={`location-${platform}`}
                                value={(platformData as any).location || ''}
                                onChange={(e) => handlePlatformContentUpdate(
                                  currentItem.id,
                                  platform,
                                  'location',
                                  e.target.value
                                )}
                                placeholder="Add location tag..."
                              />
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
                                {(currentItem.platforms || []).map(platform => {
                                  const Icon = platformIcons[platform] || IconShare2
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
                                            {(data.hashtags || []).map(tag => `#${tag}`).join(' ')}
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
  const tips: Record<string, string[]> = {
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
    'youtube-short': [
      "Keep under 60 seconds",
      "Vertical format performs best",
      "Hook viewers in first 3 seconds"
    ],
    threads: [
      "Start conversations",
      "Be authentic and personal",
      "Reply to comments quickly"
    ]
  }
  
  return tips[platform] || []
=======
                <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <TabsList className="grid grid-cols-4 w-full">
                    {Object.entries(platformConfigs).map(([key, config]) => (
                      <TabsTrigger key={key} value={key} className="gap-2">
                        <config.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{config.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.entries(platformConfigs).map(([platform, config]) => (
                    <TabsContent key={platform} value={platform} className="space-y-4 mt-6">
                      <div className="space-y-4">
                        {/* Platform Header with Tips */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg bg-gradient-to-br text-white",
                                config.color
                              )}>
                                <config.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-medium">{config.name}</h3>
                                <p className="text-xs text-muted-foreground">{config.bestPractices}</p>
                              </div>
                            </div>
                            {!selectedContent.platformContent?.[platform]?.generated && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateCopyForItem(selectedContent.id, platform)}
                                disabled={generatingItems.has(selectedContent.id)}
                              >
                                <IconSparkles className="h-4 w-4 mr-1" />
                                Generate
                              </Button>
                            )}
                          </div>
                          
                          {/* Platform-specific tips */}
                          <Card className="bg-muted/50 border-dashed">
                            <CardContent className="p-3">
                              <p className="text-xs font-medium mb-1">
                                💡 Tips for {getContentTypeLabel(selectedContent.type)}:
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-pre-line">
                                {config.tips[selectedContent.type as keyof typeof config.tips] || 'Share your best content!'}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Caption Editor */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Caption</label>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(
                                selectedContent.platformContent?.[platform]?.caption || '',
                                platform
                              )}
                            >
                              {copiedPlatform === platform ? (
                                <IconCheck className="h-4 w-4 text-green-600" />
                              ) : (
                                <IconCopy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Textarea
                            value={selectedContent.platformContent?.[platform]?.caption || ''}
                            onChange={(e) => updateCaption(selectedContent.id, platform, e.target.value)}
                            placeholder={`Write your ${config.name} caption here...`}
                            className="min-h-[150px] resize-none"
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className={cn(
                              "transition-colors",
                              selectedContent.platformContent?.[platform]?.characterCount > config.charLimit
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}>
                              {selectedContent.platformContent?.[platform]?.characterCount || 0} / {config.charLimit}
                            </span>
                            {selectedContent.platformContent?.[platform]?.generated && (
                              <Badge variant="secondary" className="text-xs">
                                AI Generated
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Hashtags */}
                        {selectedContent.platformContent?.[platform]?.hashtags?.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Hashtags</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedContent.platformContent[platform].hashtags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Platform-specific inputs */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <IconSettings className="h-4 w-4" />
                              Platform Settings
                            </h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowPlatformSettings(!showPlatformSettings)}
                            >
                              {showPlatformSettings ? (
                                <IconChevronUp className="h-4 w-4" />
                              ) : (
                                <IconChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {showPlatformSettings && (
                            <PlatformSpecificInputs
                              platform={platform}
                              contentType={selectedContent.type}
                              data={selectedContent.platformContent?.[platform]?.platformData || {}}
                              onChange={(field, value) => 
                                updatePlatformData(selectedContent.id, platform, field, value)
                              }
                            />
                          )}
                        </div>

                        {/* Preview */}
                        {selectedContent.platformContent?.[platform]?.caption && (
                          <Card className="bg-muted/50">
                            <CardHeader className="pb-3">
                              <h4 className="text-sm font-medium">Preview</h4>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {/* Mock Platform Post */}
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80" />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">Your Brand</p>
                                    <p className="text-xs text-muted-foreground">@yourbrand</p>
                                  </div>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">
                                  {selectedContent.platformContent[platform].caption}
                                </p>
                                {selectedContent.type === 'clip' && selectedContent.thumbnailUrl && (
                                  <img 
                                    src={selectedContent.thumbnailUrl} 
                                    alt=""
                                    className="w-full rounded-lg"
                                  />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <IconSparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a content item to customize its copy
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => {
            onUpdate(stagedContent)
            onNext()
          }}
          disabled={isGenerating}
          className="min-w-[200px]"
        >
          Continue to Review
          <IconArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
>>>>>>> 7184e73 (Add new files and configurations for project setup)
} 