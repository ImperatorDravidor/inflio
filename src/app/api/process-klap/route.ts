import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { KlapJobQueue } from '@/lib/redis'

// Vercel function configuration
export const maxDuration = 10 // Quick response
export const dynamic = 'force-dynamic'

/**
 * POST /api/process-klap
 * Queue Klap processing job
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

    // Check if job already exists
    const existingJob = await KlapJobQueue.getJobByProjectId(projectId)
    if (existingJob && (existingJob.status === 'queued' || existingJob.status === 'processing')) {
      return NextResponse.json({ 
        message: 'Clips are already being processed',
        jobId: existingJob.id,
        status: existingJob.status
      })
    }

    // Create new job
    const job = await KlapJobQueue.createJob(projectId, project.video_url)
    
    // Update task progress
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing')
    
    return NextResponse.json({
      success: true,
      message: 'Clip generation queued',
      jobId: job.id
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
 * Check job status from Redis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // Get job from Redis
    const job = await KlapJobQueue.getJobByProjectId(projectId)
    if (!job) {
      return NextResponse.json({ 
        error: 'No job found for this project' 
      }, { status: 404 })
    }

    // If job is completed, update project with clips
    if (job.status === 'completed' && job.clips) {
      const project = await ProjectService.getProject(projectId)
      if (project && (!project.folders?.clips || project.folders.clips.length === 0)) {
        // Store clips in project
        await ProjectService.updateProject(projectId, {
          folders: {
            clips: job.clips,
            images: project.folders?.images || [],
            social: project.folders?.social || [],
            blog: project.folders?.blog || []
          }
        })
        
        // Mark task as complete
        await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
      }
      
      return NextResponse.json({
        success: true,
        status: 'completed',
        clips: job.clips
      })
    }

    // Return current status
    return NextResponse.json({
      success: true,
      status: job.status,
      progress: job.progress,
      error: job.error
    })
  } catch (error) {
    console.error('[Process Klap GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
} 
