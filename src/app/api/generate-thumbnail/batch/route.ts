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
      count = 3,  // Number of variations to generate
      basePrompt,
      styles = ['photorealistic', 'gradient', 'corporate'],
      quality = 'high',
      projectContext
    } = body

    // Validate inputs
    if (!projectId || !basePrompt) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId and basePrompt' 
      }, { status: 400 })
    }

    // Fetch project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      throw new Error('Project not found')
    }

    // Generate multiple thumbnails in parallel
    const thumbnailPromises = styles.slice(0, count).map(async (style: string, index: number) => {
      try {
        // Add variation to prompt
        const variations = [
          'dramatic lighting, high impact',
          'vibrant colors, eye-catching design',
          'professional look, clean aesthetic',
          'trendy style, modern appeal',
          'bold composition, striking visuals'
        ]
        
        const enhancedPrompt = `${basePrompt}, ${variations[index % variations.length]}, YouTube thumbnail 1920x1080, ultra HD quality`
        
        // Base input configuration
        const input: any = {
          prompt: enhancedPrompt,
          image_size: {
            width: 1920,
            height: 1080
          },
          num_inference_steps: quality === 'high' ? 50 : 35,
          guidance_scale: 8.0,
          output_format: 'png',
          enable_safety_checker: true,
          scheduler: 'kdpm2',
          seed: Math.floor(Math.random() * 1000000) + index,  // Different seed for each
          upscale: 2
        }

        // Apply style-specific settings
        const styleConfigs: Record<string, any> = {
          'photorealistic': { 
            loras: [{
              path: "XLabs-AI/flux-RealismLora",
              scale: 1.2
            }],
            guidance_scale: 8.5,
            num_inference_steps: 60
          },
          'gradient': {
            guidance_scale: 8.0,
            num_inference_steps: 45
          },
          'corporate': {
            guidance_scale: 7.0,
            num_inference_steps: 45
          }
        }

        if (styleConfigs[style]) {
          Object.assign(input, styleConfigs[style])
        }

        // Generate thumbnail
        const result = await fal.subscribe("fal-ai/flux-general", {
          input,
          logs: true
        })

        if (!result?.data?.images?.[0]?.url) {
          throw new Error('No image generated')
        }

        return {
          imageUrl: result.data.images[0].url,
          style,
          seed: result.data.seed,
          prompt: enhancedPrompt,
          variation: index
        }
      } catch (error) {
        console.error(`Failed to generate thumbnail variant ${index}:`, error)
        return null
      }
    })

    // Wait for all thumbnails to complete
    const results = await Promise.all(thumbnailPromises)
    const successfulResults = results.filter(r => r !== null)

    if (successfulResults.length === 0) {
      throw new Error('Failed to generate any thumbnails')
    }

    // Store all generated thumbnails in history
    const thumbnailsFolder = project.folders?.thumbnails || []
    const batchId = `batch_${Date.now()}`
    
    successfulResults.forEach(result => {
      if (result) {
        thumbnailsFolder.push({
          projectId,
          imageUrl: result.imageUrl,
          prompt: result.prompt,
          mode: 'batch',
          style: result.style,
          quality,
          metadata: {
            seed: result.seed,
            batchId,
            variation: result.variation
          },
          createdAt: new Date().toISOString()
        })
      }
    })

    // Update project with thumbnails history
    await supabase
      .from('projects')
      .update({
        folders: {
          ...project.folders,
          thumbnails: thumbnailsFolder
        }
      })
      .eq('id', projectId)

    // Set the first successful thumbnail as the current one if none exists
    if (!project.thumbnail_url && successfulResults[0]) {
      await supabase
        .from('projects')
        .update({
          thumbnail_url: successfulResults[0].imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
    }

    return NextResponse.json({
      success: true,
      batchId,
      thumbnails: successfulResults,
      count: successfulResults.length,
      totalRequested: count
    })

  } catch (error) {
    console.error('Batch thumbnail generation error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate thumbnails' 
    }, { status: 500 })
  }
} 