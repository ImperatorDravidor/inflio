import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, options } = await request.json()
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    // Default options if not provided
    const blogOptions = options || {
      style: 'professional',
      length: 2000,
      seoOptimized: true,
      includeImages: true,
      includeFAQ: true,
      customInstructions: ''
    }

    // Fetch project with transcript and content analysis
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      console.error('Project fetch error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.transcription) {
      return NextResponse.json({ error: 'No transcript available for this project' }, { status: 400 })
    }

    const contentAnalysis = project.content_analysis || {}
    const keywords = contentAnalysis.keywords || []
    const topics = contentAnalysis.topics || []
    const summary = contentAnalysis.summary || ''
    const keyMoments = contentAnalysis.keyMoments || []
    const suggestions = contentAnalysis.contentSuggestions || {}
    const blogIdeas = suggestions.blogPostIdeas || []

    // Build comprehensive context from content analysis
    const contextPrompt = `
Video Title: ${project.title}
Content Summary: ${summary}

Main Topics: ${topics.join(', ')}
Keywords: ${keywords.join(', ')}

Key Moments from the Video:
${keyMoments.map((moment: any, idx: number) => `${idx + 1}. [${moment.timestamp}] ${moment.description}`).join('\n')}

Content Ideas: ${blogIdeas.join('; ')}

Full Transcript:
${project.transcription.text || project.transcription}
`;

    // Generate comprehensive blog post
    const openai = getOpenAI();
    
    // Adjust system prompt based on writing style
    const stylePrompts = {
      professional: 'You are an expert content writer specializing in professional, authoritative content. Use formal language, industry terminology, and maintain a credible tone.',
      casual: 'You are a friendly content creator who writes in a conversational, approachable style. Use everyday language, personal anecdotes, and connect with readers on a personal level.',
      technical: 'You are a technical writer who creates detailed, expert-level content. Use precise terminology, include technical details, and explain complex concepts thoroughly.',
      storytelling: 'You are a narrative content writer who uses storytelling techniques. Create engaging narratives, use vivid descriptions, and connect facts through compelling stories.'
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `${stylePrompts[blogOptions.style as keyof typeof stylePrompts] || stylePrompts.professional} ${blogOptions.seoOptimized ? 'Create SEO-optimized content with proper keyword integration.' : ''} Format the output in clean markdown with proper headings, lists, and emphasis.`
        },
        {
          role: 'user',
          content: `${contextPrompt}
${blogOptions.customInstructions ? `\nAdditional Instructions: ${blogOptions.customInstructions}\n` : ''}

Create a comprehensive ${blogOptions.style} blog article following these requirements:

1. **Article Structure** (Target: ${blogOptions.length} words):
   - Compelling introduction (${Math.round(blogOptions.length * 0.1)} words)
   - ${blogOptions.length >= 2000 ? '4-6' : blogOptions.length >= 1000 ? '3-4' : '2-3'} main sections with descriptive headings
   - ${blogOptions.length >= 1500 ? '2-3 subsections under each main section' : '1-2 subsections where appropriate'}
   - Conclusion with actionable takeaways (${Math.round(blogOptions.length * 0.1)} words)
   ${blogOptions.includeFAQ ? `- FAQ section with ${blogOptions.length >= 2000 ? '5-7' : '3-5'} questions` : ''}

2. **Content Requirements**:
   - Reference specific moments from the video transcript with timestamps
   - Include relevant statistics, data, or examples
   - Use the identified topics and keywords naturally throughout
   - Create engaging content that provides value
   - Include relevant quotes from the transcript

${blogOptions.seoOptimized ? `3. **SEO Optimization**:
   - Naturally integrate LSI and NLP keywords throughout
   - Maintain optimal keyword density without stuffing
   - Include internal and external linking suggestions naturally in the text` : ''}

4. **Formatting**:
   - Use markdown formatting (# for h1, ## for h2, ### for h3)
   - Use **bold** for emphasis and *italics* for subtle emphasis
   - Use > for blockquotes of important video quotes
   - Create scannable content with bullet points and numbered lists
   - Use [text](url) format for links

Output the article in clean markdown format. ${blogOptions.seoOptimized || blogOptions.includeImages ? `At the end, include a separate JSON block with:
${blogOptions.seoOptimized ? `- metaTitle (50-60 characters)
- metaDescription (150-160 characters)
- keywords (array of LSI/NLP keywords used)` : ''}
${blogOptions.includeImages ? '- suggestedImages (3-5 image descriptions)' : ''}` : ''}

Write the full article now, ensuring it's comprehensive, engaging, and perfectly suited to the ${blogOptions.style} style requested.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedContent = completion.choices[0].message.content || ''

    // Parse the response - extract article and metadata
    let articleContent = generatedContent
    let metadata: any = {}
    
    // Check if there's a JSON block at the end
    const jsonMatch = generatedContent.match(/```json\n([\s\S]+?)\n```\s*$/)
    if (jsonMatch) {
      try {
        metadata = JSON.parse(jsonMatch[1])
        // Remove the JSON block from the article content
        articleContent = generatedContent.replace(/```json\n[\s\S]+?\n```\s*$/, '').trim()
      } catch (e) {
        console.error('Failed to parse metadata JSON:', e)
      }
    }

    // Extract title from the first H1 in the markdown
    const titleMatch = articleContent.match(/^#\s+(.+)$/m)
    const extractedTitle = titleMatch ? titleMatch[1] : project.title + ' - Complete Guide'
    
    // Extract excerpt from the first paragraph
    const paragraphMatch = articleContent.match(/^(?!#|\*|\-|\>|\[).+$/m)
    const extractedExcerpt = paragraphMatch 
      ? paragraphMatch[0].substring(0, 200).trim() + '...'
      : summary || project.title
    
    // Calculate reading time (average 200 words per minute)
    const wordCount = articleContent.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)
    
    // Extract sections from the markdown content
    const sections: Array<{ heading: string; content: string }> = []
    const sectionRegex = /^##\s+(.+)$/gm
    let lastIndex = 0
    let match
    
    while ((match = sectionRegex.exec(articleContent)) !== null) {
      if (lastIndex > 0) {
        // Get the content between the previous heading and this one
        const prevSection = sections[sections.length - 1]
        if (prevSection) {
          prevSection.content = articleContent.substring(lastIndex, match.index).trim()
        }
      }
      sections.push({
        heading: match[1],
        content: ''
      })
      lastIndex = match.index + match[0].length
    }
    
    // Get the content for the last section
    if (sections.length > 0 && lastIndex > 0) {
      sections[sections.length - 1].content = articleContent.substring(lastIndex).trim()
    }
    
    const blogPost = {
      title: extractedTitle,
      content: articleContent,
      excerpt: extractedExcerpt,
      author: 'AI Content Assistant',
      tags: [...topics, ...keywords.slice(0, 5)],
      seoTitle: metadata.metaTitle || extractedTitle.substring(0, 60),
      seoDescription: metadata.metaDescription || extractedExcerpt.substring(0, 160),
      readingTime: readingTime,
      sections: sections,
      projectId: projectId,
      createdAt: new Date().toISOString(),
      status: 'draft',
      seo: {
        keywords: metadata.keywords || keywords,
        focusKeyword: keywords[0] || '',
        readabilityScore: 'good',
        seoScore: 'good',
        suggestedImages: metadata.suggestedImages || []
      }
    }

    // Generate a unique ID for the blog post
    const blogId = crypto.randomUUID();
    
    // Store the blog post in the project's folders
    const blogPostWithId = {
      id: blogId,
      ...blogPost
    };

    // Update the project's blog folder
    const currentBlogFolder = project.folders?.blog || [];
    const updatedFolders = {
      ...project.folders,
      blog: [...currentBlogFolder, blogPostWithId]
    };

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ 
        folders: updatedFolders,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error saving blog post:', updateError);
      // Continue anyway - return the generated content
    }

    return NextResponse.json({
      success: true,
      blogPost: blogPostWithId
    })
  } catch (error) {
    console.error('Blog generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate blog post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
