import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import OpenAI from 'openai'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const formData = await request.formData()
    const videoId = formData.get('videoId') as string
    const file = formData.get('file') as File
    
    if (!videoId || !file) {
      return NextResponse.json(
        { error: 'Missing videoId or file' },
        { status: 400 }
      )
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create temp file path
    tempFilePath = join(tmpdir(), `${videoId}-${Date.now()}.${file.name.split('.').pop()}`)
    await writeFile(tempFilePath, buffer)

    // Start timing
    const startTime = Date.now()

    // Call Whisper API
    const openai = getOpenAI()
    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, file.name),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    })

    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000

    // Extract segments from the response
    const segments = transcription.segments?.map((segment: {
      start: number;
      end: number;
      text: string;
    }) => ({
      startTime: segment.start,
      endTime: segment.end,
      text: segment.text
    })) || []

    // Create transcript response
    const transcript = {
      id: `transcript_${Date.now()}`,
      videoId,
      text: transcription.text,
      language: transcription.language || 'en',
      duration: transcription.duration,
      processingTime,
      segments
    }

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      transcript,
      message: 'Video transcribed successfully'
    })

  } catch (error) {
    console.error('Transcription error:', error)
    
    // Clean up temp file on error
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }

    return NextResponse.json(
      { error: 'Failed to transcribe video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId parameter' },
        { status: 400 }
      )
    }

    // Since we're not using a database anymore, return a not found error
    // In a real implementation, you would fetch from your preferred storage
    return NextResponse.json(
      { error: 'Transcript storage not implemented. Please implement your preferred storage solution.' },
      { status: 501 }
    )

  } catch (error) {
    console.error('Error fetching transcript:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    )
  }
} 