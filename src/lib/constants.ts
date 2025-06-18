// Application-wide constants
export const APP_CONFIG = {
  // Upload limits
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  CHUNK_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  
  // Processing timeouts
  POLLING_INTERVAL: 2000, // 2 seconds
  PROCESSING_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // UI constants
  TOAST_DURATION: 4000,
  ANIMATION_DURATION: 300,
  
  // API endpoints
  KLAP_API_BASE: 'https://api.klap.app',
  
  // Storage buckets
  STORAGE_BUCKETS: {
    VIDEOS: 'videos',
    THUMBNAILS: 'thumbnails',
    AUDIO: 'audio'
  }
} as const

// Route paths
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  PROCESSING: (id: string) => `/studio/processing/${id}`,
  UPLOAD: '/studio/upload',
  VIDEOS: '/studio/videos',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  ONBOARDING: '/onboarding',
  // Social Media routes
  SOCIAL: '/social',
  SOCIAL_COMPOSE: '/social/compose',
  SOCIAL_CALENDAR: '/social/calendar',
  SOCIAL_ANALYTICS: '/social/analytics'
} as const

// Task types
export const TASK_TYPES = {
  TRANSCRIPTION: 'transcription',
  CLIPS: 'clips',
  BLOG: 'blog',
  SOCIAL: 'social',
  PODCAST: 'podcast'
} as const

// Project status
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  READY: 'ready',
  PUBLISHED: 'published',
  FAILED: 'failed'
} as const 
