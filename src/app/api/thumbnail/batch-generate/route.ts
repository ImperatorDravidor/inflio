import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import { inngest } from '@/inngest/client'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      projectId,
      prompts = [],
      settings = {},
      platforms = ['youtube']
    } = body

    if (!projectId || prompts.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Limit batch size
    if (prompts.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 thumbnails per batch' },
        { status: 400 }
      )
    }

    // Check user quota
    const { data: usage } = await supabaseAdmin
      .from('user_usage')
      .select('thumbnails_generated, thumbnails_limit')
      .eq('user_id', userId)
      .single()

    if (usage && usage.thumbnails_generated + prompts.length > usage.thumbnails_limit) {
      return NextResponse.json(
        { error: 'Thumbnail generation limit exceeded' },
        { status: 429 }
      )
    }

    // Create batch job record
    const batchId = uuidv4()
    const batchJobs = []

    // Create job configurations for each prompt and platform combination
    for (const prompt of prompts) {
      for (const platform of platforms) {
        batchJobs.push({
          prompt,
          platform,
          settings: { ...settings, platform }
        })
      }
    }

    // Insert batch job record
    const { error: batchError } = await supabaseAdmin
      .from('thumbnail_batch_jobs')
      .insert({
        id: batchId,
        project_id: projectId,
        user_id: userId,
        prompts: prompts,
        settings: settings,
        platform: platforms.join(','),
        total_count: batchJobs.length,
        status: 'pending'
      })

    if (batchError) {
      console.error('Batch job creation error:', batchError)
      return NextResponse.json(
        { error: 'Failed to create batch job' },
        { status: 500 }
      )
    }

    // Queue generation jobs with Inngest
    await inngest.send({
      name: 'thumbnail.batch.generate',
      data: {
        batchId,
        projectId,
        userId,
        jobs: batchJobs
      }
    })

    // Start processing immediately (non-blocking)
    processBatchInBackground(batchId, projectId, userId, batchJobs)

    return NextResponse.json({
      success: true,
      batchId,
      totalJobs: batchJobs.length,
      message: 'Batch generation started',
      estimatedTime: batchJobs.length * 15 // 15 seconds per thumbnail estimate
    })

  } catch (error) {
    console.error('Batch generation error:', error)
    return NextResponse.json(
      { error: 'Failed to start batch generation' },
      { status: 500 }
    )
  }
}

// GET endpoint to check batch status
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get('batchId')

    if (!batchId) {
      // Return all batch jobs for user
      const { data: batches, error } = await supabaseAdmin
        .from('thumbnail_batch_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      return NextResponse.json({ batches: batches || [] })
    }

    // Get specific batch job with generations
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('thumbnail_batch_jobs')
      .select('*')
      .eq('id', batchId)
      .eq('user_id', userId)
      .single()

    if (batchError) {
      if (batchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
      }
      throw batchError
    }

    // Get generated thumbnails for this batch
    let generations = []
    if (batch.generation_ids && batch.generation_ids.length > 0) {
      const { data } = await supabaseAdmin
        .from('thumbnail_generations')
        .select('*')
        .in('id', batch.generation_ids)
        .order('created_at', { ascending: false })

      generations = data || []
    }

    return NextResponse.json({
      batch,
      generations,
      progress: {
        completed: batch.completed_count,
        failed: batch.failed_count,
        total: batch.total_count,
        percentage: Math.round((batch.completed_count / batch.total_count) * 100)
      }
    })

  } catch (error) {
    console.error('Get batch status error:', error)
    return NextResponse.json(
      { error: 'Failed to get batch status' },
      { status: 500 }
    )
  }
}

// Background processing function
async function processBatchInBackground(
  batchId: string,
  projectId: string,
  userId: string,
  jobs: any[]
) {
  const generationIds: string[] = []
  let completedCount = 0
  let failedCount = 0

  // Update batch status to processing
  await supabaseAdmin
    .from('thumbnail_batch_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', batchId)

  // Process each job
  for (const job of jobs) {
    try {
      // Call the main generation endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/thumbnail/generate-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` // Internal API key for service-to-service
        },
        body: JSON.stringify({
          projectId,
          prompt: job.prompt,
          settings: job.settings
        })
      })

      if (response.ok) {
        const data = await response.json()
        generationIds.push(data.id)
        completedCount++
      } else {
        failedCount++
      }

      // Update progress
      await supabaseAdmin
        .from('thumbnail_batch_jobs')
        .update({
          completed_count: completedCount,
          failed_count: failedCount,
          generation_ids: generationIds
        })
        .eq('id', batchId)

    } catch (error) {
      console.error('Job processing error:', error)
      failedCount++
    }

    // Add delay between generations to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Update final status
  await supabaseAdmin
    .from('thumbnail_batch_jobs')
    .update({
      status: failedCount === jobs.length ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      generation_ids: generationIds
    })
    .eq('id', batchId)

  // Update user usage
  if (completedCount > 0) {
    await supabaseAdmin
      .rpc('increment_usage', {
        user_id: userId,
        field: 'thumbnails_generated',
        amount: completedCount
      })
  }
}