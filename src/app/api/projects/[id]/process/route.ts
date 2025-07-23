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
      task => task.type === 'transcription' && (task.status === 'pending' || task.status === 'processing')
    );
    
    if (hasTranscriptionTask) {
      // Start transcription via HTTP call (fire and forget)
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
      const transcriptionUrl = `${baseUrl}/api/process-transcription`;
      
      console.log('[Process Route] Starting transcription with URL:', transcriptionUrl);
      console.log('[Process Route] Project ID:', projectId);
      console.log('[Process Route] Video URL:', project.video_url);
      
      // Get all relevant auth headers
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Pass along all auth-related headers
      const authHeaderNames = ['authorization', 'cookie', 'x-clerk-auth-token'];
      authHeaderNames.forEach(headerName => {
        const headerValue = request.headers.get(headerName);
        if (headerValue) {
          authHeaders[headerName] = headerValue;
        }
      });
      
      fetch(transcriptionUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          projectId: project.id,
          videoUrl: project.video_url,
          language: 'en'
        })
      }).then(async response => {
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Process Route] Transcription request failed with status: ${response.status}`);
          console.error(`[Process Route] Error response:`, errorText);
          await ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
        } else {
          console.log('[Process Route] Transcription request initiated successfully');
        }
      }).catch(error => {
        console.error('[Process Route] Failed to start transcription:', error);
        ProjectService.updateTaskProgress(projectId, 'transcription', 0, 'failed');
      });
    }

    // Wait a moment to ensure transcription request is sent
    if (hasTranscriptionTask) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Process clips if needed (pending or stuck processing tasks)
    const hasClipsTask = project.tasks.some(
      task => task.type === 'clips' && (task.status === 'pending' || task.status === 'processing')
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