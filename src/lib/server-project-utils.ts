import { supabaseAdmin } from '@/lib/supabase/admin'
import { ProcessingTask } from '@/lib/project-types'

/**
 * Server-side task progress update using admin client.
 * This is needed because ProjectService uses browser client which doesn't work server-side.
 * Use this function in API routes and server-side processing.
 */
export async function updateTaskProgressServer(
  projectId: string,
  taskType: ProcessingTask['type'],
  progress: number,
  status?: ProcessingTask['status']
): Promise<void> {
  try {
    // Get current project
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('tasks')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      console.error('[updateTaskProgressServer] Failed to fetch project:', fetchError)
      return
    }

    // Update the specific task
    const tasks = project.tasks as ProcessingTask[]
    const taskIndex = tasks.findIndex(t => t.type === taskType)
    if (taskIndex === -1) {
      console.error('[updateTaskProgressServer] Task not found:', taskType)
      return
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      progress,
      status: status || tasks[taskIndex].status,
      ...(status === 'processing' && !tasks[taskIndex].startedAt
        ? { startedAt: new Date().toISOString() }
        : {}),
      ...(status === 'completed'
        ? { completedAt: new Date().toISOString() }
        : {})
    }

    // Check if ALL tasks are now completed → transition project status to 'ready'
    const allCompleted = tasks.every(t => t.status === 'completed')
    const projectStatusUpdate: Record<string, any> = {
      tasks,
      updated_at: new Date().toISOString()
    }

    if (allCompleted) {
      projectStatusUpdate.status = 'ready'
      console.log(`[updateTaskProgressServer] All tasks completed for project ${projectId} — setting status to 'ready'`)
    }

    // Save back to database
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update(projectStatusUpdate)
      .eq('id', projectId)

    if (updateError) {
      console.error('[updateTaskProgressServer] Failed to update project:', updateError)
    } else {
      console.log(`[updateTaskProgressServer] Updated ${taskType} to ${progress}% (${status || 'no status change'})${allCompleted ? ' [project → ready]' : ''}`)
    }
  } catch (error) {
    console.error('[updateTaskProgressServer] Unexpected error:', error)
  }
}

/**
 * Server-side project update using admin client.
 */
export async function updateProjectServer(
  projectId: string,
  updates: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (error) {
      console.error('[updateProjectServer] Failed to update project:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('[updateProjectServer] Unexpected error:', error)
    return false
  }
}

