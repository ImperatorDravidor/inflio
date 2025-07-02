// Correct Klap API Service using v2 Task-Based Workflow
// Aligned with documentation at /documentation/klap_api/

export class KlapAPIService {
  /**
   * Get API configuration lazily to avoid client-side errors
   */
  private static getConfig() {
    const apiKey = process.env.KLAP_API_KEY || ''
    const apiUrl = process.env.KLAP_API_URL || 'https://api.klap.app/v2'
    
    if (!apiKey) {
      throw new Error('[Klap] Error: KLAP_API_KEY is not configured in environment variables.')
    }
    
    return { apiKey, apiUrl }
  }

  /**
   * Private method to handle all authenticated requests to the Klap API.
   * Includes robust error handling and logging.
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { apiKey, apiUrl } = this.getConfig()

    const url = `${apiUrl}${endpoint}`
    console.log(`[Klap] Requesting: ${options.method || 'GET'} ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `[Klap] API Error: ${response.status} - ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = `[Klap] API Error: ${errorJson.message || errorMessage}`
      } catch {
        console.error('[Klap] Raw non-JSON error response:', errorText)
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * Step 1: Create a video processing task on Klap.
   */
  private static async createVideoTask(videoUrl: string): Promise<{ id: string }> {
    return this.request('/tasks/video-to-shorts', {
      method: 'POST',
      body: JSON.stringify({ 
        source_video_url: videoUrl, 
        language: 'en',
        max_duration: 60, // Explicitly set max duration for clips
      }),
    })
  }

  /**
   * Step 2: Poll the task status until it's ready.
   * Klap processing typically takes 15-20 minutes for video analysis.
   */
  private static async pollTaskUntilReady(taskId: string): Promise<{ id: string; status: string; output_id: string }> {
    const startTime = Date.now();
    const maxDuration = 25 * 60 * 1000; // 25 minutes in milliseconds
    const baseDelay = 15000; // 15 seconds base polling interval
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;
    
    while (Date.now() - startTime < maxDuration) {
      try {
      const task = await this.request<{ id: string; status: 'processing' | 'ready' | 'error'; output_id?: string; error?: string }>(`/tasks/${taskId}`)
        
        // Calculate elapsed time
        const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
      
      if (task.status === 'ready') {
        if (!task.output_id) {
            throw new Error('[Klap] Task is ready but has no output_id.')
        }
          console.log(`[Klap] Task completed successfully after ${elapsedMinutes} minutes`)
        return { id: task.id, status: task.status, output_id: task.output_id };
      }
      
      if (task.status === 'error') {
        throw new Error(`[Klap] Task failed: ${task.error || 'Unknown error'}`)
      }

        // Reset consecutive errors on successful poll
        consecutiveErrors = 0;
        
        // Use consistent polling interval
        await new Promise(resolve => setTimeout(resolve, baseDelay));
        
      } catch (error: any) {
        consecutiveErrors++;
        
        // Handle rate limiting
        if (error.message && error.message.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on rate limit
        } else if (consecutiveErrors >= maxConsecutiveErrors) {
          throw error;
        } else {
          // Wait longer on errors
          await new Promise(resolve => setTimeout(resolve, baseDelay * 2));
        }
      }
    }
    
    const totalMinutes = Math.floor((Date.now() - startTime) / 60000);
    throw new Error(`[Klap] Task ${taskId} timed out after ${totalMinutes} minutes. Klap processing may still be running.`)
  }

  /**
   * Step 3: Get all generated clips from the output folder.
   */
  private static async getClipsFromFolder(folderId: string): Promise<any[]> {
    return this.request(`/projects/${folderId}`)
  }
  
