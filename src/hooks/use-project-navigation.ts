import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Project } from '@/lib/project-types'
import { ROUTES, PROJECT_STATUS } from '@/lib/constants'

export function useProjectNavigation() {
  const router = useRouter()

  const navigateToProject = useCallback((project: Project | { id: string; status: string }) => {
    if (project.status === PROJECT_STATUS.PROCESSING) {
      router.push(ROUTES.PROCESSING(project.id))
    } else {
      router.push(ROUTES.PROJECT_DETAIL(project.id))
    }
  }, [router])

  const navigateToUpload = useCallback(() => {
    router.push(ROUTES.UPLOAD)
  }, [router])

  const navigateToProjects = useCallback(() => {
    router.push(ROUTES.PROJECTS)
  }, [router])

  const navigateToDashboard = useCallback(() => {
    router.push(ROUTES.DASHBOARD)
  }, [router])

  return {
    navigateToProject,
    navigateToUpload,
    navigateToProjects,
    navigateToDashboard
  }
} 
