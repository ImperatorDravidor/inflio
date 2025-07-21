import { inngest } from './client'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Process Klap video clips with proper async handling
 */
export const processKlapVideo = inngest.createFunction(
  {
    id: 'process-klap-video',
    name: 'Process Klap Video',
    throttle: {
      limit: 5,
      period: '1m',
      key: 'event.data.userId'
    }
  },
  { event: 'klap/video.process' },
  async ({ event, step }) => {
    const { projectId, videoUrl, userId } = event.data

    // Step 1: Create Klap task
    const task = await step.run('create-klap-task', async () => {
      console.log('[Inngest] Creating Klap task for project:', projectId)
      const klapTask = await KlapAPIService.createVideoTask(videoUrl)
      
      // Update project with task ID
      await ProjectService.updateProject(projectId, {
        klap_project_id: klapTask.id
      })
      
      // Update task progress
      await ProjectService.updateTaskProgress(projectId, 'clips', 15, 'processing')
      
      return klapTask
    })

    // Step 2: Poll for completion (Inngest handles the waiting)
    const result = await step.run('wait-for-klap-completion', async () => {
      console.log('[Inngest] Polling Klap task:', task.id)
      
      // Poll with exponential backoff
      let attempts = 0
      const maxAttempts = 180 // 30 minutes max
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`https://api.klap.app/v2/tasks/${task.id}`, {
            headers: {
              'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
              'Content-Type': 'application/json',
            }
          })
          
          if (!response.ok) {
            throw new Error(`Klap API error: ${response.status}`)
          }
          
          const status = await response.json()
          
          if (status.status === 'failed' || status.status === 'error') {
            throw new Error(`Klap processing failed: ${status.error || 'Unknown error'}`)
          }
          
          if (status.status === 'ready' && status.output_id) {
            console.log('[Inngest] Klap task completed! Output ID:', status.output_id)
            return status
          }
          
          // Update progress
          const progress = Math.min(15 + Math.floor((attempts / maxAttempts) * 60), 75)
          await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing')
          
          // Wait before next attempt (10 seconds)
          await step.sleep('poll-wait', '10s')
          attempts++
        } catch (error) {
          console.error('[Inngest] Error polling Klap:', error)
          if (attempts >= 3) throw error // Fail after 3 consecutive errors
          attempts++
          await step.sleep('error-wait', '30s')
        }
      }
      
      throw new Error('Klap processing timeout after 30 minutes')
    })

    // Step 3: Process and store clips
    await step.run('process-and-store-clips', async () => {
      console.log('[Inngest] Processing clips from folder:', result.output_id)
      
      // Get clips from Klap
      const klapClips = await KlapAPIService.getClipsFromFolder(result.output_id)
      const processedClips = []
      
      for (let i = 0; i < klapClips.length; i++) {
        const klapClip = klapClips[i]
        const klapId = typeof klapClip === 'string' ? klapClip : klapClip.id
        
        if (!klapId) continue
        
        try {
          // Get clip details
          const details = await KlapAPIService.getClipDetails(result.output_id, klapId).catch(() => ({}))
          
          // Export clip to get URL
          const exported = await KlapAPIService.exportMultipleClips(result.output_id, [klapId])
          if (!exported[0]?.url) {
            console.error(`Failed to export clip ${klapId}`)
            continue
          }
          
          // Download and store if not skipping
          let videoUrl = exported[0].url
          if (!process.env.SKIP_KLAP_VIDEO_REUPLOAD || process.env.SKIP_KLAP_VIDEO_REUPLOAD !== 'true') {
            try {
              const response = await fetch(exported[0].url)
              const buffer = await response.arrayBuffer()
              
              const fileName = `clip_${i}_${klapId}.mp4`
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
            }
          }
          
          // Create clip object
          const clip = {
            id: `${projectId}_clip_${i}`,
            title: details.title || details.name || `Clip ${i + 1}`,
            description: details.virality_score_explanation || details.description || '',
            startTime: details.start_time || 0,
            endTime: details.end_time || 0,
            duration: details.duration || 30,
            thumbnail: details.thumbnail || `https://klap.app/player/${klapId}/thumbnail`,
            tags: details.tags || [],
            score: typeof details.virality_score === 'number' ? details.virality_score / 100 : 0.5,
            type: 'highlight' as const,
            klapProjectId: klapId,
            klapFolderId: result.output_id,
            exportUrl: videoUrl,
            exported: true,
            storedInSupabase: !process.env.SKIP_KLAP_VIDEO_REUPLOAD || process.env.SKIP_KLAP_VIDEO_REUPLOAD !== 'true',
            createdAt: new Date().toISOString()
          }
          
          processedClips.push(clip)
        } catch (error) {
          console.error(`[Inngest] Failed to process clip ${klapId}:`, error)
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
 * Check Klap processing status (for manual polling)
 */
export const checkKlapStatus = inngest.createFunction(
  {
    id: 'check-klap-status',
    name: 'Check Klap Status',
  },
  { event: 'klap/status.check' },
  async ({ event, step }) => {
    const { projectId } = event.data
    
    const project = await ProjectService.getProject(projectId)
    if (!project?.klap_project_id) {
      return { status: 'not_started' }
    }
    
    try {
      const response = await fetch(`https://api.klap.app/v2/tasks/${project.klap_project_id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
        }
      })
      
      const status = await response.json()
      return { 
        status: status.status,
        ready: status.status === 'ready',
        outputId: status.output_id 
      }
    } catch (error: any) {
      return { status: 'error', error: error?.message || 'Unknown error' }
    }
  }
) 