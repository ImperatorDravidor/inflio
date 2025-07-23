import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'
import { validateProjectOwnership } from '@/lib/auth-utils'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const projectId = params.id
    
    // Validate project ownership
    const { isValid, project, errorResponse } = await validateProjectOwnership(projectId)
    if (!isValid || !project) {
      return errorResponse || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { text, segments } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Update the transcription
    const updatedTranscription = {
      text,
      segments: segments || project.transcription?.segments || [],
      language: project.transcription?.language || 'en',
      duration: project.transcription?.duration || 0,
      edited: true,
      editedAt: new Date().toISOString()
    }

    await ProjectService.updateProject(projectId, {
      transcription: updatedTranscription
    })

    return NextResponse.json(updatedTranscription)
  } catch (error) {
    console.error('Error updating transcription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update transcription' },
      { status: 500 }
    )
  }
} 