import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UnifiedContentService } from '@/lib/unified-content-service'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, contentAnalysis } = await req.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get project details
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*, content_analysis')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Use provided content analysis or fallback to project's
    const analysis = contentAnalysis || project.content_analysis

    if (!analysis) {
      return NextResponse.json({ 
        error: 'Content analysis not available. Please process the video first.' 
      }, { status: 400 })
    }

    // Generate unified suggestions
    const suggestions = await UnifiedContentService.generateUnifiedSuggestions(
      {
        ...project,
        content_analysis: analysis
      },
      {
        contentType: 'all'
      }
    )

    return NextResponse.json({
      success: true,
      suggestions,
      projectTitle: project.title,
      projectId: project.id
    })

  } catch (error) {
    console.error('Error generating unified suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 