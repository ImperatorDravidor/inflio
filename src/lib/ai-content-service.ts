import { getOpenAI } from './openai'
import { TranscriptionData } from './project-types'

export interface ContentAnalysis {
  keywords: string[]
  topics: string[]
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keyMoments: Array<{
    timestamp: number
    description: string
  }>
  contentSuggestions: {
    blogPostIdeas: string[]
    socialMediaHooks: string[]
    shortFormContent: string[]
  }
}

export class AIContentService {
  /**
   * Extract keywords and topics from transcript using OpenAI GPT-4 Turbo
   */
  static async analyzeTranscript(transcription: TranscriptionData): Promise<ContentAnalysis> {
    try {
      const openai = getOpenAI()
      
      // Prepare the transcript text with timestamps for better context
      const transcriptWithTimestamps = transcription.segments
        .map(seg => `[${Math.floor(seg.start / 60)}:${String(Math.floor(seg.start % 60)).padStart(2, '0')}] ${seg.text}`)
        .join('\n')

      const systemPrompt = `You are an expert content analyst specializing in video content optimization. 
Your task is to analyze video transcripts and extract valuable insights for content creation.
Provide your analysis in a structured JSON format.`

      const userPrompt = `Analyze this video transcript and provide:
1. 10-15 relevant keywords (single words or short phrases)
2. 5-8 main topics discussed
3. A brief summary (2-3 sentences)
4. Overall sentiment
5. 3-5 key moments with timestamps
6. Content suggestions for repurposing

Transcript:
${transcriptWithTimestamps}

Return the analysis in this exact JSON format:
{
  "keywords": ["keyword1", "keyword2", ...],
  "topics": ["topic1", "topic2", ...],
  "summary": "Brief summary of the content",
  "sentiment": "positive|neutral|negative",
  "keyMoments": [
    {"timestamp": seconds, "description": "what happens"},
    ...
  ],
  "contentSuggestions": {
    "blogPostIdeas": ["idea1", "idea2", "idea3"],
    "socialMediaHooks": ["hook1", "hook2", "hook3"],
    "shortFormContent": ["idea1", "idea2", "idea3"]
  }
}`

      const completion = await openai.chat.completions.create({
        // Using the latest GPT-4.1 model
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const analysis = JSON.parse(response) as ContentAnalysis
      
      // Validate and sanitize the response
      return {
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 15) : [],
        topics: Array.isArray(analysis.topics) ? analysis.topics.slice(0, 8) : [],
        summary: analysis.summary || 'No summary available',
        sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
        keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments.slice(0, 5) : [],
        contentSuggestions: {
          blogPostIdeas: Array.isArray(analysis.contentSuggestions?.blogPostIdeas) ? analysis.contentSuggestions.blogPostIdeas.slice(0, 3) : [],
          socialMediaHooks: Array.isArray(analysis.contentSuggestions?.socialMediaHooks) ? analysis.contentSuggestions.socialMediaHooks.slice(0, 3) : [],
          shortFormContent: Array.isArray(analysis.contentSuggestions?.shortFormContent) ? analysis.contentSuggestions.shortFormContent.slice(0, 3) : []
        }
      }
    } catch (error) {
      console.error('Error analyzing transcript:', error)
      
      // Return a fallback analysis if OpenAI fails
      return AIContentService.generateFallbackAnalysis(transcription)
    }
  }

  /**
   * Generate blog post from transcript and analysis
   */
  static async generateBlogPost(
    transcription: TranscriptionData, 
    analysis: ContentAnalysis,
    style: 'professional' | 'casual' | 'technical' = 'professional'
  ): Promise<{
    title: string
    content: string
    excerpt: string
    tags: string[]
    seoTitle: string
    seoDescription: string
  }> {
    try {
      const openai = getOpenAI()
      
      const stylePrompts = {
        professional: 'Write in a professional, authoritative tone suitable for business audiences.',
        casual: 'Write in a conversational, friendly tone that engages readers personally.',
        technical: 'Write in a detailed, technical manner with industry-specific terminology.'
      }

      const systemPrompt = `You are an expert content writer specializing in creating engaging blog posts from video content.
${stylePrompts[style]}
Create SEO-optimized content that provides value to readers.`

      const userPrompt = `Create a blog post based on this video transcript and analysis:

Keywords: ${analysis.keywords.join(', ')}
Topics: ${analysis.topics.join(', ')}
Summary: ${analysis.summary}

Transcript excerpt: ${transcription.text.substring(0, 1000)}...

Generate:
1. An engaging title
2. Well-structured content (use markdown formatting)
3. A compelling excerpt (150-200 characters)
4. 5-8 relevant tags
5. SEO title (under 60 characters)
6. SEO description (150-160 characters)

Return in JSON format:
{
  "title": "Blog post title",
  "content": "# Heading\\n\\nContent with **markdown** formatting...",
  "excerpt": "Brief excerpt",
  "tags": ["tag1", "tag2"],
  "seoTitle": "SEO optimized title",
  "seoDescription": "SEO meta description"
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating blog post:', error)
      throw error
    }
  }

  /**
   * Generate social media posts from analysis
   */
  static async generateSocialPosts(
    analysis: ContentAnalysis,
    platforms: Array<'twitter' | 'linkedin' | 'instagram' | 'tiktok'>
  ): Promise<Array<{
    platform: string
    content: string
    hashtags: string[]
    type: 'text' | 'carousel' | 'video'
  }>> {
    try {
      const openai = getOpenAI()
      
      const platformRequirements = {
        twitter: 'Max 280 characters, punchy and engaging',
        linkedin: 'Professional tone, 1-3 paragraphs, thought leadership',
        instagram: 'Visual-first, engaging captions, relevant hashtags',
        tiktok: 'Trendy, youth-oriented, hook in first 3 seconds'
      }

      const systemPrompt = `You are a social media expert who creates viral, platform-specific content.
Create engaging posts that maximize reach and engagement.`

      const posts = []

      for (const platform of platforms) {
        const userPrompt = `Create a ${platform} post based on:
Topics: ${analysis.topics.join(', ')}
Key Points: ${analysis.contentSuggestions.socialMediaHooks.join(', ')}

Requirements: ${platformRequirements[platform]}

Return JSON:
{
  "content": "Post content",
  "hashtags": ["hashtag1", "hashtag2"],
  "type": "text|carousel|video"
}`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })

        const response = completion.choices[0].message.content
        if (response) {
          const post = JSON.parse(response)
          posts.push({
            platform,
            ...post
          })
        }
      }

      return posts
    } catch (error) {
      console.error('Error generating social posts:', error)
      throw error
    }
  }

  /**
<<<<<<< HEAD
=======
   * Generate enhanced social media content with platform optimization
   */
  static async generateEnhancedSocialContent(
    content: string,
    platform: string,
    options: {
      style?: 'professional' | 'casual' | 'friendly' | 'bold'
      includeEmojis?: boolean
      includeHashtags?: boolean
      includeCTA?: boolean
      emojiLevel?: 'none' | 'minimal' | 'moderate' | 'heavy'
      targetAudience?: string
      brandVoice?: string
      maxLength?: number
    } = {}
  ): Promise<string> {
    try {
      const openai = getOpenAI()
      
      const platformConfigs = {
        instagram: {
          maxLength: 2200,
          hashtagLimit: 30,
          features: 'visual storytelling, lifestyle content, hashtag discovery',
          tone: 'inspirational, personal, visual-focused'
        },
        twitter: {
          maxLength: 280,
          hashtagLimit: 2,
          features: 'concise messaging, trending topics, retweet-worthy',
          tone: 'witty, timely, conversational'
        },
        linkedin: {
          maxLength: 3000,
          hashtagLimit: 5,
          features: 'professional insights, thought leadership, industry trends',
          tone: 'professional, informative, value-driven'
        },
        tiktok: {
          maxLength: 2200,
          hashtagLimit: 8,
          features: 'trendy, entertaining, challenge-based, sound-synced',
          tone: 'fun, trendy, youthful, creative'
        },
        facebook: {
          maxLength: 63206,
          hashtagLimit: 10,
          features: 'community building, shareable content, discussion starter',
          tone: 'friendly, inclusive, conversational'
        }
      }
      
      const config = platformConfigs[platform as keyof typeof platformConfigs] || platformConfigs.instagram
      const style = options.style || 'professional'
      const emojiLevel = options.emojiLevel || 'moderate'
      
      const systemPrompt = `You are an expert social media content strategist specializing in ${platform} content.
Your task is to transform content into highly engaging, platform-optimized posts that drive engagement.

Platform: ${platform}
Style: ${style}
Features: ${config.features}
Tone: ${config.tone}
Max Length: ${config.maxLength} characters
Hashtag Limit: ${config.hashtagLimit}

Writing Style Guidelines:
- ${style === 'professional' ? 'Maintain authority and credibility while being approachable' : ''}
- ${style === 'casual' ? 'Be conversational and relatable, like talking to a friend' : ''}
- ${style === 'friendly' ? 'Warm, welcoming, and inclusive tone that builds community' : ''}
- ${style === 'bold' ? 'Confident, assertive, and attention-grabbing statements' : ''}

Emoji Usage (${emojiLevel}):
- none: No emojis at all
- minimal: 1-2 strategic emojis for emphasis
- moderate: 3-5 emojis to enhance readability and emotion
- heavy: 6+ emojis for maximum visual appeal and energy

Create content that:
1. Hooks attention in the first line
2. Delivers value or emotion
3. Encourages engagement (likes, comments, shares)
4. Fits naturally on the platform
5. Uses platform-specific best practices`

      const userPrompt = `Transform this content into an engaging ${platform} post:

"${content}"

Requirements:
- Style: ${style}
- Emoji Level: ${emojiLevel} (${emojiLevel === 'none' ? 'NO emojis' : `use ${emojiLevel} amount of emojis`})
- Include Hashtags: ${options.includeHashtags ? `YES (max ${config.hashtagLimit})` : 'NO'}
- Include CTA: ${options.includeCTA ? 'YES (platform-appropriate)' : 'NO'}
- Max Length: ${options.maxLength || config.maxLength} characters

${options.targetAudience ? `Target Audience: ${options.targetAudience}` : ''}
${options.brandVoice ? `Brand Voice: ${options.brandVoice}` : ''}

Create a post that feels native to ${platform} and drives maximum engagement.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })

      const enhancedContent = completion.choices[0].message.content || content
      
      // Validate length
      if (enhancedContent.length > (options.maxLength || config.maxLength)) {
        // Truncate intelligently
        return this.truncateIntelligently(enhancedContent, options.maxLength || config.maxLength)
      }
      
      return enhancedContent
      
    } catch (error) {
      console.error('Error generating enhanced social content:', error)
      // Fallback enhancement
      return this.basicEnhancement(content, platform, options)
    }
  }

  /**
   * Intelligently truncate content while preserving meaning
   */
  private static truncateIntelligently(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content
    
    // Try to cut at sentence boundary
    const sentences = content.match(/[^.!?]+[.!?]+/g) || []
    let truncated = ''
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length <= maxLength - 3) {
        truncated += sentence
      } else {
        break
      }
    }
    
    // If no complete sentences fit, truncate at word boundary
    if (!truncated) {
      const words = content.split(' ')
      for (const word of words) {
        if ((truncated + word + ' ').length <= maxLength - 3) {
          truncated += word + ' '
        } else {
          break
        }
      }
    }
    
    return truncated.trim() + '...'
  }

  /**
   * Basic enhancement fallback
   */
  private static basicEnhancement(
    content: string,
    platform: string,
    options: any
  ): string {
    let enhanced = content
    
    // Add emojis based on level
    if (options.includeEmojis && options.emojiLevel !== 'none') {
      const emojiMap = {
        minimal: ['✨', '🎯'],
        moderate: ['✨', '🚀', '💡', '🎯', '✅'],
        heavy: ['✨', '🚀', '💡', '🎯', '✅', '🔥', '💪', '🌟', '⚡']
      }
      
      const emojis = emojiMap[options.emojiLevel as keyof typeof emojiMap] || emojiMap.moderate
      enhanced = emojis[0] + ' ' + enhanced + ' ' + emojis[1]
    }
    
    // Add hashtags
    if (options.includeHashtags) {
      const hashtags = this.generateHashtags(content, platform)
      enhanced += '\n\n' + hashtags
    }
    
    // Add CTA
    if (options.includeCTA) {
      const ctas = {
        instagram: '👉 Follow for more content like this!',
        twitter: '♻️ RT if you agree!',
        linkedin: '💭 What are your thoughts?',
        tiktok: '➕ Follow for more!',
        facebook: '👍 Like and share if this helped!'
      }
      
      enhanced += '\n\n' + (ctas[platform as keyof typeof ctas] || ctas.instagram)
    }
    
    return enhanced
  }

  /**
   * Generate relevant hashtags for content
   */
  private static generateHashtags(content: string, platform: string): string {
    const words = content.toLowerCase().split(/\s+/)
    const keywords = words
      .filter(w => w.length > 5 && !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'about'].includes(w))
      .slice(0, 3)
    
    const platformTags = {
      instagram: ['#instagood', '#contentcreator', '#viral'],
      twitter: ['#trending', '#thoughts'],
      linkedin: ['#business', '#leadership', '#innovation'],
      tiktok: ['#fyp', '#foryoupage', '#viral'],
      facebook: ['#facebook', '#community']
    }
    
    const baseTags = keywords.map(k => '#' + k).join(' ')
    const extraTags = (platformTags[platform as keyof typeof platformTags] || []).slice(0, 2).join(' ')
    
    return baseTags + ' ' + extraTags
  }

  /**
>>>>>>> 7184e73 (Add new files and configurations for project setup)
   * Fallback analysis when OpenAI is unavailable
   */
  private static generateFallbackAnalysis(transcription: TranscriptionData): ContentAnalysis {
    // Extract keywords using simple frequency analysis
    const words = transcription.text.toLowerCase().split(/\W+/)
    const wordFreq = new Map<string, number>()
    
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'some', 'any', 'few', 'more', 'most', 'other', 'another', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'])
    
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })
    
    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
    
    // Extract topics (simplified)
    const topics = [
      'Video Content',
      'Main Discussion',
      ...keywords.slice(0, 3).map(k => k.charAt(0).toUpperCase() + k.slice(1))
    ]
    
    // Find key moments (every 20% of the video)
    const duration = transcription.duration
    const keyMoments = []
    for (let i = 0; i < 5; i++) {
      const timestamp = Math.floor(duration * (i * 0.2))
      const segment = transcription.segments.find(s => s.start >= timestamp) || transcription.segments[0]
      keyMoments.push({
        timestamp,
        description: segment.text.substring(0, 50) + '...'
      })
    }
    
    return {
      keywords,
      topics,
      summary: transcription.text.substring(0, 200) + '...',
      sentiment: 'neutral',
      keyMoments,
      contentSuggestions: {
        blogPostIdeas: [
          'Key Takeaways from This Video',
          'Understanding ' + topics[0],
          'A Deep Dive into ' + keywords[0]
        ],
        socialMediaHooks: [
          'Did you know? ' + transcription.segments[0].text.substring(0, 50),
          'Key insight: ' + keywords.join(', '),
          'Watch this video about ' + topics[0]
        ],
        shortFormContent: [
          'Quick tip from the video',
          'Main highlights in 60 seconds',
          '3 things you need to know'
        ]
      }
    }
  }
} 