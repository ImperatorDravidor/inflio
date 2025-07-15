import { NextResponse } from "next/server";
import { ProjectService } from "@/lib/services";
import { auth } from "@clerk/nextjs/server";
import { processTranscription } from "@/lib/transcription-processor";

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
      // Start Klap processing
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process-klap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      }).catch(error => {
        console.error('[Process Route] Failed to start Klap processing:', error);
      });
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