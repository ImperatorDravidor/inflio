import { NextResponse } from "next/server";
import { validateProjectOwnership } from "@/lib/auth-utils";
import { inngest } from "@/inngest/client";
import { updateTaskProgressServer, updateProjectServer } from "@/lib/server-project-utils";

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
    await updateProjectServer(projectId, { status: 'processing' });

    // Start both processes in parallel
    const promises = [];

    // Process transcription if needed
    const tasks = (project.tasks as any[]) || [];
    const hasTranscriptionTask = tasks.some(
      (task: any) => task.type === 'transcription' && (task.status === 'pending' || task.status === 'processing')
    );

    if (hasTranscriptionTask) {
      // Set initial progress immediately
      await updateTaskProgressServer(projectId, 'transcription', 5, 'processing');
      console.log('[Process Route] Transcription task set to 5% - starting processing...')

      promises.push(
        (async () => {
          try {
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
            await updateTaskProgressServer(projectId, 'transcription', 0, 'failed');
            return { type: 'transcription', success: false, error };
          }
        })()
      );
    }

    // Process clips if needed
    const hasClipsTask = tasks.some(
      (task: any) => task.type === 'clips' && (task.status === 'pending' || task.status === 'processing')
    );

    if (hasClipsTask) {
      // Set initial progress immediately
      await updateTaskProgressServer(projectId, 'clips', 5, 'processing');
      console.log('[Process Route] Clips task set to 5% - queueing Vizard job...')

      promises.push(
        (async () => {
          try {
            // Send event to Inngest (using Vizard)
            await inngest.send({
              name: 'vizard/video.process',
              data: {
                projectId,
                videoUrl: project.video_url,
                userId,
                title: project.title || project.name || `Project ${projectId}`
              }
            });

            console.log('[Process Route] Vizard job queued successfully')
            return { type: 'clips', success: true };
          } catch (error) {
            console.error('[Process Route] Failed to queue clips processing:', error);
            await updateTaskProgressServer(projectId, 'clips', 0, 'failed');
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