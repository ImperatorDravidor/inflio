import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { FALService } from '@/lib/services/fal-ai-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isConfigured = FALService.isConfigured()
    
    return NextResponse.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'FAL.ai is properly configured' 
        : 'FAL_API_KEY is not set in environment variables'
    })
  } catch (error) {
    console.error('Configuration check error:', error)
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    )
  }
}
