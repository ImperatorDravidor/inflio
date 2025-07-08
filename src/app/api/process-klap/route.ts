import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Increase timeout for this route to handle multiple clips
export const maxDuration = 300; // 5 minutes - should be enough to start processing
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, videoUrl } = body

    // Edge runtime compatibility
    const { auth } = await import('@clerk/nextjs/server')
    const { ProjectService } = await import('@/lib/services')

    console.log(`[Klap Route] Processing request for project: ${projectId}`)
    console.log(`[Klap Route] Video URL received: ${videoUrl}`)
    console.log(`[Klap Route] Video URL format check:`, {
      isSupabaseUrl: videoUrl?.includes('supabase'),
      isPublicUrl: videoUrl?.includes('public'),
      urlLength: videoUrl?.length,
      urlStart: videoUrl?.substring(0, 50) + '...'
    })

    // Handle missing environment variable
    if (!process.env.KLAP_API_KEY) {
      console.error('[Klap Route] KLAP_API_KEY is not configured')
      return NextResponse.json({ 
        error: 'Video clip generation is temporarily unavailable. Please contact support.' 
      }, { status: 503 })
    }

    // Authenticate the user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate the request body
    if (!projectId || !videoUrl) {
      return NextResponse.json({ error: 'Missing projectId or videoUrl' }, { status: 400 })
    }

    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(`[Klap Route] Starting Klap processing for project: ${projectId}`)
    
    // Update task status to processing
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing');
    
    // IMPORTANT: For Vercel, we need a different approach
    // Instead of background processing, we'll just create the Klap task
    // and let the client poll for status
    
    try {
      // Import KlapAPIService dynamically for Edge runtime
      const { KlapAPIService } = await import('@/lib/klap-api')
      
      // Only create the task, don't wait for completion
      const task = await KlapAPIService.createVideoTask(videoUrl)
      console.log(`[Klap Route] Klap task created successfully: ${task.id}`)
      
      // Store the task ID for later polling
      await ProjectService.updateProject(projectId, {
        klap_project_id: task.id // Store task ID temporarily until we get the folder ID
      })
      
      // Update progress to show task was created (keep at 5% to be consistent)
      // Progress will increase based on elapsed time in the GET endpoint
      
      return NextResponse.json({
        success: true,
        message: 'Clip generation started. This process typically takes 10-20 minutes.',
        status: 'processing',
        projectId: projectId,
        taskId: task.id
      })
      
    } catch (error) {
      console.error(`[Klap Route] Failed to create Klap task:`, error)
      await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
      
      if (error instanceof Error && error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Klap authentication failed. Please check API configuration.' },
          { status: 503 }
        )
      }
      
      throw error
    }

  } catch (error) {
    console.error(`[Klap Route] Critical error:`, error)
    
    // Return appropriate error status based on error type
    let status = 500
    let errorMessage = 'An unknown error occurred while processing with Klap.'
    
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        status = 504
        errorMessage = 'Processing timed out. Please try again with a shorter video.'
      } else if (error.message.includes('not found')) {
        status = 404
      } else if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
        status = 401
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// Check Klap processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const debug = searchParams.get('debug') === 'true'

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      )
    }

    // Import services
    const { ProjectService, KlapAPIService } = await import('@/lib/services')

    // Get project
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Debug mode - return detailed information
    if (debug) {
      const clipsTask = project.tasks.find(t => t.type === 'clips')
      return NextResponse.json({
        projectId: project.id,
        klap_project_id: project.klap_project_id,
        klap_folder_id: project.klap_folder_id,
        clips: {
          count: project.folders?.clips?.length || 0,
          items: project.folders?.clips?.map(c => ({
            id: c.id,
            title: c.title,
            duration: c.duration,
            score: c.score,
            hasExportUrl: !!c.exportUrl,
            hasPreviewUrl: !!c.previewUrl
          })) || []
        },
        task: clipsTask ? {
          status: clipsTask.status,
          progress: clipsTask.progress,
          startedAt: clipsTask.startedAt,
          completedAt: clipsTask.completedAt
        } : null
      })
    }

    // Get clips task
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    
    // If no task or already completed/failed, return current status
    if (!clipsTask || clipsTask.status === 'completed' || clipsTask.status === 'failed') {
      return NextResponse.json({
        success: true,
        status: clipsTask?.status || 'not_started',
        progress: clipsTask?.progress || 0,
        message: clipsTask?.status === 'completed' ? 'Clips ready' : 'Clips not started',
        clipsCount: project.folders?.clips?.length || 0
      })
    }

    // If we have a klap_project_id and task is processing, check the Klap task status
    if (project.klap_project_id && clipsTask.status === 'processing') {
      try {
        // Check if it's a task ID or folder ID based on length
        // Task IDs are 16 characters, folder IDs are 8 characters
        const isTaskId = project.klap_project_id.length === 16 || project.klap_project_id.length === 12
        console.log(`[Klap GET] Checking status for ${project.klap_project_id} (length: ${project.klap_project_id.length}), isTaskId: ${isTaskId}`)
        
        if (isTaskId) {
          // Poll the task status
          const taskResponse = await fetch(`https://api.klap.app/v2/tasks/${project.klap_project_id}`, {
            headers: {
              'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
            }
          })
          
          console.log(`[Klap GET] Task API response status: ${taskResponse.status}`)
          
          if (!taskResponse.ok) {
            const errorText = await taskResponse.text()
            console.error(`[Klap GET] Task API error: ${taskResponse.status} - ${errorText}`)
            
            if (taskResponse.status === 404) {
              // Task not found - mark as failed
              await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
              return NextResponse.json({
                success: false,
                status: 'failed',
                message: 'Klap task not found. It may have expired or been deleted.'
              })
            }
            
            throw new Error(`Klap API error: ${taskResponse.status}`)
          }
          
          const task = await taskResponse.json()
          console.log(`[Klap GET] Task status: ${task.status}, has output_id: ${!!task.output_id}`)
          console.log(`[Klap GET] Full task object:`, JSON.stringify(task, null, 2))
          
          if (task.status === 'ready' && task.output_id) {
            // Task is complete! Now we can process the clips
            console.log(`[Klap GET] Task ${project.klap_project_id} is ready. Processing clips...`)
            console.log(`[Klap GET] Output folder ID: ${task.output_id}`)
            console.log(`[Klap GET] Full task response:`, JSON.stringify(task, null, 2))
            
            // Update project with the folder ID
            await ProjectService.updateProject(projectId, {
              klap_folder_id: task.output_id,
              klap_project_id: task.output_id // Replace task ID with folder ID
            })
            
            // Process the clips
            await processClipsFromFolder(projectId, task.output_id)
            
            return NextResponse.json({
              success: true,
              status: 'processing',
              progress: 50,
              message: 'Clips generated, downloading to storage...'
            })
          } else if (task.status === 'error' || task.status === 'failed') {
            // Task failed
            console.error(`[Klap GET] Task failed with status: ${task.status}, error: ${task.error || 'Unknown error'}`)
            await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
            return NextResponse.json({
              success: false,
              status: 'failed',
              message: task.error || 'Klap processing failed. Please try again with a different video.'
            })
          } else {
            // Still processing
            const elapsedTime = clipsTask.startedAt ? 
              Math.floor((Date.now() - new Date(clipsTask.startedAt).getTime()) / 1000) : 0
            const estimatedProgress = Math.min(5 + Math.floor(elapsedTime / 20), 45) // Start at 5%, add 1% every 20 seconds, max 45%
            
            // Update the progress in the database
            if (estimatedProgress > (clipsTask.progress || 5)) {
              await ProjectService.updateTaskProgress(projectId, 'clips', estimatedProgress, 'processing')
            }
            
            return NextResponse.json({
              success: true,
              status: 'processing',
              progress: estimatedProgress,
              message: `Klap is processing your video... (${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s elapsed)`
            })
          }
        } else {
          // We have a folder ID, check if clips are processed
          if (!project.folders?.clips || project.folders.clips.length === 0) {
            // No clips yet, process them
            console.log(`[Klap GET] Processing clips from folder ${project.klap_project_id}`)
            await processClipsFromFolder(projectId, project.klap_project_id)
          }
          
          return NextResponse.json({
            success: true,
            status: clipsTask.status,
            progress: clipsTask.progress,
            message: 'Processing clips...',
            clipsCount: project.folders?.clips?.length || 0
          })
        }
      } catch (error) {
        console.error('[Klap GET] Error checking status:', error)
        // Don't fail the whole request, just log the error
        return NextResponse.json({
          success: true,
          status: 'processing',
          progress: clipsTask.progress || 20,
          message: 'Processing clips...',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Default response
    return NextResponse.json({
      success: true,
      status: clipsTask.status,
      progress: clipsTask.progress || 0,
      message: `Clips ${clipsTask.status}`,
      clipsCount: project.folders?.clips?.length || 0
    })
  } catch (error) {
    console.error('Klap status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
}

// Helper function to process clips from a Klap folder
async function processClipsFromFolder(projectId: string, folderId: string) {
  const { ProjectService, KlapAPIService } = await import('@/lib/services')
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  
  console.log(`[Klap processClipsFromFolder] Starting to process clips for project ${projectId}, folder ${folderId}`)
  
  try {
    // Get clips from folder
    const clips = await KlapAPIService.getClipsFromFolder(folderId)
    
    console.log(`[Klap processClipsFromFolder] Received clips response:`, JSON.stringify(clips, null, 2))
    console.log(`[Klap processClipsFromFolder] Number of clips: ${clips?.length || 0}`)
    console.log(`[Klap processClipsFromFolder] Clips type: ${typeof clips}, isArray: ${Array.isArray(clips)}`)
    
    if (!clips || clips.length === 0) {
      console.warn(`[Klap] No clips found in folder ${folderId}`)
      console.warn(`[Klap] Empty clips response details:`, {
        clips,
        isNull: clips === null,
        isUndefined: clips === undefined,
        isEmptyArray: Array.isArray(clips) && clips.length === 0
      })
      await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
      return
    }
    
    console.log(`[Klap] Processing ${clips.length} clips from folder ${folderId}`)
    
    // Update progress
    await ProjectService.updateTaskProgress(projectId, 'clips', 60, 'processing')
    
    // Process each clip
    const skipVideoReupload = process.env.SKIP_KLAP_VIDEO_REUPLOAD === 'true'
    console.log(`[Klap] Skip video reupload: ${skipVideoReupload}`)
    const processedClips = []
    
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      try {
        console.log(`[Klap] Processing clip ${i + 1}/${clips.length}: ${clip.id || clip}`)
        console.log(`[Klap] Clip type: ${typeof clip}, value:`, clip)
        
        // Handle different clip data structures
        // Clips can be returned as:
        // 1. Simple strings (just the clip ID)
        // 2. Objects with an id property
        const clipId = typeof clip === 'string' ? clip : (clip.id || clip)
        
        if (!clipId) {
          console.error(`[Klap] Invalid clip data at index ${i}:`, clip)
          continue
        }
        
        // Get clip details
        let clipDetails: any = {}
        try {
          clipDetails = await KlapAPIService.getClipDetails(folderId, clipId)
          console.log(`[Klap] Got clip details for ${clipId}:`, JSON.stringify(clipDetails, null, 2))
        } catch (detailError) {
          console.error(`[Klap] Failed to get clip details for ${clipId}:`, detailError)
          // Use basic clip info if details fail
          clipDetails = { id: clipId }
        }
        
        // Handle video storage
        let exportUrl = `https://klap.app/player/${clipId}`
        let storedVideoUrl = exportUrl
        
        if (!skipVideoReupload) {
          // Download and store clip
          try {
            const exportedData = await KlapAPIService.exportMultipleClips(folderId, [clipId])
            
            if (exportedData.length > 0 && exportedData[0].url) {
              exportUrl = exportedData[0].url
              
              // Download and upload to Supabase
              const clipResponse = await fetch(exportUrl)
              if (clipResponse.ok) {
                const clipBuffer = await clipResponse.arrayBuffer()
                const clipBlob = Buffer.from(clipBuffer)
                
                const clipFileName = `${projectId}/clips/clip_${i + 1}_${clipId}.mp4`
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                  .from('videos')
                  .upload(clipFileName, clipBlob, {
                    contentType: 'video/mp4',
                    upsert: true
                  })
                
                if (!uploadError) {
                  const { data: { publicUrl } } = supabaseAdmin.storage
                    .from('videos')
                    .getPublicUrl(clipFileName)
                  
                  storedVideoUrl = publicUrl
                }
              }
            }
          } catch (error) {
            console.error(`[Klap] Failed to download/store clip ${clipId}:`, error)
          }
        }
        
        // Prepare clip data
        const clipData: any = {
          id: clipId,
          title: clipDetails.name || clipDetails.title || `Clip ${i + 1}`,
          description: clipDetails.virality_score_explanation || '',
          startTime: clipDetails.start_time || 0,
          endTime: clipDetails.end_time || 0,
          duration: clipDetails.duration || (clipDetails.end_time - clipDetails.start_time) || 0,
          thumbnail: clipDetails.thumbnail || `https://klap.app/player/${clipId}/thumbnail`,
          tags: clipDetails.tags || [],
          score: (clipDetails.virality_score || 0) / 100,
          type: 'highlight' as const,
          klapProjectId: clipId,
          klapFolderId: folderId,
          previewUrl: `https://klap.app/player/${clipId}`,
          exportUrl: storedVideoUrl,
          exported: true,
          storedInSupabase: !skipVideoReupload && storedVideoUrl !== exportUrl,
          rawKlapData: clipDetails,
          createdAt: new Date().toISOString()
        }
        
        processedClips.push(clipData)
        
        // Update progress
        const progress = 60 + Math.floor(((i + 1) / clips.length) * 40)
        await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing')
        
      } catch (error) {
        console.error(`[Klap] Failed to process clip ${clip.id}:`, error)
      }
    }
    
    // Store all clips
    for (const clip of processedClips) {
      await ProjectService.addToFolder(projectId, 'clips', clip)
    }
    
    // Mark task as completed
    await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
    
    console.log(`[Klap] Successfully processed ${processedClips.length} clips for project ${projectId}`)
    
  } catch (error) {
    console.error(`[Klap] Failed to process clips from folder ${folderId}:`, error)
    await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
  }
}

// Export individual clips
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId, clipIds, klapFolderId } = await request.json()

    if (!projectId || !clipIds || !klapFolderId || !Array.isArray(clipIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, clipIds, klapFolderId' },
        { status: 400 }
      )
    }

    // Export clips from Klap
    const exportedClips = await KlapAPIService.exportMultipleClips(
      klapFolderId,
      clipIds,
      undefined, // No watermark for now
      (message, index, total) => {
        // This is a progress callback, logging here can be useful for server-side monitoring
        // but can be removed if too noisy for production.
        // console.log(`Export progress: ${message} (${index + 1}/${total})`)
      }
    )

    // Update project with exported clip URLs
    const project = await ProjectService.getProject(projectId)
    if (project && project.folders.clips) {
      const updatedClips = project.folders.clips.map(clip => {
        const exported = exportedClips.find(e => e.projectId === clip.id)
        if (exported) {
          return { ...clip, exportUrl: exported.url, exported: true }
        }
        return clip
      })

      await ProjectService.updateProject(projectId, {
        folders: {
          ...project.folders,
          clips: updatedClips
        }
      })
    }

    return NextResponse.json({
      success: true,
      exportedClips
    })
  } catch (error) {
    console.error('Klap export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export clips' },
      { status: 500 }
    )
  }
} 
