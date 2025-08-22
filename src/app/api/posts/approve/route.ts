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
    const { suggestionId } = body

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      )
    }

    const result = await PostsService.approveSuggestion(suggestionId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json(
      { error: 'Failed to approve suggestion' },
      { status: 500 }
    )
  }
}