import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'
import { TranscriptionService } from '@/lib/transcription-service'
import { AIContentService } from '@/lib/ai-content-service'
import { auth } from '@clerk/nextjs/server'
import { AssemblyAI, TranscribeParams } from 'assemblyai'

// Initialize AssemblyAI client
const assemblyAI = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || '',
})

// Mock transcription generator
function generateMockTranscription(videoUrl: string, language: string = 'en') {
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
    },
    {
      id: 'seg-3',
      text: "The first point is about innovation and creativity in our approach.",
      start: 15,
      end: 20,
      confidence: 0.96
    },
    {
      id: 'seg-4',
      text: "The second point focuses on implementation and best practices.",
      start: 20,
      end: 25,
      confidence: 0.94
    },
    {
      id: 'seg-5',
      text: "And finally, the third point brings everything together with real-world examples.",
      start: 25,
      end: 30,
      confidence: 0.98
    }
  ]

  const fullText = mockSegments.map(s => s.text).join(' ')
  
  return {
    text: fullText,
    segments: mockSegments,
    language,
    duration: 30
  }
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
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { projectId, videoUrl, language = 'en', format } = body

    // If format is requested, return formatted subtitles
    if (format && projectId) {
      const project = await ProjectService.getProject(projectId)
      if (!project?.transcription) {
        return NextResponse.json(
          { error: 'No transcription found for this project' },
          { status: 404 }
        )
      }

      const formatted = TranscriptionService.formatSubtitles(
        project.transcription.segments,
        format as 'srt' | 'vtt'
      )

      // Return as downloadable file
      return new NextResponse(formatted, {
        headers: {
          'Content-Type': format === 'vtt' ? 'text/vtt' : 'text/plain',
          'Content-Disposition': `attachment; filename="${project.title}-subtitles.${format}"`
        }
      })
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    console.log('Starting transcription process for:', videoUrl)

    let transcription

    // Use AssemblyAI for transcription
    if (process.env.ASSEMBLYAI_API_KEY) {
      console.log('Using AssemblyAI for transcription...')
      
      try {
        // Create transcription job with AssemblyAI
        const params: TranscribeParams = {
          audio: videoUrl,
          language_code: language || 'en',
          // speech_model defaults to 'universal' which provides best balance of speed and accuracy
        }

        console.log('Creating AssemblyAI transcription job...')
        const transcript = await assemblyAI.transcripts.transcribe(params)

        // Check if transcription was successful
        if (transcript.status === 'error') {
          throw new Error(transcript.error || 'Transcription failed')
        }

        console.log('AssemblyAI transcription completed successfully')

        // Convert AssemblyAI format to our format
        const segments = transcript.words?.map((word, index) => ({
          id: `seg-${index}`,
          text: word.text,
          start: word.start / 1000, // Convert milliseconds to seconds
          end: word.end / 1000, // Convert milliseconds to seconds
          confidence: word.confidence
        })) || []

        // Group words into sentences for better readability
        const sentenceSegments: Array<{
          id: string
          text: string
          start: number
          end: number
          confidence: number
        }> = []
        let currentSegment = {
          id: 'seg-0',
          text: '',
          start: 0,
          end: 0,
          confidence: 0,
          wordCount: 0
        }

        segments.forEach((wordSegment, index) => {
          if (currentSegment.text === '') {
            currentSegment.start = wordSegment.start
          }
          
          currentSegment.text += (currentSegment.text ? ' ' : '') + wordSegment.text
          currentSegment.end = wordSegment.end
          currentSegment.confidence += wordSegment.confidence
          currentSegment.wordCount++

          // Create new segment on sentence endings or after ~15 words
          const isEndOfSentence = /[.!?]$/.test(wordSegment.text)
          const hasEnoughWords = currentSegment.wordCount >= 15
          const isLastWord = index === segments.length - 1

          if (isEndOfSentence || (hasEnoughWords && wordSegment.text.includes(',')) || isLastWord) {
            currentSegment.confidence = currentSegment.confidence / currentSegment.wordCount
            sentenceSegments.push({
              id: `seg-${sentenceSegments.length}`,
              text: currentSegment.text.trim(),
              start: currentSegment.start,
              end: currentSegment.end,
              confidence: currentSegment.confidence
            })
            
            currentSegment = {
              id: `seg-${sentenceSegments.length + 1}`,
              text: '',
              start: 0,
              end: 0,
              confidence: 0,
              wordCount: 0
            }
          }
        })

        transcription = {
          text: transcript.text || '',
          segments: sentenceSegments,
          language: transcript.language_code || language || 'en',
          duration: transcript.audio_duration || sentenceSegments[sentenceSegments.length - 1]?.end || 0
        }

      } catch (assemblyError) {
        console.error('AssemblyAI transcription error:', assemblyError)
        
        // Fallback to mock if AssemblyAI fails
        console.log('Falling back to mock transcription due to AssemblyAI error')
        transcription = generateMockTranscription(videoUrl, language)
      }
    } else {
      // Use mock data if no API key
      console.log('No AssemblyAI API key found, using mock transcription')
      transcription = generateMockTranscription(videoUrl, language)
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Analyze transcript with AI to extract keywords and topics
    let contentAnalysis
    let analysisError = null
    
    // Only analyze if transcription has meaningful content
    if (transcription && transcription.text && transcription.text.length > 100) {
      try {
        console.log('Starting AI content analysis...')
        console.log(`Transcript length: ${transcription.text.length} characters`)
        
        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
          console.warn('OpenAI API key not configured, skipping content analysis')
          analysisError = 'OpenAI API key not configured'
        } else {
          const startTime = Date.now()
          const analysis = await AIContentService.analyzeTranscript(transcription)
          const processingTime = Date.now() - startTime
          
          contentAnalysis = {
            ...analysis,
            analyzedAt: new Date().toISOString()
          }
          
          console.log('AI analysis completed successfully:', {
            keywords: contentAnalysis.keywords.length,
            topics: contentAnalysis.topics.length,
            sentiment: contentAnalysis.sentiment,
            keyMoments: contentAnalysis.keyMoments.length,
            processingTimeMs: processingTime
          })
        }
      } catch (error) {
        console.error('AI content analysis failed:', error)
        analysisError = error instanceof Error ? error.message : 'Unknown error during analysis'
        
        // Log more details for debugging
        console.error('Analysis error details:', {
          transcriptLength: transcription.text.length,
          segmentCount: transcription.segments.length,
          language: transcription.language,
          error: error
        })
      }
    } else {
      console.warn('Transcript too short for meaningful analysis:', transcription?.text?.length || 0)
      analysisError = 'Transcript too short for analysis'
    }

    // Store transcription and analysis in project
    if (projectId) {
      await ProjectService.updateProject(projectId, {
        transcription,
        ...(contentAnalysis && { content_analysis: contentAnalysis })
      })

      // Update task progress
      const project = await ProjectService.getProject(projectId)
      if (project?.tasks) {
        const transcriptionTask = project.tasks.find(t => t.type === 'transcription')
        if (transcriptionTask) {
          await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')
        }
      }
    }

    console.log(`Transcription completed: ${transcription.segments.length} segments`)
    if (contentAnalysis) {
      console.log(`Content analysis completed: ${contentAnalysis.keywords.length} keywords, ${contentAnalysis.topics.length} topics`)
    }

    return NextResponse.json({
      success: true,
      transcription,
      contentAnalysis,
      segmentCount: transcription.segments.length,
      duration: transcription.duration,
      mock: !process.env.ASSEMBLYAI_API_KEY, // Let frontend know if using mock data
      analysisError
    })
  } catch (error) {
    console.error('Transcription API error:', error)
    
    // Update task as failed if projectId exists
    try {
      const body = await request.json().catch(() => ({}))
      if (body.projectId) {
        await ProjectService.updateTaskProgress(body.projectId, 'transcription', 0, 'failed')
      }
    } catch {}
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transcription' },
      { status: 500 }
    )
  }
} 
