import { NextResponse } from "next/server";
import { ProjectService } from "@/lib/services";
import { handleError } from "@/lib/error-handler";

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

    const project = await ProjectService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // This is where the actual processing logic will be triggered.
    // In a real application, this would kick off background jobs.

    const hasTranscriptionTask = project.tasks.some(task => task.type === 'transcription' && task.status === 'pending');
    if (hasTranscriptionTask) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/process-transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url,
          language: 'en'
        })
      });
    }

    const hasClipsTask = project.tasks.some(task => task.type === 'clips' && task.status === 'pending');
    if (hasClipsTask) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/process-klap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: project.id,
                videoUrl: project.video_url,
            })
        });
    }
    
    // The individual processing routes will update the status of their respective tasks.
    // We'll update the main project status to 'processing'.
    await ProjectService.updateProject(projectId, { status: 'processing' });

    return NextResponse.json({ message: "Processing started" });
  } catch (error) {
    return handleError(error, "Failed to start processing");
  }
} 