"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Project } from "@/lib/project-types"
import { ProjectService } from "@/lib/services"
import { toast } from "sonner"

interface UseProjectOptions {
  pollingInterval?: number
  enablePolling?: boolean
}

export function useProject(projectId: string, options?: UseProjectOptions) {
  const { pollingInterval = 10000, enablePolling = true } = options || {}
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoad = useRef(true)

  const loadProject = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true)
      }
      
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        setError("Project not found")
        if (isInitialLoad.current) {
          toast.error("Project not found")
        }
        return
      }
      
      setProject(proj)
      setError(null)
    } catch (err) {
      console.error("Failed to load project:", err)
      setError("Failed to load project")
      if (isInitialLoad.current) {
        toast.error("Failed to load project")
      }
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [projectId])

  // Initial load
  useEffect(() => {
    isInitialLoad.current = true
    loadProject()
  }, [projectId])

  // Polling for updates
  useEffect(() => {
    if (!enablePolling || !project) return

    const clipsTask = project.tasks.find(t => t.type === 'clips')
    const isClipsProcessing = clipsTask && clipsTask.status === 'processing'
    
    if (isClipsProcessing) {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      
      // Function to check for updates
      const checkForUpdates = async () => {
        try {
          const response = await fetch(`/api/process-klap?projectId=${projectId}`)
          if (response.ok) {
            const result = await response.json()
            
            // If status changed or clips are ready, reload the project
            if (result.status === 'completed' || result.clips) {
              await loadProject()
            } else if (result.status === 'processing' && result.progress) {
              // Update progress locally for smoother UX
              setProject(prev => {
                if (!prev) return prev
                
                const updatedTasks = prev.tasks.map(task => {
                  if (task.type === 'clips') {
                    return { ...task, progress: Math.max(10, result.progress) }
                  }
                  return task
                })
                
                return { ...prev, tasks: updatedTasks }
              })
            }
          }
        } catch (error) {
          console.error('Error checking for updates:', error)
        }
      }
      
      // Start polling
      const interval = setInterval(checkForUpdates, pollingInterval)
      pollingIntervalRef.current = interval
      
      // Check immediately
      checkForUpdates()
      
      // Cleanup on unmount or when processing stops
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }
  }, [project, projectId, pollingInterval, enablePolling, loadProject])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  return {
    project,
    loading,
    error,
    reload: loadProject,
    setProject
  }
} 