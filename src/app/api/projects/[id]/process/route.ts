import { NextResponse } from "next/server";
import { ProjectService } from "@/lib/services";
import { auth } from "@clerk/nextjs/server";
import { processTranscription } from "@/lib/transcription-processor";
import { inngest } from "@/inngest/client";

// Quick response - just queue jobs
export const maxDuration = 30; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const project = await ProjectService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update project status
    await ProjectService.updateProject(projectId, { status: 'processing' });

    // Process transcription if needed
    const hasTranscriptionTask = project.tasks.some(
      task => task.type === 'transcription' && task.status === 'pending'
    );
    
    if (hasTranscriptionTask) {
      // Process transcription directly
      processTranscription({
          projectId: project.id,
          videoUrl: project.video_url,
        language: 'en',
        userId
      }).catch(error => {
        console.error('[Process Route] Transcription failed:', error);
      });
    }

    // Process clips if needed
    const hasClipsTask = project.tasks.some(
      task => task.type === 'clips' && task.status === 'pending'
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