/**
 * Vizard API Service
 * AI-powered video clipping with flexible video source support
 * Docs: https://docs.vizard.ai
 */

const VIZARD_API_BASE = 'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1'

interface VizardCreateProjectParams {
  lang: string
  preferLength: number[]
  videoUrl: string
  videoType: number
  ext?: string
  ratioOfClip?: number
  templateId?: number
  removeSilenceSwitch?: number
  maxClipNumber?: number
  keywords?: string
  subtitleSwitch?: number
  emojiSwitch?: number
  highlightSwitch?: number
  autoBrollSwitch?: number
  headlineSwitch?: number
  projectName?: string
  webhookUrl?: string
}

interface VizardProject {
  code: number
  projectId: number
  shareLink: string
  errMsg: string
}

interface VizardVideo {
  videoId: number
  videoUrl: string
  title: string
  viralScore: string
  viralReason: string
  transcript: string
  clipEditorUrl: string
  videoMsDuration: number
  relatedTopic: string
}

interface VizardProjectStatus {
  code: number
  projectId: number
  projectName: string
  videos: VizardVideo[]
  creditsUsed: number
  errMsg?: string
}

export class VizardAPIService {
  private static getApiKey(): string {
    const apiKey = process.env.VIZARD_API_KEY
    if (!apiKey) {
      throw new Error('VIZARD_API_KEY is not configured')
    }
    return apiKey
  }

  /**
   * Create a new video clipping project
   */
  static async createProject(params: VizardCreateProjectParams): Promise<VizardProject> {
    const apiKey = this.getApiKey()

    console.log('[Vizard] Creating project:', {
      videoUrl: params.videoUrl,
      videoType: params.videoType,
      lang: params.lang,
    })

    try {
      const response = await fetch(`${VIZARD_API_BASE}/project/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'VIZARDAI_API_KEY': apiKey,
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (data.code !== 2000) {
        console.error('[Vizard] Project creation failed:', data)
        throw new Error(data.errMsg || `Vizard error: ${data.code}`)
      }

      console.log('[Vizard] Project created successfully:', data.projectId)

      return data
    } catch (error) {
      console.error('[Vizard] API error:', error)
      throw error
    }
  }

  /**
   * Query project status and retrieve clips
   */
  static async getProjectStatus(projectId: number): Promise<VizardProjectStatus> {
    const apiKey = this.getApiKey()

    console.log('[Vizard] Querying project status:', projectId)

    try {
      const response = await fetch(`${VIZARD_API_BASE}/project/query/${projectId}`, {
        method: 'GET',
        headers: {
          'VIZARDAI_API_KEY': apiKey,
        },
      })

      const data = await response.json()

      // Log the FULL response to understand structure
      console.log('[Vizard] FULL API Response:', JSON.stringify(data, null, 2))

      // Code 1000 = Still processing (not an error!)
      // Code 2000 = Completed successfully
      // Code 4xxx = Actual errors
      if (data.code >= 4000) {
        console.error('[Vizard] Query failed:', data)
        throw new Error(data.errMsg || `Vizard error: ${data.code}`)
      }

      console.log('[Vizard] Project status:', {
        projectId,
        projectName: data.projectName,
        videosCount: data.videos?.length || 0,
        creditsUsed: data.creditsUsed || 0,
        code: data.code,
        dataKeys: Object.keys(data),
      })

      return data
    } catch (error) {
      console.error('[Vizard] Query error:', error)
      throw error
    }
  }

  /**
   * Video type enum for easier use
   */
  static VideoType = {
    REMOTE_FILE: 1,      // Direct URL to .mp4, .mov, etc
    YOUTUBE: 2,
    GOOGLE_DRIVE: 3,
    VIMEO: 4,
    STREAMYARD: 5,
    TIKTOK: 6,
    TWITTER: 7,
    RUMBLE: 8,
    TWITCH: 9,
    LOOM: 10,
    FACEBOOK: 11,
    LINKEDIN: 12,
  }

  /**
   * Aspect ratio enum
   */
  static AspectRatio = {
    VERTICAL: 1,    // 9:16 - TikTok, Reels, Shorts
    SQUARE: 2,      // 1:1 - Instagram/Facebook Feed
    PORTRAIT: 3,    // 4:5 - Instagram optimized
    HORIZONTAL: 4,  // 16:9 - YouTube, Twitter
  }

  /**
   * Clip length presets
   */
  static ClipLength = {
    AUTO: [0],                    // AI decides
    ULTRA_SHORT: [1],            // < 30s
    SHORT: [2],                  // 30-60s
    MEDIUM: [3],                 // 60-90s
    LONG: [4],                   // 90s-3min
    SHORT_TO_MEDIUM: [1, 2],     // < 60s
    SHORT_TO_LONG: [1, 2, 3],    // < 90s
  }
}
