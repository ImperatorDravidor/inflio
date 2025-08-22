import { getOpenAI } from './openai'
import { TranscriptionData } from './project-types'
import { executeWithModelFallback } from './ai-model-config'

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
  thumbnailIdeas?: {
    concepts: Array<{
      id: string
      title: string
      description: string
      visualElements: string[]
      colorScheme: string[]
      style: 'modern' | 'classic' | 'minimalist' | 'bold' | 'creative' | 'professional'
      mood: string
      targetAudience: string
      keyText?: string
      composition: string
      aiPrompt?: string
    }>
    bestPractices: string[]
    platformOptimized: {
      youtube?: string
      instagram?: string
      tiktok?: string
    }
  }
  deepAnalysis?: {
    contentPillars: string[]
    narrativeArc: string
    emotionalJourney: string[]
    targetDemographics: {
      primary: string
      secondary?: string
      interests: string[]
    }
    viralPotential: {
      score: number
      factors: string[]
      recommendations: string[]
    }
    customPostIdeas: Array<{
      id: string
      type: 'educational' | 'entertaining' | 'inspirational' | 'promotional' | 'storytelling'
      hook: string
      mainContent: string
      callToAction: string
      estimatedEngagement: 'high' | 'medium' | 'low'
      bestTimeToPost?: string
      platform: string[]
      synergies?: string[]
    }>
    contentStrategy: {
      primaryTheme: string
      secondaryThemes: string[]
      contentSeries?: string[]
      crossPromotionOpportunities: string[]
    }
  }
  modelVersion?: string
}

