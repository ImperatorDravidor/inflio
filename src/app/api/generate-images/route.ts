import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SupabaseImageStorage } from '@/lib/supabase-image-storage'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      projectId,
      prompt,
      quality = 'medium',
      size = '1024x1024',
      style = '',
      format = 'png',
      background = 'opaque',
      n = 1,
      isCarousel = false,
      carouselPrompts = [],
      type = 'ai-generated'
    } = await request.json()
    
    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'Project ID and prompt are required' }, { status: 400 })
    }

    // Fetch project to ensure user owns it
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build the full prompt with style
    const fullPrompt = style ? `${prompt}. Style: ${style}` : prompt

    // Generate images using OpenAI
    const openai = getOpenAI()
    
    // Image generation parameters
    // Note: GPT-IMAGE-1 always returns base64 (b64_json), not URLs
    const imageParams: any = {
      model: 'gpt-image-1',
      prompt: fullPrompt,
      n,
      size: size as any,
      quality: quality as any
    }
    
    // Add transparent background to prompt if requested
    if (background === 'transparent') {
      imageParams.prompt = `${fullPrompt}. IMPORTANT: Generate with a transparent background, no background elements.`
    }
    
    const response = await openai.images.generate(imageParams)

    // Initialize storage bucket (only runs once)
    await SupabaseImageStorage.initializeBucket()

    // Process and store generated images
    const generatedImages = []
    const carouselId = isCarousel ? crypto.randomUUID() : null
    
    // For carousels, generate each slide with its specific prompt
    if (isCarousel && carouselPrompts.length > 0) {
      for (let i = 0; i < carouselPrompts.length; i++) {
        const slidePrompt = carouselPrompts[i]
        
        try {
          console.log(`Generating carousel slide ${i + 1}/${carouselPrompts.length}...`)
          
          const slideResponse = await openai.images.generate({
            model: 'gpt-image-1',
            prompt: style ? `${slidePrompt}. Style: ${style}` : slidePrompt,
            n: 1,
            size: size as any,
            quality: quality as any
          })
          
          // Log the full response to understand its structure
          console.log('Full slide response:', JSON.stringify(slideResponse, null, 2))
          
          // Check if response has data
          if (!slideResponse.data || slideResponse.data.length === 0) {
            console.error('No data in slide response:', slideResponse)
            throw new Error('No image data returned from API')
          }
          
          const imageData = slideResponse.data[0]
          console.log('Image data structure:', JSON.stringify(imageData, null, 2))
          
          const imageId = crypto.randomUUID()
          let publicUrl: string
          let base64: string
          
          // GPT-IMAGE-1 returns base64, not URLs
          const imageDataAny = imageData as any
          
          if (imageDataAny.b64_json) {
            // GPT-IMAGE-1 returns base64 directly
            console.log('Found b64_json for GPT-IMAGE-1')
            base64 = imageDataAny.b64_json
          } else if (imageDataAny.url) {
            // Other models return URLs
            console.log('Found URL, downloading image...')
            const imageResponse = await fetch(imageDataAny.url)
            if (!imageResponse.ok) {
              throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
            }
            
            const imageBlob = await imageResponse.blob()
            const arrayBuffer = await imageBlob.arrayBuffer()
            base64 = Buffer.from(arrayBuffer).toString('base64')
          } else {
            console.error('No b64_json or url found. Available fields:', Object.keys(imageDataAny))
            console.error('Full image data object:', imageDataAny)
            throw new Error('No image data in response')
          }
          
          publicUrl = await SupabaseImageStorage.uploadImage(
            base64,
            projectId,
            imageId,
            format
          )
          
          generatedImages.push({
            id: imageId,
            prompt: slidePrompt,
            originalPrompt: prompt,
            style,
            quality,
            size,
            format,
            background,
            url: publicUrl,
            createdAt: new Date().toISOString(),
            type: 'carousel-slide',
            carouselId,
            slideNumber: i + 1,
            totalSlides: carouselPrompts.length
          })
          
        } catch (slideError) {
          console.error(`Error generating carousel slide ${i + 1}:`, slideError)
          // Continue with other slides instead of failing completely
          // You might want to handle this differently based on your needs
          throw new Error(`Failed to generate carousel slide ${i + 1}: ${slideError instanceof Error ? slideError.message : 'Unknown error'}`)
        }
      }
    } else {
      // Regular image generation
      console.log('Regular image generation - full response:', JSON.stringify(response, null, 2))
      
      for (let i = 0; i < (response.data?.length || 0); i++) {
        const imageData = response.data![i]
        console.log(`Image ${i + 1} data:`, JSON.stringify(imageData, null, 2))
        
        const imageId = crypto.randomUUID()
        let publicUrl: string
        let base64: string
        
        // GPT-IMAGE-1 returns base64, not URLs
        const imageDataAny = imageData as any
        
        if (imageDataAny.b64_json) {
          // GPT-IMAGE-1 returns base64 directly
          console.log('Found b64_json for GPT-IMAGE-1')
          base64 = imageDataAny.b64_json
        } else if (imageDataAny.url) {
          // Other models return URLs
          console.log('Found URL, downloading image...')
          const imageResponse = await fetch(imageDataAny.url)
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
          }
          
          const imageBlob = await imageResponse.blob()
          const arrayBuffer = await imageBlob.arrayBuffer()
          base64 = Buffer.from(arrayBuffer).toString('base64')
        } else {
          console.error('No b64_json or url found. Available fields:', Object.keys(imageDataAny))
          console.error('Full image data object:', imageDataAny)
          throw new Error('No image data returned from GPT-IMAGE-1')
        }
        
        publicUrl = await SupabaseImageStorage.uploadImage(
          base64,
          projectId,
          imageId,
          format
        )
        
        generatedImages.push({
          id: imageId,
          prompt: fullPrompt,
          originalPrompt: prompt,
          style,
          quality,
          size,
          format,
          background,
          url: publicUrl,
          createdAt: new Date().toISOString(),
          type: type || 'ai-generated'
        })
      }
    }

    // Update project with generated image metadata (not the image data)
    const currentImages = project.folders?.images || []
    const updatedFolders = {
      ...project.folders,
      images: [...currentImages, ...generatedImages]
    }

    // If type is thumbnail, also update the project's thumbnail_url
    const updateData: any = { 
      folders: updatedFolders,
      updated_at: new Date().toISOString()
    }
    
    if (type === 'thumbnail' && generatedImages.length > 0) {
      updateData.thumbnail_url = generatedImages[0].url
    }

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (updateError) {
      console.error('Error saving image metadata:', updateError)
    }

    return NextResponse.json({
      success: true,
      images: generatedImages,
      imageUrl: generatedImages.length > 0 ? generatedImages[0].url : null
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Streaming endpoint for partial images
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const prompt = searchParams.get('prompt')
    const quality = searchParams.get('quality') || 'medium'
    const style = searchParams.get('style') || ''

    if (!projectId || !prompt) {
      return NextResponse.json({ error: 'Project ID and prompt are required' }, { status: 400 })
    }

    // For streaming, we'll use the Responses API approach
    const openai = getOpenAI()
    
    // Create a readable stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Note: The current OpenAI SDK doesn't directly support the Responses API yet
          // This is a placeholder for when it's available
          // For now, we'll simulate streaming with progress updates
          
          controller.enqueue(encoder.encode('data: {"type":"start","message":"Starting image generation..."}\n\n'))
          
          // Simulate progress updates
          for (let i = 1; i <= 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            controller.enqueue(encoder.encode(`data: {"type":"progress","progress":${i * 33}}\n\n`))
          }
          
          // Generate the final image
          const fullPrompt = style ? `${prompt}. Style: ${style}` : prompt
          const response = await openai.images.generate({
            model: 'gpt-image-1',
            prompt: fullPrompt,
            n: 1,
            size: '1024x1024',
            quality: quality as any
          })
          
          // For streaming, we'll return the URL directly
          const imageUrl = response.data?.[0]?.url || ''
          controller.enqueue(encoder.encode(`data: {"type":"complete","url":"${imageUrl}"}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(`data: {"type":"error","error":"${error}"}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming error:', error)
    return NextResponse.json(
      { error: 'Failed to stream image generation' },
      { status: 500 }
    )
  }
} 