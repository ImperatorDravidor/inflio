import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check environment variables (safely)
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      KLAP_API_KEY: process.env.KLAP_API_KEY ? 'SET (hidden)' : 'NOT SET',
      KLAP_API_URL: process.env.KLAP_API_URL || 'https://api.klap.app/v2',
      ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY ? 'SET (hidden)' : 'NOT SET',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET (hidden)' : 'NOT SET',
      WORKER_SECRET: process.env.WORKER_SECRET ? 'SET (hidden)' : 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
    }

    // Test Klap API connectivity (if key is set)
    let klapStatus: any = { status: 'not_tested', message: 'API key not configured' }
    if (process.env.KLAP_API_KEY) {
      try {
        const response = await fetch(`${envStatus.KLAP_API_URL}/tasks`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })
        
        klapStatus = {
          status: response.ok ? 'connected' : 'error',
          message: response.ok ? 'Klap API is accessible' : `HTTP ${response.status}: ${response.statusText}`,
          httpStatus: response.status,
          statusText: response.statusText
        }
      } catch (error) {
        klapStatus = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Connection failed'
        }
      }
    }

    // Test OpenAI connectivity (if key is set)
    let openaiStatus: any = { status: 'not_tested', message: 'API key not configured' }
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        })
        
        openaiStatus = {
          status: response.ok ? 'connected' : 'error',
          message: response.ok ? 'OpenAI API is accessible' : `HTTP ${response.status}: ${response.statusText}`,
          httpStatus: response.status
        }
      } catch (error) {
        openaiStatus = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Connection failed'
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envStatus,
      apiStatus: {
        klap: klapStatus,
        openai: openaiStatus
      },
      runtime: {
        platform: process.platform,
        nodeVersion: process.version,
        isVercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION || 'unknown'
      }
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Debug check failed' },
      { status: 500 }
    )
  }
} 