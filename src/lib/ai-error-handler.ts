import { AppError, handleError } from './error-handler'
import { toast } from 'sonner'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
}

interface AICallOptions extends RetryOptions {
  fallbackBehavior?: 'default' | 'throw' | 'silent'
  userNotification?: boolean
  context?: string
}

export class AIError extends AppError {
  constructor(
    message: string,
    public originalError?: any,
    public retryable: boolean = true
  ) {
    super(message, 'AI_ERROR', 500)
  }
}

/**
 * Wraps AI API calls with comprehensive error handling
 */
export async function withAIErrorHandling<T>(
  fn: () => Promise<T>,
  options: AICallOptions = {}
): Promise<T | null> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    fallbackBehavior = 'default',
    userNotification = true,
    context
  } = options

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error)
      
      if (!isRetryable || attempt === maxRetries) {
        // Final failure
        handleAIError(lastError, {
          context,
          userNotification,
          fallbackBehavior,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1
        })
        
        if (fallbackBehavior === 'throw') {
          throw new AIError(
            `AI operation failed after ${attempt + 1} attempts: ${lastError.message}`,
            lastError,
            false
          )
        }
        
        return null
      }
      
      // Calculate delay for next retry
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay
      
      console.warn(`AI call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return null
}

function isRetryableError(error: any): boolean {
  if (!error) return false
  
  // OpenAI specific errors
  if (error.status) {
    // Rate limit or server errors are retryable
    return error.status === 429 || error.status >= 500
  }
  
  // Network errors are retryable
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND') {
    return true
  }
  
  // Check error message for retryable patterns
  const message = error.message?.toLowerCase() || ''
  const retryablePatterns = [
    'rate limit',
    'timeout',
    'network',
    'temporary',
    'try again',
    'service unavailable'
  ]
  
  return retryablePatterns.some(pattern => message.includes(pattern))
}

function handleAIError(
  error: Error,
  options: {
    context?: string
    userNotification?: boolean
    fallbackBehavior?: string
    attempt?: number
    maxRetries?: number
  }
) {
  const { context, userNotification, attempt, maxRetries } = options
  
  // Log the error
  console.error(`[AI Error${context ? ` - ${context}` : ''}]:`, error)
  
  // User-friendly error messages
  let userMessage = 'AI service temporarily unavailable'
  
  if (error.message.includes('rate limit')) {
    userMessage = 'Too many requests. Please wait a moment and try again.'
  } else if (error.message.includes('timeout')) {
    userMessage = 'Request timed out. Please try again.'
  } else if (error.message.includes('network')) {
    userMessage = 'Network error. Please check your connection.'
  } else if (attempt && maxRetries) {
    userMessage = `AI service failed after ${attempt} attempts. Please try again later.`
  }
  
  // Show user notification if enabled
  if (userNotification && typeof window !== 'undefined') {
    toast.error(userMessage)
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // trackError(error, { context, attempt, maxRetries })
  }
}

/**
 * Get fallback content for different AI operations
 */
export function getAIFallback(operation: string, context?: any): any {
  const fallbacks: Record<string, any> = {
    caption: {
      instagram: `✨ ${context?.title || 'Amazing content'} ✨\n\n${context?.description || 'Check this out!'}\n\n#content #creator #viral`,
      x: `${context?.title || 'New post'} 🚀\n\n${context?.description || 'Thread below 👇'}`,
      linkedin: `${context?.title || 'Professional Update'}\n\n${context?.description || 'Sharing insights from my latest work.'}\n\n#professional #business`,
      tiktok: `${context?.title || 'Wait for it...'} 😱\n\n${context?.description || 'You won\'t believe this!'}\n\n#fyp #viral #trending`,
      youtube: `${context?.title || 'New Video'}\n\n${context?.description || 'Full video description here.'}\n\nDon't forget to like and subscribe! 🔔`,
      facebook: `${context?.title || 'Update'}\n\n${context?.description || 'Sharing something interesting with you all.'}\n\nWhat are your thoughts?`,
      threads: `${context?.title || 'Quick thought'} 💭\n\n${context?.description || 'Let\'s discuss!'}`
    },
    schedule: [
      { hour: 9, minute: 0, reason: 'Morning engagement peak', score: 85 },
      { hour: 12, minute: 30, reason: 'Lunch break browsing', score: 90 },
      { hour: 18, minute: 0, reason: 'Evening wind-down', score: 95 }
    ],
    hashtags: {
      default: ['content', 'creator', 'viral', 'trending', '2024'],
      instagram: ['instagood', 'instadaily', 'photooftheday', 'reels', 'explore'],
      tiktok: ['fyp', 'foryoupage', 'viral', 'trending', 'tiktokcreator'],
      youtube: ['youtube', 'youtuber', 'subscribe', 'video', 'content']
    },
    summary: 'AI-generated summary unavailable. Please try again later.',
    transcription: {
      text: '[Transcription unavailable]',
      segments: []
    }
  }
  
  return fallbacks[operation] || null
}

/**
 * Validate AI response format
 */
export function validateAIResponse<T>(
  response: any,
  schema: {
    required?: string[]
    properties?: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>
  }
): response is T {
  if (!response || typeof response !== 'object') {
    return false
  }
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in response)) {
        console.warn(`AI response missing required field: ${field}`)
        return false
      }
    }
  }
  
  // Check property types
  if (schema.properties) {
    for (const [field, expectedType] of Object.entries(schema.properties)) {
      if (field in response) {
        const actualType = Array.isArray(response[field]) ? 'array' : typeof response[field]
        if (actualType !== expectedType) {
          console.warn(`AI response field ${field} has wrong type: expected ${expectedType}, got ${actualType}`)
          return false
        }
      }
    }
  }
  
  return true
} 