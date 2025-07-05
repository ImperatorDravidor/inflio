import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Increase timeout for this route to handle multiple clips
export const maxDuration = 60; // 1 minute - Vercel Hobby plan limit
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Early check for Klap API configuration
  if (!process.env.KLAP_API_KEY) {
    console.error('[Klap Route] KLAP_API_KEY not configured')
    return NextResponse.json(
      { 
        error: 'Video clip generation is temporarily unavailable. Please try again later.',
        details: 'Klap API service not configured. Contact administrator.'
      },
      { status: 503 }
    )
  }

  let projectId: string
  let videoUrl: string

  try {
    const body = await request.json()
    projectId = body.projectId
    videoUrl = body.videoUrl
  } catch (error) {
    console.error('[Klap Route] Failed to parse request body:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

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
    
    // Update task status to processing
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing');
    
    // Start the Klap processing in the background
    // Use setImmediate to ensure the response is sent before processing starts
    setImmediate(() => {
      processVideoInBackground(projectId, videoUrl, project.title).catch(error => {
        console.error(`[Klap Route] Background processing failed for project ${projectId}:`, error);
      });
    });
    
    // Return response indicating processing has started
    return NextResponse.json({
      success: true,
      message: 'Clip generation started. This process typically takes 10-20 minutes.',
      status: 'processing',
      projectId: projectId
    });

  } catch (error) {
    console.error(`[Klap Route] Critical error for project ${projectId}:`, error)
    if (projectId) {
        await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
    }
    
    // Return appropriate error status based on error type
    let status = 500;
    let errorMessage = 'An unknown error occurred while processing with Klap.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        status = 504;
        errorMessage = 'Processing timed out. Please try again with a shorter video.';
      } else if (error.message.includes('not found')) {
        status = 404;
      } else if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
        status = 401;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// Background processing function with better error handling and progress updates
async function processVideoInBackground(projectId: string, videoUrl: string, title: string) {
  const startTime = Date.now();
  
  try {
    console.log(`[Klap Background] Starting processing for project: ${projectId}`)
    console.log(`[Klap Background] Video URL: ${videoUrl}`)
    console.log(`[Klap Background] Title: ${title}`)
    
    // Update initial progress
    await ProjectService.updateTaskProgress(projectId, 'clips', 10, 'processing');
    
    // Call Klap API to process video
    console.log('[Klap Background] Calling KlapAPIService.processVideo...')
    const klapResult = await KlapAPIService.processVideo(videoUrl, title)
    
    console.log(`[Klap Background] Klap API response:`, {
      klapFolderId: klapResult.klapFolderId,
      clipsCount: klapResult.clips?.length || 0,
      clips: klapResult.clips?.map(c => ({ id: c.id, title: c.title || c.name }))
    })

    // Store the klap folder ID for future reference
    await ProjectService.updateProject(projectId, {
      klap_project_id: klapResult.klapFolderId,
      klap_folder_id: klapResult.klapFolderId,
    });

    // Update progress after getting clips
    await ProjectService.updateTaskProgress(projectId, 'clips', 50, 'processing');

    // Process clips in a more efficient way
    const skipVideoReupload = process.env.SKIP_KLAP_VIDEO_REUPLOAD === 'true'; // Only skip if explicitly true
    const totalClips = klapResult.clips.length;
    let processedClips = 0;
    
    if (totalClips === 0) {
      console.warn(`[Klap Background] No clips generated for project ${projectId}`)
      await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed');
      return;
    }
    
    console.log(`[Klap Background] Processing ${totalClips} clips...`)
    console.log(`[Klap Background] Skip video re-upload: ${skipVideoReupload}`)
    
    // Import required modules for server-side operations
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    
    // Process clips in batches to avoid timeout
    const batchSize = skipVideoReupload ? 2 : 1; // Process one at a time when downloading
    for (let i = 0; i < klapResult.clips.length; i += batchSize) {
      const batch = klapResult.clips.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (basicClip, batchIndex) => {
        const clipIndex = i + batchIndex;
        try {
          console.log(`[Klap Background] Processing clip ${clipIndex + 1}/${totalClips}: ${basicClip.id}`)
          
          // Update progress for each clip
          const clipProgress = 50 + Math.floor(((processedClips + 0.5) / totalClips) * 50);
          await ProjectService.updateTaskProgress(projectId, 'clips', clipProgress, 'processing');

          // Get clip details
          console.log(`[Klap Background] Getting details for clip ${basicClip.id}...`)
          const clip = await KlapAPIService.getClipDetails(
            klapResult.klapFolderId,
            basicClip.id
          );
          
          console.log(`[Klap Background] Clip details received:`, {
            id: clip.id,
            title: clip.name || clip.title,
            duration: clip.duration || clip.length || (clip.end_time - clip.start_time),
            virality_score: clip.virality_score
          })

          // Handle video storage
          let exportUrl = `https://klap.app/player/${clip.id}`;
          let storedVideoUrl = exportUrl; // Default to Klap player URL
          
          if (!skipVideoReupload) {
            // Download and store clips in our own storage
            try {
              console.log(`[Klap Background] Exporting clip ${clip.id} from Klap...`)
              const exportedData = await KlapAPIService.exportMultipleClips(
                klapResult.klapFolderId,
                [clip.id]
              );
              
              if (exportedData.length > 0 && exportedData[0].url) {
                exportUrl = exportedData[0].url;
                
                // Download the clip from Klap
                console.log(`[Klap Background] Downloading clip from: ${exportUrl}`)
                const clipResponse = await fetch(exportUrl);
                if (!clipResponse.ok) {
                  throw new Error(`Failed to download clip: ${clipResponse.status} ${clipResponse.statusText}`);
                }
                
                const clipBuffer = await clipResponse.arrayBuffer();
                const clipBlob = Buffer.from(clipBuffer);
                
                // Upload to our Supabase storage
                const clipFileName = `${projectId}/clips/clip_${clipIndex + 1}_${clip.id}.mp4`;
                console.log(`[Klap Background] Uploading clip to Supabase: ${clipFileName}`)
                
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                  .from('videos')
                  .upload(clipFileName, clipBlob, {
                    contentType: 'video/mp4',
                    upsert: true,
                    cacheControl: '3600'
                  });
                
                if (uploadError) {
                  console.error(`[Klap Background] Failed to upload clip to Supabase:`, uploadError);
                  throw uploadError;
                }
                
                // Get the public URL for our stored clip
                const { data: { publicUrl } } = supabaseAdmin.storage
                  .from('videos')
                  .getPublicUrl(clipFileName);
                
                storedVideoUrl = publicUrl;
                console.log(`[Klap Background] Clip stored successfully at: ${storedVideoUrl}`)
              }
            } catch (downloadError) {
              console.error(`[Klap Background] Failed to download/store clip ${clip.id}:`, downloadError);
              // Fall back to Klap player URL on error
              console.warn(`[Klap Background] Using Klap player URL as fallback for clip ${clip.id}`);
            }
          }

          // Sanitize and structure the data for storage
          let score = clip.virality_score || 0;
          if (score > 1) { score = score / 100; }

          // Calculate duration from various possible sources
          let duration = 0;
          
          // Try direct duration field first
          if (clip.duration && clip.duration > 0) {
              duration = clip.duration;
          } 
          // Try calculating from end/start times
          else if (clip.end_time !== undefined && clip.start_time !== undefined && clip.end_time > clip.start_time) {
              duration = clip.end_time - clip.start_time;
          } 
          // Try alternative field names
          else if (clip.end !== undefined && clip.start !== undefined && clip.end > clip.start) {
              duration = clip.end - clip.start;
          }
          // Try length field
          else if (clip.length && clip.length > 0) {
              duration = clip.length;
          }
          // Try clip_length field
          else if (clip.clip_length && clip.clip_length > 0) {
              duration = clip.clip_length;
          }
          
          const transcript = clip.transcript || clip.text || clip.caption || '';

          const startTime = clip.start_time ?? clip.start ?? 0;
          const endTime = clip.end_time ?? clip.end ?? (startTime + duration);
          
          const clipToStore = {
            id: clip.id,
            title: clip.name || clip.title || `Clip ${clipIndex + 1}`,
            description: clip.virality_score_explanation || transcript || '',
            startTime: startTime,
            endTime: endTime,
            duration: duration || (endTime - startTime),
            thumbnail: clip.thumbnail || `https://klap.app/player/${clip.id}/thumbnail`,
            tags: clip.tags || [],
            score: score,
            type: 'highlight' as const,
            klapProjectId: clip.id,
            klapFolderId: klapResult.klapFolderId,
            previewUrl: `https://klap.app/player/${clip.id}`,
            exportUrl: storedVideoUrl, // Use our stored URL or Klap URL
            exported: true,
            storedInSupabase: !skipVideoReupload && storedVideoUrl !== exportUrl,
            rawKlapData: clip,
            createdAt: clip.created_at || new Date().toISOString(),
            viralityExplanation: clip.virality_score_explanation || '',
            transcript: transcript,
            publicationCaptions: clip.publication_captions || undefined,
          };

          console.log(`[Klap Background] Storing clip ${clipIndex + 1}:`, {
            id: clipToStore.id,
            title: clipToStore.title,
            duration: clipToStore.duration,
            score: clipToStore.score,
            storedInSupabase: clipToStore.storedInSupabase
          })

          // Store the fully processed clip
          await ProjectService.addToFolder(projectId, 'clips', clipToStore);
          
          processedClips++;
          console.log(`[Klap Background] Successfully stored clip ${processedClips}/${totalClips} for project ${projectId}`);
          
        } catch (clipError) {
          console.error(`[Klap Background] Failed to process clip ${basicClip.id}:`, clipError);
          console.error(`[Klap Background] Error details:`, {
            message: clipError instanceof Error ? clipError.message : 'Unknown error',
            stack: clipError instanceof Error ? clipError.stack : undefined
          });
          processedClips++;
        }
      }));
      
      // Update progress after each batch
      const newProgress = 50 + Math.floor((processedClips / totalClips) * 50);
      await ProjectService.updateTaskProgress(projectId, 'clips', newProgress, 'processing');
    }
    
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Klap Background] Finished processing all clips for project ${projectId} in ${processingTime} seconds.`);
    console.log(`[Klap Background] Successfully processed ${processedClips} clips out of ${totalClips} total.`);
    
    await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed');
    
  } catch (error) {
    console.error(`[Klap Background] Critical error processing video for project ${projectId}:`, error);
    console.error(`[Klap Background] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      projectId,
      videoUrl,
      title
    });
    await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed');
  }
}

