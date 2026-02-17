/**
 * Submagic API TypeScript Definitions
 * Complete type definitions for the Submagic API
 * @see https://api.submagic.co
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type ProjectStatus = 'processing' | 'transcribing' | 'exporting' | 'completed' | 'failed';
export type TranscriptionStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RemoveSilencePace = 'natural' | 'fast' | 'extra-fast';
export type WordType = 'word' | 'silence' | 'punctuation';

// ============================================================================
// API RESPONSES
// ============================================================================

export interface Language {
  name: string;
  code: string;
}

export interface LanguagesResponse {
  languages: Language[];
}

export interface TemplatesResponse {
  templates: string[];
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps?: number;
}

export interface TranscriptionWord {
  id: string;
  text: string; // Empty string for silence segments
  type: WordType;
  startTime: number; // Seconds
  endTime: number; // Seconds
}

export interface MagicClip {
  id: string;
  title: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  previewUrl?: string;
  downloadUrl?: string;
  directUrl?: string;
}

export interface SubmagicProject {
  id: string;
  title: string;
  language: string;
  status: ProjectStatus;
  webhookUrl?: string;
  templateName?: string;
  userThemeId?: string;
  downloadUrl?: string; // Available when status is 'completed'
  directUrl?: string; // CDN URL when status is 'completed'
  previewUrl?: string; // Preview page URL when completed
  transcriptionStatus?: TranscriptionStatus;
  failureReason?: string; // Present if status is 'failed'
  magicZooms?: boolean;
  magicBrolls?: boolean;
  magicBrollsPercentage?: number;
  removeSilencePace?: RemoveSilencePace;
  removeBadTakes?: boolean;
  videoMetaData?: VideoMetadata;
  words?: TranscriptionWord[]; // Available when transcription completed
  magicClips?: MagicClip[]; // Only for Magic Clips projects
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateProjectRequest {
  // Required
  title: string; // 1-100 characters
  language: string; // Language code (e.g., "en", "es")
  videoUrl: string; // Public URL to video file

  // Optional styling (mutually exclusive)
  templateName?: string; // Template name from /v1/templates
  userThemeId?: string; // Custom theme UUID

  // Optional configuration
  webhookUrl?: string; // HTTPS URL for notifications
  dictionary?: string[]; // Custom words (max 100 items, 50 chars each)

  // Optional AI features
  magicZooms?: boolean; // Auto zoom effects (default: false)
  magicBrolls?: boolean; // Auto B-roll insertion (default: false)
  magicBrollsPercentage?: number; // B-roll percentage 0-100 (default: 50)
  removeSilencePace?: RemoveSilencePace; // Auto silence removal
  removeBadTakes?: boolean; // AI bad take removal (default: false)
}

export interface ExportProjectRequest {
  fps?: number; // Frames per second 1-60 (default: original or 30)
  width?: number; // Width in pixels 100-4000 (default: original or 1080)
  height?: number; // Height in pixels 100-4000 (default: original or 1920)
  webhookUrl?: string; // URL for completion notification
}

export interface ExportProjectResponse {
  message: string;
  projectId: string;
  status: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface ProjectWebhookPayload {
  projectId: string;
  status: 'completed' | 'failed';
  downloadUrl?: string; // Full download URL with auth params
  directUrl?: string; // CloudFront CDN URL
  timestamp: string; // ISO 8601
}

export interface MagicClipsWebhookPayload {
  projectId: string;
  status: 'completed' | 'failed';
  title: string;
  duration: number; // Original video duration (seconds)
  completedAt: string; // ISO 8601
  magicClips: Array<{
    id: string;
    title: string; // AI-generated title
    duration: number; // Clip duration (seconds)
    status: string;
    previewUrl: string;
    downloadUrl: string;
    directUrl: string;
  }>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface SubmagicError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  retryAfter?: number; // For rate limit errors
}

export type SubmagicErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR';

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSubmagicError(obj: any): obj is SubmagicError {
  return obj && typeof obj === 'object' && 'error' in obj && 'message' in obj;
}

export function isProjectCompleted(project: SubmagicProject): boolean {
  return project.status === 'completed' && !!project.downloadUrl;
}

export function hasTranscription(project: SubmagicProject): boolean {
  return project.transcriptionStatus === 'COMPLETED' && !!project.words;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUBMAGIC_BASE_URL = 'https://api.submagic.co';

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_DURATION_SECONDS: 2 * 60 * 60, // 2 hours
  SUPPORTED_FORMATS: ['mp4', 'mov'] as const,
} as const;





