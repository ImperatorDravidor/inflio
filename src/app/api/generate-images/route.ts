import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIImageService } from '@/lib/ai-image-service'
import { UsageService } from '@/lib/usage-service'
import { UnifiedContentService, VideoSnippet, ContentPersona } from '@/lib/unified-content-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface GenerateImageRequest {
  projectId: string
  prompt?: string
  imageType: 'social' | 'carousel' | 'quote' | 'linkedin' | 'story'
  platforms?: string[]
  count?: number
  
  // Unified content options
  usePersona?: boolean
  personaId?: string
  personaPhotos?: string[] // Base64 images
  useVideoSnippets?: boolean
  videoSnippets?: VideoSnippet[]
  style?: string
  customizations?: {
    textOverlay?: string
    brandColors?: string[]
    mood?: string
  }
  
  // AI suggestions
  suggestionId?: string
  useAISuggestion?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateImageRequest = await req.json()
    const { 
      projectId,
      prompt,
      imageType, 
      platforms = [], 
      count = 1,
      usePersona = false,
      personaId,
      personaPhotos = [],
      useVideoSnippets = false,
      videoSnippets = [],
      style,
      customizations,
      suggestionId,
      useAISuggestion = false
    } = body

    // Check usage
    if (!UsageService.canProcessVideo()) {
      return NextResponse.json(
        { error: 'Monthly usage limit reached. Please upgrade your plan.' },
        { status: 429 }
      )
    }

    // Get project details
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*, content_analysis')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Generate AI suggestions if requested
    let finalPrompt = prompt || ''
    let enhancedPrompt = ''
    
    if (useAISuggestion || !prompt) {
      const suggestions = await UnifiedContentService.generateUnifiedSuggestions(project, {
        contentType: 'social',
        style,
        platform: platforms[0]
      })
      
      // Find matching suggestion or use first one
      const suggestion = suggestionId 
        ? suggestions.find(s => s.id === suggestionId) 
        : suggestions.find(s => s.type === 'social' && s.platform === platforms[0])
      
      if (suggestion) {
        finalPrompt = suggestion.prompt
        enhancedPrompt = suggestion.enhancedPrompt
      }
    }

    // Load persona data if requested
    let personaImage: Buffer | null = null
    let personaName = 'User'
    
    if (usePersona && personaId) {
      // Get persona from database
      const { data: persona } = await supabaseAdmin
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single()
      
      if (persona) {
        personaName = persona.name
        
        // Get a pre-generated sample image to use as reference
        if (persona.metadata?.sample_images?.length > 0) {
          // Select appropriate sample based on content type
          const sampleIndex = imageType === 'quote' ? 3 : // social media profile style
                            imageType === 'story' ? 1 :  // casual portrait
                            imageType === 'carousel' ? 2 : // youtube style
                            0 // professional headshot
          
          const sampleUrl = persona.metadata.sample_images[sampleIndex]?.url || 
                          persona.metadata.sample_images[0]?.url
          
          if (sampleUrl) {
            // Download the sample image
            const response = await fetch(sampleUrl)
            personaImage = Buffer.from(await response.arrayBuffer())
          }
        }
      }
      
      // Enhance prompt with persona context
      finalPrompt = `Create a social media graphic featuring ${personaName}. ${finalPrompt || ''}`
    }

    // Apply video snippets if requested
    if (useVideoSnippets && videoSnippets.length > 0) {
      finalPrompt = UnifiedContentService.mergeVideoSnippetsIntoPrompt(
        finalPrompt,
        videoSnippets,
        'social'
      )
    }

    // Apply customizations
    if (customizations) {
      if (customizations.textOverlay) {
        finalPrompt += ` With text overlay: "${customizations.textOverlay}".`
      }
      if (customizations.brandColors?.length) {
        finalPrompt += ` Using brand colors: ${customizations.brandColors.join(', ')}.`
      }
      if (customizations.mood) {
        finalPrompt += ` ${customizations.mood} mood and atmosphere.`
      }
    }

    // Generate images using OpenAI
    const openai = getOpenAI()
    const images = []
    
    for (let i = 0; i < count; i++) {
      // Determine if we need transparency
      const needsTransparency = finalPrompt.toLowerCase().includes('overlay') || 
                              finalPrompt.toLowerCase().includes('transparent') ||
                              finalPrompt.toLowerCase().includes('sticker') ||
                              style === 'quote-overlay'
      
      let response
      
      // Use edit endpoint if we have a persona image
      if (personaImage) {
        // Enhanced prompt for persona integration
        const editPrompt = `${finalPrompt}
        
        IMPORTANT: The provided image shows ${personaName}. Use their exact likeness and facial features.
        Maintain their authentic appearance while creating the ${imageType} social media graphic.
        ${customizations?.textOverlay ? `Include text overlay: "${customizations.textOverlay}"` : ''}
        Style: ${style || 'modern'} social media design optimized for ${platforms.join(', ')}.`
        
        // Convert buffer to File-compatible format for OpenAI
        const { toFile } = await import('openai')
        const imageFile = await toFile(personaImage, 'persona.png', { type: 'image/png' })
        
        response = await openai.images.edit({
          model: "gpt-image-1",
          image: imageFile,
          prompt: editPrompt,
          n: 1,
          size: '1024x1024', // Edit endpoint only supports square sizes
          response_format: 'b64_json'
        })
      } else {
        // Use standard generation without persona
        response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: AIImageService.enhancePromptWithStyle(finalPrompt, style || 'modern', 'high'),
          n: 1,
          size: imageType === 'story' ? '1024x1792' : '1024x1024',
          quality: 'standard',
          response_format: 'b64_json'
        })
      }
      
      if (response.data && response.data[0]?.b64_json) {
        // Convert base64 to blob
        const imageData = Buffer.from(response.data[0].b64_json, 'base64')
        
        const fileName = `social-${crypto.randomUUID()}.${needsTransparency ? 'webp' : 'png'}`
        const filePath = `${projectId}/social-graphics/${fileName}`
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from('ai-generated-images')
          .upload(filePath, imageData, {
            contentType: `image/${needsTransparency ? 'webp' : 'png'}`,
            upsert: false
          })

        if (!uploadError) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('ai-generated-images')
            .getPublicUrl(filePath)
          
          images.push({
            id: crypto.randomUUID(),
            url: publicUrl,
            prompt: finalPrompt,
            type: imageType,
            platform: platforms[0],
            style,
            createdAt: new Date().toISOString(),
            hasTransparency: needsTransparency,
            metadata: {
              quality: 'standard',
              hasPersona: personaPhotos.length > 0,
              personaName: personaId ? 'User Persona' : undefined,
              generatedWith: 'gpt-image-1'
            }
          })
        }
      }
    }

    // Track usage
    UsageService.incrementUsage()

    // Save generation metadata
    const metadata = {
      type: 'social_graphics',
      prompt: finalPrompt,
      enhancedPrompt,
      imageType,
      platforms,
      usePersona,
      personaId,
      useVideoSnippets,
      style,
      customizations,
      generatedAt: new Date().toISOString()
    }
    
    // Update project with generated images
    const currentImages = project.generated_images || []
    const updatedImages = [
      ...currentImages,
      ...images.map((img: any) => ({
        ...img,
        metadata
      }))
    ]

    await supabaseAdmin
      .from('projects')
      .update({
        generated_images: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      images,
      prompt: finalPrompt,
      enhancedPrompt,
      metadata
    })

  } catch (error) {
    console.error('Error generating images:', error)
    return NextResponse.json(
      { error: 'Failed to generate images', details: error instanceof Error ? error.message : 'Unknown error' },
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