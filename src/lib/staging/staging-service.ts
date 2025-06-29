import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { AIContentService } from '@/lib/ai-content-service'
import { Project, ClipData, BlogPost, SocialPost as ProjectSocialPost } from '@/lib/project-types'
import { Platform, CreatePostRequest } from '@/lib/social/types'
import { addDays, addHours, setHours, setMinutes, startOfDay, format, isWeekend } from 'date-fns'
import { getOpenAI } from '@/lib/openai'
import { OpenAI } from 'openai'
import { handleError, AppError } from '@/lib/error-handler'
import { z } from 'zod'

// Type for items that can be staged
type StagedItem = {
  id: string
  title: string
  description?: string
  type: 'video' | 'image' | 'text' | 'carousel'
  duration?: number
  thumbnail?: string
  content?: any
}

export interface StagedContent {
  id: string
  type: 'clip' | 'blog' | 'image' | 'carousel'
  title: string
  description?: string
  originalData: any
  platforms: Platform[]
  platformContent: {
    [key in Platform]?: {
      caption: string
      hashtags: string[]
      mentions?: string[]
      // Platform-specific fields
      altText?: string // For images
      cta?: string // Call to action
      link?: string // For link posts
      aspectRatio?: string // For different platform requirements
      characterCount?: number
      isValid?: boolean
      validationErrors?: string[]
    }
  }
  mediaUrls?: string[]
  thumbnailUrl?: string
  duration?: number
  analytics?: {
    estimatedReach?: number
    bestPostingTime?: Date
    competitorAnalysis?: any
  }
}

export interface ScheduledContent {
  stagedContent: StagedContent
  scheduledDate: Date
  platforms: Platform[]
  optimizationReason?: string
  suggestedHashtags?: string[]
  engagementPrediction?: {
    score: number
    bestTime: boolean
    reasoning: string
  }
}

interface OptimalSchedule {
  date: Date
  reason: string
  engagementScore: number
}

// Platform character limits
const PLATFORM_LIMITS = {
  instagram: {
    caption: 2200,
    hashtags: 30,
    minVideoDuration: 3,
    maxVideoDuration: 60,
    minImageCount: 1,
    maxImageCount: 10,
    optimalPostTimes: [8, 12, 17, 19], // hours in UTC
  },
  'instagram-reel': {
    caption: 2200,
    hashtags: 30,
    minVideoDuration: 3,
    maxVideoDuration: 90,
    optimalPostTimes: [9, 13, 17, 20],
  },
  'instagram-story': {
    caption: 0, // No captions for stories
    hashtags: 0,
    maxVideoDuration: 15,
    optimalPostTimes: [7, 12, 18, 21],
  },
  x: {
    caption: 280,
    hashtags: 10,
    maxVideoDuration: 140,
    optimalPostTimes: [9, 12, 17, 22],
  },
  linkedin: {
    caption: 3000,
    hashtags: 5,
    maxVideoDuration: 600,
    optimalPostTimes: [7, 12, 17],
  },
  youtube: {
    caption: 5000,
    hashtags: 15,
    maxVideoDuration: 43200, // 12 hours
    optimalPostTimes: [14, 16, 20],
  },
  'youtube-short': {
    caption: 5000,
    hashtags: 15,
    maxVideoDuration: 60,
    optimalPostTimes: [12, 18, 20],
  },
  tiktok: {
    caption: 2200,
    hashtags: 100,
    minVideoDuration: 3,
    maxVideoDuration: 180,
    optimalPostTimes: [6, 10, 19, 22],
  },
  facebook: {
    caption: 63206,
    hashtags: 30,
    maxVideoDuration: 240,
    optimalPostTimes: [9, 13, 15, 19],
  },
  threads: {
    caption: 500,
    hashtags: 10,
    maxVideoDuration: 90,
    optimalPostTimes: [8, 12, 17, 20],
  },
} as const

// Validation schemas
const platformContentSchema = z.object({
  platform: z.enum(['instagram', 'instagram-reel', 'instagram-story', 'x', 'linkedin', 'youtube', 'youtube-short', 'tiktok', 'facebook', 'threads']),
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string().optional(),
})

