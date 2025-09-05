import {
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Music2,
  FileText,
  Video,
  Globe,
  Hash,
  Tv,
  Rss,
  BookOpen,
  Play,
  Film,
  type LucideIcon
} from 'lucide-react'

// Platform definitions with all metadata
export interface Platform {
  id: string
  name: string
  icon: LucideIcon
  color: string
  bgColor: string
  gradientColor: string
  contentTypes: ContentType[]
  maxCharacters?: number
  maxHashtags?: number
  maxImages?: number
  videoDuration?: { min: number; max: number }
  aspectRatio?: string
  features: string[]
  apiEndpoint?: string
  requiresAuth: boolean
}

export type ContentType = 
  | 'blog' 
  | 'clip' 
  | 'longform' 
  | 'carousel' 
  | 'quote' 
  | 'single' 
  | 'thread' 
  | 'reel' 
  | 'story' 
  | 'short'
  | 'article'

// Platform configurations
export const PLATFORMS: Record<string, Platform> = {
  // Blog platforms
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-700',
    gradientColor: 'from-blue-700 to-blue-600',
    contentTypes: ['blog', 'article', 'carousel', 'single', 'longform'],
    maxCharacters: 3000,
    maxHashtags: 5,
    maxImages: 9,
    features: ['articles', 'native-video', 'documents', 'polls', 'events'],
    requiresAuth: true
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    icon: BookOpen,
    color: 'text-gray-900',
    bgColor: 'bg-gray-900',
    gradientColor: 'from-gray-900 to-gray-700',
    contentTypes: ['blog', 'article'],
    maxCharacters: 50000,
    features: ['long-form', 'publications', 'series', 'highlights'],
    requiresAuth: true
  },
  substack: {
    id: 'substack',
    name: 'Substack',
    icon: Rss,
    color: 'text-orange-600',
    bgColor: 'bg-orange-600',
    gradientColor: 'from-orange-600 to-orange-500',
    contentTypes: ['blog', 'article'],
    features: ['newsletter', 'subscription', 'podcast'],
    requiresAuth: true
  },
  
  // Short video platforms
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music2,
    color: 'text-black',
    bgColor: 'bg-black',
    gradientColor: 'from-pink-500 via-black to-cyan-500',
    contentTypes: ['clip', 'short', 'reel'],
    videoDuration: { min: 15, max: 180 },
    aspectRatio: '9:16',
    maxHashtags: 100,
    features: ['effects', 'sounds', 'duets', 'stitches', 'live'],
    requiresAuth: true
  },
  instagram_reels: {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    icon: Instagram,
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-br from-purple-600 to-pink-600',
    gradientColor: 'from-purple-600 to-pink-600',
    contentTypes: ['clip', 'reel', 'short'],
    videoDuration: { min: 15, max: 90 },
    aspectRatio: '9:16',
    maxHashtags: 30,
    features: ['music', 'effects', 'remixes', 'collaborations'],
    requiresAuth: true
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: Play,
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    gradientColor: 'from-red-600 to-red-500',
    contentTypes: ['clip', 'short'],
    videoDuration: { min: 15, max: 60 },
    aspectRatio: '9:16',
    maxHashtags: 15,
    features: ['music', 'comments', 'likes', 'subscribe-button'],
    requiresAuth: true
  },
  
  // Long-form video platforms
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    gradientColor: 'from-red-600 to-red-500',
    contentTypes: ['longform', 'clip'],
    aspectRatio: '16:9',
    features: ['monetization', 'premieres', 'chapters', 'end-screens', 'cards', 'subtitles'],
    requiresAuth: true
  },
  vimeo: {
    id: 'vimeo',
    name: 'Vimeo',
    icon: Film,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    gradientColor: 'from-blue-500 to-blue-400',
    contentTypes: ['longform'],
    aspectRatio: '16:9',
    features: ['privacy-controls', 'analytics', 'custom-player'],
    requiresAuth: true
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    icon: Tv,
    color: 'text-purple-600',
    bgColor: 'bg-purple-600',
    gradientColor: 'from-purple-600 to-purple-500',
    contentTypes: ['longform', 'clip'],
    features: ['live-streaming', 'clips', 'highlights'],
    requiresAuth: true
  },
  
  // Social media platforms (mixed content)
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-br from-purple-600 to-pink-600',
    gradientColor: 'from-purple-600 to-pink-600',
    contentTypes: ['carousel', 'single', 'story', 'reel'],
    maxCharacters: 2200,
    maxHashtags: 30,
    maxImages: 10,
    features: ['stories', 'reels', 'igtv', 'live', 'shopping'],
    requiresAuth: true
  },
  twitter: {
    id: 'twitter',
    name: 'X',
    icon: Twitter,
    color: 'text-black',
    bgColor: 'bg-black',
    gradientColor: 'from-gray-900 to-gray-700',
    contentTypes: ['thread', 'single', 'quote'],
    maxCharacters: 280,
    maxHashtags: 5,
    maxImages: 4,
    features: ['threads', 'spaces', 'lists', 'communities'],
    requiresAuth: true
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    gradientColor: 'from-blue-600 to-blue-500',
    contentTypes: ['single', 'carousel', 'longform', 'story'],
    maxCharacters: 2200,
    maxHashtags: 30,
    maxImages: 10,
    features: ['groups', 'pages', 'marketplace', 'events', 'live'],
    requiresAuth: true
  }
}

