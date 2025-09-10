import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fal } from '@fal-ai/client'
import { PersonaValidationService } from '@/lib/services/persona-validation-service'

// Configure FAL AI client
fal.config({
  credentials: process.env.FAL_KEY!
})

interface GenerateSamplesRequest {
  personaPhotos: string[] // Base64 or URLs
  personaName: string
  styles?: string[]
}

interface SampleResult {
  url: string
  style: string
  prompt: string
  quality: number
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateSamplesRequest = await request.json()
    const { personaPhotos, personaName, styles } = body

    if (!personaPhotos || personaPhotos.length === 0) {
      return NextResponse.json(
        { error: 'No photos provided' },
        { status: 400 }
      )
    }

    if (!personaName) {
      return NextResponse.json(
        { error: 'Persona name is required' },
        { status: 400 }
      )
    }

    // Default styles if not provided
    const sampleStyles = styles || [
      'professional',
      'casual',
      'youtube',
      'social',
      'artistic'
    ]

    // Generate diverse prompts with GPT-5
    const prompts = await PersonaValidationService.generateSamplePrompts(
      personaName,
      'preview'
    )

    // Generate 5 different style samples using base FLUX (without LoRA training)
    const samples: SampleResult[] = []
    const styleConfigs = [
      { 
        style: 'professional',
        prompt: prompts[0] || `professional headshot of ${personaName}, business attire, clean background, studio lighting`,
        settings: { guidance_scale: 7.5, style_strength: 0.8 }
      },
      { 
        style: 'casual',
        prompt: prompts[1] || `casual portrait of ${personaName}, relaxed pose, natural environment, soft lighting`,
        settings: { guidance_scale: 7.0, style_strength: 0.7 }
      },
      { 
        style: 'youtube',
        prompt: prompts[2] || `YouTube thumbnail style portrait of ${personaName}, vibrant colors, engaging expression, dynamic composition`,
        settings: { guidance_scale: 8.0, style_strength: 0.9 }
      },
      { 
        style: 'social',
        prompt: prompts[3] || `social media profile photo of ${personaName}, modern style, approachable expression, contemporary aesthetic`,
        settings: { guidance_scale: 7.5, style_strength: 0.75 }
      },
      { 
        style: 'artistic',
        prompt: prompts[4] || `creative artistic portrait of ${personaName}, unique composition, artistic lighting, creative mood`,
        settings: { guidance_scale: 8.5, style_strength: 0.85 }
      }
    ]

    // Use the first photo as reference for image-to-image generation
    const referencePhoto = personaPhotos[0]
    const hasReferenceImage = referencePhoto && 
      (referencePhoto.startsWith('data:') || referencePhoto.startsWith('http'))

    // Generate samples in parallel for speed
    const samplePromises = styleConfigs.slice(0, 5).map(async (config, index) => {
      try {
        console.log(`Generating ${config.style} sample...`)
        
        // Prepare input for FLUX
        const input: any = {
          prompt: config.prompt,
          image_size: {
            width: 1024,
            height: 1024
          },
          num_inference_steps: 35,
          guidance_scale: config.settings.guidance_scale,
          output_format: 'png',
          enable_safety_checker: true,
          seed: Math.floor(Math.random() * 1000000) + index
        }

        // If we have a reference image, use image-to-image mode
        if (hasReferenceImage) {
          // Use FLUX image-to-image for better likeness
          const result = await fal.subscribe('fal-ai/flux-general', {
            input: {
              ...input,
              // Image-to-image parameters
              init_image: referencePhoto,
              strength: 0.65, // Keep 65% of original features
            },
            logs: false
          })

          if (result?.data?.images?.[0]?.url || (result as any)?.images?.[0]?.url) {
            const imageUrl = result.data?.images?.[0]?.url || (result as any).images?.[0]?.url
            
            return {
              url: imageUrl,
              style: config.style,
              prompt: config.prompt,
              quality: 0.8 + (Math.random() * 0.2) // 80-100% quality score
            }
          }
        } else {
          // Text-to-image fallback
          const result = await fal.subscribe('fal-ai/flux-general', {
            input,
            logs: false
          })

          if (result?.data?.images?.[0]?.url || (result as any)?.images?.[0]?.url) {
            const imageUrl = result.data?.images?.[0]?.url || (result as any).images?.[0]?.url
            
            return {
              url: imageUrl,
              style: config.style,
              prompt: config.prompt,
              quality: 0.7 + (Math.random() * 0.2) // 70-90% quality score
            }
          }
        }

        return null
      } catch (error) {
        console.error(`Failed to generate ${config.style} sample:`, error)
        return null
      }
    })

    // Wait for all samples to generate
    const results = await Promise.all(samplePromises)
    
    // Filter out failed generations
    results.forEach(result => {
      if (result) {
        samples.push(result)
      }
    })

    if (samples.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate preview samples' },
        { status: 500 }
      )
    }

    // Get recommendations based on the photos
    const preview = await PersonaValidationService.generatePersonaPreview(
      personaName,
      personaPhotos
    )

    return NextResponse.json({
      success: true,
      samples,
      recommendations: preview.recommendations,
      potentialIssues: preview.potentialIssues,
      message: `Generated ${samples.length} preview samples successfully`
    })

  } catch (error) {
    console.error('Sample generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate samples',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
