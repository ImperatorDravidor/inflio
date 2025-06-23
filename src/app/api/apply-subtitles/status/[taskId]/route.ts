import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CloudVideoService } from '@/lib/cloud-video-service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { taskId } = await context.params

    // Check if it's a demo task
    if (taskId.includes('demo')) {
      // Simulate demo progress
      const startTime = parseInt(taskId.split('_').pop() || '0')
      const elapsed = Date.now() - startTime
      const progress = Math.min(Math.floor(elapsed / 100), 100)

      if (progress >= 100) {
        return NextResponse.json({
          id: taskId,
          status: 'completed',
          progress: 100,
          outputVideoUrl: '/demo-subtitled-video.mp4',
          demoMode: true
        })
      } else {
        return NextResponse.json({
          id: taskId,
          status: 'processing',
          progress,
          demoMode: true
        })
      }
    }

    // Get real task status
    const task = CloudVideoService.getTaskStatus(taskId)
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Return task status
    return NextResponse.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
      outputVideoUrl: task.outputVideoUrl,
      error: task.error,
      startedAt: task.startedAt,
      completedAt: task.completedAt
    })

  } catch (error) {
    console.error('Error fetching task status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task status' },
      { status: 500 }
    )
  }
} 