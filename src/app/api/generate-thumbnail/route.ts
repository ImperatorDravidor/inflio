import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { fal } from "@fal-ai/client"
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createFluxThumbnailService } from '@/lib/services/thumbnail-service'
import { ThumbnailPromptService } from '@/lib/services/thumbnail-prompt-service'

// Configure FAL AI client
fal.config({
  credentials: process.env.FAL_KEY!
})

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseBrowserClient()

    const body = await req.json()
    const { 
      projectId, 
      prompt, 
      mode = 'generate', // 'generate' or 'edit'
      videoSnippets = [],
      personalPhotos = [],
      referenceImageUrl,
      style = 'modern',
      quality = 'hd',
      projectContext,
      mergeVideoWithPersona = false,
      personaName
    } = body

    // Validate inputs
    if (!projectId || !prompt) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId and prompt' 
      }, { status: 400 })
    }

    // Log request details for debugging
    console.log('Thumbnail generation request:', {
      mode,
      hasVideoSnippets: videoSnippets.length > 0,
      hasPersonalPhotos: personalPhotos.length > 0,
      mergeVideoWithPersona,
      style,
      quality,
      promptLength: prompt.length,
      hasReferenceImage: !!referenceImageUrl
    })

    // Fetch project for additional context
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
      
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const openai = getOpenAI()
    
    // Enhanced prompt generation based on video content
    let enhancedPrompt = prompt || ''
    
    // If no custom prompt provided, generate an intelligent one
    if (!prompt) {
      enhancedPrompt = `YouTube thumbnail for video titled "${project.title}". `
      
      // Add content analysis context
      if (project.content_analysis) {
        const { topics, keywords, mood } = project.content_analysis
        
        // Add topic context
        if (topics && topics.length > 0) {
          enhancedPrompt += `Main topics: ${topics.slice(0, 2).join(', ')}. `
        }
        
        // Add mood/tone
        if (mood) {
          const moodMap: Record<string, string> = {
            'exciting': 'high-energy, vibrant colors',
            'educational': 'clear, informative design',
            'serious': 'professional, trustworthy appearance',
            'funny': 'playful, eye-catching elements'
          }
          enhancedPrompt += `${moodMap[mood] || 'engaging design'}. `
        }
        
        // Add key visual elements
        if (keywords && keywords.length > 0) {
          enhancedPrompt += `Key elements to visualize: ${keywords.slice(0, 3).join(', ')}. `
        }
      }
    }
    
    // Handle video snippets integration
    if (videoSnippets.length > 0 && mergeVideoWithPersona) {
      enhancedPrompt += `\nIMPORTANT: Integrate the provided video frames as background or context. `
      if (personaName) {
        enhancedPrompt += `Feature ${personaName} prominently in the foreground, merged naturally with the video scene. `
      }
    }
    
    // Optimize for YouTube thumbnails and integrate persona LoRA if available
    let thumbnailPrompt = `Create a high-impact YouTube thumbnail. ${enhancedPrompt} 
    
    CRITICAL Requirements:
    - 1280x720 resolution, 16:9 aspect ratio
    - Bold, readable text overlay (if applicable)
    - High contrast and vibrant colors
    - Clear focal point that draws the eye
    - Emotion-evoking imagery
    - Professional quality, no blur or artifacts
    - ${style === 'modern' ? 'Clean, minimalist design with strong visual hierarchy' : ''}
    - ${style === 'vibrant' ? 'Bright, saturated colors with dynamic composition' : ''}
    - ${style === 'professional' ? 'Polished, trustworthy appearance with subtle branding' : ''}
    - ${style === 'dramatic' ? 'High contrast, cinematic lighting, intense mood' : ''}
    
    ${mergeVideoWithPersona ? 'Seamlessly blend the person with video background elements. ' : ''}
    ${personalPhotos.length > 0 ? 'Feature the person prominently with engaging expression. ' : ''}
    ${videoSnippets.length > 0 ? 'Use the video frames as visual context or background. ' : ''}
    
    Style: ${style}, photorealistic, ultra HD quality, professional YouTube thumbnail`

    // Try to load default persona and build GPT-5 smart prompt + LoRA config
    let loraConfig: { path: string, scale: number } | null = null
    try {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('default_persona_id')
        .eq('clerk_user_id', userId)
        .single()

      if (profile?.default_persona_id) {
        const { data: persona } = await supabaseAdmin
          .from('personas')
          .select('*')
          .eq('id', profile.default_persona_id)
          .single()
        
        if (persona?.model_ref && persona?.metadata?.lora_model_url) {
          // Extract LoRA details from metadata
          const loraModelUrl = persona.metadata.lora_model_url
          const loraTriggerPhrase = persona.metadata.lora_trigger_phrase || persona.name
          
          // Build smart prompt with GPT-5 and correct trigger phrase order
          const smartPrompt = await ThumbnailPromptService.generateSmartPrompt(
            {
              id: persona.id,
              userId: persona.user_id,
              name: persona.name,
              description: persona.description,
              status: persona.status,
              loraModelUrl: loraModelUrl,
              loraConfigUrl: persona.metadata.lora_config_url,
              loraTriggerPhrase: loraTriggerPhrase,
              createdAt: persona.created_at,
              updatedAt: persona.updated_at
            } as any,
            project.content_analysis || {}
          )
          thumbnailPrompt = smartPrompt || thumbnailPrompt
          loraConfig = { path: loraModelUrl, scale: 1.0 }
          
          // Add trigger phrase to the prompt if not already included
          if (!thumbnailPrompt.includes(loraTriggerPhrase)) {
            thumbnailPrompt = `${loraTriggerPhrase}, ${thumbnailPrompt}`
          }
        }
      }
    } catch (e) {
      console.warn('Persona smart prompt/LoRA not applied:', e)
    }
    
    let imageUrl: string
    
    // Initialize Flux thumbnail service
    const thumbnailService = createFluxThumbnailService()
    
    // Determine quality level based on request
    const fluxQuality = quality === 'hd' ? 'high' : quality === 'standard' ? 'balanced' : 'fast'
    
    // Determine style based on input
    const fluxStyle = style === 'modern' || style === 'professional' ? 'realistic' : 
                      style === 'vibrant' || style === 'dramatic' ? 'illustration' : 'realistic'
    
    try {
      // If we have specific requirements for YouTube thumbnails
      if (!videoSnippets.length && !referenceImageUrl) {
        // Use optimized YouTube thumbnail generation
        const result = await thumbnailService.generateYouTubeThumbnail(
          project.title || 'Video',
          thumbnailPrompt,
          fluxStyle as 'realistic' | 'illustration'
        )
        imageUrl = result.url
      } else {
        // Use standard generation with video/reference integration
        if (videoSnippets.length > 0 || referenceImageUrl) {
          // Use FAL's Flux with image-to-image capabilities
          const input: any = {
            prompt: thumbnailPrompt,
            image_size: {
              width: 1920,
              height: 1080
            },
            num_inference_steps: quality === 'hd' ? 50 : 35,
            guidance_scale: 8.0,
            output_format: 'png',
            enable_safety_checker: true
          }
          if (loraConfig) {
            input.loras = [loraConfig]
          }
          
          // Add reference image if editing/iterating
          if (referenceImageUrl) {
            input.image = referenceImageUrl
            input.strength = 0.6 // Allow significant changes while keeping composition
          }
          
          // If we have video snippets, use the first one as base
          if (videoSnippets.length > 0 && !referenceImageUrl) {
            input.image = videoSnippets[0].thumbnailUrl
            input.strength = 0.7
          }
          
          const result = await fal.subscribe("fal-ai/flux/dev", {
            input,
            logs: true
          })
          
          imageUrl = result.data?.images?.[0]?.url || ''
        } else {
          // Use our optimized Flux service
          const result = await thumbnailService.generateThumbnail({
            prompt: thumbnailPrompt,
            style: fluxStyle,
            aspectRatio: 'landscape_16_9',
            quality: fluxQuality
          })
          imageUrl = result.url
        }
      }
    } catch (error) {
      console.error('Flux generation error, falling back to OpenAI:', error)
      // Fallback to OpenAI gpt-image-1
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: thumbnailPrompt,
        n: 1,
        size: "1536x1024",
        quality: quality === 'hd' ? 'high' : 'medium',
        background: "auto"
      })
      imageUrl = response.data?.[0]?.url || ''
    }
    
    if (!imageUrl) {
      throw new Error('Failed to generate thumbnail image')
    }
    
    // Download and optimize the image
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    
    // Generate unique filename
    const fileName = `thumbnail-${crypto.randomUUID()}.png`
    const filePath = `${projectId}/thumbnails/${fileName}`
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      })
      
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath)

    // Save to thumbnail history
    const { data: thumbnailHistory, error: historyError } = await supabaseAdmin
      .from('thumbnail_history')
      .insert({
        project_id: projectId,
        user_id: userId,
        type: 'generate',
        prompt: prompt,
        base_prompt: thumbnailPrompt,
        params: {
          style,
          quality,
          mergeVideoWithPersona,
          hasVideoSnippets: videoSnippets.length > 0,
          hasPersonalPhotos: personalPhotos.length > 0,
          dimensions: { width: 1920, height: 1080 }
        },
        model: videoSnippets.length > 0 || referenceImageUrl ? 'flux' : 'dall-e-3',
        lora_ref: personaName ? personaName : null,
        output_url: publicUrl,
        file_size: imageBlob.size,
        width: 1920,
        height: 1080,
        status: 'completed',
        created_by: userId
      })
      .select()
      .single()

    if (historyError) {
      console.error('Failed to save thumbnail history:', historyError)
    }

    // Update project with new thumbnail
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        thumbnail_url: publicUrl,
        metadata: {
          ...project.metadata,
          thumbnailGenerated: true,
          thumbnailStyle: style,
          thumbnailPrompt: thumbnailPrompt,
          hasVideoSnippets: videoSnippets.length > 0,
          hasPersona: personalPhotos.length > 0,
          lastThumbnailId: thumbnailHistory?.id
        }
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Update error:', updateError)
    }
    
    // Generate text overlay suggestions based on content
    let textSuggestions: string[] = []
    if (project.content_analysis) {
      const suggestions = await generateTextOverlaySuggestions(
        project.title,
        project.content_analysis,
        style
      )
      textSuggestions = suggestions
    }
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      imageUrl: publicUrl,
      prompt: thumbnailPrompt,
      textSuggestions,
      metadata: {
        style,
        quality,
        model: videoSnippets.length > 0 ? 'flux' : 'dall-e-3',
        dimensions: '1920x1080',
        hasVideoContext: videoSnippets.length > 0,
        hasPersona: personalPhotos.length > 0
      }
    })

  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate thumbnail' },
      { status: 500 }
    )
  }
}

