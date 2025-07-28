import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ChapterGenerator, type ChapterGenerationOptions } from '@/lib/chapter-generator'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Request validation schema
const generateChaptersSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  style: z.enum(['descriptive', 'concise', 'engaging', 'keyword-focused']).optional(),
  minChapterDuration: z.number().min(10).max(300).optional(),
  maxChapters: z.number().min(3).max(50).optional(),
  includeIntro: z.boolean().optional(),
  targetPlatform: z.enum(['youtube', 'vimeo', 'generic']).optional()
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
    const validatedData = generateChaptersSchema.parse(body)

    // Get project data
    const supabase = createSupabaseServerClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, transcription_data')
      .eq('id', validatedData.projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project belongs to user
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if transcription exists
    if (!project.transcription_data || !project.transcription_data.segments) {
      return NextResponse.json(
        { error: 'No transcription found. Please generate a transcript first.' },
        { status: 400 }
      )
    }

    // Get video duration
    const videoDuration = project.duration || 0
    if (videoDuration === 0) {
      return NextResponse.json(
        { error: 'Invalid video duration' },
        { status: 400 }
      )
    }

    // Generate chapters
    const chapters = await ChapterGenerator.generateChapters(
      project.transcription_data.segments,
      videoDuration,
      project.title,
      {
        style: validatedData.style,
        minChapterDuration: validatedData.minChapterDuration,
        maxChapters: validatedData.maxChapters,
        includeIntro: validatedData.includeIntro,
        targetPlatform: validatedData.targetPlatform
      } as ChapterGenerationOptions
    )

    // Validate chapters for the platform
    const validation = ChapterGenerator.validateChapters(
      chapters.chapters,
      validatedData.targetPlatform || 'youtube'
    )

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Generated chapters are invalid', details: validation.errors },
        { status: 400 }
      )
    }

    // Store chapters in the database
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        chapters: chapters.chapters,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.projectId)

    if (updateError) {
      console.error('Failed to save chapters:', updateError)
      return NextResponse.json(
        { error: 'Failed to save chapters' },
        { status: 500 }
      )
    }

    // Generate YouTube description
    const youtubeDescription = ChapterGenerator.generateYouTubeDescription(
      chapters.chapters,
      project.description
    )

    return NextResponse.json({
      success: true,
      chapters: chapters.chapters,
      totalChapters: chapters.totalChapters,
      youtubeDescription,
      validation
    })
  } catch (error) {
    console.error('Chapter generation API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate chapters' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing chapters
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    const { data: project, error } = await supabase
      .from('projects')
      .select('chapters, title, duration')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      chapters: project.chapters || [],
      title: project.title,
      duration: project.duration
    })
  } catch (error) {
    console.error('Get chapters error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve chapters' },
      { status: 500 }
    )
  }
} 