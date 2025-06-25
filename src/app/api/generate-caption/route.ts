import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StagingService } from '@/lib/staging/staging-service'
import { withAIErrorHandling, getAIFallback, validateAIResponse } from '@/lib/ai-error-handler'
import { handleError, AppError } from '@/lib/error-handler'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    let contentAnalysis = null
    
    if (projectId) {
      try {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('title, description, content_analysis, transcription')
          .eq('id', projectId)
          .single()
        
        if (project) {
          enrichedProjectContext = `Project: ${project.title}. ${project.description || ''}`
          contentAnalysis = project.content_analysis
        }
      } catch (error) {
        console.error('Error fetching project context:', error)
      }
    }

    // Generate caption with error handling and retry logic
    const result = await withAIErrorHandling(
      async () => {
        const openai = getOpenAI()
        
        // Platform-specific constraints
        const platformConstraints: Record<string, PlatformConstraint> = {
          instagram: {
            maxLength: 2200,
            tone: 'casual, emoji-rich',
            hashtags: 30,
            notes: 'Front-load key message into first 125 characters. Visible preview before "more" is ~125 chars.'
          },
          'instagram-reel': {
            maxLength: 2200,
            tone: 'engaging, hook-focused',
            hashtags: 30,
            notes: 'Front-load key message into first 125 characters.'
          },
          'instagram-story': {
            maxLength: 100,
            tone: 'brief, casual',
            hashtags: 15
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
            hashtags: 15,
            notes: 'Key info ideally in the first 157 characters. Title should be ≤100 characters.'
          },
          'youtube-short': {
            maxLength: 100,
            tone: 'engaging, fast-paced',
            hashtags: 10,
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

        const systemPrompt = `You are an expert social media content creator specializing in ${platform}.
        
Platform constraints:
- Maximum caption length: ${constraints.maxLength} characters
- Tone: ${constraints.tone}
- Hashtags: ${constraints.hashtags} relevant hashtags
${constraints.notes ? `- Special rules: ${constraints.notes}` : ''}
        
You have access to detailed content analysis including virality scores, sentiment analysis, and project context.
Your goal is to create highly engaging, platform-optimized captions that maximize reach and engagement.
Match the tonality and energy of the content based on the provided context.`

        const userPrompt = `Generate a ${platform} caption for this content:
        
${JSON.stringify(contextDetails, null, 2)}
        
Requirements:
1. Hook the audience in the first line based on the virality insights
2. Match the tone and energy indicated by the sentiment and virality score
3. Include a clear, compelling call-to-action
4. Use platform-appropriate language and emojis
5. Generate ${constraints.hashtags} highly relevant and trending hashtags
6. Keep within ${constraints.maxLength} characters
7. If virality score is high (>7), emphasize what makes it engaging
8. Use keywords and topics from content analysis for SEO optimization
9. Reference key moments or insights if available
        
Return JSON in this format:
{
  "caption": "The actual caption text that captures the essence and energy of the content",
  "hashtags": ["relevant1", "trending2", "niche3"],
  "cta": "The call-to-action text",
  "hook": "The attention-grabbing first line",
  "suggestions": {
    "tip": "Specific tip for this content on ${platform}",
    "optimalPostTime": "Best time to post based on content type"
  }
}`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-2025-04-14', // Using the same model as transcript analysis
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7, // Slightly lower for more consistent results
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        })

        const response = completion.choices[0].message.content
        if (!response) {
          throw new Error('No response from AI')
        }

        const parsed = JSON.parse(response)
        
        // Validate AI response
        if (!validateAIResponse(parsed, {
          required: ['caption', 'hashtags'],
          properties: {
            caption: 'string',
            hashtags: 'array',
            cta: 'string',
            hook: 'string',
            suggestions: 'object'
          }
        })) {
          throw new Error('Invalid AI response format')
        }

        // Type assertion after validation
        const typedResponse = parsed as {
          caption: string
          hashtags: string[]
          cta?: string
          hook?: string
          suggestions?: {
            tip?: string
            optimalPostTime?: string
          }
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