import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProjectService } from '@/lib/services'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projectId = params.id
    const body = await request.json()
    const { text, segments } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Get the existing project
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
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