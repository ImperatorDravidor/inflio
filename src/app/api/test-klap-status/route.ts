import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'
import { KlapAPIService } from '@/lib/klap-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  
  if (!projectId) {
    return NextResponse.json({ 
      error: 'Please provide projectId as query parameter',
      example: '/api/test-klap-status?projectId=YOUR_PROJECT_ID'
    }, { status: 400 })
  }

  try {
    // Get project details
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get clips task
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    
    // Prepare diagnostic info
    const diagnostics: any = {
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        hasVideoUrl: !!project.video_url,
        videoUrl: project.video_url ? 'Present' : 'Missing',
        klapProjectId: project.klap_project_id || 'Not set',
        klapFolderId: project.klap_folder_id || 'Not set'
      },
      clipsTask: clipsTask ? {
        status: clipsTask.status,
        progress: clipsTask.progress,
        startedAt: clipsTask.startedAt,
        completedAt: clipsTask.completedAt,
        error: clipsTask.error
      } : 'No clips task found',
      clips: {
        count: project.folders?.clips?.length || 0,
        details: project.folders?.clips?.slice(0, 3).map(c => ({
          id: c.id,
          title: c.title,
          duration: c.duration,
          score: c.score,
          hasUrls: {
            export: !!c.exportUrl,
            preview: !!c.previewUrl
          }
        })) || []
      },
      environment: {
        hasKlapApiKey: !!process.env.KLAP_API_KEY,
        skipVideoReupload: process.env.SKIP_KLAP_VIDEO_REUPLOAD !== 'false'
      }
    }

    // If Klap project ID exists, try to check its status
    if (project.klap_project_id && project.klap_project_id !== 'Not set') {
      try {
        const klapStatus = await KlapAPIService.getProjectStatus(project.klap_project_id)
        diagnostics['klapApiStatus'] = klapStatus
      } catch (klapError) {
        diagnostics['klapApiStatus'] = {
          error: 'Failed to check Klap API status',
          message: klapError instanceof Error ? klapError.message : 'Unknown error'
        }
      }
    }

    // Recommendations
    const recommendations = []
    
    if (!project.video_url) {
      recommendations.push('❌ Video URL is missing - clips cannot be generated')
    }
    
    if (!process.env.KLAP_API_KEY) {
      recommendations.push('❌ KLAP_API_KEY is not configured - check environment variables')
    }
    
    if (!project.klap_project_id || project.klap_project_id === 'Not set') {
      recommendations.push('⚠️ No Klap project ID - clips may not have been submitted to Klap')
    }
    
    if (clipsTask?.status === 'completed' && (!project.folders?.clips || project.folders.clips.length === 0)) {
      recommendations.push('⚠️ Task shows completed but no clips found - possible storage issue')
    }
    
    if (clipsTask?.status === 'failed') {
      recommendations.push('❌ Clips task failed - check server logs for errors')
    }

    if (recommendations.length === 0 && project.folders?.clips?.length > 0) {
      recommendations.push('✅ Clips are present and should be visible')
    }

    return NextResponse.json({
      diagnostics,
      recommendations,
      nextSteps: [
        '1. Check the browser console for any errors',
        '2. Check server logs (npm run dev terminal) for [Klap Background] logs',
        '3. Try regenerating clips if none are present',
        '4. Ensure KLAP_API_KEY is set in Vercel environment variables'
      ]
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json({ 
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 