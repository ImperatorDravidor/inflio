"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconLoader2
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, BlogPost } from "@/lib/project-types"
import { BlogEditorV2 } from "@/components/blog-editor-v2"

// Extended BlogPost type for the editor
interface ExtendedBlogPost extends Omit<BlogPost, 'sections'> {
  sections?: Array<{ heading: string; content: string }>
  status?: 'draft' | 'published'
  author?: {
    name: string
    bio?: string
    avatar?: string
  }
  coverImage?: string
  publishedAt?: string
  platform?: 'medium' | 'linkedin' | 'newsletter'
}
import { BlogPublishingService } from "@/lib/blog-publishing-service"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectBlogEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const blogId = params.blogId as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjectAndBlog()
  }, [projectId, blogId])

  const loadProjectAndBlog = async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      
      const blogPost = proj.folders.blog.find(b => b.id === blogId)
      if (!blogPost) {
        toast.error("Blog post not found")
        router.push(`/projects/${projectId}`)
        return
      }
      
      setProject(proj)
      setBlog(blogPost)
    } catch (error) {
      console.error("Failed to load project or blog:", error)
      toast.error("Failed to load blog post")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updatedBlog: ExtendedBlogPost) => {
    if (!project) return
    
    try {
      // Update the blog post in the project - ensure sections is included
      const blogWithSections: BlogPost = {
        ...updatedBlog,
        sections: updatedBlog.sections || []
      } as BlogPost
      
      const updatedBlogs = project.folders.blog.map(b => 
        b.id === blogId ? blogWithSections : b
      )
      
      await ProjectService.updateProject(projectId, {
        folders: {
          ...project.folders,
          blog: updatedBlogs
        }
      })
      
      setBlog(blogWithSections)
      await loadProjectAndBlog() // Reload to ensure consistency
    } catch (error) {
      console.error("Failed to save blog post:", error)
      throw error // Let BlogEditorV2 handle the error
    }
  }

  const handlePublish = async (blog: ExtendedBlogPost, platform: string) => {
    try {
      let result
      
      switch (platform) {
        case 'medium':
          result = await BlogPublishingService.publishToMedium({
            platform: 'medium',
            blogPost: {
              title: blog.title,
              content: blog.content,
              excerpt: blog.excerpt,
              tags: blog.tags,
              coverImage: blog.coverImage
            }
          })
          break
          
        case 'linkedin':
          result = await BlogPublishingService.publishToLinkedIn({
            platform: 'linkedin',
            blogPost: {
              title: blog.title,
              content: blog.content,
              excerpt: blog.excerpt,
              tags: blog.tags,
              coverImage: blog.coverImage
            },
            platformSpecific: {
              linkedin: {
                shareCommentary: blog.excerpt
              }
            }
          })
          break
          
        case 'newsletter':
          result = await BlogPublishingService.sendNewsletter({
            platform: 'newsletter',
            blogPost: {
              title: blog.title,
              content: blog.content,
              excerpt: blog.excerpt,
              tags: blog.tags,
              coverImage: blog.coverImage
            },
            platformSpecific: {
              newsletter: {
                subject: blog.title,
                preheader: blog.excerpt
              }
            }
          })
          break
          
        default:
          throw new Error(`Unsupported platform: ${platform}`)
      }
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Update blog status
      const publishedBlog = {
        ...blog,
        status: 'published' as const,
        publishedAt: new Date().toISOString(),
        platform: platform as any
      }
      
      await handleSave(publishedBlog)
      
      if ('url' in result && result.url) {
        window.open(result.url, '_blank')
      }
    } catch (error) {
      console.error(`Failed to publish to ${platform}:`, error)
      throw error // Let BlogEditorV2 handle the error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-px" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          
          {/* Editor Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!blog || !project) return null

  // Transform blog post to match BlogEditorV2 format
  const formattedBlog = {
    ...blog,
    status: (blog as any).status || 'draft',
    author: {
      name: 'Content Creator', // You might want to get this from user profile
      bio: 'Created with Inflio',
      avatar: undefined
    },
    coverImage: (blog as any).coverImage,
    publishedAt: (blog as any).publishedAt,
    platform: (blog as any).platform
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-semibold">Blog Editor</h1>
            <p className="text-sm text-muted-foreground">
              {project.title}
            </p>
          </div>
        </div>

        {/* Blog Editor Component */}
        <BlogEditorV2
          blog={formattedBlog as any}
          onSave={handleSave}
          onPublish={handlePublish}
          projectTitle={project.title}
        />
      </div>
    </div>
  )
} 