const stagedContentSchema = z.object({
  id: z.string(),
  type: z.enum(['clip', 'blog', 'image', 'carousel']),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number().optional(),
  thumbnail: z.string().optional(),
  content: z.array(platformContentSchema),
})

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string, limit: number = 10): void {
  const now = Date.now()
  const userLimit = rateLimitCache.get(userId)
  
  if (userLimit) {
    if (now < userLimit.resetAt) {
      if (userLimit.count >= limit) {
        throw new AppError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT', 429)
      }
      userLimit.count++
    } else {
      rateLimitCache.set(userId, { count: 1, resetAt: now + 60000 }) // Reset every minute
    }
  } else {
    rateLimitCache.set(userId, { count: 1, resetAt: now + 60000 })
  }
}

export class StagingService {
  static async initializeStagedContent(
    projectId: string,
    selectedContentIds: string[],
    project: Project
  ): Promise<StagedContent[]> {
    const stagedContent: StagedContent[] = []

    // Process content in parallel for better performance
    const contentPromises = selectedContentIds.map(async (contentId) => {
      const [type, id] = contentId.split('-')
      
      switch (type) {
        case 'clip':
          const clip = project.folders.clips.find(c => c.id === id)
          return clip ? await this.prepareClipContent(clip, project) : null
        
        case 'blog':
          const blog = project.folders.blog.find(b => b.id === id)
          return blog ? await this.prepareBlogContent(blog, project) : null
        
        case 'social':
          const socialIndex = parseInt(id)
          const social = project.folders.social[socialIndex]
          return social ? await this.prepareSocialContent(social, socialIndex, project) : null
        
        case 'image':
          const image = project.folders.images?.find((img: any) => img.id === id)
          return image ? await this.prepareImageContent(image, project) : null
        
        default:
          return null
      }
    })

    const results = await Promise.all(contentPromises)
    return results.filter((content): content is StagedContent => content !== null)
  }

  private static async prepareClipContent(clip: ClipData, project: Project): Promise<StagedContent> {
    // Generate AI-powered captions for different platforms
    const platformContent = await this.generatePlatformContent('clip', {
      title: clip.title || 'Video Clip',
      description: clip.description,
      duration: clip.duration,
      transcript: clip.transcript,
      viralityScore: clip.score,
      projectContext: project.description || project.content_analysis?.summary
    })

    // Determine best platforms based on clip duration
    const platforms = this.determineBestPlatforms('clip', clip.duration)

    return {
      id: `clip-${clip.id}`,
      type: 'clip',
      title: clip.title || 'Untitled Clip',
      description: clip.description,
      originalData: clip,
      platforms,
      platformContent,
      mediaUrls: clip.exportUrl ? [clip.exportUrl] : [],
      thumbnailUrl: clip.thumbnail,
      duration: clip.duration,
      analytics: {
        estimatedReach: Math.floor(clip.score * 10000)
      }
    }
  }

  private static async prepareBlogContent(blog: BlogPost, project: Project): Promise<StagedContent> {
    // Generate social media snippets from blog content
    const platformContent = await this.generatePlatformContent('blog', {
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content.substring(0, 500), // First 500 chars for context
      tags: blog.tags,
      readingTime: blog.readingTime,
      keyPoints: this.extractKeyPoints(blog.content)
    })

    const platforms: Platform[] = ['linkedin', 'x', 'facebook', 'threads']

    return {
      id: `blog-${blog.id}`,
      type: 'blog',
      title: blog.title,
      description: blog.excerpt,
      originalData: blog,
      platforms,
      platformContent,
      mediaUrls: [], // Blog posts typically don't have media URLs
      analytics: {
        estimatedReach: blog.readingTime * 1000 // Rough estimate
      }
    }
  }

  private static async prepareSocialContent(
    social: ProjectSocialPost, 
    index: number, 
    project: Project
  ): Promise<StagedContent> {
    const platforms = social.platform ? [social.platform as Platform] : ['instagram', 'x'] as Platform[]
    
    // Enhance existing social content with AI
    const enhancedContent = await this.enhanceSocialContent(social.content, platforms)
    
    return {
      id: `social-${index}`,
      type: 'clip',
      title: `Social Post ${index + 1}`,
      description: social.content,
      originalData: social,
      platforms,
      platformContent: enhancedContent,
      mediaUrls: social.mediaUrl ? [social.mediaUrl] : []
    }
  }

  private static async prepareImageContent(image: any, project: Project): Promise<StagedContent> {
    // Generate AI-powered captions and alt text
    const platformContent = await this.generatePlatformContent('image', {
      type: image.type,
      style: image.style,
      description: image.prompt,
      visualElements: await this.analyzeImageContent(image.url),
      slideNumber: image.slideNumber
    })

    const platforms: Platform[] = ['instagram', 'facebook', 'linkedin', 'threads']

    return {
      id: `image-${image.id}`,
      type: image.type === 'carousel-slide' ? 'carousel' : 'image',
      title: image.type === 'carousel-slide' 
        ? `Carousel - Slide ${image.slideNumber}` 
        : 'AI Generated Image',
      description: image.prompt,
      originalData: image,
      platforms,
      platformContent,
      mediaUrls: image.url ? [image.url] : [],
      thumbnailUrl: image.url,
      analytics: {
        estimatedReach: 5000 // Base estimate for images
      }
    }
  }

