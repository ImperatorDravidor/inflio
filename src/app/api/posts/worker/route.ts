import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import {
  AdvancedPostsService,
  type GeneratePostsInput,
  type ContentAnalysisContext
} from '@/lib/ai-posts-advanced'
import { fetchBrandAndPersonaContext, extractTranscriptText } from '@/lib/ai-context'

// This worker runs as its own serverless function invocation, decoupled from the client request.
// Even if the client disconnects, this keeps running until completion or timeout.
export const maxDuration = 120

export async function POST(req: NextRequest) {
  // Verify this is an internal call (server-to-server only)
  const internalKey = req.headers.get('X-Internal-Key')
  const isLocal = req.headers.get('host')?.includes('localhost')
  if (!isLocal && internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await req.json()
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  console.log('[posts-worker] Processing job:', jobId)

  // Fetch the job
  const { data: job, error: jobError } = await supabaseAdmin
    .from('post_generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    console.error('[posts-worker] Job not found:', jobId, jobError)
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Guard: only process pending/running jobs (idempotent)
  if (job.status === 'completed') {
    console.log('[posts-worker] Job already completed:', jobId)
    return NextResponse.json({ status: 'already_completed' })
  }

  // Mark as running
  await supabaseAdmin
    .from('post_generation_jobs')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', jobId)

  try {
    const params = job.input_params
    const {
      projectId,
      projectTitle,
      contentAnalysis,
      transcript: providedTranscript,
      settings = {},
      userId
    } = params

    // ── Fetch project data ───────────────────────────────────────────────────
    let fullTranscript = providedTranscript || ''
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
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('content_brief')
        .eq('id', projectId)
        .single()
      contentBrief = project?.content_brief
    }

    if (!fullTranscript) {
      console.warn('[posts-worker] No transcript available for job:', jobId)
    }

    // ── Fetch brand + persona ────────────────────────────────────────────────
    const personaId = settings.selectedPersonaId || settings.personaId
    const { brand, persona } = userId
      ? await fetchBrandAndPersonaContext(userId, settings.usePersona ? personaId : null)
      : { brand: undefined, persona: null }

    // ── Build input ──────────────────────────────────────────────────────────
    const analysisCtx: ContentAnalysisContext = {
      topics: contentAnalysis?.topics || [],
      keywords: contentAnalysis?.keywords || [],
      keyPoints: contentAnalysis?.keyPoints || [],
      sentiment: contentAnalysis?.sentiment,
      summary: contentAnalysis?.summary,
      keyMoments: contentAnalysis?.keyMoments || [],
      socialMediaHooks: contentAnalysis?.contentSuggestions?.socialMediaHooks || [],
    }

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

    // ── Call GPT-5.2 ─────────────────────────────────────────────────────────
    console.log('[posts-worker] Calling GPT-5.2 for job:', jobId)
    const posts = await AdvancedPostsService.generateAdvancedPosts(input)
    console.log('[posts-worker] Generated', posts.length, 'posts for job:', jobId)

    // ── Transform and save to DB ─────────────────────────────────────────────
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
        user_id: userId,
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
          job_id: jobId,
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
        console.error('[posts-worker] DB insert error:', insertError)
        throw new Error(`Failed to save suggestions: ${insertError.message}`)
      }

      console.log('[posts-worker] Saved', suggestions.length, 'suggestions')
    }

    // ── Mark job completed ───────────────────────────────────────────────────
    await supabaseAdmin
      .from('post_generation_jobs')
      .update({
        status: 'completed',
        completed_items: suggestions.length,
        total_items: suggestions.length,
        output_data: { suggestion_ids: suggestions.map(s => s.id) },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    console.log('[posts-worker] Job completed:', jobId)
    return NextResponse.json({ status: 'completed', count: suggestions.length })

  } catch (error) {
    console.error('[posts-worker] Job failed:', jobId, error)

    // Mark job as failed with error message
    await supabaseAdmin
      .from('post_generation_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return NextResponse.json({
      error: 'Worker failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
