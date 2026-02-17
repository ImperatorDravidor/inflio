import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PLATFORM_SPECS } from '@/lib/social-graphics-config'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      projectId,
      prompt,
      platform,
      size,
      template,
      quality = 'high',
      personalPhotos = [],
      personaName,
      brandColor,
      customText,
      needsTransparency = false,
      batchGenerate = false,
      variations = 1,
      style,
      background,
      metadata = {}
    } = body

    // Validate project ownership
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const openai = getOpenAI()
    const graphics = []

    // Parse size
    const [width, height] = size.split('x').map(Number)
    
    // Build enhanced prompt with platform-specific styling
    let enhancedPrompt = prompt
    
    // Add style modifiers
    if (style) {
      const styleModifiers = {
        photorealistic: 'Photorealistic, high-quality photography style',
        illustration: 'Professional illustration style with clean vector graphics',
        minimal: 'Minimal, clean design with plenty of white space',
        bold: 'Bold, high-impact design with strong colors and typography',
        gradient: 'Modern gradient backgrounds with smooth color transitions'
      }
      if (styleModifiers[style as keyof typeof styleModifiers]) {
        enhancedPrompt += `. ${styleModifiers[style as keyof typeof styleModifiers]}.`
      }
    }
    
    // Add platform-specific styling cues
    const platformSpec = PLATFORM_SPECS[platform]
    if (platformSpec) {
      enhancedPrompt += `. Optimized for ${platformSpec.name} with professional ${platform} aesthetic.`
      
      // Add platform color scheme hint
      if (platformSpec.colorScheme && platformSpec.colorScheme.length > 0) {
        enhancedPrompt += ` Consider ${platform} brand colors.`
      }
    }
    
    // Add brand color
    if (brandColor) {
      enhancedPrompt += ` Primary brand color: ${brandColor}.`
    }
    
    // Add custom text formatting
    if (customText) {
      enhancedPrompt += ` Feature the text "${customText}" prominently with excellent typography.`
    }
    
    // Generate variations
    for (let i = 0; i < variations; i++) {
      let variationPrompt = enhancedPrompt
      if (variations > 1) {
        variationPrompt += ` Variation ${i + 1} of ${variations}, unique creative approach.`
      }
      
      try {
        // Determine optimal format
        const format = needsTransparency ? 'png' : 'png' // gpt-image-1 handles transparency automatically
        
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: variationPrompt,
          n: 1,
          size: determineOptimalSize(width, height) as any,
          quality: quality as any,
          background: background || (needsTransparency ? 'transparent' : 'auto'),
          response_format: 'url' // Get URL for faster processing
        })
        
        const imageUrl = response.data?.[0]?.url
        if (!imageUrl) continue
        
        // Download and save
        const imageResponse = await fetch(imageUrl)
        const imageBlob = await imageResponse.blob()
        
        const fileName = `social-${platform}-${template}-${crypto.randomUUID()}.${format}`
        const filePath = `${projectId}/social-graphics/${platform}/${fileName}`
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from('ai-generated-images')
          .upload(filePath, imageBlob, {
            contentType: `image/${format}`,
            upsert: false
          })

        if (!uploadError) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('ai-generated-images')
            .getPublicUrl(filePath)
          
          // Store metadata in database
          const { data: savedGraphic } = await supabaseAdmin
            .from('social_graphics')
            .insert({
              project_id: projectId,
              user_id: userId,
              platform,
              size,
              template,
              url: publicUrl,
              prompt: variationPrompt,
              metadata: {
                brandColor,
                customText,
                hasPersona: personalPhotos.length > 0,
                personaName,
                needsTransparency,
                generatedWith: 'gpt-image-1',
                quality,
                style,
                variation: variations > 1 ? i + 1 : null,
                ...metadata // Include suggestion metadata (priority, engagement, etc.)
              }
            })
            .select()
            .single()
          
          graphics.push({
            id: savedGraphic?.id || crypto.randomUUID(),
            url: publicUrl,
            platform,
            size,
            template,
            metadata: savedGraphic?.metadata
          })
        }
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error)
      }
    }
    
    // Update project metadata
    await supabaseAdmin
      .from('projects')
      .update({
        metadata: {
          ...project.metadata,
          lastSocialGraphicsGeneration: new Date().toISOString(),
          totalSocialGraphics: (project.metadata?.totalSocialGraphics || 0) + graphics.length
        }
      })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      graphics,
      count: graphics.length
    })

  } catch (error) {
    console.error('Social graphics generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate graphics' },
      { status: 500 }
    )
  }
}

// Helper function to determine optimal size for gpt-image-1
function determineOptimalSize(width: number, height: number): string {
  const aspectRatio = width / height
  
  // Square
  if (Math.abs(aspectRatio - 1) < 0.1) {
    return "1024x1024"
  }
  
  // Landscape
  if (aspectRatio > 1.3) {
    return "1536x1024"
  }
  
  // Portrait
  if (aspectRatio < 0.8) {
    return "1024x1536"
  }
  
  // Default to square
  return "1024x1024"
} 