  static async generatePlatformContent(
    contentType: string,
    context: any,
    specificPlatform?: string,
    projectContext?: string,
    userId?: string
  ): Promise<StagedContent['platformContent']> {
    try {
      // If generating for a specific platform
      if (specificPlatform) {
        const result = await this.generateSinglePlatformContent(
          context,
          specificPlatform,
          projectContext,
          userId
        )
        
        return {
          [specificPlatform as Platform]: {
            caption: result.caption,
            hashtags: result.hashtags,
            cta: result.cta,
            characterCount: result.caption.length,
            isValid: true
          }
        }
      }

      // Generate for all platforms
      const openai = getOpenAI()
      
      const prompt = `You are a social media expert. Generate optimized, engaging content for a ${contentType}.

Context:
${JSON.stringify(context, null, 2)}

Requirements:
1. Create platform-specific captions that maximize engagement
2. Use native platform language and trends
3. Include relevant hashtags (Instagram: 5-10, LinkedIn: 3-5, X: 2-3, TikTok: 5-8)
4. Add compelling CTAs appropriate for each platform
5. Ensure content fits within platform character limits
6. Make content shareable and conversation-starting

Platform Guidelines:
- Instagram: Visual storytelling, emoji-rich, community-focused
- LinkedIn: Professional, value-driven, thought leadership
- X (Twitter): Concise, witty, thread-worthy
- TikTok: Trendy, Gen-Z friendly, entertainment-focused
- Facebook: Conversational, community-building
- YouTube: SEO-optimized, detailed descriptions
- Threads: Conversational, authentic, discussion-starting

Return JSON with this structure:
{
  "instagram": {
    "caption": "Engaging caption with emojis",
    "hashtags": ["relevanthashtag1", "trending2"],
    "cta": "Double tap if you agree! 💕",
    "altText": "Descriptive alt text for accessibility"
  },
  // ... other platforms
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an expert social media strategist who creates viral, engaging content.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })

      const generated = JSON.parse(completion.choices[0].message.content || '{}')
      
      // Validate and enhance the generated content
      return this.validateAndEnhancePlatformContent(generated, contentType)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error generating platform content:', error)
      }
      // Return enhanced default content as fallback
      return this.getDefaultPlatformContent(contentType, context)
    }
  }

  private static async generateSinglePlatformContent(
    item: StagedItem,
    platform: string,
    projectContext?: string,
    userId?: string
  ): Promise<{
    caption: string
    hashtags: string[]
    cta?: string
  }> {
    // Rate limiting
    if (userId) {
      checkRateLimit(userId)
    }

    // Validate platform
    const platformKey = platform as keyof typeof PLATFORM_LIMITS
    const limits = PLATFORM_LIMITS[platformKey]
    if (!limits) {
      throw new AppError(`Unsupported platform: ${platform}`, 'INVALID_PLATFORM', 400)
    }

    // Validate content type for platform
    if (item.type === 'video' && item.duration) {
      const minDuration = 'minVideoDuration' in limits ? limits.minVideoDuration : undefined
      if (minDuration && item.duration < minDuration) {
        throw new AppError(
          `Video too short for ${platform}. Minimum duration: ${minDuration}s`,
          'VIDEO_TOO_SHORT',
          400
        )
      }
      if (limits.maxVideoDuration && item.duration > limits.maxVideoDuration) {
        throw new AppError(
          `Video too long for ${platform}. Maximum duration: ${limits.maxVideoDuration}s`,
          'VIDEO_TOO_LONG',
          400
        )
      }
    }

    try {
      const openai = getOpenAI()
      
      // Enhanced prompt with platform best practices
      const systemPrompt = `You are a social media expert specializing in ${platform} content. 
      Platform limits: ${limits.caption} chars for caption, ${limits.hashtags} hashtags max.
      
      Best practices for ${platform}:
      ${this.getPlatformBestPractices(platformKey)}
      
      Content context: ${projectContext || 'General content'}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Generate social media content for this item: ${JSON.stringify(item)}` 
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })

      const generated = JSON.parse(completion.choices[0].message.content || '{}')
      
      // Validate generated content
      const validatedContent = this.validatePlatformContent(
        generated,
        platformKey
      )

      return validatedContent
    } catch (error) {
      if (error instanceof AppError) throw error
      handleError(error, 'generateSinglePlatformContent')
      throw new AppError('Failed to generate platform content', 'AI_GENERATION_FAILED', 500)
    }
  }

  private static validateAndEnhancePlatformContent(
    content: any,
    contentType: string
  ): StagedContent['platformContent'] {
    const validated: StagedContent['platformContent'] = {}
    
    for (const [platform, data] of Object.entries(content)) {
      if (typeof data === 'object' && data !== null) {
        const platformKey = platform as Platform
        const limit = PLATFORM_LIMITS[platformKey as keyof typeof PLATFORM_LIMITS]
        
        if (limit) {
          const caption = (data as any).caption || ''
          const hashtags = (data as any).hashtags || []
          const totalLength = caption.length + hashtags.join(' #').length
          
          validated[platformKey] = {
            caption,
            hashtags: hashtags.slice(0, limit.hashtags || 30),
            mentions: (data as any).mentions,
            cta: (data as any).cta,
            link: (data as any).link,
            altText: (data as any).altText,
            characterCount: totalLength,
            isValid: totalLength <= limit.caption,
            validationErrors: totalLength > limit.caption 
              ? [`Caption exceeds ${limit.caption} character limit`]
              : []
          }
        }
      }
    }
    
    return validated
  }

  private static validatePlatformContent(
    content: any,
    platform: keyof typeof PLATFORM_LIMITS
  ): { caption: string; hashtags: string[]; cta?: string } {
    const limits = PLATFORM_LIMITS[platform]
    
    // Trim caption to limit
    let caption = content.caption || ''
    if (caption.length > limits.caption) {
      caption = caption.substring(0, limits.caption - 3) + '...'
    }
    
    // Limit hashtags
    let hashtags = content.hashtags?.slice(0, limits.hashtags) || []
    
    // Clean hashtags
    hashtags = hashtags.map((tag: string) => 
      tag.startsWith('#') ? tag : `#${tag}`
    ).filter((tag: string) => tag.length > 1)
    
    return {
      caption,
      hashtags,
      cta: content.cta
    }
  }

