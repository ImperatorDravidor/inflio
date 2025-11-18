// Submagic API Service for AI-powered video clip generation
// Documentation: https://docs.submagic.co/

import { logger } from './logger'
import { fetchWithRetry } from './retry-utils'

interface SubmagicProject {
  id: string
  title: string
  status: 'processing' | 'ready' | 'error' | 'pending'
  videoUrl?: string
  outputUrl?: string
  error?: string
  createdAt?: string
  updatedAt?: string
}

interface SubmagicClip {
  id: string
  projectId: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  startTime: number
  endTime: number
  duration: number
  viralityScore?: number
  transcript?: string
  captions?: string
}

interface CreateProjectRequest {
  title: string
  language?: string
  videoUrl: string
  templateName?: string
  webhookUrl?: string
  // Additional options for clip generation
  generateClips?: boolean
  maxClips?: number
  clipDuration?: number
  autoCaption?: boolean
}

interface SubmagicConfig {
  apiKey: string
  apiUrl: string
  webhookUrl?: string
}

export class SubmagicAPIService {
  /**
   * Get API configuration
   */
  private static getConfig(): SubmagicConfig {
    const apiKey = process.env.SUBMAGIC_API_KEY || ''
    const apiUrl = process.env.SUBMAGIC_API_URL || 'https://api.submagic.co/v1'
    const webhookUrl = process.env.SUBMAGIC_WEBHOOK_URL
    
    if (!apiKey) {
      logger.error('[Submagic] SUBMAGIC_API_KEY is not configured', {
        action: 'api_config',
        metadata: { service: 'submagic' }
      })
      throw new Error('Submagic API key is not configured. Please set SUBMAGIC_API_KEY environment variable.')
    }
    
    return { apiKey, apiUrl, webhookUrl }
  }

