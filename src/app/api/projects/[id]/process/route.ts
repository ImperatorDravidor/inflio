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

    // Process transcription if needed (pending or stuck processing tasks)
    const hasTranscriptionTask = project.tasks.some(
      (task: any) => task.type === 'transcription' && (task.status === 'pending' || task.status === 'processing')
    );
    
    if (hasTranscriptionTask) {
      try {
        console.log('[Process Route] Starting transcription processing...')
        console.log('[Process Route] Project ID:', projectId)
        console.log('[Process Route] Video URL:', project.video_url)
        
        // Import the transcription processor
        const { processTranscription } = await import('@/lib/transcription-processor');
        
        // Process transcription directly (await completion since it only takes 30 seconds)
        const result = await processTranscription({
          projectId: project.id,
          videoUrl: project.video_url,
          language: 'en',
          userId: userId!
        });
        
        console.log('[Process Route] Transcription completed successfully:', {
          success: result.success,
          mock: result.mock
        })
      } catch (error) {
        console.error('[Process Route] Transcription failed:', error);
        console.error('[Process Route] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
        // Don't throw - allow clips to continue even if transcription fails
      }
    }

    // Process clips if needed (pending or stuck processing tasks)
    const hasClipsTask = project.tasks.some(
      (task: any) => task.type === 'clips' && (task.status === 'pending' || task.status === 'processing')
    );
    
    if (hasClipsTask) {
      // Queue Klap processing via Inngest
      try {
        console.log('[Process Route] Queueing Klap job with Inngest...')
        console.log('[Process Route] Project ID:', projectId)
        console.log('[Process Route] Video URL:', project.video_url)
        
        // Send event to Inngest
        await inngest.send({
          name: 'klap/video.process',
          data: {
            projectId,
            videoUrl: project.video_url,
            userId
          }
        });
        
        console.log('[Process Route] Klap job queued successfully with Inngest')
        
        // Update task progress to show it's queued
        await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing');
        console.log('[Process Route] Updated clips task to processing status')
      } catch (error) {
        console.error('[Process Route] Failed to queue Klap processing:', error);
        console.error('[Process Route] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        // Don't throw - allow transcription to continue even if clips fail
      }
    }

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