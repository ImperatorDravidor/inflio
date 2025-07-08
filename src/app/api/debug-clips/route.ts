import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  
  if (!projectId) {
    return NextResponse.json({ 
      error: 'Missing projectId',
      usage: '/api/debug-clips?projectId=YOUR_PROJECT_ID'
    }, { status: 400 })
  }

  try {
    const { ProjectService } = await import('@/lib/services')
    const project = await ProjectService.getProject(projectId)
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const clips = project.folders?.clips || []
    
    return NextResponse.json({
      projectId: project.id,
      klap_project_id: project.klap_project_id,
      klap_folder_id: project.klap_folder_id,
      clipCount: clips.length,
      clips: clips.map((clip: any, index: number) => ({
        index,
        id: clip.id,
        title: clip.title,
        hasDescription: !!clip.description,
        description: clip.description,
        hasViralityExplanation: !!clip.viralityExplanation,
        viralityExplanation: clip.viralityExplanation,
        hasTranscript: !!clip.transcript,
        transcript: clip.transcript?.substring(0, 100) + '...',
        hasCaptions: !!clip.captions,
        captions: clip.captions?.substring(0, 100) + '...',
        score: clip.score,
        duration: clip.duration,
        thumbnail: clip.thumbnail,
        previewUrl: clip.previewUrl,
        exportUrl: clip.exportUrl,
        rawKlapDataKeys: clip.rawKlapData ? Object.keys(clip.rawKlapData) : [],
        rawKlapData: clip.rawKlapData
      })),
      uniqueIds: [...new Set(clips.map((c: any) => c.id))].length,
      duplicateCheck: clips.length !== [...new Set(clips.map((c: any) => c.id))].length ? 'DUPLICATES FOUND!' : 'No duplicates'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to debug clips',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 