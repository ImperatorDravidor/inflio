import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UsageService } from '@/lib/usage-service'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Helper function to extract sections from HTML content
function extractSections(htmlContent: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = []
  const regex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi
  const matches = htmlContent.matchAll(regex)
  
  let lastIndex = 0
  let lastHeading = ''
  
  for (const match of matches) {
    if (lastHeading) {
      sections.push({
        heading: lastHeading,
        content: htmlContent.substring(lastIndex, match.index).trim()
      })
    }
    lastHeading = match[1].replace(/<[^>]*>/g, '') // Strip any inner HTML tags
    lastIndex = match.index! + match[0].length
  }
  
  // Add the last section
  if (lastHeading) {
    sections.push({
      heading: lastHeading,
      content: htmlContent.substring(lastIndex).trim()
    })
  }
  
  return sections
}

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

    // Create blog post object
    const blogPost = {
      id: `blog_${Date.now()}`,
      title: seoData.title || project.title,
      content: blogContent,
      excerpt: contentAnalysis.summary.substring(0, 200) + '...',
      tags: seoData.tags || contentAnalysis.keywords.slice(0, 5),
      seoTitle: seoData.title || project.title,
      seoDescription: seoData.metaDescription || contentAnalysis.summary.substring(0, 160),
      readingTime: Math.ceil(blogContent.split(' ').length / 200), // Estimate reading time
      sections: extractSections(blogContent),
      createdAt: new Date().toISOString()
    }

    // Add blog to project's folders
    const updatedFolders = {
      ...project.folders,
      blog: [...(project.folders.blog || []), blogPost]
    }

    // Update project with new blog
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ 
        folders: updatedFolders,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error saving blog:', updateError)
      // Return the content anyway
      return NextResponse.json({
        success: true,
        blog: blogPost,
        content: blogContent,
        seo: seoData,
        saved: false,
        error: updateError.message
      })
    }

    return NextResponse.json({
      success: true,
      blog: blogPost,
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
