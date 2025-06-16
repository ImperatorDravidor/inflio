export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
  size: number
  format: string
}

export interface ProcessingTask {
  id: string
  type: 'transcription' | 'clips' | 'blog' | 'social' | 'podcast'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startedAt?: string
  completedAt?: string
  error?: string
  result?: TranscriptionData | ClipData[] | BlogPost | SocialPost[] | PodcastData
}

export interface TranscriptionData {
  text: string
  segments: Array<{
    id: string
    text: string
    start: number
    end: number
    confidence: number
  }>
  language: string
  duration: number
}

export interface ClipData {
  id: string
  title: string
  description: string
  startTime: number
  endTime: number
  duration: number
  thumbnail: string
  tags: string[]
  score: number // AI-determined quality score
  type: 'highlight' | 'intro' | 'outro' | 'key-moment'
  // Optional Klap-specific properties
  klapProjectId?: string
  klapFolderId?: string
  previewUrl?: string
  exportUrl?: string
  exported?: boolean
  // New fields for enhanced clip data
  rawKlapData?: any // Store the raw response from Klap for future reference
  createdAt?: string
  viralityExplanation?: string
  transcript?: string // Store the clip's transcript if available
}

export interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  seoTitle: string
  seoDescription: string
  readingTime: number
  sections: Array<{
    heading: string
    content: string
  }>
  createdAt: string
}

export interface SocialPost {
  id: string
  platform: 'twitter' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube-short'
  content: string
  hashtags: string[]
  mediaUrl?: string
  scheduledFor?: string
  status: 'draft' | 'scheduled' | 'published'
  engagement?: {
    likes: number
    shares: number
    comments: number
  }
}

export interface PodcastData {
  id: string
  title: string
  description: string
  chapters: Array<{
    title: string
    startTime: number
    endTime: number
    summary: string
  }>
  showNotes: string
  keywords: string[]
  guests?: string[]
  topics: string[]
}

export interface ContentFolders {
  clips: ClipData[]
  blog: BlogPost[]
  social: SocialPost[]
  podcast: PodcastData[]
}

export interface Project {
  id: string
  title: string
  description: string
  video_id: string
  video_url: string
  thumbnail_url: string
  metadata: VideoMetadata
  transcription?: TranscriptionData
  folders: ContentFolders
  tasks: ProcessingTask[]
  settings: {
    autoGenerateClips: boolean
    clipDuration: number // in seconds
    blogStyle: 'professional' | 'casual' | 'technical'
    socialPlatforms: string[]
    language: string
  }
  analytics: {
    totalViews: number
    totalEngagement: number
    bestPerformingContent: string
  }
  created_at: string
  updated_at: string
  status: 'draft' | 'processing' | 'ready' | 'published'
  tags: string[]
  user_id?: string
  klap_project_id?: string // Klap API project ID for tracking
  klap_folder_id?: string // Klap API folder ID for exports
}

export interface ProjectSettings {
  defaultClipDuration: number
  preferredPlatforms: string[]
  blogStyle: 'professional' | 'casual' | 'technical'
  autoProcess: boolean
  webhookUrl?: string
  exportFormat: 'mp4' | 'mov' | 'webm'
  quality: 'low' | 'medium' | 'high' | 'ultra'
} 
