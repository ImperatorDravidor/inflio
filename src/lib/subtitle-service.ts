import { TranscriptionService } from './transcription-service'

export interface SubtitleSettings {
  fontSize: number
  fontFamily: string
  fontColor: string
  backgroundColor: string
  position: 'bottom' | 'center' | 'top'
  alignment: 'left' | 'center' | 'right'
  maxWordsPerLine: number
}

export interface TranscriptionSegment {
  id: string
  text: string
  start: number
  end: number
  confidence: number
}

export interface SubtitleTask {
  id: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startedAt: string
  completedAt?: string
  error?: string
  outputVideoUrl?: string
  settings: SubtitleSettings
  segmentCount: number
}

export class SubtitleService {
  /**
   * Apply subtitles to a video by burning them into the video file
   * @param videoUrl - Source video URL
   * @param segments - Transcription segments with timing
   * @param settings - Subtitle appearance settings
   * @returns Task ID for tracking progress
   */
  static async applySubtitlesToVideo(
    projectId: string,
    videoUrl: string,
    segments: TranscriptionSegment[],
    settings: SubtitleSettings
  ): Promise<string> {
    const taskId = `subtitle_${projectId}_${Date.now()}`
    
    // Create subtitle file
    const subtitleContent = TranscriptionService.formatSubtitles(segments, 'srt')
    
    // In production, this would:
    // 1. Upload subtitle file to temporary storage
    // 2. Queue background job for video processing with FFmpeg
    // 3. Store task info in database for progress tracking
    
    const task: SubtitleTask = {
      id: taskId,
      projectId,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
      settings,
      segmentCount: segments.length
    }
    
    // Store task (in production, use database)
    // For demo, we'll simulate the process
    this.simulateSubtitleProcessing(task, videoUrl, subtitleContent)
    
    return taskId
  }

  /**
   * Get subtitle task status
   * @param taskId - Task identifier
   * @returns Task status and progress
   */
  static async getTaskStatus(taskId: string): Promise<SubtitleTask | null> {
    // In production, retrieve from database
    // For demo, return simulated status
    return {
      id: taskId,
      projectId: taskId.split('_')[1],
      status: 'completed',
      progress: 100,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      outputVideoUrl: '/demo-subtitled-video.mp4',
      settings: {
        fontSize: 24,
        fontFamily: 'Arial',
        fontColor: '#FFFFFF',
        backgroundColor: '#000000',
        position: 'bottom',
        alignment: 'center',
        maxWordsPerLine: 8
      },
      segmentCount: 10
    }
  }

  /**
   * Generate FFmpeg command for burning subtitles
   * @param videoUrl - Input video URL
   * @param subtitlePath - Path to subtitle file
   * @param settings - Subtitle appearance settings
   * @returns FFmpeg command string
   */
  static generateFFmpegCommand(
    videoUrl: string,
    subtitlePath: string,
    settings: SubtitleSettings
  ): string {
    const { fontSize, fontFamily, fontColor, backgroundColor, position, alignment } = settings
    
    // Convert hex colors to FFmpeg format
    const primaryColor = this.hexToFFmpegColor(fontColor)
    const backColor = this.hexToFFmpegColor(backgroundColor)
    
    // Position mapping
    const positionMap = {
      bottom: 'Alignment=2',
      center: 'Alignment=5',
      top: 'Alignment=8'
    }
    
    const alignmentMap = {
      left: 'Alignment=1',
      center: 'Alignment=2', 
      right: 'Alignment=3'
    }
    
    // Build style string
    const style = [
      `FontSize=${fontSize}`,
      `FontName=${fontFamily}`,
      `PrimaryColour=${primaryColor}`,
      `BackColour=${backColor}`,
      positionMap[position],
      'Bold=0',
      'Italic=0',
      'BorderStyle=1',
      'Outline=2',
      'Shadow=0',
      'MarginV=30'
    ].join(',')
    
    return `ffmpeg -i "${videoUrl}" -vf "subtitles=${subtitlePath}:force_style='${style}'" -c:a copy output.mp4`
  }