  private static getPlatformBestPractices(platform: keyof typeof PLATFORM_LIMITS): string {
    const practices = {
      'instagram': 'Use 3-5 hashtags, emoji for visual appeal, include a clear CTA',
      'instagram-reel': 'Hook in first 3 seconds, use trending audio, vertical format',
      'instagram-story': 'Keep it casual, use stickers/polls, swipe-up CTA if available',
      'x': 'Be concise, use 1-2 hashtags, thread for longer content',
      'linkedin': 'Professional tone, industry keywords, thought leadership angle',
      'youtube': 'SEO-optimized title, detailed description, relevant tags',
      'youtube-short': 'Attention-grabbing hook, fast-paced, clear value prop',
      'tiktok': 'Trendy, authentic, use popular sounds, engage quickly',
      'facebook': 'Conversational tone, ask questions, use native video',
      'threads': 'Casual, conversational, part of broader discussion',
    }
    
    return practices[platform] || 'Create engaging, platform-appropriate content'
  }

  private static extractKeyPoints(content: string): string[] {
    // Simple extraction - in production, use NLP
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    return sentences.slice(0, 3).map(s => s.trim())
  }

  private static async analyzeImageContent(imageUrl?: string): Promise<string> {
    // In production, use computer vision API to analyze image
    return 'Visual content with engaging elements'
  }

  private static async enhanceSocialContent(
    originalContent: string,
    platforms: Platform[]
  ): Promise<StagedContent['platformContent']> {
    const enhanced: StagedContent['platformContent'] = {}
    
    for (const platform of platforms) {
      enhanced[platform] = {
        caption: originalContent,
        hashtags: await this.generateSmartHashtags(originalContent, platform),
        cta: this.generatePlatformCTA(platform),
        isValid: true,
        characterCount: originalContent.length
      }
    }
    
    return enhanced
  }

