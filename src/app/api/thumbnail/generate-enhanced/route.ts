import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { v4 as uuidv4 } from 'uuid'
// import sharp from 'sharp' // Commented out - not compatible with edge runtime

// Configure FAL AI
fal.config({
  credentials: process.env.FAL_KEY!
})

export const maxDuration = 60

// Platform specifications for optimal generation
const PLATFORM_CONFIGS = {
  youtube: {
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    model: 'fal-ai/flux/schnell', // Fast for YouTube
    steps: 4,
    guidance: 3.5
  },
  instagram: {
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    model: 'fal-ai/flux/dev',
    steps: 28,
    guidance: 7.5
  },
  linkedin: {
    width: 1200,
    height: 628,
    aspectRatio: '1.91:1',
    model: 'fal-ai/flux/dev',
    steps: 28,
    guidance: 7.5
  },
  universal: {
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    model: 'fal-ai/flux/pro',
    steps: 50,
    guidance: 7.5
  }
}

// Style parameters for different presets
const STYLE_PARAMS = {
  modern: {
    prompt_suffix: ', clean modern design, minimalist, professional, high contrast',
    guidance_scale: 7.5,
    num_inference_steps: 28
  },
  classic: {
    prompt_suffix: ', classic composition, timeless design, balanced, professional',
    guidance_scale: 7.0,
    num_inference_steps: 25
  },
  minimal: {
    prompt_suffix: ', minimal design, lots of white space, simple, focused',
    guidance_scale: 6.5,
    num_inference_steps: 20
  },
  bold: {
    prompt_suffix: ', bold dramatic design, high impact, attention-grabbing, vibrant',
    guidance_scale: 8.5,
    num_inference_steps: 35
  },
  artistic: {
    prompt_suffix: ', artistic creative design, unique aesthetic, stylized',
    guidance_scale: 9.0,
    num_inference_steps: 40
  },
  dramatic: {
    prompt_suffix: ', cinematic dramatic lighting, emotional, powerful composition',
    guidance_scale: 8.0,
    num_inference_steps: 35
  },
  vibrant: {
    prompt_suffix: ', vibrant colorful design, energetic, dynamic, eye-catching',
    guidance_scale: 8.5,
    num_inference_steps: 30
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      projectId,
      prompt,
      settings = {},
      projectContext,
      videoFrameUrl
    } = body

    if (!projectId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract settings with defaults
    const {
      style = 'modern',
      quality = 'balanced',
      platform = 'youtube',
      includePersona = false,
      personaBlendStrength = 50,
      textSpace = 'moderate',
      colorPalette = 'auto'
    } = settings

    // Get platform configuration
    const platformConfig = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]
    const styleParams = STYLE_PARAMS[style as keyof typeof STYLE_PARAMS]

    // Start generation record in database
    const generationId = uuidv4()
    const { error: insertError } = await supabaseAdmin
      .from('thumbnail_generations')
      .insert({
        id: generationId,
        project_id: projectId,
        user_id: userId,
        prompt,
        style,
        quality,
        platform,
        status: 'processing',
        width: platformConfig.width,
        height: platformConfig.height,
        model: platformConfig.model,
        settings: settings
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to start generation' },
        { status: 500 }
      )
    }

    // Enhance prompt with AI
    const openai = getOpenAI()
    const enhancedPrompt = await enhancePromptWithAI(
      prompt,
      projectContext,
      platform,
      style,
      openai
    )

    // Build final prompt with all enhancements
    let finalPrompt = enhancedPrompt + styleParams.prompt_suffix

    // Add platform-specific optimizations
    if (platform === 'youtube') {
      finalPrompt += ', YouTube thumbnail style, clickbait worthy, high CTR design'
    } else if (platform === 'instagram') {
      finalPrompt += ', Instagram ready, square format, mobile optimized'
    } else if (platform === 'linkedin') {
      finalPrompt += ', professional LinkedIn post image, business appropriate'
    }

    // Add text space considerations
    if (textSpace === 'minimal') {
      finalPrompt += ', small area reserved for text overlay'
    } else if (textSpace === 'moderate') {
      finalPrompt += ', clear space for text overlay, balanced composition'
    } else if (textSpace === 'maximum') {
      finalPrompt += ', large clear area for text, minimal background elements'
    }

    // Prepare generation parameters
    const generationParams: any = {
      prompt: finalPrompt,
      image_size: {
        width: platformConfig.width,
        height: platformConfig.height
      },
      num_inference_steps: quality === 'fast' ? 4 : 
                           quality === 'balanced' ? styleParams.num_inference_steps :
                           styleParams.num_inference_steps * 1.5,
      guidance_scale: styleParams.guidance_scale,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'png',
      expand_prompt: true,
      seed: Math.floor(Math.random() * 1000000)
    }

    // Add persona if requested
    if (includePersona) {
      const persona = await getPersonaLoRA(userId)
      if (persona) {
        generationParams.loras = [{
          path: persona.model_ref,
          scale: personaBlendStrength / 100
        }]
      }
    }

    // Use video frame as reference if provided
    if (videoFrameUrl) {
      generationParams.image_url = videoFrameUrl
      generationParams.strength = 0.7 // Keep some similarity to original
    }

    console.log('Generating thumbnail with params:', {
      model: platformConfig.model,
      platform,
      style,
      quality,
      dimensions: `${platformConfig.width}x${platformConfig.height}`
    })

    // Generate with FAL AI
    let result: any
    const startTime = Date.now()

    try {
      result = await fal.subscribe(platformConfig.model, {
        input: generationParams,
        logs: true,
        onQueueUpdate: (update) => {
          console.log('Generation progress:', update)
        }
      })
    } catch (falError: any) {
      console.error('FAL generation error:', falError)
      
      // Fallback to OpenAI DALL-E
      if (process.env.OPENAI_API_KEY) {
        try {
          const openaiResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: finalPrompt,
            n: 1,
            size: platform === 'instagram' ? '1024x1024' : '1792x1024',
            quality: quality === 'high' ? 'hd' : 'standard',
            style: 'vivid'
          })
          
          if (openaiResponse.data && openaiResponse.data[0]?.url) {
            result = {
              images: [{
                url: openaiResponse.data[0].url,
                content_type: 'image/png',
                width: platform === 'instagram' ? 1024 : 1792,
                height: platform === 'instagram' ? 1024 : 1024
            }]
          }
          } else {
            throw new Error('No image URL in OpenAI response')
          }
        } catch (openaiError) {
          console.error('OpenAI fallback failed:', openaiError)
          
          // Update status to failed
          await supabaseAdmin
            .from('thumbnail_generations')
            .update({
              status: 'failed',
              error_message: 'All generation services failed'
            })
            .eq('id', generationId)
          
          throw new Error('Generation failed')
        }
      } else {
        throw falError
      }
    }

    const processingTime = Date.now() - startTime

    if (!result?.images?.[0]?.url) {
      throw new Error('No image generated')
    }

    const generatedImageUrl = result.images[0].url

    // Download and optimize image
    const imageResponse = await fetch(generatedImageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    
    // Convert to buffer (sharp optimization commented out due to edge runtime compatibility)
    const optimizedBuffer = Buffer.from(imageBuffer)
    // Note: Image resizing would need to be done via a separate API or service
    // if (platform !== 'universal') {
    //   optimizedBuffer = await sharp(Buffer.from(imageBuffer))
    //     .resize(platformConfig.width, platformConfig.height, { fit: 'cover' })
    //     .png({ quality: 90 })
    //     .toBuffer()
    // }

    // Upload to Supabase storage
    const fileName = `thumbnails/${projectId}/${generationId}.png`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('ai-generated-images')
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('ai-generated-images')
      .getPublicUrl(fileName)

    // Generate text overlay suggestions
    const textSuggestions = await generateTextSuggestions(
      projectContext,
      platform,
      openai
    )

    // Analyze for initial performance prediction
    const performanceScore = await predictPerformance(
      finalPrompt,
      platform,
      style
    )

    // Update database with success
    const { data: updatedGeneration, error: updateError } = await supabaseAdmin
      .from('thumbnail_generations')
      .update({
        url: publicUrl,
        storage_path: fileName,
        enhanced_prompt: finalPrompt,
        status: 'completed',
        processing_time_ms: processingTime,
        file_size: optimizedBuffer.length,
        seed: generationParams.seed,
        performance_score: performanceScore,
        metadata: {
          model: platformConfig.model,
          original_url: generatedImageUrl,
          text_suggestions: textSuggestions,
          generation_params: generationParams
        }
      })
      .eq('id', generationId)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
    }

    // Store text suggestions
    if (textSuggestions.length > 0) {
      await supabaseAdmin
        .from('thumbnail_text_overlays')
        .insert(
          textSuggestions.map((text, index) => ({
            generation_id: generationId,
            text_content: text,
            position: 'center',
            is_primary: index === 0
          }))
        )
    }

    // Track analytics event
    await trackGenerationEvent(userId, projectId, generationId, platform, style)

    return NextResponse.json({
      success: true,
      id: generationId,
      url: publicUrl,
      prompt: prompt,
      enhancedPrompt: finalPrompt,
      textSuggestions,
      metadata: {
        model: platformConfig.model,
        seed: generationParams.seed,
        processingTime,
        dimensions: {
          width: platformConfig.width,
          height: platformConfig.height
        },
        performanceScore
      }
    })

  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json(
      { 
        error: 'Generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function enhancePromptWithAI(
  basePrompt: string,
  projectContext: any,
  platform: string,
  style: string,
  openai: any
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert thumbnail designer. Enhance prompts for ${platform} thumbnails in ${style} style.
          Focus on: visual impact, platform best practices, clear composition, and high CTR elements.`
        },
        {
          role: 'user',
          content: `Base prompt: ${basePrompt}
          Project context: ${JSON.stringify(projectContext || {})}
          
          Create an enhanced, detailed prompt for image generation.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })

    return response.choices[0].message.content || basePrompt
  } catch (error) {
    console.error('Prompt enhancement error:', error)
    return basePrompt
  }
}

