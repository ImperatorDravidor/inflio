import { getOpenAI } from '@/lib/openai'

export interface ContentInsight {
  type: 'hook' | 'story' | 'lesson' | 'statistic' | 'quote' | 'controversy' | 'transformation'
  content: string
  impact: 'viral' | 'high' | 'medium' | 'low'
  emotionalTrigger: string
  audience: string[]
  platforms: string[]
  visualStyle: string
  timestamp?: number
}

export interface SocialPost {
  id: string
  platform: string
  type: 'single' | 'carousel' | 'story' | 'reel' | 'thread'
  headline: string
  caption: string
  hashtags: string[]
  visualPrompt: string
  visualStyle: string
  cta: string
  bestTime: string
  estimatedReach: number
  estimatedEngagement: number
  contentPillars: string[]
  graphics?: {
    url?: string
    prompt: string
    size: string
    style: string
  }[]
}

export interface ContentCampaign {
  id: string
  title: string
  objective: string
  duration: string
  totalPosts: number
  platforms: {
    platform: string
    posts: SocialPost[]
    strategy: string
    kpis: {
      reach: number
      engagement: number
      conversions: number
    }
  }[]
  contentCalendar: {
    date: string
    posts: SocialPost[]
  }[]
  themes: string[]
  voiceAndTone: string
}

