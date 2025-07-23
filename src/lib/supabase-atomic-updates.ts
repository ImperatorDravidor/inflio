import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { ProcessingTask } from './project-types'

/**
 * Atomic update functions for Supabase to prevent race conditions
 * Uses database-level operations instead of read-modify-write patterns
 */
export class AtomicUpdates {
  /**
   * Update task progress atomically
   * Uses JSONB operators to update nested JSON without fetching first
   */
  static async updateTaskProgress(
    projectId: string,
    taskType: ProcessingTask['type'],
    progress: number,
    status?: ProcessingTask['status']
  ): Promise<boolean> {
    const supabase = createSupabaseBrowserClient()
    
    try {
      // First, get the task index for the specific task type
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('tasks')
        .eq('id', projectId)
        .single()
      
      if (fetchError || !project) {
        console.error('Failed to fetch project for task update:', fetchError)
        return false
      }
      
      const taskIndex = project.tasks.findIndex((t: ProcessingTask) => t.type === taskType)
      if (taskIndex === -1) {
        console.error(`Task type ${taskType} not found in project ${projectId}`)
        return false
      }
      
      // Build the update object
      const updatedTask = {
        ...project.tasks[taskIndex],
        progress,
        ...(status && { status }),
        ...(status === 'processing' && !project.tasks[taskIndex].startedAt && {
          startedAt: new Date().toISOString()
        }),
        ...(status === 'completed' && {
          completedAt: new Date().toISOString()
        })
      }
      
      // Update the specific task in the array
      const updatedTasks = [...project.tasks]
      updatedTasks[taskIndex] = updatedTask
      
      // Perform atomic update
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          tasks: updatedTasks,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
      
      if (updateError) {
        console.error('Failed to update task progress:', updateError)
        return false
      }
      
      // Dispatch update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('projectUpdate'))
      }
      
      return true
    } catch (error) {
      console.error('Error in updateTaskProgress:', error)
      return false
    }
  }

  /**
   * Add content to folder atomically
   * Appends to array without fetching entire project
   */
  static async addToFolder(
    projectId: string,
    folderType: string,
    content: any
  ): Promise<boolean> {
    const supabase = createSupabaseBrowserClient()
    
    try {
      // Use RPC function for atomic append if available
      const { error: rpcError } = await supabase.rpc('append_to_folder', {
        project_id: projectId,
        folder_type: folderType,
        new_content: content
      }).single()
      
      if (!rpcError) {
        // Dispatch update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('projectUpdate'))
        }
        return true
      }
      
      // Fallback to manual update if RPC not available
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('folders')
        .eq('id', projectId)
        .single()
      
      if (fetchError || !project) {
        console.error('Failed to fetch project for folder update:', fetchError)
        return false
      }
      
      const updatedFolders = {
        ...project.folders,
        [folderType]: [...(project.folders[folderType] || []), content]
      }
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          folders: updatedFolders,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
      
      if (updateError) {
        console.error('Failed to update folder:', updateError)
        return false
      }
      
      // Dispatch update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('projectUpdate'))
      }
      
      return true
    } catch (error) {
      console.error('Error in addToFolder:', error)
      return false
    }
  }

  /**
   * Increment numeric field atomically
   */
  static async incrementField(
    projectId: string,
    fieldPath: string,
    amount: number = 1
  ): Promise<boolean> {
    const supabase = createSupabaseBrowserClient()
    
    try {
      const { error } = await supabase.rpc('increment_project_field', {
        project_id: projectId,
        field_path: fieldPath,
        increment_by: amount
      })
      
      if (error) {
        console.error('Failed to increment field:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error in incrementField:', error)
      return false
    }
  }
}