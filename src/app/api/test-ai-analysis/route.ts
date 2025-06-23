import { NextRequest, NextResponse } from 'next/server'
import { AIContentService } from '@/lib/ai-content-service'
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

    const { transcriptText } = await request.json()

    if (!transcriptText || transcriptText.length < 100) {
      return NextResponse.json(
        { error: 'Transcript text is required (minimum 100 characters)' },
        { status: 400 }
      )
    }

    // Create a mock transcription object for testing
    const mockTranscription = {
      text: transcriptText,
      segments: transcriptText.split('. ').map((sentence: string, index: number) => ({
        id: `seg-${index}`,
        text: sentence + '.',
        start: index * 5,
        end: (index + 1) * 5,
        confidence: 0.95
      })),
      language: 'en',
      duration: transcriptText.split('. ').length * 5
    }

    console.log('Testing AI content analysis...')
    console.log('Transcript length:', transcriptText.length)
    console.log('Number of segments:', mockTranscription.segments.length)

    // Test the AI analysis
    const startTime = Date.now()
    let analysis
    let error = null

    try {
      analysis = await AIContentService.analyzeTranscript(mockTranscription)
      const processingTime = Date.now() - startTime

      console.log('Analysis completed successfully:', {
        processingTimeMs: processingTime,
        keywords: analysis.keywords.length,
        topics: analysis.topics.length,
        sentiment: analysis.sentiment,
        keyMoments: analysis.keyMoments.length
      })
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      console.error('Analysis failed:', err)
    }

    return NextResponse.json({
      success: !error,
      analysis,
      error,
      debug: {
        transcriptLength: transcriptText.length,
        segmentCount: mockTranscription.segments.length,
        processingTimeMs: Date.now() - startTime,
        openAIKeyConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here')
      }
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to test AI analysis',
        openAIKeyConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here')
      },
      { status: 500 }
    )
  }
} 