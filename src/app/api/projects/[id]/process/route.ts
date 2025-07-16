import { NextResponse } from "next/server";
import { ProjectService } from "@/lib/services";
import { auth } from "@clerk/nextjs/server";
import { processTranscription } from "@/lib/transcription-processor";
import { KlapJobQueue } from "@/lib/redis";

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
      // Queue Klap processing via Redis
      try {
        console.log('[Process Route] Checking for existing Klap job...')
        
        // Check if job already exists
        const existingJob = await KlapJobQueue.getJobByProjectId(projectId);
        if (!existingJob || (existingJob.status !== 'queued' && existingJob.status !== 'processing')) {
          // Create new job
          console.log('[Process Route] Creating new Klap job for project:', projectId)
          console.log('[Process Route] Video URL:', project.video_url)
          
          const job = await KlapJobQueue.createJob(projectId, project.video_url);
          console.log('[Process Route] Klap job queued successfully:', {
            jobId: job.id,
            projectId: job.projectId,
            status: job.status,
            createdAt: job.createdAt
          });
          
          // Update task progress to 10% to show it's queued and waiting
          await ProjectService.updateTaskProgress(projectId, 'clips', 10, 'processing');
          console.log('[Process Route] Updated clips task to processing status with 10% progress')
        } else {
          console.log('[Process Route] Klap job already exists:', {
            jobId: existingJob.id,
            status: existingJob.status,
            progress: existingJob.progress,
            attempts: existingJob.attempts
          });
        }
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