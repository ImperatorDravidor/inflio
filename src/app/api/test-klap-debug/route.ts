import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  const folderId = searchParams.get('folderId')
  
  const debug: any = {
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.KLAP_API_KEY,
    apiKeyPrefix: process.env.KLAP_API_KEY ? process.env.KLAP_API_KEY.substring(0, 10) + '...' : 'NOT SET'
  }
  
  try {
    if (taskId) {
      // Check task status
      debug.mode = 'checkTask'
      debug.taskId = taskId
      
      const response = await fetch(`https://api.klap.app/v2/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
        }
      })
      
      debug.responseStatus = response.status
      const data = await response.json()
      debug.taskData = data
      
    } else if (folderId) {
      // Check folder/clips
      debug.mode = 'checkFolder'
      debug.folderId = folderId
      
      try {
        const clips = await KlapAPIService.getClipsFromFolder(folderId)
        debug.clips = {
          count: clips.length,
          data: clips
        }
      } catch (error) {
        debug.error = error instanceof Error ? error.message : 'Failed to get clips'
      }
      
    } else {
      // Test video URL
      debug.mode = 'testVideo'
      const testVideoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      
      try {
        const task = await KlapAPIService.createVideoTask(testVideoUrl)
        debug.newTask = task
        debug.success = true
        debug.message = 'Task created successfully! Use ?taskId=' + task.id + ' to check status'
      } catch (error) {
        debug.error = error instanceof Error ? error.message : 'Failed to create task'
        debug.success = false
      }
    }
    
  } catch (error) {
    debug.error = error instanceof Error ? error.message : 'Unknown error'
  }
  
  return NextResponse.json(debug, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 