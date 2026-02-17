import { inngest } from './client'
import { SubmagicAPIService } from '@/lib/submagic-api'
import { ProjectService } from '@/lib/services'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Process video with Submagic (AI captions and effects)
 * Submagic uses webhooks so this function just creates the project
 * and the webhook handler will process the completion
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

    // Step 1: Create Submagic project with webhook
    const project = await step.run('create-submagic-project', async () => {
      console.log('[Inngest] Creating Submagic project for:', projectId)
      
      // Build webhook URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      const webhookUrl = baseUrl 
        ? `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/webhooks/submagic`
        : undefined

      if (!webhookUrl) {
        console.warn('[Inngest] No webhook URL configured - will need to poll for completion')
      }

      const submagicProject = await SubmagicAPIService.createProject({
        title: title || 'Video Project',
        language: 'en',
        videoUrl,
        templateName: 'Hormozi 2', // Popular template for social media
        webhookUrl,
        magicZooms: true, // Enable auto zoom effects
        removeSilencePace: 'fast', // Remove silence for better pacing
      })
      
      // Update project with Submagic project ID
      await ProjectService.updateProject(projectId, {
        submagic_project_id: submagicProject.id
      })
      
      // Update task progress
      await ProjectService.updateTaskProgress(projectId, 'clips', 15, 'processing')
      
      console.log('[Inngest] Submagic project created:', submagicProject.id)
      return submagicProject
    })

    // Step 2: Wait for Submagic to complete transcription, then export
    // Submagic first transcribes, then we need to export to get the final video
    const exportResult = await step.run('wait-and-export', async () => {
      console.log('[Inngest] Waiting for transcription and exporting...')
      
      // Poll until transcribed (usually takes 2-5 minutes)
      let attempts = 0
      const maxAttempts = 60 // 10 minutes max
      
      while (attempts < maxAttempts) {
        try {
          const status = await SubmagicAPIService.getProject(project.id)
          
          if (status.status === 'failed') {
            throw new Error(`Submagic processing failed: ${status.failureReason || 'Unknown error'}`)
          }
          
          // Check if transcription is complete
          if (status.transcriptionStatus === 'COMPLETED' && status.status !== 'exporting') {
            console.log('[Inngest] Transcription complete! Starting export...')
            
            // Export the project
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            const webhookUrl = baseUrl 
              ? `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/webhooks/submagic`
              : undefined

            await SubmagicAPIService.exportProject(project.id, {
              fps: 30,
              width: 1080,
              height: 1920,
              webhookUrl
            })
            
            console.log('[Inngest] Export started!')
            return { exported: true }
          }
          
          // Update progress
          const progress = Math.min(15 + Math.floor((attempts / maxAttempts) * 70), 85)
          await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing')
          
          // Wait before next check
          await step.sleep('transcription-wait', '10s')
          attempts++
        } catch (error) {
          console.error('[Inngest] Error waiting for transcription:', error)
          if (attempts >= 3) throw error
          attempts++
          await step.sleep('error-wait', '30s')
        }
      }
      
      throw new Error('Submagic transcription timeout after 10 minutes')
    })

    // Step 3: Wait for export completion
    // The webhook will handle the final completion and store the clip
    // But we'll update progress here to show activity
    await step.run('wait-for-export', async () => {
      console.log('[Inngest] Waiting for export to complete...')
      
      let attempts = 0
      const maxAttempts = 120 // 20 minutes max for export
      
      while (attempts < maxAttempts) {
        try {
          const status = await SubmagicAPIService.getProject(project.id)
          
          if (status.status === 'completed' && status.downloadUrl) {
            console.log('[Inngest] Export complete!')
            // Webhook will handle storing the clip
            return { completed: true }
          }
          
          if (status.status === 'failed') {
            throw new Error(`Export failed: ${status.failureReason || 'Unknown error'}`)
          }
          
          // Update progress
          const progress = Math.min(85 + Math.floor((attempts / maxAttempts) * 10), 95)
          await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing')
          
          await step.sleep('export-wait', '10s')
          attempts++
        } catch (error) {
          console.error('[Inngest] Error waiting for export:', error)
          if (attempts >= 3) throw error
          attempts++
          await step.sleep('error-wait', '30s')
        }
      }
      
      throw new Error('Submagic export timeout after 20 minutes')
    })

    // Step 4: Send notification
    await step.run('send-notification', async () => {
      console.log(`[Inngest] Video processing complete for user ${userId}, project ${projectId}`)
      // TODO: Implement email/push notification
    })

    return {
      success: true,
      projectId,
      submagicProjectId: project.id
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
      const statusInfo = await SubmagicAPIService.getProjectStatus(project.submagic_project_id)
      return {
        status: statusInfo.status,
        progress: statusInfo.progress,
        message: statusInfo.message,
        ready: statusInfo.status === 'completed'
      }
    } catch (error: any) {
      return { status: 'error', error: error?.message || 'Unknown error' }
    }
  }
) 