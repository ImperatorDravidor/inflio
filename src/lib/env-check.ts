// Environment variable validation
export interface RequiredEnvVars {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  
  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY?: string
  
  // OpenAI
  OPENAI_API_KEY?: string
  
  // AssemblyAI
  ASSEMBLYAI_API_KEY?: string
  
  // Other APIs
  GOOGLE_GENERATIVE_AI_API_KEY?: string
  FAL_KEY?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  
  // URLs
  NEXT_PUBLIC_APP_URL: string
  
  // Optional
  SENTRY_DSN?: string
  UPSTASH_REDIS_REST_URL?: string
  UPSTASH_REDIS_REST_TOKEN?: string
}

export function checkRequiredEnvVars(): { 
  isValid: boolean
  missing: string[]
  warnings: string[]
} {
  const required: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  const recommended: (keyof RequiredEnvVars)[] = [
    'OPENAI_API_KEY',
    'ASSEMBLYAI_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'FAL_KEY'
  ]
  
  const missing: string[] = []
  const warnings: string[] = []
  
  // Check required vars
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }
  
  // Check recommended vars
  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(key)
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

// Helper to get env var with fallback
export function getEnvVar(key: keyof RequiredEnvVars, fallback?: string): string {
  const value = process.env[key]
  if (!value && !fallback) {
    console.warn(`Environment variable ${key} is not set`)
  }
  return value || fallback || ''
}

// Check if running in production
export const isProduction = process.env.NODE_ENV === 'production'

// Check if running in development
export const isDevelopment = process.env.NODE_ENV === 'development'

// Get app URL
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
         (isDevelopment ? 'http://localhost:3000' : 'https://inflio.com')
}

// Feature flags based on env vars
export const features = {
  klap: !!process.env.KLAP_API_KEY,
  socialAuth: {
    twitter: !!process.env.TWITTER_CLIENT_ID,
    linkedin: !!process.env.LINKEDIN_CLIENT_ID,
    instagram: !!process.env.INSTAGRAM_CLIENT_ID,
    tiktok: !!process.env.TIKTOK_CLIENT_KEY,
    facebook: !!process.env.FACEBOOK_APP_ID
  },
  ai: {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
    fal: !!process.env.FAL_KEY
  },
  storage: {
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
  },
  monitoring: {
    sentry: !!process.env.SENTRY_DSN
  },
  rateLimit: {
    redis: !!process.env.UPSTASH_REDIS_REST_URL
  }
} 