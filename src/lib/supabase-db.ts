import { createSupabaseBrowserClient } from './supabase/client'
import { Project, VideoMetadata, ProcessingTask, ContentFolders } from './project-types'
import { v4 as uuidv4 } from 'uuid'
import { WorkflowOptions } from '@/components/workflow-selection'

const supabase = createSupabaseBrowserClient()

// Helper function to dispatch project update events
const dispatchProjectUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('projectUpdate'))
  }
}

export class SupabaseProjectService {
  // Create a new project
  static async createProject(
    title: string,
    videoFile: File,
    videoUrl: string,
    thumbnailUrl: string,
    metadata: VideoMetadata,
    workflowOptions?: WorkflowOptions,
    userId?: string // Now an optional parameter
  ): Promise<Project> {
    const projectId = uuidv4()
    const videoId = uuidv4()
    
    const project: Project = {
      id: projectId,
      title: title || videoFile.name.replace(/\.[^/.]+$/, ""),
      description: '',
      video_id: videoId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      metadata,
      folders: {
        clips: [],
        blog: [],
        social: [],
  
      },
      tasks: workflowOptions ? this.initializeTasksFromWorkflows(workflowOptions) : this.initializeTasks(),
      settings: {
        autoGenerateClips: workflowOptions?.clips ?? true,
        clipDuration: 60,
        blogStyle: 'professional',
        socialPlatforms: ['twitter', 'linkedin', 'youtube-short'],
        language: 'en'
      },
      analytics: {
        totalViews: 0,
        totalEngagement: 0,
        bestPerformingContent: ''
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'draft',
      tags: [],
      user_id: userId
    }

    // Save project to Supabase with userId if provided
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }
    
    // Dispatch update event
    dispatchProjectUpdate()
    
    return data
  }

  // Initialize processing tasks based on workflow selection
  private static initializeTasksFromWorkflows(workflowOptions: WorkflowOptions): ProcessingTask[] {
    const tasks: ProcessingTask[] = []
    
    if (workflowOptions.transcription) {
      tasks.push({
        id: uuidv4(),
        type: 'transcription',
        status: 'pending',
        progress: 0
      })
    }
    
    if (workflowOptions.clips) {
      tasks.push({
        id: uuidv4(),
        type: 'clips',
        status: 'pending',
        progress: 0
      })
    }
    
    if (workflowOptions.blog) {
      tasks.push({
        id: uuidv4(),
        type: 'blog',
        status: 'pending',
        progress: 0
      })
    }
    
    if (workflowOptions.social) {
      tasks.push({
        id: uuidv4(),
        type: 'social',
        status: 'pending',
        progress: 0
      })
    }
    

    
    return tasks
  }

  // Initialize processing tasks
  private static initializeTasks(): ProcessingTask[] {
    const taskTypes: ProcessingTask['type'][] = [
      'transcription',
      'clips',
      'blog',
      'social'
    ]
    
    return taskTypes.map(type => ({
      id: uuidv4(),
      type,
      status: 'pending',
      progress: 0
    }))
  }

  // Save project to Supabase (update)
  static async saveProject(project: Project): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .upsert(project)

    if (error) {
      console.error('Error saving project:', error)
      throw error
    }
  }

  // Get project by ID
  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return null
    }

    return data
  }

  // Update project
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return null
    }

    dispatchProjectUpdate()
    return data
  }

  // Update task progress
  static async updateTaskProgress(
    projectId: string,
    taskType: ProcessingTask['type'],
    progress: number,
    status?: ProcessingTask['status']
  ): Promise<void> {
    const project = await this.getProject(projectId)
    if (!project) return

    const taskIndex = project.tasks.findIndex(t => t.type === taskType)
    if (taskIndex === -1) return

    project.tasks[taskIndex] = {
      ...project.tasks[taskIndex],
      progress,
      status: status || project.tasks[taskIndex].status,
      ...(status === 'processing' && !project.tasks[taskIndex].startedAt
        ? { startedAt: new Date().toISOString() }
        : {}),
      ...(status === 'completed'
        ? { completedAt: new Date().toISOString() }
        : {})
    }

    await this.saveProject(project)
  }

  // Add content to folder
  static async addToFolder<T extends keyof ContentFolders>(
    projectId: string,
    folderType: T,
    content: any // Since ContentFolders have different item types, we'll use any here
  ): Promise<void> {
    const project = await this.getProject(projectId)
    if (!project) return

    // Type-safe folder update - access array explicitly
    const currentFolder = project.folders[folderType] as any[]
<<<<<<< HEAD
=======
    
    // Check for duplicates when adding clips
    if (folderType === 'clips' && content.id) {
      const isDuplicate = currentFolder.some((item: any) => item.id === content.id)
      if (isDuplicate) {
        console.warn(`[SupabaseProjectService] Skipping duplicate clip with ID: ${content.id}`)
        return
      }
    }
    
>>>>>>> 7184e73 (Add new files and configurations for project setup)
    const updatedFolder = [...currentFolder, content]
    
    const updatedFolders = {
      ...project.folders,
      [folderType]: updatedFolder
    } as ContentFolders

    project.folders = updatedFolders

    await this.saveProject(project)
  }

