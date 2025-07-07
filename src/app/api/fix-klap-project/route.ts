import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { projectId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Missing projectId',
        usage: 'POST with { "projectId": "your-project-id" }'
      }, { status: 400 })
    }
    
    const { ProjectService } = await import('@/lib/services')
    
    // Get the project
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    if (!project.klap_project_id) {
      return NextResponse.json({ error: 'No Klap project ID found' }, { status: 404 })
    }
    
    console.log(`[Fix Klap] Checking task ${project.klap_project_id} for project ${projectId}`)
    
    // Check the task status to get the real folder ID
    const taskResponse = await fetch(`https://api.klap.app/v2/tasks/${project.klap_project_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
      }
    })
    
    if (!taskResponse.ok) {
      const errorText = await taskResponse.text()
      return NextResponse.json({ 
        error: `Failed to check task: ${taskResponse.status} - ${errorText}` 
      }, { status: 500 })
    }
    
    const taskData = await taskResponse.json()
    
    if (taskData.status !== 'ready') {
      return NextResponse.json({ 
        error: `Task not ready: ${taskData.status}`,
        taskData 
      }, { status: 400 })
    }
    
    if (!taskData.output_id) {
      return NextResponse.json({ 
        error: 'Task ready but no output_id found',
        taskData 
      }, { status: 400 })
    }
    
    const folderId = taskData.output_id
    console.log(`[Fix Klap] Found folder ID: ${folderId}`)
    
    // Test fetching clips from the correct folder
    const { KlapAPIService } = await import('@/lib/klap-api')
    const clips = await KlapAPIService.getClipsFromFolder(folderId)
    
    console.log(`[Fix Klap] Found ${clips.length} clips in folder ${folderId}`)
    
    if (clips.length === 0) {
      return NextResponse.json({ 
        error: 'No clips found in folder',
        folderId,
        taskData 
      }, { status: 404 })
    }
    
    // Update the project with the correct folder ID
    await ProjectService.updateProject(projectId, {
      klap_folder_id: folderId,
      klap_project_id: folderId // Replace task ID with folder ID
    })
    
    console.log(`[Fix Klap] Updated project ${projectId} with folder ID ${folderId}`)
    
    // Process and store all clips
    const skipVideoReupload = process.env.SKIP_KLAP_VIDEO_REUPLOAD === 'true'
    const processedClips = []
    
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const clipId = clip.id || clip
      
      // Get basic clip details
      let clipDetails: any = {}
      try {
        clipDetails = await KlapAPIService.getClipDetails(folderId, clipId)
      } catch (error) {
        console.warn(`[Fix Klap] Failed to get details for clip ${clipId}:`, error)
        clipDetails = { id: clipId }
      }
      
      const clipData = {
        id: clipId,
        title: clipDetails.name || clipDetails.title || `Clip ${i + 1}`,
        description: clipDetails.virality_score_explanation || '',
        startTime: clipDetails.start_time || 0,
        endTime: clipDetails.end_time || 0,
        duration: clipDetails.duration || 0,
        thumbnail: clipDetails.thumbnail || `https://klap.app/player/${clipId}/thumbnail`,
        tags: clipDetails.tags || [],
        score: (clipDetails.virality_score || 0) / 100,
        type: 'highlight' as const,
        klapProjectId: clipId,
        klapFolderId: folderId,
        previewUrl: `https://klap.app/player/${clipId}`,
        exportUrl: `https://klap.app/player/${clipId}`,
        exported: true,
        storedInSupabase: false,
        rawKlapData: clipDetails,
        createdAt: new Date().toISOString()
      }
      
      await ProjectService.addToFolder(projectId, 'clips', clipData)
      processedClips.push(clipData)
    }
    
    // Mark clips task as completed
    await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
    
    console.log(`[Fix Klap] Successfully stored ${processedClips.length} clips for project ${projectId}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully fixed project and stored ${clips.length} clips`,
      project: {
        id: projectId,
        oldTaskId: project.klap_project_id,
        newFolderId: folderId,
        clipsCount: clips.length
      },
      clips: processedClips.map(c => ({
        id: c.id,
        title: c.title,
        duration: c.duration,
        score: c.score
      }))
    })
  } catch (error) {
    console.error('Fix Klap project error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix project' },
      { status: 500 }
    )
  }
} 