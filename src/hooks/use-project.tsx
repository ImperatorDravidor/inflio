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
      
      let pollCount = 0
      const maxPolls = 360 // Stop after 1 hour (360 * 10 seconds)
      
      // Function to check for updates
      const checkForUpdates = async () => {
        pollCount++
        
        // Stop polling after max attempts
        if (pollCount > maxPolls) {
          console.warn('[Polling] Max polling attempts reached. Stopping.')
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          toast.error('Clip processing is taking longer than expected. Please check Inngest logs or refresh the page.')
          return
        }
        
        try {
          const response = await fetch(`/api/process-klap?projectId=${projectId}`)
          if (response.ok) {
            const result = await response.json()
            
            // If status changed or clips are ready, reload the project
            if (result.status === 'completed' || (result.clips && result.clips.length > 0)) {
              console.log('[Polling] Clips completed! Reloading project...')
              await loadProject()
              
              // Stop polling since processing is complete
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            } else if (result.status === 'failed') {
              console.error('[Polling] Clips processing failed')
              toast.error('Clip generation failed. Please check logs and try again.')
              
              // Stop polling on failure
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
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
          } else {
            console.error('[Polling] Failed to fetch status:', response.status)
          }
        } catch (error) {
          console.error('[Polling] Error checking for updates:', error)
          // Don't stop polling on network errors, they might be temporary
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