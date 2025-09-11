import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const { data: job, error } = await supabaseAdmin
      .from('post_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Optional: authorize job ownership
    if (job.user_id && job.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const total = job.total_items || 0
    const completed = job.completed_items || 0
    let progress = 0

    if (total > 0) {
      progress = Math.round((completed / total) * 100)
    } else if (job.status === 'completed') {
      progress = 100
    }

    return NextResponse.json({
      success: true,
      status: job.status,
      progress,
      completedItems: completed,
      totalItems: total
    })
  } catch (err) {
    console.error('Error fetching job status:', err)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}

// Removed duplicate route and imports below to prevent redeclaration errors