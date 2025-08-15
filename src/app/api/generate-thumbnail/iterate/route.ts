import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { fal } from "@fal-ai/client"
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { v4 as uuidv4 } from 'uuid'

// Configure FAL AI client
fal.config({
  credentials: process.env.FAL_KEY!
})

export const maxDuration = 60

interface IterationRequest {
  projectId: string
  parentId: string // Previous thumbnail ID
  feedback: string // User feedback for improvement
  rating?: number // 1-5 rating
  keepStyle?: boolean // Maintain visual style
  keepComposition?: boolean // Maintain layout
  specificChanges?: string[] // Specific elements to change
  personaId?: string // Use persona if available
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: IterationRequest = await req.json()
    const { 
      projectId, 
      parentId,
      feedback,
      rating,
      keepStyle = true,
      keepComposition = false,
      specificChanges = [],
      personaId
    } = body

    // Validate inputs
    if (!projectId || !parentId || !feedback) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId, parentId, and feedback' 
      }, { status: 400 })
    }

    // Fetch parent thumbnail
    const { data: parentThumbnail, error: parentError } = await supabaseAdmin
      .from('thumbnail_history')
      .select('*')
      .eq('id', parentId)
      .eq('project_id', projectId)
      .single()
      
    if (parentError || !parentThumbnail) {
      return NextResponse.json({ error: 'Parent thumbnail not found' }, { status: 404 })
    }

    // Fetch project for context
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
      
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Store feedback for the parent thumbnail
    if (rating) {
      await supabaseAdmin
        .from('thumbnail_feedback')
        .insert({
          generation_id: parentId,
          project_id: projectId,
          rating,
          feedback_text: feedback,
          created_by: userId
        })
    }

    // Get persona if specified
    let personaLoRA = null
    if (personaId) {
      const { data: persona } = await supabaseAdmin
        .from('personas')
        .select('model_ref, name')
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()
      
      if (persona?.model_ref) {
        personaLoRA = persona.model_ref
      }
    }

    // Generate improved prompt using OpenAI
    const openai = getOpenAI()
    
    const promptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at improving AI image generation prompts based on user feedback.
          
          Original prompt: ${parentThumbnail.prompt}
          User feedback: ${feedback}
          Rating: ${rating ? `${rating}/5` : 'not provided'}
          
          Specific changes requested: ${specificChanges.join(', ') || 'none'}
          Keep style: ${keepStyle}
          Keep composition: ${keepComposition}
          
          Generate an improved prompt that addresses the feedback while maintaining what works.
          Be specific about visual elements, colors, composition, and style.
          Output ONLY the improved prompt, no explanations.`
        },
        {
          role: 'user',
          content: `Improve this thumbnail prompt based on the feedback.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const improvedPrompt = promptResponse.choices[0].message.content || parentThumbnail.prompt

    // Prepare iteration parameters
    const iterationParams: any = {
      prompt: improvedPrompt,
      image_size: parentThumbnail.params?.image_size || 'landscape_16_9',
      num_inference_steps: 28,
      guidance_scale: 7.5,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'png'
    }

    // If keeping style/composition, use img2img with parent as reference
    if (keepStyle || keepComposition) {
      iterationParams.image_url = parentThumbnail.output_url
      iterationParams.strength = keepComposition ? 0.3 : 0.6 // Lower = more similar
    }

    // Add persona LoRA if available
    if (personaLoRA) {
      iterationParams.loras = [{
        path: personaLoRA,
        scale: 0.85
      }]
    }

    // Use same seed for consistency if keeping style
    if (keepStyle && parentThumbnail.seed) {
      iterationParams.seed = parentThumbnail.seed
    }

    console.log('Generating iteration with params:', {
      hasParentImage: !!iterationParams.image_url,
      hasLoRA: !!personaLoRA,
      strength: iterationParams.strength
    })

    // Generate improved thumbnail
    let result: any
    let modelUsed = 'fal-ai/flux/dev'
    
    try {
      // Try Flux first (best quality)
      if (keepStyle || keepComposition) {
        // Use img2img for iterations
        result = await fal.subscribe(modelUsed, {
          input: iterationParams,
          logs: true
        })
      } else {
        // Fresh generation
        result = await fal.subscribe(modelUsed, {
          input: iterationParams,
          logs: true
        })
      }
    } catch (falError: any) {
      console.error('Flux iteration failed:', falError)
      
      // Fallback to OpenAI
      if (process.env.OPENAI_API_KEY) {
        try {
          const openaiResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: improvedPrompt,
            n: 1,
            size: '1792x1024',
            quality: 'hd',
            style: 'vivid'
          })
          
          result = {
            images: [{
              url: openaiResponse.data[0].url,
              content_type: 'image/png'
            }]
          }
          modelUsed = 'openai/dall-e-3'
        } catch (openaiError) {
          console.error('OpenAI fallback failed:', openaiError)
          throw new Error('All image generation services failed')
        }
      } else {
        throw falError
      }
    }

    if (!result?.images?.[0]?.url) {
      throw new Error('No image generated')
    }

    const generatedImageUrl = result.images[0].url

    // Download and upload to Supabase storage
    const imageResponse = await fetch(generatedImageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    
    const fileName = `thumbnails/${projectId}/iteration_${Date.now()}_${uuidv4()}.png`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('videos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw uploadError
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('videos')
      .getPublicUrl(fileName)

    // Store iteration in history
    const { data: newThumbnail, error: historyError } = await supabaseAdmin
      .from('thumbnail_history')
      .insert({
        project_id: projectId,
        user_id: userId,
        type: 'iterate',
        prompt: improvedPrompt,
        base_prompt: parentThumbnail.base_prompt,
        edit_prompt: feedback,
        params: iterationParams,
        model: modelUsed,
        lora_ref: personaLoRA,
        seed: result.seed || null,
        input_image_url: parentThumbnail.output_url,
        output_url: publicUrl,
        file_size: imageBuffer.byteLength,
        width: 1792,
        height: 1024,
        job_id: result.request_id || null,
        status: 'completed',
        parent_id: parentId,
        created_by: userId
      })
      .select()
      .single()
    
    if (historyError) {
      console.error('Failed to save thumbnail history:', historyError)
    }

    // Get iteration count for this project
    const { count: iterationCount } = await supabaseAdmin
      .from('thumbnail_history')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('type', 'iterate')

    // Generate text overlay suggestions if this is a good iteration
    let textSuggestions = []
    if (rating && rating >= 4) {
      try {
        const suggestionsResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'Generate 3 compelling text overlay options for a YouTube thumbnail. Keep them short, punchy, and intriguing.'
            },
            {
              role: 'user',
              content: `Video title: ${project.title}\nDescription: ${project.description || 'N/A'}\n\nGenerate 3 text overlay options.`
            }
          ],
          temperature: 0.8,
          max_tokens: 150
        })
        
        const suggestionsText = suggestionsResponse.choices[0].message.content || ''
        textSuggestions = suggestionsText.split('\n').filter(s => s.trim()).slice(0, 3)
      } catch (error) {
        console.error('Failed to generate text suggestions:', error)
      }
    }

    return NextResponse.json({
      success: true,
      thumbnail: {
        id: newThumbnail?.id,
        url: publicUrl,
        prompt: improvedPrompt,
        parentId,
        iterationNumber: iterationCount || 1,
        model: modelUsed,
        improvements: specificChanges,
        textSuggestions
      },
      message: 'Thumbnail iteration generated successfully',
      tip: rating && rating <= 2 
        ? 'Try being more specific about what you want to change'
        : 'Looking good! You can continue iterating or use this version'
    })

  } catch (error) {
    console.error('Thumbnail iteration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate thumbnail iteration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch iteration history
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Fetch thumbnail history with feedback
    const { data: thumbnails, error } = await supabaseAdmin
      .from('thumbnail_history')
      .select(`
        *,
        thumbnail_feedback (
          rating,
          feedback_text,
          created_at
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // Build iteration tree
    const thumbnailMap = new Map()
    const roots = []

    thumbnails?.forEach(thumb => {
      thumbnailMap.set(thumb.id, { ...thumb, children: [] })
    })

    thumbnails?.forEach(thumb => {
      if (thumb.parent_id) {
        const parent = thumbnailMap.get(thumb.parent_id)
        if (parent) {
          parent.children.push(thumbnailMap.get(thumb.id))
        }
      } else {
        roots.push(thumbnailMap.get(thumb.id))
      }
    })

    return NextResponse.json({
      thumbnails: roots,
      total: thumbnails?.length || 0
    })

  } catch (error) {
    console.error('Fetch history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail history' },
      { status: 500 }
    )
  }
}