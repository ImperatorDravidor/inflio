import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ThreadGenerator, type ThreadGenerationOptions } from '@/lib/thread-generator'
import { z } from 'zod'

// Request validation schema
const generateThreadSchema = z.object({
  content: z.string().min(100, 'Content must be at least 100 characters'),
  title: z.string().min(1, 'Title is required'),
  platform: z.enum(['twitter', 'linkedin']),
  tone: z.enum(['professional', 'casual', 'educational', 'inspiring']).optional(),
  includeHashtags: z.boolean().optional(),
  maxSegments: z.number().min(1).max(50).optional(),
  includeCTA: z.boolean().optional(),
  ctaText: z.string().optional(),
  targetAudience: z.string().optional()
})

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateThreadSchema.parse(body)

    // Generate thread
    const thread = await ThreadGenerator.generateThread(
      validatedData.content,
      validatedData.title,
      {
        platform: validatedData.platform,
        tone: validatedData.tone,
        includeHashtags: validatedData.includeHashtags,
        maxSegments: validatedData.maxSegments,
        includeCTA: validatedData.includeCTA,
        ctaText: validatedData.ctaText,
        targetAudience: validatedData.targetAudience
      } as ThreadGenerationOptions
    )

    // Optimize the thread
    const optimizedThread = ThreadGenerator.optimizeThread(thread)

    return NextResponse.json({
      success: true,
      thread: optimizedThread,
      preview: ThreadGenerator.generatePreview(optimizedThread)
    })
  } catch (error) {
    console.error('Thread generation API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate thread' },
      { status: 500 }
    )
  }
} 