import { openai } from '@/lib/openai'

export interface ThreadSegment {
  id: string
  content: string
  characterCount: number
  order: number
  isHook?: boolean
  isCTA?: boolean
}

export interface GeneratedThread {
  id: string
  platform: 'twitter' | 'linkedin'
  segments: ThreadSegment[]
  title: string
  totalSegments: number
  estimatedReadTime: number
  hashtags: string[]
  createdAt: Date
}

export interface ThreadGenerationOptions {
  platform: 'twitter' | 'linkedin'
  tone?: 'professional' | 'casual' | 'educational' | 'inspiring'
  includeHashtags?: boolean
  maxSegments?: number
  includeCTA?: boolean
  ctaText?: string
  targetAudience?: string
}

type PlatformType = 'twitter' | 'linkedin'

const PLATFORM_LIMITS: Record<PlatformType, {
  characterLimit: number
  maxSegments: number
  hashtagLimit: number
}> = {
  twitter: {
    characterLimit: 280,
    maxSegments: 25,
    hashtagLimit: 3
  },
  linkedin: {
    characterLimit: 3000,
    maxSegments: 10,
    hashtagLimit: 5
  }
}

export class ThreadGenerator {
  /**
   * Generate a thread from blog content or transcript
   */
  static async generateThread(
    content: string,
    title: string,
    options: ThreadGenerationOptions
  ): Promise<GeneratedThread> {
    const {
      platform = 'twitter',
      tone = 'professional',
      includeHashtags = true,
      maxSegments = PLATFORM_LIMITS[platform].maxSegments,
      includeCTA = true,
      targetAudience = 'general audience'
    } = options

    const characterLimit = PLATFORM_LIMITS[platform].characterLimit

    try {
      // Generate thread using OpenAI
      const systemPrompt = this.buildSystemPrompt(platform, tone, targetAudience)
      const userPrompt = this.buildUserPrompt(
        content,
        title,
        platform,
        characterLimit,
        maxSegments,
        includeHashtags,
        includeCTA,
        options.ctaText
      )

      if (!openai) {
        throw new Error('OpenAI client not initialized')
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })

      const response = JSON.parse(completion.choices[0].message.content || '{}')
      
      // Process and validate segments
      const segments = this.processSegments(response.segments || [], platform)
      const hashtags = this.extractHashtags(response.hashtags || [], platform)

      return {
        id: `thread_${Date.now()}`,
        platform,
        segments,
        title: response.title || title,
        totalSegments: segments.length,
        estimatedReadTime: Math.ceil(segments.length * 0.5), // ~30 seconds per tweet
        hashtags,
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Thread generation error:', error)
      throw new Error('Failed to generate thread. Please try again.')
    }
  }

  /**
   * Build system prompt for thread generation
   */
  private static buildSystemPrompt(
    platform: string,
    tone: string,
    targetAudience: string
  ): string {
    return `You are an expert social media content strategist specializing in ${platform} threads. 
Your task is to convert long-form content into engaging, viral-worthy threads.

Key principles:
- Write in a ${tone} tone for ${targetAudience}
- Use clear, concise language
- Create hooks that grab attention
- Break complex ideas into digestible parts
- Use line breaks for better readability
- ${platform === 'twitter' ? 'Keep tweets punchy and scannable' : 'Leverage LinkedIn\'s longer format for depth'}
- End with a strong call-to-action

Always return a JSON object with this structure:
{
  "title": "Thread title",
  "segments": [
    {
      "content": "Segment text",
      "isHook": true/false,
      "isCTA": true/false
    }
  ],
  "hashtags": ["relevant", "hashtags"]
}`
  }

  /**
   * Build user prompt with content and requirements
   */
  private static buildUserPrompt(
    content: string,
    title: string,
    platform: PlatformType,
    characterLimit: number,
    maxSegments: number,
    includeHashtags: boolean,
    includeCTA: boolean,
    ctaText?: string
  ): string {
    let prompt = `Convert this content into a ${platform} thread:

Title: ${title}

Content:
${content}

Requirements:
- Maximum ${maxSegments} segments
- Each segment must be under ${characterLimit} characters
- First segment must be an attention-grabbing hook
- Include numbers, statistics, or surprising facts when available
- Use emojis strategically for visual appeal`

    if (platform === 'twitter') {
      prompt += `
- Number each tweet (e.g., "1/10")
- Use line breaks for scannability
- Keep language conversational`
    } else {
      prompt += `
- Use LinkedIn's professional tone
- Include relevant industry insights
- Format with bullet points where appropriate`
    }

    if (includeHashtags) {
      prompt += `\n- Include ${PLATFORM_LIMITS[platform].hashtagLimit} relevant hashtags`
    }

    if (includeCTA) {
      const cta = ctaText || 'Follow for more insights like this!'
      prompt += `\n- End with this call-to-action: "${cta}"`
    }

    return prompt
  }

