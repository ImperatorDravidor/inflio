// Correct Klap API Service using v2 Task-Based Workflow
// Aligned with documentation at /documentation/klap_api/

import { logger } from './logger'
import { fetchWithRetry } from './retry-utils'

export class KlapAPIService {
  /**
   * Get API configuration lazily to avoid client-side errors
   */
  private static getConfig() {
    const apiKey = process.env.KLAP_API_KEY || ''
    // Note: Documentation examples show api.klap.video but api.klap.app is the correct production URL
    const apiUrl = process.env.KLAP_API_URL || 'https://api.klap.app/v2'
    
    if (!apiKey) {
      logger.error('[Klap] KLAP_API_KEY is not configured', {
        action: 'api_config',
        metadata: { service: 'klap' }
      })
      throw new Error('Clip generation service is not configured. Please contact support.')
    }
    
    return { apiKey, apiUrl }
  }

  /**
   * Method to handle all authenticated requests to the Klap API.
   * Includes robust error handling and logging.
   * Made public for use by worker processes.
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { apiKey, apiUrl } = this.getConfig()

    const url = `${apiUrl}${endpoint}`
    logger.debug(`[Klap] Requesting: ${options.method || 'GET'} ${url}`, {
      action: 'klap_api_request',
      metadata: { 
        method: options.method || 'GET',
        url,
        endpoint
      }
    })

    try {
      const response = await fetchWithRetry(
        url, 
        {
          ...options,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': `Inflio/1.0 (${process.env.NODE_ENV || 'development'})`,
            'X-Environment': process.env.NODE_ENV || 'development',
            ...options.headers,
          },
        },
        {
          maxAttempts: 3,
          initialDelay: 2000,
          shouldRetry: (error) => {
            // Don't retry on auth errors
            if (error.status === 401 || error.status === 403) return false
            // Retry on rate limits with longer delay
            if (error.status === 429) return true
            // Retry on server errors
            if (error.status >= 500) return true
            // Retry on network errors
            if (error.message?.includes('network')) return true
            return false
          },
          onRetry: (error, attempt) => {
            logger.warn(`[Klap] Retry attempt ${attempt}`, {
              action: 'klap_api_retry',
              metadata: { 
                error: error.message,
                status: error.status,
                endpoint 
              }
            })
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `[Klap] API Error: ${response.status} - ${response.statusText}`
        let errorDetails = errorText
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = `[Klap] API Error: ${errorJson.message || errorJson.error || errorMessage}`
          errorDetails = JSON.stringify(errorJson, null, 2)
        } catch {
          logger.error('[Klap] Raw non-JSON error response', {
            action: 'klap_api_error',
            metadata: { errorText }
          })
        }
        
        logger.error('[Klap] API request failed', {
          action: 'klap_api_error',
          metadata: {
          url,
          status: response.status,
          statusText: response.statusText,
          method: options.method || 'GET',
          details: errorDetails
          }
        })
        
        // Provide more specific error messages based on status code
        if (response.status === 401) {
          throw new Error('Klap API authentication failed. Please check your KLAP_API_KEY.')
        } else if (response.status === 429) {
          throw new Error('Klap API rate limit exceeded. Please try again later.')
        } else if (response.status === 503) {
          throw new Error('Klap API service is temporarily unavailable. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        // Network or parsing errors
        if (error.message.includes('fetch')) {
          throw new Error(`Klap API network error: ${error.message}`)
        }
        throw error // Re-throw if it's already a proper error
      }
      throw new Error(`Unknown error during Klap API request: ${error}`)
    }
  }

  /**
   * Step 1: Create a video processing task on Klap.
   */
  static async createVideoTask(videoUrl: string): Promise<{ id: string }> {
    // Validate inputs
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('Invalid video URL provided to Klap API')
    }
    
    const payload = {
      source_video_url: videoUrl, 
      language: 'en',
      max_duration: 30, // 30-second clips for social media platforms
      max_clip_count: 10, // Maximum number of clips to generate
      editing_options: {
        intro_title: false, // Disable intro titles for cleaner clips
      },
    }
    
