import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { v4 as uuidv4 } from 'uuid'
import { AdvancedPostsService } from '@/lib/ai-posts-advanced'

export async function POST(req: NextRequest) {
  console.log('[generate-smart] Request received')
  
  try {
    // Check for internal API key for server-to-server calls
    const internalKey = req.headers.get('X-Internal-Key')
    const isInternalCall = internalKey === process.env.INTERNAL_API_KEY || 
                           req.headers.get('user-agent')?.includes('node-fetch') || 
                           req.headers.get('x-forwarded-for') === '::1' ||
                           req.headers.get('x-forwarded-for') === '127.0.0.1'
    
    // Get userId from auth or allow internal calls
    const { userId } = await auth()
    console.log('[generate-smart] Auth check:', { userId, isInternalCall })
    
    if (!userId && !isInternalCall) {
      console.log('[generate-smart] Unauthorized: No userId and not internal call')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      projectId,
      projectTitle,
      contentAnalysis,
      transcript,
      settings
    } = body

    if (!projectId || !projectTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If internal call without userId, get it from the project
    let effectiveUserId = userId
    if (!userId && isInternalCall) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()
      
      if (project?.user_id) {
        effectiveUserId = project.user_id
        console.log('[generate-smart] Using userId from project:', effectiveUserId)
      }
    }

    const openai = getOpenAI()

    // Get persona details if selected
    let personaContext = ''
    if (settings.usePersona && settings.selectedPersonaId) {
      const { data: persona } = await supabaseAdmin
        .from('personas')
        .select('*')
        .eq('id', settings.selectedPersonaId)
        .single()
      
      if (persona) {
        personaContext = `
Brand Persona: ${persona.name}
Brand Voice: ${persona.brand_voice || 'Not specified'}
Description: ${persona.description || 'Not specified'}
Style Preferences: Professional and consistent with brand identity
`
      }
    }

    // Get trending topics if enabled (in production, fetch from trend API)
    let trendingContext = ''
    if (settings.useTrendingTopics) {
      trendingContext = `
Consider incorporating these trending topics where relevant:
- AI and automation in business
- Sustainability and green initiatives  
- Remote work and digital transformation
- Personal development and productivity
- Mental health and wellness
- Creator economy and content monetization
`
    }

    // Use Advanced Posts Service for better suggestions
    const advancedPosts = await AdvancedPostsService.generateAdvancedPosts(
      transcript || '',
      projectTitle,
      contentAnalysis,
      {
        platforms: settings.platforms,
        usePersona: settings.usePersona,
        personaDetails: personaContext ? {
          name: settings.selectedPersonaId,
          context: personaContext
        } : undefined,
        brandVoice: settings.tone || 'Professional yet approachable'
      }
    )
    
    console.log('[generate-smart] Generated', advancedPosts.length, 'advanced post suggestions')

    // Transform advanced posts into database-ready format
    const suggestions = []
    
    for (const post of advancedPosts) {
      const suggestionId = uuidv4()
      
      // Create copy variants for each platform
      const copyVariants: Record<string, any> = {}
      for (const platform of post.platforms.primary) {
        copyVariants[platform] = {
          caption: post.content.body,
          hashtags: post.content.hashtags,
          cta: post.content.cta,
          title: post.content.title,
          description: post.content.preview
        }
      }
      
      // Create images array from visual specifications
      const images = []
      if (post.visual.aiPrompt) {
        images.push({
          id: uuidv4(),
          type: 'hero',
          prompt: post.visual.aiPrompt,
          text_overlay: post.visual.textOverlay || '',
          dimensions: post.visual.dimensions,
          position: 0
        })
      }
      
      // Store the suggestion
      const suggestion = {
        id: suggestionId,
        project_id: projectId,
        user_id: effectiveUserId || userId,
        content_type: post.contentType.format,
        title: post.content.title,
        description: post.contentType.description,
        platforms: post.platforms.primary,
        copy_variants: copyVariants,
        images: images,
        visual_style: {
          style: post.visual.style,
          colors: post.visual.primaryColors,
          description: post.visual.description
        },
        engagement_data: {
          predicted_reach: post.insights.estimatedReach,
          target_audience: post.insights.targetAudience,
          best_time: post.insights.bestTime,
          why_it_works: post.insights.whyItWorks,
          engagement_tip: post.insights.engagementTip
        },
        metadata: {
          uses_persona: post.actions.needsPersona,
          ready_to_post: post.actions.readyToPost,
          can_edit: post.actions.canEditText,
          can_generate_image: post.actions.canGenerateImage,
          content_length: post.content.wordCount,
          hook: post.content.hook,
          preview: post.content.preview
        },
        created_at: new Date().toISOString()
      }
      
      suggestions.push(suggestion)
    }
    
    // Save all suggestions to database
    if (suggestions.length > 0 && effectiveUserId) {
      const { error: insertError } = await supabaseAdmin
        .from('post_suggestions')
        .insert(suggestions)
        
      if (insertError) {
        console.error('[generate-smart] Error saving suggestions:', insertError)
      } else {
        console.log('[generate-smart] Saved', suggestions.length, 'suggestions to database')
      }
    }
    
    // Return the suggestions
    return NextResponse.json({
      success: true,
      suggestions: suggestions,
      count: suggestions.length,
      project_id: projectId
    })
    
  } catch (error) {
    console.error('[generate-smart] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate post suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}