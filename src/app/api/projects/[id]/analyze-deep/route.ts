import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AIContentService } from '@/lib/ai-content-service'
import { TranscriptionData } from '@/lib/project-types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    
    // Fetch project to get transcription
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.transcription) {
      return NextResponse.json(
        { error: 'Project has no transcription yet' },
        { status: 400 }
      )
    }

    // Parse request body for optional parameters
    const body = await req.json().catch(() => ({}))
    const { forceRegenerate = false, modelVersion = 'gpt-5' } = body

    // Check if we already have deep analysis and should skip
    if (project.content_analysis?.deepAnalysis && !forceRegenerate) {
      return NextResponse.json({
        analysis: project.content_analysis,
        message: 'Using existing deep analysis'
      })
    }

    // Perform deep analysis using GPT-5 model
    console.log(`[DeepAnalysis] Starting deep analysis for project ${projectId} with model ${modelVersion}`)
    
    const transcription: TranscriptionData = project.transcription
    
    // Set model version in environment temporarily for this request
    const originalModel = process.env.NEXT_PUBLIC_GPT5_MODEL
    if (modelVersion === 'gpt-5') {
      process.env.NEXT_PUBLIC_GPT5_MODEL = 'gpt-5' // Use actual GPT-5 when available
    }
    
    const analysis = await AIContentService.analyzeTranscript(transcription, true)
    
    // Restore original model setting
    if (originalModel !== undefined) {
      process.env.NEXT_PUBLIC_GPT5_MODEL = originalModel
    } else {
      delete process.env.NEXT_PUBLIC_GPT5_MODEL
    }

    // Update project with enhanced analysis
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        content_analysis: {
          ...project.content_analysis,
          ...analysis,
          analyzedAt: new Date().toISOString(),
          modelVersion
        }
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('[DeepAnalysis] Failed to update project:', updateError)
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    console.log(`[DeepAnalysis] Successfully completed deep analysis for project ${projectId}`)
    
    return NextResponse.json({
      analysis,
      message: 'Deep analysis completed successfully',
      thumbnailIdeasCount: analysis.thumbnailIdeas?.concepts?.length || 0,
      customPostsCount: analysis.deepAnalysis?.customPostIdeas?.length || 0,
      viralScore: analysis.deepAnalysis?.viralPotential?.score || 0
    })

  } catch (error) {
    console.error('[DeepAnalysis] Error:', error)
    return NextResponse.json(
      { error: 'Failed to perform deep analysis' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    
    // Fetch project's content analysis
    const { data: project, error } = await supabase
      .from('projects')
      .select('content_analysis')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.content_analysis) {
      return NextResponse.json(
        { error: 'No analysis available for this project' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      analysis: project.content_analysis,
      hasThumbnailIdeas: !!project.content_analysis.thumbnailIdeas,
      hasDeepAnalysis: !!project.content_analysis.deepAnalysis,
      modelVersion: project.content_analysis.modelVersion || 'unknown'
    })

  } catch (error) {
    console.error('[DeepAnalysis] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}