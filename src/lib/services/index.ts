// Barrel export for all services
// This centralizes imports and makes them cleaner throughout the app

// Database services
export { SupabaseProjectService as ProjectService } from '../supabase-db'

// Storage services
export { 
  storeVideo, 
  retrieveVideo, 
  deleteVideo, 
  storeThumbnail,
  getSignedVideoUrl 
} from '../supabase-video-storage'

// AI services
export { KlapAPIService } from '../klap-api'
export { TranscriptionService } from '../transcription-service'

// Nano Banana Pro services
export { createNanoBananaService, NanoBananaService } from './nano-banana-service'
export type {
  PortraitType,
  GeneralPortraitType,
  UseCasePortraitType,
  PortraitResult
} from './nano-banana-service'

// Persona services
export { PersonaServiceV2 } from './persona-service-v2'
export type { Persona, PersonaPhoto, PersonaPortrait } from './persona-service-v2'
export { ImprovedPostsService } from './posts-service-improved'

// Content Assistant (GPT-5.2 with high reasoning)
export {
  ContentAssistantService,
  createContentAssistant
} from './content-assistant-service'
export type {
  ContentAssistantInput,
  DeepContentAnalysis,
  ThumbnailGenerationPlan,
  SocialContentPlan
} from './content-assistant-service'

// Enhanced Thumbnail Service (GPT-Image 1.5)
export {
  EnhancedThumbnailService,
  createEnhancedThumbnailService
} from './enhanced-thumbnail-service'
export type {
  ThumbnailGenerationInput,
  GeneratedThumbnail,
  ThumbnailGenerationResult
} from './enhanced-thumbnail-service'

// Intelligent Social Service (Narrative-driven content)
export {
  IntelligentSocialService,
  createIntelligentSocialService
} from './intelligent-social-service'
export type {
  SocialPostInput,
  GeneratedCarousel,
  GeneratedQuote,
  SocialGenerationResult
} from './intelligent-social-service'

// Utility services
export { uploadVideoInChunks } from '../chunked-uploader'


// Usage tracking
export { UsageService } from '../usage-service'

// Social Media
export { SocialMediaService } from '../social/social-service'

// Re-export types
export type * from '../project-types' 
