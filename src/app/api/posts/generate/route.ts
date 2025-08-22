import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PostsService } from '@/lib/services/posts-service'

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
      platforms
    } = body

    if (!projectId || !projectTitle) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      )
    }

    const result = await PostsService.generatePostSuggestions({
      projectId,
      contentAnalysis,
      transcript,
      projectTitle,
      personaId,
      contentTypes,
      platforms
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Posts generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate post suggestions' },
      { status: 500 }
    )
  }
}