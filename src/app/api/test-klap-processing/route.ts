import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  
  if (!projectId) {
    return NextResponse.json({ 
      error: 'Please provide projectId as query parameter',
      example: '/api/test-klap-processing?projectId=YOUR_PROJECT_ID'
    }, { status: 400 })
  }

  try {
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get all tasks
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    const transcriptionTask = project.tasks.find(t => t.type === 'transcription')
    
    // Check if background processing might have failed
    const diagnostics: any = {
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        hasVideoUrl: !!project.video_url,
        klapProjectId: project.klap_project_id || 'NOT SET',
        klapFolderId: project.klap_folder_id || 'NOT SET',
      },
      tasks: {
        clips: clipsTask ? {
          status: clipsTask.status,
          progress: clipsTask.progress,
          startedAt: clipsTask.startedAt,
          completedAt: clipsTask.completedAt,
          error: clipsTask.error,
          timeTaken: clipsTask.completedAt && clipsTask.startedAt ? 
            `${Math.round((new Date(clipsTask.completedAt).getTime() - new Date(clipsTask.startedAt).getTime()) / 1000)} seconds` : 
            'N/A'
        } : 'NO CLIPS TASK',
        transcription: transcriptionTask ? {
          status: transcriptionTask.status,
          progress: transcriptionTask.progress,
          timeTaken: transcriptionTask.completedAt && transcriptionTask.startedAt ? 
            `${Math.round((new Date(transcriptionTask.completedAt).getTime() - new Date(transcriptionTask.startedAt).getTime()) / 1000)} seconds` : 
            'N/A'
        } : 'NO TRANSCRIPTION TASK'
      },
      clips: {
        count: project.folders?.clips?.length || 0,
        hasClips: !!project.folders?.clips && project.folders.clips.length > 0,
        clipIds: project.folders?.clips?.map(c => c.id) || []
      },
      possibleIssues: [] as string[],
      recommendations: [] as string[]
    }
    
    // Analyze for issues
    if (clipsTask?.status === 'completed' && !diagnostics.clips.hasClips) {
      diagnostics.possibleIssues.push('Task marked as completed but no clips were generated')
      diagnostics.recommendations.push('The task might have completed too early before Klap finished processing')
    }
    
    if (clipsTask && clipsTask.completedAt && clipsTask.startedAt) {
      const timeTaken = Math.round((new Date(clipsTask.completedAt).getTime() - new Date(clipsTask.startedAt).getTime()) / 1000)
      if (timeTaken <= 1) {
        diagnostics.possibleIssues.push('Task completed instantly - background processing might have failed')
        diagnostics.recommendations.push('Check server logs for [Klap Background] errors')
      }
    }
    
    if (!project.klap_project_id && clipsTask?.status === 'completed') {
      diagnostics.possibleIssues.push('No Klap project ID but task is completed')
      diagnostics.recommendations.push('The Klap API call might have failed')
    }
    
    if (clipsTask?.status === 'completed' && diagnostics.clips.count === 0) {
      diagnostics.possibleIssues.push('Clips task completed with 0 clips')
      diagnostics.recommendations.push('Check if KLAP_API_KEY is set correctly in production')
    }
    
    // Check environment
    diagnostics.environment = {
      hasKlapApiKey: !!process.env.KLAP_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      skipVideoReupload: process.env.SKIP_KLAP_VIDEO_REUPLOAD === 'true'
    }
    
    return NextResponse.json({
      ...diagnostics,
      summary: diagnostics.possibleIssues.length > 0 ? 
        '⚠️ Issues detected with clip processing' : 
        '✅ No obvious issues detected'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check project',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 