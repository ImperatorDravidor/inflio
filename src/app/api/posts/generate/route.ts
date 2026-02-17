import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import {
  AdvancedPostsService,
  type GeneratePostsInput,
  type BrandContext,
  type PersonaContext,
  type ContentAnalysisContext
} from '@/lib/ai-posts-advanced'

export const maxDuration = 120

/**
 * POST /api/posts/generate
 *
 * Legacy endpoint — now delegates to the same AdvancedPostsService (GPT-5.2)
 * used by /api/posts/generate-smart.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      projectTitle,
      contentAnalysis,
      transcript,
      personaId,
      contentTypes,
      platforms,
      settings = {}
    } = body

    if (!projectId || !projectTitle) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 })
    }

    // ── Fetch transcript from project if not provided ────────────────────
    let fullTranscript = transcript || ''
    if (!fullTranscript) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('transcription')
        .eq('id', projectId)
        .single()

      if (project?.transcription) {
        if (typeof project.transcription === 'string') {
          fullTranscript = project.transcription
        } else if (project.transcription.text) {
          fullTranscript = project.transcription.text
        } else if (project.transcription.segments) {
          fullTranscript = project.transcription.segments.map((s: any) => s.text).join(' ')
        }
      }
    }

    if (!fullTranscript) {
      return NextResponse.json(
        { error: 'Transcript is required for content-aware post generation' },
        { status: 400 }
      )
    }

    // ── Fetch brand context ──────────────────────────────────────────────
    let brand: BrandContext | undefined
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('company_name, brand_voice, brand_colors, target_audience, content_goals, primary_platforms, brand_identity, brand_analysis')
      .eq('clerk_user_id', userId)
      .single()

    if (profile) {
      const bi = profile.brand_identity || profile.brand_analysis
      brand = {
        companyName: profile.company_name || undefined,
        voice: profile.brand_voice || (bi?.voice?.tone ? (Array.isArray(bi.voice.tone) ? bi.voice.tone.join(', ') : bi.voice.tone) : undefined),
        personality: bi?.voice?.personality || undefined,
        mission: bi?.brandStrategy?.mission || undefined,
        values: bi?.brandStrategy?.values || undefined,
        colors: {
          primary: bi?.colors?.primary?.hex || (profile.brand_colors?.primary ? [profile.brand_colors.primary] : undefined),
          secondary: bi?.colors?.secondary?.hex || (profile.brand_colors?.secondary ? [profile.brand_colors.secondary] : undefined),
          accent: bi?.colors?.accent?.hex || (profile.brand_colors?.accent ? [profile.brand_colors.accent] : undefined),
        },
        targetAudience: {
          description: profile.target_audience?.description || undefined,
          demographics: bi?.targetAudience?.demographics || undefined,
          psychographics: bi?.targetAudience?.psychographics || undefined,
          needs: bi?.targetAudience?.needs || undefined,
        },
        contentGoals: profile.content_goals || undefined,
        primaryPlatforms: profile.primary_platforms || undefined,
      }
    }

    // ── Fetch persona context ────────────────────────────────────────────
    let persona: PersonaContext | null = null
    if (personaId) {
      const { data: personaRecord } = await supabaseAdmin
        .from('personas')
        .select('id, name, description, status, metadata')
        .eq('id', personaId)
        .single()

      if (personaRecord) {
        const portraitCount =
          personaRecord.metadata?.portraits?.length ||
          personaRecord.metadata?.generalPortraitUrls?.length || 0

        persona = {
          id: personaRecord.id,
          name: personaRecord.name,
          description: personaRecord.description || undefined,
          brandVoice: personaRecord.metadata?.brandVoice || undefined,
          hasPortraits: portraitCount > 0,
          portraitCount,
        }
      }
    }

    // ── Build analysis context ───────────────────────────────────────────
    const analysisCtx: ContentAnalysisContext = {
      topics: contentAnalysis?.topics || [],
      keywords: contentAnalysis?.keywords || [],
      keyPoints: contentAnalysis?.keyPoints || [],
      sentiment: contentAnalysis?.sentiment,
      summary: contentAnalysis?.summary,
      keyMoments: contentAnalysis?.keyMoments || [],
      socialMediaHooks: contentAnalysis?.contentSuggestions?.socialMediaHooks || [],
    }

    // ── Generate ─────────────────────────────────────────────────────────
    const input: GeneratePostsInput = {
      transcript: fullTranscript,
      projectTitle,
      contentAnalysis: analysisCtx,
      platforms: platforms || brand?.primaryPlatforms || ['instagram', 'twitter', 'linkedin'],
      brand,
      persona,
      tone: settings.tone,
      contentGoal: settings.contentGoal,
      contentTypes: contentTypes,
    }

    const posts = await AdvancedPostsService.generateAdvancedPosts(input)

    // ── Save to DB ───────────────────────────────────────────────────────
    const suggestions = posts.map((post) => {
      const suggestionId = uuidv4()
      const copyVariants: Record<string, any> = {}
      if (post.platformCopy) {
        for (const [platform, copy] of Object.entries(post.platformCopy)) {
          copyVariants[platform] = {
            caption: copy.caption,
            hashtags: copy.hashtags || [],
            cta: copy.cta || '',
            title: post.title,
            description: post.hook,
          }
        }
      }

      return {
        id: suggestionId,
        project_id: projectId,
        user_id: userId,
        type: post.contentType,
        content_type: post.contentType,
        title: post.title,
        description: post.hook,
        platforms: Object.keys(copyVariants),
        copy_variants: copyVariants,
        images: post.imagePrompt ? [{ id: uuidv4(), type: 'hero', prompt: post.imagePrompt, dimensions: post.imageDimensions || '1080x1350', position: 0 }] : [],
        visual_style: { style: post.imageStyle || 'modern', colors: brand?.colors?.primary || [] },
        engagement_data: {
          predicted_reach: post.engagement?.estimatedReach || 'medium',
          target_audience: post.engagement?.targetAudience || '',
          best_time: post.engagement?.bestTimeToPost || '',
          why_it_works: post.engagement?.whyItWorks || '',
        },
        persona_id: persona?.id || null,
        persona_used: !!persona,
        generation_model: 'gpt-5.2',
        metadata: {
          hook: post.hook,
          transcript_quote: post.transcriptQuote,
          carousel_slides: post.carouselSlides || null,
        },
        status: 'ready',
        created_at: new Date().toISOString(),
      }
    })

    if (suggestions.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('post_suggestions')
        .insert(suggestions)
      if (insertError) {
        console.error('[posts/generate] DB insert error:', insertError)
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    })
  } catch (error) {
    console.error('[posts/generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate post suggestions' },
      { status: 500 }
    )
  }
}
