import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@upstash/qstash/nextjs'

// Vercel cron job configuration
export const maxDuration = 10
export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/klap
 * Triggered by Vercel cron or QStash to process Klap jobs
 */
async function handler(request: NextRequest) {
  try {
    console.log('[Cron] Triggering Klap worker')

    // Call the worker endpoint
    const workerUrl = new URL('/api/worker/klap', request.url)
    const response = await fetch(workerUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WORKER_SECRET}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Cron] Worker failed:', error)
      return NextResponse.json({ error: 'Worker failed' }, { status: 500 })
    }

    const result = await response.json()
    console.log('[Cron] Worker result:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'Cron job completed',
      workerResult: result
    })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron error' },
      { status: 500 }
    )
  }
}

// Export POST handler directly (QStash verification can be added later)
export const POST = handler

// Also support GET for manual triggering
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
  
  return handler(request)
} 