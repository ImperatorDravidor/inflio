import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET: Check generation job status by jobId or projectId.
 * The client polls this every few seconds after triggering generation.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const projectId = searchParams.get('projectId')

    if (!jobId && !projectId) {
      return NextResponse.json({ error: 'jobId or projectId required' }, { status: 400 })
    }

    // Look up by jobId (preferred) or by projectId (fallback, gets latest job)
    let query = supabaseAdmin
      .from('post_generation_jobs')
      .select('id, status, completed_items, total_items, error_message, created_at, completed_at')

    if (jobId) {
      query = query.eq('id', jobId)
    } else {
      query = query
        .eq('project_id', projectId!)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    const { data: job, error } = await query.single()

    if (error || !job) {
      return NextResponse.json({ status: 'idle', jobId: null })
    }

    // If a job has been "running" for more than 3 minutes, it's stuck — mark it failed
    if (job.status === 'running') {
      const runningFor = Date.now() - new Date(job.created_at).getTime()
      if (runningFor > 3 * 60 * 1000) {
        await supabaseAdmin
          .from('post_generation_jobs')
          .update({
            status: 'failed',
            error_message: 'Job timed out after 3 minutes',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id)

        return NextResponse.json({
          status: 'failed',
          jobId: job.id,
          error: 'Generation timed out. Please try again.',
        })
      }
    }

    return NextResponse.json({
      status: job.status,
      jobId: job.id,
      completedItems: job.completed_items,
      totalItems: job.total_items,
      error: job.error_message || null,
      completedAt: job.completed_at || null,
    })
  } catch (error) {
    console.error('Error checking generation status:', error)
    return NextResponse.json({ status: 'idle', jobId: null })
  }
}
