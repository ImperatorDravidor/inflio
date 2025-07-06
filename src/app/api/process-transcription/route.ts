import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'
import { TranscriptionService } from '@/lib/transcription-service'
import { AIContentService } from '@/lib/ai-content-service'
import { auth } from '@clerk/nextjs/server'
import { AssemblyAI, TranscribeParams } from 'assemblyai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { TranscriptionData } from '@/lib/project-types'

// Extend timeout for transcription processing
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

// Mock content analysis
const mockContentAnalysis = {
  keywords: ['introduction', 'key points', 'innovation', 'implementation', 'best practices'],
  topics: ['Content Creation', 'Innovation', 'Best Practices'],
  summary: 'This video provides an introduction to the topic, discusses key points including innovation and creativity.',
  sentiment: 'positive' as const,
  keyMoments: [
    { timestamp: 0, description: 'Introduction' },
    { timestamp: 15, description: 'Innovation discussion' },
    { timestamp: 20, description: 'Best practices' },
    { timestamp: 25, description: 'Examples' }
  ],
  contentSuggestions: {
    blogPostIdeas: ['Innovation and Creativity', 'Best Practices'],
    socialMediaHooks: ['Discover innovation!', 'Transform today!'],
    shortFormContent: ['3 key points', 'Innovation simple']
  },
  analyzedAt: new Date().toISOString()
}

// Mock transcription generator
function generateMockTranscription(videoUrl: string, language: string = 'en'): TranscriptionData {
  const mockSegments = [
    {
      id: 'seg-0',
      text: "Welcome to this video. Today we're going to explore some amazing content.",
      start: 0,
      end: 5,
      confidence: 0.98
    },
    {
      id: 'seg-1',
      text: "First, let's talk about the main topic and why it's important.",
      start: 5,
      end: 10,
      confidence: 0.95
    },
    {
      id: 'seg-2',
      text: "There are three key points we need to understand.",
      start: 10,
      end: 15,
      confidence: 0.97
    }
  ]

  return {
    text: mockSegments.map(s => s.text).join(' '),
    segments: mockSegments,
    language,
    duration: 15
  }
}

function getAssemblyAI() {
  return new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || ''
  })
}

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
    // Get project from database
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('title, tasks')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // --- Step 1: Transcription ---
    let transcription: TranscriptionData
    let isMock = false
    
    // Generate mock transcription
    const mockTranscription = generateMockTranscription(videoUrl, language || 'en')

    if (process.env.ASSEMBLYAI_API_KEY) {
      try {
        // Use AssemblyAI for transcription
        const assembly = getAssemblyAI()
        
        const params: TranscribeParams = { audio: videoUrl }
        const transcript = await assembly.transcripts.transcribe(params)

        if (transcript.status === 'error') {
          throw new Error(`AssemblyAI Error: ${transcript.error}`)
        }

        // Convert AssemblyAI format to our internal format
        transcription = {
          text: transcript.text || '',
          segments: transcript.words?.map((word, index) => ({
            id: `seg-${index}`,
            start: word.start / 1000,
            end: word.end / 1000,
            text: word.text,
            confidence: word.confidence
          })) || [],
          language: transcript.language_code || 'en',
          duration: transcript.audio_duration || 0
        }
      } catch (assemblyError) {
        console.error('AssemblyAI transcription failed:', assemblyError)
        transcription = mockTranscription // Fallback
        isMock = true
      }
    } else {
      transcription = mockTranscription
      isMock = true
    }

    // --- Step 2: AI Content Analysis ---
    
    let contentAnalysis = mockContentAnalysis
    let analysisError: string | null = null

    if (transcription.text && !isMock) {
      try {
        const aiAnalysis = await AIContentService.analyzeTranscript(transcription)
        contentAnalysis = {
          ...aiAnalysis,
          analyzedAt: new Date().toISOString()
        } as any // Type assertion to bypass strict type checking
      } catch (err) {
        console.error('AI content analysis failed:', err)
        analysisError = err instanceof Error ? err.message : 'Unknown error'
        contentAnalysis = mockContentAnalysis // Fallback
      }
    }

    // --- Step 3: Update Project ---
    
    await ProjectService.updateProject(projectId, {
      transcription,
      content_analysis: contentAnalysis,
      updated_at: new Date().toISOString()
    })

    await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')

    return NextResponse.json({
      success: true,
      transcription,
      contentAnalysis,
      mock: isMock,
      analysisError
    })
  } catch (error) {
    console.error(`[Transcription] Critical error for project ${projectId}:`, error)
    if (projectId) {
      await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
    }
    return NextResponse.json(
      { 
        error: 'Failed to process transcription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}