// Environment variable validation
import { z } from 'zod'
import { logger } from './logger'

// Define environment variable schemas
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key required'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'Invalid OpenAI API key format').optional(),
  
  // Submagic (AI video captions and effects)
  SUBMAGIC_API_KEY: z.string().min(1, 'Submagic API key required for video processing').optional(),
  SUBMAGIC_API_URL: z.string().url('Invalid Submagic API URL').optional().default('https://api.submagic.co'),
  
  // Social Media OAuth (all optional but validated if present)
  INSTAGRAM_CLIENT_ID: z.string().optional(),
  INSTAGRAM_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Clerk publishable key'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Clerk secret key'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  
  // File Upload Limits
  NEXT_PUBLIC_MAX_FILE_SIZE: z.string().regex(/^\d+$/, 'Must be a number').optional().default('524288000'),
  
  // Feature Flags
  SKIP_KLAP_VIDEO_REUPLOAD: z.enum(['true', 'false']).optional().default('false'),
  SKIP_KLAP_PROCESSING: z.enum(['true', 'false']).optional().default('false'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional Services
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Video Processing
  VIDEO_TEMP_DIR: z.string().optional(),
  FFMPEG_PATH: z.string().optional(),
  FFPROBE_PATH: z.string().optional(),
})

// Partial schema for client-side validation (only NEXT_PUBLIC_ vars)
const clientEnvSchema = envSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: true,
  NEXT_PUBLIC_MAX_FILE_SIZE: true,
  NODE_ENV: true,
})

export type Env = z.infer<typeof envSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

// Validation results cache
let validationResult: { success: boolean; env?: Env; errors?: z.ZodError } | null = null

/**
 * Validates environment variables on server-side
 * @throws Error if required variables are missing or invalid
 */
export function validateEnv(): Env {
  // Return cached result if already validated
  if (validationResult?.success && validationResult.env) {
    return validationResult.env
  }
  
  try {
    const env = envSchema.parse(process.env)
    validationResult = { success: true, env }
    
    // Log successful validation
    logger.info('Environment variables validated successfully', {
      action: 'env_validation',
      metadata: {
        nodeEnv: env.NODE_ENV,
        hasOpenAI: !!env.OPENAI_API_KEY,
        hasSubmagic: !!env.SUBMAGIC_API_KEY,
        hasSocialOAuth: !!(env.FACEBOOK_APP_ID || env.TWITTER_CLIENT_ID || env.LINKEDIN_CLIENT_ID),
      }
    })
    
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      validationResult = { success: false, errors: error }
      
      // Log validation errors
      logger.error('Environment variable validation failed', {
        action: 'env_validation_error',
        metadata: {
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }
      })
      
      // Format error message
      const errorMessages = error.errors.map(e => 
        `  - ${e.path.join('.')}: ${e.message}`
      ).join('\n')
      
      throw new Error(`Environment validation failed:\n${errorMessages}`)
    }
    throw error
  }
}

/**
 * Validates client-side environment variables
 * Safe to use in browser context
 */
export function validateClientEnv(): ClientEnv {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE,
      NODE_ENV: process.env.NODE_ENV,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ')
      
      throw new Error(`Client environment validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * Get validated environment variable with type safety
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const env = validateEnv()
  return env[key]
}

/**
 * Check if a feature is enabled based on environment
 */
export function isFeatureEnabled(feature: 'submagic' | 'klap' | 'openai' | 'socialOAuth'): boolean {
  const env = validateEnv()
  
  switch (feature) {
    case 'submagic':
      return !!env.SUBMAGIC_API_KEY && env.SKIP_SUBMAGIC_PROCESSING !== 'true'
    case 'klap': // Legacy support
      return !!env.SUBMAGIC_API_KEY && env.SKIP_SUBMAGIC_PROCESSING !== 'true'
    case 'openai':
      return !!env.OPENAI_API_KEY
    case 'socialOAuth':
      return !!(
        env.FACEBOOK_APP_ID || 
        env.TWITTER_CLIENT_ID || 
        env.LINKEDIN_CLIENT_ID ||
        env.YOUTUBE_CLIENT_ID ||
        env.TIKTOK_CLIENT_KEY
      )
    default:
      return false
  }
}

/**
 * Get social platform OAuth credentials
 */
export function getSocialCredentials(platform: string): { clientId?: string; clientSecret?: string } | null {
  const env = validateEnv()
  
  switch (platform.toLowerCase()) {
    case 'instagram':
    case 'facebook':
      return {
        clientId: env.FACEBOOK_APP_ID,
        clientSecret: env.FACEBOOK_APP_SECRET
      }
    case 'x':
    case 'twitter':
      return {
        clientId: env.TWITTER_CLIENT_ID,
        clientSecret: env.TWITTER_CLIENT_SECRET
      }
    case 'linkedin':
      return {
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET
      }
    case 'youtube':
      return {
        clientId: env.YOUTUBE_CLIENT_ID,
        clientSecret: env.YOUTUBE_CLIENT_SECRET
      }
    case 'tiktok':
      return {
        clientId: env.TIKTOK_CLIENT_KEY,
        clientSecret: env.TIKTOK_CLIENT_SECRET
      }
    default:
      return null
  }
}

/**
 * Log environment configuration summary (safe for logging)
 */
export function logEnvSummary(): void {
  const env = validateEnv()
  
  logger.info('Environment configuration summary', {
    action: 'env_summary',
    metadata: {
      nodeEnv: env.NODE_ENV,
      services: {
        supabase: !!env.NEXT_PUBLIC_SUPABASE_URL,
        clerk: !!env.CLERK_SECRET_KEY,
        openai: !!env.OPENAI_API_KEY,
        submagic: !!env.SUBMAGIC_API_KEY,
        sentry: !!env.SENTRY_DSN,
      },
      socialPlatforms: {
        facebook: !!env.FACEBOOK_APP_ID,
        twitter: !!env.TWITTER_CLIENT_ID,
        linkedin: !!env.LINKEDIN_CLIENT_ID,
        youtube: !!env.YOUTUBE_CLIENT_ID,
        tiktok: !!env.TIKTOK_CLIENT_KEY,
      },
      features: {
        skipKlapReupload: env.SKIP_KLAP_VIDEO_REUPLOAD === 'true',
        skipKlapProcessing: env.SKIP_KLAP_PROCESSING === 'true',
      }
    }
  })
} 