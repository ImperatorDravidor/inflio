import { NextRequest, NextResponse } from 'next/server'
import { KlapJobQueue } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/worker/cleanup
 * Clean up stale jobs from Redis
 */
export async function GET(request: NextRequest) {
  try {
    // Check auth via query param or header for cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    
    const isAuthorized = 
      authHeader === `Bearer ${process.env.WORKER_SECRET}` ||
      cronSecret === process.env.CRON_SECRET ||
      process.env.NODE_ENV === 'development'
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Cleanup] Starting Redis job cleanup...')
    
    // Clean up stale jobs
    const cleanedCount = await KlapJobQueue.cleanupStaleJobs()
    
    console.log(`[Cleanup] Cleaned up ${cleanedCount} stale jobs`)
    
    return NextResponse.json({
      success: true,
      cleanedJobs: cleanedCount,
      message: `Cleaned up ${cleanedCount} stale jobs`
    })
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    )
  }
} 