export class AIContentIntelligence {
  static async extractDeepInsights(
    transcription: any,
    contentAnalysis: any,
    projectTitle: string
  ): Promise<ContentInsight[]> {
    const insights: ContentInsight[] = []
    
    if (!transcription?.segments) return insights
    
    const openai = getOpenAI()
    
    // Use GPT-4 to extract deep insights
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a world-class content strategist and viral marketing expert. Analyze this transcript and extract the most powerful, shareable moments that will resonate on social media. Look for:
          - Emotional hooks and stories
          - Surprising statistics or facts
          - Transformational moments
          - Controversial or thought-provoking statements
          - Actionable lessons
          - Memorable quotes
          - Pattern interrupts
          
          For each insight, determine its viral potential and the best platforms for it.`
        },
        {
          role: 'user',
          content: `Title: ${projectTitle}
          
          Transcript: ${transcription.segments.map((s: any) => s.text).join(' ')}
          
          Extract 10-15 powerful insights that would make amazing social media content. Format as JSON array with type, content, impact, emotionalTrigger, audience, platforms, and visualStyle.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    })
    
    const extracted = JSON.parse(response.choices[0].message.content || '{}')
    insights.push(...(extracted.insights || []))
    
    // Score and sort by impact
    return insights.sort((a, b) => {
      const impactScore = { viral: 4, high: 3, medium: 2, low: 1 }
      return impactScore[b.impact] - impactScore[a.impact]
    })
  }

  static async generateSmartCampaign(
    insights: ContentInsight[],
    projectTitle: string,
    contentAnalysis: any,
    targetPlatforms: string[] = ['instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']
  ): Promise<ContentCampaign> {
    const openai = getOpenAI()
    
    // Generate a comprehensive campaign
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a genius social media strategist who creates viral campaigns for top brands. Create a comprehensive, multi-platform campaign that maximizes the impact of the content. Consider:
          - Platform-specific best practices
          - Optimal posting times and frequency
          - Content pillars and themes
          - Audience psychology
          - Viral mechanics
          - Call-to-actions that convert
          - Visual storytelling
          
          Make it feel effortless for the user - they should feel like they hired a $10k/month agency.`
        },
        {
          role: 'user',
          content: `Create a complete social media campaign for the video: "${projectTitle}"
          
          Video Context: ${contentAnalysis?.summary || 'Educational/informative content'}
          
          Key Insights to use: ${JSON.stringify(insights.slice(0, 10))}
          
          Platforms: ${targetPlatforms.join(', ')}
          
          Generate a 2-week campaign where EVERY POST:
          1. Directly quotes or references the video content
          2. Includes "From our video: ${projectTitle}" or similar
          3. Has a clear CTA driving back to the full video
          4. Features text overlays with key quotes/stats
          
          Requirements:
          - 3-5 posts per platform
          - Mix of content types (quote cards, data visualizations, key takeaways)
          - Captions that start with hooks FROM THE VIDEO
          - Platform-specific hashtags
          - Visual descriptions that include TEXT TO DISPLAY
          - Optimal posting times
          - Realistic engagement metrics
          
          CRITICAL: Each post must clearly connect to the original video content.
          Format as JSON with complete campaign structure.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9
    })
    
    const campaign = JSON.parse(response.choices[0].message.content || '{}')
    
          // Add unique IDs and ensure content connection
      campaign.id = crypto.randomUUID()
      campaign.platforms?.forEach((p: any) => {
        p.posts?.forEach((post: any) => {
          post.id = crypto.randomUUID()
          // Ensure each post clearly references the original content
          if (!post.caption.toLowerCase().includes(projectTitle.toLowerCase()) && 
              !post.caption.includes('video') && 
              !post.caption.includes('watch')) {
            post.caption += `\n\n💡 ${post.contentPillars?.[0] || 'Insight'} from: "${projectTitle}"`
          }
        })
      })
      
      return campaign as ContentCampaign
  }

  static async generatePlatformOptimizedCopy(
    insight: ContentInsight,
    platform: string,
    originalContent: string,
    videoTitle: string,
    brand?: { voice?: string; values?: string[] }
  ): Promise<{
    headline: string
    caption: string
    hashtags: string[]
    cta: string
    contentConnection: string
  }> {
    const platformSpecs = {
      instagram: {
        captionLength: 2200,
        hashtagLimit: 30,
        style: 'visual storytelling, authentic, community-focused',
        bestPractices: 'Start with a hook, use line breaks, end with CTA'
      },
      twitter: {
        captionLength: 280,
        hashtagLimit: 2,
        style: 'punchy, conversational, news-worthy',
        bestPractices: 'Lead with the key point, use threads for depth'
      },
      linkedin: {
        captionLength: 3000,
        hashtagLimit: 5,
        style: 'professional, insightful, thought leadership',
        bestPractices: 'Start with a pattern interrupt, add value, encourage discussion'
      },
      youtube: {
        captionLength: 5000,
        hashtagLimit: 15,
        style: 'SEO-optimized, detailed, viewer-focused',
        bestPractices: 'Hook in first 15 words, include timestamps, optimize for search'
      },
      tiktok: {
        captionLength: 2200,
        hashtagLimit: 5,
        style: 'trendy, authentic, entertaining',
        bestPractices: 'Jump on trends, use sounds, be relatable'
      }
    }
    
    const spec = platformSpecs[platform as keyof typeof platformSpecs]
    const openai = getOpenAI()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a viral copywriter for ${platform}. Write copy that stops scrolling and drives engagement. Style: ${spec.style}. ${spec.bestPractices}`
        },
        {
          role: 'user',
          content: `Write ${platform} copy for this insight from the video "${videoTitle}":
          
          KEY INSIGHT: "${insight.content}"
          
          ORIGINAL CONTEXT: ${originalContent.substring(0, 300)}...
          
          Emotional trigger: ${insight.emotionalTrigger}
          Target audience: ${insight.audience.join(', ')}
          ${brand ? `Brand voice: ${brand.voice}` : ''}
          
          Create platform-specific copy that:
          1. Attention-grabbing headline (if applicable)
          2. Caption (max ${spec.captionLength} chars) that DIRECTLY REFERENCES the video content
          3. ${spec.hashtagLimit} relevant hashtags mixing popular and niche
          4. Clear CTA that drives viewers back to the full video
          5. A one-line connection showing how this relates to the main video
          
          IMPORTANT: The caption MUST clearly tie back to the original video content. Don't be generic.
          Make it feel native to ${platform} while maintaining clear connection to source material.`
        }
      ],
      temperature: 0.8
    })
    
    const result = response.choices[0].message.content || ''
    
    // Parse the response
    const lines = result.split('\n').filter(line => line.trim())
    const headline = lines.find(l => l.toLowerCase().includes('headline'))?.split(':')[1]?.trim() || ''
    const caption = lines.find(l => l.toLowerCase().includes('caption'))?.split(':').slice(1).join(':').trim() || result
    const hashtagLine = lines.find(l => l.toLowerCase().includes('hashtag'))?.split(':')[1]?.trim() || ''
    const hashtags = hashtagLine.match(/#\w+/g) || []
    const cta = lines.find(l => l.toLowerCase().includes('cta'))?.split(':')[1]?.trim() || 'Watch the full video'
    const contentConnection = lines.find(l => l.toLowerCase().includes('connection'))?.split(':')[1]?.trim() || 
      `From our video: "${videoTitle}"`
    
    return { headline, caption, hashtags, cta, contentConnection }
  }

  static async generateVisualConcepts(
    post: SocialPost,
    videoContent: string,
    keyInsight: string,
    personaPhotos?: string[]
  ): Promise<{
    primary: string
    alternatives: string[]
    textOverlay: string
    designSpecs: {
      platform: string
      dimensions: string
      textPlacement: string
      colorScheme: string
    }
  }> {
    // Platform-specific dimensions and best practices
    const platformSpecs = {
      instagram: {
        dimensions: '1080x1080',
        format: 'square social media post',
        textArea: 'center with padding',
        style: 'Instagram carousel slide with bold text overlay'
      },
      twitter: {
        dimensions: '1200x628',
        format: 'Twitter card',
        textArea: 'left-aligned with image on right',
        style: 'Twitter-optimized quote card'
      },
      linkedin: {
        dimensions: '1200x628',
        format: 'LinkedIn article preview',
        textArea: 'professional layout with headline',
        style: 'Professional LinkedIn post graphic'
      },
      youtube: {
        dimensions: '1280x720',
        format: 'YouTube thumbnail',
        textArea: 'bold text with high contrast',
        style: 'YouTube thumbnail with text overlay'
      },
      tiktok: {
        dimensions: '1080x1920',
        format: 'vertical video cover',
        textArea: 'top and bottom text areas',
        style: 'TikTok cover with trendy text'
      }
    }
    
    const spec = platformSpecs[post.platform as keyof typeof platformSpecs]
    const openai = getOpenAI()
    
    // Extract the most important quote or statement from the content
    const extractQuoteResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Extract the most powerful, shareable quote or key message from this content. Make it punchy, memorable, and perfect for social media. Maximum 10-15 words.'
        },
        {
          role: 'user',
          content: `Video content context: ${videoContent.substring(0, 500)}
          
          Key insight: ${keyInsight}
          
          Platform: ${post.platform}
          Post headline: ${post.headline}
          
          Extract a powerful quote that would work as text overlay on a social media graphic.`
        }
      ],
      temperature: 0.7
    })
    
    const extractedQuote = extractQuoteResponse.choices[0].message.content || post.headline
    
    // Generate visual concept with clear text overlay instructions
    const visualResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are designing social media graphics that are content-focused, not abstract art. The graphics should clearly communicate the message with readable text overlays. Think infographics, quote cards, and data visualizations.`
        },
        {
          role: 'user',
          content: `Create a ${spec.format} for ${post.platform} with these requirements:
          
          MAIN TEXT OVERLAY: "${extractedQuote}"
          
          Context: This relates to "${post.headline}"
          Video topic: ${videoContent.substring(0, 200)}
          Visual style: ${post.visualStyle}
          
          Design requirements:
          - Dimensions: ${spec.dimensions}
          - Format: ${spec.style}
          - Text placement: ${spec.textArea}
          - The text "${extractedQuote}" MUST be clearly visible and readable
          - Use high contrast for text readability
          - Include subtle branding elements
          ${personaPhotos?.length ? '- Include the speaker/persona photo in a professional way' : ''}
          
          Create:
          1. Primary visual prompt for gpt-image-1 (be specific about text overlay)
          2. Three alternative concepts
          3. Color scheme recommendation`
        }
      ],
      temperature: 0.8
    })
    
    const visualConcept = visualResponse.choices[0].message.content || ''
    const conceptLines = visualConcept.split('\n').filter(l => l.trim())
    
    // Build the primary prompt with explicit text instructions
    const primaryPrompt = `Create a ${spec.format} (${spec.dimensions}) with the text "${extractedQuote}" as the main focal point. ${conceptLines[0] || spec.style}. The text must be large, bold, and clearly readable with high contrast. Professional social media graphic design, not artistic or abstract.`
    
    return {
      primary: primaryPrompt,
      alternatives: conceptLines.slice(1, 4).map(alt => 
        `${spec.format} with text "${extractedQuote}" - ${alt}`
      ),
      textOverlay: extractedQuote,
      designSpecs: {
        platform: post.platform,
        dimensions: spec.dimensions,
        textPlacement: spec.textArea,
        colorScheme: post.platform === 'instagram' ? 'vibrant gradients' : 
                     post.platform === 'linkedin' ? 'professional blues' : 
                     'high contrast'
      }
    }
  }

  static calculateEngagementPotential(
    post: SocialPost,
    insights: ContentInsight[]
  ): { score: number; factors: string[] } {
    let score = 50 // Base score
    const factors: string[] = []
    
    // Platform-specific engagement factors
    const platformMultipliers = {
      instagram: { visual: 1.5, story: 1.3, carousel: 1.4 },
      twitter: { controversial: 1.6, news: 1.4, thread: 1.3 },
      linkedin: { professional: 1.5, insight: 1.4, data: 1.3 },
      youtube: { educational: 1.6, entertainment: 1.5, howto: 1.4 },
      tiktok: { trend: 1.8, authentic: 1.5, humor: 1.4 }
    }
    
    // Content quality factors
    if (post.caption.includes('?')) {
      score += 10
      factors.push('Questions drive engagement')
    }
    
    if (post.caption.length < 100) {
      score += 5
      factors.push('Concise and punchy')
    }
    
    if (post.hashtags.length > 5 && post.hashtags.length < 15) {
      score += 8
      factors.push('Optimal hashtag count')
    }
    
    if (post.type === 'carousel' || post.type === 'thread') {
      score += 12
      factors.push('Multi-part content performs better')
    }
    
    // Emotional triggers
    const emotionalWords = ['amazing', 'shocking', 'unbelievable', 'secret', 'revealed', 'transform', 'breakthrough']
    if (emotionalWords.some(word => post.caption.toLowerCase().includes(word))) {
      score += 15
      factors.push('Strong emotional triggers')
    }
    
    // Time-based factors
    const now = new Date()
    const postHour = parseInt(post.bestTime.split(':')[0])
    if ([9, 12, 17, 20].includes(postHour)) {
      score += 10
      factors.push('Peak engagement hours')
    }
    
    // Limit score to 100
    return {
      score: Math.min(score, 100),
      factors
    }
  }

  static async generateContentCalendar(
    campaign: ContentCampaign
  ): Promise<{
    week1: any[]
    week2: any[]
    dailyThemes: Record<string, string>
  }> {
    const calendar = {
      week1: [] as any[],
      week2: [] as any[],
      dailyThemes: {
        monday: 'Motivation Monday - Inspire action',
        tuesday: 'Teaching Tuesday - Share knowledge',
        wednesday: 'Wisdom Wednesday - Deep insights',
        thursday: 'Throwback Thursday - Stories & case studies',
        friday: 'Feature Friday - Highlight wins',
        saturday: 'Social Saturday - Community engagement',
        sunday: 'Summary Sunday - Week recap'
      }
    }
    
    // Distribute posts across 2 weeks
    let dayIndex = 0
    campaign.platforms.forEach(platform => {
      platform.posts.forEach(post => {
        const week = dayIndex < 7 ? 'week1' : 'week2'
        const dayOfWeek = dayIndex % 7
        const date = new Date()
        date.setDate(date.getDate() + dayIndex)
        
        calendar[week].push({
          date: date.toISOString().split('T')[0],
          dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayOfWeek],
          platform: platform.platform,
          post,
          theme: Object.values(calendar.dailyThemes)[dayOfWeek]
        })
        
        dayIndex++
      })
    })
    
    return calendar
  }
} 