  /**
   * Make authenticated request to Submagic API
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { apiKey, apiUrl } = this.getConfig()
    const url = `${apiUrl}${endpoint}`

    logger.debug(`[Submagic] Requesting: ${options.method || 'GET'} ${url}`, {
      action: 'submagic_api_request',
      metadata: { 
        method: options.method || 'GET',
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
        let errorMessage = `Submagic API Error: ${response.status} - ${response.statusText}`
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorMessage
        } catch {
          // Non-JSON error response
        }
        
        logger.error('[Submagic] API request failed', {
          action: 'submagic_api_error',
          metadata: {
            url,
            status: response.status,
            statusText: response.statusText,
            method: options.method || 'GET',
            error: errorMessage
          }
        })
        
        if (response.status === 401) {
          throw new Error('Submagic API authentication failed. Please check your SUBMAGIC_API_KEY.')
        } else if (response.status === 429) {
          throw new Error('Submagic API rate limit exceeded. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Unknown error during Submagic API request: ${error}`)
    }
  }

  /**
   * Create a new video processing project
   */
  static async createProject(params: CreateProjectRequest): Promise<SubmagicProject> {
    logger.info('[Submagic] Creating project', {
      action: 'create_project',
      metadata: { 
        title: params.title,
        videoUrl: params.videoUrl,
        language: params.language || 'en'
      }
    })

    try {
      const { webhookUrl } = this.getConfig()
      
      const payload: any = {
        title: params.title,
        language: params.language || 'en',
        videoUrl: params.videoUrl,
      }

      // Add optional parameters
      if (params.templateName) payload.templateName = params.templateName
      if (webhookUrl || params.webhookUrl) payload.webhookUrl = params.webhookUrl || webhookUrl
      
      // Submagic-specific options for clip generation
      if (params.generateClips !== undefined) payload.generateClips = params.generateClips
      if (params.maxClips) payload.maxClips = params.maxClips
      if (params.clipDuration) payload.clipDuration = params.clipDuration
      if (params.autoCaption !== undefined) payload.autoCaption = params.autoCaption

      const project = await this.request<SubmagicProject>('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      logger.info('[Submagic] Project created successfully', {
        action: 'project_created',
        metadata: { projectId: project.id }
      })

      return project
    } catch (error) {
      logger.error('[Submagic] Failed to create project', {
        action: 'create_project_failed',
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          videoUrl: params.videoUrl
        }
      })
      throw error
    }
  }

  /**
   * Get project status
   */
  static async getProjectStatus(projectId: string): Promise<SubmagicProject> {
    try {
      const project = await this.request<SubmagicProject>(`/projects/${projectId}`)
      
      logger.debug('[Submagic] Project status retrieved', {
        action: 'get_project_status',
        metadata: { 
          projectId,
          status: project.status 
        }
      })
      
      return project
    } catch (error) {
      logger.error('[Submagic] Failed to get project status', {
        action: 'get_project_status_failed',
        metadata: { 
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }

  /**
   * Poll project until it's ready
   */
  static async pollProjectUntilReady(
    projectId: string,
    maxDuration: number = 30 * 60 * 1000, // 30 minutes
    pollInterval: number = 30000 // 30 seconds
  ): Promise<SubmagicProject> {
    const startTime = Date.now()
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 5

    while (Date.now() - startTime < maxDuration) {
      try {
        const project = await this.getProjectStatus(projectId)
        
        if (project.status === 'ready') {
          logger.info('[Submagic] Project processing complete', {
            action: 'project_ready',
            metadata: { 
              projectId,
              duration: Date.now() - startTime
            }
          })
          return project
        }
        
        if (project.status === 'error') {
          throw new Error(`Submagic processing failed: ${project.error || 'Unknown error'}`)
        }

        // Reset consecutive errors on successful poll
        consecutiveErrors = 0
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        
      } catch (error: any) {
        consecutiveErrors++
        
        if (error.message?.includes('429')) {
          // Rate limit - wait longer
          await new Promise(resolve => setTimeout(resolve, 60000))
        } else if (consecutiveErrors >= maxConsecutiveErrors) {
          throw error
        } else {
          await new Promise(resolve => setTimeout(resolve, pollInterval * 2))
        }
      }
    }
    
    const totalMinutes = Math.floor((Date.now() - startTime) / 60000)
    throw new Error(`Submagic project ${projectId} timed out after ${totalMinutes} minutes`)
  }

  /**
   * Get clips from a project
   */
  static async getProjectClips(projectId: string): Promise<SubmagicClip[]> {
    try {
      // Submagic returns clips as part of the project or via a separate endpoint
      // This may need adjustment based on actual API structure
      const response = await this.request<{ clips: SubmagicClip[] } | SubmagicClip[]>(
        `/projects/${projectId}/clips`
      )
      
      // Handle both array and object responses
      const clips = Array.isArray(response) ? response : response.clips || []
      
      logger.info('[Submagic] Retrieved project clips', {
        action: 'get_project_clips',
        metadata: { 
          projectId,
          clipCount: clips.length
        }
      })
      
      return clips
    } catch (error) {
      logger.error('[Submagic] Failed to get project clips', {
        action: 'get_project_clips_failed',
        metadata: { 
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }

  /**
   * Get a single clip's details
   */
  static async getClipDetails(projectId: string, clipId: string): Promise<SubmagicClip> {
    try {
      const clip = await this.request<SubmagicClip>(
        `/projects/${projectId}/clips/${clipId}`
      )
      
      logger.debug('[Submagic] Retrieved clip details', {
        action: 'get_clip_details',
        metadata: { projectId, clipId }
      })
      
      return clip
    } catch (error) {
      logger.error('[Submagic] Failed to get clip details', {
        action: 'get_clip_details_failed',
        metadata: { 
          projectId,
          clipId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }

  /**
   * Download clip video
   * Returns the video URL - caller can decide whether to download or use directly
   */
  static async getClipVideoUrl(projectId: string, clipId: string): Promise<string> {
    try {
      const clip = await this.getClipDetails(projectId, clipId)
      
      if (!clip.videoUrl) {
        throw new Error(`Clip ${clipId} has no video URL`)
      }
      
      return clip.videoUrl
    } catch (error) {
      logger.error('[Submagic] Failed to get clip video URL', {
        action: 'get_clip_video_url_failed',
        metadata: { 
          projectId,
          clipId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }

  /**
   * High-level orchestrator for the entire Submagic video processing flow
   */
  static async processVideo(
    videoUrl: string,
    title: string,
    options: Partial<CreateProjectRequest> = {}
  ): Promise<{ clips: SubmagicClip[]; projectId: string }> {
    logger.info('[Submagic] Starting video processing', {
      action: 'process_video',
      metadata: { title, videoUrl }
    })

    try {
      // Step 1: Create project
      const project = await this.createProject({
        title,
        videoUrl,
        language: options.language || 'en',
        generateClips: true,
        maxClips: options.maxClips || 10,
        clipDuration: options.clipDuration || 30,
        autoCaption: options.autoCaption !== false,
        ...options
      })
      
      // Step 2: Poll until ready
      const completedProject = await this.pollProjectUntilReady(project.id)
      
      // Step 3: Get clips with retry logic
      let clips: SubmagicClip[] = []
      let retryCount = 0
      const maxRetries = 10
      
      while (retryCount < maxRetries) {
        try {
          clips = await this.getProjectClips(completedProject.id)
          if (clips && clips.length > 0) {
            break
          }
        } catch (error) {
          logger.warn(`[Submagic] Error fetching clips (attempt ${retryCount + 1}/${maxRetries})`, {
            action: 'fetch_clips_retry',
            metadata: { 
              projectId: completedProject.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 15000))
        }
      }
      
      if (clips.length === 0) {
        logger.warn('[Submagic] No clips generated', {
          action: 'no_clips_generated',
          metadata: { projectId: completedProject.id }
        })
      }
      
      logger.info('[Submagic] Video processing complete', {
        action: 'process_video_complete',
        metadata: { 
          projectId: completedProject.id,
          clipCount: clips.length
        }
      })
      
      return { clips, projectId: completedProject.id }
    } catch (error) {
      logger.error('[Submagic] Video processing failed', {
        action: 'process_video_failed',
        metadata: { 
          title,
          videoUrl,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      await this.request(`/projects/${projectId}`, {
        method: 'DELETE'
      })
      
      logger.info('[Submagic] Project deleted', {
        action: 'delete_project',
        metadata: { projectId }
      })
    } catch (error) {
      logger.error('[Submagic] Failed to delete project', {
        action: 'delete_project_failed',
        metadata: { 
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }
}

