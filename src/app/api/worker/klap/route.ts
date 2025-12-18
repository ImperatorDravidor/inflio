import { NextRequest, NextResponse } from 'next/server'
import { KlapJobQueue, type KlapJob } from '@/lib/redis'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateTaskProgressServer } from '@/lib/server-project-utils'

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
    console.log('[Worker] Klap worker endpoint called')
    
    // Check auth
    const authHeader = request.headers.get('authorization')
    console.log('[Worker] Auth header present:', !!authHeader)
    
    if (authHeader !== `Bearer ${process.env.WORKER_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean up stale jobs before processing new ones
    const cleanedCount = await KlapJobQueue.cleanupStaleJobs()
    if (cleanedCount > 0) {
      console.log(`[Worker] Cleaned up ${cleanedCount} stale jobs`)
    }

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

  // First check if the project still exists
  console.log(`[Worker] Checking if project ${projectId} exists...`)
  const project = await ProjectService.getProject(projectId)
  
  if (!project) {
    console.log(`[Worker] Project ${projectId} no longer exists, removing job completely`)
    await KlapJobQueue.removeJob(jobId, projectId)
    throw new Error('Project no longer exists - job removed')
  }

  // Update progress: Starting
  await KlapJobQueue.updateJob(jobId, { progress: 15 })
  console.log(`[Worker] Starting Klap task creation for video: ${videoUrl}`)

  // Start Klap processing
  let task
  try {
    task = await KlapAPIService.createVideoTask(videoUrl)
    console.log(`[Worker] Klap task created successfully:`, {
      taskId: task.id,
      projectId,
      jobId
    })
  } catch (error) {
    console.error(`[Worker] Failed to create Klap task:`, error)
    throw error
  }
  
  // Update job with task ID
  await KlapJobQueue.updateJob(jobId, { 
    taskId: task.id,
    progress: 25 
  })
  console.log(`[Worker] Updated job with Klap task ID: ${task.id}`)

  // Update project with task ID
  try {
    const updateResult = await ProjectService.updateProject(projectId, {
      klap_project_id: task.id
    })
    
    if (!updateResult) {
      console.error(`[Worker] Failed to update project ${projectId} - project may have been deleted`)
      // Continue processing anyway as the Klap task is already created
    }
  } catch (error: any) {
    console.error(`[Worker] Error updating project ${projectId}:`, error.message)
    // Continue processing even if project update fails
  }

  // Poll for completion with better error handling
  let attempts = 0
  const maxAttempts = 180 // 15 minutes with 5-second intervals for Klap processing
  let lastError: Error | null = null
  
  console.log(`[Worker] Starting to poll Klap task ${task.id} for completion`)
  
  while (attempts < maxAttempts) {
    try {
      // Check task status using the proper API endpoint
      const taskResponse = await fetch(`https://api.klap.app/v2/tasks/${task.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (!taskResponse.ok) {
        const errorText = await taskResponse.text()
        console.error(`[Worker] Klap API error response:`, {
          status: taskResponse.status,
          statusText: taskResponse.statusText,
          body: errorText
        })
        
        // Handle rate limiting
        if (taskResponse.status === 429) {
          console.log(`[Worker] Rate limited, waiting 60 seconds...`)
          await new Promise(resolve => setTimeout(resolve, 60000))
          attempts += 12 // Count as 12 attempts (60s / 5s)
          continue
        }
        
        throw new Error(`Failed to check Klap status: ${taskResponse.status} - ${errorText}`)
      }
      
      const taskStatus = await taskResponse.json()
      console.log(`[Worker] Klap task status:`, {
        taskId: task.id,
        status: taskStatus.status,
        hasOutputId: !!taskStatus.output_id,
        attempt: attempts + 1,
        maxAttempts
      })
      
      if (taskStatus.status === 'failed' || taskStatus.status === 'error') {
        throw new Error(`Klap processing failed: ${taskStatus.error || 'Unknown error'}`)
      }

      if (taskStatus.status === 'ready' && taskStatus.output_id) {
        console.log(`[Worker] Klap task completed! Output ID: ${taskStatus.output_id}`)
        
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
      const progress = Math.min(25 + Math.floor((attempts / maxAttempts) * 25), 50)
      await KlapJobQueue.updateJob(jobId, { progress })
      
      lastError = null // Reset error on successful check
    } catch (error) {
      console.error(`[Worker] Error checking Klap task status (attempt ${attempts + 1}):`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++
  }

  // Timeout reached
  const timeoutMessage = `Klap processing timed out after ${Math.floor(attempts * 5 / 60)} minutes`
  if (lastError) {
    throw new Error(`${timeoutMessage}. Last error: ${lastError.message}`)
  }
  throw new Error(timeoutMessage)
}

/**
 * Process clips from Klap folder and store them
 */
async function processAndStoreClips(
  projectId: string, 
  folderId: string,
  jobId: string
) {
  // First check if project still exists
  const projectExists = await ProjectService.getProject(projectId)
  if (!projectExists) {
    console.log(`[Worker] Project ${projectId} no longer exists, skipping clip storage`)
    throw new Error('Project no longer exists')
  }

  // Update project with folder ID
  const updateResult = await ProjectService.updateProject(projectId, {
    klap_folder_id: folderId,
    klap_project_id: folderId
  })
  
  if (!updateResult) {
    console.error(`[Worker] Failed to update project ${projectId} with folder ID`)
    throw new Error('Failed to update project')
  }

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

      // Create clip object with all metadata
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
        createdAt: new Date().toISOString(),
        // Additional metadata from Klap
        viralityExplanation: details.virality_score_explanation || details.description || '',
        transcript: details.transcript || details.subtitle || details.text || '',
        rawKlapData: details, // Store raw response for debugging
        publicationCaptions: details.publication_captions || details.captions || undefined
      }

      processedClips.push(clip)
    } catch (error) {
      console.error(`Failed to process clip ${klapId}:`, error)
    }
  }

  // Check again if project exists before final update
  const project = await ProjectService.getProject(projectId)
  if (!project) {
    console.log(`[Worker] Project ${projectId} disappeared during processing`)
    throw new Error('Project no longer exists')
  }

  // Store all clips
  const finalUpdate = await ProjectService.updateProject(projectId, {
    folders: {
      clips: processedClips,
      images: project.folders?.images || [],
      social: project.folders?.social || [],
      blog: project.folders?.blog || []
    }
  })
  
  if (!finalUpdate) {
    console.error(`[Worker] Failed to store clips for project ${projectId}`)
    throw new Error('Failed to store clips')
  }

  // Mark as complete in project
  await updateTaskProgressServer(projectId, 'clips', 100, 'completed')

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