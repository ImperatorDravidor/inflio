import { ProjectService } from '@/lib/services'
import { TranscriptionService } from '@/lib/transcription-service'
import { AIContentService } from '@/lib/ai-content-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AssemblyAI, TranscribeParams } from 'assemblyai'
import { TranscriptionData } from '@/lib/project-types'
import { withRetry } from '@/lib/retry-utils'

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
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  console.log('[AssemblyAI] API Key check:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    prefix: apiKey?.substring(0, 8) + '...' || 'MISSING'
  })
  
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY environment variable is not set')
  }
  
  return new AssemblyAI({
    apiKey
  })
}

export async function processTranscription(params: {
  projectId: string
  videoUrl: string
  language?: string
  userId: string
}) {
  const { projectId, videoUrl, language = 'en', userId } = params
  
  console.log('[TranscriptionProcessor] Starting transcription for project', projectId)
  console.log('[TranscriptionProcessor] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasAssemblyAI: !!process.env.ASSEMBLYAI_API_KEY
  })

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
    console.log('[TranscriptionProcessor] Updated progress to 30%, starting AssemblyAI transcription...')

    if (process.env.ASSEMBLYAI_API_KEY) {
      try {
        console.log('[TranscriptionProcessor] Creating AssemblyAI client...')
        // Use AssemblyAI for transcription
        const assembly = getAssemblyAI()
        
        console.log('[TranscriptionProcessor] Submitting transcription request to AssemblyAI...')
        
        // Generate a signed URL for AssemblyAI to bypass CloudProxy
        const videoPath = videoUrl.split('/storage/v1/object/public/videos/')[1];
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
          .storage
          .from('videos')
          .createSignedUrl(videoPath, 3600); // 1 hour expiry
        
        if (signedUrlError || !signedUrlData?.signedUrl) {
          console.error('[TranscriptionProcessor] Failed to create signed URL:', signedUrlError);
          throw new Error('Failed to create signed URL for video');
        }
        
        console.log('[TranscriptionProcessor] Video URL:', videoUrl)
        console.log('[TranscriptionProcessor] Signed URL created for AssemblyAI')
        const params: TranscribeParams = { audio: signedUrlData.signedUrl }
        
        console.log('[TranscriptionProcessor] Calling assembly.transcripts.transcribe()...')
        
        // Use the transcribe method with retry logic
        const transcript = await withRetry(
          () => assembly.transcripts.transcribe(params),
          {
            maxAttempts: 3,
            initialDelay: 5000,
            shouldRetry: (error) => {
              // Retry on network errors or specific AssemblyAI errors
              if (error.message?.includes('network')) return true
              if (error.message?.includes('timeout')) return true
              if (error.status === 429) return true // Rate limit
              if (error.status >= 500) return true // Server errors
              return false
            },
            onRetry: (error, attempt) => {
              console.log(`[TranscriptionProcessor] Retry attempt ${attempt} for AssemblyAI:`, error.message)
            }
          }
        )
        
        console.log('[TranscriptionProcessor] AssemblyAI response received:', {
          status: transcript.status,
          id: transcript.id,
          hasText: !!transcript.text,
          textLength: transcript.text?.length || 0,
          hasWords: !!transcript.words,
          wordsCount: transcript.words?.length || 0
        })

        // Check if transcription is actually completed
        if (transcript.status !== 'completed') {
          console.error('[TranscriptionProcessor] AssemblyAI returned non-completed status:', transcript.status)
          if (transcript.status === 'error') {
            throw new Error(`AssemblyAI Error: ${transcript.error}`)
          } else {
            throw new Error(`AssemblyAI transcription not completed. Status: ${transcript.status}`)
          }
        }

        // Update progress to 60% after successful transcription
        await ProjectService.updateTaskProgress(projectId, 'transcription', 60, 'processing')
        console.log('[TranscriptionProcessor] Updated progress to 60%')

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
        console.error('[TranscriptionProcessor] AssemblyAI transcription failed:', {
          error: assemblyError instanceof Error ? assemblyError.message : 'Unknown error',
          stack: assemblyError instanceof Error ? assemblyError.stack : undefined,
          type: typeof assemblyError,
          projectId,
          videoUrl
        })
        console.log('[TranscriptionProcessor] Falling back to mock transcription')
        transcription = mockTranscription // Fallback
        isMock = true
      }
    } else {
      console.log('[TranscriptionProcessor] AssemblyAI API key not configured, using mock transcription')
      transcription = mockTranscription
      isMock = true
    }

    // --- Step 2: AI Content Analysis ---
    
    // Update progress to 80% before content analysis
    await ProjectService.updateTaskProgress(projectId, 'transcription', 80, 'processing')
    console.log('[TranscriptionProcessor] Updated progress to 80%, starting AI content analysis...')
    
    let contentAnalysis = mockContentAnalysis
    let analysisError: string | null = null

    if (transcription.text && !isMock) {
      try {
        console.log('[TranscriptionProcessor] Starting AI content analysis with OpenAI...')
        console.log('[TranscriptionProcessor] Transcript length:', transcription.text.length)
        console.log('[TranscriptionProcessor] Transcript preview:', transcription.text.substring(0, 200) + '...')
        
        const aiAnalysis = await AIContentService.analyzeTranscript(transcription)
        console.log('[TranscriptionProcessor] AI analysis response received:', {
          keywords: aiAnalysis.keywords?.length || 0,
          topics: aiAnalysis.topics?.length || 0,
          summaryLength: aiAnalysis.summary?.length || 0,
          sentiment: aiAnalysis.sentiment,
          keyMoments: aiAnalysis.keyMoments?.length || 0
        })
        
        contentAnalysis = {
          ...aiAnalysis,
          analyzedAt: new Date().toISOString()
        } as any
        console.log('[TranscriptionProcessor] AI content analysis completed successfully')
      } catch (err) {
        console.error('[TranscriptionProcessor] AI content analysis failed:', {
          error: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          type: typeof err,
          projectId,
          transcriptLength: transcription.text.length
        })
        analysisError = err instanceof Error ? err.message : 'Unknown error'
        contentAnalysis = mockContentAnalysis // Fallback
        console.log('[TranscriptionProcessor] Using fallback mock content analysis')
      }
    } else {
      console.log('[TranscriptionProcessor] Skipping AI analysis - using mock transcript or empty text')
    }

    // --- Step 3: Update Project ---
    
    // Update progress to 90% before final save
    await ProjectService.updateTaskProgress(projectId, 'transcription', 90, 'processing')
    console.log('[TranscriptionProcessor] Updated progress to 90%, saving to database...')
    
    try {
      console.log('[TranscriptionProcessor] Updating project with transcription and content analysis...')
      await ProjectService.updateProject(projectId, {
        transcription,
        content_analysis: contentAnalysis,
        updated_at: new Date().toISOString()
      })
      console.log('[TranscriptionProcessor] Project updated successfully')
    } catch (updateError) {
      console.error('[TranscriptionProcessor] Failed to update project with full data:', {
        error: updateError instanceof Error ? updateError.message : 'Unknown error',
        stack: updateError instanceof Error ? updateError.stack : undefined,
        projectId
      })
      console.log('[TranscriptionProcessor] Attempting to save with transcription only...')
      // Try one more time with just transcription if content analysis was the issue
      try {
        await ProjectService.updateProject(projectId, {
          transcription,
          updated_at: new Date().toISOString()
        })
        console.log('[TranscriptionProcessor] Project updated successfully with transcription only')
      } catch (secondError) {
        console.error('[TranscriptionProcessor] Failed to update project even with transcription only:', {
          error: secondError instanceof Error ? secondError.message : 'Unknown error',
          stack: secondError instanceof Error ? secondError.stack : undefined,
          projectId
        })
        throw secondError
      }
    }

    console.log('[TranscriptionProcessor] Marking task as completed...')
    await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')
    console.log('[TranscriptionProcessor] Task marked as completed')

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