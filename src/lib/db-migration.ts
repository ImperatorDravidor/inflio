// This file helps with the migration from localStorage/IndexedDB to Supabase
// It re-exports the Supabase services with the same names as the original services

export { SupabaseProjectService as ProjectService } from './supabase-db'
export { 
  storeVideo, 
  retrieveVideo, 
  deleteVideo, 
  storeThumbnail,
  getSignedVideoUrl 
} from './supabase-video-storage' 