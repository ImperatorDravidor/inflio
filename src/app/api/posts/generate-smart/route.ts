import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import {
  AdvancedPostsService,
  type GeneratePostsInput,
  type ContentAnalysisContext
} from '@/lib/ai-posts-advanced'
import { fetchBrandAndPersonaContext, extractTranscriptText } from '@/lib/ai-context'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  console.log('[generate-smart] Request received')

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const internalKey = req.headers.get('X-Internal-Key')
    const isInternalCall =
      internalKey === process.env.INTERNAL_API_KEY ||
      req.headers.get('user-agent')?.includes('node-fetch') ||
      req.headers.get('x-forwarded-for') === '::1' ||
      req.headers.get('x-forwarded-for') === '127.0.0.1'

    const { userId } = await auth()

    if (!userId && !isInternalCall) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, projectTitle, contentAnalysis, transcript, settings = {} } = body

    if (!projectId || !projectTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Resolve userId ──────────────────────────────────────────────────────
    let effectiveUserId = userId
    if (!userId && isInternalCall) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()
      if (project?.user_id) {
        effectiveUserId = project.user_id
      }
    }

    // ── Fetch project data (transcript + content brief) ─────────────────────
    let fullTranscript = transcript || ''
    let contentBrief: any = null
    if (!fullTranscript) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('transcription, content_brief')
        .eq('id', projectId)
        .single()
      fullTranscript = extractTranscriptText(project?.transcription)
      contentBrief = project?.content_brief
    } else {
      // Still fetch content brief even if transcript was provided
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('content_brief')
        .eq('id', projectId)
        .single()
      contentBrief = project?.content_brief
    }

    if (!fullTranscript) {
      console.warn('[generate-smart] No transcript available, proceeding with content analysis only')
    }

    // ── Fetch brand + persona via shared utility ─────────────────────────────
    const personaId = settings.selectedPersonaId || settings.personaId
    const { brand, persona } = effectiveUserId
      ? await fetchBrandAndPersonaContext(effectiveUserId, settings.usePersona ? personaId : null)
      : { brand: undefined, persona: null }

    // ── Build content analysis context ──────────────────────────────────────
    const analysisCtx: ContentAnalysisContext = {
      topics: contentAnalysis?.topics || [],
      keywords: contentAnalysis?.keywords || [],
      keyPoints: contentAnalysis?.keyPoints || [],
      sentiment: contentAnalysis?.sentiment,
      summary: contentAnalysis?.summary,
      keyMoments: contentAnalysis?.keyMoments || [],
      socialMediaHooks: contentAnalysis?.contentSuggestions?.socialMediaHooks || [],
    }

    // ── Call the service ────────────────────────────────────────────────────
    const input: GeneratePostsInput = {
      transcript: fullTranscript,
      projectTitle,
      contentAnalysis: analysisCtx,
      platforms: settings.platforms || brand?.primaryPlatforms || ['instagram', 'twitter', 'linkedin'],
      brand,
      persona,
      tone: settings.tone,
      contentGoal: settings.contentGoal,
      contentTypes: settings.contentTypes,
      contentBrief,
      creativity: settings.creativity,
    }

    const posts = await AdvancedPostsService.generateAdvancedPosts(input)
    console.log('[generate-smart] Generated', posts.length, 'posts')

    // ── Transform to DB format and save ─────────────────────────────────────
    const suggestions = posts.map((post) => {
      const suggestionId = uuidv4()

      // Build copy_variants from platformCopy
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

      // Build images array
      const images = []
      if (post.imagePrompt) {
        images.push({
          id: uuidv4(),
          type: 'hero',
          prompt: post.imagePrompt,
          text_overlay: '',
          dimensions: post.imageDimensions || '1080x1350',
          position: 0,
        })
      }
      // Add per-slide images for carousels
      if (post.contentType === 'carousel' && post.carouselSlides?.length) {
        for (const slide of post.carouselSlides) {
          if (slide.visualPrompt) {
            images.push({
              id: uuidv4(),
              type: `slide_${slide.slideNumber}`,
              prompt: slide.visualPrompt,
              text_overlay: slide.headline || '',
              dimensions: '1080x1350',
              position: slide.slideNumber,
            })
          }
        }
      }

      return {
        id: suggestionId,
        project_id: projectId,
        user_id: effectiveUserId || userId,
        type: post.contentType,
        content_type: post.contentType,
        title: post.title,
        description: post.hook,
        platforms: Object.keys(copyVariants),
        copy_variants: copyVariants,
        images,
        visual_style: {
          style: post.imageStyle || 'modern',
          colors: brand?.colors?.primary || [],
          description: post.imagePrompt,
        },
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
          content_goal: settings.contentGoal || null,
          tone: settings.tone || null,
        },
        status: 'ready',
        created_at: new Date().toISOString(),
      }
    })

    // Save to database
    if (suggestions.length > 0 && effectiveUserId) {
      const { error: insertError } = await supabaseAdmin
        .from('post_suggestions')
        .insert(suggestions)

      if (insertError) {
        console.error('[generate-smart] DB insert error:', insertError)
        // Still return suggestions even if DB save fails
      } else {
        console.log('[generate-smart] Saved', suggestions.length, 'suggestions to DB')
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
      project_id: projectId,
    })
  } catch (error) {
    console.error('[generate-smart] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate post suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
