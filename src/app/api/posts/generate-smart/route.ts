import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    // Check for internal API key for server-to-server calls
    const internalKey = req.headers.get('X-Internal-Key')
    const isInternalCall = internalKey === process.env.INTERNAL_API_KEY
    
    // Get userId from auth or allow internal calls
    const { userId } = await auth()
    if (!userId && !isInternalCall) {
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

    // Enhanced system prompt with comprehensive content strategy
    const systemPrompt = `You are an elite social media strategist and content creator with deep expertise in:
- Platform-specific algorithms and best practices
- Viral content psychology and engagement mechanics
- Brand storytelling and narrative design
- Visual content strategy and design principles
- Community building and audience psychology

Your content creation framework:
1. HOOK (0-3 seconds): Pattern interrupt, curiosity gap, or shocking value proposition
2. RETENTION: Story arcs, value ladders, open loops, and emotional rollercoasters
3. ENGAGEMENT: Interactive elements, questions, challenges, and community triggers
4. CONVERSION: Clear CTAs, social proof, urgency, and benefit stacking
5. VIRALITY: Shareability factors, memetic potential, and network effects

Platform Algorithm Optimization:
- Instagram: Saves > Shares > Comments > Likes, Stories engagement, Reels watch time
- Twitter/X: Quote tweets, replies, bookmark rate, dwell time
- LinkedIn: Dwell time, comments from connections, reshares with insights
- TikTok: Completion rate, rewatches, shares, comment engagement
- YouTube Shorts: AVD (average view duration), likes, subscribe rate
- Facebook: Meaningful interactions, video retention, share velocity

${personaContext}
${trendingContext}

Project Context:
- Title: ${projectTitle}
- Content Type: Video-based social media content
- Target Audience: ${settings.targetAudience || 'General audience interested in the topic'}
- Content Goals: ${settings.contentGoal || 'Maximize engagement and conversions'}
- Brand Voice: ${settings.tone || 'Professional yet approachable'}
- Visual Style: ${settings.visualStyle || 'Modern and eye-catching'}

Content Requirements:
- Emojis: ${settings.includeEmojis ? 'Yes - use strategically for emphasis and emotion' : 'No emojis'}
- Hashtags: ${settings.includeHashtags ? 'Yes - mix of trending, niche, and branded tags' : 'Minimal hashtags'}
- CTAs: ${settings.includeCTA ? 'Strong, clear call-to-action with urgency' : 'Soft or implied CTA'}
- Optimization: ${settings.optimizeForEngagement ? 'Maximum virality and engagement' : 'Balanced quality and engagement'}
- Persona Usage: ${settings.usePersona ? 'Include persona in visuals where appropriate' : 'Generic visuals'}`

    // Generate suggestions for each content type
    const suggestions = []
    
    for (const contentType of settings.contentTypes) {
      // Content type specific instructions
      const contentInstructions = {
        carousel: 'Create a 5-8 slide carousel that tells a story or teaches a concept step-by-step',
        quote: 'Extract or create a powerful, shareable quote with visual impact',
        single: 'Design a single image post with a strong hook and clear message',
        thread: 'Write a compelling multi-part thread that builds curiosity with each part',
        reel: 'Outline a 15-60 second video concept with hook, middle, and CTA',
        story: 'Create ephemeral content that feels authentic and urgent'
      }

      const userPrompt = `Create a COMPLETE, PRODUCTION-READY ${contentType} post for "${projectTitle}".

Content Intelligence:
- Core Topics: ${contentAnalysis?.topics?.join(', ') || 'General content'}
- SEO Keywords: ${contentAnalysis?.keywords?.join(', ') || 'Not specified'}
- Key Moments: ${contentAnalysis?.keyMoments?.map((m: any) => `[${m.timestamp}s] ${m.description}`).join('; ') || 'Not available'}
- Emotional Tone: ${contentAnalysis?.sentiment || 'Neutral'}
- Viral Hooks: ${contentAnalysis?.contentSuggestions?.socialMediaHooks?.join('; ') || 'Generate from content'}

${transcript ? `Transcript Excerpt (for context and quotes):\n"${transcript.substring(0, 1200)}..."` : ''}

Content Type: ${contentInstructions[contentType as keyof typeof contentInstructions]}

Generate a COMPLETE, DETAILED post with ALL required fields:

1. METADATA:
   - title: Catchy internal title (for dashboard)
   - description: What this post does and why it will succeed
   - content_type: "${contentType}"
   - primary_goal: The main objective (awareness/engagement/conversion)

2. VISUAL SPECIFICATIONS:
   - hero_image: Detailed AI prompt for main image (150+ words)
   - supporting_images: Array of image descriptions for carousel/thread
   - visual_style: Specific style guide (colors, fonts, composition)
   - persona_integration: How to include persona if available
   - image_text_overlay: Exact text to overlay on images
   - recommended_dimensions: Platform-specific sizes

3. PLATFORM-OPTIMIZED CONTENT (for each: ${settings.platforms.join(', ')}):
   For each platform provide:
   - caption: Full, formatted caption with line breaks
   - hashtags: Researched, relevant hashtags (mix of reach levels)
   - first_comment: Additional value or CTA for first comment
   - cta: Specific call-to-action
   - optimal_length: Character count
   - format_notes: Platform-specific formatting
   - algorithm_optimization: Specific tactics for that platform

4. ENGAGEMENT MECHANICS:
   - hook_variations: 3 different opening hooks to A/B test
   - engagement_triggers: Questions, polls, challenges to boost interaction
   - shareability_factors: What makes this shareable
   - comment_starters: Conversation prompts
   - save_triggers: Why people will save this

5. PERFORMANCE METRICS:
   - predicted_reach: Estimated reach based on content type
   - engagement_score: 0-100 with detailed breakdown
   - viral_potential: Low/Medium/High with reasoning
   - best_posting_times: Specific times for each platform with timezone
   - expected_demographics: Who will engage most

6. PLATFORM READINESS:
   For each platform, specify:
   - is_ready: true/false
   - missing_elements: What's needed to make it ready
   - optimization_tips: How to improve for this platform
   - compliance_check: Meets platform guidelines?

7. PERSONALIZATION OPTIONS:
   - persona_variations: How to adapt if using persona
   - brand_voice_options: Different tone variations
   - localization_notes: How to adapt for different markets

8. PRODUCTION CHECKLIST:
   - required_assets: List of all assets needed
   - creation_steps: Step-by-step production guide
   - review_points: Quality check items
   - dependencies: What's needed before posting

Return as a comprehensive JSON object with ALL fields populated. This should be ready to post immediately after asset creation.`

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-5', // Using GPT-5 for better quality [[memory:4799270]]
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          // GPT-5 only supports default temperature (1.0)
          max_completion_tokens: 4000, // Updated for GPT-5 API requirements
          response_format: { type: 'json_object' }
        })

        const response = completion.choices[0].message.content
        if (response) {
          const parsed = JSON.parse(response)
          
          // Create comprehensive suggestion record
          const suggestionId = uuidv4()
          
          // For internal calls, get user_id from project
          let finalUserId = userId
          if (isInternalCall && !userId) {
            const { data: project } = await supabaseAdmin
              .from('projects')
              .select('user_id')
              .eq('id', projectId)
              .single()
            
            finalUserId = project?.user_id || null
          }
          
          // Process platform-specific content
          const copyVariants: Record<string, any> = {}
          const platformReadiness: Record<string, any> = {}
          
          for (const platform of settings.platforms) {
            const platformContent = parsed[platform] || parsed.platform_content?.[platform] || {}
            copyVariants[platform] = {
              caption: platformContent.caption || parsed.caption || '',
              hashtags: platformContent.hashtags || parsed.hashtags || [],
              cta: platformContent.cta || parsed.cta || '',
              first_comment: platformContent.first_comment || '',
              title: platformContent.title || parsed.title || '',
              description: platformContent.description || parsed.description || '',
              format_notes: platformContent.format_notes || '',
              optimal_length: platformContent.optimal_length || 0,
              algorithm_optimization: platformContent.algorithm_optimization || ''
            }
            
            // Platform readiness check
            const readiness = parsed.platform_readiness?.[platform] || {}
            platformReadiness[platform] = {
              is_ready: readiness.is_ready !== false,
              missing_elements: readiness.missing_elements || [],
              optimization_tips: readiness.optimization_tips || [],
              compliance_check: readiness.compliance_check !== false
            }
          }
          
          // Process visual specifications
          const visualSpecs = parsed.visual_specifications || {}
          const images = []
          
          // Add hero image
          if (visualSpecs.hero_image || parsed.hero_image) {
            images.push({
              id: uuidv4(),
              type: 'hero',
              prompt: visualSpecs.hero_image || parsed.hero_image,
              text_overlay: visualSpecs.image_text_overlay || '',
              dimensions: visualSpecs.recommended_dimensions || '1080x1080',
              position: 0
            })
          }
          
          // Add supporting images for carousels
          if (visualSpecs.supporting_images && Array.isArray(visualSpecs.supporting_images)) {
            visualSpecs.supporting_images.forEach((img: any, idx: number) => {
              images.push({
                id: uuidv4(),
                type: 'supporting',
                prompt: typeof img === 'string' ? img : img.prompt,
                text_overlay: img.text_overlay || '',
                dimensions: img.dimensions || '1080x1080',
                position: idx + 1
              })
            })
          }
          
          const suggestion = {
            id: suggestionId,
            project_id: projectId,
            user_id: finalUserId,
            content_type: contentType,
            title: parsed.metadata?.title || parsed.title || `${contentType} Post`,
            description: parsed.metadata?.description || parsed.description || 'AI-generated social media post',
            primary_goal: parsed.metadata?.primary_goal || parsed.primary_goal || 'engagement',
            
            // Visual content
            images,
            visual_style: visualSpecs.visual_style || parsed.visual_style || 'modern',
            persona_integration: visualSpecs.persona_integration || parsed.persona_integration || '',
            
            // Platform content
            copy_variants: copyVariants,
            platform_readiness: platformReadiness,
            eligible_platforms: settings.platforms,
            
            // Engagement mechanics
            hook_variations: parsed.engagement_mechanics?.hook_variations || parsed.hook_variations || [],
            engagement_triggers: parsed.engagement_mechanics?.engagement_triggers || [],
            shareability_factors: parsed.engagement_mechanics?.shareability_factors || [],
            comment_starters: parsed.engagement_mechanics?.comment_starters || [],
            
            // Performance predictions
            engagement_prediction: (parsed.performance_metrics?.engagement_score || parsed.engagement_score || 75) / 100,
            viral_potential: parsed.performance_metrics?.viral_potential || parsed.viral_potential || 'medium',
            predicted_reach: parsed.performance_metrics?.predicted_reach || 0,
            best_posting_times: parsed.performance_metrics?.best_posting_times || {},
            expected_demographics: parsed.performance_metrics?.expected_demographics || {},
            
            // Production details
            production_checklist: parsed.production_checklist || {},
            required_assets: parsed.production_checklist?.required_assets || [],
            
            // Metadata
            persona_id: settings.selectedPersonaId,
            persona_used: settings.usePersona,
            status: 'ready',
            generation_model: 'gpt-5',
            generation_params: {
              creativity: settings.creativity,
              tone: settings.tone,
              goal: settings.contentGoal,
              platforms: settings.platforms,
              contentType
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Save to database
          const { error } = await supabaseAdmin
            .from('post_suggestions')
            .insert(suggestion)
          
          if (error) {
            console.error('Database error for suggestion:', error)
          } else {
            suggestions.push(suggestion)
            
            // Save platform-specific copy if post_copy table exists
            try {
              for (const platform of settings.platforms) {
                const copyData = parsed.platform_copy?.[platform]
                if (copyData) {
                  await supabaseAdmin
                    .from('post_copy')
                    .insert({
                      suggestion_id: suggestionId,
                      platform,
                      caption: copyData.caption || copyData.content || '',
                      hashtags: copyData.hashtags || [],
                      cta: copyData.cta || '',
                      title: copyData.title || '',
                      description: copyData.description || '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                }
              }
            } catch (copyError) {
              // Ignore if post_copy table doesn't exist
              console.log('Could not save to post_copy table:', copyError)
            }
          }
        }
      } catch (aiError) {
        console.error('AI generation error for content type', contentType, ':', aiError)
      }
    }

    // Track generation job
    try {
      // Get user_id for job tracking in internal calls
      let jobUserId = userId
      if (isInternalCall && !userId) {
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('user_id')
          .eq('id', projectId)
          .single()
        
        jobUserId = project?.user_id || null
      }
      
      await supabaseAdmin
        .from('post_generation_jobs')
        .insert({
          id: uuidv4(),
          project_id: projectId,
          user_id: jobUserId,
          job_type: 'batch_suggestions',
          status: 'completed',
          input_params: {
            settings,
            contentTypes: settings.contentTypes,
            platforms: settings.platforms
          },
          output_data: {
            suggestions_created: suggestions.length,
            suggestion_ids: suggestions.map(s => s.id)
          },
          total_items: settings.contentTypes.length,
          completed_items: suggestions.length,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
    } catch (jobError) {
      // Ignore if table doesn't exist
      console.log('Could not track generation job:', jobError)
    }

    return NextResponse.json({ 
      success: true, 
      suggestions,
      message: `Generated ${suggestions.length} smart posts for ${settings.platforms.length} platforms` 
    })
  } catch (error) {
    console.error('Smart posts generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart posts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}