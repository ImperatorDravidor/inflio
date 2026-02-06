import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StagingService } from '@/lib/staging/staging-service'
import { withAIErrorHandling, getAIFallback, validateAIResponse } from '@/lib/ai-error-handler'
import { handleError, AppError } from '@/lib/error-handler'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SafeJsonParser } from '@/lib/safe-json'
import { extractOutputText } from '@/lib/ai-posts-advanced'
import { fetchBrandAndPersonaContext } from '@/lib/ai-context'
import type { BrandContext } from '@/lib/ai-context'

// Request validation schema - updated to accept more context
const requestSchema = z.object({
  content: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(['clip', 'blog', 'image', 'carousel']),
    duration: z.number().optional(),
    thumbnail: z.string().optional(),
    // Additional context fields
    score: z.number().optional(), // Virality score
    scoreReasoning: z.string().optional(),
    transcript: z.string().optional(),
    sentiment: z.string().optional(),
    analytics: z.any().optional(),
    originalData: z.any().optional()
  }),
  platform: z.string(),
  projectContext: z.string().optional(),
  projectId: z.string().optional()
})

// Platform-specific constraints type
interface PlatformConstraint {
  maxLength: number
  tone: string
  hashtags: number
  notes?: string
}

export async function POST(request: NextRequest) {
  // Early check for API key configuration
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('OpenAI API key not configured')
    return NextResponse.json(
      { 
        error: 'AI features are not configured. Please contact your administrator to set up OpenAI API access.',
        details: 'OPENAI_API_KEY is missing or not configured'
      },
      { status: 503 }
    )
  }
  
  try {
    // Auth check
    let userId
    try {
      const authResult = await auth()
      userId = authResult?.userId
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      )
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use AI features.' },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { content, platform, projectContext, projectId } = validationResult.data

    // Fetch additional project context if projectId is provided
    let enrichedProjectContext = projectContext || ''
    let contentAnalysis: any = null
    let contentBrief: any = null
    
    if (projectId) {
      try {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('title, description, content_analysis, transcription, content_brief')
          .eq('id', projectId)
          .single()
        
        if (project) {
          enrichedProjectContext = `Project: ${project.title}. ${project.description || ''}`
          contentAnalysis = project.content_analysis
          contentBrief = project.content_brief
        }
      } catch (error) {
        console.error('Error fetching project context:', error)
      }
    }

    // Fetch brand + persona context
    let brand: BrandContext | undefined
    if (userId) {
      const ctx = await fetchBrandAndPersonaContext(userId)
      brand = ctx.brand
    }

    // Generate caption with error handling and retry logic
    const result = await withAIErrorHandling(
      async () => {
        let openai
        try {
          openai = getOpenAI()
        } catch (error) {
          console.error('OpenAI initialization error:', error)
          throw new AppError('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.', 'OPENAI_CONFIG_ERROR', 503)
        }
        
        // Platform-specific constraints
        const platformConstraints: Record<string, PlatformConstraint> = {
          instagram: {
            maxLength: 2200,
            tone: 'casual, emoji-rich',
            hashtags: 10,
            notes: 'Front-load key message into first 125 characters. Visible preview before "more" is ~125 chars.'
          },
          'instagram-reel': {
            maxLength: 2200,
            tone: 'engaging, hook-focused',
            hashtags: 10,
            notes: 'Front-load key message into first 125 characters.'
          },
          'instagram-story': {
            maxLength: 100,
            tone: 'brief, casual',
            hashtags: 5
          },
          x: {
            maxLength: 280,
            tone: 'concise, witty',
            hashtags: 2,
            notes: 'Count emojis and CJK glyphs as 2 characters each. URLs always count as 23 characters due to t.co wrapping.'
          },
          linkedin: {
            maxLength: 1300,
            tone: 'professional',
            hashtags: 3
          },
          linkedin_company: {
            maxLength: 700,
            tone: 'professional',
            hashtags: 3,
            notes: 'Company page update limit is 700 characters.'
          },
          youtube: {
            maxLength: 5000,
            tone: 'descriptive, SEO-focused',
            hashtags: 8,
            notes: 'Key info ideally in the first 157 characters. Title should be ≤100 characters.'
          },
          'youtube-short': {
            maxLength: 100,
            tone: 'engaging, fast-paced',
            hashtags: 5,
            notes: 'Shorts caption/hashtags limited to ~100 characters total.'
          },
          tiktok: {
            maxLength: 2200,
            tone: 'trendy, Gen-Z friendly',
            hashtags: 8
          },
          facebook: {
            maxLength: 63206,
            tone: 'conversational',
            hashtags: 5,
            notes: 'For ads: primary text ~125 chars, headline ~40, link description ~30.'
          },
          threads: {
            maxLength: 500,
            tone: 'conversational, authentic',
            hashtags: 3
          }
        }

        const constraints: PlatformConstraint = platformConstraints[platform as keyof typeof platformConstraints] || 
                           { maxLength: 1000, tone: 'engaging', hashtags: 5 }

        // Build comprehensive context for AI
        const contextDetails = {
          contentType: content.type,
          title: content.title,
          description: content.description,
          duration: content.duration,
          viralityScore: content.score,
          viralityReasoning: content.scoreReasoning,
          sentiment: content.sentiment,
          projectContext: enrichedProjectContext,
          contentAnalysis: contentAnalysis ? {
            keywords: contentAnalysis.keywords?.slice(0, 10),
            topics: contentAnalysis.topics?.slice(0, 5),
            summary: contentAnalysis.summary,
            keyMoments: contentAnalysis.keyMoments?.slice(0, 3)
          } : null,
          transcript: content.transcript ? content.transcript.substring(0, 500) : null
        }

        // Build brand context block
        let brandBlock = ''
        if (brand) {
          const parts: string[] = []
          if (brand.voice) parts.push(`Brand voice: ${brand.voice}`)
          if (brand.companyName) parts.push(`Brand: ${brand.companyName}`)
          if (brand.targetAudience?.description) parts.push(`Target audience: ${brand.targetAudience.description}`)
          if (brand.contentGoals?.length) parts.push(`Goals: ${brand.contentGoals.join(', ')}`)
          if (parts.length > 0) brandBlock = `\n\nBRAND IDENTITY:\n${parts.join('\n')}`
        }

        // Content brief alignment
        let briefBlock = ''
        if (contentBrief) {
          const parts: string[] = []
          if (contentBrief.toneGuidance) parts.push(`Tone: ${contentBrief.toneGuidance}`)
          if (contentBrief.cta) parts.push(`Align CTA with: ${contentBrief.cta}`)
          if (contentBrief.targetAudience) parts.push(`Audience: ${contentBrief.targetAudience}`)
          if (parts.length > 0) briefBlock = `\n\nCONTENT BRIEF:\n${parts.join('\n')}`
        }

        const systemPrompt = `You are an expert social media content creator specializing in ${platform}.

Platform constraints:
- Maximum caption length: ${constraints.maxLength} characters
- Default tone: ${constraints.tone}
- Hashtags: ${constraints.hashtags} relevant hashtags
${constraints.notes ? `- Special rules: ${constraints.notes}` : ''}
${brandBlock}
${briefBlock}

Create highly engaging, platform-optimized captions. Match the brand voice and speak to the target audience.`

        const userPrompt = `Generate a ${platform} caption for this content:

${JSON.stringify(contextDetails, null, 2)}

Requirements:
1. Hook the audience in the first line
2. Match the brand voice and tone${brand?.voice ? ` (${brand.voice})` : ''}
3. Include a compelling call-to-action
4. Use platform-appropriate language and emojis
5. Generate ${constraints.hashtags} relevant hashtags
6. Keep within ${constraints.maxLength} characters
7. If virality score is high (>7), emphasize what makes it engaging
8. Reference keywords and topics for SEO

Return JSON:
{
  "caption": "Platform-optimized caption matching brand voice",
  "hashtags": ["relevant1", "trending2", "niche3"],
  "cta": "Call-to-action text",
  "hook": "Attention-grabbing first line",
  "suggestions": {
    "tip": "Specific tip for ${platform}",
    "optimalPostTime": "Best posting time"
  }
}`

        let parsed: any
        try {
          const response = await openai.responses.create({
            model: 'gpt-5.2',
            input: userPrompt,
            instructions: systemPrompt,
            reasoning: { effort: 'low' },
            text: { format: { type: 'json_object' } },
            max_output_tokens: 1000,
          })

          const outputText = extractOutputText(response)
          parsed = JSON.parse(outputText)
        } catch (apiError: any) {
          console.error('OpenAI API error:', apiError)

          if (apiError?.status === 401) {
            throw new AppError('Invalid OpenAI API key. Please check your configuration.', 'OPENAI_AUTH_ERROR', 401)
          } else if (apiError?.status === 429) {
            throw new AppError('OpenAI rate limit exceeded. Please try again later.', 'OPENAI_RATE_LIMIT', 429)
          } else if (apiError?.status === 500 || apiError?.status === 503) {
            throw new AppError('OpenAI service temporarily unavailable. Please try again.', 'OPENAI_SERVICE_ERROR', 503)
          } else if (apiError?.code === 'ENOTFOUND' || apiError?.code === 'ECONNREFUSED') {
            throw new AppError('Cannot connect to OpenAI. Please check your internet connection.', 'NETWORK_ERROR', 503)
          } else {
            throw new AppError(
              apiError?.message || 'Failed to generate content with AI',
              'OPENAI_ERROR',
              500
            )
          }
        }
        
        // Validate and extract AI response safely
        const caption = SafeJsonParser.get(parsed, 'caption', 'No caption generated.')
        const hashtags = SafeJsonParser.get(parsed, 'hashtags', [])
        const cta = SafeJsonParser.get(parsed, 'cta', 'Read more.')
        const hook = SafeJsonParser.get(parsed, 'hook', '')
        const suggestions = SafeJsonParser.get(parsed, 'suggestions', { tip: 'Review and edit before posting.' })

        // Basic validation after safe extraction
        if (typeof caption !== 'string' || !Array.isArray(hashtags)) {
          console.error('Core AI response fields are invalid', { caption, hashtags })
          throw new Error('Invalid core AI response format')
        }

        // Type assertion after validation
        const typedResponse = {
          caption: caption as string,
          hashtags: hashtags as string[],
          cta: cta as string | undefined,
          hook: hook as string | undefined,
          suggestions: suggestions as { tip?: string; optimalPostTime?: string } | undefined,
        }

        // Ensure caption fits within limits
        if (typedResponse.caption.length > constraints.maxLength) {
          typedResponse.caption = typedResponse.caption.substring(0, constraints.maxLength - 3) + '...'
        }

        // Clean and limit hashtags
        typedResponse.hashtags = typedResponse.hashtags
          .slice(0, constraints.hashtags)
          .map((tag: string) => tag.replace(/^#/, '').trim())
          .filter((tag: string) => tag.length > 0 && tag.length <= 30) // Max hashtag length

        return typedResponse
      },
      {
        maxRetries: 2,
        context: `generate-caption-${platform}`,
        fallbackBehavior: 'default'
      }
    )

    // If AI fails, use enhanced fallback
    if (!result) {
      const fallback = getEnhancedFallback(content, platform, contentAnalysis)
      return NextResponse.json({
        ...fallback,
        isFallback: true
      })
    }

    return NextResponse.json(result)
    
  } catch (error) {
    handleError(error, 'generate-caption')
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    )
  }
}