async function generateTextSuggestions(
  projectContext: any,
  platform: string,
  openai: any
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Generate compelling text overlays for ${platform} thumbnails. Keep them short, punchy, and intriguing.`
        },
        {
          role: 'user',
          content: `Project: ${JSON.stringify(projectContext || {})}
          
          Generate 4 text overlay options. Output as JSON array.`
        }
      ],
      temperature: 0.8,
      max_tokens: 150,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result.suggestions || []
  } catch (error) {
    console.error('Text suggestion error:', error)
    return []
  }
}

async function getPersonaLoRA(userId: string) {
  const { data: persona } = await supabaseAdmin
    .from('personas')
    .select('id, model_ref, status')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .single()
  
  return persona
}

async function predictPerformance(
  prompt: string,
  platform: string,
  style: string
): Promise<number> {
  // Simple heuristic-based performance prediction
  // In production, this would use ML models trained on historical data
  
  let score = 50 // Base score
  
  // Platform bonuses
  if (platform === 'youtube') score += 10
  if (platform === 'instagram') score += 5
  
  // Style bonuses
  if (style === 'bold' || style === 'vibrant') score += 15
  if (style === 'minimal') score += 5
  
  // Prompt quality indicators
  if (prompt.includes('face') || prompt.includes('person')) score += 10
  if (prompt.includes('bright') || prompt.includes('colorful')) score += 5
  if (prompt.includes('text') || prompt.includes('title')) score += 5
  
  return Math.min(score, 95)
}

async function trackGenerationEvent(
  userId: string,
  projectId: string,
  generationId: string,
  platform: string,
  style: string
) {
  // Track event for analytics
  // In production, this would send to analytics service
  console.log('Tracking generation event:', {
    userId,
    projectId,
    generationId,
    platform,
    style,
    timestamp: new Date().toISOString()
  })
}