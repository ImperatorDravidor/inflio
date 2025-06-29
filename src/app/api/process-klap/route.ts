import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

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

    console.log(`[Klap Route] Klap processing complete. Found ${klapResult.clips.length} clips for project ${projectId}.`)

    // Store the klap folder ID for future reference
    await ProjectService.updateProject(projectId, {
      klap_project_id: klapResult.klapFolderId,
      klap_folder_id: klapResult.klapFolderId,
    });

    // Process each clip individually to get all details and export URL
    const totalClips = klapResult.clips.length;
    let processedClips = 0;
    
    for (let clipIndex = 0; clipIndex < klapResult.clips.length; clipIndex++) {
      const basicClip = klapResult.clips[clipIndex];
      try {
        console.log(`[Klap Route] Processing clip ${basicClip.id}...`);
        
        // Update progress based on clips processed
        const progress = Math.floor(((processedClips + 0.5) / totalClips) * 100);
        await ProjectService.updateTaskProgress(projectId, 'clips', progress, 'processing');

        // 1. Get detailed clip info, which might contain duration and transcript
        const clip = await KlapAPIService.getClipDetails(
          klapResult.klapFolderId,
          basicClip.id
        );

        // 2. Export the clip to get a direct video URL from Klap
        let klapExportUrl: string | null = null;
        try {
          const exportedData = await KlapAPIService.exportMultipleClips(
            klapResult.klapFolderId,
            [clip.id]
          );
          if (exportedData.length > 0 && exportedData[0].url) {
            klapExportUrl = exportedData[0].url;
          }
        } catch (exportError) {
          console.error(`[Klap Route] Could not export clip ${clip.id}:`, exportError);
        }

        // 3. Download from Klap and re-upload to our Supabase storage
        let ownStorageUrl: string | undefined = undefined;
        if (klapExportUrl) {
            try {
                const videoResponse = await fetch(klapExportUrl);
                if (!videoResponse.ok) throw new Error('Failed to download video from Klap URL');
                
                const videoBlob = await videoResponse.blob();
                
                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );
                
                const filePath = `${project.id}/clips/${clip.id}.mp4`;
                
                const { error: uploadError } = await supabaseAdmin.storage
                    .from('videos')
                    .upload(filePath, videoBlob, {
                        contentType: 'video/mp4',
                        upsert: true
                    });
                    
                if (uploadError) throw uploadError;
                
                const { data: publicUrlData } = supabaseAdmin.storage.from('videos').getPublicUrl(filePath);
                ownStorageUrl = publicUrlData.publicUrl;
                
            } catch (reuploadError) {
                console.error(`[Klap Route] Failed to re-upload clip ${clip.id} to own storage:`, reuploadError);
            }
        }

        // 4. Sanitize and structure the data for storage
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
        
        console.log(`[Klap Route] Clip ${clip.id} duration calculation:`, {
            direct_duration: clip.duration,
            end_time: clip.end_time,
            start_time: clip.start_time,
            end: clip.end,
            start: clip.start,
            length: clip.length,
            clip_length: clip.clip_length,
            calculated_duration: duration,
            raw_clip_data: clip
        });
        
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
          exportUrl: ownStorageUrl,
          exported: !!ownStorageUrl,
          rawKlapData: clip,
          createdAt: clip.created_at || new Date().toISOString(),
          viralityExplanation: clip.virality_score_explanation || '',
          transcript: transcript,
        };

        // 5. Store the fully processed clip
        await ProjectService.addToFolder(projectId, 'clips', clipToStore);
        console.log(`[Klap Route] Successfully stored clip ${clip.id} with video URL: ${ownStorageUrl}`);
        
        // Increment processed clips counter
        processedClips++;
        
        // Update progress after each clip is processed
        const newProgress = Math.floor((processedClips / totalClips) * 100);
        await ProjectService.updateTaskProgress(projectId, 'clips', newProgress, 'processing');

      } catch (clipError) {
        console.error(`[Klap Route] Failed to process and store clip ${basicClip.id}:`, clipError);
        processedClips++; // Still increment to continue progress
      }
    }
    
    await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed');
    
    console.log(`[Klap Route] Finished processing all clips for project ${projectId}.`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed and stored ${klapResult.clips.length} clips.`
    });

  } catch (error) {
    console.error(`[Klap Route] Critical error for project ${projectId}:`, error)
    if (projectId) {
        await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed')
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
