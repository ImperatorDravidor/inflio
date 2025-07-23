/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: any) => boolean
  onRetry?: (error: any, attempt: number) => void
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors and 5xx status codes
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true
    if (error.status && error.status >= 500) return true
    if (error.message?.includes('network')) return true
    return false
  },
  onRetry: (error, attempt) => {
    console.log(`Retry attempt ${attempt}:`, error.message)
  }
}

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error)) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      )
      
      // Call retry callback
      opts.onRetry(error, attempt)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Retry wrapper specifically for fetch requests
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, options)
      
      // Throw error for 5xx responses to trigger retry
      if (response.status >= 500) {
        const error = new Error(`Server error: ${response.status}`)
        ;(error as any).status = response.status
        throw error
      }
      
      return response
    },
    {
      ...retryOptions,
      shouldRetry: (error) => {
        // Custom retry logic for fetch
        if (error.name === 'AbortError') return false // Don't retry aborted requests
        if (error.status === 429) return true // Retry rate limits
        if (error.status >= 500) return true // Retry server errors
        if (error.message?.includes('Failed to fetch')) return true // Network errors
        return retryOptions.shouldRetry?.(error) ?? DEFAULT_OPTIONS.shouldRetry(error)
      }
    }
  )
}

/**
 * Retry wrapper for chunked uploads
 */
export async function uploadWithRetry(
  uploadFn: () => Promise<any>,
  options: RetryOptions = {}
): Promise<any> {
  return withRetry(uploadFn, {
    maxAttempts: 5, // More attempts for uploads
    initialDelay: 2000, // Longer initial delay
    ...options,
    shouldRetry: (error) => {
      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        return false
      }
      // Retry on specific upload errors
      if (error.message?.includes('Failed to upload')) return true
      if (error.message?.includes('Network error')) return true
      if (error.code === 'ECONNRESET') return true
      return options.shouldRetry?.(error) ?? true
    }
  })
}