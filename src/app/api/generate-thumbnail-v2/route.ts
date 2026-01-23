import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNanoBananaService } from '@/lib/services/nano-banana-service'
import { PersonaServiceV2 } from '@/lib/services/persona-service-v2'

export const runtime = 'nodejs'
export const maxDuration = 60 // Nano Banana Pro is faster than LoRA training

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
      videoTitle,
      keyMessage,
      contentTheme,
      personaId
    } = body

    // Validate inputs
    if (!projectId || !videoTitle) {
      return NextResponse.json({
        error: 'Missing required fields: projectId and videoTitle'
      }, { status: 400 })
    }

    console.log('Thumbnail generation request:', {
      projectId,
      videoTitle,
      personaId
    })

    // Fetch project for content analysis
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Load user profile for brand settings
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    // Get persona reference images
    let referenceImages: string[] = []
    let personaName = 'the creator'

    if (personaId || profile?.default_persona_id) {
      const targetPersonaId = personaId || profile?.default_persona_id

      const { data: persona } = await supabaseAdmin
        .from('personas')
        .select('*')
        .eq('id', targetPersonaId)
        .single()

      if (persona) {
        personaName = persona.name

        // Get reference images for character consistency
        referenceImages = await PersonaServiceV2.getPersonaReferenceImages(targetPersonaId)
      }
    }

    // Extract brand colors from brand_identity structure
    const brandIdentity = profile?.brand_identity || profile?.brand_analysis
    const brandColors = brandIdentity?.colors ? {
      primary: brandIdentity.colors.primary?.hex?.[0] || '#4F46E5',
      accent: brandIdentity.colors.accent?.hex?.[0] || brandIdentity.colors.secondary?.hex?.[0] || '#EC4899'
    } : undefined

    // Extract content theme from content analysis
    const autoContentTheme = project.content_analysis?.topics?.slice(0, 3).join(', ') || ''

    // Generate thumbnail with Nano Banana Pro
    const nanoBanana = createNanoBananaService()

    const thumbnailUrl = await nanoBanana.generateViralThumbnail({
      referenceImages,
      personName: personaName,
      videoTitle: videoTitle || project.title,
      keyMessage: keyMessage || videoTitle || project.title,
      brandColors,
      contentTheme: contentTheme || autoContentTheme
    })

    // Download and re-upload to Supabase for persistence
    const imageResponse = await fetch(thumbnailUrl)
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
        prompt: keyMessage,
        base_prompt: `Viral thumbnail for ${videoTitle}`,
        params: {
          contentTheme: contentTheme || autoContentTheme,
          brandColors,
          hasPersona: referenceImages.length > 0,
          personaName,
          dimensions: { width: 1920, height: 1080 }
        },
        model: 'nano-banana-pro',
        lora_ref: personaId || null,
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
          thumbnailModel: 'nano-banana-pro',
          hasPersona: referenceImages.length > 0,
          lastThumbnailId: thumbnailHistory?.id
        }
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      imageUrl: publicUrl,
      metadata: {
        model: 'nano-banana-pro',
        dimensions: '1920x1080',
        hasPersona: referenceImages.length > 0,
        brandColorsApplied: !!brandColors
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
