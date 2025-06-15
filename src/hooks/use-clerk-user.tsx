"use client"

import { useUser, useAuth } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { Project } from '@/lib/project-types'
import { ProjectService } from '@/lib/services'

export function useClerkUser() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { userId } = useAuth()
  
  return {
    isLoaded,
    isSignedIn,
    user,
    userId
  }
}

export function useUserProjects() {
  const { userId, isSignedIn } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Get projects filtered by userId
      const userProjects = await ProjectService.getAllProjects(userId)
      
      setProjects(userProjects)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [isSignedIn, userId])

  useEffect(() => {
    fetchProjects()

    // Listen for project updates
    const handleProjectUpdate = () => {
      fetchProjects()
    }

    window.addEventListener('projectUpdate', handleProjectUpdate)
    
    return () => {
      window.removeEventListener('projectUpdate', handleProjectUpdate)
    }
  }, [userId, isSignedIn, fetchProjects])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  }
} 
