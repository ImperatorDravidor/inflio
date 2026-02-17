import { NextRequest, NextResponse } from 'next/server'
import { KlapJobQueue } from '@/lib/redis'
import { inngest } from '@/inngest/client'

// Vercel cron job configuration
export const maxDuration = 10
export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/klap
 * Triggered by Vercel cron every 5 minutes.
 * Picks jobs from Redis queue and sends them to Inngest for durable processing.
 */
async function handler(request: NextRequest) {
  try {
    console.log('[Cron:Klap] Checking for queued jobs')

    // Clean up stale jobs
    const cleanedCount = await KlapJobQueue.cleanupStaleJobs()
    if (cleanedCount > 0) {
      console.log(`[Cron:Klap] Cleaned up ${cleanedCount} stale jobs`)
    }

    // Get next job from Redis queue
    const job = await KlapJobQueue.getNextJob()
    if (!job) {
      return NextResponse.json({ message: 'No jobs to process' })
    }

    console.log(`[Cron:Klap] Found job ${job.id}, sending to Inngest`)

    // Send to Inngest for durable processing (survives 15+ min)
    await inngest.send({
      name: 'klap/video.process',
      data: {
        jobId: job.id,
        projectId: job.projectId,
        videoUrl: job.videoUrl
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Job dispatched to Inngest',
      jobId: job.id
    })
  } catch (error) {
    console.error('[Cron:Klap] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron error' },
      { status: 500 }
    )
  }
}

export const POST = handler

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
  return handler(request)
} 