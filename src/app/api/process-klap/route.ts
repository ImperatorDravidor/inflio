import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const { projectId, videoUrl } = await request.json()

  // Authenticate the user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate the request body
  if (!projectId || !videoUrl) {
    return NextResponse.json({ error: 'Missing projectId or videoUrl' }, { status: 400 })
  }

  try {
    const project = await ProjectService.getProject(projectId)
    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(`[Klap Route] Starting Klap processing for project: ${projectId}`)
    
    // The single public method handles the entire workflow: task creation, polling, and result fetching.
    const klapResult = await KlapAPIService.processVideo(videoUrl, project.title)

    console.log(`[Klap Route] Klap processing complete for project ${projectId}. Storing results.`)

    // Store Klap results and only update transcription if it doesn't exist
    const updateData: any = {
      klap_project_id: klapResult.klapFolderId // Use folder ID as the main reference
    }

    // Only update transcription if it hasn't been done by AssemblyAI
    if (!project.transcription) {
      updateData.transcription = klapResult.transcription
      await ProjectService.updateTaskProgress(projectId, 'transcription', 100, 'completed')
    }

    await ProjectService.updateProject(projectId, updateData)

    // Store the generated clips from Klap
    const clipsToStore = klapResult.clips.map((clip: any) => ({
      id: clip.id,
      title: clip.name,
      description: clip.transcript || 'AI-generated clip.',
      startTime: 0, 
      endTime: 0,
      duration: 0,
      thumbnail: `https://klap.app/player/${clip.id}/thumbnail`,
      tags: [],
      score: clip.virality_score || 0.8,
      type: 'highlight' as const,
      klapProjectId: clip.id,
      previewUrl: `https://klap.app/player/${clip.id}`,
    }))

    for (const clip of clipsToStore) {
      await ProjectService.addToFolder(projectId, 'clips', clip)
    }
    await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
    
    console.log(`[Klap Route] Stored ${klapResult.clips.length} clips and transcription.`)

    return NextResponse.json({
      success: true,
      message: `Successfully processed and stored ${klapResult.clips.length} clips.`,
      ...klapResult
    })

  } catch (error) {
    console.error(`[Klap Route] Critical error for project ${projectId}:`, error)
    if (projectId) {
        await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
        await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed')
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred while processing with Klap.' },
      { status: 500 }
    )
  }
}

// Check Klap processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      )
    }

    // Get project
    const project = await ProjectService.getProject(projectId)
    if (!project || !project.klap_project_id) {
      return NextResponse.json(
        { error: 'Project or Klap project not found' },
        { status: 404 }
      )
    }

    // Check Klap status
    const status = await KlapAPIService.getProjectStatus(project.klap_project_id)
    
    return NextResponse.json({
      success: true,
      status: status.status,
      progress: status.progress,
      message: status.message
    })
  } catch (error) {
    console.error('Klap status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
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
