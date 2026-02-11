import { inngest } from './client'
import { VizardAPIService } from '@/lib/vizard-api'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateTaskProgressServer, updateProjectServer } from '@/lib/server-project-utils'

/**
 * Process video clips with Vizard AI
 * Flow: Send video URL to Vizard → Generate clips → Poll for completion
 */
export const processVizardVideo = inngest.createFunction(
  {
    id: 'process-vizard-video',
    name: 'Process Vizard Video',
    throttle: {
      limit: 3,  // Vizard rate limit: 3/min
      period: '1m',
      key: 'event.data.userId'
    }
  },
  { event: 'vizard/video.process' },
  async ({ event, step }) => {
    const { projectId, videoUrl, userId, title } = event.data

    console.log('[Inngest] Starting Vizard clip generation for:', projectId)

    // Check if Vizard project already exists (idempotency)
    // Use admin client since this runs server-side in Inngest (browser client won't work here)
    const { data: existingProject } = await supabaseAdmin
      .from('projects')
      .select('vizard_project_id')
      .eq('id', projectId)
      .single()
    
    if (existingProject?.vizard_project_id) {
      console.log('[Inngest] Vizard project already exists:', existingProject.vizard_project_id)
      console.log('[Inngest] Skipping duplicate creation')
      return {
        success: true,
        message: 'Vizard project already exists',
        vizardProjectId: existingProject.vizard_project_id,
        duplicate: true
      }
    }

    // Progress already set to 5% by process route - update to 10% when starting
    await updateTaskProgressServer(projectId, 'clips', 10, 'processing')

    // Create Vizard project with direct video URL
    const vizardProject = await step.run('create-vizard-project', async () => {
      console.log('[Inngest] Creating Vizard project for:', projectId)
      console.log('[Inngest] Using direct video URL:', videoUrl)

      const webhookUrl = process.env.VIZARD_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/vizard`

      const project = await VizardAPIService.createProject({
        lang: 'auto',                          // Auto-detect language
        preferLength: VizardAPIService.ClipLength.AUTO,  // AI decides clip length
        videoUrl: videoUrl,                    // Direct Supabase URL
        videoType: VizardAPIService.VideoType.REMOTE_FILE,
        ext: 'mp4',                            // Required for videoType 1
        ratioOfClip: VizardAPIService.AspectRatio.VERTICAL,  // 9:16 for TikTok/Reels
        subtitleSwitch: 1,                     // Show subtitles
        headlineSwitch: 1,                     // Show AI headline
        maxClipNumber: 20,                     // Max 20 clips
        projectName: title || `Project ${projectId}`,
        webhookUrl,
      })

      // Store Vizard project ID
      await updateProjectServer(projectId, {
        vizard_project_id: project.projectId
      })

      await updateTaskProgressServer(projectId, 'clips', 15, 'processing')

      console.log('[Inngest] Vizard project created:', project.projectId)
      console.log('[Inngest] Share link:', project.shareLink)
      console.log('[Inngest] Processing will continue in background.')

      return project
    })

    // Note: Clips processing happens in background
    // Poll or use webhook to get clips when ready

    console.log('[Inngest] Vizard job submitted successfully')
    console.log('[Inngest] Project ID:', vizardProject.projectId)

    return {
      success: true,
      message: 'Vizard clip generation started. Polling will retrieve clips when ready.',
      vizardProjectId: vizardProject.projectId
    }
  }
)


/**
 * Check Vizard processing status (for manual polling)
 */
export const checkVizardStatus = inngest.createFunction(
  {
    id: 'check-vizard-status',
    name: 'Check Vizard Status',
  },
  { event: 'vizard/status.check' },
  async ({ event, step }) => {
    const { projectId } = event.data

    // Use admin client since this runs server-side in Inngest
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('vizard_project_id')
      .eq('id', projectId)
      .single()
    
    if (!project?.vizard_project_id) {
      return { status: 'not_started' }
    }

    try {
      const status = await VizardAPIService.getProjectStatus(project.vizard_project_id)
      // Vizard returns videos array, not a status field
      const hasVideos = status.videos && status.videos.length > 0
      return {
        status: hasVideos ? 'completed' : 'processing',
        ready: hasVideos,
        clips: status.videos || [],
        projectId: status.projectId
      }
    } catch (error: any) {
      return { status: 'error', error: error?.message || 'Unknown error' }
    }
  }
)

// Backward compatibility: Old function names point to Vizard
export const processSubmagicVideo = processVizardVideo
export const processKlapVideo = processVizardVideo
export const checkSubmagicStatus = checkVizardStatus
export const checkKlapStatus = checkVizardStatus 