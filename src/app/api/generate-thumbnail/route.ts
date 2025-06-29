import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { fal } from "@fal-ai/client"
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

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
      style = 'photorealistic',
      quality = 'high',
      projectContext,
      mergeVideoWithPersona = false
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
      promptLength: prompt.length
    })

    // Prepare the request based on mode
    let result: any
    
    if (mode === 'generate') {
      // Enhance prompt with project context
      let enhancedPrompt = prompt
      
      if (projectContext) {
        // Add contextual information to improve relevance
        const contextElements = []
        
        if (projectContext.sentiment && projectContext.sentiment !== 'neutral') {
          contextElements.push(`${projectContext.sentiment} emotional tone`)
        }
        
        if (projectContext.topics?.length > 0) {
          contextElements.push(`themed around ${projectContext.topics[0]}`)
        }
        
        if (contextElements.length > 0) {
          enhancedPrompt = `${prompt}, ${contextElements.join(', ')}`
        }
        
        // Ensure YouTube thumbnail best practices
        enhancedPrompt = `${enhancedPrompt}, YouTube thumbnail 1280x720, professional quality, eye-catching design`
      }
      
      // Initial thumbnail generation using flux-general
      const input: any = {
        prompt: enhancedPrompt,
        image_size: {
          width: 1920,  // Increased from 1280 for higher quality
          height: 1080  // Increased from 720 for higher quality
        },
        num_inference_steps: quality === 'high' ? 50 : 35,  // Significantly increased for better quality
        guidance_scale: 7.5,  // Increased from 3.5 for better prompt adherence
        output_format: 'png',  // Changed from jpeg to png for better quality
        enable_safety_checker: true,
        scheduler: 'kdpm2',  // Changed to kdpm2 for better quality
        seed: Math.floor(Math.random() * 1000000)  // Add random seed for variation
      }

      // Add reference image from video snippets if available
      if (videoSnippets.length > 0 && !mergeVideoWithPersona) {
        // Use the first selected video snippet as reference
        const primarySnippet = videoSnippets[0]
        if (primarySnippet.thumbnail) {
          input.reference_image_url = primarySnippet.thumbnail
          input.reference_strength = 0.65
        }
      }

      // Add IP adapter for personal photos if available - ENHANCED for face merging
      if (personalPhotos.length > 0) {
        // Convert base64 to URL if needed
        let faceImageUrl = personalPhotos[0]
        
        // Check if it's a base64 string
        if (faceImageUrl.startsWith('data:image')) {
          // For base64 images, we need to use a different approach
          // FAL AI doesn't accept base64 directly in IP adapters
          // Instead, we'll modify the prompt to describe the person
          
          // Modify prompt to emphasize portrait style
          input.prompt = `${input.prompt}, professional portrait photography, person with engaging expression, centered composition, eye-catching YouTube thumbnail`
          
          // If merging with video background, use video snippet as reference
          if (mergeVideoWithPersona && videoSnippets.length > 0 && videoSnippets[0].thumbnail) {
            input.reference_image_url = videoSnippets[0].thumbnail
            input.reference_strength = 0.4  // Lower strength to allow person to be added
            input.prompt += `, person prominently featured overlaid on video scene, professional composite effect`
          }
          
          console.log('Note: Personal photos in base64 format - using prompt-based generation')
        } else {
          // It's already a URL, use IP adapter
          try {
            input.prompt = `${input.prompt}, person in image has face from reference photo, maintain facial features`
            
            // Use IP adapter with validated settings for flux-general
        input.ip_adapters = [{
              path: "h94/IP-Adapter-FaceID",  // Use standard FaceID instead of Plus
          subfolder: "models", 
              weight_name: "ip-adapter-faceid_sd15.bin",  // Standard model
              image_url: faceImageUrl,
              scale: 1.0,  // Standard scale
              weight: 0.8  // Moderate weight
            }]
            
            // If merging with video background
            if (mergeVideoWithPersona && videoSnippets.length > 0 && videoSnippets[0].thumbnail) {
              input.reference_image_url = videoSnippets[0].thumbnail
              input.reference_strength = 0.3  // Lower to preserve face
              input.prompt += `, composite image with person and video background`
            }
          } catch (e) {
            console.error('Error setting up IP adapter:', e)
            // Fallback to prompt-based generation
            input.prompt += `, portrait of a person, professional headshot`
          }
        }
      }

      // Map style to appropriate model settings - optimized for YouTube thumbnails
      const styleSettings: Record<string, any> = {
        'photorealistic': { 
          loras: [{
            path: "XLabs-AI/flux-RealismLora",
            scale: 1.2  // Increased from 1.0 for stronger realism
          }],
          guidance_scale: 8.5,  // Increased for better quality
          num_inference_steps: quality === 'high' ? 60 : 40,  // Extra steps for photorealism
          prompt: `${input.prompt}, ultra photorealistic YouTube thumbnail, professional DSLR quality, perfect facial features, high resolution details, sharp focus, professional lighting, vibrant colors, clickbait style`
        },
        'corporate': {
          guidance_scale: 7.0,
          num_inference_steps: quality === 'high' ? 45 : 30,
          prompt: `${input.prompt}, professional corporate YouTube thumbnail, clean design, business aesthetic, photorealistic person, modern office background, confident expression, high contrast`
        },
        'gradient': {
          guidance_scale: 8.0,
          num_inference_steps: quality === 'high' ? 45 : 30,
          prompt: `${input.prompt}, vibrant gradient background YouTube thumbnail, modern design, eye-catching colors, photorealistic person in foreground, colorful lighting, dynamic composition, trending style`
        },
        'flat-design': {
          guidance_scale: 6.5,
          num_inference_steps: quality === 'high' ? 40 : 25,
          prompt: `${input.prompt}, flat design style YouTube thumbnail, minimalist background, clean vectors, photorealistic person as focal point, bold colors, simple shapes, modern aesthetic`
        },
        'cyberpunk': {
          guidance_scale: 8.5,
          num_inference_steps: quality === 'high' ? 55 : 35,
          prompt: `${input.prompt}, cyberpunk aesthetic YouTube thumbnail, neon lights, futuristic, high tech, photorealistic person with tech elements, glowing effects, dark atmosphere with bright accents`
        }
      }

      // Apply style settings
      if (styleSettings[style]) {
        Object.assign(input, styleSettings[style])
      }

      // Submit to FAL AI
      result = await fal.subscribe("fal-ai/flux-general", {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          console.log('Generation status:', update.status)
        }
      })

    } else if (mode === 'edit') {
      // Edit existing thumbnail using flux-pro/kontext
      if (!referenceImageUrl) {
        return NextResponse.json({ 
          error: 'Reference image URL required for edit mode' 
        }, { status: 400 })
      }

      const editInput = {
        prompt: `${prompt}, maintain original composition, enhance quality, YouTube thumbnail optimization, vibrant colors, high contrast`,
        image_url: referenceImageUrl,
        guidance_scale: 6.5,  // Increased from 3.5
        num_inference_steps: 45,  // Add inference steps for better quality
        num_images: 1,
        output_format: 'png' as const,  // Changed from jpeg to png
        aspect_ratio: '16:9' as const, // YouTube thumbnail ratio
        strength: 0.75  // Control how much to change the original
      }

      result = await fal.subscribe("fal-ai/flux-pro/kontext", {
        input: editInput,
        logs: true
      })
    }

    if (!result || !result.data) {
      throw new Error('No result from FAL AI')
    }

    // Extract the generated image URL
    const generatedImageUrl = result.data.images[0]?.url
    if (!generatedImageUrl) {
      throw new Error('No image generated')
    }

    // Store the generated thumbnail metadata in database
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      throw new Error('Project not found')
    }

    // Update project with new thumbnail
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        thumbnail_url: generatedImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Error updating project thumbnail:', updateError)
    }

    // Store generation history
    const generationHistory = {
      projectId,
      imageUrl: generatedImageUrl,
      prompt,
      mode,
      style,
      quality,
      metadata: {
        seed: result.data.seed,
        videoSnippets: videoSnippets.length,
        personalPhotos: personalPhotos.length,
        falRequestId: result.requestId
      },
      createdAt: new Date().toISOString()
    }

    // Store in project's folders.thumbnails array
    const thumbnailsFolder = project.folders?.thumbnails || []
    thumbnailsFolder.push(generationHistory)

    await supabase
      .from('projects')
      .update({
        folders: {
          ...project.folders,
          thumbnails: thumbnailsFolder
        }
      })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      seed: result.data.seed,
      requestId: result.requestId,
      history: generationHistory
    })

  } catch (error) {
    console.error('Thumbnail generation error:', error)
    
    // Check if it's a fal.ai specific error
    if (error instanceof Error) {
      // Parse fal.ai errors
      if (error.message.includes('unprocessable') || error.message.includes('422')) {
        return NextResponse.json({ 
          error: 'Invalid image format or parameters. Please try using simpler settings or uploading a custom image instead.',
          details: 'The AI service could not process the request. This often happens with complex face merging requests.',
          suggestion: 'Try generating without personal photos first, then edit the result.'
        }, { status: 422 })
      }
      
      if (error.message.includes('invalid') || error.message.includes('validation')) {
        return NextResponse.json({ 
          error: 'Invalid parameters sent to AI service',
          details: error.message,
          suggestion: 'Try reducing the complexity of your request'
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate thumbnail',
      details: 'An unexpected error occurred during thumbnail generation'
    }, { status: 500 })
  }
}

// Get thumbnail generation history
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseBrowserClient()

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('folders')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const thumbnailHistory = project.folders?.thumbnails || []

    return NextResponse.json({
      history: thumbnailHistory,
      count: thumbnailHistory.length
    })

  } catch (error) {
    console.error('Error fetching thumbnail history:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch thumbnail history' 
    }, { status: 500 })
  }
} 