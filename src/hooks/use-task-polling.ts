"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { ProjectService } from '@/lib/services'

interface ProcessingTask {
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
}

interface UseTaskPollingOptions {
  /** Polling interval in ms. Default 5000. */
  interval?: number
  /** Whether polling is enabled. Default true. */
  enabled?: boolean
}

/**
 * Polls the project API when tasks are still processing.
 * Shows toast notifications when tasks complete.
 * Returns the latest project data and a manual refresh function.
 */
export function useTaskPolling(
  projectId: string | undefined,
  initialTasks: ProcessingTask[] | undefined,
  options: UseTaskPollingOptions = {}
) {
  const { interval = 5000, enabled = true } = options
  const [tasks, setTasks] = useState<ProcessingTask[]>(initialTasks || [])
  const [isPolling, setIsPolling] = useState(false)
  const previousTasksRef = useRef<Record<string, string>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track which tasks we've already notified about
  const notifiedRef = useRef<Set<string>>(new Set())

  const hasIncompleteTasks = tasks.some(
    t => t.status === 'pending' || t.status === 'processing'
  )

  const fetchProject = useCallback(async () => {
    if (!projectId) return null
    try {
      // Use ProjectService directly instead of the API route
      // to avoid potential issues with joins on non-existent tables
      const project = await ProjectService.getProject(projectId)
      return project
    } catch {
      return null
    }
  }, [projectId])

  const checkForCompletions = useCallback((newTasks: ProcessingTask[]) => {
    const prev = previousTasksRef.current

    for (const task of newTasks) {
      const prevStatus = prev[task.type]
      const wasIncomplete = !prevStatus || prevStatus === 'pending' || prevStatus === 'processing'
      const isNowComplete = task.status === 'completed'
      const alreadyNotified = notifiedRef.current.has(task.type)

      if (wasIncomplete && isNowComplete && !alreadyNotified) {
        notifiedRef.current.add(task.type)

        const label = task.type === 'clips'
          ? 'Clips are ready!'
          : task.type === 'transcription'
            ? 'Transcription complete!'
            : `${task.type} is ready!`

        toast.success(label)
      }
    }

    // Update previous state
    const newPrev: Record<string, string> = {}
    for (const t of newTasks) {
      newPrev[t.type] = t.status
    }
    previousTasksRef.current = newPrev
  }, [])

  // Initialize previous tasks ref from initial data
  useEffect(() => {
    if (initialTasks) {
      const prev: Record<string, string> = {}
      for (const t of initialTasks) {
        prev[t.type] = t.status
        // Mark already-completed tasks as notified so we don't toast on mount
        if (t.status === 'completed') {
          notifiedRef.current.add(t.type)
        }
      }
      previousTasksRef.current = prev
      setTasks(initialTasks)
    }
  }, [initialTasks])

  // Polling loop
  useEffect(() => {
    if (!enabled || !projectId || !hasIncompleteTasks) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
      return
    }

    setIsPolling(true)

    const poll = async () => {
      const project = await fetchProject()
      if (project?.tasks) {
        setTasks(project.tasks)
        checkForCompletions(project.tasks)
      }
    }

    intervalRef.current = setInterval(poll, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, projectId, hasIncompleteTasks, interval, fetchProject, checkForCompletions])

  const refresh = useCallback(async () => {
    const project = await fetchProject()
    if (project?.tasks) {
      setTasks(project.tasks)
      checkForCompletions(project.tasks)
    }
    return project
  }, [fetchProject, checkForCompletions])

  return {
    tasks,
    isPolling,
    hasIncompleteTasks,
    refresh,
  }
}
