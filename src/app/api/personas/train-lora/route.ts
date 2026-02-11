import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      personaId,
      imagesDataUrl,
      triggerPhrase,
      learningRate = 0.00009,
      steps = 2500,
      multiresolutionTraining = true,
      subjectCrop = true,
      createMasks = false
    } = body

    if (!personaId || !imagesDataUrl) {
      return NextResponse.json(
        { error: 'Persona ID and images data URL are required' },
        { status: 400 }
      )
    }

    // Verify persona belongs to user
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .select('id, name')
      .eq('id', personaId)
      .eq('user_id', userId)
      .single()

    if (personaError || !persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      )
    }

    // Create training job record
    const { data: job, error: jobError } = await supabaseAdmin
      .from('lora_training_jobs')
      .insert({
        user_id: userId,
        persona_id: personaId,
        images_data_url: imagesDataUrl,
        trigger_phrase: triggerPhrase || `photo of ${persona.name}`,
        learning_rate: learningRate,
        steps,
        multiresolution_training: multiresolutionTraining,
        subject_crop: subjectCrop,
        create_masks: createMasks,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create training job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create training job' },
        { status: 500 }
      )
    }

    // Send to Inngest — training runs as durable background steps (10-30 min safe)
    await inngest.send({
      name: 'persona/train.lora',
      data: {
        jobId: job.id,
        personaId,
        userId,
        imagesDataUrl,
        triggerPhrase: triggerPhrase || `photo of ${persona.name}`,
        learningRate,
        steps,
        multiresolutionTraining,
        subjectCrop,
        createMasks
      }
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'LoRA training started. This may take 10-30 minutes.'
    })
  } catch (error) {
    console.error('LoRA training error:', error)
    return NextResponse.json(
      { error: 'Failed to start LoRA training' },
      { status: 500 }
    )
  }
}

// GET endpoint to check training status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const personaId = searchParams.get('personaId')

    if (jobId) {
      // Get specific job status
      const { data: job, error } = await supabaseAdmin
        .from('lora_training_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single()

      if (error || !job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(job)
    } else if (personaId) {
      // Get latest job for persona
      const { data: jobs, error } = await supabaseAdmin
        .from('lora_training_jobs')
        .select('*')
        .eq('persona_id', personaId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch training jobs' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        latestJob: jobs[0] || null
      })
    } else {
      // Get all jobs for user
      const { data: jobs, error } = await supabaseAdmin
        .from('lora_training_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch training jobs' },
          { status: 500 }
        )
      }

      return NextResponse.json({ jobs })
    }
  } catch (error) {
    console.error('Error fetching training status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training status' },
      { status: 500 }
    )
  }
}
