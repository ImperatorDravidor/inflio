import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UsageService } from '@/lib/usage-service'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, enhancedContext } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Check usage
    if (!UsageService.canProcessVideo()) {
      return NextResponse.json(
        { error: 'Monthly usage limit reached. Please upgrade your plan.' },
        { status: 429 }
      )
    }

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*, content_analysis')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Use enhanced context if provided (from unified content generator)
    const contentAnalysis = enhancedContext?.contentAnalysis || project.content_analysis
    const unifiedPrompt = enhancedContext?.unifiedPrompt
    const includeVideoMoments = enhancedContext?.includeVideoMoments || false
    const selectedMoments = enhancedContext?.selectedMoments || []

    if (!contentAnalysis) {
      return NextResponse.json(
        { error: 'Content analysis not available. Please analyze the video first.' },
        { status: 400 }
      )
    }

    const openai = getOpenAI()
    
    // Enhanced system prompt with better context understanding
    const systemPrompt = `You are a professional blog writer and content strategist specializing in creating engaging, SEO-optimized articles from video content.
Your writing should be informative yet conversational, with a focus on delivering value to readers while maintaining strong search engine visibility.

Key Guidelines:
- Write in a clear, engaging tone that matches the video's energy
- Include relevant timestamps when referencing specific moments
- Naturally incorporate keywords without keyword stuffing
- Create scannable content with clear headings and bullet points
- Focus on practical takeaways and actionable insights
- Use the active voice and write directly to the reader

${unifiedPrompt ? `Additional Context: ${unifiedPrompt}` : ''}`

    // Build comprehensive prompt with all video context
    const videoMomentsSection = includeVideoMoments && selectedMoments.length > 0
      ? `\n\n**KEY VIDEO MOMENTS TO HIGHLIGHT:**\n${selectedMoments.map((m: any, i: number) => 
          `${i+1}. [${m.timestamp}s] ${m.description}`
        ).join('\n')}`
      : ''

    const userPrompt = `Create a comprehensive blog post based on this video content:

**VIDEO TITLE:** ${project.title}

**SUMMARY:** ${contentAnalysis.summary}

**MAIN TOPICS:** ${contentAnalysis.topics.join(', ')}

**KEYWORDS TO INCORPORATE:** ${contentAnalysis.keywords.join(', ')}

**SENTIMENT/TONE:** ${contentAnalysis.sentiment}

**KEY MOMENTS:**
${contentAnalysis.keyMoments.map((moment: any, index: number) => 
  `${index + 1}. [${moment.timestamp}s] ${moment.description}`
).join('\n')}
${videoMomentsSection}

Create a blog post that:
1. Has an attention-grabbing title that includes the main keyword
2. Starts with a compelling introduction that hooks the reader
3. Organizes content into logical sections with descriptive headings
4. References specific timestamps when mentioning video moments
5. Includes a practical takeaways or action items section
6. Ends with a strong conclusion and call-to-action
7. Is optimized for SEO while remaining reader-friendly
8. Maintains the video's tone (${contentAnalysis.sentiment})

Format the response as clean HTML that can be rendered directly, using appropriate tags like <h2>, <p>, <ul>, <strong>, etc.
Include timestamp references in the format [0:23] when mentioning specific video moments.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500
    })

    const blogContent = completion.choices[0].message.content

    if (!blogContent) {
      throw new Error('Failed to generate blog content')
    }

    // Generate SEO metadata
    const seoPrompt = `Based on this blog content, generate SEO metadata:
    
Blog Content: ${blogContent.substring(0, 1000)}...
Main Topic: ${contentAnalysis.topics[0]}
Keywords: ${contentAnalysis.keywords.join(', ')}

Provide:
1. Meta title (50-60 characters)
2. Meta description (150-160 characters)
3. URL slug
4. 5 relevant tags

Format as JSON.`

    const seoCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an SEO expert. Generate optimized metadata.' },
        { role: 'user', content: seoPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const seoData = JSON.parse(seoCompletion.choices[0].message.content || '{}')

    // Track usage
    UsageService.incrementUsage()

    // Save to database
    const { data: savedBlog, error } = await supabaseAdmin
      .from('blogs')
      .insert({
        project_id: projectId,
        user_id: userId,
        title: seoData.title || project.title,
        content: blogContent,
        slug: seoData.slug || project.title.toLowerCase().replace(/\s+/g, '-'),
        meta_description: seoData.metaDescription || contentAnalysis.summary.substring(0, 160),
        tags: seoData.tags || contentAnalysis.keywords.slice(0, 5),
        status: 'draft',
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gpt-4o-2024-08-06',
          videoContext: {
            topics: contentAnalysis.topics,
            keywords: contentAnalysis.keywords,
            sentiment: contentAnalysis.sentiment,
            keyMomentsUsed: contentAnalysis.keyMoments.length
          },
          enhancedContext: enhancedContext ? {
            unifiedPrompt,
            includeVideoMoments,
            selectedMomentsCount: selectedMoments.length
          } : null
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving blog:', error)
      // Return the content anyway
      return NextResponse.json({
        success: true,
        content: blogContent,
        seo: seoData,
        saved: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      blog: savedBlog,
      content: blogContent,
      seo: seoData,
      saved: true
    })

  } catch (error) {
    console.error('Error generating blog:', error)
    return NextResponse.json(
      { error: 'Failed to generate blog content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