// Enhanced fallback that uses content context
function getEnhancedFallback(content: any, platform: string, contentAnalysis: any) {
  const viralityLevel = content.score > 7 ? 'high' : content.score > 5 ? 'medium' : 'low'
  
  const fallbackTemplates: Record<string, any> = {
    instagram: {
      clip: {
        high: `🔥 This is INCREDIBLE! ${content.title}\n\nYou won't believe what happens next... 👀\n\nSave this for later! 📌`,
        medium: `✨ ${content.title}\n\nWhat are your thoughts on this? Let me know below! 👇`,
        low: `Check out: ${content.title}\n\nWould love your feedback! 💭`
      }
    },
    linkedin: {
      clip: {
        high: `🎯 Game-changing insights: ${content.title}\n\nKey takeaways that will transform your perspective...\n\nWhat's your experience with this?`,
        medium: `Sharing valuable insights: ${content.title}\n\nInterested in your professional thoughts on this topic.`,
        low: `${content.title}\n\nLooking forward to community insights.`
      }
    },
    x: {
      clip: {
        high: `🚨 THIS. ${content.title}\n\nThread below 🧵👇`,
        medium: `${content.title}\n\nThoughts? 💭`,
        low: `${content.title}`
      }
    }
  }

  const platformFallback = fallbackTemplates[platform]?.[content.type]?.[viralityLevel] || 
                          `${content.title}\n\nCheck this out!`

  // Generate hashtags based on keywords
  const hashtags = contentAnalysis?.keywords?.slice(0, 5).map((k: string) => k.toLowerCase().replace(/\s+/g, '')) || 
                   ['content', 'video', 'trending']

  return {
    caption: platformFallback,
    hashtags,
    cta: 'Let me know what you think!',
    hook: content.title,
    suggestions: {
      tip: `This content has a ${viralityLevel} virality score. ${viralityLevel === 'high' ? 'Post during peak hours!' : 'Consider A/B testing different captions.'}`,
      optimalPostTime: viralityLevel === 'high' ? 'Peak hours (9am, 12pm, 5pm)' : 'Standard hours'
    }
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
} 