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
    
    // Extract comprehensive insights from content analysis (NO TRUNCATION)
    const keyTopics = contentAnalysis?.topics?.join(', ') || 'general content'
    const keywords = contentAnalysis?.keywords?.join(', ') || ''
    const sentiment = contentAnalysis?.sentiment || 'neutral'
    const summary = contentAnalysis?.summary || ''
    const keyMoments = contentAnalysis?.keyMoments || []
    const viralHooks = contentAnalysis?.contentSuggestions?.socialMediaHooks || []
    const mainPoints = contentAnalysis?.mainPoints || []
    const actionableInsights = contentAnalysis?.actionableInsights || []
    
    const systemPrompt = `You are an elite content strategist and viral social media expert with deep expertise in psychology, storytelling, and platform algorithms.

Your mission: Analyze this video content THOROUGHLY and create exceptional social media posts that:
- Stop the scroll immediately with pattern-interrupting hooks
- Deliver genuine value that changes how people think or act
- Are meticulously optimized for each platform's algorithm
- Feature clear visual concepts that amplify the message
- Drive measurable engagement and audience growth

Quality Standards:
- Every word must earn its place - no fluff
- Hook must create curiosity gap or emotional response in 3 seconds
- Body must teach, inspire, or challenge conventional thinking
- CTA must be specific and compelling
- Visual must be thumb-stopping and on-brand

${settings.brandVoice ? `Brand Voice: ${settings.brandVoice}` : 'Professional yet approachable, authentic, value-driven'}
${settings.usePersona && settings.personaDetails ? `\nBrand Persona: ${settings.personaDetails.context}` : ''}

Remember: Generic posts get ignored. Create content that people feel compelled to engage with.`

    const userPrompt = `DEEP CONTENT ANALYSIS - Read everything carefully:

VIDEO TITLE: "${projectTitle}"

FULL TRANSCRIPT (use all of this):
"${transcript}"

COMPREHENSIVE ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topics Covered: ${keyTopics}
Key Keywords: ${keywords}
Emotional Tone: ${sentiment}
Summary: ${summary}

${mainPoints.length > 0 ? `\nMain Points:\n${mainPoints.map((p: any, i: number) => `${i + 1}. ${p}`).join('\n')}` : ''}

${keyMoments.length > 0 ? `\nKey Moments (with timestamps):\n${keyMoments.map((m: any) => `• [${m.timestamp}] ${m.description}`).join('\n')}` : ''}

${viralHooks.length > 0 ? `\nIdentified Viral Hooks:\n${viralHooks.map((h: string) => `• ${h}`).join('\n')}` : ''}

${actionableInsights.length > 0 ? `\nActionable Insights:\n${actionableInsights.map((i: string) => `• ${i}`).join('\n')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TARGET PLATFORMS: ${settings.platforms.join(', ')}

TASK: Create 8 EXCEPTIONAL post suggestions (quality over quantity). Each must be:
- Deeply rooted in the actual content above
- Strategically different in style and purpose
- Immediately actionable and ready to post
- Featuring a complete visual concept

Cover these strategic post types:
1. 🎯 Hook Carousel: Multi-slide story that builds curiosity and delivers a payoff (5-7 slides)
2. 💡 Insight Quote: One powerful takeaway from the video as a shareable visual quote
3. 🎬 Behind-the-Scenes: Authentic moment or process revealed (builds connection)
4. 📊 Data Showcase: Surprising statistic or metric presented visually (credibility)
5. 🔥 Hot Take: Controversial opinion or challenge to conventional thinking (engagement)
6. 📝 Thread Story: Multi-tweet narrative that unfolds the key insight (Twitter/X)
7. ⚡ Quick Win: Single actionable tip they can implement today (immediate value)
8. 🎪 Pattern Interrupt: Unexpected angle or format that stops the scroll

For each post, you MUST think through:
- What specific moment/insight from the video does this leverage?
- Why would someone stop scrolling for THIS?
- What emotion does this trigger? (curiosity, FOMO, inspiration, shock)
- What action do we want them to take?
- How does the visual amplify the message?

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
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8, // Creative and engaging while maintaining quality
      max_tokens: 6000, // More room for thorough, quality responses
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
