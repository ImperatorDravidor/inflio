import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateTaskProgressServer, updateProjectServer } from '@/lib/server-project-utils'

export const maxDuration = 60

/**
 * POST /api/webhooks/submagic
 * Webhook handler for Submagic Magic Clips completion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[Submagic Webhook] Received webhook:', {
      projectId: body.projectId,
      status: body.status,
      clipCount: body.magicClips?.length || 0
    })

    const { projectId, status, title, duration, completedAt, magicClips } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // Find our project by submagic_project_id
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('submagic_project_id', projectId)
      .limit(1)

    if (!projects || projects.length === 0) {
      console.error('[Submagic Webhook] Project not found:', projectId)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projects[0]

    if (status === 'failed') {
      // Mark clips task as failed
      await updateTaskProgressServer(project.id, 'clips', 0, 'failed')
      
      return NextResponse.json({ 
        success: true,
        message: 'Clips processing failed'
      })
    }

    if (status === 'completed' && magicClips && Array.isArray(magicClips)) {
      console.log(`[Submagic Webhook] Processing ${magicClips.length} clips for project ${project.id}`)
      
      const processedClips = []

      for (let i = 0; i < magicClips.length; i++) {
        const magicClip = magicClips[i]
        
        try {
          // Optionally download and store in Supabase
          let videoUrl = magicClip.directUrl || magicClip.downloadUrl
          
          if (!process.env.SKIP_VIDEO_REUPLOAD || process.env.SKIP_VIDEO_REUPLOAD !== 'true') {
            try {
              const response = await fetch(magicClip.downloadUrl)
              const buffer = await response.arrayBuffer()
              
              const fileName = `clip_${i}_${magicClip.id}.mp4`
              const filePath = `${project.id}/clips/${fileName}`
              
              const { error: uploadError } = await supabaseAdmin.storage
                .from('videos')
                .upload(filePath, buffer, {
                  contentType: 'video/mp4',
                  upsert: true
                })
              
              if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                  .from('videos')
                  .getPublicUrl(filePath)
                videoUrl = urlData.publicUrl
                console.log(`[Submagic Webhook] Clip stored at: ${videoUrl}`)
              }
            } catch (error) {
              console.error(`[Submagic Webhook] Failed to download/store clip ${i}:`, error)
              // Continue with Submagic URL if storage fails
            }
          }

          // Create clip object with all metadata
          const clip = {
            id: `${project.id}_clip_${i}`,
            title: magicClip.title || `Clip ${i + 1}`,
            description: `Virality Score: ${magicClip.viralityScores?.total || 'N/A'}`,
            startTime: 0, // Magic Clips don't provide this
            endTime: magicClip.duration || 0,
            duration: magicClip.duration || 0,
            thumbnail: magicClip.previewUrl || videoUrl,
            tags: [],
            score: (magicClip.viralityScores?.total || 50) / 100, // Convert to 0-1 scale
            type: 'highlight' as const,
            submagicProjectId: projectId,
            submagicClipId: magicClip.id,
            exportUrl: videoUrl,
            exported: true,
            storedInSupabase: !process.env.SKIP_VIDEO_REUPLOAD || process.env.SKIP_VIDEO_REUPLOAD !== 'true',
            createdAt: new Date().toISOString(),
            // Virality scores from Submagic
            viralityExplanation: `Total: ${magicClip.viralityScores?.total}, Hook: ${magicClip.viralityScores?.hook_strength}, Story: ${magicClip.viralityScores?.story_quality}`,
            viralityScores: magicClip.viralityScores,
            previewUrl: magicClip.previewUrl,
            rawSubmagicData: magicClip,
            publicationCaptions: undefined
          }
          
          processedClips.push(clip)
        } catch (error) {
          console.error(`[Submagic Webhook] Failed to process clip ${magicClip.id}:`, error)
        }
      }

      // Update project with clips
      await updateProjectServer(project.id, {
        folders: {
          clips: processedClips,
          images: [],
          social: [],
          blog: []
        }
      })
      
      // Mark task as complete
      await updateTaskProgressServer(project.id, 'clips', 100, 'completed')
      
      console.log(`[Submagic Webhook] Successfully processed ${processedClips.length} clips for project ${project.id}`)
      
      return NextResponse.json({ 
        success: true,
        message: `Processed ${processedClips.length} clips`,
        clipCount: processedClips.length
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook received'
    })
  } catch (error) {
    console.error('[Submagic Webhook] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process webhook' },
      { status: 500 }
    )
  }
}


