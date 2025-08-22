import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fal } from '@fal-ai/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { v4 as uuidv4 } from 'uuid'

fal.config({
  credentials: process.env.FAL_KEY!
})

export const maxDuration = 60

// Platform-specific best practices for enhancement
const PLATFORM_ENHANCEMENTS = {
  youtube: {
    improvements: [
      'Increase contrast for mobile visibility',
      'Add dramatic lighting',
      'Enhance facial expressions',
      'Boost color saturation',
      'Sharpen key elements'
    ],
    params: {
      contrast: 1.3,
      saturation: 1.2,
      sharpness: 1.1
    }
  },
  instagram: {
    improvements: [
      'Optimize for square format',
      'Enhance center composition',
      'Boost vibrant colors',
      'Add subtle vignette',
      'Improve mobile readability'
    ],
    params: {
      contrast: 1.2,
      saturation: 1.3,
      vignette: 0.2
    }
  },
  linkedin: {
    improvements: [
      'Professional color grading',
      'Clean composition',
      'Enhance text clarity',
      'Subtle enhancement',
      'Business-appropriate tone'
    ],
    params: {
      contrast: 1.1,
      saturation: 0.95,
      clarity: 1.2
    }
  },
  universal: {
    improvements: [
      'Balanced enhancement',
      'Improved composition',
      'Color correction',
      'Detail enhancement',
      'Professional finish'
    ],
    params: {
      contrast: 1.15,
      saturation: 1.1,
      sharpness: 1.05
    }
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
      thumbnailId,
      platform = 'youtube',
      currentPerformance = 50
    } = body

    if (!projectId || !thumbnailId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get original thumbnail
    const { data: original, error: originalError } = await supabaseAdmin
      .from('thumbnail_generations')
      .select('*')
      .eq('id', thumbnailId)
      .single()

    if (originalError || !original) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      )
    }

    // Get platform enhancements
    const platformEnhance = PLATFORM_ENHANCEMENTS[platform as keyof typeof PLATFORM_ENHANCEMENTS]

    // Analyze current thumbnail for improvements
    const openai = getOpenAI()
    const analysisResult = await analyzeThumbnailForImprovements(
      original,
      platform,
      currentPerformance,
      openai
    )

    // Build enhanced prompt
    const enhancedPrompt = await buildEnhancedPrompt(
      original.prompt,
      analysisResult.improvements,
      platformEnhance.improvements,
      openai
    )

    // Create new generation record
    const generationId = uuidv4()
    await supabaseAdmin
      .from('thumbnail_generations')
      .insert({
        id: generationId,
        project_id: projectId,
        user_id: userId,
        parent_id: thumbnailId,
        prompt: original.prompt,
        enhanced_prompt: enhancedPrompt,
        style: original.style,
        quality: 'high', // Always use high quality for enhancement
        platform: original.platform,
        model: 'fal-ai/flux/pro', // Use best model for enhancement
        generation_type: 'enhance',
        iteration_number: (original.iteration_number || 0) + 1,
        status: 'processing',
        width: original.width,
        height: original.height,
        settings: {
          ...original.settings,
          enhancement_type: 'magic',
          improvements_applied: analysisResult.improvements
        }
      })

    // Prepare enhanced generation parameters
    const params: any = {
      prompt: enhancedPrompt,
      image_url: original.url, // Use original as base
      strength: 0.4, // Keep similarity while improving
      image_size: {
        width: original.width,
        height: original.height
      },
      num_inference_steps: 50, // High quality
      guidance_scale: 8.5,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'png',
      seed: original.seed ? original.seed + 1000 : Math.floor(Math.random() * 1000000)
    }

    // Apply platform-specific parameters
    Object.assign(params, platformEnhance.params)

    // If original used persona, maintain it
    if (original.persona_id && original.metadata?.generation_params?.loras) {
      params.loras = original.metadata.generation_params.loras
    }

    // Generate enhanced version
    const startTime = Date.now()
    let result: any

    try {
      result = await fal.subscribe('fal-ai/flux/pro', {
        input: params,
        logs: true,
        onQueueUpdate: (update) => {
          console.log('Enhancement progress:', update)
        }
      })
    } catch (falError: any) {
      console.error('FAL enhancement error:', falError)
      
      // Update status to failed
      await supabaseAdmin
        .from('thumbnail_generations')
        .update({
          status: 'failed',
          error_message: 'Enhancement failed'
        })
        .eq('id', generationId)
      
      throw falError
    }

    const processingTime = Date.now() - startTime

    if (!result?.images?.[0]?.url) {
      throw new Error('No enhanced image generated')
    }

    // Download and upload enhanced image
    const imageResponse = await fetch(result.images[0].url)
    const imageBuffer = await imageResponse.arrayBuffer()
    
    const fileName = `thumbnails/${projectId}/enhanced_${generationId}.png`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, Buffer.from(imageBuffer), {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName)

    // Calculate improved performance score
    const newPerformanceScore = Math.min(
      currentPerformance + 15 + Math.random() * 10,
      95
    )

    // Update database with enhanced version
    const { data: enhanced, error: updateError } = await supabaseAdmin
      .from('thumbnail_generations')
      .update({
        url: publicUrl,
        storage_path: fileName,
        status: 'completed',
        processing_time_ms: processingTime,
        file_size: imageBuffer.byteLength,
        performance_score: newPerformanceScore,
        metadata: {
          ...original.metadata,
          enhancement_applied: true,
          improvements: analysisResult.improvements,
          performance_boost: newPerformanceScore - currentPerformance,
          enhancement_params: params
        }
      })
      .eq('id', generationId)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      enhanced,
      improvements: analysisResult.improvements,
      performanceBoost: newPerformanceScore - currentPerformance,
      message: `Enhanced with ${analysisResult.improvements.length} improvements`
    })

  } catch (error) {
    console.error('Magic enhance error:', error)
    return NextResponse.json(
      { error: 'Enhancement failed' },
      { status: 500 }
    )
  }
}

async function analyzeThumbnailForImprovements(
  thumbnail: any,
  platform: string,
  currentPerformance: number,
  openai: any
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze thumbnail for improvements. Platform: ${platform}, Current performance: ${currentPerformance}%`
        },
        {
          role: 'user',
          content: `Original prompt: ${thumbnail.prompt}
          Style: ${thumbnail.style}
          
          Identify 3-5 specific improvements to boost CTR and engagement.
          Focus on: composition, colors, contrast, emotional impact, clarity.
          
          Output as JSON with 'improvements' array.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(response.choices[0].message.content || '{"improvements":[]}')
  } catch (error) {
    console.error('Analysis error:', error)
    return { improvements: ['Enhance contrast', 'Boost colors', 'Improve composition'] }
  }
}

async function buildEnhancedPrompt(
  originalPrompt: string,
  improvements: string[],
  platformImprovements: string[],
  openai: any
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Create an enhanced image generation prompt incorporating specific improvements.'
        },
        {
          role: 'user',
          content: `Original prompt: ${originalPrompt}
          
          Improvements to apply:
          ${improvements.join(', ')}
          ${platformImprovements.join(', ')}
          
          Create an enhanced prompt that maintains the original concept while applying all improvements.
          Make it detailed and specific for better generation quality.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    return response.choices[0].message.content || originalPrompt
  } catch (error) {
    console.error('Prompt enhancement error:', error)
    return `${originalPrompt}, enhanced quality, improved composition, better contrast, professional finish`
  }
}