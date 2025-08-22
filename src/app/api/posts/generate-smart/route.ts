import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
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

    // Enhanced system prompt with market insights
    const systemPrompt = `You are a viral social media strategist with deep expertise in platform algorithms and engagement psychology.

Your content creation principles:
1. Hook viewers in the first 3 seconds with curiosity, controversy, or value
2. Use pattern interrupts and unexpected angles to maintain attention
3. Leverage social proof, FOMO, and emotional triggers
4. Include clear value propositions and benefits
5. Optimize for platform-specific algorithms and best practices
6. Create shareable moments and quotable content
7. Build community through relatable experiences

${personaContext}
${trendingContext}

Target Audience: ${settings.targetAudience || 'General audience interested in the topic'}
Content Goal: ${settings.contentGoal}
Tone: ${settings.tone}
Include Emojis: ${settings.includeEmojis ? 'Yes, use relevant emojis naturally' : 'No emojis'}
Include Hashtags: ${settings.includeHashtags ? 'Yes, 5-10 relevant hashtags per platform' : 'Minimal hashtags'}
Include CTA: ${settings.includeCTA ? 'Yes, clear call-to-action' : 'Soft or no CTA'}
Optimize for Engagement: ${settings.optimizeForEngagement ? 'Maximum engagement focus' : 'Balanced approach'}`

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

      const userPrompt = `Create a ${contentType} post for the video titled "${projectTitle}".

Content Analysis:
- Topics: ${contentAnalysis?.topics?.join(', ') || 'General content'}
- Keywords: ${contentAnalysis?.keywords?.join(', ') || 'Not specified'}
- Key Points: ${contentAnalysis?.keyPoints?.join('; ') || transcript?.substring(0, 500) || 'Not available'}
- Sentiment: ${contentAnalysis?.sentiment || 'Neutral'}

${transcript ? `Key excerpt from transcript: "${transcript.substring(0, 800)}..."` : ''}

Content Type Instructions: ${contentInstructions[contentType as keyof typeof contentInstructions]}

Generate a comprehensive post suggestion that includes:

1. Title: A catchy, curiosity-driven title for internal reference
2. Description: Brief explanation of what this post accomplishes and why it will perform well
3. Hook: The opening line or visual element that stops scrolling
4. Main Content: The core message or story
5. Visual Elements: Specific descriptions of images, graphics, or video clips needed
6. Platform-Specific Copy: Optimized content for each platform (${settings.platforms.join(', ')})
   - Include character counts
   - Platform-specific features (stories, reels, carousels, etc.)
   - Optimal hashtags for each platform
7. Engagement Prediction: Score from 0-100 based on:
   - Hook strength
   - Value delivery
   - Shareability
   - Trend alignment
8. Best Posting Times: Recommended times for each platform
9. A/B Test Suggestions: Alternative hooks or CTAs to test

Format the response as a detailed JSON object with all variations and optimizations.`

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: settings.creativity,
          max_tokens: 2500,
          response_format: { type: 'json_object' }
        })

        const response = completion.choices[0].message.content
        if (response) {
          const parsed = JSON.parse(response)
          
          // Create suggestion record
          const suggestionId = uuidv4()
          const suggestion = {
            id: suggestionId,
            project_id: projectId,
            user_id: userId,
            content_type: contentType,
            title: parsed.title || `${contentType} Post`,
            description: parsed.description || 'AI-generated social media post',
            images: parsed.visual_elements || [],
            copy_variants: parsed.platform_copy || {},
            eligible_platforms: settings.platforms,
            platform_requirements: parsed.platform_requirements || {},
            persona_id: settings.selectedPersonaId,
            persona_used: settings.usePersona,
            status: 'ready',
            engagement_prediction: (parsed.engagement_prediction || 75) / 100,
            generation_prompt: userPrompt.substring(0, 1000), // Store truncated prompt
            generation_model: 'gpt-5',
            generation_params: {
              creativity: settings.creativity,
              tone: settings.tone,
              goal: settings.contentGoal
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
      await supabaseAdmin
        .from('post_generation_jobs')
        .insert({
          id: uuidv4(),
          project_id: projectId,
          user_id: userId,
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