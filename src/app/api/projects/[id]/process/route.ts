import { NextResponse } from "next/server";
import { ProjectService } from "@/lib/services";
import { validateProjectOwnership } from "@/lib/auth-utils";
import { inngest } from "@/inngest/client";

// Extended timeout for transcription processing
export const maxDuration = 300; // 5 minutes for transcription
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Validate project ownership
    const { isValid, userId, project, errorResponse } = await validateProjectOwnership(projectId);
    if (!isValid || !project) {
      return errorResponse || NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update project status
    await ProjectService.updateProject(projectId, { status: 'processing' });

    // Start both processes in parallel
    const promises = [];
    
    // Process transcription if needed
    const hasTranscriptionTask = project.tasks.some(
      (task: any) => task.type === 'transcription' && (task.status === 'pending' || task.status === 'processing')
    );
    
    if (hasTranscriptionTask) {
      promises.push(
        (async () => {
          try {
            console.log('[Process Route] Starting transcription processing...')
            const { processTranscription } = await import('@/lib/transcription-processor');
            
            // Process transcription
            const result = await processTranscription({
              projectId: project.id,
              videoUrl: project.video_url,
              language: 'en',
              userId: userId!
            });
            
            console.log('[Process Route] Transcription completed successfully')
            return { type: 'transcription', success: true, result };
          } catch (error) {
            console.error('[Process Route] Transcription failed:', error);
            await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
            return { type: 'transcription', success: false, error };
          }
        })()
      );
    }

    // Process clips if needed
    const hasClipsTask = project.tasks.some(
      (task: any) => task.type === 'clips' && (task.status === 'pending' || task.status === 'processing')
    );
    
    if (hasClipsTask) {
      promises.push(
        (async () => {
          try {
            console.log('[Process Route] Queueing Submagic job with Inngest...')
            
            // Send event to Inngest (using Submagic)
            await inngest.send({
              name: 'submagic/video.process',
              data: {
                projectId,
                videoUrl: project.video_url,
                userId,
                title: project.title || project.name || `Project ${projectId}`
              }
            });
            
            console.log('[Process Route] Submagic job queued successfully')
            
            // Update task progress to show it's queued
            await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing');
            return { type: 'clips', success: true };
          } catch (error) {
            console.error('[Process Route] Failed to queue clips processing:', error);
            return { type: 'clips', success: false, error };
          }
        })()
      );
    }
    
    // Wait for all processes to complete
    const results = await Promise.allSettled(promises);
    console.log('[Process Route] All processes initiated:', results.length)

    return NextResponse.json({ 
      message: "Processing started",
      tasks: {
        transcription: hasTranscriptionTask,
        clips: hasClipsTask
      }
    });
  } catch (error) {
    console.error('[Process Route] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
} 