// Helper function to generate text overlay suggestions
async function generateTextOverlaySuggestions(
  title: string,
  contentAnalysis: any,
  style: string
): Promise<string[]> {
  const suggestions = []
  
  // Hook-based suggestions
  if (contentAnalysis.contentSuggestions?.socialMediaHooks) {
    suggestions.push(...contentAnalysis.contentSuggestions.socialMediaHooks
      .map((hook: string) => hook.substring(0, 30) + (hook.length > 30 ? '...' : ''))
      .slice(0, 2)
    )
  }
  
  // Question-based suggestions
  if (contentAnalysis.topics && contentAnalysis.topics.length > 0) {
    suggestions.push(`What is ${contentAnalysis.topics[0]}?`)
    suggestions.push(`${contentAnalysis.topics[0]} Explained`)
  }
  
  // Benefit-based suggestions
  if (contentAnalysis.keywords && contentAnalysis.keywords.length > 1) {
    suggestions.push(`Master ${contentAnalysis.keywords[0]}`)
    suggestions.push(`${contentAnalysis.keywords[0]} Secrets`)
  }
  
  // Shortened title
  if (title.length > 40) {
    suggestions.push(title.substring(0, 35) + '...')
  } else {
    suggestions.push(title)
  }
  
  return suggestions.slice(0, 5)
}

// Get thumbnail generation history
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '20')

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
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch thumbnail history' 
      }, { status: 500 })
    }

    // Build iteration tree structure
    const thumbnailMap = new Map()
    const roots: any[] = []

    // First pass: create map of all thumbnails
    thumbnails?.forEach(thumb => {
      thumbnailMap.set(thumb.id, { 
        ...thumb, 
        children: [],
        averageRating: thumb.thumbnail_feedback?.length > 0 
          ? thumb.thumbnail_feedback.reduce((acc: number, f: any) => acc + f.rating, 0) / thumb.thumbnail_feedback.length
          : null
      })
    })

    // Second pass: build parent-child relationships
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
      history: roots,
      count: thumbnails?.length || 0,
      hasMore: thumbnails?.length === limit
    })

  } catch (error) {
    console.error('Error fetching thumbnail history:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch thumbnail history' 
    }, { status: 500 })
  }
} 