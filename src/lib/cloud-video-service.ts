import { TranscriptionService } from './transcription-service'
import { supabaseAdmin } from './supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import { v2 as cloudinary } from 'cloudinary'

export interface SubtitleSettings {
  fontFamily: string
  fontSize: number
  fontColor: string
  backgroundColor: string
  position: 'top' | 'center' | 'bottom'
  alignment: 'left' | 'center' | 'right'
  opacity: number
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface ApplySubtitlesResult {
  taskId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  videoUrl?: string
  vttUrl?: string
  provider: string
  error?: string
}

export interface VideoProcessingTask {
  id: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  inputVideoUrl: string
  outputVideoUrl?: string
  vttUrl?: string
  startedAt: string
  completedAt?: string
  error?: string
  provider: string
}

type VideoProvider = 'cloudinary' | 'mux' | 'shotstack' | 'fallback'

// Store active processing tasks in memory
const activeTasks = new Map<string, VideoProcessingTask>()

export class CloudVideoService {
  private provider: VideoProvider
  
  constructor() {
    this.provider = this.detectProvider()
    
    // Configure Cloudinary if it's the selected provider
    if (this.provider === 'cloudinary' && process.env.CLOUDINARY_URL) {
      const urlParts = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/)
      if (urlParts) {
        cloudinary.config({
          cloud_name: urlParts[3],
          api_key: urlParts[1],
          api_secret: urlParts[2],
          secure: true
        })
      }
    }
  }
  
