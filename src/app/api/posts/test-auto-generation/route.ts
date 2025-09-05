import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Test endpoint to verify auto-generation setup
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Check project status
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, title, content_analysis, status, tasks')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check for existing post suggestions
    const { data: suggestions, error: suggestionsError } = await supabaseAdmin
      .from('post_suggestions')
      .select('id, content_type, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    // Check transcription task status
    const transcriptionTask = project.tasks?.find((t: any) => t.type === 'transcription')

    const diagnostics = {
      projectId: project.id,
      projectTitle: project.title,
      hasContentAnalysis: !!project.content_analysis,
      contentAnalysisSummary: project.content_analysis?.summary || null,
      contentAnalysisTopics: project.content_analysis?.topics || [],
      projectStatus: project.status,
      transcriptionTaskStatus: transcriptionTask?.status || 'not found',
      transcriptionTaskProgress: transcriptionTask?.progress || 0,
      postSuggestions: {
        count: suggestions?.length || 0,
        suggestions: suggestions?.map(s => ({
          id: s.id,
          type: s.content_type,
          status: s.status,
          createdAt: s.created_at
        })) || []
      },
      autoGenerationExpected: !!project.content_analysis && (!suggestions || suggestions.length === 0),
      recommendation: ''
    }

    // Provide recommendations
    if (!project.content_analysis) {
      diagnostics.recommendation = 'Content analysis is missing. Wait for transcription to complete or re-process the project.'
    } else if (!suggestions || suggestions.length === 0) {
      diagnostics.recommendation = 'No posts found but content analysis exists. Auto-generation should trigger. Try refreshing the project page or manually generate posts.'
    } else {
      diagnostics.recommendation = `Found ${suggestions.length} AI post suggestions. Everything looks good!`
    }

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error) {
    console.error('Error in test-auto-generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

