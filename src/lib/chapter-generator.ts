import { openai } from '@/lib/openai'

export interface VideoChapter {
  id: string
  title: string
  description: string
  timestamp: number // in seconds
  formattedTimestamp: string // HH:MM:SS or MM:SS format
  keywords: string[]
  order: number
}

export interface GeneratedChapters {
  id: string
  projectId: string
  chapters: VideoChapter[]
  totalChapters: number
  videoDuration: number
  createdAt: Date
}

export interface ChapterGenerationOptions {
  minChapterDuration?: number // Minimum duration for a chapter in seconds (default: 30)
  maxChapters?: number // Maximum number of chapters (default: 20)
  includeIntro?: boolean // Whether to include an intro chapter (default: true)
  style?: 'descriptive' | 'concise' | 'engaging' | 'keyword-focused'
  targetPlatform?: 'youtube' | 'vimeo' | 'generic'
}

interface TranscriptSegment {
  text: string
  start: number
  end: number
}

export class ChapterGenerator {
  /**
   * Generate video chapters from transcript
   */
  static async generateChapters(
    transcript: TranscriptSegment[],
    videoDuration: number,
    projectTitle: string,
    options: ChapterGenerationOptions = {}
  ): Promise<GeneratedChapters> {
    const {
      minChapterDuration = 30,
      maxChapters = 20,
      includeIntro = true,
      style = 'engaging',
      targetPlatform = 'youtube'
    } = options

    try {
      // Merge transcript segments into text with timestamps
      const fullTranscript = this.prepareTranscript(transcript)
      
      // Generate chapters using AI
      const systemPrompt = this.buildSystemPrompt(style, targetPlatform)
      const userPrompt = this.buildUserPrompt(
        fullTranscript,
        videoDuration,
        projectTitle,
        minChapterDuration,
        maxChapters,
        includeIntro
      )

      if (!openai) {
        throw new Error('OpenAI client not initialized')
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })

      const response = JSON.parse(completion.choices[0].message.content || '{}')
      
      // Process and validate chapters
      const chapters = this.processChapters(response.chapters || [], videoDuration)

      return {
        id: `chapters_${Date.now()}`,
        projectId: '', // Will be set by the caller
        chapters,
        totalChapters: chapters.length,
        videoDuration,
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Chapter generation error:', error)
      throw new Error('Failed to generate chapters. Please try again.')
    }
  }

  /**
   * Prepare transcript for processing
   */
  private static prepareTranscript(segments: TranscriptSegment[]): string {
    return segments.map(segment => {
      const timestamp = this.formatTimestamp(segment.start)
      return `[${timestamp}] ${segment.text}`
    }).join('\n\n')
  }

  /**
   * Build system prompt for chapter generation
   */
  private static buildSystemPrompt(style: string, platform: string): string {
    const styleGuides = {
      descriptive: 'Use clear, descriptive titles that explain what happens in each section',
      concise: 'Keep titles short and punchy, maximum 5-6 words',
      engaging: 'Create engaging titles that make viewers want to watch each section',
      'keyword-focused': 'Include relevant keywords for SEO while keeping titles natural'
    }

    return `You are an expert video editor specializing in creating compelling chapter markers for ${platform} videos.

Your task is to analyze video transcripts and create well-structured chapters that enhance viewer experience.

Key principles:
- ${styleGuides[style as keyof typeof styleGuides]}
- Ensure chapters flow logically from one to the next
- Identify natural topic transitions and key moments
- Create chapters that help viewers navigate to their interests
- ${platform === 'youtube' ? 'Follow YouTube best practices: first chapter must start at 00:00' : ''}
- Make titles scannable and informative

Always return a JSON object with this structure:
{
  "chapters": [
    {
      "title": "Chapter title",
      "description": "Brief description of what this chapter covers",
      "timestamp": seconds_as_number,
      "keywords": ["relevant", "keywords"]
    }
  ]
}`
  }

  /**
   * Build user prompt with transcript and requirements
   */
  private static buildUserPrompt(
    transcript: string,
    duration: number,
    title: string,
    minDuration: number,
    maxChapters: number,
    includeIntro: boolean
  ): string {
    return `Create video chapters for this content:

Video Title: ${title}
Duration: ${this.formatTimestamp(duration)}

Transcript:
${transcript}

Requirements:
- Maximum ${maxChapters} chapters
- Each chapter should be at least ${minDuration} seconds long
- ${includeIntro ? 'Start with an intro chapter at 00:00' : 'Skip intro, start with main content'}
- Identify major topic changes and key moments
- Create informative titles that help navigation
- Include 2-3 relevant keywords per chapter
- Write brief descriptions (1-2 sentences) explaining what each chapter covers
- Ensure the last chapter extends to the video end

Important: Timestamps must be in seconds (not formatted) and must not exceed ${duration} seconds.`
  }

