import { inngest } from './client'
import { SubmagicAPIService } from '@/lib/submagic-api'
import { ProjectService } from '@/lib/services'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Process video clips with Submagic AI
 */
export const processSubmagicVideo = inngest.createFunction(
  {
    id: 'process-submagic-video',
    name: 'Process Submagic Video',
    throttle: {
      limit: 5,
      period: '1m',
      key: 'event.data.userId'
    }
  },
  { event: 'submagic/video.process' },
  async ({ event, step }) => {
    const { projectId, videoUrl, userId, title } = event.data

    // Step 1: Create Submagic project
    const project = await step.run('create-submagic-project', async () => {
      console.log('[Inngest] Creating Submagic project for:', projectId)
      
      const submagicProject = await SubmagicAPIService.createProject({
        title: title || `Project ${projectId}`,
        videoUrl,
        language: 'en',
        generateClips: true,
        maxClips: 10,
        clipDuration: 30,
        autoCaption: true
      })
      
      // Update project with Submagic project ID
      await ProjectService.updateProject(projectId, {
        submagic_project_id: submagicProject.id
      })
      
      // Update task progress
      await ProjectService.updateTaskProgress(projectId, 'clips', 10, 'processing')
      
      return submagicProject
    })

    // Step 2: Poll for completion
    const result = await step.run('wait-for-submagic-completion', async () => {
      console.log('[Inngest] Polling Submagic project:', project.id)
      
      let attempts = 0
      const maxAttempts = 180 // 30 minutes max
      const pollInterval = 10 // seconds
      
      while (attempts < maxAttempts) {
        try {
          const status = await SubmagicAPIService.getProjectStatus(project.id)
          
          if (status.status === 'error') {
            throw new Error(`Submagic processing failed: ${status.error || 'Unknown error'}`)
          }
          
          if (status.status === 'ready') {
            console.log('[Inngest] Submagic project completed!')
            return status
          }
          
          // Update progress smoothly
          const progress = Math.min(10 + Math.floor((attempts / maxAttempts) * 80), 90)
          await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing')
          
          // Wait before next attempt
          await step.sleep('poll-wait', `${pollInterval}s`)
          attempts++
        } catch (error) {
          console.error('[Inngest] Error polling Submagic:', error)
          // Fail after 3 consecutive errors in a row
          if (attempts >= 3) throw error
          attempts++
          await step.sleep('error-wait', '30s')
        }
      }
      
      throw new Error('Submagic processing timeout after 30 minutes')
    })

    // Step 3: Process and store clips
    await step.run('process-and-store-clips', async () => {
      console.log('[Inngest] Processing clips from Submagic project:', result.id)
      
      // Get clips from Submagic
      const submagicClips = await SubmagicAPIService.getProjectClips(result.id)
      const processedClips = []
      
      for (let i = 0; i < submagicClips.length; i++) {
        const submagicClip = submagicClips[i]
        
        if (!submagicClip.id) continue
        
        try {
          // Get the video URL (Submagic provides this directly)
          let videoUrl = submagicClip.videoUrl
          
          // Optionally download and store in Supabase
          // Can be disabled with SKIP_VIDEO_REUPLOAD env var
          if (!process.env.SKIP_VIDEO_REUPLOAD || process.env.SKIP_VIDEO_REUPLOAD !== 'true') {
            try {
              const response = await fetch(submagicClip.videoUrl)
              const buffer = await response.arrayBuffer()
              
              const fileName = `clip_${i}_${submagicClip.id}.mp4`
              const filePath = `${projectId}/clips/${fileName}`
              
              const { error: uploadError } = await supabaseAdmin.storage
                .from('videos')
                .upload(filePath, buffer, {
                  contentType: 'video/mp4',
                  upsert: true
                })
              
              if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                  .from('videos')
                  .getPublicUrl(filePath)
                videoUrl = urlData.publicUrl
                console.log(`[Inngest] Clip stored at: ${videoUrl}`)
              }
            } catch (error) {
              console.error(`[Inngest] Failed to download/store clip ${i}:`, error)
              // Continue with Submagic URL if storage fails
            }
          }
          
          // Create clip object with all metadata
          // Normalize Submagic data to our internal format
          const clip = {
            id: `${projectId}_clip_${i}`,
            title: submagicClip.title || `Clip ${i + 1}`,
            description: submagicClip.description || '',
            startTime: submagicClip.startTime || 0,
            endTime: submagicClip.endTime || 0,
            duration: submagicClip.duration || 30,
            thumbnail: submagicClip.thumbnailUrl || videoUrl,
            tags: [],
            score: submagicClip.viralityScore || 0.5,
            type: 'highlight' as const,
            submagicProjectId: result.id,
            submagicClipId: submagicClip.id,
            exportUrl: videoUrl,
            exported: true,
            storedInSupabase: !process.env.SKIP_VIDEO_REUPLOAD || process.env.SKIP_VIDEO_REUPLOAD !== 'true',
            createdAt: new Date().toISOString(),
            // Additional metadata from Submagic
            viralityExplanation: submagicClip.description || '',
            transcript: submagicClip.transcript || '',
            rawSubmagicData: submagicClip, // Store raw response for debugging
            publicationCaptions: submagicClip.captions || undefined
          }
          
          processedClips.push(clip)
        } catch (error) {
          console.error(`[Inngest] Failed to process clip ${submagicClip.id}:`, error)
        }
      }
      
      // Update project with clips
      await ProjectService.updateProject(projectId, {
        folders: {
          clips: processedClips,
          images: [],
          social: [],
          blog: []
        }
      })
      
      // Mark task as complete
      await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
      
      console.log(`[Inngest] Successfully processed ${processedClips.length} clips for project ${projectId}`)
      
      return { clipCount: processedClips.length }
    })

    // Step 4: Send notification (optional)
    await step.run('send-notification', async () => {
      // TODO: Implement email/push notification
      console.log(`[Inngest] Clips ready for user ${userId}, project ${projectId}`)
    })
  }
)


/**
 * Check Submagic processing status (for manual polling)
 */
export const checkSubmagicStatus = inngest.createFunction(
  {
    id: 'check-submagic-status',
    name: 'Check Submagic Status',
  },
  { event: 'submagic/status.check' },
  async ({ event, step }) => {
    const { projectId } = event.data
    
    const project = await ProjectService.getProject(projectId)
    if (!project?.submagic_project_id) {
      return { status: 'not_started' }
    }
    
    try {
      const status = await SubmagicAPIService.getProjectStatus(project.submagic_project_id)
      return { 
        status: status.status,
        ready: status.status === 'ready',
        projectId: status.id 
      }
    } catch (error: any) {
      return { status: 'error', error: error?.message || 'Unknown error' }
    }
  }
)

// Keep legacy Klap function names as aliases for backward compatibility
// These will use Submagic under the hood
export const processKlapVideo = processSubmagicVideo
export const checkKlapStatus = checkSubmagicStatus 