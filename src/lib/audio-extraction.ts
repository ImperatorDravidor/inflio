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

// Example implementation with FFmpeg.wasm (for future reference)
export async function extractAudioWithFFmpeg(videoBlob: Blob): Promise<Blob> {
  // Installation: npm install @ffmpeg/ffmpeg @ffmpeg/util
  /*
  import { FFmpeg } from '@ffmpeg/ffmpeg'
  import { fetchFile } from '@ffmpeg/util'
  
  const ffmpeg = new FFmpeg()
  await ffmpeg.load()
  
  // Write video to FFmpeg filesystem
  const videoData = await fetchFile(videoBlob)
  await ffmpeg.writeFile('input.mp4', videoData)
  
  // Extract audio as MP3 (smaller than WAV)
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-vn', // No video
    '-acodec', 'mp3',
    '-ab', '128k', // Bitrate
    '-ar', '16000', // Sample rate (Whisper works well with 16kHz)
    'output.mp3'
  ])
  
  // Read the output
  const audioData = await ffmpeg.readFile('output.mp3')
  return new Blob([audioData], { type: 'audio/mp3' })
  */
  
  throw new Error('FFmpeg audio extraction not implemented. Install @ffmpeg/ffmpeg to enable.')
}

// Server-side audio extraction endpoint (for future reference)
export async function createAudioExtractionEndpoint() {
  /*
  // In /api/extract-audio/route.ts
  export async function POST(request: NextRequest) {
    const { videoUrl } = await request.json()
    
    // Use server-side FFmpeg
    const command = `ffmpeg -i "${videoUrl}" -vn -acodec mp3 -ab 128k -ar 16000 -f mp3 -`
    
    // Execute and return audio stream
    // This would use child_process or a cloud service
  }
  */
} 
