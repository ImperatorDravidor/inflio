import { NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'
import { logger } from '@/lib/logger'
import type { ProjectWebhookPayload } from '@/types/submagic'

/**
 * Webhook handler for Submagic project completion
 * Called when Submagic finishes processing a video
 */
export async function POST(request: Request) {
  try {
    // Parse webhook payload
    const payload = await request.json() as ProjectWebhookPayload

    logger.info('[Submagic Webhook] Received webhook', {
      action: 'submagic_webhook_received',
      metadata: {
        projectId: payload.projectId,
        status: payload.status
      }
    })

    // Find our project by Submagic project ID
    const { data: projects, error } = await ProjectService.supabase
      .from('projects')
      .select('*')
      .eq('submagic_project_id', payload.projectId)
      .single()

    if (error || !projects) {
      logger.warn('[Submagic Webhook] Project not found', {
        action: 'submagic_webhook_project_not_found',
        metadata: { submagicProjectId: payload.projectId }
      })
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const projectId = projects.id

    // Handle based on status
    if (payload.status === 'completed') {
      console.log('[Submagic Webhook] Processing completed project')
      
      // Update task progress
      await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')

      // Store the clip information
      const clip = {
        id: payload.projectId,
        title: projects.title || 'Captioned Video',
        url: payload.downloadUrl || '',
        directUrl: payload.directUrl || '',
        previewUrl: `https://app.submagic.co/view/${payload.projectId}`,
        status: 'ready',
        duration: 0, // Will be filled from metadata if available
      }

      // Store clip in database
      const existingClips = projects.clips || []
      const updatedClips = [...existingClips, clip]

      await ProjectService.updateProject(projectId, {
        clips: updatedClips,
        status: 'completed',
        processing_notes: 'Video captioning completed successfully'
      })

      logger.info('[Submagic Webhook] Project completed successfully', {
        action: 'submagic_webhook_completed',
        metadata: {
          projectId,
          submagicProjectId: payload.projectId,
          clipUrl: payload.downloadUrl
        }
      })

      return NextResponse.json({
        message: 'Webhook processed successfully',
        projectId,
        clipsGenerated: 1
      })
    } else if (payload.status === 'failed') {
      console.error('[Submagic Webhook] Project failed')
      
      // Update task as failed
      await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
      
      await ProjectService.updateProject(projectId, {
        status: 'failed',
        processing_notes: 'Video captioning failed'
      })

      logger.error('[Submagic Webhook] Project failed', {
        action: 'submagic_webhook_failed',
        metadata: {
          projectId,
          submagicProjectId: payload.projectId
        }
      })

      return NextResponse.json({
        message: 'Project failed',
        projectId
      }, { status: 200 }) // Still return 200 to acknowledge receipt
    }

    return NextResponse.json({ message: 'Webhook received' })
  } catch (error) {
    console.error('[Submagic Webhook] Error processing webhook:', error)
    logger.error('[Submagic Webhook] Error processing webhook', {
      action: 'submagic_webhook_error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    // Return 200 to prevent retries for malformed requests
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 200 }
    )
  }
}





