import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return a response that the client can use to reset localStorage
    // In production, this should update a database record
    return NextResponse.json({
      success: true,
      action: 'reset_usage',
      message: 'Usage reset instructions sent',
      resetData: {
        used: 0,
        limit: 100, // Giving you pro limit for testing
        plan: 'pro',
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }
    })
  } catch (error) {
    console.error('[Reset Usage] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset usage' },
      { status: 500 }
    )
  }
} 