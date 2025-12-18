import { NextRequest, NextResponse } from 'next/server'
import { SubmagicAPIService } from '@/lib/submagic-api'
import { VizardAPIService } from '@/lib/vizard-api'
import { ProjectService } from '@/lib/services'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { inngest } from '@/inngest/client'
import type { ClipData, Project } from '@/lib/project-types'
import { updateTaskProgressServer, updateProjectServer } from '@/lib/server-project-utils'

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

    // Use server client to bypass RLS
    const supabase = createSupabaseServerClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.video_url) {
      return NextResponse.json({ error: 'Project has no video' }, { status: 400 })
    }

    // Check if already processing
    const clipsTask = (project.tasks as any[])?.find((t: any) => t.type === 'clips')
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
    await updateTaskProgressServer(projectId, 'clips', 5, 'processing')
    
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
 * Check processing status and fetch clips when ready from Vizard API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // Use server client to bypass RLS
    const supabase = createSupabaseServerClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.log('[Process Clips GET] Project not found:', projectId, projectError?.message)
      return NextResponse.json({
        error: 'Project not found',
        status: 'not_found',
        message: 'This project may have been deleted. Please return to your projects page.'
      }, { status: 404 })
    }

    // Check task status from our database
    const clipsTask = (project.tasks as any[])?.find((t: any) => t.type === 'clips')

    // If we have a Vizard project ID and task is still processing, check Vizard API
    if (project.vizard_project_id && clipsTask?.status === 'processing') {
      console.log('[Process Clips GET] Checking Vizard status for project:', project.vizard_project_id)

      try {
        const vizardStatus = await VizardAPIService.getProjectStatus(project.vizard_project_id)
        console.log('[Process Clips GET] Vizard response:', {
          code: vizardStatus.code,
          videosCount: vizardStatus.videos?.length || 0,
          projectName: vizardStatus.projectName
        })

        // Code 2000 = completed with videos
        // Code 1000 = still processing
        if (vizardStatus.code === 2000 && vizardStatus.videos && vizardStatus.videos.length > 0) {
          console.log('[Process Clips GET] Vizard completed! Fetching', vizardStatus.videos.length, 'clips')

          // Transform Vizard videos to our ClipData format matching the ClipData interface
          const transformedClips: ClipData[] = vizardStatus.videos.map((vizardVideo) => {
            const durationInSeconds = Math.floor(vizardVideo.videoMsDuration / 1000)

            // Parse related topics from JSON string to array
            let tags: string[] = []
            try {
              tags = JSON.parse(vizardVideo.relatedTopic || '[]')
            } catch (e) {
              tags = []
            }

            // Convert Vizard's 0-10 virality score to 0-100 percentage
            const viralityScore = parseFloat(vizardVideo.viralScore) || 0
            const scorePercentage = Math.min(Math.round(viralityScore * 10), 100)

            return {
              id: `vizard-${vizardVideo.videoId}`,
              title: vizardVideo.title,
              description: vizardVideo.transcript.substring(0, 200) + '...',
              startTime: 0, // Clips start at 0 since they're standalone
              endTime: durationInSeconds,
              duration: durationInSeconds,
              thumbnail: '', // Vizard doesn't provide thumbnails in API response
              tags: tags,
              score: scorePercentage, // Now 0-100 scale
              type: 'highlight' as const,
              // Store video URL in exportUrl (Vizard provides ready-to-use export URLs)
              exportUrl: vizardVideo.videoUrl,
              exported: true,
              // Enhanced data fields
              transcript: vizardVideo.transcript,
              viralityExplanation: vizardVideo.viralReason,
              createdAt: new Date().toISOString(),
              // Store raw Vizard data for reference
              rawKlapData: {
                vizard_video_id: vizardVideo.videoId,
                vizard_project_id: project.vizard_project_id,
                clip_editor_url: vizardVideo.clipEditorUrl,
                related_topic_raw: vizardVideo.relatedTopic,
                original_viral_score: viralityScore // Store original 0-10 score
              }
            }
          })

          // Store clips in database
          console.log('[Process Clips GET] Storing', transformedClips.length, 'clips in database')
          await updateProjectServer(projectId, {
            folders: {
              ...project.folders,
              clips: transformedClips
            }
          })

          // Mark task as completed
          await updateTaskProgressServer(projectId, 'clips', 100, 'completed')

          console.log('[Process Clips GET] Clips stored successfully!')

          return NextResponse.json({
            success: true,
            status: 'completed',
            progress: 100,
            clips: transformedClips,
            provider: 'vizard'
          })
        } else {
          // No videos yet - still processing
          console.log('[Process Clips GET] No videos yet, Vizard still processing...')
          return NextResponse.json({
            success: true,
            status: 'processing',
            progress: clipsTask?.progress || 15,
            clips: [],
            provider: 'vizard'
          })
        }
      } catch (vizardError) {
        console.error('[Process Clips GET] Error checking Vizard status:', vizardError)
        // Fall through to return DB status
      }
    }

    // Return database status (for non-Vizard projects or when Vizard check fails)
    return NextResponse.json({
      success: true,
      status: clipsTask?.status || 'idle',
      progress: clipsTask?.progress || 0,
      clips: project.folders?.clips || [],
      provider: project.vizard_project_id ? 'vizard' : 'unknown'
    })
  } catch (error) {
    console.error('[Process Clips GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
} 