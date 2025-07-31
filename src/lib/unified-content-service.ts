import { ContentAnalysis } from './ai-content-service'
import { getOpenAI } from './openai'
import { Project } from './project-types'

export interface UnifiedContentOptions {
  projectId: string
  contentType: 'thumbnail' | 'social' | 'blog' | 'all'
  usePersona?: boolean
  personaId?: string
  personaPhotos?: string[]
  useVideoSnippets?: boolean
  videoSnippets?: VideoSnippet[]
  style?: string
  platform?: string
  customPrompt?: string
}

export interface VideoSnippet {
  id: string
  timestamp: number
  thumbnailUrl: string
  selected?: boolean
  description?: string
}

export interface ContentPersona {
  id: string
  name: string
  description: string
  photos: Array<{
    id: string
    url: string
    name: string
  }>
  style: string
  promptTemplate: string
  keywords: string[]
}

export interface UnifiedContentSuggestion {
  id: string
  type: 'thumbnail' | 'social' | 'blog'
  prompt: string
  enhancedPrompt: string
  style: string
  platform?: string
  usePersona: boolean
  useVideoSnippets: boolean
  relevanceScore: number
  preview?: string
  metadata?: any
}

export class UnifiedContentService {
  /**
   * Generate AI suggestions for all content types based on video analysis
   */
  static async generateUnifiedSuggestions(
    project: Project,
    options: Partial<UnifiedContentOptions> = {}
  ): Promise<UnifiedContentSuggestion[]> {
    try {
      const contentAnalysis = project.content_analysis
      if (!contentAnalysis) {
        throw new Error('Content analysis not available')
      }

      const openai = getOpenAI()
      
      const systemPrompt = `You are a master content strategist specializing in creating cohesive, high-converting content across all platforms.
You understand how to create content that works together - thumbnails that match social graphics, blog posts that reference video moments, and social posts that drive traffic.

Your goal is to create a unified content strategy where every piece reinforces the others.`

      const userPrompt = `Create a comprehensive content package for this video:

**VIDEO DETAILS:**
Title: "${project.title}"
Summary: ${contentAnalysis.summary}
Topics: ${contentAnalysis.topics.join(', ')}
Keywords: ${contentAnalysis.keywords.join(', ')}
Sentiment: ${contentAnalysis.sentiment}

**KEY MOMENTS:**
${contentAnalysis.keyMoments.map((m, i) => `${i+1}. [${m.timestamp}s] ${m.description}`).join('\n')}

Generate unified content suggestions that work together:

1. **THUMBNAIL OPTIONS** (3 variations)
   - Hero thumbnail with persona
   - Text-heavy thumbnail
   - Visual concept thumbnail

2. **SOCIAL GRAPHICS** (5 types)
   - Instagram carousel (3 slides)
   - LinkedIn infographic
   - Twitter/X hook image
   - Instagram quote card
   - Facebook cover image

3. **BLOG ENHANCEMENTS**
   - Featured image
   - In-article infographics (2-3)
   - Social share images

For each suggestion include:
- Detailed prompt for AI generation
- Whether to use persona photos
- Whether to incorporate video snippets
- Recommended style and platform
- How it connects to other content pieces

Return as JSON array of suggestions with all details.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from AI')
      }

      const { suggestions } = JSON.parse(response)
      
      return this.enhanceSuggestions(suggestions, project, options)
    } catch (error) {
      console.error('Error generating unified suggestions:', error)
      return this.generateFallbackSuggestions(project)
    }
  }

  /**
   * Enhance suggestions with platform-specific optimizations
   */
  private static enhanceSuggestions(
    suggestions: any[],
    project: Project,
    options: Partial<UnifiedContentOptions>
  ): UnifiedContentSuggestion[] {
    return suggestions.map((suggestion, index) => {
      const enhanced = this.enhancePromptForPlatform(
        suggestion.prompt,
        suggestion.platform || 'general',
        project
      )

      return {
        id: `unified-${Date.now()}-${index}`,
        type: suggestion.type || 'social',
        prompt: suggestion.prompt,
        enhancedPrompt: enhanced,
        style: suggestion.style || options.style || 'modern',
        platform: suggestion.platform,
        usePersona: suggestion.usePersona || false,
        useVideoSnippets: suggestion.useVideoSnippets || false,
        relevanceScore: suggestion.relevanceScore || 8,
        preview: suggestion.preview,
        metadata: {
          ...suggestion.metadata,
          projectContext: {
            title: project.title,
            topics: project.content_analysis?.topics,
            keywords: project.content_analysis?.keywords
          }
        }
      }
    })
  }

  /**
   * Enhance prompt based on platform requirements
   */
  private static enhancePromptForPlatform(
    basePrompt: string,
    platform: string,
    project: Project
  ): string {
    const contentAnalysis = project.content_analysis || {} as any
    const sentiment = contentAnalysis.sentiment || 'neutral'
    
    let enhanced = basePrompt

    // Add video context
    if (contentAnalysis.topics?.length > 0) {
      enhanced += ` Related to ${contentAnalysis.topics[0]}.`
    }

    // Platform-specific enhancements
    switch (platform) {
      case 'youtube':
        enhanced += ' YouTube thumbnail optimized: 1280x720, high CTR design, bold text, emotional expression, bright colors.'
        break
      case 'instagram':
        enhanced += ' Instagram optimized: 1080x1080 square, vibrant aesthetic, mobile-first design, scroll-stopping visual.'
        break
      case 'linkedin':
        enhanced += ' LinkedIn professional: corporate aesthetic, trustworthy design, data visualization, business context.'
        break
      case 'twitter':
      case 'x':
        enhanced += ' Twitter/X optimized: eye-catching, works at small size, high contrast, shareable design.'
        break
      case 'facebook':
        enhanced += ' Facebook optimized: 1200x630, engaging visual, community-focused, emotional connection.'
        break
      case 'blog':
        enhanced += ' Blog featured image: 1200x800, professional quality, represents article theme, SEO-friendly.'
        break
    }

    // Sentiment-based styling
    if (sentiment === 'positive') {
      enhanced += ' Bright, uplifting mood with warm colors.'
    } else if (sentiment === 'negative') {
      enhanced += ' Serious, impactful design with strong contrast.'
    }

    // Always add quality markers
    enhanced += ' Ultra high quality, professional design, sharp details.'

    return enhanced
  }

  /**
   * Generate fallback suggestions if AI fails
   */
  private static generateFallbackSuggestions(project: Project): UnifiedContentSuggestion[] {
    const title = project.title || 'Content'
    const topic = project.content_analysis?.topics[0] || 'main topic'
    
    return [
      // Thumbnails
      {
        id: `fallback-thumb-1`,
        type: 'thumbnail',
        prompt: `YouTube thumbnail for "${title}" - split design with text and visual`,
        enhancedPrompt: `YouTube thumbnail featuring bold text "${title.substring(0, 30)}..." on left side, relevant visual representation of ${topic} on right, high contrast, 1280x720`,
        style: 'modern',
        platform: 'youtube',
        usePersona: true,
        useVideoSnippets: false,
        relevanceScore: 8
      },
      {
        id: `fallback-thumb-2`,
        type: 'thumbnail',
        prompt: `Emotional reaction thumbnail for "${title}"`,
        enhancedPrompt: `Close-up face showing surprised/excited expression about ${topic}, large text overlay, bright background, YouTube optimized`,
        style: 'vibrant',
        platform: 'youtube',
        usePersona: true,
        useVideoSnippets: true,
        relevanceScore: 9
      },
      
      // Social Graphics
      {
        id: `fallback-social-1`,
        type: 'social',
        prompt: `Instagram carousel about ${topic}`,
        enhancedPrompt: `3-slide educational carousel: Slide 1 - Hook question about ${topic}, Slide 2 - Key insights, Slide 3 - Call to action, consistent branding`,
        style: 'modern',
        platform: 'instagram',
        usePersona: false,
        useVideoSnippets: false,
        relevanceScore: 8
      },
      {
        id: `fallback-social-2`,
        type: 'social',
        prompt: `LinkedIn infographic for ${topic}`,
        enhancedPrompt: `Professional infographic visualizing key data about ${topic}, corporate colors, clean layout, shareable design`,
        style: 'corporate',
        platform: 'linkedin',
        usePersona: false,
        useVideoSnippets: false,
        relevanceScore: 7
      },
      
      // Blog Images
      {
        id: `fallback-blog-1`,
        type: 'blog',
        prompt: `Featured image for blog post about ${topic}`,
        enhancedPrompt: `Hero image representing ${topic} concept, 1200x800, professional photography style, text overlay space`,
        style: 'professional',
        platform: 'blog',
        usePersona: false,
        useVideoSnippets: true,
        relevanceScore: 8
      }
    ]
  }

  /**
   * Apply persona to content generation
   */
  static applyPersonaToPrompt(
    basePrompt: string,
    persona: ContentPersona,
    contentType: 'thumbnail' | 'social' | 'blog'
  ): string {
    let enhancedPrompt = basePrompt

    if (contentType === 'thumbnail') {
      enhancedPrompt = `${basePrompt} Featuring ${persona.name} with professional appearance from reference photos, ${persona.promptTemplate}`
    } else if (contentType === 'social') {
      enhancedPrompt = `${basePrompt} Incorporate ${persona.name}'s personal brand style: ${persona.description}`
    }

    return enhancedPrompt
  }

