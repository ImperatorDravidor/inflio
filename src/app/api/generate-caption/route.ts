import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StagingService } from '@/lib/staging/staging-service'
import { withAIErrorHandling, getAIFallback, validateAIResponse } from '@/lib/ai-error-handler'
import { handleError, AppError } from '@/lib/error-handler'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'

// Request validation schema
const requestSchema = z.object({
  content: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(['video', 'image', 'text', 'carousel']),
    duration: z.number().optional(),
    thumbnail: z.string().optional()
  }),
  platform: z.string(),
  projectContext: z.string().optional()
})

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

    const { content, platform, projectContext } = validationResult.data

    // Generate caption with error handling and retry logic
    const result = await withAIErrorHandling(
      async () => {
        const openai = getOpenAI()
        
        // Platform-specific constraints
        const platformConstraints = {
          instagram: { maxLength: 2200, tone: 'casual, emoji-rich', hashtags: 5 },
          'instagram-reel': { maxLength: 2200, tone: 'engaging, hook-focused', hashtags: 8 },
          'instagram-story': { maxLength: 100, tone: 'brief, casual', hashtags: 0 },
          x: { maxLength: 280, tone: 'concise, witty', hashtags: 2 },
          linkedin: { maxLength: 3000, tone: 'professional', hashtags: 3 },
          youtube: { maxLength: 5000, tone: 'descriptive, SEO-focused', hashtags: 15 },
          'youtube-short': { maxLength: 5000, tone: 'engaging, fast-paced', hashtags: 10 },
          tiktok: { maxLength: 2200, tone: 'trendy, Gen-Z friendly', hashtags: 8 },
          facebook: { maxLength: 63206, tone: 'conversational', hashtags: 5 },
          threads: { maxLength: 500, tone: 'conversational, authentic', hashtags: 3 }
        }

        const constraints = platformConstraints[platform as keyof typeof platformConstraints] || 
                           { maxLength: 1000, tone: 'engaging', hashtags: 5 }

        const systemPrompt = `You are an expert social media content creator specializing in ${platform}.
        
        Platform constraints:
        - Maximum caption length: ${constraints.maxLength} characters
        - Tone: ${constraints.tone}
        - Hashtags: ${constraints.hashtags} relevant hashtags
        
        Content context: ${projectContext || 'General content'}
        
        Create engaging, platform-optimized content that maximizes reach and engagement.`

        const userPrompt = `Generate a ${platform} caption for this content:
        
        Title: ${content.title}
        Type: ${content.type}
        ${content.description ? `Description: ${content.description}` : ''}
        ${content.duration ? `Duration: ${content.duration} seconds` : ''}
        
        Requirements:
        1. Hook the audience in the first line
        2. Include a clear call-to-action
        3. Use platform-appropriate language and emojis
        4. Suggest ${constraints.hashtags} trending and relevant hashtags
        5. Keep within ${constraints.maxLength} characters
        
        Return JSON in this format:
        {
          "caption": "The actual caption text",
          "hashtags": ["hashtag1", "hashtag2"],
          "cta": "The call-to-action text",
          "hook": "The attention-grabbing first line"
        }`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 1000,
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
            hook: 'string'
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
        }

        // Ensure caption fits within limits
        if (typedResponse.caption.length > constraints.maxLength) {
          typedResponse.caption = typedResponse.caption.substring(0, constraints.maxLength - 3) + '...'
        }

        // Clean and limit hashtags
        typedResponse.hashtags = typedResponse.hashtags
          .slice(0, constraints.hashtags)
          .map((tag: string) => tag.replace(/^#/, '').trim())
          .filter((tag: string) => tag.length > 0)

        return typedResponse
      },
      {
        maxRetries: 2,
        context: `generate-caption-${platform}`,
        fallbackBehavior: 'default'
      }
    )

    // If AI fails, use fallback
    if (!result) {
      const fallback = getAIFallback('caption', { 
        title: content.title, 
        description: content.description 
      })
      
      const fallbackCaption = fallback[platform] || fallback.instagram
      const fallbackHashtags = getAIFallback('hashtags')[platform] || 
                               getAIFallback('hashtags').default

      return NextResponse.json({
        caption: fallbackCaption,
        hashtags: fallbackHashtags.slice(0, 5),
        cta: 'Check it out!',
        hook: content.title,
        isFallback: true
      })
    }

    // Track usage for analytics
    // await trackAIUsage(userId, 'caption_generation', platform)

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

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
} 