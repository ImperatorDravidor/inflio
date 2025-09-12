/**
 * Advanced AI Posts Generation Service
 * Creates high-quality, platform-optimized content based on video analysis
 */

import { getOpenAI } from '@/lib/openai'

export interface AdvancedPostSuggestion {
  id: string
  
  // Clear content type indicator
  contentType: {
    format: 'carousel' | 'single' | 'reel' | 'story' | 'thread' | 'quote' | 'poll' | 'video'
    icon: string // Visual icon for UI
    label: string // User-friendly label
    description: string // What this type does
  }
  
  // Platform compatibility - clear and simple
  platforms: {
    primary: string[] // Best platforms for this content
    secondary: string[] // Also works on these
    icons: string[] // Platform icons for UI
  }
  
  // The actual content - ready to use
  content: {
    title: string // Dashboard title
    preview: string // Quick preview text
    hook: string // Opening line
    body: string // Main content
    cta: string // Call to action
    hashtags: string[] // Relevant hashtags
    wordCount: number // Content length
  }
  
  // Visual generation - clear and actionable
  visual: {
    description: string // What the visual should look like
    aiPrompt: string // Ready-to-use AI image prompt
    style: 'modern' | 'classic' | 'minimalist' | 'bold' | 'artistic' | 'photorealistic'
    primaryColors: string[] // Hex colors
    textOverlay?: string // Text to add on image
    dimensions: string // Size specifications
  }
  
  // Why this will work - simple insights
  insights: {
    whyItWorks: string // Brief explanation
    targetAudience: string // Who will engage
    bestTime: string // When to post
    engagementTip: string // How to maximize engagement
    estimatedReach: 'viral' | 'high' | 'medium' | 'targeted'
  }
  
  // Quick actions for the user
  actions: {
    canEditText: boolean
    canGenerateImage: boolean
    readyToPost: boolean
    needsPersona: boolean
  }
}

export class AdvancedPostsService {
  /**
   * Generate high-quality post suggestions based on content analysis
   */
  static async generateAdvancedPosts(
    transcript: string,
    projectTitle: string,
    contentAnalysis: any,
    settings: {
      platforms: string[]
      usePersona?: boolean
      personaDetails?: any
      brandVoice?: string
    }
  ): Promise<AdvancedPostSuggestion[]> {
    
    const openai = getOpenAI()
    
    // Extract key insights from content analysis
    const keyTopics = contentAnalysis?.topics?.slice(0, 5).join(', ') || 'general content'
    const keywords = contentAnalysis?.keywords?.slice(0, 10).join(', ') || ''
    const sentiment = contentAnalysis?.sentiment || 'neutral'
    const summary = contentAnalysis?.summary || transcript.substring(0, 500)
    const keyMoments = contentAnalysis?.keyMoments?.slice(0, 5) || []
    const viralHooks = contentAnalysis?.contentSuggestions?.socialMediaHooks || []
    
    const systemPrompt = `You are an expert content strategist who creates high-quality, engaging social media content.

Your goal: Transform video content into compelling social media posts that are:
- Immediately valuable to the audience
- Platform-optimized for maximum reach
- Visually striking and memorable
- Easy to create and post

Focus on quality over quantity. Each suggestion should be genuinely useful and ready to implement.

${settings.brandVoice ? `Brand Voice: ${settings.brandVoice}` : ''}
${settings.usePersona && settings.personaDetails ? `Brand Persona: ${settings.personaDetails.context}` : ''}`

    const userPrompt = `Analyze this content and create 10 diverse, high-quality social media post suggestions.

VIDEO TITLE: "${projectTitle}"

KEY TOPICS: ${keyTopics}
KEYWORDS: ${keywords}
TONE: ${sentiment}
SUMMARY: ${summary}

${keyMoments.length > 0 ? `KEY MOMENTS:\n${keyMoments.map((m: any) => `- [${m.timestamp}s] ${m.description}`).join('\n')}` : ''}
${viralHooks.length > 0 ? `VIRAL HOOKS:\n${viralHooks.join('\n')}` : ''}

TRANSCRIPT EXCERPT:
"${transcript.substring(0, 1500)}"

TARGET PLATFORMS: ${settings.platforms.join(', ')}

Create 10 unique post suggestions covering different styles:
1. Educational carousel (step-by-step value)
2. Inspirational quote card (shareable wisdom)
3. Behind-the-scenes story (authentic connection)
4. Data/Statistics post (credibility builder)
5. Controversial opinion (conversation starter)
6. How-to tutorial (actionable value)
7. Personal story thread (emotional connection)
8. Quick tip reel (instant value)
9. Community question/poll (engagement driver)
10. Transformation showcase (results-focused)

For each post, provide this exact structure:
{
  "id": "unique-id",
  "contentType": {
    "format": "carousel|single|reel|story|thread|quote|poll",
    "icon": "emoji representing the type",
    "label": "User-friendly name",
    "description": "What this post type does best"
  },
  "platforms": {
    "primary": ["best platform(s) for this content"],
    "secondary": ["also works on"],
    "icons": ["platform emojis"]
  },
  "content": {
    "title": "Catchy dashboard title",
    "preview": "First 50 chars of content...",
    "hook": "Opening line that grabs attention",
    "body": "Full post content with emojis and formatting",
    "cta": "Clear call to action",
    "hashtags": ["relevant", "hashtags"],
    "wordCount": number
  },
  "visual": {
    "description": "What the visual looks like",
    "aiPrompt": "Detailed prompt for AI image generation (be specific about style, composition, colors, mood)",
    "style": "modern|classic|minimalist|bold|artistic|photorealistic",
    "primaryColors": ["#hex1", "#hex2"],
    "textOverlay": "Text to add on image (if any)",
    "dimensions": "1080x1080 or platform-specific"
  },
  "insights": {
    "whyItWorks": "Brief explanation of why this will perform well",
    "targetAudience": "Who will engage with this",
    "bestTime": "Optimal posting time",
    "engagementTip": "How to maximize engagement",
    "estimatedReach": "viral|high|medium|targeted"
  },
  "actions": {
    "canEditText": true,
    "canGenerateImage": true,
    "readyToPost": true/false,
    "needsPersona": true/false
  }
}

Make each suggestion:
- Unique and valuable
- Platform-optimized
- Visually compelling
- Easy to implement
- Based on the actual content analysis

Return as a JSON object with a "posts" array containing all 10 suggestions.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8, // Balanced creativity and consistency
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from AI')
    }

    const { posts } = JSON.parse(response)
    
    // Return the high-quality posts directly
    return posts
  }
}
