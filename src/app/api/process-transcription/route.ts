import { NextRequest, NextResponse } from 'next/server'
import { TranscriptionService } from '@/lib/transcription-service'
import { ProjectService } from '@/lib/db-migration'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId, videoUrl, language = 'en' } = await request.json()

    if (!projectId || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, videoUrl' },
        { status: 400 }
      )
    }

    // Get project to verify ownership
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Update task progress
    await ProjectService.updateTaskProgress(projectId, 'transcription', 10, 'processing')

    try {
      // Transcribe the video using Whisper API
      const transcription = await TranscriptionService.transcribeFromUrl(videoUrl, {
        language,
        onProgress: async (message) => {
          // Update progress based on message
          const progress = message.includes('Downloading') ? 20 :
                          message.includes('Sending') ? 40 :
                          message.includes('Processing') ? 80 :
                          message.includes('completed') ? 95 : 50
          
          await ProjectService.updateTaskProgress(projectId, 'transcription', progress, 'processing')
        }
      })

      // Store transcription in project
      await ProjectService.updateProject(projectId, {
        transcription: transcription
      })

      // Mark task as completed
      await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')

      return NextResponse.json({
        success: true,
        transcription,
        segmentCount: transcription.segments.length,
        duration: transcription.duration
      })
    } catch (error) {
      console.error('Transcription processing error:', error)
      
      // Update task status to failed
      await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
      
      throw error
    }
  } catch (error) {
    console.error('Transcription API error:', error)
    
    // Try to update task status to failed if projectId is available
    const body = await request.json().catch(() => ({}))
    if (body.projectId) {
      await ProjectService.updateTaskProgress(body.projectId, 'transcription', 0, 'failed')
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe video' },
      { status: 500 }
    )
  }
}

// Download subtitles in different formats
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const format = searchParams.get('format') as 'srt' | 'vtt' | 'txt' || 'srt'

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      )
    }

    // Get project
    const project = await ProjectService.getProject(projectId)
    if (!project || !project.transcription) {
      return NextResponse.json(
        { error: 'Project or transcription not found' },
        { status: 404 }
      )
    }

    let content: string
    let contentType: string
    let filename: string

    if (format === 'txt') {
      // Plain text format
      content = project.transcription.text
      contentType = 'text/plain'
      filename = `${project.title}-transcript.txt`
    } else {
      // Subtitle format (SRT or VTT)
      content = TranscriptionService.formatSubtitles(
        project.transcription.segments,
        format
      )
      contentType = format === 'vtt' ? 'text/vtt' : 'text/plain'
      filename = `${project.title}-subtitles.${format}`
    }

    // Return file download response
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Subtitle download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download subtitles' },
      { status: 500 }
    )
  }
} 