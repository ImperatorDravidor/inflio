import { toast } from 'sonner'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, context?: string) {
  console.error(`[${context || 'Unknown Context'}] Error:`, error)
  
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  }
  
  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500
    }
  }
  
  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500
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
