import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fal } from "@fal-ai/client"

// Configure FAL AI client
fal.config({
  credentials: process.env.FAL_KEY!
})

const samplePrompts = [
  {
    style: 'professional_headshot',
    prompt: 'professional headshot, studio lighting, business attire, neutral background, confident expression, corporate photography'
  },
  {
    style: 'casual_portrait',
    prompt: 'casual portrait, natural lighting, relaxed pose, outdoor setting, friendly smile, lifestyle photography'
  },
  {
    style: 'youtube_thumbnail',
    prompt: 'YouTube thumbnail style, excited expression, vibrant background, high energy, eye-catching, dynamic pose'
  },
  {
    style: 'social_media_profile',
    prompt: 'social media profile photo, friendly smile, approachable, modern setting, warm lighting, authentic'
  },
  {
    style: 'creative_artistic',
    prompt: 'artistic portrait, creative lighting, unique angle, stylized, dramatic shadows, professional photography'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personaId } = await request.json()
    
    if (!personaId) {
      return NextResponse.json({ error: 'Persona ID required' }, { status: 400 })
    }

    // Verify persona belongs to user and get details
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .eq('user_id', userId)
      .single()

    if (personaError || !persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Check if persona is trained
    if (persona.status !== 'trained' || !persona.metadata?.lora_model_url) {
      return NextResponse.json({ 
        error: 'Persona not ready. Training must be completed first.' 
      }, { status: 400 })
    }

    const loraModelUrl = persona.metadata.lora_model_url
    const triggerPhrase = persona.metadata.lora_trigger_phrase || persona.name

    console.log('Generating display samples for persona:', {
      personaId,
      triggerPhrase,
      loraModelUrl
    })

    // Generate samples in parallel
    const sampleGenerationPromises = samplePrompts.map(async ({ style, prompt }) => {
      try {
        const fullPrompt = `${triggerPhrase}, ${prompt}`
        
        const result = await fal.subscribe("fal-ai/flux-lora", {
          input: {
            prompt: fullPrompt,
            loras: [{
              path: loraModelUrl,
              scale: 1.0
            }],
            image_size: { 
              width: 1024, 
              height: 1024 
            },
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            output_format: "png",
            enable_safety_checker: true
          },
          logs: true
        }) as any

        const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url
        
        if (!imageUrl) {
          console.error(`Failed to generate sample for style ${style}`)
          return null
        }

        return {
          style,
          url: imageUrl,
          prompt: fullPrompt
        }
      } catch (error) {
        console.error(`Error generating sample for style ${style}:`, error)
        return null
      }
    })

    const samples = await Promise.all(sampleGenerationPromises)
    const validSamples = samples.filter(s => s !== null)

    if (validSamples.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to generate any samples' 
      }, { status: 500 })
    }

    // Store samples in database
    const { error: updateError } = await supabaseAdmin
      .from('personas')
      .update({
        metadata: {
          ...persona.metadata,
          sample_images: validSamples
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', personaId)

    if (updateError) {
      console.error('Error updating persona with samples:', updateError)
      // Still return samples even if storage fails
    }

    return NextResponse.json({
      success: true,
      samples: validSamples,
      personaId
    })
  } catch (error) {
    console.error('Error generating display samples:', error)
    return NextResponse.json({ 
      error: 'Failed to generate display samples' 
    }, { status: 500 })
  }
}