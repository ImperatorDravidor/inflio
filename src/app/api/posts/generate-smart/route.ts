import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'

/**
 * Thin trigger endpoint for post generation.
 * 
 * 1. Validates input + auth
 * 2. Creates a job in post_generation_jobs
 * 3. Fires off the worker (separate serverless invocation) via server-to-server fetch
 * 4. Returns the jobId immediately (<1s)
 * 
 * The client polls /api/posts/generation-status?jobId=xxx until complete,
 * then loads suggestions from /api/posts/suggestions.
 * 
 * This decouples the GPT-5.2 call from the client's HTTP request entirely.
 * Even if the client disconnects, the worker keeps running.
 */
export async function POST(req: NextRequest) {
  console.log('[generate-smart] Trigger received')

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const internalKey = req.headers.get('X-Internal-Key')
    const isInternalCall =
      internalKey === process.env.INTERNAL_API_KEY ||
      req.headers.get('user-agent')?.includes('node-fetch') ||
      req.headers.get('x-forwarded-for') === '::1' ||
      req.headers.get('x-forwarded-for') === '127.0.0.1'

    const { userId } = await auth()

    if (!userId && !isInternalCall) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, projectTitle, contentAnalysis, transcript, settings = {} } = body

    if (!projectId || !projectTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Resolve userId ──────────────────────────────────────────────────────
    let effectiveUserId = userId
    if (!userId && isInternalCall) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()
      if (project?.user_id) {
        effectiveUserId = project.user_id
      }
    }

    // ── Check for existing running job (prevent duplicates) ─────────────────
    const { data: existingJob } = await supabaseAdmin
      .from('post_generation_jobs')
      .select('id, status')
      .eq('project_id', projectId)
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingJob) {
      console.log('[generate-smart] Job already in progress:', existingJob.id)
      return NextResponse.json({
        success: true,
        jobId: existingJob.id,
        status: existingJob.status,
        message: 'Generation already in progress',
      })
    }

    // ── Create job record ───────────────────────────────────────────────────
    const jobId = uuidv4()

    const { error: jobError } = await supabaseAdmin
      .from('post_generation_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        user_id: effectiveUserId,
        job_type: 'batch_suggestions',
        status: 'pending',
        input_params: {
          projectId,
          projectTitle,
          contentAnalysis,
          transcript: transcript?.substring(0, 8000), // Truncate for storage, worker fetches full from DB if needed
          settings,
          userId: effectiveUserId,
        },
        total_items: 5, // Expected number of posts
        completed_items: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (jobError) {
      console.error('[generate-smart] Failed to create job:', jobError)
      return NextResponse.json({
        error: 'Failed to start generation',
        details: jobError.message,
      }, { status: 500 })
    }

    console.log('[generate-smart] Created job:', jobId)

    // ── Fire worker (separate serverless invocation) ────────────────────────
    // This creates a new function invocation on Vercel. The worker runs
    // independently with its own timeout. We don't await the response.
    const workerUrl = new URL('/api/posts/worker', req.url)

    fetch(workerUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({ jobId }),
    }).catch((err) => {
      // Log but don't fail — worst case the job stays pending and can be retried
      console.error('[generate-smart] Failed to trigger worker:', err)
    })

    // ── Return immediately ──────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Post generation started. Poll /api/posts/generation-status for progress.',
    })

  } catch (error) {
    console.error('[generate-smart] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start post generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
