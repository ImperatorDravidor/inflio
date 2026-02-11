import { 
  Project, 
  VideoMetadata, 
  ProcessingTask, 
  ContentFolders, 
  SocialPost,
  ClipData,
  BlogPost,

  GeneratedImage
} from './project-types'
import { v4 as uuidv4 } from 'uuid'
import { WorkflowOptions } from '@/components/workflow-selection'
import { createSupabaseBrowserClient } from './supabase/client'

const PROJECTS_KEY = 'inflio_projects'
const PROJECT_PREFIX = 'inflio_project_'

// Helper function to dispatch project update events
const dispatchProjectUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('projectUpdate'))
  }
}

export class ProjectService {
  // Create a new project
  static async createProject(
    title: string,
    videoFile: File,
    videoUrl: string,
    thumbnailUrl: string,
    metadata: VideoMetadata,
    workflows: WorkflowOptions,
    userId?: string
  ): Promise<Project> {
    if (!userId) {
      throw new Error('User ID is required to create a project')
    }
    
    const project = {
      title: title || videoFile.name.replace(/\.[^/.]+$/, ""),
      description: '',
      video_id: uuidv4(), // Use UUID for video_id
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      metadata,
      status: 'processing' as const,
      folders: {
        clips: [],
        blog: [],
        social: [],
  
      },
      user_id: userId,
      tasks: this.initializeTasksFromWorkflows(workflows),
      settings: {
        autoGenerateClips: workflows.clips ?? true,
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
      tags: []
    }

    // Save project to database - Supabase will generate the ID
    const { data, error } = await createSupabaseBrowserClient()
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw new Error('Failed to create project')
    }
    
    // Dispatch update event
    dispatchProjectUpdate()
    
    // Return the project with the generated ID
    return {
      ...data,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    } as Project
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

  // Get project by ID
  static async getProject(projectId: string, userId?: string): Promise<Project | null> {
    try {
      let query = createSupabaseBrowserClient()
        .from('projects')
        .select('*')
        .eq('id', projectId)

      // If userId is provided, filter by user as well
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query.single()

      if (error) {
        console.error('Error fetching project:', error)
        return null
      }

      // Ensure folders always has a safe default structure
      // (database may return null if the column was never set)
      const project = data as Project
      if (!project.folders) {
        project.folders = { clips: [], blog: [], social: [], images: [] }
      } else {
        if (!project.folders.clips) project.folders.clips = []
        if (!project.folders.blog) project.folders.blog = []
        if (!project.folders.social) project.folders.social = []
        if (!project.folders.images) project.folders.images = []
      }
      if (!project.tasks) {
        project.tasks = []
      }

      return project
    } catch (error) {
      console.error('Failed to fetch project:', error)
      return null
    }
  }

  // Update project
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const { data, error } = await createSupabaseBrowserClient()
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
      return data as Project
    } catch (error) {
      console.error('Failed to update project:', error)
      return null
    }
  }

  // Start processing for a project
  static async startProcessing(projectId: string): Promise<void> {
    await fetch(`/api/projects/${projectId}/process`, {
      method: 'POST'
    });
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

    const updatedTasks = [...project.tasks]
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      progress,
      status: status || updatedTasks[taskIndex].status,
      ...(status === 'processing' && !updatedTasks[taskIndex].startedAt
        ? { startedAt: new Date().toISOString() }
        : {}),
      ...(status === 'completed'
        ? { completedAt: new Date().toISOString() }
        : {})
    }

    await this.updateProject(projectId, { tasks: updatedTasks })
  }

  // Add content to folder
  static async addToFolder<T extends keyof ContentFolders>(
    projectId: string,
    folderType: T,
    content: any // We'll type this properly based on folderType
  ): Promise<void> {
    const project = await this.getProject(projectId)
    if (!project) return

    // Create a copy of the folders
    const updatedFolders = { ...project.folders }
    
    // Update the specific folder with type safety
    if (folderType === 'clips') {
      updatedFolders.clips = [...project.folders.clips, content as ClipData]
    } else if (folderType === 'blog') {
      updatedFolders.blog = [...project.folders.blog, content as BlogPost]
    } else if (folderType === 'social') {
      updatedFolders.social = [...project.folders.social, content as SocialPost]
    } else if (folderType === 'images' && project.folders.images) {
      updatedFolders.images = [...project.folders.images, content as GeneratedImage]
    }

    await this.updateProject(projectId, { folders: updatedFolders })
  }

  // Get all projects for a user
  static async getAllProjects(userId: string): Promise<Project[]> {
    try {
      const { data, error } = await createSupabaseBrowserClient()
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
        return []
      }

      return (data || []) as Project[]
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      return []
    }
  }

  // Delete project
  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      
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
  static async searchProjects(query: string, userId: string): Promise<Project[]> {
    try {
      const { data, error } = await createSupabaseBrowserClient()
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching projects:', error)
        return []
      }

      return (data || []) as Project[]
    } catch (error) {
      console.error('Failed to search projects:', error)
      return []
    }
  }

  // Get projects by status
  static async getProjectsByStatus(status: Project['status'], userId: string): Promise<Project[]> {
    try {
      const { data, error } = await createSupabaseBrowserClient()
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects by status:', error)
        return []
      }

      return (data || []) as Project[]
    } catch (error) {
      console.error('Failed to fetch projects by status:', error)
      return []
    }
  }

  // Link social post to project
  static async addSocialPostToProject(projectId: string, socialPost: SocialPost): Promise<void> {
    const project = await this.getProject(projectId)
    if (!project) return

    const updatedFolders = {
      ...project.folders,
      social: [...project.folders.social, socialPost]
    }

    await this.updateProject(projectId, { folders: updatedFolders })
  }

  // Calculate project progress
  static calculateProjectProgress(project: Project): number {
    const tasks = project.tasks || []
    if (tasks.length === 0) return 0
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(totalProgress / tasks.length)
  }

  // Get project statistics
  static getProjectStats(project: Project) {
    const folders = project.folders || { clips: [], blog: [], social: [], images: [] }
    const tasks = project.tasks || []
    
    return {
      totalClips: folders.clips?.length || 0,
      totalBlogs: folders.blog?.length || 0,
      totalSocialPosts: folders.social?.length || 0,
      totalImages: folders.images?.length || 0,

      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalTasks: tasks.length,
      overallProgress: this.calculateProjectProgress(project)
    }
  }
} 
