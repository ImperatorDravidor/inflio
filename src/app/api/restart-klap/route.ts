import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { projectId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Missing projectId'
      }, { status: 400 })
    }
    
    const { ProjectService } = await import('@/lib/services')
    
    // Get the project
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    if (!project.video_url) {
      return NextResponse.json({ error: 'Project has no video URL' }, { status: 400 })
    }
    
    if (project.klap_project_id) {
      return NextResponse.json({ 
        error: 'Project already has Klap task',
        klap_project_id: project.klap_project_id 
      }, { status: 400 })
    }
    
    console.log(`[Restart Klap] Starting Klap for project ${projectId} with video ${project.video_url}`)
    
    // Update task status
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing')
    
    // Create Klap task
    const { KlapAPIService } = await import('@/lib/klap-api')
    const task = await KlapAPIService.createVideoTask(project.video_url)
    
    console.log(`[Restart Klap] Task created: ${task.id}`)
    
    // Store the task ID
    await ProjectService.updateProject(projectId, {
      klap_project_id: task.id
    })
    
    return NextResponse.json({
      success: true,
      message: 'Klap processing started successfully',
      taskId: task.id,
      projectId: projectId
    })
  } catch (error) {
    console.error('Restart Klap error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restart Klap' },
      { status: 500 }
    )
  }
} 