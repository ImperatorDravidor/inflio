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
    const { suggestionId, feedback } = body

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      )
    }

    const result = await PostsService.regenerateSuggestion(suggestionId, feedback)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate suggestion' },
      { status: 500 }
    )
  }
}