  /**
   * Merge video snippets into prompt
   */
  static mergeVideoSnippetsIntoPrompt(
    basePrompt: string,
    snippets: VideoSnippet[],
    contentType: 'thumbnail' | 'social' | 'blog'
  ): string {
    const selectedSnippets = snippets.filter(s => s.selected)
    if (selectedSnippets.length === 0) return basePrompt

    let enhancedPrompt = basePrompt

    if (contentType === 'thumbnail') {
      enhancedPrompt += ` Background incorporates key video moments from timestamps ${selectedSnippets.map(s => s.timestamp).join(', ')}.`
    } else if (contentType === 'social') {
      enhancedPrompt += ` Visual elements from video at ${selectedSnippets[0].timestamp}s.`
    } else if (contentType === 'blog') {
      enhancedPrompt += ` Screenshot from video showing key moment at ${selectedSnippets[0].timestamp}s.`
    }

    return enhancedPrompt
  }

  /**
   * Generate content package - all content types at once
   */
  static async generateContentPackage(
    project: Project,
    options: UnifiedContentOptions
  ): Promise<{
    thumbnail?: any
    socialGraphics?: any[]
    blogEnhancements?: any
  }> {
    const suggestions = await this.generateUnifiedSuggestions(project, options)
    
    const results: any = {}

    // Generate thumbnail
    const thumbnailSuggestion = suggestions.find(s => s.type === 'thumbnail')
    if (thumbnailSuggestion) {
      // Implementation would call thumbnail generation API
      results.thumbnail = thumbnailSuggestion
    }

    // Generate social graphics
    const socialSuggestions = suggestions.filter(s => s.type === 'social')
    if (socialSuggestions.length > 0) {
      // Implementation would call social graphics API
      results.socialGraphics = socialSuggestions
    }

    // Generate blog enhancements
    const blogSuggestions = suggestions.filter(s => s.type === 'blog')
    if (blogSuggestions.length > 0) {
      // Implementation would call blog enhancement API
      results.blogEnhancements = blogSuggestions
    }

    return results
  }
} 