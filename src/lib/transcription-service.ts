import OpenAI from 'openai'
import { TranscriptionData } from './project-types'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface WhisperSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface WhisperResponse {
  task: string
  language: string
  duration: number
  text: string
  segments: WhisperSegment[]
}

export class TranscriptionService {
  /**
   * Transcribe audio/video file using OpenAI Whisper API
   * @param file - The audio/video file to transcribe
   * @param options - Transcription options
   * @returns Transcription data with timestamps
   */
  static async transcribeFile(
    file: File | Blob,
    options: {
      language?: string
      prompt?: string
      temperature?: number
      onProgress?: (message: string) => void
    } = {}
  ): Promise<TranscriptionData> {
    const { language, prompt, temperature = 0, onProgress } = options

    try {
      if (onProgress) onProgress('Preparing file for transcription...')

      // Check file size (Whisper API has a 25MB limit)
      const maxSize = 25 * 1024 * 1024 // 25MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 25MB limit. Please use a smaller file or compress the audio.')
      }

      if (onProgress) onProgress('Sending to Whisper API...')

      // Create form data for the API request
      const formData = new FormData()
      formData.append('file', file)
      formData.append('model', 'whisper-1')
      formData.append('response_format', 'verbose_json') // This gives us timestamps
      formData.append('timestamp_granularities[]', 'segment')
      
      if (language) {
        formData.append('language', language)
      }
      
      if (prompt) {
        formData.append('prompt', prompt)
      }
      
      if (temperature !== undefined) {
        formData.append('temperature', temperature.toString())
      }

      // Make the API request
      const response = await openai.audio.transcriptions.create({
        file: file as File,
        model: 'whisper-1',
        response_format: 'verbose_json',
        language: language,
        prompt: prompt,
        temperature: temperature,
      })

      if (onProgress) onProgress('Processing transcription results...')

      // Cast response to our expected format
      const whisperResponse = response as unknown as WhisperResponse

      // Convert Whisper segments to our format
      const segments = whisperResponse.segments.map((segment, index) => ({
        id: index.toString(),
        text: segment.text.trim(),
        start: segment.start,
        end: segment.end,
        confidence: 1 - segment.no_speech_prob, // Convert no_speech probability to confidence
      }))

      // Create the transcription data object
      const transcriptionData: TranscriptionData = {
        text: whisperResponse.text,
        segments,
        language: whisperResponse.language || language || 'en',
        duration: whisperResponse.duration,
      }

      if (onProgress) onProgress('Transcription completed!')

      return transcriptionData
    } catch (error) {
      console.error('Transcription error:', error)
      if (error instanceof Error) {
        throw new Error(`Transcription failed: ${error.message}`)
      }
      throw new Error('Transcription failed: Unknown error')
    }
  }

  /**
   * Transcribe from a video URL by first downloading it
   * @param videoUrl - URL of the video to transcribe
   * @param options - Transcription options
   * @returns Transcription data with timestamps
   */
  static async transcribeFromUrl(
    videoUrl: string,
    options: {
      language?: string
      prompt?: string
      temperature?: number
      onProgress?: (message: string) => void
    } = {}
  ): Promise<TranscriptionData> {
    const { onProgress } = options

    try {
      if (onProgress) onProgress('Downloading video for transcription...')

      // Download the video
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }

      const blob = await response.blob()
      
      // Check if we need to extract audio (Whisper works better with audio-only files)
      // For now, we'll send the video directly as Whisper can handle it
      
      if (onProgress) onProgress('Video downloaded, starting transcription...')

      // Transcribe the file
      return await this.transcribeFile(blob, options)
    } catch (error) {
      console.error('URL transcription error:', error)
      if (error instanceof Error) {
        throw new Error(`URL transcription failed: ${error.message}`)
      }
      throw new Error('URL transcription failed: Unknown error')
    }
  }

  /**
   * Format segments for subtitle files (SRT/VTT)
   * @param segments - Array of transcription segments
   * @param format - Output format ('srt' or 'vtt')
   * @returns Formatted subtitle string
   */
  static formatSubtitles(
    segments: TranscriptionData['segments'],
    format: 'srt' | 'vtt' = 'srt'
  ): string {
    if (format === 'vtt') {
      let vtt = 'WEBVTT\n\n'
      segments.forEach((segment, index) => {
        const startTime = this.formatTimestamp(segment.start, 'vtt')
        const endTime = this.formatTimestamp(segment.end, 'vtt')
        vtt += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`
      })
      return vtt
    } else {
      // SRT format
      let srt = ''
      segments.forEach((segment, index) => {
        const startTime = this.formatTimestamp(segment.start, 'srt')
        const endTime = this.formatTimestamp(segment.end, 'srt')
        srt += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`
      })
      return srt
    }
  }

  /**
   * Format timestamp for subtitle formats
   * @param seconds - Time in seconds
   * @param format - Output format ('srt' or 'vtt')
   * @returns Formatted timestamp
   */
  private static formatTimestamp(seconds: number, format: 'srt' | 'vtt'): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    const pad = (n: number, digits = 2) => n.toString().padStart(digits, '0')
    
    if (format === 'vtt') {
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`
    } else {
      // SRT uses comma instead of period for milliseconds
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`
    }
  }

  /**
   * Search for text within transcription segments
   * @param segments - Array of transcription segments
   * @param query - Search query
   * @returns Matching segments with timestamps
   */
  static searchTranscription(
    segments: TranscriptionData['segments'],
    query: string
  ): Array<TranscriptionData['segments'][0] & { matchedText: string }> {
    const lowerQuery = query.toLowerCase()
    return segments
      .filter(segment => segment.text.toLowerCase().includes(lowerQuery))
      .map(segment => ({
        ...segment,
        matchedText: segment.text,
      }))
  }

  /**
   * Get segment at specific timestamp
   * @param segments - Array of transcription segments
   * @param timestamp - Time in seconds
   * @returns The segment at the given timestamp, or null
   */
  static getSegmentAtTime(
    segments: TranscriptionData['segments'],
    timestamp: number
  ): TranscriptionData['segments'][0] | null {
    return segments.find(
      segment => timestamp >= segment.start && timestamp <= segment.end
    ) || null
  }

  /**
   * Split long segments into smaller chunks
   * @param segments - Array of transcription segments
   * @param maxLength - Maximum length of each chunk in characters
   * @returns Array of split segments
   */
  static splitLongSegments(
    segments: TranscriptionData['segments'],
    maxLength: number = 100
  ): TranscriptionData['segments'] {
    const result: TranscriptionData['segments'] = []

    segments.forEach(segment => {
      if (segment.text.length <= maxLength) {
        result.push(segment)
      } else {
        // Split by sentences first, then by max length if needed
        const sentences = segment.text.match(/[^.!?]+[.!?]+/g) || [segment.text]
        const duration = segment.end - segment.start
        const timePerChar = duration / segment.text.length

        let currentStart = segment.start
        let currentText = ''

        sentences.forEach(sentence => {
          if ((currentText + sentence).length > maxLength && currentText) {
            // Push the current chunk
            result.push({
              id: `${segment.id}-${result.length}`,
              text: currentText.trim(),
              start: currentStart,
              end: currentStart + (currentText.length * timePerChar),
              confidence: segment.confidence,
            })
            currentStart += currentText.length * timePerChar
            currentText = sentence
          } else {
            currentText += sentence
          }
        })

        // Push any remaining text
        if (currentText) {
          result.push({
            id: `${segment.id}-${result.length}`,
            text: currentText.trim(),
            start: currentStart,
            end: segment.end,
            confidence: segment.confidence,
          })
        }
      }
    })

    return result
  }
} 