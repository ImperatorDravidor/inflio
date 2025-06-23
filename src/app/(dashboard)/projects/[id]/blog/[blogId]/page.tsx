"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconCode,
  IconTag,
  IconClock,
  IconFileText,
  IconCopy,
  IconDownload,
  IconBold,
  IconItalic,
  IconList,
  IconListNumbers,
  IconLink,
  IconQuote,
  IconH1,
  IconH2,
  IconH3,
  IconLoader2
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { ProjectService } from "@/lib/services"
import { Project, BlogPost } from "@/lib/project-types"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ProjectBlogEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const blogId = params.blogId as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")

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

  const handleSave = async () => {
    if (!blog || !project) return
    
    setIsSaving(true)
    try {
      // Update the blog post in the project
      const updatedBlogs = project.folders.blog.map(b => 
        b.id === blogId ? blog : b
      )
      
      await ProjectService.updateProject(projectId, {
        folders: {
          ...project.folders,
          blog: updatedBlogs
        }
      })
      
      toast.success("Blog post saved successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to save blog post")
    } finally {
      setIsSaving(false)
    }
  }

  const insertFormatting = (format: string) => {
    if (!blog) return
    
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    let formattedText = selectedText

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'h1':
        formattedText = `# ${selectedText}`
        break
      case 'h2':
        formattedText = `## ${selectedText}`
        break
      case 'h3':
        formattedText = `### ${selectedText}`
        break
      case 'quote':
        formattedText = `> ${selectedText}`
        break
      case 'link':
        formattedText = `[${selectedText}](url)`
        break
      case 'list':
        formattedText = `- ${selectedText}`
        break
      case 'numbered':
        formattedText = `1. ${selectedText}`
        break
    }

    const newContent = 
      textarea.value.substring(0, start) + 
      formattedText + 
      textarea.value.substring(end)
    
    setBlog({ ...blog, content: newContent })
    setIsEditing(true)
  }

  const exportBlogAsMarkdown = () => {
    if (!blog) return
    
    const markdown = `---
title: ${blog.title}
date: ${new Date(blog.createdAt).toISOString()}
tags: ${blog.tags.join(', ')}
seo_title: ${blog.seoTitle}
seo_description: ${blog.seoDescription}
reading_time: ${blog.readingTime} minutes
---

# ${blog.title}

${blog.excerpt}

${blog.content}

## Tags
${blog.tags.map(tag => `- ${tag}`).join('\n')}
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${blog.title.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Blog post exported as Markdown')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!blog || !project) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-semibold">Blog Editor</h1>
              <p className="text-sm text-muted-foreground">
                {project.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Unsaved Changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportBlogAsMarkdown}
            >
              <IconDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isEditing || isSaving}
            >
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Content Editor</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("editor")}
                      className={cn(activeTab === "editor" && "bg-muted")}
                    >
                      <IconFileText className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("preview")}
                      className={cn(activeTab === "preview" && "bg-muted")}
                    >
                      <IconEye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="editor" className="space-y-4">
                    {/* Title */}
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={blog.title}
                        onChange={(e) => {
                          setBlog({ ...blog, title: e.target.value })
                          setIsEditing(true)
                        }}
                        className="text-lg font-semibold"
                        placeholder="Enter blog title..."
                      />
                    </div>

                    {/* Excerpt */}
                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={blog.excerpt}
                        onChange={(e) => {
                          setBlog({ ...blog, excerpt: e.target.value })
                          setIsEditing(true)
                        }}
                        rows={2}
                        placeholder="Brief description of your blog post..."
                      />
                    </div>

                    {/* Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-2 border rounded-lg bg-muted/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('bold')}
                        className="h-8 w-8 p-0"
                      >
                        <IconBold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('italic')}
                        className="h-8 w-8 p-0"
                      >
                        <IconItalic className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('h1')}
                        className="h-8 w-8 p-0"
                      >
                        <IconH1 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('h2')}
                        className="h-8 w-8 p-0"
                      >
                        <IconH2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('h3')}
                        className="h-8 w-8 p-0"
                      >
                        <IconH3 className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('list')}
                        className="h-8 w-8 p-0"
                      >
                        <IconList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('numbered')}
                        className="h-8 w-8 p-0"
                      >
                        <IconListNumbers className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('quote')}
                        className="h-8 w-8 p-0"
                      >
                        <IconQuote className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('link')}
                        className="h-8 w-8 p-0"
                      >
                        <IconLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Content Editor */}
                    <div>
                      <Label htmlFor="content-editor">Content (Markdown)</Label>
                      <Textarea
                        id="content-editor"
                        value={blog.content}
                        onChange={(e) => {
                          setBlog({ ...blog, content: e.target.value })
                          setIsEditing(true)
                        }}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder="Write your blog content in Markdown..."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="preview">
                    <ScrollArea className="h-[600px] w-full rounded-md border p-6">
                      <article className="prose prose-sm max-w-none dark:prose-invert">
                        <h1>{blog.title}</h1>
                        <p className="lead">{blog.excerpt}</p>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {blog.content}
                        </ReactMarkdown>
                      </article>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo-title">SEO Title</Label>
                  <Input
                    id="seo-title"
                    value={blog.seoTitle}
                    onChange={(e) => {
                      setBlog({ ...blog, seoTitle: e.target.value })
                      setIsEditing(true)
                    }}
                    placeholder="SEO optimized title..."
                  />
                </div>
                <div>
                  <Label htmlFor="seo-description">SEO Description</Label>
                  <Textarea
                    id="seo-description"
                    value={blog.seoDescription}
                    onChange={(e) => {
                      setBlog({ ...blog, seoDescription: e.target.value })
                      setIsEditing(true)
                    }}
                    rows={3}
                    placeholder="Meta description for search engines..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {blog.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      <IconTag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add tags (comma separated)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget
                      const newTags = input.value.split(',').map(t => t.trim()).filter(t => t)
                      if (newTags.length > 0) {
                        setBlog({ ...blog, tags: [...blog.tags, ...newTags] })
                        setIsEditing(true)
                        input.value = ''
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Words</span>
                  <span className="font-medium">{blog.content.split(' ').filter(w => w).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reading Time</span>
                  <span className="font-medium">{blog.readingTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium">{new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 