import { TranscriptionData } from './project-types'

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