  /**
   * Process and validate chapters
   */
  private static processChapters(
    rawChapters: any[],
    videoDuration: number
  ): VideoChapter[] {
    const chapters: VideoChapter[] = []
    
    // Sort by timestamp
    const sorted = rawChapters
      .filter(ch => typeof ch.timestamp === 'number' && ch.timestamp >= 0)
      .sort((a, b) => a.timestamp - b.timestamp)

    // Ensure first chapter starts at 0
    if (sorted.length > 0 && sorted[0].timestamp !== 0) {
      sorted.unshift({
        title: 'Introduction',
        description: 'Video introduction and overview',
        timestamp: 0,
        keywords: ['intro', 'introduction', 'overview']
      })
    }

    sorted.forEach((chapter, index) => {
      const timestamp = Math.min(chapter.timestamp, videoDuration)
      
      chapters.push({
        id: `chapter_${index}`,
        title: this.sanitizeTitle(chapter.title || `Chapter ${index + 1}`),
        description: chapter.description || '',
        timestamp,
        formattedTimestamp: this.formatTimestamp(timestamp),
        keywords: Array.isArray(chapter.keywords) ? chapter.keywords : [],
        order: index
      })
    })

    return chapters
  }

  /**
   * Format timestamp to YouTube format
   */
  static formatTimestamp(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Sanitize chapter title
   */
  private static sanitizeTitle(title: string): string {
    // Remove extra whitespace and special characters
    return title
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-–—:,.!?()]/g, '')
      .slice(0, 100) // YouTube has a 100 character limit
  }

  /**
   * Generate YouTube description with chapters
   */
  static generateYouTubeDescription(
    chapters: VideoChapter[],
    videoDescription?: string
  ): string {
    let description = ''

    // Add original description if provided
    if (videoDescription) {
      description += `${videoDescription}\n\n`
    }

    // Add chapters section
    description += 'Chapters:\n'
    chapters.forEach(chapter => {
      description += `${chapter.formattedTimestamp} - ${chapter.title}\n`
    })

    // Add chapter descriptions as a separate section
    if (chapters.some(ch => ch.description)) {
      description += '\nChapter Details:\n'
      chapters.forEach(chapter => {
        if (chapter.description) {
          description += `\n${chapter.title}:\n${chapter.description}\n`
        }
      })
    }

    return description
  }

  /**
   * Validate chapters for platform requirements
   */
  static validateChapters(
    chapters: VideoChapter[],
    platform: 'youtube' | 'vimeo' | 'generic' = 'youtube'
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (chapters.length === 0) {
      errors.push('No chapters provided')
      return { valid: false, errors }
    }

    // Platform-specific validation
    if (platform === 'youtube') {
      // YouTube requires first chapter at 00:00
      if (chapters[0].timestamp !== 0) {
        errors.push('First chapter must start at 00:00 for YouTube')
      }

      // YouTube requires at least 3 chapters
      if (chapters.length < 3) {
        errors.push('YouTube requires at least 3 chapters')
      }

      // Check minimum duration between chapters (10 seconds)
      for (let i = 1; i < chapters.length; i++) {
        const duration = chapters[i].timestamp - chapters[i - 1].timestamp
        if (duration < 10) {
          errors.push(`Chapter "${chapters[i].title}" is too close to the previous chapter (minimum 10 seconds)`)
        }
      }

      // Check title length
      chapters.forEach(chapter => {
        if (chapter.title.length > 100) {
          errors.push(`Chapter title "${chapter.title}" exceeds 100 characters`)
        }
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Auto-detect chapters from transcript patterns
   */
  static autoDetectChapters(
    transcript: TranscriptSegment[],
    videoDuration: number
  ): VideoChapter[] {
    const potentialChapters: VideoChapter[] = []
    const patterns = [
      /^(chapter|section|part)\s+\d+/i,
      /^(intro|introduction|overview|conclusion|summary|outro)/i,
      /^(step|tip|point)\s+\d+/i,
      /^(first|second|third|fourth|fifth|next|then|finally|lastly)/i
    ]

    transcript.forEach((segment, index) => {
      const text = segment.text.trim()
      const hasPattern = patterns.some(pattern => pattern.test(text))
      
      // Check for significant time gaps (more than 30 seconds)
      const hasTimeGap = index > 0 && (segment.start - transcript[index - 1].end) > 30
      
      // Check for topic transitions (simple heuristic)
      const isLongSegment = text.split(' ').length > 50
      const startsWithCapital = /^[A-Z]/.test(text)
      
      if (hasPattern || (hasTimeGap && startsWithCapital) || (index === 0)) {
        potentialChapters.push({
          id: `auto_${potentialChapters.length}`,
          title: this.extractChapterTitle(text),
          description: '',
          timestamp: segment.start,
          formattedTimestamp: this.formatTimestamp(segment.start),
          keywords: [],
          order: potentialChapters.length
        })
      }
    })

    // Ensure we don't have too many chapters
    if (potentialChapters.length > 20) {
      // Keep the most significant ones based on time distribution
      const interval = videoDuration / 20
      return potentialChapters.filter((chapter, index) => {
        return index === 0 || chapter.timestamp >= interval * Math.floor(chapter.timestamp / interval)
      }).slice(0, 20)
    }

    return potentialChapters
  }

  /**
   * Extract a chapter title from text
   */
  private static extractChapterTitle(text: string): string {
    // Take first sentence or first 50 characters
    const firstSentence = text.match(/^[^.!?]+[.!?]/)
    const title = firstSentence ? firstSentence[0] : text.slice(0, 50) + '...'
    
    return this.sanitizeTitle(title)
  }
} 