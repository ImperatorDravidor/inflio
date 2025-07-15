

// Security utilities for production deployment
import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'
import { validateInput, schemas } from './validation'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security headers configuration
export const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Content Security Policy
  'Content-Security-Policy': process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.clerk.com https://*.clerk.accounts.dev wss://*.supabase.co https://api.openai.com https://api.klap.app; frame-src 'self' https://clerk.com https://*.clerk.accounts.dev;"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src * data: blob:; connect-src *; frame-src *;",
}

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
}

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
}

const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'Too many requests, please try again later.'
}

// API-specific rate limits
export const apiRateLimits: Record<string, RateLimitConfig> = {
  // AI endpoints - more restrictive
  '/api/generate-caption': { windowMs: 60000, maxRequests: 20 },
  '/api/generate-blog': { windowMs: 300000, maxRequests: 10 }, // 10 per 5 minutes
  '/api/generate-images': { windowMs: 300000, maxRequests: 5 }, // 5 per 5 minutes
  '/api/generate-thumbnail': { windowMs: 60000, maxRequests: 30 },
  '/api/generate-social': { windowMs: 60000, maxRequests: 30 },
  
  // Video processing - very restrictive
  '/api/process-klap': { windowMs: 3600000, maxRequests: 5 }, // 5 per hour
  '/api/process': { windowMs: 3600000, maxRequests: 10 }, // 10 per hour
  '/api/upload': { windowMs: 300000, maxRequests: 5 }, // 5 per 5 minutes
  
  // Social media
  '/api/social/publish': { windowMs: 60000, maxRequests: 30 },
  '/api/social/connect': { windowMs: 300000, maxRequests: 10 },
  
  // General endpoints
  '/api/list-projects': { windowMs: 60000, maxRequests: 100 },
  '/api/check-klap-task': { windowMs: 10000, maxRequests: 10 }, // polling endpoint
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  config?: Partial<RateLimitConfig>
): Promise<NextResponse | null> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return null
  }
  
  const finalConfig = { ...defaultRateLimitConfig, ...config }
  const identifier = getClientIdentifier(request)
  const key = `${identifier}:${request.nextUrl.pathname}`
  
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + finalConfig.windowMs
    })
    return null
  }
  
  if (record.count >= finalConfig.maxRequests) {
    // Rate limit exceeded
    logger.warn('Rate limit exceeded', {
      action: 'rate_limit',
      metadata: {
        identifier,
        path: request.nextUrl.pathname,
        count: record.count,
        limit: finalConfig.maxRequests
      }
    })
    
    return NextResponse.json(
      { error: finalConfig.message },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(finalConfig.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(record.resetTime),
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000))
        }
      }
    )
  }
  
  // Increment counter
  record.count++
  return null
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    // Extract user ID from JWT or session
    const userId = extractUserIdFromAuth(authHeader)
    if (userId) return userId
  }
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return ip
}

/**
 * Extract user ID from authorization header
 */
function extractUserIdFromAuth(authHeader: string): string | null {
  try {
    // Handle Bearer token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // In production, validate JWT properly
      // For now, just extract user ID if it's in the token
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || payload.userId || null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Clean up expired rate limit records
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: any
): Promise<{ data?: T; error?: NextResponse }> {
  try {
    const body = await request.json()
    const validation = validateInput(schema, body)
    
    if (!validation.success) {
      logger.warn('Request validation failed', {
        action: 'request_validation',
        metadata: {
          path: request.nextUrl.pathname,
          errors: validation.errors
        }
      })
      
      return {
        error: NextResponse.json(
          { 
            error: 'Validation failed',
            details: validation.errors
          },
          { status: 400 }
        )
      }
    }
    
    return { data: validation.data as T }
  } catch (error) {
    logger.error('Failed to parse request body', {
      action: 'request_parse_error',
      metadata: {
        path: request.nextUrl.pathname
      }
    }, error as Error)
    
    return {
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }
}

/**
 * Sanitize user input for various contexts
 */
export const sanitizeInput = {
  // SQL injection prevention (use parameterized queries instead)
  sql: (input: string): string => {
    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comments
      .trim()
  },
  
  // Path traversal prevention
  path: (input: string): string => {
    return input
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/[^a-zA-Z0-9._-]/g, '') // Allow only safe characters
      .toLowerCase()
  },
  
  // Command injection prevention
  command: (input: string): string => {
    return input
      .replace(/[;&|`$(){}[\]<>]/g, '') // Remove shell metacharacters
      .trim()
  }
}

/**
 * Create secure API response with headers
 */
export function createSecureResponse(
  data: any,
  status: number = 200,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status })
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add additional headers if provided
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
  return response
}

/**
 * Verify webhook signatures
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Implementation depends on webhook provider
    // This is a generic HMAC verification
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    logger.error('Webhook signature verification failed', {
      action: 'webhook_verification'
    }, error as Error)
    return false
  }
} 