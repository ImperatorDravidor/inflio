/**
 * Advanced AI Posts Generation Service
 * 
 * Creates high-quality, platform-optimized social media post suggestions
 * tied to actual video content using GPT-5.2 via the Responses API.
 * 
 * Each post is grounded in real transcript quotes, aligned with the user's
 * brand identity and persona, and includes platform-specific copy.
 */

import { getOpenAI } from '@/lib/openai'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BrandContext {
  companyName?: string
  voice?: string         // e.g. "professional, witty, concise"
  personality?: string[] // e.g. ["authoritative", "warm"]
  mission?: string
  values?: string[]
  colors?: { primary?: string[]; secondary?: string[]; accent?: string[] }
  targetAudience?: {
    description?: string
    demographics?: { age?: string; location?: string; interests?: string[] }
    psychographics?: string[]
    needs?: string[]
  }
  contentGoals?: string[]
  primaryPlatforms?: string[]
}

export interface PersonaContext {
  id: string
  name: string
  description?: string
  brandVoice?: string
  hasPortraits: boolean
  portraitCount: number
}

export interface ContentAnalysisContext {
  topics?: string[]
  keywords?: string[]
  keyPoints?: string[]
  sentiment?: string
  summary?: string
  keyMoments?: Array<{ timestamp?: number; description?: string }>
  socialMediaHooks?: string[]
}

export interface GeneratePostsInput {
  transcript: string
  projectTitle: string
  contentAnalysis: ContentAnalysisContext
  platforms: string[]
  brand?: BrandContext
  persona?: PersonaContext | null
  tone?: string
  contentGoal?: string
  contentTypes?: string[]
  creativity?: number
  contentBrief?: ContentBrief | null
}

export interface GeneratedPost {
  contentType: 'carousel' | 'single' | 'reel' | 'story' | 'thread' | 'quote'
  title: string
  transcriptQuote: string
  hook: string
  platformCopy: Record<string, {
    caption: string
    hashtags: string[]
    cta: string
  }>
  carouselSlides?: Array<{
    slideNumber: number
    headline: string
    body: string
    visualPrompt: string
  }>
  imagePrompt: string
  imageStyle: string
  imageDimensions: string
  engagement: {
    whyItWorks: string
    targetAudience: string
    bestTimeToPost: string
    estimatedReach: 'viral' | 'high' | 'medium' | 'targeted'
  }
}

export interface ContentBrief {
  coreNarrative: string
  primaryTheme: string
  keyTakeaways: string[]
  transcriptHighlights: string[]
  targetAudience: string
  toneGuidance: string
  visualDirection: string
  cta: string
}

// ─── Helper ──────────────────────────────────────────────────────────────────

