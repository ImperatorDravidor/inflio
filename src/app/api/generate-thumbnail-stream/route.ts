import { NextRequest } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const {
      projectId,
      prompt,
      quality = 'medium',
      size = '1536x1024',
      style = 'auto',
      personalPhotos = [],
      personaName,
      referenceImageUrl,
      inputFidelity = personalPhotos.length > 0 ? 'high' : 'low',
      partialImages = 2
    } = body

    // Validate project ownership
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const openai = getOpenAI()
    
    // Build enhanced prompt with persona context
    let enhancedPrompt = prompt
    if (personaName && personalPhotos.length > 0) {
      enhancedPrompt = `${prompt}. Feature ${personaName} prominently in the thumbnail with professional appearance.`
    }

    // Prepare the stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
                    // Send initial progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Starting image generation...',
            progress: 10
          })}\n\n`))

          // Generate image with gpt-image-1
          const response = await openai.images.generate({
            model: "gpt-image-1",
            prompt: enhancedPrompt,
            n: 1,
            size: size as any,
            quality: quality as any,
            background: "auto"
          })

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Image generated, saving...',
            progress: 60
          })}\n\n`))

          let imageUrl = response.data?.[0]?.url as string | undefined
          let imageBlob: Blob | null = null
          if (!imageUrl) {
            const b64 = (response.data?.[0] as any)?.b64_json
            if (!b64) {
              throw new Error('No image URL returned')
            }
            // Convert base64 to Blob
            const binary = atob(b64)
            const array = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
            imageBlob = new Blob([array], { type: 'image/png' })
          }

          // Download and save the image (or use constructed blob)
          if (!imageBlob && imageUrl) {
            const imageResponse = await fetch(imageUrl)
            imageBlob = await imageResponse.blob()
          }
          
          const fileName = `thumbnail-${crypto.randomUUID()}.png`
          const filePath = `${projectId}/thumbnails/${fileName}`
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Uploading to storage...',
            progress: 80
          })}\n\n`))
          
          const { error: uploadError } = await supabaseAdmin.storage
            .from('ai-generated-images')
            .upload(filePath, imageBlob!, {
              contentType: 'image/png',
              upsert: false
            })
          
          if (uploadError) {
            throw uploadError
          }

          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('ai-generated-images')
            .getPublicUrl(filePath)
          
          // Update project
          await supabaseAdmin
            .from('projects')
            .update({
              thumbnail_url: publicUrl,
              metadata: {
                ...project.metadata,
                thumbnailGenerated: true,
                thumbnailPrompt: enhancedPrompt,
                hasPersona: personalPhotos.length > 0,
                generatedWith: 'gpt-image-1'
              }
            })
            .eq('id', projectId)
          
          const data = JSON.stringify({
            type: 'complete',
            url: publicUrl,
            progress: 100,
            message: 'Thumbnail generated successfully!'
          })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          
          controller.close()
        } catch (error) {
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Generation failed'
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Thumbnail streaming error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate thumbnail' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 