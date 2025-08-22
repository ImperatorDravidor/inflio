import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PostsService } from '@/lib/services/posts-service'

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { suggestionId, platform, updates } = body

    if (!suggestionId || !platform || !updates) {
      return NextResponse.json(
        { error: 'Suggestion ID, platform, and updates are required' },
        { status: 400 }
      )
    }

    const result = await PostsService.updatePostCopy(
      suggestionId,
      platform as any,
      updates
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Update copy error:', error)
    return NextResponse.json(
      { error: 'Failed to update copy' },
      { status: 500 }
    )
  }
}