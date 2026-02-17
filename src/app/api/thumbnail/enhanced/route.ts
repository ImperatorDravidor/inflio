/**
 * Enhanced Thumbnail Generation API
 *
 * Uses GPT-Image 1.5 with persona reference images for high-fidelity
 * thumbnail generation based on deep content analysis.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const maxDuration = 180 // 3 minutes for image generation

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      // Option 1: Provide a detailed prompt directly
      prompt,
      // Option 2: Provide a thumbnail concept from Content Assistant
      concept,
      // Persona settings
      personaId,
      // Generation options
      quality = 'high',
      aspectRatio = '16:9',
      numVariations = 1,
      // Brand settings
      brandColors
    } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    if (!prompt && !concept) {
      return NextResponse.json(
        { error: 'Either prompt or concept is required' },
        { status: 400 }
      )
    }

    // Dynamic imports
    const { createEnhancedThumbnailService } = await import('@/lib/services/enhanced-thumbnail-service')
    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    // Fetch persona if provided
    let persona = undefined
    if (personaId) {
      const { data: personaData } = await supabaseAdmin
        .from('personas')
        .select('id, name, description, metadata')
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()

      if (personaData) {
        // Get reference images from persona_images or metadata
        const { data: images } = await supabaseAdmin
          .from('persona_images')
          .select('image_url')
          .eq('persona_id', personaId)
          .eq('metadata->>type', 'reference_portrait')
          .limit(4)

        const referenceUrls = images?.map(i => i.image_url) ||
          personaData.metadata?.portraitUrls?.slice(0, 4) ||
          personaData.metadata?.generalPortraitUrls?.slice(0, 4) ||
          []

        persona = {
          id: personaData.id,
          name: personaData.name,
          referenceImageUrls: referenceUrls
        }

        console.log(`[EnhancedThumbnail] Using persona "${persona.name}" with ${persona.referenceImageUrls.length} reference images`)
      }
    }

    // Build the prompt
    let finalPrompt: string
    let negativePrompt: string | undefined

    if (concept) {
      // Use concept from Content Assistant
      finalPrompt = concept.detailedPrompt
      negativePrompt = concept.negativePrompt

      // Add text overlay instructions if provided
      if (concept.textOverlay) {
        finalPrompt += `\n\nTEXT OVERLAY:
- Primary text: "${concept.textOverlay.primary}"
${concept.textOverlay.secondary ? `- Secondary text: "${concept.textOverlay.secondary}"` : ''}
- Placement: ${concept.textOverlay.placement}
- Make text legible and visually integrated`
      }
    } else {
      // Use direct prompt
      finalPrompt = prompt
    }

    // Create thumbnail service and generate
    const thumbnailService = createEnhancedThumbnailService()

    console.log(`[EnhancedThumbnail] Generating ${numVariations} thumbnail(s) for project ${projectId}`)

    const result = await thumbnailService.generateThumbnail({
      prompt: finalPrompt,
      negativePrompt,
      persona,
      brand: brandColors ? { primaryColor: brandColors.primary, accentColor: brandColors.accent } : undefined,
      options: {
        quality,
        aspectRatio,
        numVariations: Math.min(numVariations, 4),
        outputFormat: 'png',
        inputFidelity: 'high'
      },
      projectId,
      userId
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Thumbnail generation failed' },
        { status: 500 }
      )
    }

    // Update project with primary thumbnail
    if (result.thumbnails.length > 0) {
      const primaryThumbnail = result.thumbnails[0]
      await supabaseAdmin
        .from('projects')
        .update({
          thumbnail_url: primaryThumbnail.localUrl || primaryThumbnail.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', userId)
    }

    return NextResponse.json({
      success: true,
      thumbnails: result.thumbnails,
      metadata: result.metadata
    })
  } catch (error) {
    console.error('Enhanced thumbnail generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate thumbnail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate multiple thumbnail variations
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, prompt, personaId, count = 3 } = body

    if (!projectId || !prompt) {
      return NextResponse.json(
        { error: 'projectId and prompt are required' },
        { status: 400 }
      )
    }

    const { createEnhancedThumbnailService } = await import('@/lib/services/enhanced-thumbnail-service')
    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    // Fetch persona
    let persona = undefined
    if (personaId) {
      const { data: personaData } = await supabaseAdmin
        .from('personas')
        .select('id, name, metadata')
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()

      if (personaData) {
        const { data: images } = await supabaseAdmin
          .from('persona_images')
          .select('image_url')
          .eq('persona_id', personaId)
          .eq('metadata->>type', 'reference_portrait')
          .limit(4)

        persona = {
          id: personaData.id,
          name: personaData.name,
          referenceImageUrls: images?.map(i => i.image_url) || personaData.metadata?.portraitUrls?.slice(0, 4) || []
        }
      }
    }

    const thumbnailService = createEnhancedThumbnailService()

    const result = await thumbnailService.generateVariations(
      {
        prompt,
        persona,
        projectId,
        userId,
        options: { quality: 'high', aspectRatio: '16:9' }
      },
      Math.min(count, 5)
    )

    return NextResponse.json({
      success: result.success,
      thumbnails: result.thumbnails,
      metadata: result.metadata
    })
  } catch (error) {
    console.error('Thumbnail variations error:', error)
    return NextResponse.json(
      { error: 'Failed to generate variations' },
      { status: 500 }
    )
  }
}