<<<<<<< HEAD
=======
  // Remove duplicate clips from a project
  static async removeDuplicateClips(projectId: string): Promise<void> {
    const project = await this.getProject(projectId)
    if (!project) return

    const uniqueClips = new Map<string, any>()
    
    // Keep only the first occurrence of each clip ID
    project.folders.clips.forEach((clip: any) => {
      if (clip.id && !uniqueClips.has(clip.id)) {
        uniqueClips.set(clip.id, clip)
      }
    })

    const deduplicatedClips = Array.from(uniqueClips.values())
    
    if (deduplicatedClips.length < project.folders.clips.length) {
      console.log(`[SupabaseProjectService] Removed ${project.folders.clips.length - deduplicatedClips.length} duplicate clips from project ${projectId}`)
      
      project.folders.clips = deduplicatedClips
      await this.saveProject(project)
    }
  }

>>>>>>> 7184e73 (Add new files and configurations for project setup)
  // Get all projects (filtered by user if userId provided)
  static async getAllProjects(userId?: string): Promise<Project[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const errorMsg = "Supabase URL or anonymous key is not set. Please check your .env.local file."
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    // If userId is provided, filter by it
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      // Throw a more descriptive error.
      throw new Error(`Failed to fetch projects. Supabase error: ${JSON.stringify(error, null, 2)}`)
    }

    return data || []
  }

  // Get projects for a specific user
  static async getUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user projects:', error)
      return []
    }

    return data || []
  }

  // Delete project
  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      // 1. Delete all AI-generated images for this project
      try {
        const { data: imageFiles } = await supabase.storage
          .from('ai-generated-images')
          .list(projectId)
          
        if (imageFiles && imageFiles.length > 0) {
          const imagePaths = imageFiles.map(file => `${projectId}/${file.name}`)
          await supabase.storage
            .from('ai-generated-images')
            .remove(imagePaths)
        }
      } catch (error) {
        console.error('Error deleting AI images:', error)
        // Continue with deletion even if this fails
      }
      
      // 2. Delete all video files and subtitles for this project
      try {
        const { data: videoFiles } = await supabase.storage
          .from('videos')
          .list(projectId)
          
        if (videoFiles && videoFiles.length > 0) {
          const videoPaths = videoFiles.map(file => `${projectId}/${file.name}`)
          await supabase.storage
            .from('videos')
            .remove(videoPaths)
        }
      } catch (error) {
        console.error('Error deleting videos:', error)
        // Continue with deletion even if this fails
      }
      
      // 3. Delete all social posts that reference this project
      // Since they have ON DELETE SET NULL, we need to manually delete them
      const { error: socialPostsError } = await supabase
        .from('social_posts')
        .delete()
        .eq('project_id', projectId)
        
      if (socialPostsError) {
        console.error('Error deleting social posts:', socialPostsError)
      }
      
      // 4. Delete staging sessions (these cascade automatically)
      // No action needed - ON DELETE CASCADE handles this
      
      // 5. Delete the project record itself
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        console.error('Error deleting project:', error)
        return false
      }

      // Dispatch update event
      dispatchProjectUpdate()
      return true
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  }

  // Search projects
  static async searchProjects(query: string, userId?: string): Promise<Project[]> {
    const lowercaseQuery = query.toLowerCase()
    
    let supabaseQuery = supabase
      .from('projects')
      .select('*')
      .or(`title.ilike.%${lowercaseQuery}%,description.ilike.%${lowercaseQuery}%`)
      .order('created_at', { ascending: false })

    // If userId is provided, filter by it
    if (userId) {
      supabaseQuery = supabaseQuery.eq('user_id', userId)
    }

    const { data, error } = await supabaseQuery

    if (error) {
      console.error('Error searching projects:', error)
      return []
    }

    // Additional filtering for tags (since we can't easily query JSON arrays in Supabase)
    return (data || []).filter((project: Project) =>
      project.title.toLowerCase().includes(lowercaseQuery) ||
      project.description.toLowerCase().includes(lowercaseQuery) ||
      project.tags.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  // Get projects by status
  static async getProjectsByStatus(status: Project['status'], userId?: string): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    // If userId is provided, filter by it
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching projects by status:', error)
      return []
    }

    return data || []
  }

  // Calculate project progress
  static calculateProjectProgress(project: Project): number {
    const tasks = project.tasks
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(totalProgress / tasks.length)
  }

  // Get project statistics
  static getProjectStats(project: Project) {
    return {
      totalClips: project.folders.clips.length,
      totalBlogs: project.folders.blog.length,
      totalSocialPosts: project.folders.social.length,

      completedTasks: project.tasks.filter(t => t.status === 'completed').length,
      totalTasks: project.tasks.length,
      overallProgress: this.calculateProjectProgress(project)
    }
  }

  // Start processing for a project
  static async startProcessing(projectId: string): Promise<void> {
    await fetch(`/api/projects/${projectId}/process`, {
      method: 'POST'
    });
  }
} 
