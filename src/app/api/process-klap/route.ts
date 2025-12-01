import { NextRequest, NextResponse } from 'next/server'
import { SubmagicAPIService } from '@/lib/submagic-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'
import { inngest } from '@/inngest/client'

// Quick response - just queue the job
export const maxDuration = 10

/**
 * POST /api/process-klap
 * Queue Submagic processing job with Inngest
 * (Keeping route name for backward compatibility)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.video_url) {
      return NextResponse.json({ error: 'Project has no video' }, { status: 400 })
    }

    // Check if already processing
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    if (clipsTask?.status === 'processing') {
      return NextResponse.json({ 
        message: 'Clips are already being processed',
        status: 'processing'
      })
    }

    // Send event to Inngest (using Submagic event)
    await inngest.send({
      name: 'submagic/video.process',
      data: {
        projectId,
        videoUrl: project.video_url,
        userId,
        title: project.title || `Project ${projectId}`
      }
    })
    
    // Update task progress to show it's queued
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing')
    
    return NextResponse.json({ 
      success: true,
      message: 'Clip generation queued successfully',
      provider: 'submagic'
    })
  } catch (error) {
    console.error('[Process Clips] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to queue processing' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/process-klap?projectId=xxx
 * Check processing status from our database.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check task status from our database
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    
    // Return current status from our DB. Inngest is the source of truth.
    return NextResponse.json({
      success: true,
      status: clipsTask?.status || 'idle',
      progress: clipsTask?.progress || 0,
      clips: project.folders?.clips || [],
      provider: 'submagic'
    })
  } catch (error) {
    console.error('[Process Clips GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
} 