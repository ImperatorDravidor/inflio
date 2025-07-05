import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  // Authenticate
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { videoUrl } = await request.json()
    
    if (!videoUrl) {
      return NextResponse.json({ 
        error: 'Please provide videoUrl in request body',
        example: { videoUrl: 'https://example.com/video.mp4' }
      }, { status: 400 })
    }

    // Check if API key exists
    const apiKey = process.env.KLAP_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'KLAP_API_KEY not configured',
        solution: 'Add KLAP_API_KEY to your environment variables'
      }, { status: 500 })
    }

    console.log('[Test Klap Direct] Testing with video URL:', videoUrl)
    console.log('[Test Klap Direct] API Key present:', apiKey.substring(0, 10) + '...')

    // Step 1: Create a task
    const createTaskResponse = await fetch('https://api.klap.app/v2/tasks/video-to-shorts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_video_url: videoUrl,
        language: 'en',
        max_duration: 60,
      }),
    })

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text()
      console.error('[Test Klap Direct] Task creation failed:', {
        status: createTaskResponse.status,
        statusText: createTaskResponse.statusText,
        body: errorText
      })
      
      return NextResponse.json({
        error: 'Failed to create Klap task',
        status: createTaskResponse.status,
        statusText: createTaskResponse.statusText,
        details: errorText,
        possibleReasons: [
          'Invalid API key',
          'Video URL not accessible by Klap',
          'Video format not supported',
          'API quota exceeded'
        ]
      }, { status: createTaskResponse.status })
    }

    const task = await createTaskResponse.json()
    console.log('[Test Klap Direct] Task created successfully:', task)

    // Step 2: Check task status once
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
    
    const statusResponse = await fetch(`https://api.klap.app/v2/tasks/${task.id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      return NextResponse.json({
        error: 'Failed to check task status',
        taskId: task.id,
        details: errorText
      }, { status: statusResponse.status })
    }

    const taskStatus = await statusResponse.json()
    console.log('[Test Klap Direct] Task status:', taskStatus)

    return NextResponse.json({
      success: true,
      message: 'Klap API is working correctly',
      task: {
        id: task.id,
        status: taskStatus.status,
        currentState: taskStatus
      },
      nextSteps: [
        'Task created successfully',
        `Task ID: ${task.id}`,
        `Current status: ${taskStatus.status}`,
        'Processing typically takes 10-20 minutes',
        'Check server logs for detailed progress'
      ]
    })
    
  } catch (error) {
    console.error('[Test Klap Direct] Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  
  if (!taskId) {
    return NextResponse.json({
      error: 'Please provide taskId as query parameter',
      example: '/api/test-klap-direct?taskId=YOUR_TASK_ID'
    }, { status: 400 })
  }

  const apiKey = process.env.KLAP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'KLAP_API_KEY not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(`https://api.klap.app/v2/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'Failed to check task',
        details: errorText
      }, { status: response.status })
    }

    const taskStatus = await response.json()
    
    // If task is ready, try to get clips
    if (taskStatus.status === 'ready' && taskStatus.output_id) {
      const clipsResponse = await fetch(`https://api.klap.app/v2/projects/${taskStatus.output_id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      
      if (clipsResponse.ok) {
        const clips = await clipsResponse.json()
        return NextResponse.json({
          task: taskStatus,
          clips: {
            count: clips.length,
            items: clips.slice(0, 3) // Show first 3 clips
          }
        })
      }
    }

    return NextResponse.json({ task: taskStatus })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check task',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 