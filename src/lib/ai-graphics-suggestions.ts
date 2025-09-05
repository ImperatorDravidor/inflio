import { PLATFORM_SPECS } from './social-graphics-config'

export interface GraphicsSuggestion {
  id: string
  platform: string
  type: 'quote' | 'statistic' | 'tip' | 'announcement' | 'story' | 'carousel' | 'thumbnail'
  title: string
  description: string
  prompt: string
  size: string
  style: 'photorealistic' | 'illustration' | 'minimal' | 'bold' | 'gradient'
  priority: 'high' | 'medium' | 'low'
  contentElements: {
    text?: string
    keywords: string[]
    tone: string
    visualStyle: string
  }
  estimatedEngagement: number
  bestTimeToPost?: string
}

export interface PlatformContentPlan {
  platform: string
  graphics: GraphicsSuggestion[]
  strategy: string
  totalGraphics: number
}

export class AIGraphicsSuggestionsService {
  static async generateContentPlan(
    contentAnalysis: any,
    transcription: any,
    projectTitle: string,
    targetPlatforms: string[] = ['instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']
  ): Promise<PlatformContentPlan[]> {
    const plans: PlatformContentPlan[] = []
    
    // Extract key insights from content
    const insights = this.extractKeyInsights(contentAnalysis, transcription)
    
    for (const platform of targetPlatforms) {
      const platformPlan = await this.generatePlatformSpecificContent(
        platform,
        insights,
        projectTitle,
        contentAnalysis
      )
      plans.push(platformPlan)
    }
    
    return plans
  }

  private static extractKeyInsights(contentAnalysis: any, transcription: any) {
    const insights = {
      mainTopic: contentAnalysis.summary?.split('.')[0] || '',
      keyPoints: [] as any[],
      quotableLines: [] as any[],
      statistics: [] as any[],
      actionableAdvice: [] as any[],
      emotionalHooks: [] as any[],
      keywords: contentAnalysis.keywords || []
    }

    // Extract quotable lines from transcription
    if (transcription?.segments) {
      const segments = transcription.segments
      
      // Find impactful sentences (those with strong sentiment or key concepts)
      segments.forEach((segment: any) => {
        const text = segment.text.trim()
        
        // Look for quotable patterns
        if (
          text.length > 20 && 
          text.length < 150 && 
          (text.includes('!') || text.includes('?') || 
           text.match(/^(The key|Remember|Always|Never|Success|The secret)/i))
        ) {
          insights.quotableLines.push({
            text,
            timestamp: segment.start,
            score: this.calculateQuotabilityScore(text)
          })
        }
        
        // Look for statistics or numbers
        if (text.match(/\d+%|\d+ out of \d+|\$\d+|#\d+/)) {
          insights.statistics.push({
            text,
            timestamp: segment.start
          })
        }
        
        // Look for actionable advice
        if (text.match(/^(Step \d+|First|Second|Third|You should|You need to|Start by|Try)/i)) {
          insights.actionableAdvice.push({
            text,
            timestamp: segment.start
          })
        }
      })
    }

    // Extract key points from content analysis
    if (contentAnalysis.keyMoments) {
      insights.keyPoints = contentAnalysis.keyMoments.map((moment: any) => ({
        text: moment.description,
        timestamp: moment.timestamp
      }))
    }

    // Extract emotional hooks
    if (contentAnalysis.contentSuggestions?.socialMediaHooks) {
      insights.emotionalHooks = contentAnalysis.contentSuggestions.socialMediaHooks
    }

    // Sort quotes by score
    insights.quotableLines.sort((a: any, b: any) => b.score - a.score)
    
    return insights
  }

  private static calculateQuotabilityScore(text: string): number {
    let score = 0
    
    // Emotional words
    const emotionalWords = ['amazing', 'incredible', 'powerful', 'transform', 'success', 'failure', 'love', 'hate', 'brilliant', 'stupid']
    emotionalWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 10
    })
    
    // Questions are engaging
    if (text.includes('?')) score += 15
    
    // Short and punchy
    if (text.length < 60) score += 10
    
    // Contains numbers/statistics
    if (text.match(/\d+/)) score += 5
    
    // Strong statements
    if (text.match(/^(Always|Never|The only|The best|The worst)/i)) score += 10
    
