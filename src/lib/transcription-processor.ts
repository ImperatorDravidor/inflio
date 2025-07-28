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

// Group words into proper segments for subtitles
function groupWordsIntoSegments(words: any[]): any[] {
  if (!words || words.length === 0) return []
  
  const segments: any[] = []
  let currentSegment: any = {
    id: 'seg-0',
    text: '',
    start: 0,
    end: 0,
    confidence: 0,
    wordCount: 0
  }
  
  const maxWordsPerSegment = 10 // Target around 10 words per segment
  const maxDuration = 5 // Maximum 5 seconds per segment
  const punctuationMarks = ['.', '!', '?', ':', ';']
  
  words.forEach((word, index) => {
    const wordStartTime = word.start / 1000
    const wordEndTime = word.end / 1000
    const segmentDuration = wordEndTime - currentSegment.start
    
    // Check if we should start a new segment
    const shouldSplit = 
      currentSegment.wordCount >= maxWordsPerSegment ||
      segmentDuration >= maxDuration ||
      (currentSegment.wordCount >= 5 && punctuationMarks.some(p => word.text.endsWith(p)))
    
    if (shouldSplit && currentSegment.text.trim()) {
      // Finalize current segment
      currentSegment.confidence = currentSegment.confidence / currentSegment.wordCount
      segments.push({ ...currentSegment })
      
      // Start new segment
      currentSegment = {
        id: `seg-${segments.length}`,
        text: '',
        start: wordStartTime,
        end: wordEndTime,
        confidence: 0,
        wordCount: 0
      }
    }
    
    // Add word to current segment
    if (currentSegment.text) {
      currentSegment.text += ' '
    }
    currentSegment.text += word.text
    currentSegment.end = wordEndTime
    currentSegment.confidence += word.confidence
    currentSegment.wordCount++
    
    // Set start time if this is the first word
    if (currentSegment.wordCount === 1) {
      currentSegment.start = wordStartTime
    }
  })
  
  // Add the last segment if it has content
  if (currentSegment.text.trim()) {
    currentSegment.confidence = currentSegment.confidence / currentSegment.wordCount
    segments.push(currentSegment)
  }
  
  // Clean up segments - remove wordCount as it's not needed in final output
  return segments.map(({ wordCount, ...segment }) => segment)
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
        
        console.log('[TranscriptionProcessor] Submitting transcription job to AssemblyAI...')
        
        // Submit the transcription job (non-blocking)
        const transcript = await withRetry(
          () => assembly.transcripts.submit(params),
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
              console.log(`[TranscriptionProcessor] Retry attempt ${attempt} for AssemblyAI submission:`, error.message)
            }
          }
        )
        
        console.log('[TranscriptionProcessor] Transcription job submitted:', {
          id: transcript.id,
          status: transcript.status
        })
        
        // Poll for completion with Vercel-friendly timeouts
        const maxPollingTime = 240000 // 4 minutes (leaving 1 minute buffer for 5 min timeout)
        const pollInterval = 5000 // 5 seconds
        const startTime = Date.now()
        let completedTranscript = transcript
        
        while (completedTranscript.status !== 'completed' && completedTranscript.status !== 'error') {
          // Check if we're approaching Vercel timeout
          if (Date.now() - startTime > maxPollingTime) {
            console.error('[TranscriptionProcessor] Polling timeout reached, falling back to mock')
            throw new Error('Transcription polling timeout on Vercel')
          }
          
          // Wait before polling
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          
          // Get updated transcript status
          completedTranscript = await assembly.transcripts.get(transcript.id)
          
          // Update progress based on AssemblyAI status
          if (completedTranscript.status === 'processing') {
            const elapsed = Date.now() - startTime
            const progress = Math.min(50, 30 + Math.floor((elapsed / maxPollingTime) * 20))
            await ProjectService.updateTaskProgress(projectId, 'transcription', progress, 'processing')
          }
          
          console.log('[TranscriptionProcessor] Polling transcription status:', {
            id: transcript.id,
            status: completedTranscript.status,
            elapsed: Math.round((Date.now() - startTime) / 1000) + 's'
          })
        }
        
        // Use the completed transcript
        const finalTranscript = completedTranscript
        
        console.log('[TranscriptionProcessor] AssemblyAI response received:', {
          status: finalTranscript.status,
          id: finalTranscript.id,
          hasText: !!finalTranscript.text,
          textLength: finalTranscript.text?.length || 0,
          hasWords: !!finalTranscript.words,
          wordsCount: finalTranscript.words?.length || 0
        })

        // Check if transcription is actually completed
        if (finalTranscript.status !== 'completed') {
          console.error('[TranscriptionProcessor] AssemblyAI returned non-completed status:', finalTranscript.status)
          if (finalTranscript.status === 'error') {
            throw new Error(`AssemblyAI Error: ${finalTranscript.error}`)
          } else {
            throw new Error(`AssemblyAI transcription not completed. Status: ${finalTranscript.status}`)
          }
        }

        // Update progress to 60% after successful transcription
        await ProjectService.updateTaskProgress(projectId, 'transcription', 60, 'processing')
        console.log('[TranscriptionProcessor] Updated progress to 60%')

        // Convert AssemblyAI format to our internal format
        // Group words into proper segments for subtitles
        const segments = groupWordsIntoSegments(finalTranscript.words || [])
        
        transcription = {
          text: finalTranscript.text || '',
          segments: segments,
          language: finalTranscript.language_code || 'en',
          duration: finalTranscript.audio_duration || 0
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