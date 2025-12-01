import { inngest } from './client'
import { SubmagicAPIService } from '@/lib/submagic-api'
import { YouTubeUploadService } from '@/lib/youtube-upload-service'
import { ProjectService } from '@/lib/services'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Process video clips with Submagic Magic Clips (via YouTube)
 * Flow: Upload to YouTube → Generate Magic Clips → Webhook receives results
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

    // Step 1: Upload video to YouTube
    let youtubeUrl
    try {
      const uploadResult = await step.run('upload-to-youtube', async () => {
        console.log('[Inngest] Uploading video to YouTube for:', projectId)
        
        await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing')
        
        const result = await YouTubeUploadService.uploadVideo({
          videoUrl,
          title: title || `Project ${projectId}`,
          description: 'Uploaded for AI clip generation with Submagic',
          privacy: 'unlisted'
        })
        
        console.log('[Inngest] Video uploaded to YouTube:', result.videoUrl)
        await ProjectService.updateTaskProgress(projectId, 'clips', 15, 'processing')
        
        return result
      })
      
      youtubeUrl = uploadResult.videoUrl
    } catch (error) {
      // Mark task as failed so polling stops
      await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
      console.error('[Inngest] Failed to upload to YouTube:', error)
      throw error
    }

    // Step 2: Create Submagic Magic Clips project
    try {
      await step.run('create-magic-clips-project', async () => {
        console.log('[Inngest] Creating Submagic Magic Clips project for:', projectId)
        
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/submagic`
        
        const magicClipsProject = await SubmagicAPIService.createMagicClips({
          title: title || `Project ${projectId}`,
          youtubeUrl,
          language: 'en',
          webhookUrl,
          minClipLength: 15,  // 15 seconds minimum
          maxClipLength: 60,  // 60 seconds maximum
        })
        
        // Update project with Submagic project ID
        await ProjectService.updateProject(projectId, {
          submagic_project_id: magicClipsProject.id
        })
        
        // Update task progress
        await ProjectService.updateTaskProgress(projectId, 'clips', 25, 'processing')
        
        console.log('[Inngest] Magic Clips project created:', magicClipsProject.id)
        console.log('[Inngest] Webhook will be called at:', webhookUrl)
        console.log('[Inngest] Processing will continue in background. Clips will appear when ready.')
        
        return magicClipsProject
      })
    } catch (error) {
      // Mark task as failed so polling stops
      await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
      console.error('[Inngest] Failed to create Magic Clips project:', error)
      throw error
    }

    // Note: Clips processing happens in background
    // Webhook will be called when complete at /api/webhooks/submagic
    // The webhook handler will update the project with clips
    
    console.log('[Inngest] Magic Clips job submitted successfully')
    console.log('[Inngest] Clips will be processed by Submagic and delivered via webhook')
    
    return {
      success: true,
      message: 'Magic Clips processing started. Results will be delivered via webhook.',
      youtubeUrl
    }
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
        ready: status.status === 'completed',
        projectId: status.id 
      }
    } catch (error: any) {
      return { status: 'error', error: error?.message || 'Unknown error' }
    }
  }
)

// Deprecated: Old Klap functions - keeping for backward compatibility
// These are no longer used but kept to prevent breaking changes
export const processKlapVideo = processSubmagicVideo
export const checkKlapStatus = checkSubmagicStatus 