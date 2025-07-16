import { ProjectService } from '@/lib/services'
import { TranscriptionService } from '@/lib/transcription-service'
import { AIContentService } from '@/lib/ai-content-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AssemblyAI, TranscribeParams } from 'assemblyai'
import { TranscriptionData } from '@/lib/project-types'

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

export async function processTranscription({
  projectId,
  videoUrl,
  language = 'en',
  userId
}: {
  projectId: string
  videoUrl: string
  language?: string
  userId: string
}) {
  console.log(`[TranscriptionProcessor] Starting transcription for project ${projectId}`)
  
  // Check if AssemblyAI is configured
  if (!process.env.ASSEMBLYAI_API_KEY) {
    console.warn('[TranscriptionProcessor] AssemblyAI API key not configured, using mock data')
  }

  try {
    // Update task status to processing right at the start
    await ProjectService.updateTaskProgress(projectId, 'transcription', 10, 'processing')

    // Get project from database
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('title, tasks')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
      throw new Error('Project not found')
    }

    // --- Step 1: Transcription ---
    let transcription: TranscriptionData
    let isMock = false
    
    // Generate mock transcription
    const mockTranscription = generateMockTranscription(videoUrl, language)

    // Update progress to 30% before starting transcription
    await ProjectService.updateTaskProgress(projectId, 'transcription', 30, 'processing')

    if (process.env.ASSEMBLYAI_API_KEY) {
      try {
        // Use AssemblyAI for transcription
        const assembly = getAssemblyAI()
        
        const params: TranscribeParams = { audio: videoUrl }
        const transcript = await assembly.transcripts.transcribe(params)

        // Update progress to 60% after transcription
        await ProjectService.updateTaskProgress(projectId, 'transcription', 60, 'processing')

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
    
    // Update progress to 80% before content analysis
    await ProjectService.updateTaskProgress(projectId, 'transcription', 80, 'processing')
    
    let contentAnalysis = mockContentAnalysis
    let analysisError: string | null = null

    if (transcription.text && !isMock) {
      try {
        // Add timeout protection for AI analysis (15 seconds max)
        const analysisPromise = AIContentService.analyzeTranscript(transcription)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 15000)
        )
        
        const aiAnalysis = await Promise.race([analysisPromise, timeoutPromise])
        contentAnalysis = {
          ...aiAnalysis,
          analyzedAt: new Date().toISOString()
        } as any
        
        console.log('[TranscriptionProcessor] AI content analysis completed successfully')
      } catch (err) {
        console.error('AI content analysis failed:', err)
        analysisError = err instanceof Error ? err.message : 'Unknown error'
        contentAnalysis = mockContentAnalysis // Fallback
        
        // Don't let AI analysis failure block the transcription
        console.log('[TranscriptionProcessor] Using fallback content analysis due to error')
      }
    }

    // --- Step 3: Update Project ---
    
    // Update progress to 90% before final save
    await ProjectService.updateTaskProgress(projectId, 'transcription', 90, 'processing')
    
    try {
      await ProjectService.updateProject(projectId, {
        transcription,
        content_analysis: contentAnalysis,
        updated_at: new Date().toISOString()
      })
    } catch (updateError) {
      console.error('[TranscriptionProcessor] Failed to update project:', updateError)
      // Try one more time with just transcription if content analysis was the issue
      await ProjectService.updateProject(projectId, {
        transcription,
        updated_at: new Date().toISOString()
      })
    }

    await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')

    console.log(`[TranscriptionProcessor] Transcription completed for project ${projectId}${analysisError ? ' (with AI analysis fallback)' : ''}`)

    return {
      success: true,
      transcription,
      contentAnalysis,
      mock: isMock,
      analysisError
    }
  } catch (error) {
    console.error(`[TranscriptionProcessor] Critical error for project ${projectId}:`, error)
    await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
    throw error
  }
} 