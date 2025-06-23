import { toast } from 'sonner'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, context?: string): void {
  console.error(`[${context || 'Error'}]:`, error)
  
  let message = 'An unexpected error occurred'
  
  if (error instanceof AppError) {
    message = error.message
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  // Only show toast on client side
  if (typeof window !== 'undefined') {
  toast.error(message)
  }
}

export function handleApiError(response: Response): never {
  const statusCode = response.status
  let message = 'API request failed'
  
  switch (statusCode) {
    case 400:
      message = 'Invalid request'
      break
    case 401:
      message = 'Unauthorized'
      break
    case 403:
      message = 'Forbidden'
      break
    case 404:
      message = 'Not found'
      break
    case 429:
      message = 'Too many requests'
      break
    case 500:
      message = 'Server error'
      break
  }
  
  throw new AppError(message, `HTTP_${statusCode}`, statusCode)
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, context)
    return null
  }
} 
