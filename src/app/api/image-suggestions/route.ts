import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AIImageService, predefinedStyles } from '@/lib/ai-image-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Fetch project with content analysis
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if content analysis exists
    if (!project.content_analysis || !project.content_analysis.keywords) {
      return NextResponse.json({ 
        error: 'Content analysis not available',
        message: 'Please wait for content analysis to complete' 
      }, { status: 400 })
    }

    // Generate image suggestions
    const suggestions = await AIImageService.generateImageSuggestions(
      project.content_analysis,
      project.title
    )

    // Cache suggestions in the project for future use
    const updatedProject = {
      ...project,
      image_suggestions: suggestions,
      image_suggestions_generated_at: new Date().toISOString()
    }

    await supabaseAdmin
      .from('projects')
      .update({ 
        image_suggestions: suggestions,
        image_suggestions_generated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      suggestions,
      styles: predefinedStyles
    })

  } catch (error) {
    console.error('Image suggestions error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate image suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 