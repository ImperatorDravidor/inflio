import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { fal } from "@fal-ai/client"
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'

// Configure FAL AI client
fal.config({
  credentials: process.env.FAL_KEY!
})

export const maxDuration = 60

interface VariationRequest {
  projectId: string
  parentId: string // Source thumbnail to create variations from
  count?: number // Number of variations (default 4)
  variationStrength?: number // 0-1, how different from original
  styles?: string[] // Different styles to apply
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: VariationRequest = await req.json()
    const { 
      projectId, 
      parentId,
      count = 4,
      variationStrength = 0.3,
      styles = ['modern', 'vibrant', 'dramatic', 'minimal']
    } = body

    // Validate inputs
    if (!projectId || !parentId) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId and parentId' 
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

    // Generate variations
    const variations = []
    const errors = []

    for (let i = 0; i < Math.min(count, 4); i++) {
      try {
        const style = styles[i] || styles[0]
        
        // Modify prompt for variation
        const variationPrompt = `${parentThumbnail.prompt}. Style variation: ${style}, maintain core composition but vary details.`
        
        // Generate variation using img2img
        const result = await fal.subscribe("fal-ai/flux/dev", {
          input: {
            prompt: variationPrompt,
            image_url: parentThumbnail.output_url,
            image_size: parentThumbnail.params?.image_size || 'landscape_16_9',
            num_inference_steps: 20, // Faster for variations
            guidance_scale: 6.5,
            strength: variationStrength, // How much to vary from original
            seed: Math.floor(Math.random() * 1000000), // Random seed for variation
            num_images: 1,
            enable_safety_checker: true,
            output_format: 'png'
          },
          logs: true
        })

        if (result?.images?.[0]?.url) {
          // Download and upload to storage
          const imageResponse = await fetch(result.images[0].url)
          const imageBuffer = await imageResponse.arrayBuffer()
          
          const fileName = `thumbnails/${projectId}/variation_${Date.now()}_${uuidv4()}.png`
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('videos')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png',
              upsert: false
            })
          
          if (!uploadError) {
            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('videos')
              .getPublicUrl(fileName)

            // Store variation in history
            const { data: variationRecord, error: historyError } = await supabaseAdmin
              .from('thumbnail_history')
              .insert({
                project_id: projectId,
                user_id: userId,
                type: 'variation',
                prompt: variationPrompt,
                base_prompt: parentThumbnail.base_prompt,
                params: {
                  ...parentThumbnail.params,
                  style,
                  variationIndex: i,
                  variationStrength
                },
                model: 'fal-ai/flux/dev',
                lora_ref: parentThumbnail.lora_ref,
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
            
            if (!historyError && variationRecord) {
              variations.push({
                id: variationRecord.id,
                url: publicUrl,
                style,
                index: i,
                parentId
              })
            }
          }
        }
      } catch (error) {
        console.error(`Failed to generate variation ${i}:`, error)
        errors.push(`Variation ${i + 1} failed`)
      }
    }

    if (variations.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to generate any variations',
        details: errors 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      variations,
      total: variations.length,
      message: `Generated ${variations.length} variations successfully`,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Thumbnail variations error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate thumbnail variations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch variations for a thumbnail
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const parentId = searchParams.get('parentId')

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID required' }, { status: 400 })
    }

    // Fetch variations
    const { data: variations, error } = await supabaseAdmin
      .from('thumbnail_history')
      .select('*')
      .eq('parent_id', parentId)
      .eq('type', 'variation')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      variations: variations || [],
      count: variations?.length || 0
    })

  } catch (error) {
    console.error('Fetch variations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variations' },
      { status: 500 }
    )
  }
}