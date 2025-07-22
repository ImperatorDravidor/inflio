import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'

// Quick response - just queue the job
export const maxDuration = 10

/**
 * POST /api/process-klap
 * Queue Klap processing job with Inngest
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

    // Send event to Inngest
    await inngest.send({
      name: 'klap/video.process',
      data: {
        projectId,
        videoUrl: project.video_url,
        userId
      }
    })
    
    // Update task progress to show it's queued
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing')
    
    return NextResponse.json({ 
      success: true,
      message: 'Clip generation queued successfully'
    })
  } catch (error) {
    console.error('[Process Klap] Error:', error)
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
      clips: project.folders?.clips || []
    })
  } catch (error) {
    console.error('[Process Klap GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
} 