  private static async generateSmartHashtags(
    content: string,
    platform: Platform
  ): Promise<string[]> {
    // Extract keywords and generate relevant hashtags
    const words = content.toLowerCase().split(/\W+/).filter(w => w.length > 4)
    const hashtags = words.slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1))
    
    // Add platform-specific trending hashtags
    const trendingByPlatform = {
      instagram: ['InstaGood', 'PhotoOfTheDay'],
      tiktok: ['ForYouPage', 'FYP'],
      linkedin: ['LinkedInLearning', 'ProfessionalDevelopment'],
      x: ['Tech', 'Innovation'],
      facebook: ['FacebookLive'],
      youtube: ['YouTubeShorts'],
      threads: ['ThreadsApp']
    }
    
    return [...hashtags, ...(trendingByPlatform[platform] || [])]
  }

  private static generatePlatformCTA(platform: Platform): string {
    const ctas = {
      instagram: 'Link in bio! 🔗',
      linkedin: 'Share your thoughts below',
      x: 'RT if you agree',
      tiktok: 'Follow for more!',
      facebook: 'Hit that like button!',
      youtube: 'Subscribe for more content!',
      threads: 'Join the conversation 💬'
    }
    
    return ctas[platform] || 'Check it out!'
  }

  private static determineBestPlatforms(
    contentType: string,
    duration?: number
  ): Platform[] {
    if (contentType === 'clip' && duration) {
      if (duration <= 60) {
        return ['instagram', 'tiktok', 'youtube'] as Platform[]
      } else if (duration <= 180) {
        return ['youtube', 'facebook', 'instagram'] as Platform[]
      } else {
        return ['youtube', 'facebook'] as Platform[]
      }
    }
    
    // Default platforms by content type
    const defaults = {
      blog: ['linkedin', 'x', 'facebook', 'threads'],
      image: ['instagram', 'facebook', 'linkedin', 'threads'],
      carousel: ['instagram', 'linkedin', 'facebook']
    }
    
    return (defaults[contentType as keyof typeof defaults] || ['instagram', 'x']) as Platform[]
  }

  private static getDefaultPlatformContent(
    contentType: string,
    context: any
  ): StagedContent['platformContent'] {
    const title = context.title || 'Amazing Content'
    const description = context.description || ''
    
    const templates = {
      instagram: {
        clip: `🎬 ${title}\n\n${description}\n\n👇 Watch till the end!\n\n`,
        blog: `📖 New article alert!\n\n"${title}"\n\n${description}\n\nLink in bio 🔗`,
        image: `✨ ${description || 'Swipe to see more'}\n\nWhat do you think? Let me know below! 💭`
      },
      linkedin: {
        clip: `Excited to share this video: ${title}\n\n${description}\n\nKey takeaways:\n→ \n→ \n→ \n\nWhat's your experience with this?`,
        blog: `📊 New article: "${title}"\n\n${description}\n\nIn this piece, I explore:\n• \n• \n• \n\nRead more: [Link]`,
        image: `Visual insight: ${title}\n\n${description}\n\nWhat patterns do you see here?`
      },
      x: {
        clip: `🎥 ${title}\n\n${description}\n\nThread 🧵👇`,
        blog: `New post: "${title}"\n\n${description}\n\n[Link]`,
        image: `${description || 'Check this out 👀'}`
      },
      tiktok: {
        clip: `${title} 🤯\n\n${description}\n\nWait for it... 👀`,
        blog: `POV: You just found the best article about ${title} 📚\n\nLink in bio!`,
        image: `${description} ✨\n\nSave this for later! 📌`
      },
      facebook: {
        clip: `🎬 ${title}\n\n${description}\n\nWhat are your thoughts on this? I'd love to hear your perspective!`,
        blog: `📖 Just published: "${title}"\n\n${description}\n\nFull article: [Link]\n\nWould love to hear your thoughts!`,
        image: `${description}\n\nTag someone who needs to see this! 👇`
      },
      youtube: {
        clip: `${title} | Full Video\n\n${description}\n\n⏱ Timestamps:\n0:00 Intro\n\n🔔 Subscribe for more content like this!\n\n#YouTube #Content`,
        blog: `${title} - Detailed Breakdown\n\n${description}\n\nFull article linked below 👇`,
        image: `${title}\n\n${description}\n\nMore content like this on the channel!`
      },
      threads: {
        clip: `Just dropped: ${title} 🎬\n\n${description}\n\nThoughts?`,
        blog: `New read: "${title}"\n\n${description}\n\nLet's discuss 👇`,
        image: `${description || 'Visual story'} 📸\n\nWhat's your take?`
      }
    }
    
    const platformContent: StagedContent['platformContent'] = {}
    
    for (const [platform, contentTemplates] of Object.entries(templates)) {
      const template = contentTemplates[contentType as keyof typeof contentTemplates] || contentTemplates.clip
      const hashtags = this.getDefaultHashtags(contentType, platform as Platform)
      
      platformContent[platform as Platform] = {
        caption: template,
        hashtags,
        cta: this.generatePlatformCTA(platform as Platform),
        characterCount: template.length,
        isValid: true
      }
    }
    
    return platformContent
  }

  private static getDefaultHashtags(contentType: string, platform: Platform): string[] {
    const baseHashtags = {
      clip: ['video', 'content', 'creator'],
      blog: ['blog', 'article', 'writing'],
      image: ['photography', 'visual', 'creative']
    }
    
    const platformSpecific = {
      instagram: ['instagood', 'instadaily'],
      tiktok: ['fyp', 'foryoupage'],
      linkedin: ['professional', 'business'],
      x: ['tech', 'trending'],
      facebook: ['facebook', 'social'],
      youtube: ['youtube', 'youtubecreator'],
      threads: ['threads', 'meta']
    }
    
    return [
      ...(baseHashtags[contentType as keyof typeof baseHashtags] || []),
      ...(platformSpecific[platform] || [])
    ]
  }

  static async generateOptimalSchedule(
    content: StagedContent[],
    preferences: {
      timezone: string
      startDate?: Date
      endDate?: Date
      postsPerDay?: number
      preferredTimes?: string[]
      avoidWeekends?: boolean
    }
  ): Promise<ScheduledContent[]> {
    const scheduled: ScheduledContent[] = []
    const startDate = preferences.startDate || new Date()
    const endDate = preferences.endDate || addDays(startDate, 7)
    const postsPerDay = preferences.postsPerDay || 2

    // Get AI-powered optimal posting times
    const optimalTimes = await this.getOptimalPostingTimes(content, preferences)

    // Get user's historical engagement data
    const historicalData = await this.getUserEngagementHistory(preferences.timezone)

    let currentDate = startOfDay(startDate)
    let contentIndex = 0
    let dailyPostCount = 0
    const scheduledDates = new Set<string>()

    while (currentDate <= endDate && contentIndex < content.length) {
      // Skip weekends if requested
      if (preferences.avoidWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1)
        continue
      }

      // Reset daily post count
      if (dailyPostCount >= postsPerDay) {
        currentDate = addDays(currentDate, 1)
        dailyPostCount = 0
        continue
      }

      const contentItem = content[contentIndex]
      const optimalTime = this.selectOptimalTime(
        optimalTimes,
        currentDate,
        scheduledDates,
        contentItem.type,
        historicalData
      )
      
      // Set the scheduled time
      let scheduledDate = setHours(currentDate, optimalTime.hour)
      scheduledDate = setMinutes(scheduledDate, optimalTime.minute)

      // Ensure no conflicts
      const dateKey = format(scheduledDate, 'yyyy-MM-dd-HH:mm')
      if (scheduledDates.has(dateKey)) {
        // Add 30 minutes if there's a conflict
        scheduledDate = addHours(scheduledDate, 0.5)
      }
      scheduledDates.add(format(scheduledDate, 'yyyy-MM-dd-HH:mm'))

      // Get engagement prediction
      const prediction = await this.predictEngagement(
        contentItem,
        scheduledDate,
        historicalData
      )

      // Generate final hashtags based on timing and trends
      const suggestedHashtags = await this.getSuggestedHashtags(
        contentItem,
        scheduledDate
      )

      scheduled.push({
        stagedContent: contentItem,
        scheduledDate,
        platforms: contentItem.platforms,
        optimizationReason: optimalTime.reason,
        suggestedHashtags,
        engagementPrediction: prediction
      })

      contentIndex++
      dailyPostCount++
    }

    return scheduled
  }

  private static async getOptimalPostingTimes(
    content: StagedContent[],
    preferences: any
  ): Promise<Array<{ hour: number; minute: number; reason: string; score: number }>> {
    try {
      const openai = getOpenAI()
      
      const prompt = `Analyze optimal posting times for social media content.
      
Content to schedule:
- ${content.length} total posts
- Types: ${[...new Set(content.map(c => c.type))].join(', ')}
- Platforms: ${[...new Set(content.flatMap(c => c.platforms))].join(', ')}
- Timezone: ${preferences.timezone}

Consider:
1. Platform-specific peak times (Instagram: 6-9am, 12-2pm, 5-7pm)
2. Audience behavior in ${preferences.timezone} timezone
3. Content type performance windows
4. Competition and feed saturation times
5. Weekend vs weekday patterns

Return JSON array of optimal times:
[
  {
    "hour": 9,
    "minute": 0,
    "reason": "Morning commute, high engagement",
    "score": 95,
    "bestFor": ["instagram", "linkedin"]
  }
]`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a social media analytics expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (response) {
        const parsed = JSON.parse(response)
        return parsed.times || parsed.optimalTimes || this.getDefaultOptimalTimes()
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error getting optimal times:', error)
      }
    }
    
    return this.getDefaultOptimalTimes()
  }

  private static getDefaultOptimalTimes() {
    return [
      { hour: 8, minute: 30, reason: 'Morning routine check', score: 85 },
      { hour: 12, minute: 0, reason: 'Lunch break peak', score: 90 },
      { hour: 17, minute: 30, reason: 'After work wind-down', score: 95 },
      { hour: 20, minute: 0, reason: 'Evening entertainment time', score: 88 },
      { hour: 9, minute: 15, reason: 'Start of workday', score: 82 },
      { hour: 14, minute: 0, reason: 'Afternoon slump', score: 78 },
      { hour: 19, minute: 0, reason: 'Dinner time scroll', score: 86 },
      { hour: 22, minute: 0, reason: 'Before bed browsing', score: 80 }
    ]
  }

  private static selectOptimalTime(
    availableTimes: Array<{ hour: number; minute: number; reason: string; score: number }>,
    date: Date,
    scheduledDates: Set<string>,
    contentType: string,
    historicalData: any
  ) {
    // Sort by score and pick the best available time
    const sorted = [...availableTimes].sort((a, b) => b.score - a.score)
    
    for (const time of sorted) {
      const testDate = setMinutes(setHours(date, time.hour), time.minute)
      const dateKey = format(testDate, 'yyyy-MM-dd-HH:mm')
      
      if (!scheduledDates.has(dateKey)) {
        return time
      }
    }
    
    // If all optimal times are taken, return a random time
    return {
      hour: 10 + Math.floor(Math.random() * 10),
      minute: Math.random() > 0.5 ? 0 : 30,
      reason: 'Alternative time slot',
      score: 70
    }
  }

  private static async getUserEngagementHistory(timezone: string) {
    // In production, fetch from analytics database
    return {
      bestDays: [2, 3, 4], // Tuesday, Wednesday, Thursday
      bestHours: [9, 12, 17, 20],
      avgEngagementByHour: new Map([
        [9, 0.85],
        [12, 0.90],
        [17, 0.95],
        [20, 0.88]
      ])
    }
  }

  private static async predictEngagement(
    content: StagedContent,
    scheduledDate: Date,
    historicalData: any
  ): Promise<ScheduledContent['engagementPrediction']> {
    const hour = scheduledDate.getHours()
    const dayOfWeek = scheduledDate.getDay()
    
    let score = 70 // Base score
    
    // Historical performance adjustment
    const historicalScore = historicalData.avgEngagementByHour.get(hour)
    if (historicalScore) {
      score = Math.round(historicalScore * 100)
    }
    
    // Time-based adjustments
    if (hour >= 8 && hour <= 10) score += 10
    else if (hour >= 17 && hour <= 19) score += 15
    else if (hour >= 20 && hour <= 22) score += 5
    else if (hour < 6 || hour > 23) score -= 25
    
    // Day-based adjustments
    if (historicalData.bestDays.includes(dayOfWeek)) score += 10
    if (dayOfWeek === 0 || dayOfWeek === 6) score -= 15 // Weekends
    
    // Content type adjustments
    const contentBoosts = {
      clip: 15, // Videos perform well
      carousel: 20, // Carousels have high engagement
      image: 10,
      blog: 5
    }
    score += contentBoosts[content.type] || 0
    
    // Platform-specific adjustments
    if (content.platforms.includes('instagram') && hour >= 17 && hour <= 19) score += 5
    if (content.platforms.includes('linkedin') && dayOfWeek >= 1 && dayOfWeek <= 5) score += 5
    
    // Ensure score is within bounds
    score = Math.min(100, Math.max(0, score))
    
    return {
      score,
      bestTime: score >= 85,
      reasoning: this.getEngagementReasoning(score, hour, dayOfWeek, content.type)
    }
  }

  private static getEngagementReasoning(
    score: number,
    hour: number,
    dayOfWeek: number,
    contentType: string
  ): string {
    const timeOfDay = 
      hour < 12 ? 'morning' :
      hour < 17 ? 'afternoon' :
      hour < 20 ? 'evening' : 'night'
    
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
    
    if (score >= 85) {
      return `Excellent ${timeOfDay} slot on ${dayName} for ${contentType} content. Peak audience activity expected.`
    } else if (score >= 70) {
      return `Good ${timeOfDay} posting time. ${dayName}s typically see moderate engagement for ${contentType}.`
    } else if (score >= 50) {
      return `Average engagement expected. Consider moving to peak hours for better ${contentType} performance.`
    } else {
      return `Low engagement time. ${dayName} ${timeOfDay} is not ideal for ${contentType} content.`
    }
  }

  private static async getSuggestedHashtags(
    content: StagedContent,
    scheduledDate: Date
  ): Promise<string[]> {
    // Get existing hashtags from platform content
    const existingHashtags = new Set<string>()
    
    Object.values(content.platformContent).forEach(platformData => {
      platformData?.hashtags?.forEach(tag => existingHashtags.add(tag.toLowerCase()))
    })
    
    // Add trending hashtags for the scheduled date
    const trendingHashtags = await this.getTrendingHashtags(
      content.platforms,
      scheduledDate
    )
    
    // Add content-type specific hashtags
    const typeHashtags = {
      clip: ['video', 'reels', 'shorts', 'videocontent'],
      blog: ['blog', 'article', 'reading', 'content'],
      image: ['photography', 'visual', 'photooftheday'],
      carousel: ['carousel', 'swipe', 'gallery', 'slides']
    }
    
    // Combine all hashtags and remove duplicates
    const allHashtags = [
      ...Array.from(existingHashtags),
      ...trendingHashtags,
      ...(typeHashtags[content.type] || [])
    ]
    
    // Remove duplicates and limit
    const uniqueHashtags = [...new Set(allHashtags.map(tag => tag.toLowerCase()))]
    
    // Prioritize by relevance (in production, use ML model)
    return uniqueHashtags.slice(0, 15)
  }

  private static async getTrendingHashtags(
    platforms: Platform[],
    date: Date
  ): Promise<string[]> {
    // In production, fetch from trending API
    const dayOfWeek = date.getDay()
    
    const weekdayHashtags = [
      'MondayMotivation',
      'TuesdayThoughts',
      'WednesdayWisdom',
      'ThursdayThoughts',
      'FridayFeeling',
      'SaturdayVibes',
      'SundayFunday'
    ]
    
    const trending = [
      weekdayHashtags[dayOfWeek],
      'Trending',
      'Viral',
      '2024'
    ]
    
    return trending.filter(Boolean)
  }

  static async publishScheduledContent(
    userId: string,
    projectId: string,
    scheduledPosts: ScheduledContent[]
  ): Promise<void> {
    const supabase = createSupabaseBrowserClient()
    
    try {
      // Get user's social integrations
      const { data: integrations, error: intError } = await supabase
        .from('social_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('disabled', false)
      
      if (intError) throw intError
      
      // Group integrations by platform
      const integrationsByPlatform = (integrations || []).reduce((acc: Record<string, any>, int: any) => {
        acc[int.platform] = int
        return acc
      }, {} as Record<string, any>)
      
      // Prepare posts for database insertion
      const postsToInsert = []
      
      for (const scheduled of scheduledPosts) {
        // Create a post for each platform
        for (const platform of scheduled.platforms) {
          const integration = integrationsByPlatform[platform]
          const platformData = scheduled.stagedContent.platformContent[platform]
          
          if (!platformData) continue
          
          const post = {
            user_id: userId,
            integration_id: integration?.id,
            content: platformData.caption || '',
            media_urls: scheduled.stagedContent.mediaUrls,
            publish_date: scheduled.scheduledDate.toISOString(),
            state: 'scheduled' as const,
            hashtags: platformData.hashtags,
            project_id: projectId,
            metadata: {
              type: scheduled.stagedContent.type,
              thumbnail: scheduled.stagedContent.thumbnailUrl,
              duration: scheduled.stagedContent.duration,
              platform,
              originalContentId: scheduled.stagedContent.id,
              engagementPrediction: scheduled.engagementPrediction,
              optimizationReason: scheduled.optimizationReason,
              cta: platformData.cta,
              link: platformData.link,
              altText: platformData.altText
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          postsToInsert.push(post)
        }
      }
      
      // Batch insert all posts
      if (postsToInsert.length > 0) {
        const { error } = await supabase
          .from('social_posts')
          .insert(postsToInsert)
        
        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error inserting posts:', error)
          }
          throw error
        }
      }
      
      // Update project status
      await supabase
        .from('projects')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error publishing scheduled content:', error)
      }
      throw error
    }
  }
} 