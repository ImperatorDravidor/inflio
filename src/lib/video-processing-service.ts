import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { TranscriptionService } from './transcription-service'
import { supabaseAdmin } from './supabase/admin'

const execAsync = promisify(exec)

export interface VideoProcessingTask {
  id: string
  projectId: string
  status: 'pending' | 'downloading' | 'processing' | 'uploading' | 'completed' | 'failed'
  progress: number
  inputVideoUrl: string
  outputVideoUrl?: string
  error?: string
  startedAt: string
  completedAt?: string
  tempDir?: string
}

export interface SubtitleSettings {
  fontSize: number
  fontFamily: string
  fontColor: string
  backgroundColor: string
  position: 'bottom' | 'center' | 'top'
  alignment: 'left' | 'center' | 'right'
  maxWordsPerLine: number
}

// Store active tasks in memory with TTL (in production, use Redis or database)
const activeTasks = new Map<string, VideoProcessingTask>()
const TASK_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Cleanup stale tasks periodically
if (typeof global !== 'undefined' && !(global as any).videoProcessingCleanupInterval) {
  (global as any).videoProcessingCleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [taskId, task] of activeTasks.entries()) {
      const taskAge = now - new Date(task.startedAt).getTime()
      if (taskAge > TASK_TTL) {
        console.log(`Cleaning up stale task: ${taskId}`)
        activeTasks.delete(taskId)
      }
    }
  }, 60 * 60 * 1000) // Run every hour
}

export class VideoProcessingService {
  private static readonly TEMP_DIR = process.env.VIDEO_TEMP_DIR || '/tmp/video-processing'
  private static readonly FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg'
  private static readonly FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe'

  /**
   * Initialize temp directory
   */
  static async init() {
    if (!existsSync(this.TEMP_DIR)) {
      await mkdir(this.TEMP_DIR, { recursive: true })
    }
  }

  /**
   * Apply subtitles to video
   */
  static async applySubtitlesToVideo(
    projectId: string,
    videoUrl: string,
    segments: any[],
    settings: SubtitleSettings
  ): Promise<string> {
    const taskId = `subtitle_${projectId}_${Date.now()}`
    const task: VideoProcessingTask = {
      id: taskId,
      projectId,
      status: 'pending',
      progress: 0,
      inputVideoUrl: videoUrl,
      startedAt: new Date().toISOString()
    }

    // Store task
    activeTasks.set(taskId, task)

    // Process in background (in production, use a job queue)
    this.processVideoWithSubtitles(task, segments, settings).catch(error => {
      console.error('Video processing error:', error)
      task.status = 'failed'
      task.error = error.message
    })

    return taskId
  }

  /**
   * Get task status
   */
  static getTaskStatus(taskId: string): VideoProcessingTask | null {
    return activeTasks.get(taskId) || null
  }

  /**
   * Process video with subtitles
   */
  private static async processVideoWithSubtitles(
    task: VideoProcessingTask,
    segments: any[],
    settings: SubtitleSettings
  ) {
    try {
      // Initialize temp directory
      await this.init()

      // Create task-specific temp directory
      const tempDir = path.join(this.TEMP_DIR, task.id)
      await mkdir(tempDir, { recursive: true })
      task.tempDir = tempDir

      // Update status
      task.status = 'downloading'
      task.progress = 10

      // Download video from Supabase
      const inputPath = path.join(tempDir, 'input.mp4')
      await this.downloadVideo(task.inputVideoUrl, inputPath)
      
      task.status = 'processing'
      task.progress = 30

      // Create subtitle file
      const subtitlePath = path.join(tempDir, 'subtitles.srt')
      const subtitleContent = TranscriptionService.formatSubtitles(segments, 'srt')
      await writeFile(subtitlePath, subtitleContent, 'utf8')

      task.progress = 40

      // Generate styled subtitles using FFmpeg
      const outputPath = path.join(tempDir, 'output.mp4')
      await this.burnSubtitles(inputPath, subtitlePath, outputPath, settings, (progress) => {
        task.progress = 40 + Math.round(progress * 0.5) // 40-90%
      })

      task.status = 'uploading'
      task.progress = 90

      // Upload to Supabase storage
      const outputUrl = await this.uploadProcessedVideo(outputPath, task.projectId)
      task.outputVideoUrl = outputUrl

      task.status = 'completed'
      task.progress = 100
      task.completedAt = new Date().toISOString()

      // Cleanup temp files
      await this.cleanup(tempDir)

    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown error'
      
      // Always try to cleanup temp files on error
      try {
        await this.cleanup(tempDir)
      } catch (cleanupError) {
        console.error('Failed to cleanup temp files after error:', cleanupError)
      }
      
      throw error
    } finally {
      // Clean up task from memory to prevent memory leak
      activeTasks.delete(task.id)
    }
  }

