import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { BlogPost, Project } from '@/lib/project-types'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase/admin'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KE,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, transcriptText, blogStyle } = await request.json()

    if (!projectId || !transcriptText) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, transcriptText' },
        { status: 400 }
      )
    }

    // 1. Get Project directly using admin client
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // (Helper function to update task progress)
    const updateTaskProgress = async (progress: number, status: string) => {
        const taskIndex = project.tasks.findIndex((t: any) => t.type === 'blog');
        if (taskIndex === -1) return;
        project.tasks[taskIndex].progress = progress;
        project.tasks[taskIndex].status = status;
        await supabaseAdmin.from('projects').update({ tasks: project.tasks }).eq('id', projectId);
    };

    await updateTaskProgress(10, 'processing');

    const prompt = `
      You are an expert content creator and SEO specialist. Your task is to convert the following video transcript into a well-structured, engaging, and SEO-friendly blog post.
      **Instructions:**
      1. Create a compelling title that captures the essence of the content.
      2. Write an engaging introduction that hooks the reader.
      3. Structure the content with clear markdown headings (## for H2, ### for H3).
      4. Transform the transcript into a well-written article with proper flow and narrative structure.
      5. Use a ${blogStyle || 'professional'} tone throughout.
      6. Include relevant examples, explanations, and context where appropriate.
      7. Create natural transitions between sections.
      8. End with a strong conclusion that summarizes key points.
      9. Identify 5-7 relevant SEO tags/keywords.
      10. Write a meta description (150-160 characters) for SEO.
      
      **Important:** 
      - Do not just copy transcript segments verbatim
      - Create a cohesive narrative that reads like a professional blog post
      - Use proper markdown formatting for emphasis, lists, and structure
      - Make the content engaging and valuable for readers
      
      **Transcript:**
      ---
      ${transcriptText}
      ---
      
      **Output Format (JSON):**
      Return a valid JSON object with the following structure:
      {
        "title": "Engaging blog title",
        "content": "Full blog content in markdown format",
        "excerpt": "Brief 2-3 sentence summary of the blog post",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "seoTitle": "SEO optimized title (60 chars max)",
        "seoDescription": "SEO meta description (150-160 chars)"
      }
    `

    await updateTaskProgress(30, 'processing');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-11-20',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    })

    await updateTaskProgress(80, 'processing');

    let jsonResponse
    try {
      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('Empty response from OpenAI')
      }
      jsonResponse = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      // Return a more specific error
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      )
    }
    
    const wordCount = jsonResponse.content.split(' ').length
    const readingTime = Math.ceil(wordCount / 200)

    const newBlogPost: BlogPost = {
      id: uuidv4(),
      title: jsonResponse.title,
      content: jsonResponse.content,
      excerpt: jsonResponse.excerpt,
      tags: jsonResponse.tags,
      seoTitle: jsonResponse.seoTitle,
      seoDescription: jsonResponse.seoDescription,
      readingTime: readingTime,
      sections: [],
      createdAt: new Date().toISOString(),
    }
    
    // 2. Add to folder directly using admin client
    const updatedBlogFolder = [...project.folders.blog, newBlogPost];
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ folders: { ...project.folders, blog: updatedBlogFolder } })
      .eq('id', projectId);

    if (updateError) throw updateError;
    
    await updateTaskProgress(100, 'completed');

    return NextResponse.json({ success: true, blogPost: newBlogPost })
  } catch (error) {
    console.error('Error generating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to generate blog post.' },
      { status: 500 }
    )
  }
} 
