import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { projectId, folderId } = await request.json()
    
    if (!projectId || !folderId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        usage: {
          projectId: 'Your project ID',
          folderId: 'The Klap folder ID (output_id from task)'
        }
      }, { status: 400 })
    }
    
    // Import the processClipsFromFolder function
    const processClipsModule = await import('./route')
    const processClipsFromFolder = (processClipsModule as any).processClipsFromFolder
    
    if (!processClipsFromFolder) {
      // If not exported, we'll inline the logic
      const { ProjectService, KlapAPIService } = await import('@/lib/services')
      
      console.log(`[Force Process] Starting to force process clips for project ${projectId}, folder ${folderId}`)
      
      // Get clips from folder
      const clips = await KlapAPIService.getClipsFromFolder(folderId)
      
      if (!clips || clips.length === 0) {
        return NextResponse.json({
          error: 'No clips found in folder',
          folderId,
          response: clips
        }, { status: 404 })
      }
      
      // Process and store clips
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        const clipId = clip.id || clip
        
        const clipData = {
          id: clipId,
          title: `Clip ${i + 1}`,
          description: '',
          startTime: 0,
          endTime: 0,
          duration: 0,
          thumbnail: `https://klap.app/player/${clipId}/thumbnail`,
          tags: [],
          score: 0.5,
          type: 'highlight' as const,
          klapProjectId: clipId,
          klapFolderId: folderId,
          previewUrl: `https://klap.app/player/${clipId}`,
          exportUrl: `https://klap.app/player/${clipId}`,
          exported: true,
          storedInSupabase: false,
          createdAt: new Date().toISOString()
        }
        
        await ProjectService.addToFolder(projectId, 'clips', clipData)
      }
      
      // Update task status
      await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
      
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${clips.length} clips`,
        clipsCount: clips.length
      })
    } else {
      // Use the existing function
      await processClipsFromFolder(projectId, folderId)
      
      return NextResponse.json({
        success: true,
        message: 'Clips processing started'
      })
    }
  } catch (error) {
    console.error('Force process error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process clips' },
      { status: 500 }
    )
  }
} 