  /**
   * Process and validate segments
   */
  private static processSegments(
    rawSegments: any[],
    platform: PlatformType
  ): ThreadSegment[] {
    const characterLimit = PLATFORM_LIMITS[platform].characterLimit
    const segments: ThreadSegment[] = []

    rawSegments.forEach((segment, index) => {
      let content = segment.content || ''
      
      // Add tweet numbering for Twitter
      if (platform === 'twitter' && !segment.isHook && !segment.isCTA) {
        const numbering = `${index + 1}/${rawSegments.length}\n\n`
        content = numbering + content
      }

      // Ensure within character limit
      if (content.length > characterLimit) {
        // Split long segments
        const chunks = this.splitIntoChunks(content, characterLimit, platform)
        chunks.forEach((chunk, chunkIndex) => {
          segments.push({
            id: `segment_${segments.length}`,
            content: chunk,
            characterCount: chunk.length,
            order: segments.length,
            isHook: segment.isHook && chunkIndex === 0,
            isCTA: segment.isCTA && chunkIndex === chunks.length - 1
          })
        })
      } else {
        segments.push({
          id: `segment_${segments.length}`,
          content,
          characterCount: content.length,
          order: segments.length,
          isHook: segment.isHook || false,
          isCTA: segment.isCTA || false
        })
      }
    })

    return segments
  }

  /**
   * Split content into chunks respecting word boundaries
   */
  private static splitIntoChunks(
    content: string,
    limit: number,
    platform: string
  ): string[] {
    const chunks: string[] = []
    const words = content.split(' ')
    let currentChunk = ''

    words.forEach(word => {
      const testChunk = currentChunk ? `${currentChunk} ${word}` : word
      
      if (testChunk.length <= limit) {
        currentChunk = testChunk
      } else {
        if (currentChunk) {
          chunks.push(currentChunk)
        }
        currentChunk = word
      }
    })

    if (currentChunk) {
      chunks.push(currentChunk)
    }

    // Add continuation indicators for Twitter
    if (platform === 'twitter' && chunks.length > 1) {
      return chunks.map((chunk, index) => {
        if (index < chunks.length - 1) {
          return chunk + ' →'
        }
        return chunk
      })
    }

    return chunks
  }

  /**
   * Extract and validate hashtags
   */
  private static extractHashtags(
    hashtags: string[],
    platform: PlatformType
  ): string[] {
    const limit = PLATFORM_LIMITS[platform].hashtagLimit
    
    return hashtags
      .map(tag => tag.replace(/^#/, '').trim())
      .filter(tag => tag.length > 0 && tag.length <= 100)
      .slice(0, limit)
  }

  /**
   * Optimize thread for platform-specific best practices
   */
  static optimizeThread(thread: GeneratedThread): GeneratedThread {
    const optimizedSegments = thread.segments.map(segment => {
      let content = segment.content

      // Platform-specific optimizations
      if (thread.platform === 'twitter') {
        // Add line breaks for readability
        content = this.addLineBreaksForTwitter(content)
        
        // Ensure punctuation is properly spaced
        content = content.replace(/([.!?])(\S)/g, '$1 $2')
      } else {
        // LinkedIn optimizations
        content = this.formatForLinkedIn(content)
      }

      return {
        ...segment,
        content,
        characterCount: content.length
      }
    })

    return {
      ...thread,
      segments: optimizedSegments
    }
  }

  /**
   * Add line breaks for Twitter readability
   */
  private static addLineBreaksForTwitter(content: string): string {
    // Add line breaks after periods if the next sentence is long
    return content.replace(/\. ([A-Z])/g, '.\n\n$1')
  }

  /**
   * Format content for LinkedIn's professional style
   */
  private static formatForLinkedIn(content: string): string {
    // Convert lists to bullet points
    content = content.replace(/^- /gm, '• ')
    
    // Add spacing around sections
    content = content.replace(/\n\n/g, '\n\n\n')
    
    return content
  }

  /**
   * Generate thread preview
   */
  static generatePreview(thread: GeneratedThread): string {
    const preview = thread.segments
      .map((segment, index) => {
        const header = segment.isHook ? '🪝 HOOK' : 
                      segment.isCTA ? '📢 CTA' : 
                      `📝 ${index + 1}/${thread.totalSegments}`
        
        return `${header}\n${segment.content}\n\n---`
      })
      .join('\n\n')

    const hashtagsStr = thread.hashtags.map(tag => `#${tag}`).join(' ')
    
    return `${preview}\n\n🏷️ Hashtags: ${hashtagsStr}`
  }
} 