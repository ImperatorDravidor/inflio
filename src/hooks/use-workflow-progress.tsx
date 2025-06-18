"use client"

import { useState, useEffect, useCallback } from 'react'
import { Project } from '@/lib/project-types'

interface WorkflowProgress {
  projectId: string
  startTime: string
  lastCheckTime: string
  progress: number
  activeTask?: string
  estimatedCompletion?: string
}

export function useWorkflowProgress(project: Project | null) {
  const [progress, setProgress] = useState<WorkflowProgress | null>(null)
  
  // Load saved progress from localStorage
  useEffect(() => {
    if (!project) return
    
    const savedProgress = localStorage.getItem(`workflow-progress-${project.id}`)
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress) as WorkflowProgress
      
      // Check if this is still relevant (not older than 1 hour)
      const lastCheck = new Date(parsed.lastCheckTime)
      const now = new Date()
      const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastCheck < 1 && project.status === 'processing') {
        setProgress(parsed)
      } else {
        // Clean up old progress
        localStorage.removeItem(`workflow-progress-${project.id}`)
      }
    }
  }, [project])
  
  // Save progress
  const updateProgress = useCallback((updates: Partial<WorkflowProgress>) => {
    if (!project) return
    
    const newProgress: WorkflowProgress = {
      projectId: project.id,
      startTime: progress?.startTime || new Date().toISOString(),
      lastCheckTime: new Date().toISOString(),
      progress: updates.progress ?? progress?.progress ?? 0,
      activeTask: updates.activeTask ?? progress?.activeTask,
      estimatedCompletion: updates.estimatedCompletion ?? progress?.estimatedCompletion
    }
    
    setProgress(newProgress)
    localStorage.setItem(`workflow-progress-${project.id}`, JSON.stringify(newProgress))
  }, [project, progress])
  
  // Clean up on completion
  const clearProgress = useCallback(() => {
    if (!project) return
    localStorage.removeItem(`workflow-progress-${project.id}`)
    setProgress(null)
  }, [project])
  
  // Auto-update progress based on project status
  useEffect(() => {
    if (!project) return
    
    if (project.status === 'processing') {
      const projectProgress = project.tasks.reduce((acc, task) => acc + task.progress, 0) / project.tasks.length
      const activeTask = project.tasks.find(t => t.status === 'processing')
      
      updateProgress({
        progress: projectProgress,
        activeTask: activeTask?.type
      })
    } else if (project.status === 'ready' || project.status === 'published') {
      clearProgress()
    }
  }, [project, updateProgress, clearProgress])
  
  return {
    progress,
    updateProgress,
    clearProgress,
    elapsedSeconds: progress ? Math.floor((Date.now() - new Date(progress.startTime).getTime()) / 1000) : 0
  }
}