  /**
   * Download video from URL
   */
  private static async downloadVideo(url: string, outputPath: string) {
    // If it's a Supabase URL, download directly
    if (url.includes('supabase')) {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to download video')
      
      const buffer = await response.arrayBuffer()
      await writeFile(outputPath, Buffer.from(buffer))
    } else {
      // Use curl or wget for other URLs
      await execAsync(`curl -L -o "${outputPath}" "${url}"`)
    }
  }

  /**
   * Burn subtitles into video using FFmpeg
   */
  private static async burnSubtitles(
    inputPath: string,
    subtitlePath: string,
    outputPath: string,
    settings: SubtitleSettings,
    onProgress?: (progress: number) => void
  ) {
    // Get video duration for progress tracking
    const duration = await this.getVideoDuration(inputPath)

    // Build FFmpeg filter for subtitles
    const subtitleFilter = this.buildSubtitleFilter(subtitlePath, settings)

    // FFmpeg command with progress tracking
    const ffmpegCmd = `${this.FFMPEG_PATH} -i "${inputPath}" -vf "${subtitleFilter}" -c:a copy -progress pipe:1 "${outputPath}"`

    return new Promise<void>((resolve, reject) => {
      const ffmpeg = exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('FFmpeg error:', stderr)
          reject(new Error(`FFmpeg failed: ${error.message}`))
        } else {
          resolve()
        }
      })

      // Parse progress from FFmpeg
      let progressData = ''
      ffmpeg.stdout?.on('data', (data) => {
        progressData += data.toString()
        
        // Parse time from progress
        const timeMatch = progressData.match(/out_time_ms=(\d+)/)
        if (timeMatch && duration > 0) {
          const currentTimeMs = parseInt(timeMatch[1])
          const progress = Math.min(currentTimeMs / (duration * 1000000), 1)
          onProgress?.(progress)
        }
      })
    })
  }

  /**
   * Build FFmpeg subtitle filter
   */
  private static buildSubtitleFilter(subtitlePath: string, settings: SubtitleSettings): string {
    // Convert settings to FFmpeg subtitle filter format
    const { fontSize, fontFamily, fontColor, backgroundColor, position, alignment } = settings

    // Position mapping for FFmpeg
    const marginV = position === 'top' ? 50 : position === 'center' ? 150 : 30

    // Alignment mapping
    const alignmentMap = {
      'left': 1,
      'center': 2,
      'right': 3
    }

    // Build style overrides
    const styleOverrides = [
      `FontSize=${fontSize}`,
      `FontName='${fontFamily}'`,
      `PrimaryColour=${this.hexToASSColor(fontColor)}`,
      `BackColour=${this.hexToASSColor(backgroundColor)}`,
      `BorderStyle=1`,
      `Outline=2`,
      `Shadow=0`,
      `Alignment=${alignmentMap[alignment]}`,
      `MarginV=${marginV}`
    ].join(',')

    // Escape path for FFmpeg
    const escapedPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:')

    return `subtitles='${escapedPath}':force_style='${styleOverrides}'`
  }

  /**
   * Convert hex color to ASS format
   */
  private static hexToASSColor(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Convert to BGR format with alpha
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // ASS uses &H + alpha + blue + green + red in hex
    return `&H00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`
  }

  /**
   * Get video duration using FFprobe
   */
  private static async getVideoDuration(videoPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `${this.FFPROBE_PATH} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
      )
      return parseFloat(stdout.trim())
    } catch (error) {
      console.error('FFprobe error:', error)
      return 0
    }
  }

  /**
   * Upload processed video to Supabase
   */
  private static async uploadProcessedVideo(videoPath: string, projectId: string): Promise<string> {
    const fileName = `${projectId}/subtitled_${Date.now()}.mp4`
    const fileBuffer = await import('fs').then(fs => fs.promises.readFile(videoPath))

    const { data, error } = await supabaseAdmin.storage
      .from('videos')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('videos')
      .getPublicUrl(fileName)

    return publicUrl
  }

  /**
   * Cleanup temporary files
   */
  private static async cleanup(tempDir: string) {
    try {
      const files = await import('fs').then(fs => fs.promises.readdir(tempDir))
      for (const file of files) {
        await unlink(path.join(tempDir, file))
      }
      await import('fs').then(fs => fs.promises.rmdir(tempDir))
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  /**
   * Check if FFmpeg is available
   */
  static async checkFFmpegAvailable(): Promise<boolean> {
    try {
      await execAsync(`${this.FFMPEG_PATH} -version`)
      return true
    } catch {
      return false
    }
  }
} 