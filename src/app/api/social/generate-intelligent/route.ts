/**
 * Intelligent Social Content Generation API
 *
 * Generates narrative-driven social content (carousels, quotes, hooks)
 * based on deep content analysis from the Content Assistant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for full generation with images

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      // Content source - provide either analysis + contentPlan OR let us generate
      analysis,
      contentPlan,
      transcript,
      projectTitle,
      // Persona for image generation
      personaId,
      // Generation options
      platforms = ['instagram', 'twitter', 'linkedin'],
      contentTypes = ['carousel', 'quote'],
      generateImages = true,
      imageQuality = 'high'
    } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Dynamic imports
    const { createContentAssistant } = await import('@/lib/services/content-assistant-service')
    const { createIntelligentSocialService } = await import('@/lib/services/intelligent-social-service')
    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    // Fetch project if we need transcript
    let projectTranscript = transcript
    let projectData = null

    if (!projectTranscript) {
      const { data } = await supabaseAdmin
        .from('projects')
        .select('title, transcription, content_analysis')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()

      if (!data) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      projectData = data
      projectTranscript = data.transcription?.text || data.transcription?.full_text
    }

    if (!projectTranscript) {
      return NextResponse.json(
        { error: 'No transcript available. Please process the video first.' },
        { status: 400 }
      )
    }

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
        const { data: images } = await supabaseAdmin
          .from('persona_images')
          .select('image_url')
          .eq('persona_id', personaId)
          .eq('metadata->>type', 'reference_portrait')
          .limit(4)

        persona = {
          id: personaData.id,
          name: personaData.name,
          referenceImageUrls: images?.map(i => i.image_url) ||
            personaData.metadata?.portraitUrls?.slice(0, 4) ||
            []
        }

        console.log(`[IntelligentSocial] Using persona "${persona.name}" with ${persona.referenceImageUrls.length} reference images`)
      }
    }

    // Fetch user profile for brand settings
    let brand = undefined
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (profile) {
      brand = {
        name: profile.company_name,
        voice: profile.brand_voice,
        colors: profile.brand_colors,
        targetAudience: profile.target_audience
      }
    }

    // Get or generate analysis and content plan
    let finalAnalysis = analysis
    let finalContentPlan = contentPlan

    const title = projectTitle || projectData?.title || 'Untitled Video'

    if (!finalAnalysis || !finalContentPlan) {
      console.log(`[IntelligentSocial] Generating content analysis and plan...`)

      const assistant = createContentAssistant({ reasoningEffort: 'high' })

      const input = {
        transcript: projectTranscript,
        projectTitle: title,
        persona: persona ? {
          id: persona.id,
          name: persona.name,
          description: undefined,
          referenceImageUrls: persona.referenceImageUrls
        } : undefined,
        brand
      }

      // Generate analysis if not provided
      if (!finalAnalysis) {
        console.log(`[IntelligentSocial] Step 1: Deep content analysis...`)
        finalAnalysis = await assistant.analyzeContent(input)

        // Save to project
        await supabaseAdmin
          .from('projects')
          .update({
            content_analysis: {
              ...finalAnalysis,
              generatedAt: new Date().toISOString(),
              version: 'v2-deep'
            }
          })
          .eq('id', projectId)
      }

      // Generate content plan if not provided
      if (!finalContentPlan) {
        console.log(`[IntelligentSocial] Step 2: Social content plan...`)
        finalContentPlan = await assistant.generateSocialContentPlan(
          finalAnalysis,
          input,
          platforms
        )
      }
    }

    // Now generate the actual social content with images
    console.log(`[IntelligentSocial] Step 3: Generating social content for ${platforms.join(', ')}...`)

    const socialService = createIntelligentSocialService()

    const result = await socialService.generateSocialContent({
      analysis: finalAnalysis,
      contentPlan: finalContentPlan,
      transcript: projectTranscript,
      projectTitle: title,
      projectId,
      userId,
      persona,
      brand,
      options: {
        platforms,
        contentTypes,
        generateImages,
        imageQuality
      }
    })

    if (!result.success && result.carousels.length === 0 && result.quotes.length === 0) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate social content' },
        { status: 500 }
      )
    }

    // Update project with generation status
    // First fetch current metadata, then merge
    const { data: currentProject } = await supabaseAdmin
      .from('projects')
      .select('metadata')
      .eq('id', projectId)
      .single()

    await supabaseAdmin
      .from('projects')
      .update({
        metadata: {
          ...(currentProject?.metadata || {}),
          socialContentGenerated: true,
          socialContentGeneratedAt: new Date().toISOString(),
          socialContentStats: {
            carousels: result.carousels.length,
            quotes: result.quotes.length,
            hooks: result.hooks.length,
            totalImages: result.metadata.totalImagesGenerated
          }
        }
      })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      carousels: result.carousels,
      quotes: result.quotes,
      hooks: result.hooks,
      analysis: finalAnalysis,
      contentPlan: finalContentPlan,
      metadata: result.metadata
    })
  } catch (error) {
    console.error('Intelligent social generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate social content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to fetch existing generated content for a project
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase/admin')

    // Fetch all post suggestions for this project
    const { data: suggestions, error } = await supabaseAdmin
      .from('post_suggestions')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Group by content type
    const carousels = suggestions?.filter(s => s.content_type === 'carousel') || []
    const quotes = suggestions?.filter(s => s.content_type === 'quote') || []
    const hooks = suggestions?.filter(s => s.content_type === 'single') || []

    return NextResponse.json({
      success: true,
      carousels,
      quotes,
      hooks,
      total: suggestions?.length || 0
    })
  } catch (error) {
    console.error('Fetch social content error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social content' },
      { status: 500 }
    )
  }
}