    console.log('[KlapAPI] Creating video task with payload:', {
      videoUrl,
      endpoint: '/tasks/video-to-shorts',
      apiUrl: process.env.KLAP_API_URL || 'https://api.klap.app/v2',
      hasApiKey: !!process.env.KLAP_API_KEY
    })
    
    try {
      const result = await this.request<{ id: string }>('/tasks/video-to-shorts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      
      if (!result || !result.id) {
        throw new Error('Invalid response from Klap API: missing task ID')
      }
      
      console.log('[KlapAPI] Video task created successfully:', result)
      logger.info('[KlapAPI] Video task created', {
        action: 'klap_task_created',
        metadata: {
          taskId: result.id,
          videoUrl
        }
      })
      
      return result
    } catch (error) {
      console.error('[KlapAPI] Failed to create video task:', error)
      logger.error('[KlapAPI] Failed to create video task', {
        action: 'klap_task_creation_failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          videoUrl
        }
      })
      throw error
    }
  }

  /**
   * Step 2: Poll the task status until it's ready.
   * Klap processing typically takes 15-20 minutes for video analysis.
   */
  private static async pollTaskUntilReady(taskId: string): Promise<{ id: string; status: string; output_id: string }> {
    const startTime = Date.now();
    const maxDuration = 25 * 60 * 1000; // 25 minutes in milliseconds
    const baseDelay = 30000; // 30 seconds polling interval as requested
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
  static async getClipsFromFolder(folderId: string): Promise<any[]> {
    try {
      const response: any = await this.request(`/projects/${folderId}`)
      
      // IMPORTANT: Klap API returns clips directly as an array at /projects/{folderId}
      // Not wrapped in an object with a "clips" property
      if (Array.isArray(response)) {
        return response
      }
      
      // Fallback: Handle different response formats from KLAP API (just in case)
      if (response.clips && Array.isArray(response.clips)) {
        return response.clips
      } else if (response.data && Array.isArray(response.data)) {
        return response.data
      } else if (response.items && Array.isArray(response.items)) {
        return response.items
      } else if (response.projects && Array.isArray(response.projects)) {
        // Sometimes Klap returns clips under "projects"
        return response.projects
      } else if (response.videos && Array.isArray(response.videos)) {
        // Or under "videos"
        return response.videos
      } else if (typeof response === 'object' && response !== null) {
        // If it's an object, try to find any array property
        const arrayProps = Object.keys(response).filter(key => Array.isArray(response[key]))
        if (arrayProps.length > 0) {
          return response[arrayProps[0]]
        }
      }
      
      console.warn(`[Klap] Unexpected response format from folder API:`, response)
      console.warn(`[Klap] Response type:`, typeof response)
      console.warn(`[Klap] Response keys:`, response ? Object.keys(response) : 'null')
      return []
    } catch (error) {
      console.error(`[Klap] Failed to get clips from folder ${folderId}:`, error)
      throw error
    }
  }
  
  /**
   * High-level orchestrator for the entire Klap video processing flow.
   * This is the single public method that handles everything.
   */
  static async processVideo(videoUrl: string, title: string) {
    // Step 1: Create task
    const task = await this.createVideoTask(videoUrl)
    
    // Step 2: Poll until ready
    const completedTask = await this.pollTaskUntilReady(task.id)
    
    // Step 3: Get clips - with retry logic for when clips aren't immediately available
    let clips: any[] = []
    let retryCount = 0
    const maxRetries = 10 // Try for up to 2.5 minutes
    
    while (retryCount < maxRetries) {
      try {
        clips = await this.getClipsFromFolder(completedTask.output_id)
        if (clips && clips.length > 0) {
          break
        }
      } catch (error) {
        console.warn(`[Klap] Error fetching clips (attempt ${retryCount + 1}/${maxRetries}):`, error)
      }
      
      retryCount++
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 15000)) // Wait 15 seconds between retries
      }
    }
    
    if (clips.length === 0) {
      console.error(`[Klap] No clips generated after ${maxRetries} attempts. Task might have failed.`)
    }
    
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
    try {
      return await this.request(`/projects/${folderId}/${clipId}`)
    } catch (error) {
      console.error(`[Klap] Failed to get clip details:`, error)
      // Try without folder ID as fallback
      return await this.request(`/projects/${clipId}`)
    }
  }
} 