  /**
   * High-level orchestrator for the entire Klap video processing flow.
   * This is the single public method that handles everything.
   */
  static async processVideo(videoUrl: string, title: string) {
    // Step 1: Create task
    const task = await this.createVideoTask(videoUrl)
    console.log(`[Klap] Task creation successful. Received Task ID: ${task.id}`, task)
    
    // Step 2: Poll until ready
    const completedTask = await this.pollTaskUntilReady(task.id)
    console.log(`[Klap] Task ${completedTask.id} completed. Output folder: ${completedTask.output_id}`)
    
    // Step 3: Get clips
    const clips = await this.getClipsFromFolder(completedTask.output_id)
    console.log(`[Klap] Successfully fetched ${clips.length} clips.`)
    
    return { clips, klapFolderId: completedTask.output_id }
  }

  /**
   * Get the status of a project/folder
   */
  static async getProjectStatus(folderId: string): Promise<{ status: string; progress: number; message: string }> {
    try {
      const clips = await this.getClipsFromFolder(folderId)
      
      // If we have clips, the project is ready
      if (clips && clips.length > 0) {
        return {
          status: 'ready',
          progress: 100,
          message: `Processing complete. ${clips.length} clips generated.`
        }
      }
      
      // Otherwise, it might still be processing
      return {
        status: 'processing',
        progress: 50,
        message: 'Processing video...'
      }
    } catch (error) {
      console.error('[Klap] Error checking project status:', error)
      return {
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Export multiple clips from a folder
   */
  static async exportMultipleClips(
    folderId: string,
    clipIds: string[],
    watermark?: string,
    onProgress?: (message: string, index: number, total: number) => void
  ): Promise<Array<{ projectId: string; url: string }>> {
    const exportedClips: Array<{ projectId: string; url: string }> = []
    
    for (let i = 0; i < clipIds.length; i++) {
      const clipId = clipIds[i]
      
      if (onProgress) {
        onProgress(`Exporting clip ${i + 1} of ${clipIds.length}`, i, clipIds.length)
      }
      
      try {
        // Create export task for this clip
        console.log(`[Klap] Creating export for clip ${clipId}`)
        
        const exportPayload: any = {}
        if (watermark) {
          exportPayload.watermark = { src_url: watermark }
        }
        
        // Create export task
        const exportTask = await this.request<{ id: string; status: string }>(
          `/projects/${folderId}/${clipId}/exports`,
          {
            method: 'POST',
            body: JSON.stringify(exportPayload)
          }
        )
        
        console.log(`[Klap] Export task created: ${exportTask.id}`)
        
        // Poll for export completion
        let exportResult: any
        for (let j = 0; j < 60; j++) { // Poll for up to 5 minutes
          exportResult = await this.request<{ id: string; status: string; src_url?: string }>(
            `/projects/${folderId}/${clipId}/exports/${exportTask.id}`
          )
          
          if (exportResult.status === 'ready' && exportResult.src_url) {
            break // Success
          }
          
          if (exportResult.status === 'error') {
            throw new Error(`Export failed for clip ${clipId}. Reason: ${exportResult.error || 'Unknown'}`)
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        }
        
        if (exportResult && exportResult.src_url) {
        exportedClips.push({
          projectId: clipId,
            url: exportResult.src_url
        })
          console.log(`[Klap] Successfully exported clip ${clipId}: ${exportResult.src_url}`)
        } else {
          throw new Error(`Export timed out for clip ${clipId}. Final status: ${exportResult?.status}`)
        }
        
      } catch (error) {
        console.error(`[Klap] Failed to process export for clip ${clipId}:`, error)
        // Re-throw the error to be handled by the caller
        throw error;
      }
    }
    
    console.log(`[Klap] Export complete. Successfully exported ${exportedClips.length} clips`)
    return exportedClips
  }
  
  /**
   * Get a single clip's details
   */
  static async getClipDetails(folderId: string, clipId: string): Promise<any> {
    console.log(`[Klap] Getting details for clip ${clipId} in folder ${folderId}`)
    try {
      return await this.request(`/projects/${folderId}/${clipId}`)
    } catch (error) {
      console.error(`[Klap] Failed to get clip details:`, error)
      // Try without folder ID as fallback
      return await this.request(`/projects/${clipId}`)
    }
  }
} 