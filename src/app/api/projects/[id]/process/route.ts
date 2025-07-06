import { NextResponse } from "next/server";
import { ProjectService } from "@/lib/services";
import { handleError } from "@/lib/error-handler";
import { KlapAPIService } from "@/lib/klap-api";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the user first
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Update project status first
    await ProjectService.updateProject(projectId, { status: 'processing' });

    // For Vercel: construct the correct URL for internal API calls
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    console.log(`[Process Route] Using base URL: ${baseUrl}`);
    console.log(`[Process Route] Processing project ${projectId} with workflow: ${workflow || 'all'}`);

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

      // Start KLAP processing directly without HTTP call
      startKlapProcessing(projectId, project.video_url);

      return NextResponse.json({ message: "Clip generation started" });
    }

    // Default behavior: process all pending tasks
    
    const hasTranscriptionTask = project.tasks.some(task => task.type === 'transcription' && task.status === 'pending');
    if (hasTranscriptionTask) {
      // Start transcription without waiting
      fetch(`${baseUrl}/api/process-transcription`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Pass along authorization if present
          ...(request.headers.get('authorization') ? { 'authorization': request.headers.get('authorization')! } : {})
        },
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url,
          language: 'en'
        })
      }).then(response => {
        if (!response.ok) {
          console.error(`Transcription request failed with status: ${response.status}`);
          ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
        }
      }).catch(error => {
        console.error('Failed to start transcription:', error);
        ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
      });
    }

    const hasClipsTask = project.tasks.some(task => task.type === 'clips' && task.status === 'pending');
    if (hasClipsTask) {
      // Start KLAP processing directly without HTTP call
      startKlapProcessing(projectId, project.video_url);
    }

    return NextResponse.json({ 
      message: "Processing started",
      tasks: {
        transcription: hasTranscriptionTask,
        clips: hasClipsTask
      }
    });
  } catch (error) {
    const errorResult = handleError(error, "Failed to start processing");
    return NextResponse.json({ error: errorResult.error }, { status: errorResult.statusCode });
  }
}

// Helper function to start KLAP processing without HTTP call
async function startKlapProcessing(projectId: string, videoUrl: string) {
  console.log(`[Process Route] Starting KLAP processing for project ${projectId}`);
  
  try {
    // Check if KLAP API key is configured
    if (!process.env.KLAP_API_KEY) {
      console.error('[Process Route] KLAP_API_KEY is not configured');
      await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed');
      return;
    }

    // Update task status to processing
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing');
    
    // Create the KLAP task
    const task = await KlapAPIService.createVideoTask(videoUrl);
    console.log(`[Process Route] Klap task created successfully: ${task.id}`);
    
    // Store the task ID for later polling
    await ProjectService.updateProject(projectId, {
      klap_project_id: task.id
    });
    
    // Update progress to show task was created
    await ProjectService.updateTaskProgress(projectId, 'clips', 10, 'processing');
    
    console.log(`[Process Route] Klap processing started successfully for project ${projectId}`);
  } catch (error) {
    console.error(`[Process Route] Failed to start Klap processing:`, error);
    await ProjectService.updateTaskProgress(projectId, 'clips', 0, 'failed');
    
    if (error instanceof Error && error.message.includes('401')) {
      console.error('[Process Route] Klap authentication failed. Please check API configuration.');
    }
  }
} 