import { ProjectService } from '@/lib/services'
import { AIContentService } from '@/lib/ai-content-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AssemblyAI, TranscribeParams } from 'assemblyai'
import { TranscriptionData } from '@/lib/project-types'
import { withRetry } from '@/lib/retry-utils'
import { v4 as uuidv4 } from 'uuid'

// Mock content analysis
const mockContentAnalysis = {
  keywords: ['introduction', 'key points', 'innovation', 'implementation', 'best practices'],
  topics: ['Content Creation', 'Innovation', 'Best Practices'],
  summary: 'This video provides an introduction to the topic, discusses key points including innovation and creativity.',
  sentiment: 'positive' as 'positive' | 'neutral' | 'negative',
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
interface AssemblyAIWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

function groupWordsIntoSegments(words: AssemblyAIWord[]): TranscriptionData['segments'] {
  if (!words || words.length === 0) return []
  
  const segments: TranscriptionData['segments'] = []
  let currentSegment: TranscriptionData['segments'][0] & { wordCount: number } = {
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
  
  words.forEach((word) => {
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
  return segments.map((segment) => {
    const { wordCount: _, ...cleanSegment } = segment as typeof segment & { wordCount?: number }
    return cleanSegment
  })
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
  userId?: string
}) {
  const { projectId, videoUrl, language = 'en' } = params
  
  console.log('[TranscriptionProcessor] Starting transcription for project', projectId)
  console.log('[TranscriptionProcessor] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasAssemblyAI: !!process.env.ASSEMBLYAI_API_KEY
  })

  try {
    // Progress already set to 5% by process route - start at 15%
    await ProjectService.updateTaskProgress(projectId, 'transcription', 15, 'processing')

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

    // Update progress to 20% before starting AssemblyAI
    await ProjectService.updateTaskProgress(projectId, 'transcription', 20, 'processing')
    console.log('[TranscriptionProcessor] Updated progress to 20%, starting AssemblyAI transcription...')

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
        
        // Use the transcribe method (blocking, but Inngest handles the timeout)
        const transcript = await withRetry(
          () => assembly.transcripts.transcribe(params),
          {
            maxAttempts: 5, // Increased attempts for reliability
            initialDelay: 10000, // 10 seconds initial delay for 502 errors
            maxDelay: 60000, // Max 1 minute between retries
            backoffMultiplier: 1.5, // Less aggressive backoff
            shouldRetry: (error) => {
              // Log detailed error info
              console.log('[TranscriptionProcessor] AssemblyAI error details:', {
                message: error.message,
                status: error.status,
                code: error.code,
                type: error.constructor.name
              })
              
              // Retry on network errors or specific AssemblyAI errors
              if (error.message?.includes('network')) return true
              if (error.message?.includes('timeout')) return true
              if (error.message?.includes('502 Bad Gateway')) return true
              if (error.message?.includes('503 Service Unavailable')) return true
              if (error.message?.includes('504 Gateway Timeout')) return true
              if (error.status === 429) return true // Rate limit
              if (error.status >= 500) return true // Server errors
              if (error.code === 'ECONNRESET') return true
              if (error.code === 'ETIMEDOUT') return true
              return false
            },
            onRetry: (error, attempt) => {
              console.log(`[TranscriptionProcessor] Retry attempt ${attempt}/5 for AssemblyAI:`, {
                error: error.message,
                projectId,
                nextRetryIn: Math.min(10000 * Math.pow(1.5, attempt - 1), 60000) / 1000 + ' seconds'
              })
              // Update progress to show we're retrying (20% base + 5% per retry)
              ProjectService.updateTaskProgress(projectId, 'transcription', 20 + (attempt * 5), 'processing').catch(console.error)
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

        // Update progress to 50% after successful transcription
        await ProjectService.updateTaskProgress(projectId, 'transcription', 50, 'processing')
        console.log('[TranscriptionProcessor] Updated progress to 50%')

        // Convert AssemblyAI format to our internal format
        // Group words into proper segments for subtitles
        const segments = groupWordsIntoSegments(transcript.words || [])
        
        transcription = {
          text: transcript.text || '',
          segments: segments,
          language: transcript.language_code || 'en',
          duration: transcript.audio_duration || 0
        }
      } catch (assemblyError) {
        console.error('[TranscriptionProcessor] AssemblyAI transcription failed after all retries:', {
          error: assemblyError instanceof Error ? assemblyError.message : 'Unknown error',
          stack: assemblyError instanceof Error ? assemblyError.stack : undefined,
          type: typeof assemblyError,
          projectId,
          videoUrl
        })
        
        // In development, fall back to mock; in production, fail properly
        if (process.env.NODE_ENV === 'development' && process.env.FORCE_MOCK_TRANSCRIPTION === 'true') {
          console.log('[TranscriptionProcessor] Development mode with FORCE_MOCK_TRANSCRIPTION=true, using mock transcription')
          transcription = mockTranscription
          isMock = true
        } else {
          // Update task status to failed
          await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
          // Throw the error to properly fail the task
          throw new Error(`Transcription failed: ${assemblyError instanceof Error ? assemblyError.message : 'Unknown error'}`)
        }
      }
    } else {
      console.error('[TranscriptionProcessor] AssemblyAI API key not configured')
      // Update task status to failed
      await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
      throw new Error('Transcription service not configured. Please add ASSEMBLYAI_API_KEY to environment variables.')
    }

    // --- Step 2: AI Content Analysis ---
    
    // Update progress to 70% before content analysis
    await ProjectService.updateTaskProgress(projectId, 'transcription', 70, 'processing')
    console.log('[TranscriptionProcessor] Updated progress to 70%, starting AI content analysis...')
    
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
        }
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
    
    // Update progress to 85% before final save
    await ProjectService.updateTaskProgress(projectId, 'transcription', 85, 'processing')
    console.log('[TranscriptionProcessor] Updated progress to 85%, saving to database...')
    
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

    // --- Step 4: Auto-generate AI Posts if content analysis is available ---
    if (contentAnalysis && !analysisError) {
      console.log('[TranscriptionProcessor] Triggering automatic AI post generation...')
      try {
        // Check if there are already posts generated for this project
        const { data: existingPosts, error: checkError } = await supabaseAdmin
          .from('post_suggestions')
          .select('id')
          .eq('project_id', projectId)
          .limit(1)
        
        if (!checkError && (!existingPosts || existingPosts.length === 0)) {
          console.log('[TranscriptionProcessor] No existing posts found, generating AI posts directly...')
          
          // Get user_id for the project if not provided
          let userId = params.userId
          if (!userId) {
            const { data: projectWithUser } = await supabaseAdmin
              .from('projects')
              .select('user_id')
              .eq('id', projectId)
              .single()
            userId = projectWithUser?.user_id
          }

          // Generate post suggestions directly from content analysis
          const postSuggestionsToCreate = []
          
          // Default post types to generate
          const defaultPostTypes = ['carousel', 'quote', 'single']
          const defaultPlatforms = ['instagram', 'twitter', 'linkedin']
          
          // Use postSuggestions from AI analysis if available
          const postSuggestions = (contentAnalysis as any).postSuggestions
          if (postSuggestions && postSuggestions.length > 0) {
            console.log(`[TranscriptionProcessor] Found ${postSuggestions.length} post suggestions from AI analysis`)
            
            for (const suggestion of postSuggestions) {
              const suggestionId = uuidv4()
              
              // Build platform copy
              const platformCopy: Record<string, any> = {}
              for (const platform of suggestion.platforms) {
                platformCopy[platform] = {
                  caption: suggestion.mainContent,
                  hashtags: suggestion.hashtags,
                  cta: 'Follow for more insights!',
                  title: suggestion.title,
                  description: suggestion.description
                }
              }
              
              // Build eligibility
              const eligibility: Record<string, any> = {}
              for (const platform of suggestion.platforms) {
                eligibility[platform] = {
                  is_ready: true,
                  missing_elements: [],
                  optimization_tips: []
                }
              }
              
              postSuggestionsToCreate.push({
                id: suggestionId,
                project_id: projectId,
                user_id: userId,
                type: suggestion.type,
                images: [{
                  id: uuidv4(),
                  type: 'hero',
                  prompt: suggestion.visualPrompt,
                  text_overlay: suggestion.hook,
                  dimensions: '1080x1080',
                  position: 0
                }],
                platform_copy: platformCopy,
                eligibility: eligibility,
                status: 'suggested',
                metadata: {
                  title: suggestion.title,
                  description: suggestion.description,
                  hook: suggestion.hook,
                  engagement_score: suggestion.engagementScore,
                  ai_generated: true,
                  generation_source: 'transcription_analysis'
                },
                created_at: new Date().toISOString(),
                created_by: 'ai_system'
              })
            }
          } else {
            // No fallback generation - only use high-quality AI suggestions
            console.log('[TranscriptionProcessor] No post suggestions available from AI analysis')
          }
          
          // Save all post suggestions to database
          if (postSuggestionsToCreate.length > 0) {
            console.log(`[TranscriptionProcessor] Inserting ${postSuggestionsToCreate.length} post suggestions`)
            
            const { error: insertError } = await supabaseAdmin
              .from('post_suggestions')
              .insert(postSuggestionsToCreate)
            
            if (insertError) {
              console.error('[TranscriptionProcessor] Error inserting post suggestions:', insertError)
            } else {
              console.log(`[TranscriptionProcessor] Successfully created ${postSuggestionsToCreate.length} post suggestions`)
            }
          }
        } else {
          console.log('[TranscriptionProcessor] Posts already exist for this project, skipping auto-generation')
        }
      } catch (postGenError) {
        // Don't fail the transcription if post generation fails
        console.error('[TranscriptionProcessor] Error generating AI posts (non-fatal):', postGenError)
      }
    }

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