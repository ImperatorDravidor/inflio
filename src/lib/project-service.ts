import { Project, VideoMetadata, ProcessingTask, ContentFolders, SocialPost } from './project-types'
import { v4 as uuidv4 } from 'uuid'
import { WorkflowOptions } from '@/components/workflow-selection'

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
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const project: Project = {
      id: projectId,
      title: title || videoFile.name.replace(/\.[^/.]+$/, ""),
      description: '',
      video_id: videoId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      metadata,
      status: 'processing',
      folders: {
        clips: [],
        blog: [],
        social: [],
        podcast: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId || 'demo-user',
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

    // Save project
    await this.saveProject(project)
    
    // Add to projects list
    await this.addToProjectsList(project)
    
    // Dispatch update event
    dispatchProjectUpdate()
    
    return project
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
    
    if (workflowOptions.podcast) {
      tasks.push({
        id: uuidv4(),
        type: 'podcast',
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
      'social',
      'podcast'
    ]
    
    return taskTypes.map(type => ({
      id: uuidv4(),
      type,
      status: 'pending',
      progress: 0
    }))
  }

  // Save project to localStorage
  static async saveProject(project: Project): Promise<void> {
    const key = `${PROJECT_PREFIX}${project.id}`
    localStorage.setItem(key, JSON.stringify(project))
  }

  // Get project by ID
  static async getProject(projectId: string): Promise<Project | null> {
    const key = `${PROJECT_PREFIX}${projectId}`
    const data = localStorage.getItem(key)
    try {
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to parse project data:', error)
      return null
    }
  }

  // Update project
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    const project = await this.getProject(projectId)
    if (!project) return null

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await this.saveProject(updatedProject)
    return updatedProject
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
    content: ContentFolders[T][0]
  ): Promise<void> {
    const project = await this.getProject(projectId)
    if (!project) return

    // Type-safe folder update
    const updatedFolders = {
      ...project.folders,
      [folderType]: [...project.folders[folderType], content]
    } as ContentFolders

    project.folders = updatedFolders

    await this.saveProject(project)
  }

  // Get all projects
  static async getAllProjects(): Promise<Project[]> {
    const projectsList = localStorage.getItem(PROJECTS_KEY)
    if (!projectsList) return []

    try {
      const projectIds = JSON.parse(projectsList) as string[]
      const projects = await Promise.all(
        projectIds.map(id => this.getProject(id))
      )

      return projects.filter(p => p !== null) as Project[]
    } catch (error) {
      console.error('Failed to parse projects list:', error)
      return []
    }
  }

  // Add project to list
  private static async addToProjectsList(project: Project): Promise<void> {
    const projectsList = localStorage.getItem(PROJECTS_KEY)
    try {
      const projectIds = projectsList ? JSON.parse(projectsList) : []
      
      if (!projectIds.includes(project.id)) {
        projectIds.unshift(project.id)
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectIds))
      }
    } catch (error) {
      console.error('Failed to parse projects list:', error)
      // Initialize with new project ID if parsing fails
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([project.id]))
    }
  }

  // Delete project
  static async deleteProject(projectId: string): Promise<boolean> {
    // Remove from projects list
    const projectsList = localStorage.getItem(PROJECTS_KEY)
    if (projectsList) {
      try {
        const projectIds = JSON.parse(projectsList) as string[]
        const filtered = projectIds.filter(id => id !== projectId)
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered))
      } catch (error) {
        console.error('Failed to parse projects list:', error)
      }
    }

    // Remove project data
    const key = `${PROJECT_PREFIX}${projectId}`
    localStorage.removeItem(key)
    
    // Remove associated data
    localStorage.removeItem(`video_${projectId}`)
    localStorage.removeItem(`thumbnail_${projectId}`)

    // Dispatch update event
    dispatchProjectUpdate()

    return true
  }

  // Search projects
  static async searchProjects(query: string): Promise<Project[]> {
    const projects = await this.getAllProjects()
    const lowercaseQuery = query.toLowerCase()

    return projects.filter(project =>
      project.title.toLowerCase().includes(lowercaseQuery) ||
      project.description.toLowerCase().includes(lowercaseQuery) ||
      project.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  // Get projects by status
  static async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    const projects = await this.getAllProjects()
    return projects.filter(p => p.status === status)
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
      podcastChapters: project.folders.podcast.length,
      completedTasks: project.tasks.filter(t => t.status === 'completed').length,
      totalTasks: project.tasks.length,
      overallProgress: this.calculateProjectProgress(project)
    }
  }
} 
