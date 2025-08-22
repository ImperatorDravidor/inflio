"use client"

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EnhancedThumbnailGenerator } from '@/components/thumbnail/enhanced-thumbnail-generator'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useClerkUser } from '@/hooks/use-clerk-user'

export default function ProjectThumbnailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { user } = useClerkUser()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId && user) {
      loadProject()
    }
  }, [projectId, user])

  const loadProject = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Thumbnail Generator</h1>
          <p className="text-muted-foreground">
            Create professional thumbnails for: {project.title}
          </p>
        </div>
      </div>

      {/* Thumbnail Generator Component */}
      <EnhancedThumbnailGenerator
        projectId={projectId}
        projectTitle={project.title}
        videoUrl={project.video_url}
        projectContext={project.content_analysis}
      />
    </div>
  )
}