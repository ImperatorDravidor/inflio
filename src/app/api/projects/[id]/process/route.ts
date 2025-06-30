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

    // Handle optional body - if no body, treat it as default behavior
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // If JSON parsing fails or body is empty, continue with empty body
      console.log('Request body parsing failed or empty, continuing with default behavior');
    }
    
    const { workflow } = body; // Optional parameter to specify which workflow to run

    const project = await ProjectService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If specific workflow is requested, only run that
    if (workflow === 'clips') {
      // Add clips task if not already present
      const hasClipsTask = project.tasks.some(task => task.type === 'clips');
      if (!hasClipsTask) {
        const updatedTasks = [...project.tasks, {
          id: crypto.randomUUID(),
          type: 'clips' as const,
          status: 'pending' as const,
          progress: 0,
          message: 'Preparing to generate clips...'
        }];
        await ProjectService.updateProject(projectId, { tasks: updatedTasks });
      }

      // Start clip generation
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/process-klap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url,
        })
      });

      await ProjectService.updateProject(projectId, { status: 'processing' });
      return NextResponse.json({ message: "Clip generation started" });
    }

    // Default behavior: process all pending tasks
    const hasTranscriptionTask = project.tasks.some(task => task.type === 'transcription' && task.status === 'pending');
    if (hasTranscriptionTask) {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/process-transcription`, {
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
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/process-klap`, {
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
    const errorResult = handleError(error, "Failed to start processing");
    return NextResponse.json({ error: errorResult.error }, { status: errorResult.statusCode });
  }
} 