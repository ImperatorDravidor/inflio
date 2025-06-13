import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/db-migration'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId, videoUrl } = await request.json()

    if (!projectId || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, videoUrl' },
        { status: 400 }
      )
    }

    // Get project to verify ownership and status
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Process video with Klap API
    const result = await KlapAPIService.processVideoToClips(videoUrl, {
      language: 'en',
      maxDuration: 60,
      maxClipCount: 5,
      onProgress: async (message) => {
        // Update task progress in database
        const progress = message.includes('Creating') ? 10 :
                        message.includes('Processing') ? 50 :
                        message.includes('Retrieving') ? 90 : 50
        
        await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing')
      }
    })

    // Store clips information in project - map to ClipData format
    const clipsData = result.clips.map((clip, index) => ({
      id: clip.id,
      title: clip.name,
      description: `AI-generated clip with virality score: ${(clip.viralityScore * 100).toFixed(0)}%`,
      startTime: 0, // Klap doesn't provide specific timestamps
      endTime: 60, // Default to 60 seconds as per maxDuration
      duration: 60,
      thumbnail: '', // Will need to be generated separately
      tags: ['ai-generated', 'viral-clip', `score-${Math.round(clip.viralityScore * 100)}`],
      score: clip.viralityScore,
      type: 'highlight' as const,
      // Store Klap-specific data as additional properties
      klapProjectId: clip.id,
      klapFolderId: result.folderId,
      previewUrl: clip.previewUrl
    }))

    // Add clips to project folder
    for (const clip of clipsData) {
      await ProjectService.addToFolder(projectId, 'clips', clip)
    }

    // Mark clips task as completed
    await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')

    return NextResponse.json({
      success: true,
      clips: clipsData,
      folderId: result.folderId
    })
  } catch (error) {
    console.error('Klap processing error:', error)
    
    // Update task status to failed if projectId is available
    const body = await request.json().catch(() => ({}))
    if (body.projectId) {
      await ProjectService.updateTaskProgress(body.projectId, 'clips', 0, 'failed')
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video with Klap' },
      { status: 500 }
    )
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
        console.log(`Export progress: ${message} (${index + 1}/${total})`)
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