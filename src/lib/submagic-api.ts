// Submagic API Service - Modern AI-powered video captioning and clip generation
// Documentation: https://api.submagic.co

import { logger } from './logger'
import { fetchWithRetry } from './retry-utils'
import type {
  SubmagicProject,
  CreateProjectRequest,
  ExportProjectRequest,
  ExportProjectResponse,
  Language,
  SubmagicError,
} from '@/types/submagic'

export class SubmagicAPIService {
  /**
   * Get API configuration lazily to avoid client-side errors
   */
  private static getConfig() {
    const apiKey = process.env.SUBMAGIC_API_KEY || ''
    const apiUrl = process.env.SUBMAGIC_API_URL || 'https://api.submagic.co'
    
    if (!apiKey) {
      logger.error('[Submagic] SUBMAGIC_API_KEY is not configured', {
        action: 'api_config',
        metadata: { service: 'submagic' }
      })
      throw new Error('Video caption service is not configured. Please contact support.')
    }
    
    return { apiKey, apiUrl }
  }

  /**
   * Method to handle all authenticated requests to the Submagic API.
   * Includes robust error handling and logging.
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { apiKey, apiUrl } = this.getConfig()

    const url = `${apiUrl}${endpoint}`
    logger.debug(`[Submagic] Requesting: ${options.method || 'GET'} ${url}`, {
      action: 'submagic_api_request',
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
            'x-api-key': apiKey, // Submagic uses x-api-key header
            'Content-Type': 'application/json',
            'User-Agent': `Inflio/1.0 (${process.env.NODE_ENV || 'development'})`,
            ...options.headers,
          },
        },
        {
          maxAttempts: 3,
          initialDelay: 2000,
          shouldRetry: (error) => {
            // Don't retry on auth errors
            if (error.status === 401 || error.status === 403) return false
            // Retry on rate limits
            if (error.status === 429) return true
            // Retry on server errors
            if (error.status >= 500) return true
            // Retry on network errors
            if (error.message?.includes('network')) return true
            return false
          },
          onRetry: (error, attempt) => {
            logger.warn(`[Submagic] Retry attempt ${attempt}`, {
              action: 'submagic_api_retry',
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
        let errorMessage = `[Submagic] API Error: ${response.status} - ${response.statusText}`
        let errorDetails = errorText
        
        try {
          const errorJson = JSON.parse(errorText) as SubmagicError
          errorMessage = `[Submagic] API Error: ${errorJson.message || errorJson.error || errorMessage}`
          errorDetails = JSON.stringify(errorJson, null, 2)
        } catch {
          logger.error('[Submagic] Raw non-JSON error response', {
            action: 'submagic_api_error',
            metadata: { errorText }
          })
        }
        
        logger.error('[Submagic] API request failed', {
          action: 'submagic_api_error',
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
          throw new Error('Submagic API authentication failed. Please check your SUBMAGIC_API_KEY.')
        } else if (response.status === 403) {
          throw new Error('Submagic API access forbidden. Check subscription or permissions.')
        } else if (response.status === 429) {
          throw new Error('Submagic API rate limit exceeded. Please try again later.')
        } else if (response.status === 503) {
          throw new Error('Submagic API service is temporarily unavailable. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        // Network or parsing errors
        if (error.message.includes('fetch')) {
          throw new Error(`Submagic API network error: ${error.message}`)
        }
        throw error // Re-throw if it's already a proper error
      }
      throw new Error(`Unknown error during Submagic API request: ${error}`)
    }
  }

  /**
   * Get list of supported languages
   */
  static async getLanguages(): Promise<Language[]> {
    try {
      const response = await this.request<{ languages: Language[] }>('/v1/languages')
      return response.languages
    } catch (error) {
      logger.error('[Submagic] Failed to fetch languages', {
        action: 'get_languages_failed',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      // Return default languages if API call fails
      return [
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
        { name: 'French', code: 'fr' },
      ]
    }
  }

  /**
   * Get list of available templates
   */
  static async getTemplates(): Promise<string[]> {
    try {
      const response = await this.request<{ templates: string[] }>('/v1/templates')
      return response.templates
    } catch (error) {
      logger.error('[Submagic] Failed to fetch templates', {
        action: 'get_templates_failed',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      // Return default templates if API call fails
      return ['Sara', 'Hormozi 2', 'Daniel']
    }
  }

  /**
   * Create a new video project with captions
   * This replaces Klap's createVideoTask
   */
  static async createProject(request: CreateProjectRequest): Promise<SubmagicProject> {
    // Validate inputs
    if (!request.videoUrl || typeof request.videoUrl !== 'string') {
      throw new Error('Invalid video URL provided to Submagic API')
    }
    
    if (!request.title || typeof request.title !== 'string') {
      throw new Error('Invalid title provided to Submagic API')
    }

    // Set defaults
    const payload: CreateProjectRequest = {
      title: request.title,
      language: request.language || 'en',
      videoUrl: request.videoUrl,
      templateName: request.templateName || 'Hormozi 2', // Popular template
      webhookUrl: request.webhookUrl,
      dictionary: request.dictionary,
      magicZooms: request.magicZooms ?? false,
      magicBrolls: request.magicBrolls ?? false,
      magicBrollsPercentage: request.magicBrollsPercentage ?? 50,
      removeSilencePace: request.removeSilencePace,
      removeBadTakes: request.removeBadTakes ?? false,
    }
    
    console.log('[SubmagicAPI] Creating video project with payload:', {
      title: payload.title,
      language: payload.language,
      templateName: payload.templateName,
      endpoint: '/v1/projects',
      hasApiKey: !!process.env.SUBMAGIC_API_KEY
    })
    
    try {
      const result = await this.request<SubmagicProject>('/v1/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      
      if (!result || !result.id) {
        throw new Error('Invalid response from Submagic API: missing project ID')
      }
      
      console.log('[SubmagicAPI] Video project created successfully:', {
        projectId: result.id,
        status: result.status
      })
      
      logger.info('[SubmagicAPI] Video project created', {
        action: 'submagic_project_created',
        metadata: {
          projectId: result.id,
          videoUrl: request.videoUrl,
          status: result.status
        }
      })
      
      return result
    } catch (error) {
      console.error('[SubmagicAPI] Failed to create video project:', error)
      logger.error('[SubmagicAPI] Failed to create video project', {
        action: 'submagic_project_creation_failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          videoUrl: request.videoUrl
        }
      })
      throw error
    }
  }

  /**
   * Get project status and details
   */
  static async getProject(projectId: string): Promise<SubmagicProject> {
    try {
      const project = await this.request<SubmagicProject>(`/v1/projects/${projectId}`)
      
      logger.debug('[SubmagicAPI] Project status retrieved', {
        action: 'get_project_status',
        metadata: {
          projectId,
          status: project.status,
          transcriptionStatus: project.transcriptionStatus
        }
      })
      
      return project
    } catch (error) {
      console.error(`[SubmagicAPI] Failed to get project ${projectId}:`, error)
      throw error
    }
  }

  /**
   * Export project with custom settings
   * Call this after project is transcribed to generate the final video
   */
  static async exportProject(
    projectId: string,
    request?: ExportProjectRequest
  ): Promise<ExportProjectResponse> {
    try {
      const payload: ExportProjectRequest = {
        fps: request?.fps ?? 30,
        width: request?.width ?? 1080,
        height: request?.height ?? 1920,
        webhookUrl: request?.webhookUrl,
      }

      const result = await this.request<ExportProjectResponse>(
        `/v1/projects/${projectId}/export`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )

      logger.info('[SubmagicAPI] Project export started', {
        action: 'export_project',
        metadata: {
          projectId,
          status: result.status
        }
      })

      return result
    } catch (error) {
      console.error(`[SubmagicAPI] Failed to export project ${projectId}:`, error)
      logger.error('[SubmagicAPI] Failed to export project', {
        action: 'export_project_failed',
        metadata: {
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }

  /**
   * Poll project until it's completed
   * Used when webhook is not available
   */
  static async pollUntilCompleted(
    projectId: string,
    maxAttempts: number = 180,
    pollInterval: number = 10000
  ): Promise<SubmagicProject> {
    const startTime = Date.now()
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const project = await this.getProject(projectId)

        // Check if completed
        if (project.status === 'completed' && project.downloadUrl) {
          logger.info('[SubmagicAPI] Project completed', {
            action: 'project_completed',
            metadata: {
              projectId,
              duration: Math.floor((Date.now() - startTime) / 1000)
            }
          })
          return project
        }

        // Check if failed
        if (project.status === 'failed') {
          throw new Error(`Project failed: ${project.failureReason || 'Unknown error'}`)
        }

        // Update progress
        const progress = Math.min(10 + Math.floor((attempts / maxAttempts) * 85), 95)
        logger.debug('[SubmagicAPI] Project still processing', {
          action: 'project_polling',
          metadata: {
            projectId,
            status: project.status,
            progress,
            attempt: attempts + 1
          }
        })

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        attempts++
      } catch (error) {
        console.error('[SubmagicAPI] Error polling project:', error)
        if (attempts >= 3) throw error // Fail after 3 consecutive errors
        attempts++
        await new Promise(resolve => setTimeout(resolve, pollInterval * 2))
      }
    }

    const totalMinutes = Math.floor((Date.now() - startTime) / 60000)
    throw new Error(`Project ${projectId} timed out after ${totalMinutes} minutes`)
  }

  /**
   * Process video: create project and wait for completion
   * This is the high-level method that replaces Klap's processVideo
   */
  static async processVideo(
    videoUrl: string,
    title: string,
    options?: {
      webhookUrl?: string
      language?: string
      templateName?: string
      dictionary?: string[]
      magicZooms?: boolean
      removeSilencePace?: 'natural' | 'fast' | 'extra-fast'
    }
  ): Promise<{ project: SubmagicProject; clips: any[] }> {
    // Step 1: Create project
    const project = await this.createProject({
      title,
      videoUrl,
      language: options?.language || 'en',
      templateName: options?.templateName || 'Hormozi 2',
      webhookUrl: options?.webhookUrl,
      dictionary: options?.dictionary,
      magicZooms: options?.magicZooms ?? true,
      removeSilencePace: options?.removeSilencePace ?? 'fast',
    })

    // Step 2: If webhook provided, return immediately
    if (options?.webhookUrl) {
      logger.info('[SubmagicAPI] Project created with webhook - returning early', {
        action: 'process_video_webhook',
        metadata: { projectId: project.id }
      })
      return { project, clips: [] }
    }

    // Step 3: Poll for completion (only if no webhook)
    const completedProject = await this.pollUntilCompleted(project.id)

    // Step 4: Export the project
    await this.exportProject(project.id, {
      webhookUrl: options?.webhookUrl
    })

    // Step 5: Poll for export completion
    const exportedProject = await this.pollUntilCompleted(project.id)

    // For compatibility with Klap interface, return clips array
    // Submagic returns a single video, so we wrap it
    const clips = exportedProject.downloadUrl ? [{
      id: exportedProject.id,
      title: exportedProject.title,
      url: exportedProject.downloadUrl,
      directUrl: exportedProject.directUrl,
      previewUrl: exportedProject.previewUrl,
      duration: exportedProject.videoMetaData?.duration,
      status: 'ready'
    }] : []

    return { 
      project: exportedProject,
      clips
    }
  }

  /**
   * Get project status for UI display
   */
  static async getProjectStatus(projectId: string): Promise<{
    status: string
    progress: number
    message: string
  }> {
    try {
      const project = await this.getProject(projectId)
      
      // Map Submagic status to progress
      let progress = 0
      let message = 'Processing video...'
      
      switch (project.status) {
        case 'processing':
          progress = 25
          message = 'Processing video...'
          break
        case 'transcribing':
          progress = 50
          message = 'Generating captions...'
          break
        case 'exporting':
          progress = 75
          message = 'Exporting video...'
          break
        case 'completed':
          progress = 100
          message = 'Processing complete!'
          break
        case 'failed':
          progress = 0
          message = project.failureReason || 'Processing failed'
          break
      }
      
      return {
        status: project.status,
        progress,
        message
      }
    } catch (error) {
      console.error('[Submagic] Error checking project status:', error)
      return {
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}