// Check Klap processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const debug = searchParams.get('debug') === 'true'

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      )
    }

    // Get project
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Debug mode - return detailed information
    if (debug) {
      const clipsTask = project.tasks.find(t => t.type === 'clips')
      return NextResponse.json({
        projectId: project.id,
        klap_project_id: project.klap_project_id,
        klap_folder_id: project.klap_folder_id,
        clips: {
          count: project.folders?.clips?.length || 0,
          items: project.folders?.clips?.map(c => ({
            id: c.id,
            title: c.title,
            duration: c.duration,
            score: c.score,
            hasExportUrl: !!c.exportUrl,
            hasPreviewUrl: !!c.previewUrl
          })) || []
        },
        task: clipsTask ? {
          status: clipsTask.status,
          progress: clipsTask.progress,
          startedAt: clipsTask.startedAt,
          completedAt: clipsTask.completedAt
        } : null
      })
    }

    // Normal status check
    if (!project.klap_project_id) {
      return NextResponse.json({
        success: false,
        status: 'not_started',
        message: 'Klap processing has not been started for this project'
      })
    }

    // Check task status
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    if (clipsTask) {
      return NextResponse.json({
        success: true,
        status: clipsTask.status,
        progress: clipsTask.progress || 0,
        message: `Clips ${clipsTask.status}`,
        clipsCount: project.folders?.clips?.length || 0
      })
    }

    // Fallback - check Klap API status
    try {
      const status = await KlapAPIService.getProjectStatus(project.klap_project_id)
      
      return NextResponse.json({
        success: true,
        status: status.status,
        progress: status.progress,
        message: status.message
      })
    } catch (klapError) {
      console.error('Failed to check Klap status:', klapError)
      return NextResponse.json({
        success: false,
        status: 'unknown',
        message: 'Unable to check Klap processing status'
      })
    }
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
        // This is a progress callback, logging here can be useful for server-side monitoring
        // but can be removed if too noisy for production.
        // console.log(`Export progress: ${message} (${index + 1}/${total})`)
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
