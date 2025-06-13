// Klap API Service for processing videos into short clips
// Based on API documentation at https://api.klap.app/v2

interface KlapTaskOptions {
  source_video_url: string
  language?: string
  max_duration?: number
  max_clip_count?: number
  editing_options?: {
    intro_title?: boolean
    captions?: boolean
    reframe?: boolean
    detect_speakers?: boolean
  }
}

interface KlapTask {
  id: string
  type: string
  status: 'processing' | 'ready' | 'error'
  created_at: string
  output_type: string
  output_id: string
}

interface KlapProject {
  id: string
  author_id: string
  folder_id: string
  name: string
  created_at: string
  virality_score: number
  virality_score_explanation: string
}

interface KlapExport {
  id: string
  status: 'processing' | 'ready' | 'error'
  src_url: string | null
  project_id: string
  created_at: string
  finished_at: string | null
  name: string
  author_id: string
  folder_id: string
  descriptions: string
}

interface WatermarkOptions {
  src_url?: string
  pos_x?: number
  pos_y?: number
  scale?: number
}

export class KlapAPIService {
  private static readonly BASE_URL = 'https://api.klap.app/v2'
  private static readonly API_KEY = process.env.KLAP_API_KEY
  private static readonly POLL_INTERVAL = 30000 // 30 seconds
  private static readonly EXPORT_POLL_INTERVAL = 15000 // 15 seconds

  // Helper method for making authenticated requests
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.API_KEY) {
      throw new Error('KLAP_API_KEY is not configured in environment variables')
    }

    const url = `${this.BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`Klap API error: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  // Create a video-to-shorts task
  static async createVideoToShortsTask(options: KlapTaskOptions): Promise<KlapTask> {
    return this.request<KlapTask>('/tasks/video-to-shorts', {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  // Get task status
  static async getTaskStatus(taskId: string): Promise<KlapTask> {
    return this.request<KlapTask>(`/tasks/${taskId}`)
  }

  // Poll task until completion
  static async pollTaskUntilComplete(
    taskId: string,
    onProgress?: (status: string) => void
  ): Promise<KlapTask> {
    let task: KlapTask
    
    do {
      task = await this.getTaskStatus(taskId)
      
      if (onProgress) {
        onProgress(task.status)
      }

      if (task.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL))
      }
    } while (task.status === 'processing')

    if (task.status === 'error') {
      throw new Error('Klap task processing failed')
    }

    return task
  }

  // Get all projects in a folder
  static async getProjects(folderId: string): Promise<KlapProject[]> {
    return this.request<KlapProject[]>(`/projects/${folderId}`)
  }

  // Get a single project
  static async getProject(projectId: string): Promise<KlapProject> {
    return this.request<KlapProject>(`/projects/${projectId}`)
  }

  // Create an export for a project
  static async createExport(
    folderId: string,
    projectId: string,
    watermark?: WatermarkOptions
  ): Promise<KlapExport> {
    return this.request<KlapExport>(`/projects/${folderId}/${projectId}/exports`, {
      method: 'POST',
      body: JSON.stringify({ watermark }),
    })
  }

  // Get export status
  static async getExportStatus(
    folderId: string,
    projectId: string,
    exportId: string
  ): Promise<KlapExport> {
    return this.request<KlapExport>(`/projects/${folderId}/${projectId}/exports/${exportId}`)
  }

  // Poll export until completion
  static async pollExportUntilComplete(
    folderId: string,
    projectId: string,
    exportId: string,
    onProgress?: (status: string) => void
  ): Promise<KlapExport> {
    let exportData: KlapExport
    
    do {
      exportData = await this.getExportStatus(folderId, projectId, exportId)
      
      if (onProgress) {
        onProgress(exportData.status)
      }

      if (exportData.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, this.EXPORT_POLL_INTERVAL))
      }
    } while (exportData.status === 'processing')

    if (exportData.status === 'error') {
      throw new Error('Klap export failed')
    }

    return exportData
  }

  // High-level method to process a video and get all clips
  static async processVideoToClips(
    videoUrl: string,
    options: {
      language?: string
      maxDuration?: number
      maxClipCount?: number
      onProgress?: (message: string) => void
    } = {}
  ): Promise<{
    clips: Array<{
      id: string
      name: string
      viralityScore: number
      previewUrl: string
    }>
    folderId: string
  }> {
    const { language = 'en', maxDuration = 60, maxClipCount = 5, onProgress } = options

    // Step 1: Create task
    if (onProgress) onProgress('Creating video processing task...')
    const task = await this.createVideoToShortsTask({
      source_video_url: videoUrl,
      language,
      max_duration: maxDuration,
      max_clip_count: maxClipCount,
      editing_options: {
        intro_title: false,
        captions: true,
        reframe: true,
        detect_speakers: true,
      },
    })

    // Step 2: Poll until complete
    if (onProgress) onProgress('Processing video...')
    const completedTask = await this.pollTaskUntilComplete(task.id, (status) => {
      if (onProgress) onProgress(`Processing video (status: ${status})...`)
    })

    // Step 3: Get generated projects
    if (onProgress) onProgress('Retrieving generated clips...')
    const projects = await this.getProjects(completedTask.output_id)

    // Step 4: Format and return clips
    const clips = projects
      .sort((a, b) => b.virality_score - a.virality_score) // Sort by virality score
      .map(project => ({
        id: project.id,
        name: project.name,
        viralityScore: project.virality_score,
        previewUrl: `https://klap.app/player/${project.id}`,
      }))

    return {
      clips,
      folderId: completedTask.output_id,
    }
  }

  // Export a specific clip
  static async exportClip(
    folderId: string,
    projectId: string,
    watermark?: WatermarkOptions,
    onProgress?: (message: string) => void
  ): Promise<string> {
    // Step 1: Create export
    if (onProgress) onProgress('Starting clip export...')
    const exportTask = await this.createExport(folderId, projectId, watermark)

    // Step 2: Poll until complete
    if (onProgress) onProgress('Exporting clip...')
    const completedExport = await this.pollExportUntilComplete(
      folderId,
      projectId,
      exportTask.id,
      (status) => {
        if (onProgress) onProgress(`Exporting clip (status: ${status})...`)
      }
    )

    if (!completedExport.src_url) {
      throw new Error('Export completed but no URL was provided')
    }

    return completedExport.src_url
  }

  // Batch export multiple clips
  static async exportMultipleClips(
    folderId: string,
    projectIds: string[],
    watermark?: WatermarkOptions,
    onProgress?: (message: string, index: number, total: number) => void
  ): Promise<Array<{ projectId: string; url: string }>> {
    const results: Array<{ projectId: string; url: string }> = []

    for (let i = 0; i < projectIds.length; i++) {
      const projectId = projectIds[i]
      
      try {
        if (onProgress) {
          onProgress(`Exporting clip ${i + 1} of ${projectIds.length}`, i, projectIds.length)
        }

        const url = await this.exportClip(folderId, projectId, watermark)
        results.push({ projectId, url })
      } catch (error) {
        console.error(`Failed to export clip ${projectId}:`, error)
        // Continue with other exports even if one fails
      }
    }

    return results
  }
} 