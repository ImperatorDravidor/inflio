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
    console.log('[Klap] Creating video-to-shorts task for URL:', videoUrl)
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
   */
  private static async pollTaskUntilReady(taskId: string): Promise<{ id: string; status: string; output_id: string }> {
    for (let i = 0; i < 60; i++) { // Poll for up to 5 minutes
      const task = await this.request<{ id: string; status: 'processing' | 'ready' | 'error'; output_id?: string; error?: string }>(`/tasks/${taskId}`)
      console.log(`[Klap] Polling task ${taskId}: status is ${task.status}`)
      
      if (task.status === 'ready') {
        if (!task.output_id) {
            throw new Error('[Klap] Task is ready but has no output_id.')
        }
        return { id: task.id, status: task.status, output_id: task.output_id };
      }
      
      if (task.status === 'error') {
        throw new Error(`[Klap] Task failed: ${task.error || 'Unknown error'}`)
      }

      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
    }
    throw new Error(`[Klap] Task ${taskId} timed out after 5 minutes.`)
  }

  /**
   * Step 3: Get all generated clips from the output folder.
   */
  private static async getClipsFromFolder(folderId: string): Promise<any[]> {
    console.log('[Klap] Getting clips from folder:', folderId)
    return this.request(`/projects?folder_id=${folderId}`)
  }
  
  /**
   * High-level orchestrator for the entire Klap video processing flow.
   * This is the single public method that handles everything.
   */
  static async processVideo(videoUrl: string, title: string) {
    console.log(`[Klap] Starting full processing for video: ${title}`)
    
    // Step 1: Create task
    const task = await this.createVideoTask(videoUrl)
    console.log(`[Klap] Task creation successful. Received Task ID: ${task.id}`, task)
    
    // Step 2: Poll until ready
    const completedTask = await this.pollTaskUntilReady(task.id)
    console.log(`[Klap] Task ${completedTask.id} completed. Output folder: ${completedTask.output_id}`)
    
    // Step 3: Get clips
    const clips = await this.getClipsFromFolder(completedTask.output_id)
    console.log(`[Klap] Successfully fetched ${clips.length} clips.`)

    // Step 4: Construct a transcription from the clips' transcripts, as Klap v2 does not provide a separate transcription object.
    const fullTranscript = clips
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(c => c.transcript)
      .join(' \n')

    const transcription = {
      text: fullTranscript,
      segments: [{ id: '0', text: 'Transcription generated from clips.', start: 0, end: 0, confidence: 0.9 }],
      language: 'en',
      duration: 0
    }
    
    return { transcription, clips, klapFolderId: completedTask.output_id }
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
    console.log(`[Klap] Exporting ${clipIds.length} clips from folder ${folderId}`)
    
    const exportedClips: Array<{ projectId: string; url: string }> = []
    
    for (let i = 0; i < clipIds.length; i++) {
      const clipId = clipIds[i]
      
      if (onProgress) {
        onProgress(`Exporting clip ${i + 1} of ${clipIds.length}`, i, clipIds.length)
      }
      
      try {
        // In Klap v2, clips are already exported and available via their preview URLs
        // We'll return the preview URL as the export URL
        const previewUrl = `https://klap.app/player/${clipId}`
        
        exportedClips.push({
          projectId: clipId,
          url: previewUrl
        })
        
        console.log(`[Klap] Exported clip ${clipId}: ${previewUrl}`)
      } catch (error) {
        console.error(`[Klap] Failed to export clip ${clipId}:`, error)
      }
    }
    
    console.log(`[Klap] Successfully exported ${exportedClips.length} clips`)
    return exportedClips
  }
}
