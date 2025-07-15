import { NextRequest, NextResponse } from 'next/server'
import { KlapJobQueue, type KlapJob } from '@/lib/redis'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { supabaseAdmin } from '@/lib/supabase/admin'

// This can run for up to 5 minutes per job
export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * POST /api/worker/klap
 * Process jobs from the Redis queue
 * This should be called by a cron job or QStash
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (add your own auth mechanism)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean up stale jobs first
    await KlapJobQueue.cleanupStaleJobs()

    // Get next job from queue
    const job = await KlapJobQueue.getNextJob()
    if (!job) {
      return NextResponse.json({ message: 'No jobs to process' })
    }

    console.log(`[Worker] Processing job ${job.id} for project ${job.projectId}`)

    try {
      // Process the job
      await processKlapJob(job)
      
      return NextResponse.json({ 
        success: true, 
        jobId: job.id,
        message: 'Job processed successfully'
      })
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error)
      
      // Mark job as failed
      await KlapJobQueue.failJob(
        job.id, 
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      return NextResponse.json({ 
        success: false, 
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Job processing failed'
      })
    }
  } catch (error) {
    console.error('[Worker] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Worker error' },
      { status: 500 }
    )
  }
}

/**
 * Process a single Klap job
 */
async function processKlapJob(job: KlapJob) {
  const { projectId, videoUrl, id: jobId } = job

  // Update progress: Starting
  await KlapJobQueue.updateJob(jobId, { progress: 10 })

  // Start Klap processing
  const task = await KlapAPIService.createVideoTask(videoUrl)
  
  // Update job with task ID
  await KlapJobQueue.updateJob(jobId, { 
    taskId: task.id,
    progress: 20 
  })

  // Update project with task ID
  await ProjectService.updateProject(projectId, {
    klap_project_id: task.id
  })

  // Poll for completion
  let attempts = 0
  const maxAttempts = 60 // 5 minutes with 5-second intervals
  
  while (attempts < maxAttempts) {
    // Check task status
    const taskResponse = await fetch(`https://api.klap.app/v2/tasks/${task.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
      }
    })
    
    if (!taskResponse.ok) {
      throw new Error(`Failed to check Klap status: ${taskResponse.status}`)
    }
    
    const taskStatus = await taskResponse.json()
    
    if (taskStatus.status === 'failed' || taskStatus.status === 'error') {
      throw new Error('Klap processing failed')
    }

    if (taskStatus.status === 'ready' && taskStatus.output_id) {
      // Update progress: Processing clips
      await KlapJobQueue.updateJob(jobId, { 
        folderId: taskStatus.output_id,
        progress: 50 
      })

      // Process and store clips
      const clips = await processAndStoreClips(projectId, taskStatus.output_id, jobId)
      
      // Complete the job
      await KlapJobQueue.completeJob(jobId, clips)
      
      return
    }

    // Update progress based on time elapsed
    const progress = Math.min(20 + Math.floor((attempts / maxAttempts) * 30), 50)
    await KlapJobQueue.updateJob(jobId, { progress })

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++
  }

  throw new Error('Klap processing timed out')
}

/**
 * Process clips from Klap folder and store them
 */
async function processAndStoreClips(
  projectId: string, 
  folderId: string,
  jobId: string
) {
  // Update project with folder ID
  await ProjectService.updateProject(projectId, {
    klap_folder_id: folderId,
    klap_project_id: folderId
  })

  // Get clips from Klap
  const klapClips = await KlapAPIService.getClipsFromFolder(folderId)
  if (!klapClips || klapClips.length === 0) {
    throw new Error('No clips generated')
  }

  const processedClips = []

  for (let i = 0; i < klapClips.length; i++) {
    const klapClip = klapClips[i]
    const klapId = typeof klapClip === 'string' ? klapClip : klapClip.id
    
    if (!klapId) continue

    try {
      // Update progress
      const progress = 50 + Math.floor((i / klapClips.length) * 40)
      await KlapJobQueue.updateJob(jobId, { progress })

      // Get clip details
      let details: any = {}
      try {
        details = await KlapAPIService.getClipDetails(folderId, klapId)
      } catch (e) {
        // Use defaults if details fail
      }

      // Export clip to get video URL
      const exported = await KlapAPIService.exportMultipleClips(folderId, [klapId])
      if (!exported[0]?.url) {
        console.error(`Failed to export clip ${klapId}`)
        continue
      }

      // Download and store video
      const videoUrl = await downloadAndStoreClip(projectId, exported[0].url, i)

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
        klapFolderId: folderId,
        exportUrl: videoUrl,
        exported: true,
        storedInSupabase: true,
        createdAt: new Date().toISOString()
      }

      processedClips.push(clip)
    } catch (error) {
      console.error(`Failed to process clip ${klapId}:`, error)
    }
  }

  // Store all clips
  const project = await ProjectService.getProject(projectId)
  await ProjectService.updateProject(projectId, {
    folders: {
      clips: processedClips,
      images: project?.folders?.images || [],
      social: project?.folders?.social || [],
      blog: project?.folders?.blog || []
    }
  })

  // Mark as complete in project
  await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')

  return processedClips
}

/**
 * Download clip and store in Supabase
 */
async function downloadAndStoreClip(
  projectId: string,
  exportUrl: string,
  index: number
): Promise<string> {
  const response = await fetch(exportUrl)
  if (!response.ok) {
    throw new Error(`Failed to download clip: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const fileName = `${projectId}/clips/clip_${index}_${Date.now()}.mp4`

  const { error } = await supabaseAdmin.storage
    .from('videos')
    .upload(fileName, buffer, {
      contentType: 'video/mp4',
      upsert: true
    })

  if (error) {
    throw error
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('videos')
    .getPublicUrl(fileName)

  return publicUrl
} 