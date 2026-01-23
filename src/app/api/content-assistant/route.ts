/**
 * Content Assistant API Route
 *
 * Provides deep content analysis using GPT-5.2 with high reasoning.
 * This is the "brain" that analyzes video content and generates
 * intelligent strategies for thumbnails and social content.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const maxDuration = 120 // 2 minutes for deep analysis

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      transcript,
      projectTitle,
      projectDescription,
      personaId,
      action = 'analyze' // 'analyze' | 'thumbnail-plan' | 'social-plan'
    } = body

    if (!transcript || !projectTitle) {
      return NextResponse.json(
        { error: 'transcript and projectTitle are required' },
        { status: 400 }
      )
    }

    // Dynamic imports to avoid client-side issues
    const { createContentAssistant } = await import('@/lib/services/content-assistant-service')
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
        // Get reference images
        const { data: images } = await supabaseAdmin
          .from('persona_images')
          .select('image_url')
          .eq('persona_id', personaId)
          .eq('metadata->>type', 'reference_portrait')
          .limit(4)

        persona = {
          id: personaData.id,
          name: personaData.name,
          description: personaData.description,
          referenceImageUrls: images?.map(i => i.image_url) || personaData.metadata?.portraitUrls?.slice(0, 4) || []
        }
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
        targetAudience: profile.target_audience,
        contentGoals: profile.content_goals
      }
    }

    // Create content assistant with high reasoning
    const assistant = createContentAssistant({ reasoningEffort: 'high' })

    const input = {
      transcript,
      projectTitle,
      projectDescription,
      persona,
      brand
    }

    // Perform the requested action
    if (action === 'analyze') {
      console.log(`[ContentAssistant] Starting deep analysis for project ${projectId}`)
      const analysis = await assistant.analyzeContent(input)

      // Save analysis to project
      if (projectId) {
        await supabaseAdmin
          .from('projects')
          .update({
            content_analysis: {
              ...analysis,
              generatedAt: new Date().toISOString(),
              version: 'v2-deep'
            }
          })
          .eq('id', projectId)
          .eq('user_id', userId)
      }

      return NextResponse.json({
        success: true,
        analysis,
        responseId: analysis.metadata?.responseId
      })
    }

    if (action === 'thumbnail-plan') {
      // First get or perform analysis
      let analysis = body.analysis
      if (!analysis) {
        console.log(`[ContentAssistant] Performing analysis before thumbnail plan...`)
        analysis = await assistant.analyzeContent(input)
      }

      console.log(`[ContentAssistant] Generating thumbnail plan...`)
      const thumbnailPlan = await assistant.generateThumbnailPlan(analysis, input)

      return NextResponse.json({
        success: true,
        thumbnailPlan,
        analysis
      })
    }

    if (action === 'social-plan') {
      // First get or perform analysis
      let analysis = body.analysis
      if (!analysis) {
        console.log(`[ContentAssistant] Performing analysis before social plan...`)
        analysis = await assistant.analyzeContent(input)
      }

      const platforms = body.platforms || ['instagram', 'twitter', 'linkedin']
      console.log(`[ContentAssistant] Generating social content plan for ${platforms.join(', ')}...`)
      const socialPlan = await assistant.generateSocialContentPlan(analysis, input, platforms)

      return NextResponse.json({
        success: true,
        socialPlan,
        analysis
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: analyze, thumbnail-plan, or social-plan' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Content Assistant error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
