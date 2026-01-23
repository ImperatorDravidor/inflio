import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ImprovedPostsService } from '@/lib/services/posts-service-improved'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      projectTitle,
      contentAnalysis,
      transcript,
      personaId,
      contentTypes,
      platforms,
      settings
    } = body

    console.log('[API] Posts generation request:', {
      projectId,
      projectTitle,
      contentTypes,
      platforms,
      hasContentAnalysis: !!contentAnalysis,
      hasTranscript: !!transcript,
      personaId
    })

    if (!projectId || !projectTitle) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      )
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required for content-aware post generation' },
        { status: 400 }
      )
    }

    const result = await ImprovedPostsService.generatePostSuggestions({
      projectId,
      contentAnalysis,
      transcript,
      projectTitle,
      personaId,
      contentTypes,
      platforms,
      settings
    })

    console.log('[API] Posts generation successful:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Posts generation error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate post suggestions'
    const isSupabaseError = errorMessage.includes('post_generation_jobs') || errorMessage.includes('post_suggestions')
    
    if (isSupabaseError) {
      return NextResponse.json(
        { error: 'Database tables not found. Please run the posts feature migration.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}