    return score
  }

  private static async generatePlatformSpecificContent(
    platform: string,
    insights: any,
    projectTitle: string,
    contentAnalysis: any
  ): Promise<PlatformContentPlan> {
    const suggestions: GraphicsSuggestion[] = []
    const platformSpec = PLATFORM_SPECS[platform]
    
    switch (platform) {
      case 'instagram':
        suggestions.push(...this.generateInstagramContent(insights, projectTitle, contentAnalysis))
        break
      case 'twitter':
        suggestions.push(...this.generateTwitterContent(insights, projectTitle, contentAnalysis))
        break
      case 'linkedin':
        suggestions.push(...this.generateLinkedInContent(insights, projectTitle, contentAnalysis))
        break
      case 'youtube':
        suggestions.push(...this.generateYouTubeContent(insights, projectTitle, contentAnalysis))
        break
      case 'tiktok':
        suggestions.push(...this.generateTikTokContent(insights, projectTitle, contentAnalysis))
        break
    }
    
    return {
      platform,
      graphics: suggestions,
      strategy: this.generatePlatformStrategy(platform, insights),
      totalGraphics: suggestions.length
    }
  }

  private static generateInstagramContent(insights: any, projectTitle: string, contentAnalysis: any): GraphicsSuggestion[] {
    const suggestions: GraphicsSuggestion[] = []
    
    // 1. Quote Carousel (High Priority)
    if (insights.quotableLines.length >= 3) {
      suggestions.push({
        id: `ig-carousel-quotes`,
        platform: 'instagram',
        type: 'carousel',
        title: 'Inspirational Quotes Carousel',
        description: 'Multi-slide carousel featuring the best quotes from your video',
        prompt: `Create a cohesive Instagram carousel design with 5 slides. Each slide should feature one powerful quote on a gradient background with modern typography. Use consistent branding and visual flow between slides. Professional and engaging design.`,
        size: '1080x1080',
        style: 'gradient',
        priority: 'high',
        contentElements: {
          text: insights.quotableLines.slice(0, 5).map((q: any) => q.text).join('\n\n'),
          keywords: contentAnalysis.keywords,
          tone: contentAnalysis.sentiment || 'professional',
          visualStyle: 'modern, clean, inspirational'
        },
        estimatedEngagement: 85,
        bestTimeToPost: '9 AM or 7 PM'
      })
    }
    
    // 2. Key Statistics Post
    if (insights.statistics.length > 0) {
      suggestions.push({
        id: `ig-stats-infographic`,
        platform: 'instagram',
        type: 'statistic',
        title: 'Key Statistics Infographic',
        description: 'Eye-catching infographic highlighting important numbers',
        prompt: `Design a visually striking Instagram post featuring key statistics. Use data visualization, icons, and bold typography. Include "${insights.statistics[0]?.text}". Modern infographic style with brand colors.`,
        size: '1080x1080',
        style: 'bold',
        priority: 'high',
        contentElements: {
          text: insights.statistics[0]?.text,
          keywords: ['data', 'insights', ...contentAnalysis.keywords],
          tone: 'authoritative',
          visualStyle: 'infographic, data-driven, professional'
        },
        estimatedEngagement: 78,
        bestTimeToPost: '12 PM'
      })
    }
    
    // 3. Tips & Tricks Post
    if (insights.actionableAdvice.length > 0) {
      suggestions.push({
        id: `ig-tips-post`,
        platform: 'instagram',
        type: 'tip',
        title: 'Actionable Tips Post',
        description: 'Practical advice in an easy-to-digest format',
        prompt: `Create an Instagram post with actionable tips. Use numbered list format with icons. Clean, minimal design with plenty of white space. Feature: "${insights.actionableAdvice[0]?.text}"`,
        size: '1080x1350',
        style: 'minimal',
        priority: 'medium',
        contentElements: {
          text: insights.actionableAdvice.slice(0, 3).map((a: any) => a.text).join('\n'),
          keywords: ['tips', 'advice', ...contentAnalysis.keywords],
          tone: 'helpful',
          visualStyle: 'clean, organized, educational'
        },
        estimatedEngagement: 72,
        bestTimeToPost: '2 PM'
      })
    }
    
    // 4. Story Highlights Cover
    suggestions.push({
      id: `ig-story-highlight`,
      platform: 'instagram',
      type: 'story',
      title: 'Story Highlight Cover',
      description: 'Branded cover for Instagram story highlights',
      prompt: `Design a minimalist Instagram story highlight cover icon. Topic: "${projectTitle}". Use simple iconography and brand colors. Clean, professional look that stands out.`,
      size: '1080x1920',
      style: 'minimal',
      priority: 'low',
      contentElements: {
        text: projectTitle,
        keywords: contentAnalysis.keywords.slice(0, 2),
        tone: 'professional',
        visualStyle: 'iconic, minimal, branded'
      },
      estimatedEngagement: 65,
      bestTimeToPost: 'Anytime'
    })
    
    return suggestions
  }

  private static generateTwitterContent(insights: any, projectTitle: string, contentAnalysis: any): GraphicsSuggestion[] {
    const suggestions: GraphicsSuggestion[] = []
    
    // 1. Thread Header Image
    suggestions.push({
      id: `twitter-thread-header`,
      platform: 'twitter',
      type: 'announcement',
      title: 'Twitter Thread Header',
      description: 'Eye-catching header for your Twitter thread',
      prompt: `Create a Twitter thread header image. Bold title: "${projectTitle}". Include "THREAD 🧵" text. Modern, attention-grabbing design with high contrast. Professional yet engaging.`,
      size: '1200x675',
      style: 'bold',
      priority: 'high',
      contentElements: {
        text: `${projectTitle} - THREAD`,
        keywords: contentAnalysis.keywords,
        tone: 'engaging',
        visualStyle: 'bold, modern, Twitter-optimized'
      },
      estimatedEngagement: 82,
      bestTimeToPost: '10 AM or 5 PM'
    })
    
    // 2. Quote Card
    if (insights.quotableLines.length > 0) {
      suggestions.push({
        id: `twitter-quote-card`,
        platform: 'twitter',
        type: 'quote',
        title: 'Shareable Quote Card',
        description: 'Tweetable quote designed for maximum shares',
        prompt: `Design a Twitter quote card featuring: "${insights.quotableLines[0]?.text}". Use large, readable typography. Include subtle Twitter branding. High contrast for mobile viewing.`,
        size: '1200x675',
        style: 'minimal',
        priority: 'high',
        contentElements: {
          text: insights.quotableLines[0]?.text,
          keywords: ['quote', ...contentAnalysis.keywords],
          tone: contentAnalysis.sentiment,
          visualStyle: 'clean, shareable, Twitter-native'
        },
        estimatedEngagement: 88,
        bestTimeToPost: '1 PM'
      })
    }
    
    return suggestions
  }

  private static generateLinkedInContent(insights: any, projectTitle: string, contentAnalysis: any): GraphicsSuggestion[] {
    const suggestions: GraphicsSuggestion[] = []
    
    // 1. Professional Insights Post
    suggestions.push({
      id: `linkedin-insights`,
      platform: 'linkedin',
      type: 'statistic',
      title: 'Professional Insights Graphic',
      description: 'Data-driven insights for LinkedIn professionals',
      prompt: `Create a professional LinkedIn graphic about "${projectTitle}". Include key insights and data points. Corporate design with charts or graphs. Authoritative and trustworthy appearance.`,
      size: '1200x628',
      style: 'photorealistic',
      priority: 'high',
      contentElements: {
        text: insights.keyPoints[0]?.text || insights.mainTopic,
        keywords: ['professional', 'insights', ...contentAnalysis.keywords],
        tone: 'professional',
        visualStyle: 'corporate, data-driven, polished'
      },
      estimatedEngagement: 75,
      bestTimeToPost: '8 AM Tuesday-Thursday'
    })
    
    // 2. Thought Leadership Carousel
    if (insights.keyPoints.length >= 3) {
      suggestions.push({
        id: `linkedin-carousel`,
        platform: 'linkedin',
        type: 'carousel',
        title: 'Thought Leadership Carousel',
        description: 'Multi-slide presentation of key insights',
        prompt: `Design a professional LinkedIn carousel (PDF style) with 5-7 slides. Topic: "${projectTitle}". Include title slide, key points, and call-to-action. Corporate design with consistent branding.`,
        size: '1200x1200',
        style: 'minimal',
        priority: 'medium',
        contentElements: {
          text: insights.keyPoints.map((p: any) => p.text).join('\n\n'),
          keywords: contentAnalysis.keywords,
          tone: 'authoritative',
          visualStyle: 'professional, presentation-style, clean'
        },
        estimatedEngagement: 80,
        bestTimeToPost: '10 AM Wednesday'
      })
    }
    
    return suggestions
  }

  private static generateYouTubeContent(insights: any, projectTitle: string, contentAnalysis: any): GraphicsSuggestion[] {
    const suggestions: GraphicsSuggestion[] = []
    
    // 1. Video Thumbnail
    suggestions.push({
      id: `youtube-thumbnail`,
      platform: 'youtube',
      type: 'thumbnail',
      title: 'YouTube Video Thumbnail',
      description: 'Click-worthy thumbnail for maximum CTR',
      prompt: `Create a YouTube thumbnail for "${projectTitle}". Use bold text overlay, high contrast, and emotional facial expression or eye-catching visual. Include curiosity gap. Professional but attention-grabbing.`,
      size: '1280x720',
      style: 'photorealistic',
      priority: 'high',
      contentElements: {
        text: projectTitle,
        keywords: contentAnalysis.keywords,
        tone: 'exciting',
        visualStyle: 'YouTube-optimized, high CTR, bold'
      },
      estimatedEngagement: 90,
      bestTimeToPost: '2 PM EST'
    })
    
    // 2. Community Post
    suggestions.push({
      id: `youtube-community`,
      platform: 'youtube',
      type: 'announcement',
      title: 'YouTube Community Post',
      description: 'Engage your subscribers with a community update',
      prompt: `Design a YouTube community post graphic announcing new video: "${projectTitle}". Include play button overlay, channel branding, and engaging text. Mobile-optimized design.`,
      size: '1280x720',
      style: 'bold',
      priority: 'medium',
      contentElements: {
        text: `New Video: ${projectTitle}`,
        keywords: ['youtube', 'video', ...contentAnalysis.keywords],
        tone: 'enthusiastic',
        visualStyle: 'YouTube-native, community-focused, engaging'
      },
      estimatedEngagement: 70,
      bestTimeToPost: 'Same time as video'
    })
    
    return suggestions
  }

  private static generateTikTokContent(insights: any, projectTitle: string, contentAnalysis: any): GraphicsSuggestion[] {
    const suggestions: GraphicsSuggestion[] = []
    
    // 1. Video Cover
    suggestions.push({
      id: `tiktok-cover`,
      platform: 'tiktok',
      type: 'thumbnail',
      title: 'TikTok Video Cover',
      description: 'Scroll-stopping cover for your TikTok',
      prompt: `Create a TikTok video cover frame. Bold, trendy design with "${projectTitle}". Use Gen-Z aesthetic, bright colors, and dynamic text. Mobile-first vertical design.`,
      size: '1080x1920',
      style: 'bold',
      priority: 'high',
      contentElements: {
        text: projectTitle,
        keywords: ['trending', ...contentAnalysis.keywords],
        tone: 'energetic',
        visualStyle: 'TikTok-native, trendy, youthful'
      },
      estimatedEngagement: 85,
      bestTimeToPost: '6-10 PM'
    })
    
    return suggestions
  }

  private static generatePlatformStrategy(platform: string, insights: any): string {
    const strategies: Record<string, string> = {
      instagram: `Focus on visual storytelling with carousels and infographics. Best times: 9 AM, 12 PM, 7 PM. Use 5-10 relevant hashtags. Engage with comments in first hour.`,
      twitter: `Lead with strong hooks and threads. Post at 10 AM or 5 PM for maximum engagement. Use 1-2 hashtags max. Include calls-to-action for retweets.`,
      linkedin: `Share professional insights and data-driven content. Post Tuesday-Thursday 8-10 AM. Write detailed captions. Tag relevant professionals.`,
      youtube: `Optimize thumbnail for CTR with faces, emotions, and curiosity gaps. Post at 2 PM EST. Use cards and end screens.`,
      tiktok: `Create native-feeling content with trending audio. Post 6-10 PM. Use 3-5 trending hashtags. Engage quickly with comments.`
    }
    
    return strategies[platform] || 'Create platform-optimized content for maximum engagement.'
  }

  static async generateBulkGraphics(
    suggestions: GraphicsSuggestion[],
    projectId: string,
    personaPhotos?: string[],
    personaName?: string
  ): Promise<any[]> {
    const generatedGraphics = []
    
    for (const suggestion of suggestions) {
      try {
        const response = await fetch('/api/generate-social-graphics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            prompt: suggestion.prompt,
            platform: suggestion.platform,
            size: suggestion.size,
            template: suggestion.type,
            quality: 'high',
            personalPhotos: personaPhotos || [],
            personaName: personaName,
            style: suggestion.style,
            customText: suggestion.contentElements.text,
            metadata: {
              suggestionId: suggestion.id,
              priority: suggestion.priority,
              estimatedEngagement: suggestion.estimatedEngagement
            }
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          generatedGraphics.push(...result.graphics)
        }
      } catch (error) {
        console.error(`Failed to generate graphic for ${suggestion.id}:`, error)
      }
    }
    
    return generatedGraphics
  }
} 