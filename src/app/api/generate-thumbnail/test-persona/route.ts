import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { FALService } from '@/lib/services/fal-ai-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { personaId, prompt, title } = body

    if (!personaId || !prompt) {
      return NextResponse.json(
        { error: 'Persona ID and prompt are required' },
        { status: 400 }
      )
    }

    // Get persona details including LoRA model URL
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .eq('user_id', userId)
      .single()

    if (personaError || !persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      )
    }

    if (persona.status !== 'trained') {
      return NextResponse.json(
        { error: 'Persona is not trained yet' },
        { status: 400 }
      )
    }

    // Check if we have the LoRA model URL
    // Note: The training output shows completion but we need to verify the URL is stored
    if (!persona.lora_model_url && !persona.model_ref) {
      // Try to fetch from training jobs
      const { data: job } = await supabaseAdmin
        .from('lora_training_jobs')
        .select('lora_model_url, lora_config_url')
        .eq('persona_id', personaId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (!job?.lora_model_url) {
        return NextResponse.json(
          { error: 'LoRA model URL not found. Training may not have completed properly.' },
          { status: 500 }
        )
      }

      // Update persona with the LoRA URL
      await supabaseAdmin
        .from('personas')
        .update({
          lora_model_url: job.lora_model_url,
          lora_config_url: job.lora_config_url,
          model_ref: job.lora_model_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', personaId)

      persona.lora_model_url = job.lora_model_url
    }

    const loraUrl = persona.lora_model_url || persona.model_ref
    const triggerPhrase = persona.lora_trigger_phrase || `photo of ${persona.name.toLowerCase()}`

    // Generate thumbnail with persona LoRA
    console.log('Generating thumbnail with persona:', {
      personaId,
      loraUrl,
      triggerPhrase
    })

    // Enhance prompt with trigger phrase
    const enhancedPrompt = `${triggerPhrase}, ${prompt}, professional studio lighting, high quality, sharp focus, 8k`

    try {
      // Generate image using FAL with LoRA
      const imageUrl = await FALService.generateWithPersona(
        enhancedPrompt,
        loraUrl,
        {
          imageSize: 'landscape_16_9', // YouTube thumbnail aspect ratio
          numInferenceSteps: 28,
          guidanceScale: 3.5,
          seed: Math.floor(Math.random() * 1000000)
        }
      )

      // Save to thumbnail history
      const { data: thumbnail } = await supabaseAdmin
        .from('thumbnail_history')
        .insert({
          user_id: userId,
          type: 'persona-test',
          prompt: enhancedPrompt,
          base_prompt: prompt,
          model: 'flux-lora',
          lora_ref: loraUrl,
          output_url: imageUrl,
          status: 'completed',
          created_by: userId
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        url: imageUrl,
        thumbnailId: thumbnail?.id,
        message: 'Thumbnail generated successfully with persona!'
      })
    } catch (falError) {
      console.error('FAL generation error:', falError)
      return NextResponse.json(
        { 
          error: 'Failed to generate thumbnail', 
          details: falError instanceof Error ? falError.message : 'Unknown error',
          suggestion: 'Make sure FAL_API_KEY is configured in your environment variables'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test persona thumbnail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}