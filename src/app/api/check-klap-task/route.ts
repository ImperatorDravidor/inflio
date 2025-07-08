import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  const projectId = searchParams.get('projectId')
  
  if (!taskId && !projectId) {
    return NextResponse.json({ 
      error: 'Please provide either taskId or projectId as query parameter',
      usage: {
        byTaskId: '/api/check-klap-task?taskId=YOUR_TASK_ID',
        byProjectId: '/api/check-klap-task?projectId=YOUR_PROJECT_ID'
      }
    }, { status: 400 })
  }

  try {
    let taskIdToCheck: string | null = taskId
    
    // If projectId provided, get the stored klap_project_id
    if (projectId && !taskId) {
      const { ProjectService } = await import('@/lib/services')
      const project = await ProjectService.getProject(projectId)
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      
      taskIdToCheck = project.klap_project_id || null
      
      if (!taskIdToCheck) {
        return NextResponse.json({ 
          error: 'No Klap task ID found in project',
          project: {
            id: project.id,
            klap_project_id: project.klap_project_id,
            klap_folder_id: project.klap_folder_id
          }
        }, { status: 404 })
      }
    }
    
    if (!taskIdToCheck) {
      return NextResponse.json({ error: 'No task ID available to check' }, { status: 400 })
    }
    
    console.log(`[Check Klap Task] Checking task: ${taskIdToCheck}`)
    
    // Check if it looks like a task ID or folder ID
    // Task IDs are typically 16 or 12 characters, folder IDs are 8 characters
    const isLikelyTaskId = taskIdToCheck.length === 16 || taskIdToCheck.length === 12
    const isLikelyFolderId = taskIdToCheck.length === 8
    const isUnknownFormat = !isLikelyTaskId && !isLikelyFolderId
    
    // Try to get task status
    const taskResponse = await fetch(`https://api.klap.app/v2/tasks/${taskIdToCheck}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
      }
    })
    
    let taskData = null
    let taskError = null
    
    if (taskResponse.ok) {
      taskData = await taskResponse.json()
    } else {
      const errorText = await taskResponse.text()
      taskError = `${taskResponse.status}: ${errorText}`
    }
    
    // Try as folder ID if task fails
    let folderData = null
    let folderError = null
    
    if (!taskResponse.ok && !isLikelyTaskId) {
      try {
        const folderResponse = await fetch(`https://api.klap.app/v2/projects/${taskIdToCheck}`, {
          headers: {
            'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
          }
        })
        
        if (folderResponse.ok) {
          folderData = await folderResponse.json()
        } else {
          const errorText = await folderResponse.text()
          folderError = `${folderResponse.status}: ${errorText}`
        }
      } catch (error) {
        folderError = error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    return NextResponse.json({
      success: true,
      input: {
        taskId: taskIdToCheck,
        length: taskIdToCheck.length,
        analysis: {
          isLikelyTaskId,
          isLikelyFolderId,
          isUnknownFormat,
          length: taskIdToCheck.length
        }
      },
      taskApi: {
        attempted: true,
        success: taskResponse.ok,
        status: taskResponse.status,
        data: taskData,
        error: taskError
      },
      folderApi: {
        attempted: !taskResponse.ok && !isLikelyTaskId,
        success: !!folderData,
        data: folderData,
        error: folderError
      },
      recommendation: taskData?.output_id ? 
        `Use folder ID: ${taskData.output_id}` : 
        folderData ? 
          'This appears to be a folder - check clips array' : 
          'Cannot determine correct ID format',
      debug: {
        hasApiKey: !!process.env.KLAP_API_KEY,
        apiKeyPrefix: process.env.KLAP_API_KEY?.substring(0, 10) + '...'
      }
    })
  } catch (error) {
    console.error('Check Klap task error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check task',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 