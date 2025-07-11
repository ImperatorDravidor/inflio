import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIContentService } from '@/lib/ai-content-service'
<<<<<<< HEAD
import { SocialPost } from '@/lib/project-types'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase/admin'
=======
>>>>>>> 7184e73 (Add new files and configurations for project setup)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

<<<<<<< HEAD
    const { projectId, platforms } = await request.json()

    if (!projectId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, platforms' },
        { status: 400 }
      )
    }

    // Get Project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.content_analysis) {
      return NextResponse.json(
        { error: 'Content analysis required. Please process the transcript first.' },
        { status: 400 }
      )
    }

    // Update task progress
    const updateTaskProgress = async (progress: number, status: string) => {
      const taskIndex = project.tasks.findIndex((t: { type: string }) => t.type === 'social');
      if (taskIndex === -1) return;
      project.tasks[taskIndex].progress = progress;
      project.tasks[taskIndex].status = status;
      await supabaseAdmin.from('projects').update({ tasks: project.tasks }).eq('id', projectId);
    };

    await updateTaskProgress(10, 'processing');

    // Generate social posts using AI
    const generatedPosts = await AIContentService.generateSocialPosts(
      project.content_analysis,
      platforms
    )

    await updateTaskProgress(80, 'processing');

    // Convert to our SocialPost format
    const newSocialPosts: SocialPost[] = generatedPosts.map(post => ({
      id: uuidv4(),
      platform: post.platform as SocialPost['platform'],
      content: post.content,
      hashtags: post.hashtags,
      status: 'draft',
      createdAt: new Date().toISOString()
    }))

    // Add to project's social folder
    const updatedSocialFolder = [...project.folders.social, ...newSocialPosts];
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ folders: { ...project.folders, social: updatedSocialFolder } })
      .eq('id', projectId);

    if (updateError) throw updateError;
    
    await updateTaskProgress(100, 'completed');

    return NextResponse.json({ 
      success: true, 
      socialPosts: newSocialPosts,
      count: newSocialPosts.length
    })
  } catch (error) {
    console.error('Error generating social posts:', error)
    return NextResponse.json(
      { error: 'Failed to generate social posts.' },
=======
    const { 
      content, 
      platform = 'instagram',
      style = 'professional',
      includeEmojis = true,
      includeHashtags = true,
      includeCTA = false,
      emojiLevel = 'moderate',
      targetAudience,
      brandVoice,
      maxLength
    } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Generate enhanced social content
    const enhancedContent = await AIContentService.generateEnhancedSocialContent(
      content,
      platform,
      {
        style,
        includeEmojis,
        includeHashtags,
        includeCTA,
        emojiLevel,
        targetAudience,
        brandVoice,
        maxLength
      }
    )

    return NextResponse.json({ 
      enhancedContent,
      platform,
      characterCount: enhancedContent.length
    })

  } catch (error) {
    console.error('Error generating social content:', error)
    return NextResponse.json(
      { error: 'Failed to generate social content' },
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      { status: 500 }
    )
  }
} 