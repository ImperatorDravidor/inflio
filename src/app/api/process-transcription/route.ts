import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'
import { TranscriptionService } from '@/lib/transcription-service'
import { auth } from '@clerk/nextjs/server'
import { processTranscription } from '@/lib/transcription-processor'

// Extend timeout for transcription processing
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

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
    const format = searchParams.get('format')

    if (!projectId || !format) {
      return NextResponse.json(
        { error: 'Missing projectId or format parameter' },
        { status: 400 }
      )
    }

    const project = await ProjectService.getProject(projectId)
    if (!project?.transcription) {
      return NextResponse.json(
        { error: 'No transcription found for this project' },
        { status: 404 }
      )
    }

    if (format === 'txt') {
      // Return plain text transcript
      return new NextResponse(project.transcription.text, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${project.title}-transcript.txt"`
        }
      })
    }

    // Return formatted subtitles (SRT or VTT)
    const formatted = TranscriptionService.formatSubtitles(
      project.transcription.segments,
      format as 'srt' | 'vtt'
    )

    return new NextResponse(formatted, {
      headers: {
        'Content-Type': format === 'vtt' ? 'text/vtt' : 'text/plain',
        'Content-Disposition': `attachment; filename="${project.title}-subtitles.${format}"`
      }
    })
  } catch (error) {
    console.error('GET transcription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve transcription' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    projectId,
    videoUrl,
    language
  }: {
    projectId: string
    videoUrl: string
    language?: string
  } = await request.json()

  if (!projectId || !videoUrl) {
    return NextResponse.json(
      { error: 'Missing required fields: projectId, videoUrl' },
      { status: 400 }
    )
  }

  try {
    const result = await processTranscription({
      projectId,
      videoUrl,
      language: language || 'en',
      userId
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error(`[Transcription API] Error:`, error)
    return NextResponse.json(
      { 
        error: 'Failed to process transcription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}