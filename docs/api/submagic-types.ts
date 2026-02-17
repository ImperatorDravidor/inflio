/**
 * Submagic API TypeScript Definitions
 * 
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

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
}

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

export interface Project {
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

export interface CreateMagicClipsRequest {
  // Required
  title: string; // 1-100 characters
  language: string; // Language code 2-10 chars
  youtubeUrl: string; // Valid YouTube URL

  // Optional
  webhookUrl?: string; // HTTPS URL for notifications
  userThemeId?: string; // Custom theme UUID
  minClipLength?: number; // Min duration 15-300 seconds (default: 15)
  maxClipLength?: number; // Max duration 15-300 seconds (default: 60)
}

export interface UploadProjectFormData {
  // Required
  title: string;
  language: string;
  file: File;

  // Optional styling (mutually exclusive)
  templateName?: string;
  userThemeId?: string;

  // Optional configuration
  webhookUrl?: string;
  dictionary?: string; // JSON stringified array

  // Optional AI features (all as strings!)
  magicZooms?: 'true' | 'false';
  magicBrolls?: 'true' | 'false';
  magicBrollsPercentage?: string; // "0" to "100"
  removeSilencePace?: RemoveSilencePace;
  removeBadTakes?: 'true' | 'false';
}

export interface UpdateProjectRequest {
  // Optional AI features
  removeSilencePace?: RemoveSilencePace;
  removeBadTakes?: boolean; // Takes 1-2 minutes to process

  // Optional media insertions
  items?: Array<{
    startTime: number; // Start time in seconds (>= 0)
    endTime: number; // End time in seconds (> startTime)
    userMediaId: string; // UUID of media from your library
  }>;
}

export interface UpdateProjectResponse {
  message: string;
  id: string;
  status: string;
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
  downloadUrl: string; // Full download URL with auth params
  directUrl: string; // CloudFront CDN URL
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
// CLIENT TYPES
// ============================================================================

export interface SubmagicClientConfig {
  apiKey: string;
  baseUrl?: string; // Default: https://api.submagic.co
  timeout?: number; // Request timeout in ms
  retryAttempts?: number; // Max retry attempts (default: 3)
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSubmagicError(obj: any): obj is SubmagicError {
  return obj && typeof obj === 'object' && 'error' in obj && 'message' in obj;
}

export function isProjectCompleted(project: Project): boolean {
  return project.status === 'completed' && !!project.downloadUrl;
}

export function hasTranscription(project: Project): boolean {
  return project.transcriptionStatus === 'COMPLETED' && !!project.words;
}

export function isMagicClipsProject(project: Project): boolean {
  return !!project.magicClips && project.magicClips.length > 0;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PartialProject = Partial<Project> & Pick<Project, 'id'>;

export type CreateProjectResponse = Pick<
  Project,
  | 'id'
  | 'title'
  | 'language'
  | 'status'
  | 'webhookUrl'
  | 'templateName'
  | 'userThemeId'
  | 'magicZooms'
  | 'magicBrolls'
  | 'magicBrollsPercentage'
  | 'removeSilencePace'
  | 'removeBadTakes'
  | 'createdAt'
  | 'updatedAt'
>;

export type CreateMagicClipsResponse = Pick<
  Project,
  'id' | 'title' | 'language' | 'status' | 'webhookUrl' | 'createdAt'
>;

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUBMAGIC_BASE_URL = 'https://api.submagic.co';

export const RATE_LIMITS = {
  HEALTH: Infinity,
  LANGUAGES: 1000, // per hour
  TEMPLATES: 1000, // per hour
  CREATE_PROJECT: 500, // per hour
  UPLOAD_PROJECT: 500, // per hour
  MAGIC_CLIPS: 500, // per hour
  GET_PROJECT: 100, // per hour
  UPDATE_PROJECT: 100, // per hour
  EXPORT_PROJECT: 'enhanced', // Enhanced for API projects
} as const;

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_DURATION_SECONDS: 2 * 60 * 60, // 2 hours
  SUPPORTED_FORMATS: ['mp4', 'mov'] as const,
} as const;

export const SILENCE_REMOVAL_PACES = ['natural', 'fast', 'extra-fast'] as const;

export const VIDEO_DIMENSIONS = {
  WIDTH: { MIN: 100, MAX: 4000, DEFAULT: 1080 },
  HEIGHT: { MIN: 100, MAX: 4000, DEFAULT: 1920 },
  FPS: { MIN: 1, MAX: 60, DEFAULT: 30 },
} as const;

export const CLIP_LENGTH = {
  MIN: 15, // seconds
  MAX: 300, // seconds
  DEFAULT_MIN: 15,
  DEFAULT_MAX: 60,
} as const;

// ============================================================================
// HELPER TYPES FOR IMPLEMENTATION
// ============================================================================

export interface SubmagicServiceInterface {
  // Health & Info
  healthCheck(): Promise<HealthCheckResponse>;
  getLanguages(): Promise<Language[]>;
  getTemplates(): Promise<string[]>;

  // Project Management
  createProject(request: CreateProjectRequest): Promise<Project>;
  uploadProject(formData: FormData): Promise<Project>;
  createMagicClips(request: CreateMagicClipsRequest): Promise<Project>;
  getProject(projectId: string): Promise<Project>;
  updateProject(projectId: string, request: UpdateProjectRequest): Promise<UpdateProjectResponse>;
  exportProject(projectId: string, request?: ExportProjectRequest): Promise<ExportProjectResponse>;

  // Utility
  waitForCompletion(projectId: string, maxAttempts?: number): Promise<Project>;
  getRateLimitInfo(): RateLimitInfo | null;
}