export function extractOutputText(response: any): string {
  if (response.output && Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item.type === 'message' && item.content) {
        for (const content of item.content) {
          if (content.type === 'output_text' && content.text) {
            return content.text
          }
        }
      }
    }
  }
  if (response.output_text) {
    return response.output_text
  }
  throw new Error('Could not extract output text from GPT-5.2 response')
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class AdvancedPostsService {
  private static readonly MODEL = 'gpt-5.2'

  /**
   * Generate high-quality, content-tied post suggestions.
   * Uses GPT-5.2 Responses API with medium reasoning for structured output.
   */
  static async generateAdvancedPosts(
    input: GeneratePostsInput
  ): Promise<GeneratedPost[]> {
    const openai = getOpenAI()

    const {
      transcript,
      projectTitle,
      contentAnalysis,
      platforms,
      brand,
      persona,
      tone,
      contentGoal,
      contentTypes,
      creativity,
      contentBrief
    } = input

    // ── Build rich context blocks ──────────────────────────────────────────

    const transcriptBlock = transcript.substring(0, 8000)

    const topicsBlock = contentAnalysis.topics?.slice(0, 8).join(', ') || 'not analysed'
    const keywordsBlock = contentAnalysis.keywords?.slice(0, 12).join(', ') || ''
    const keyPointsBlock = contentAnalysis.keyPoints?.map(p => `  - ${p}`).join('\n') || '  (none)'
    const sentimentBlock = contentAnalysis.sentiment || 'neutral'
    const summaryBlock = contentAnalysis.summary || ''

    const keyMomentsBlock = contentAnalysis.keyMoments?.slice(0, 6).map((m) => {
      const ts = m.timestamp || 0
      const min = Math.floor(ts / 60)
      const sec = String(Math.floor(ts % 60)).padStart(2, '0')
      return `  [${min}:${sec}] ${m.description || ''}`
    }).join('\n') || '  (none identified)'

    const hooksBlock = contentAnalysis.socialMediaHooks?.slice(0, 5).join('\n  - ') || ''

    // Brand context
    let brandBlock = ''
    if (brand) {
      const parts: string[] = []
      if (brand.companyName) parts.push(`Company: ${brand.companyName}`)
      if (brand.voice) parts.push(`Voice: ${brand.voice}`)
      if (brand.personality?.length) parts.push(`Personality: ${brand.personality.join(', ')}`)
      if (brand.mission) parts.push(`Mission: ${brand.mission}`)
      if (brand.values?.length) parts.push(`Values: ${brand.values.join(', ')}`)
      if (brand.colors?.primary?.length) parts.push(`Primary colors: ${brand.colors.primary.join(', ')}`)
      if (brand.colors?.accent?.length) parts.push(`Accent colors: ${brand.colors.accent.join(', ')}`)
      if (brand.targetAudience?.description) parts.push(`Target audience: ${brand.targetAudience.description}`)
      if (brand.targetAudience?.demographics?.age) parts.push(`Audience age: ${brand.targetAudience.demographics.age}`)
      if (brand.targetAudience?.demographics?.interests?.length) {
        parts.push(`Audience interests: ${brand.targetAudience.demographics.interests.join(', ')}`)
      }
      if (brand.targetAudience?.psychographics?.length) {
        parts.push(`Audience psychographics: ${brand.targetAudience.psychographics.join(', ')}`)
      }
      if (brand.contentGoals?.length) parts.push(`Content goals: ${brand.contentGoals.join(', ')}`)
      brandBlock = parts.join('\n')
    }

    // Persona context
    let personaBlock = ''
    if (persona) {
      personaBlock = [
        `Persona: ${persona.name}`,
        persona.description ? `Description: ${persona.description}` : '',
        persona.brandVoice ? `Persona brand voice: ${persona.brandVoice}` : '',
        persona.hasPortraits ? `Has ${persona.portraitCount} AI portraits available for image generation` : 'No portraits available yet'
      ].filter(Boolean).join('\n')
    }

    // Determine which content types to generate
    const requestedTypes = contentTypes?.length
      ? contentTypes
      : ['carousel', 'quote', 'single', 'thread', 'reel']

    // ── System instructions ────────────────────────────────────────────────

    const instructions = `You are a world-class social media content strategist. Your job is to turn video content into scroll-stopping social media posts that are directly tied to the actual content.

CRITICAL RULES:
1. Every post MUST include a real quote or specific detail from the transcript. No generic filler.
2. Every hook must reference something the speaker actually said or a specific insight from the video.
3. Platform copy must be genuinely different per platform (not the same text resized).
4. Image prompts must be detailed and specific (50+ words), referencing brand colors and visual style.
5. Carousel slides must each have distinct content — not the same idea rephrased.
6. Engagement rationale must reference the specific content, not generic "this type works well."

${brandBlock ? `\nBRAND IDENTITY:\n${brandBlock}` : ''}
${personaBlock ? `\nPERSONA:\n${personaBlock}` : ''}
${tone ? `\nTONE: ${tone}` : ''}
${contentGoal ? `\nPRIMARY GOAL: ${contentGoal}` : ''}
${contentBrief ? `
CONTENT BRIEF (align all posts with this strategic narrative):
- Core narrative: ${contentBrief.coreNarrative}
- Theme: ${contentBrief.primaryTheme}
- Key takeaways: ${contentBrief.keyTakeaways?.join('; ')}
- Tone: ${contentBrief.toneGuidance}
- CTA direction: ${contentBrief.cta}
- Visual direction: ${contentBrief.visualDirection}` : ''}`

    // ── User prompt ────────────────────────────────────────────────────────

    const userPrompt = `Create 5 high-quality social media post suggestions from this video content.

═══ VIDEO ═══
Title: "${projectTitle}"

═══ CONTENT ANALYSIS ═══
Topics: ${topicsBlock}
Keywords: ${keywordsBlock}
Sentiment: ${sentimentBlock}
${summaryBlock ? `Summary: ${summaryBlock}` : ''}

Key Points:
${keyPointsBlock}

Key Moments:
${keyMomentsBlock}

${hooksBlock ? `Suggested Hooks:\n  - ${hooksBlock}` : ''}

═══ FULL TRANSCRIPT ═══
${transcriptBlock}

═══ REQUIREMENTS ═══
Target platforms: ${platforms.join(', ')}
Content types to generate: ${requestedTypes.join(', ')}
${persona?.hasPortraits ? 'Include the persona/creator in image prompts where appropriate.' : ''}

Generate exactly 5 posts. For each post, return this JSON structure:

{
  "posts": [
    {
      "contentType": "carousel|single|reel|story|thread|quote",
      "title": "Compelling title for the dashboard (based on actual content)",
      "transcriptQuote": "An exact or closely paraphrased quote from the transcript that this post is built around",
      "hook": "The opening line — must reference the transcript quote or a specific video insight",
      "platformCopy": {
        "<platform>": {
          "caption": "Full platform-optimized caption with formatting, emojis where appropriate",
          "hashtags": ["relevant", "hashtags", "without-hash-symbol"],
          "cta": "Platform-specific call to action"
        }
      },
      "carouselSlides": [
        {
          "slideNumber": 1,
          "headline": "Slide headline",
          "body": "Slide body text",
          "visualPrompt": "Detailed image generation prompt for this specific slide (50+ words)"
        }
      ],
      "imagePrompt": "Detailed AI image generation prompt (50+ words). Include style, composition, lighting, mood, colors${brand?.colors?.primary?.length ? `, incorporating brand colors ${brand.colors.primary.join(' and ')}` : ''}${persona?.hasPortraits ? ', featuring the creator/persona from reference images' : ''}",
      "imageStyle": "photorealistic|modern|minimalist|bold|artistic|editorial",
      "imageDimensions": "1080x1350 for carousel/single, 1920x1080 for reel/story",
      "engagement": {
        "whyItWorks": "Specific reason tied to the actual content and audience psychology",
        "targetAudience": "Who specifically will engage with this and why",
        "bestTimeToPost": "Day and time recommendation",
        "estimatedReach": "viral|high|medium|targeted"
      }
    }
  ]
}

IMPORTANT:
- Only include "carouselSlides" for carousel type posts. Omit for other types.
- Include a platformCopy entry for each of these platforms: ${platforms.join(', ')}
- Each caption must respect platform character limits (Twitter: 280, Instagram: 2200, LinkedIn: 3000, Facebook: 2200).
- Mix up the content types. Don't make all 5 the same type.
- Every "transcriptQuote" must be a real phrase from the transcript above.`

    // ── Call GPT-5.2 Responses API ─────────────────────────────────────────

    console.log('[AdvancedPostsService] Calling GPT-5.2 with', {
      transcriptLength: transcriptBlock.length,
      platforms,
      hasBrand: !!brand,
      hasPersona: !!persona,
      contentTypes: requestedTypes
    })

    const response = await openai.responses.create({
      model: this.MODEL,
      input: userPrompt,
      instructions,
      reasoning: { effort: 'medium' },
      text: { format: { type: 'json_object' } },
      max_output_tokens: 6000
    })

    const outputText = extractOutputText(response)

    let parsed: { posts: GeneratedPost[] }
    try {
      parsed = JSON.parse(outputText)
    } catch (parseError) {
      console.error('[AdvancedPostsService] Failed to parse GPT response:', outputText.substring(0, 200))
      throw new Error('Failed to parse AI response as JSON')
    }

    if (!parsed.posts || !Array.isArray(parsed.posts)) {
      throw new Error('AI response missing "posts" array')
    }

    console.log('[AdvancedPostsService] Generated', parsed.posts.length, 'posts')

    return parsed.posts
  }

  /**
   * Generate a Content Brief that ties all downstream content together.
   * Called once after content analysis, stored on the project.
   */
  static async generateContentBrief(
    transcript: string,
    contentAnalysis: ContentAnalysisContext,
    brand?: BrandContext,
    persona?: PersonaContext | null
  ): Promise<ContentBrief> {
    const openai = getOpenAI()

    const transcriptBlock = transcript.substring(0, 6000)

    let brandBlock = ''
    if (brand) {
      const parts: string[] = []
      if (brand.companyName) parts.push(`Company: ${brand.companyName}`)
      if (brand.voice) parts.push(`Voice: ${brand.voice}`)
      if (brand.targetAudience?.description) parts.push(`Audience: ${brand.targetAudience.description}`)
      if (brand.contentGoals?.length) parts.push(`Goals: ${brand.contentGoals.join(', ')}`)
      if (brand.mission) parts.push(`Mission: ${brand.mission}`)
      brandBlock = `\nBRAND:\n${parts.join('\n')}`
    }

    let personaBlock = ''
    if (persona) {
      personaBlock = `\nPERSONA: ${persona.name}${persona.description ? ` - ${persona.description}` : ''}`
    }

    const instructions = `You are a content strategist. Create a concise Content Brief that will align ALL downstream content (blog posts, social posts, captions, thumbnails) around the same narrative.

The brief must be grounded in real content from the transcript.${brandBlock}${personaBlock}

Return a JSON object with these exact keys:
- coreNarrative: 1-2 sentence summary of the key message
- primaryTheme: The main topic/theme
- keyTakeaways: Array of 3-5 specific, quotable takeaways
- transcriptHighlights: Array of 3-5 of the best actual quotes from the transcript (exact words)
- targetAudience: Who this content is for
- toneGuidance: How all content should sound (be specific)
- visualDirection: Consistent visual style for images/thumbnails
- cta: What the creator wants the audience to do`

    const input = `Create a Content Brief for this video content.

TOPICS: ${contentAnalysis.topics?.join(', ') || 'N/A'}
KEY POINTS: ${contentAnalysis.keyPoints?.join(', ') || 'N/A'}
SENTIMENT: ${contentAnalysis.sentiment || 'neutral'}
SUMMARY: ${contentAnalysis.summary || ''}

TRANSCRIPT:
${transcriptBlock}`

    console.log('[AdvancedPostsService] Generating content brief...')

    const response = await openai.responses.create({
      model: this.MODEL,
      input,
      instructions,
      reasoning: { effort: 'medium' },
      text: { format: { type: 'json_object' } },
      max_output_tokens: 1500,
    })

    const outputText = extractOutputText(response)
    const brief = JSON.parse(outputText) as ContentBrief

    console.log('[AdvancedPostsService] Content brief generated:', brief.primaryTheme)

    return brief
  }
}
