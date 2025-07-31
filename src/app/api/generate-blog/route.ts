import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProjectService } from '@/lib/project-service'
import { UsageService } from '@/lib/usage-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'

// Helper function to extract sections from markdown content
function extractSections(markdownContent: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = []
  const lines = markdownContent.split('\n')
  
  let currentHeading = ''
  let currentContent: string[] = []
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n').trim()
        })
      }
      currentHeading = line.replace('## ', '').trim()
      currentContent = []
    } else if (currentHeading) {
      currentContent.push(line)
    }
  }
  
  // Add the last section
  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n').trim()
    })
  }
  
  return sections
}

// Helper function to calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Helper function to extract title from markdown
function extractTitle(markdownContent: string): string {
  const lines = markdownContent.split('\n')
  const titleLine = lines.find(line => line.startsWith('# '))
  return titleLine ? titleLine.replace('# ', '').trim() : 'Untitled'
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, enhancedContext, options } = body
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    // Check usage
    if (!UsageService.canProcessVideo()) {
      return NextResponse.json(
        { 
          error: 'Usage limit exceeded',
          message: 'You have exceeded your monthly usage limit. Please upgrade your plan or wait for the next billing cycle.'
        },
        { status: 403 }
      )
    }

    // Get project data
    const project = await ProjectService.getProject(projectId)
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }


    
    // Get content analysis
    const contentAnalysis = project.content_analysis
    const unifiedPrompt = enhancedContext?.unifiedPrompt || ''
    const includeVideoMoments = enhancedContext?.includeVideoMoments || false
    const selectedMoments = enhancedContext?.selectedMoments || []

    if (!contentAnalysis) {
      return NextResponse.json(
        { error: 'Content analysis not available. Please analyze the video first.' },
        { status: 400 }
      )
    }

    const openai = getOpenAI()
    
    // Determine voice and style from options
    const voice = options?.voice || 'first-person'
    const style = options?.style || 'professional'
    const guestName = options?.guestName || ''
    
    // Enhanced system prompt based on voice
    const systemPrompt = voice === 'first-person' 
      ? `You are writing AS the content creator themselves, sharing their expertise and insights in FIRST PERSON. Write as if YOU are the expert speaking directly to your audience.

Your task is to transform video content into a compelling first-person blog post in MARKDOWN format.

Voice Guidelines:
- Use "I", "my", "we" throughout - you ARE the content creator
- Share personal insights, experiences, and expertise
- Write as a thought leader sharing valuable knowledge
- Be authentic, authoritative, and engaging
- Speak directly to YOUR audience as if you're having a conversation
${style === 'professional' ? '- Maintain a professional yet personable tone' : ''}
${style === 'casual' ? '- Keep it conversational and friendly, like talking to a colleague' : ''}
${style === 'technical' ? '- Dive deep into technical details while remaining accessible' : ''}
${style === 'storytelling' ? '- Weave personal stories and narratives throughout' : ''}

CRITICAL: Write as the actual person who created the video, not as someone describing what they said. For example:
- WRONG: "The speaker discusses..." or "They explain..."
- RIGHT: "I've discovered..." or "Let me share..."

Use proper markdown syntax:
- # for main title (H1)
- ## for section headings (H2)
- ### for subsection headings (H3)
- **bold** for emphasis
- *italic* for subtle emphasis
- Bullet points and numbered lists
- > for blockquotes
- Include timestamp references as [0:23] or [1:45]

${unifiedPrompt ? `Additional Context: ${unifiedPrompt}` : ''}`
      : `You are writing an interview-style blog post featuring a conversation with ${guestName || 'a guest expert'}.

Your task is to transform video content into an engaging Q&A format blog post in MARKDOWN.

Interview Guidelines:
- Structure as a conversation between interviewer and ${guestName || 'guest'}
- Use clear Q: and A: formatting or bold names
- Capture the authentic voice and personality of both speakers
- Include natural conversational elements
- Highlight key insights and takeaways from the guest
${style === 'professional' ? '- Maintain a professional interview tone' : ''}
${style === 'casual' ? '- Keep it conversational like a friendly chat' : ''}
${style === 'technical' ? '- Focus on technical expertise and detailed explanations' : ''}
${style === 'storytelling' ? '- Let the guest tell their story naturally' : ''}

Format Example:
**Interviewer:** [Question here]

**${guestName || 'Guest'}:** [Answer here]

Use proper markdown syntax with timestamp references [0:23] when relevant.

${unifiedPrompt ? `Additional Context: ${unifiedPrompt}` : ''}`

    // Build comprehensive prompt with all video context
    const videoMomentsSection = includeVideoMoments && selectedMoments.length > 0
      ? `\n\n**KEY VIDEO MOMENTS TO HIGHLIGHT:**\n${selectedMoments.map((m: any, i: number) => 
          `${i+1}. [${Math.floor(m.timestamp/60)}:${(m.timestamp%60).toString().padStart(2, '0')}] ${m.description}`
        ).join('\n')}`
      : ''

    const userPrompt = voice === 'first-person' 
      ? `Transform this video content into a compelling FIRST-PERSON blog post where YOU are the expert sharing your knowledge:

**VIDEO TITLE:** ${project.title}

**YOUR EXPERTISE/SUMMARY:** ${contentAnalysis.summary}

**TOPICS YOU COVER:** ${contentAnalysis.topics.join(', ')}

**KEYWORDS TO NATURALLY INCLUDE:** ${contentAnalysis.keywords.join(', ')}

**YOUR TONE:** ${contentAnalysis.sentiment}

**KEY POINTS YOU MAKE:**
${contentAnalysis.keyMoments.map((moment: any, index: number) => 
  `${index + 1}. [${Math.floor(moment.timestamp/60)}:${(moment.timestamp%60).toString().padStart(2, '0')}] ${moment.description}`
).join('\n')}

${videoMomentsSection}

Write YOUR blog post in FIRST PERSON:
1. Create an engaging title that positions YOU as the expert
2. Start with YOUR personal hook - why this matters to YOU and YOUR audience
3. Share YOUR insights, experiences, and expertise throughout
4. Use "I", "my", "we" - write as yourself, not about yourself
5. Include YOUR practical tips and actionable advice
6. Reference moments from YOUR video naturally [MM:SS]
7. End with YOUR call-to-action - what do YOU want readers to do next?
8. Maintain YOUR authentic voice (${contentAnalysis.sentiment})

Remember: You ARE the content creator. Write as yourself sharing your expertise directly with your audience.`
      : `Create an interview-style blog post from this conversation:

**VIDEO TITLE:** ${project.title}

**GUEST:** ${guestName || 'Guest Expert'}

**CONVERSATION SUMMARY:** ${contentAnalysis.summary}

**TOPICS DISCUSSED:** ${contentAnalysis.topics.join(', ')}

**KEYWORDS:** ${contentAnalysis.keywords.join(', ')}

**TONE:** ${contentAnalysis.sentiment}

**KEY DISCUSSION POINTS:**
${contentAnalysis.keyMoments.map((moment: any, index: number) => 
  `${index + 1}. [${Math.floor(moment.timestamp/60)}:${(moment.timestamp%60).toString().padStart(2, '0')}] ${moment.description}`
).join('\n')}

${videoMomentsSection}

Create an engaging Q&A format blog post:
1. Compelling title highlighting the guest and main topic
2. Brief introduction about the guest and why this conversation matters
3. Structure as natural Q&A exchanges
4. Include timestamps for key moments [MM:SS]
5. Highlight the most valuable insights and takeaways
6. End with key lessons and next steps
7. Maintain conversational flow (${contentAnalysis.sentiment})

Format each exchange clearly with bold names or Q:/A: structure.`
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const blogContent = completion.choices[0].message.content

    if (!blogContent) {
      throw new Error('Failed to generate blog content')
    }
    
    // Extract title from the markdown content
    const title = extractTitle(blogContent)
    
    // Generate SEO metadata
    const seoPrompt = `Based on this blog content, generate SEO metadata:
    
Blog Title: ${title}
Main Topic: ${contentAnalysis.topics[0]}
Keywords: ${contentAnalysis.keywords.join(', ')}
Content Summary: ${contentAnalysis.summary}

Provide:
1. Meta title (50-60 characters, include main keyword)
2. Meta description (150-160 characters, compelling and includes keywords)
3. URL slug (lowercase, hyphens, no special characters)
4. 5 relevant tags (single words or short phrases)

Format as JSON with keys: metaTitle, metaDescription, slug, tags`

    const seoCompletion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are an SEO expert. Generate optimized metadata in JSON format.' },
        { role: 'user', content: seoPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const seoData = JSON.parse(seoCompletion.choices[0].message.content || '{}')

    // Calculate reading time
    const readingTime = calculateReadingTime(blogContent)

    // Track usage
    UsageService.incrementUsage()

    // Create blog post object
    const blogPost = {
      id: `blog_${Date.now()}`,
      title: title,
      content: blogContent,
      excerpt: contentAnalysis.summary.substring(0, 200) + '...',
      tags: seoData.tags || contentAnalysis.keywords.slice(0, 5),
      seoTitle: seoData.metaTitle || title,
      seoDescription: seoData.metaDescription || contentAnalysis.summary.substring(0, 160),
      slug: seoData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      readingTime: readingTime,
      wordCount: blogContent.split(/\s+/).length,
      sections: extractSections(blogContent),
      createdAt: new Date().toISOString(),
      metadata: {
        model: 'gpt-4.1',
        videoId: projectId,
        includesVideoMoments: includeVideoMoments,
        sentiment: contentAnalysis.sentiment
      }
    }

    // Add blog to project's folders
    const updatedFolders = {
      ...project.folders,
      blog: [...(project.folders.blog || []), blogPost]
    }

    // Update project with new blog
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ folders: updatedFolders })
      .eq('id', projectId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      blog: blogPost,
      message: 'Blog post generated successfully'
    })

  } catch (error: any) {
    console.error('Error generating blog:', error)
    
    if (error.message?.includes('Usage limit exceeded')) {
      return NextResponse.json(
        { error: 'Usage limit exceeded', message: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate blog', details: error.message },
      { status: 500 }
    )
  }
} 
