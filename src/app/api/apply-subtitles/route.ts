import { NextRequest, NextResponse } from 'next/server'
import { CloudVideoService } from '@/lib/cloud-video-service'
import { auth } from '@clerk/nextjs/server'

interface SubtitleSettings {
  fontSize: number
  fontFamily: string
  fontColor: string
  backgroundColor: string
  position: 'bottom' | 'center' | 'top'
  alignment: 'left' | 'center' | 'right'
  maxWordsPerLine: number
}

interface TranscriptionSegment {
  id: string
  text: string
  start: number
  end: number
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, videoUrl, segments, settings } = body

    if (!videoUrl || !segments || !Array.isArray(segments)) {
      return NextResponse.json(
        { error: 'Missing required fields: videoUrl and segments' },
        { status: 400 }
      )
    }

    // Create instance of CloudVideoService
    const videoService = new CloudVideoService()
    
    // Check which provider is active
    const provider = CloudVideoService.getActiveProvider()
    console.log(`Using video processing provider: ${provider}`)
    
    // Apply subtitles
    const result = await videoService.applySubtitles(videoUrl, segments, projectId, settings)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Apply subtitles error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    )
  }
}

 