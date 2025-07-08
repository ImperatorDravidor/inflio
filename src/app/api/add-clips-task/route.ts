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
    
    // Check if clips task already exists
    const hasClipsTask = project.tasks.some(task => task.type === 'clips')
    
    if (!hasClipsTask) {
      // Add clips task
      const updatedTasks = [...project.tasks, {
        id: crypto.randomUUID(),
        type: 'clips' as const,
        status: 'pending' as const,
        progress: 0
      }]
      
      await ProjectService.updateProject(projectId, { tasks: updatedTasks })
      console.log(`[Add Clips Task] Added clips task to project ${projectId}`)
    }
    
    // Now start processing
    const processResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${projectId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify({ workflow: 'clips' })
    })
    
    if (!processResponse.ok) {
      const error = await processResponse.text()
      return NextResponse.json({ 
        error: `Failed to start processing: ${error}` 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Clips task added and processing started',
      hadTask: hasClipsTask,
      projectId
    })
  } catch (error) {
    console.error('Add clips task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add clips task' },
      { status: 500 }
    )
  }
} 