import { NextRequest, NextResponse } from 'next/server'
import { CloudVideoService } from '@/lib/cloud-video-service'
import { VideoProcessingService } from '@/lib/video-processing-service'
import { auth } from '@clerk/nextjs/server'

interface SubtitleSettings {
  fontSize: number
  fontFamily: string
  fontColor: string
  backgroundColor: string
  backgroundOpacity: number
  position: 'bottom' | 'center' | 'top'
  alignment: 'left' | 'center' | 'right'
  maxWordsPerLine: number
  strokeWidth?: number
  strokeColor?: string
  shadow?: boolean
  shadowColor?: string
  shadowBlur?: number
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
    const { projectId, videoUrl, segments, settings, burnSubtitles = false } = body

    if (!videoUrl || !segments || !Array.isArray(segments)) {
      return NextResponse.json(
        { error: 'Missing required fields: videoUrl and segments' },
        { status: 400 }
      )
    }

    // If burnSubtitles is true and FFmpeg is available, use VideoProcessingService
    if (burnSubtitles) {
      const ffmpegAvailable = await VideoProcessingService.checkFFmpegAvailable()
      
      if (ffmpegAvailable) {
        console.log('Using FFmpeg for subtitle burning')
        
        // Start the subtitle burning process
        const taskId = await VideoProcessingService.applySubtitlesToVideo(
          projectId,
          videoUrl,
          segments,
          settings
        )
        
        return NextResponse.json({
          taskId,
          status: 'processing',
          progress: 0,
          provider: 'ffmpeg',
          message: 'Subtitle burning in progress'
        })
      } else {
        console.log('FFmpeg not available, trying cloud providers')
      }
    }

    // Fall back to cloud providers or just generate VTT
    const videoService = new CloudVideoService()
    const provider = CloudVideoService.getActiveProvider()
    console.log(`Using video processing provider: ${provider}`)
    
    // Apply subtitles (this will just generate VTT if no cloud provider is configured)
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

// Check task status endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId parameter' },
        { status: 400 }
      )
    }

    // Check VideoProcessingService first
    let task = VideoProcessingService.getTaskStatus(taskId)
    
    if (!task) {
      // Check CloudVideoService
      const cloudTask = CloudVideoService.getTaskStatus(taskId)
      if (cloudTask) {
        task = cloudTask
      }
    }
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Get task status error:', error)
    return NextResponse.json(
      { error: 'Failed to get task status' },
      { status: 500 }
    )
  }
}

 