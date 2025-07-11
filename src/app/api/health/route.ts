import { NextRequest } from 'next/server'
import { handleHealthCheck } from '@/lib/health-check'
import { createSecureResponse } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const response = await handleHealthCheck(request as any)
    const data = await response.json()
    
    // Use secure response wrapper
    return createSecureResponse(data, response.status)
  } catch (error) {
    return createSecureResponse(
      { 
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      503
    )
  }
} 