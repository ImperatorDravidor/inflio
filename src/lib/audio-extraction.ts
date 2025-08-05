// Audio extraction utilities for large video files
// This allows us to use Whisper API with videos larger than 25MB

export class AudioExtractor {
  /**
   * Extract audio from video URL and convert to a format suitable for Whisper
   * This is a client-side placeholder - in production, use server-side FFmpeg
   */
  static async extractAudioFromVideo(videoBlob: Blob): Promise<Blob> {
    // For now, we'll document the approach
    // In production, you'd use:
    // 1. FFmpeg.wasm for client-side extraction
    // 2. Server-side FFmpeg for better performance
    // 3. Cloud function with FFmpeg for scalability
    
    console.warn('Audio extraction not yet implemented. Options:')
    console.log('1. Use FFmpeg.wasm for client-side extraction')
    console.log('2. Create an API endpoint with server-side FFmpeg')
    console.log('3. Use a cloud service like AWS MediaConvert')
    
    // Return original blob for now
    return videoBlob
  }

  /**
   * Estimate audio size from video
   * Audio is typically 10-15% of video file size
   */
  static estimateAudioSize(videoSize: number): number {
    return Math.round(videoSize * 0.15) // 15% estimate
  }

  /**
   * Check if video needs audio extraction for Whisper
   */
  static needsAudioExtraction(videoSize: number): boolean {
    const WHISPER_LIMIT = 25 * 1024 * 1024 // 25MB
    const estimatedAudioSize = this.estimateAudioSize(videoSize)
    
    // If estimated audio size is under limit, we can extract
    // If video is under limit, no extraction needed
    return videoSize > WHISPER_LIMIT && estimatedAudioSize < WHISPER_LIMIT
  }

  /**
   * Get recommended approach based on file size
   */
  static getProcessingRecommendation(videoSizeMB: number): {
    method: 'direct' | 'extract' | 'klap'
    reason: string
  } {
    if (videoSizeMB < 25) {
      return {
        method: 'direct',
        reason: 'Video is small enough for direct Whisper processing'
      }
    } else if (videoSizeMB < 167) { // 25MB / 0.15 ≈ 167MB
      return {
        method: 'extract',
        reason: 'Extract audio to reduce size for Whisper (audio ~15% of video)'
      }
    } else {
      return {
        method: 'klap',
        reason: 'Video too large even with audio extraction, use Klap API'
      }
    }
  }
}

// FFmpeg audio extraction - placeholder for future implementation
// To implement: install @ffmpeg/ffmpeg and uncomment the implementation
// Currently using browser-based audio extraction instead 