  private detectProvider(): VideoProvider {
    if (process.env.CLOUDINARY_URL) return 'cloudinary'
    if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) return 'mux'
    if (process.env.SHOTSTACK_API_KEY) return 'shotstack'
    return 'fallback'
  }
  
  async applySubtitles(videoUrl: string, segments: TranscriptSegment[], projectId?: string, settings?: SubtitleSettings): Promise<ApplySubtitlesResult> {
    const taskId = uuidv4()
    
    // Store task for progress tracking
    if (projectId) {
      const task: VideoProcessingTask = {
        id: taskId,
        projectId,
        status: 'processing',
        progress: 0,
        inputVideoUrl: videoUrl,
        startedAt: new Date().toISOString(),
        provider: this.provider
      }
      activeTasks.set(taskId, task)
    }
    
    try {
      switch (this.provider) {
        case 'cloudinary':
          return await this.applySubtitlesCloudinary(videoUrl, segments, taskId, settings)
        case 'mux':
          return await this.applySubtitlesMux(videoUrl, segments, taskId)
        case 'shotstack':
          return await this.applySubtitlesShotstack(videoUrl, segments, taskId)
        default:
          return await this.applySubtitlesFallback(videoUrl, segments, taskId, projectId)
      }
    } catch (error) {
      console.error('Error applying subtitles:', error)
      const task = activeTasks.get(taskId)
      if (task) {
        task.status = 'failed'
        task.error = error instanceof Error ? error.message : 'Unknown error'
      }
      throw error
    }
  }
  
  private async applySubtitlesCloudinary(videoUrl: string, segments: TranscriptSegment[], taskId: string, settings?: SubtitleSettings): Promise<ApplySubtitlesResult> {
    try {
      // Upload the video to Cloudinary first
      const uploadResult = await cloudinary.uploader.upload(videoUrl, {
        resource_type: 'video',
        public_id: `subtitled_${taskId}`,
        folder: 'inflio/subtitled',
      })
      
      // Generate SRT content
      const srtContent = this.generateSRT(segments)
      
      // Upload SRT file
      const srtUpload = await cloudinary.uploader.upload(
        `data:text/plain;base64,${Buffer.from(srtContent).toString('base64')}`,
        {
          resource_type: 'raw',
          public_id: `subtitle_${taskId}`,
          folder: 'inflio/subtitles',
          format: 'srt'
        }
      )
      
      // Generate video URL with subtitle overlay
      const processedUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: 'video',
        transformation: [
          {
            overlay: {
              resource_type: 'subtitles',
              public_id: srtUpload.public_id
            },
            gravity: settings?.position === 'top' ? 'north' : settings?.position === 'bottom' ? 'south' : 'center',
            color: settings?.fontColor?.replace('#', '') || 'ffffff',
            font_family: settings?.fontFamily?.replace(' ', '_') || 'Arial',
            font_size: settings?.fontSize || 24
          },
          {
            flags: 'layer_apply'
          }
        ]
      })
      
      // Update task status
      const task = activeTasks.get(taskId)
      if (task) {
        task.status = 'completed'
        task.progress = 100
        task.outputVideoUrl = processedUrl
        task.completedAt = new Date().toISOString()
      }
      
      return {
        taskId,
        status: 'completed',
        progress: 100,
        videoUrl: processedUrl,
        provider: 'cloudinary'
      }
    } catch (error) {
      console.error('Cloudinary processing error:', error)
      throw error
    }
  }
  
  private async applySubtitlesMux(videoUrl: string, segments: TranscriptSegment[], taskId: string): Promise<ApplySubtitlesResult> {
    // Mux implementation placeholder
    return {
      taskId,
      status: 'failed',
      progress: 0,
      provider: 'mux',
      error: 'Mux integration not yet implemented'
    }
  }
  
  private async applySubtitlesShotstack(videoUrl: string, segments: TranscriptSegment[], taskId: string): Promise<ApplySubtitlesResult> {
    // Shotstack implementation placeholder
    return {
      taskId,
      status: 'failed',
      progress: 0,
      provider: 'shotstack',
      error: 'Shotstack integration not yet implemented'
    }
  }
  
  private async applySubtitlesFallback(videoUrl: string, segments: TranscriptSegment[], taskId: string, projectId?: string): Promise<ApplySubtitlesResult> {
    try {
      // Generate VTT content
      const vttContent = this.generateVTT(segments)
      
      // Upload VTT file to Supabase
      const fileName = `${taskId}.vtt`
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('project-files')
        .upload(`subtitles/${fileName}`, new Blob([vttContent], { type: 'text/vtt' }), {
          contentType: 'text/vtt',
          upsert: true
        })
        
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('project-files')
        .getPublicUrl(`subtitles/${fileName}`)
        
      // Update task status
      const task = activeTasks.get(taskId)
      if (task) {
        task.status = 'completed'
        task.progress = 100
        task.vttUrl = publicUrl
        task.completedAt = new Date().toISOString()
      }
        
      return {
        taskId,
        status: 'completed',
        progress: 100,
        vttUrl: publicUrl,
        provider: 'fallback'
      }
    } catch (error) {
      console.error('Fallback processing error:', error)
      throw error
    }
  }
  
  private generateSRT(segments: TranscriptSegment[]): string {
    return segments.map((segment, index) => {
      const startTime = this.formatSRTTime(segment.start)
      const endTime = this.formatSRTTime(segment.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')
  }
  
  private generateVTT(segments: TranscriptSegment[]): string {
    const vttSegments = segments.map(segment => {
      const startTime = this.formatVTTTime(segment.start)
      const endTime = this.formatVTTTime(segment.end)
      return `${startTime} --> ${endTime}\n${segment.text}`
    }).join('\n\n')
    
    return `WEBVTT\n\n${vttSegments}`
  }
  
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const millis = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`
  }
  
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const millis = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
  }
  
  static getTaskStatus(taskId: string): VideoProcessingTask | undefined {
    return activeTasks.get(taskId)
  }
  
  static getActiveProvider(): VideoProvider {
    if (process.env.CLOUDINARY_URL) return 'cloudinary'
    if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) return 'mux'
    if (process.env.SHOTSTACK_API_KEY) return 'shotstack'
    return 'fallback'
  }
} 