export class AIContentService {
  /**
   * Extract keywords and topics from transcript using OpenAI GPT-5
   */
  static async analyzeTranscript(transcription: TranscriptionData, useDeepAnalysis: boolean = true): Promise<ContentAnalysis> {
    try {
      const openai = getOpenAI()
      
      // Prepare the transcript text with timestamps for better context
      const transcriptWithTimestamps = transcription.segments
        .map(seg => `[${Math.floor(seg.start / 60)}:${String(Math.floor(seg.start % 60)).padStart(2, '0')}] ${seg.text}`)
        .join('\n')

      const systemPrompt = `You are an expert content strategist, visual designer, and viral content specialist. 
Your task is to perform deep content analysis including thumbnail ideas, viral potential assessment, and custom content strategies.
Provide comprehensive analysis in structured JSON format.`

      const userPrompt = `Perform a comprehensive deep analysis of this video transcript:

Transcript:
${transcriptWithTimestamps}

Provide analysis including:
1. Keywords & Topics (10-15 keywords, 5-8 topics)
2. Summary & Sentiment
3. Key Moments with timestamps
4. Content Suggestions (blog, social, short-form)
5. Thumbnail Ideas (3-5 creative concepts with visual details)
6. Deep Analysis (content pillars, viral potential, demographics)
7. Custom Post Ideas (5-7 platform-specific posts with engagement predictions)

Return in this exact JSON format:
{
  "keywords": ["keyword1", "keyword2", ...],
  "topics": ["topic1", "topic2", ...],
  "summary": "Brief summary",
  "sentiment": "positive|neutral|negative",
  "keyMoments": [{"timestamp": seconds, "description": "what happens"}],
  "contentSuggestions": {
    "blogPostIdeas": ["idea1", "idea2", "idea3"],
    "socialMediaHooks": ["hook1", "hook2", "hook3"],
    "shortFormContent": ["idea1", "idea2", "idea3"]
  },
  "thumbnailIdeas": {
    "concepts": [
      {
        "id": "concept1",
        "title": "Concept Title",
        "description": "Visual concept description",
        "visualElements": ["element1", "element2"],
        "colorScheme": ["#color1", "#color2"],
        "style": "modern|classic|minimalist|bold|creative|professional",
        "mood": "energetic|calm|mysterious|professional|playful",
        "targetAudience": "audience description",
        "keyText": "TEXT OVERLAY",
        "composition": "rule of thirds, focal point description",
        "aiPrompt": "detailed AI image generation prompt"
      }
    ],
    "bestPractices": ["practice1", "practice2"],
    "platformOptimized": {
      "youtube": "YouTube-specific thumbnail recommendation",
      "instagram": "Instagram-specific visual recommendation",
      "tiktok": "TikTok-specific cover recommendation"
    }
  },
  "deepAnalysis": {
    "contentPillars": ["pillar1", "pillar2"],
    "narrativeArc": "story structure analysis",
    "emotionalJourney": ["emotion1", "emotion2"],
    "targetDemographics": {
      "primary": "primary audience",
      "secondary": "secondary audience",
      "interests": ["interest1", "interest2"]
    },
    "viralPotential": {
      "score": 85,
      "factors": ["factor1", "factor2"],
      "recommendations": ["recommendation1", "recommendation2"]
    },
    "customPostIdeas": [
      {
        "id": "post1",
        "type": "educational|entertaining|inspirational|promotional|storytelling",
        "hook": "attention-grabbing opening",
        "mainContent": "main post content",
        "callToAction": "CTA text",
        "estimatedEngagement": "high|medium|low",
        "bestTimeToPost": "optimal posting time",
        "platform": ["instagram", "twitter"],
        "synergies": ["connection to other content"]
      }
    ],
    "contentStrategy": {
      "primaryTheme": "main theme",
      "secondaryThemes": ["theme1", "theme2"],
      "contentSeries": ["series idea 1", "series idea 2"],
      "crossPromotionOpportunities": ["opportunity1", "opportunity2"]
    }
  },
  "modelVersion": "gpt-5"
}`

      // Using GPT-5 with automatic fallback
      const completion = await executeWithModelFallback(
        openai,
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7, // Increased for more creative thumbnail ideas
          max_tokens: 4000, // Increased for comprehensive analysis
          response_format: { type: 'json_object' }
        },
        'Content Analysis'
      )

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const analysis = JSON.parse(response) as ContentAnalysis
      
      // Validate and enhance the response
      return {
        ...analysis,
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 15) : [],
        topics: Array.isArray(analysis.topics) ? analysis.topics.slice(0, 8) : [],
        summary: analysis.summary || 'No summary available',
        sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
        keyMoments: Array.isArray(analysis.keyMoments) ? analysis.keyMoments.slice(0, 5) : [],
        modelVersion: 'gpt-5',
        contentSuggestions: {
          blogPostIdeas: Array.isArray(analysis.contentSuggestions?.blogPostIdeas) ? analysis.contentSuggestions.blogPostIdeas : [],
          socialMediaHooks: Array.isArray(analysis.contentSuggestions?.socialMediaHooks) ? analysis.contentSuggestions.socialMediaHooks : [],
          shortFormContent: Array.isArray(analysis.contentSuggestions?.shortFormContent) ? analysis.contentSuggestions.shortFormContent : []
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

      // Using GPT-5 with automatic fallback
      const completion = await executeWithModelFallback(
        openai,
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2500,
          response_format: { type: 'json_object' }
        },
        'Blog Generation'
      )

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

        // Using GPT-5 with automatic fallback
        const completion = await executeWithModelFallback(
          openai,
          {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 500,
            response_format: { type: 'json_object' }
          },
          `Social Post Generation (${platform})`
        )

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
      },
      thumbnailIdeas: {
        concepts: [
          {
            id: 'concept-1',
            title: 'Bold Typography Focus',
            description: 'Large, impactful text overlay with key message',
            visualElements: ['Bold text', 'Gradient background', 'Icon elements'],
            colorScheme: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
            style: 'modern',
            mood: 'energetic',
            targetAudience: 'General viewers seeking quick insights',
            keyText: keywords[0]?.toUpperCase() || 'KEY INSIGHTS',
            composition: 'Center-aligned text with supporting graphics',
            aiPrompt: `Modern thumbnail with bold "${keywords[0]}" text, gradient background, professional design`
          },
          {
            id: 'concept-2',
            title: 'Visual Metaphor',
            description: 'Abstract representation of main topic',
            visualElements: ['Symbolic imagery', 'Clean layout', 'Subtle text'],
            colorScheme: ['#667EEA', '#764BA2', '#F093FB'],
            style: 'minimalist',
            mood: 'professional',
            targetAudience: 'Professional audience',
            keyText: topics[0],
            composition: 'Rule of thirds with focal point on left',
            aiPrompt: `Minimalist thumbnail representing "${topics[0]}", professional aesthetic, clean design`
          },
          {
            id: 'concept-3',
            title: 'Data Visualization',
            description: 'Infographic-style with key statistics',
            visualElements: ['Charts', 'Numbers', 'Icons'],
            colorScheme: ['#0F2027', '#203A43', '#2C5364'],
            style: 'professional',
            mood: 'calm',
            targetAudience: 'Data-driven viewers',
            keyText: '5 KEY POINTS',
            composition: 'Grid layout with balanced elements',
            aiPrompt: `Infographic thumbnail showing 5 key points about "${topics[0]}", clean data visualization`
          }
        ],
        bestPractices: [
          'Use high contrast for text readability',
          'Keep text under 5 words for impact',
          'Include faces for higher CTR when relevant',
          'Use bright colors to stand out in feed'
        ],
        platformOptimized: {
          youtube: 'Use 1280x720px, include channel branding, high contrast text',
          instagram: 'Square format 1080x1080px, minimal text, visual focus',
          tiktok: 'Vertical 9:16 format, eye-catching first frame'
        }
      },
      deepAnalysis: {
        contentPillars: [topics[0], topics[1] || 'Educational Content'],
        narrativeArc: 'Introduction → Main Points → Conclusion',
        emotionalJourney: ['Curiosity', 'Interest', 'Understanding'],
        targetDemographics: {
          primary: 'General audience interested in ' + topics[0],
          secondary: 'Content creators and educators',
          interests: keywords.slice(0, 5)
        },
        viralPotential: {
          score: 70,
          factors: ['Relevant topic', 'Clear message', 'Shareable insights'],
          recommendations: ['Add emotional hook', 'Include surprising fact', 'Create controversy or debate']
        },
        customPostIdeas: [
          {
            id: 'post-1',
            type: 'educational',
            hook: `Did you know about ${keywords[0]}?`,
            mainContent: `Here are 3 things about ${topics[0]} that will change your perspective...`,
            callToAction: 'Share if you found this helpful!',
            estimatedEngagement: 'medium',
            bestTimeToPost: '9 AM or 5 PM local time',
            platform: ['twitter', 'linkedin'],
            synergies: ['Can be part of educational series']
          },
          {
            id: 'post-2',
            type: 'entertaining',
            hook: `The truth about ${topics[0]} might surprise you...`,
            mainContent: `Most people don't realize that ${keywords.slice(0, 3).join(', ')} are connected in this way...`,
            callToAction: 'What\'s your take on this?',
            estimatedEngagement: 'high',
            bestTimeToPost: '12 PM or 7 PM local time',
            platform: ['instagram', 'tiktok'],
            synergies: ['Great for carousel or reel format']
          }
        ],
        contentStrategy: {
          primaryTheme: topics[0],
          secondaryThemes: topics.slice(1, 3),
          contentSeries: [`${topics[0]} Explained`, 'Weekly Insights'],
          crossPromotionOpportunities: ['Blog post expansion', 'Podcast discussion', 'Q&A session']
        }
      },
      modelVersion: 'fallback'
    }
  }
} 