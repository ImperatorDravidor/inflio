import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CloudVideoService } from '@/lib/cloud-video-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sample transcript segments for testing
    const sampleSegments = [
      {
        start: 0.0,
        end: 3.5,
        text: "Welcome to this amazing video tutorial."
      },
      {
        start: 3.5,
        end: 7.2,
        text: "Today we'll learn about subtitle generation."
      },
      {
        start: 7.2,
        end: 11.0,
        text: "This feature makes your content more accessible."
      },
      {
        start: 11.0,
        end: 15.3,
        text: "Let's see how the subtitles look in action."
      }
    ]

    const videoService = new CloudVideoService()
    console.log('Testing subtitle generation with sample segments')
    
    // Test subtitle generation
    const result = await videoService.applySubtitles(
      'https://example.com/test-video.mp4', // Dummy URL for testing
      sampleSegments,
      'test-project-id'
    )

    return NextResponse.json({
      success: true,
      message: 'Subtitle test completed',
      result,
      sampleSegments,
      provider: CloudVideoService.getActiveProvider()
    })
  } catch (error) {
    console.error('Subtitle test error:', error)
    return NextResponse.json(
      { 
        error: 'Subtitle test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: CloudVideoService.getActiveProvider()
      },
      { status: 500 }
    )
  }
} 