  /**
   * Process video segments for optimal subtitle display
   * @param segments - Original transcription segments
   * @param maxWordsPerLine - Maximum words per subtitle line
   * @returns Optimized segments for subtitle display
   */
  static optimizeSegmentsForSubtitles(
    segments: TranscriptionSegment[],
    maxWordsPerLine: number = 8
  ): TranscriptionSegment[] {
    return segments.map(segment => {
      const words = segment.text.split(' ')
      
      if (words.length <= maxWordsPerLine) {
        return segment
      }
      
      // Split into multiple lines
      const lines: string[] = []
      let currentLine: string[] = []
      
      words.forEach(word => {
        if (currentLine.length >= maxWordsPerLine) {
          lines.push(currentLine.join(' '))
          currentLine = [word]
        } else {
          currentLine.push(word)
        }
      })
      
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '))
      }
      
      return {
        ...segment,
        text: lines.join('\n')
      }
    })
  }

  /**
   * Validate subtitle settings
   * @param settings - Subtitle settings to validate
   * @returns Validation result
   */
  static validateSettings(settings: SubtitleSettings): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (settings.fontSize < 12 || settings.fontSize > 72) {
      errors.push('Font size must be between 12 and 72')
    }
    
    if (!settings.fontFamily) {
      errors.push('Font family is required')
    }
    
    if (!settings.fontColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push('Invalid font color format')
    }
    
    if (!settings.backgroundColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push('Invalid background color format')
    }
    
    if (settings.maxWordsPerLine < 1 || settings.maxWordsPerLine > 15) {
      errors.push('Max words per line must be between 1 and 15')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Create subtitle preview
   * @param segments - Transcription segments
   * @param settings - Subtitle settings
   * @returns Preview data
   */
  static createSubtitlePreview(
    segments: TranscriptionSegment[],
    settings: SubtitleSettings
  ) {
    const optimizedSegments = this.optimizeSegmentsForSubtitles(segments, settings.maxWordsPerLine)
    const previewSegments = optimizedSegments.slice(0, 3) // Show first 3 segments
    
    return {
      segments: previewSegments,
      style: {
        fontSize: `${settings.fontSize}px`,
        fontFamily: settings.fontFamily,
        color: settings.fontColor,
        backgroundColor: settings.backgroundColor,
        textAlign: settings.alignment,
        position: settings.position
      },
      totalSegments: segments.length,
      estimatedDuration: segments[segments.length - 1]?.end || 0
    }
  }

  /**
   * Simulate subtitle processing for demo
   * @param task - Subtitle task
   * @param videoUrl - Video URL
   * @param subtitleContent - Subtitle content
   */
  private static async simulateSubtitleProcessing(
    task: SubtitleTask,
    videoUrl: string,
    subtitleContent: string
  ) {
    // In production, this would be a background job
    // that processes the video using FFmpeg or similar
    
    setTimeout(() => {
      // Simulate progress updates
      task.status = 'processing'
      task.progress = 25
    }, 1000)
    
    setTimeout(() => {
      task.progress = 50
    }, 2000)
    
    setTimeout(() => {
      task.progress = 75
    }, 3000)
    
    setTimeout(() => {
      task.status = 'completed'
      task.progress = 100
      task.completedAt = new Date().toISOString()
      task.outputVideoUrl = '/demo-subtitled-video.mp4'
    }, 4000)
  }

  /**
   * Convert hex color to FFmpeg color format
   * @param hex - Hex color string
   * @returns FFmpeg color value
   */
  private static hexToFFmpegColor(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Convert to BGR format (FFmpeg uses BGR, not RGB)
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16) 
    const b = parseInt(hex.substr(4, 2), 16)
    
    // FFmpeg color format: &H + alpha(FF) + blue + green + red
    return `&HFF${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`
  }
} 