// Content type to platform mapping
export const CONTENT_PLATFORM_MAP: Record<ContentType, string[]> = {
  blog: ['linkedin', 'medium', 'substack'],
  article: ['linkedin', 'medium', 'substack'],
  clip: ['tiktok', 'instagram_reels', 'youtube_shorts', 'youtube', 'twitch'],
  short: ['tiktok', 'instagram_reels', 'youtube_shorts'],
  reel: ['instagram_reels', 'instagram', 'facebook'],
  longform: ['youtube', 'vimeo', 'twitch', 'linkedin', 'facebook'],
  carousel: ['instagram', 'linkedin', 'facebook'],
  single: ['instagram', 'twitter', 'facebook', 'linkedin'],
  quote: ['instagram', 'twitter', 'linkedin'],
  thread: ['twitter'],
  story: ['instagram', 'facebook']
}

// Get platforms for content type
export function getPlatformsForContent(contentType: ContentType): Platform[] {
  const platformIds = CONTENT_PLATFORM_MAP[contentType] || []
  return platformIds.map(id => PLATFORMS[id]).filter(Boolean)
}

// Get content types for platform
export function getContentTypesForPlatform(platformId: string): ContentType[] {
  const platform = PLATFORMS[platformId]
  return platform?.contentTypes || []
}

// Check if content is ready for platform
export function isContentReadyForPlatform(
  content: any,
  platformId: string
): { ready: boolean; missing: string[] } {
  const platform = PLATFORMS[platformId]
  if (!platform) return { ready: false, missing: ['Platform not found'] }
  
  const missing: string[] = []
  
  // Check character limits
  if (platform.maxCharacters && content.caption?.length > platform.maxCharacters) {
    missing.push(`Caption exceeds ${platform.maxCharacters} characters`)
  }
  
  // Check hashtag limits
  if (platform.maxHashtags && content.hashtags?.length > platform.maxHashtags) {
    missing.push(`Too many hashtags (max: ${platform.maxHashtags})`)
  }
  
  // Check video duration for video platforms
  if (platform.videoDuration && content.duration) {
    if (content.duration < platform.videoDuration.min) {
      missing.push(`Video too short (min: ${platform.videoDuration.min}s)`)
    }
    if (content.duration > platform.videoDuration.max) {
      missing.push(`Video too long (max: ${platform.videoDuration.max}s)`)
    }
  }
  
  // Check aspect ratio
  if (platform.aspectRatio && content.aspectRatio && content.aspectRatio !== platform.aspectRatio) {
    missing.push(`Wrong aspect ratio (needs: ${platform.aspectRatio})`)
  }
  
  // Check for required auth
  if (platform.requiresAuth && !content.hasAuth) {
    missing.push('Platform authentication required')
  }
  
  return {
    ready: missing.length === 0,
    missing
  }
}

// Platform-specific field configurations
export interface PlatformFields {
  caption: boolean
  hashtags: boolean
  title: boolean
  description: boolean
  thumbnail: boolean
  tags: boolean
  category: boolean
  visibility: boolean
  comments: boolean
  monetization: boolean
  scheduling: boolean
  location: boolean
  audience: boolean
}

export const PLATFORM_FIELDS: Record<string, Partial<PlatformFields>> = {
  linkedin: {
    caption: true,
    hashtags: true,
    title: true,
    visibility: true,
    audience: true
  },
  medium: {
    title: true,
    description: true,
    tags: true,
    visibility: true
  },
  tiktok: {
    caption: true,
    hashtags: true,
    comments: true,
    visibility: true
  },
  youtube: {
    title: true,
    description: true,
    tags: true,
    thumbnail: true,
    category: true,
    visibility: true,
    comments: true,
    monetization: true,
    scheduling: true
  },
  instagram: {
    caption: true,
    hashtags: true,
    location: true,
    audience: true,
    comments: true
  },
  twitter: {
    caption: true,
    hashtags: true,
    audience: true,
    scheduling: true
  }
}

// Get required fields for platform
export function getRequiredFieldsForPlatform(platformId: string): Partial<PlatformFields> {
  return PLATFORM_FIELDS[platformId] || {}
}
