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
      // Import and call transcription directly to avoid CloudProxy issues
      console.log('[Process Route] Starting transcription directly...');
      console.log('[Process Route] Project ID:', projectId);
      console.log('[Process Route] Video URL:', project.video_url);
      
      try {
        // Import the transcription processor
        const { processTranscription } = await import('@/lib/transcription-processor');
        
        // Start transcription in the background (don't await completion)
        processTranscription({
          projectId: project.id,
          videoUrl: project.video_url,
          language: 'en',
          userId: userId!
        }).then(() => {
          console.log('[Process Route] Transcription completed successfully');
        }).catch(error => {
          console.error('[Process Route] Transcription failed:', error);
          ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
        });
        
        // Wait a bit to ensure the transcription has started
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('[Process Route] Failed to start transcription:', error);
        await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
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