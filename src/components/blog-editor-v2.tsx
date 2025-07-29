"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconList,
  IconListNumbers,
  IconLink,
  IconQuote,
  IconH1,
  IconH2,
  IconH3,
  IconPhoto,
  IconCode,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustified,
  IconHighlight,
  IconDeviceFloppy,
  IconEye,
  IconDownload,
  IconBrandMedium,
  IconBrandLinkedin,
  IconMail,
  IconSparkles,
  IconCopy,
  IconCheck,
  IconSettings,
  IconPalette,
  IconTemplate,
  IconSend,
  IconFileExport
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from "framer-motion"
// Blog editor styles are now in globals.css

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  seoTitle: string
  seoDescription: string
  readingTime: number
  coverImage?: string
  author?: {
    name: string
    bio?: string
    avatar?: string
  }
  createdAt: string
  updatedAt?: string
  publishedAt?: string
  status: 'draft' | 'published'
  platform?: 'medium' | 'linkedin' | 'newsletter'
}

interface BlogEditorV2Props {
  blog: BlogPost
  onSave: (blog: BlogPost) => Promise<void>
  onPublish?: (blog: BlogPost, platform: string) => Promise<void>
  projectTitle?: string
}

const platformStyles = {
  medium: {
    font: 'font-serif',
    titleSize: 'text-4xl',
    bodySize: 'text-lg',
    lineHeight: 'leading-relaxed',
    maxWidth: 'max-w-3xl',
    spacing: 'space-y-6'
  },
  linkedin: {
    font: 'font-sans',
    titleSize: 'text-3xl',
    bodySize: 'text-base',
    lineHeight: 'leading-normal',
    maxWidth: 'max-w-2xl',
    spacing: 'space-y-4'
  },
  newsletter: {
    font: 'font-sans',
    titleSize: 'text-3xl',
    bodySize: 'text-base',
    lineHeight: 'leading-relaxed',
    maxWidth: 'max-w-xl',
    spacing: 'space-y-5'
  }
}

const templates = {
  'how-to': {
    name: 'How-To Guide',
    structure: `# How to [Your Topic]

## Introduction
[Brief introduction explaining what readers will learn]

## What You'll Need
- Requirement 1
- Requirement 2
- Requirement 3

## Step 1: [First Step]
[Detailed explanation of the first step]

## Step 2: [Second Step]
[Detailed explanation of the second step]

## Step 3: [Third Step]
[Detailed explanation of the third step]

## Common Mistakes to Avoid
- Mistake 1
- Mistake 2

## Conclusion
[Wrap up and encourage readers to try it themselves]

## Additional Resources
- [Resource 1]
- [Resource 2]`
  },
  'listicle': {
    name: 'Listicle',
    structure: `# [Number] [Things] That Will [Benefit]

## Introduction
[Hook the reader with why this list matters]

## 1. [First Item]
[Explanation of the first item and why it's important]

## 2. [Second Item]
[Explanation of the second item and why it's important]

## 3. [Third Item]
[Explanation of the third item and why it's important]

## Key Takeaways
- Takeaway 1
- Takeaway 2
- Takeaway 3

## Conclusion
[Encourage action and summarize the value]`
  },
  'thought-leadership': {
    name: 'Thought Leadership',
    structure: `# [Bold Statement or Question About Your Industry]

## The Current State
[Describe the current situation in your industry]

## The Problem
[Identify the key challenge or opportunity]

## My Perspective
[Share your unique viewpoint and insights]

## Evidence and Examples
[Provide data, case studies, or examples]

## The Path Forward
[Outline your vision for the future]

## Call to Action
[Encourage readers to think differently or take action]`
  }
}

export function BlogEditorV2({ blog: initialBlog, onSave, onPublish, projectTitle }: BlogEditorV2Props) {
  const [blog, setBlog] = useState<BlogPost>(initialBlog)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [previewPlatform, setPreviewPlatform] = useState<'medium' | 'linkedin' | 'newsletter'>('medium')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-save functionality
  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        handleAutoSave()
      }, 3000) // Auto-save after 3 seconds of inactivity
      return () => clearTimeout(timer)
    }
  }, [blog, isEditing])

  const handleAutoSave = async () => {
    if (!isEditing) return
    setIsSaving(true)
    try {
      await onSave({ ...blog, status: 'draft' })
      toast.success("Auto-saved", { duration: 1000 })
    } catch (error) {
      console.error("Auto-save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(blog)
      toast.success("Blog post saved successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to save blog post")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async (platform: string) => {
    if (!onPublish) return
    setIsPublishing(true)
    try {
      await onPublish({ ...blog, platform: platform as any }, platform)
      toast.success(`Published to ${platform}`)
    } catch (error) {
      toast.error(`Failed to publish to ${platform}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const insertFormatting = (format: string, value?: string) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    let newElement: HTMLElement | null = null

    switch (format) {
      case 'bold':
        newElement = document.createElement('strong')
        newElement.textContent = selectedText || 'Bold text'
        break
      case 'italic':
        newElement = document.createElement('em')
        newElement.textContent = selectedText || 'Italic text'
        break
      case 'underline':
        newElement = document.createElement('u')
        newElement.textContent = selectedText || 'Underlined text'
        break
      case 'h1':
      case 'h2':
      case 'h3':
        newElement = document.createElement(format)
        newElement.textContent = selectedText || `Heading ${format.charAt(1)}`
        break
      case 'quote':
        newElement = document.createElement('blockquote')
        newElement.className = 'border-l-4 border-primary pl-4 italic'
        newElement.textContent = selectedText || 'Quote text'
        break
      case 'link':
        newElement = document.createElement('a')
        newElement.setAttribute('href', value || '#')
        newElement.className = 'text-primary underline'
        newElement.textContent = selectedText || 'Link text'
        break
      case 'list':
        newElement = document.createElement('ul')
        newElement.innerHTML = '<li>List item</li>'
        break
      case 'numbered':
        newElement = document.createElement('ol')
        newElement.innerHTML = '<li>List item</li>'
        break
      case 'code':
        newElement = document.createElement('code')
        newElement.className = 'bg-muted px-1 rounded'
        newElement.textContent = selectedText || 'code'
        break
      case 'highlight':
        newElement = document.createElement('mark')
        newElement.className = 'bg-yellow-200 dark:bg-yellow-900'
        newElement.textContent = selectedText || 'Highlighted text'
        break
    }

    if (newElement) {
      range.deleteContents()
      range.insertNode(newElement)
      range.selectNodeContents(newElement)
      selection.removeAllRanges()
      selection.addRange(range)
      
      handleContentChange()
    }
  }

  const handleContentChange = () => {
    if (editorRef.current) {
      setBlog({ ...blog, content: editorRef.current.innerHTML })
      setIsEditing(true)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = document.createElement('img')
      img.src = e.target?.result as string
      img.className = 'max-w-full h-auto rounded-lg my-4'
      
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.insertNode(img)
        handleContentChange()
      }
    }
    reader.readAsDataURL(file)
  }

  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates]
    if (template && editorRef.current) {
      // Convert markdown to HTML for the editor
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = `<div class="prose">${template.structure.replace(/\n/g, '<br>')}</div>`
      editorRef.current.innerHTML = tempDiv.innerHTML
      handleContentChange()
      setShowTemplates(false)
      toast.success(`Applied ${template.name} template`)
    }
  }

  const exportContent = (format: 'markdown' | 'html' | 'medium' | 'linkedin' | 'newsletter') => {
    let content = ''
    const title = blog.title
    const excerpt = blog.excerpt
    const tags = blog.tags.join(', ')

    switch (format) {
      case 'markdown':
        // Convert HTML to Markdown (simplified)
        content = `# ${title}\n\n${excerpt}\n\n${blog.content.replace(/<[^>]*>/g, '')}\n\nTags: ${tags}`
        break
      case 'html':
        content = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta name="description" content="${blog.seoDescription}">
  <meta name="keywords" content="${tags}">
</head>
<body>
  <article>
    <h1>${title}</h1>
    <p class="excerpt">${excerpt}</p>
    ${blog.content}
    <div class="tags">Tags: ${tags}</div>
  </article>
</body>
</html>`
        break
      case 'medium':
        content = `${title}\n\n${excerpt}\n\n${blog.content.replace(/<[^>]*>/g, '')}\n\nTags: ${tags}\n\n---\n\nOriginally created with Inflio`
        break
      case 'linkedin':
        content = `${title}\n\n${excerpt}\n\n${blog.content.replace(/<[^>]*>/g, '').substring(0, 3000)}...\n\n#${tags.replace(/,\s*/g, ' #')}`
        break
      case 'newsletter':
        content = `Subject: ${title}\n\nPreheader: ${excerpt}\n\n---\n\n${blog.content}\n\n---\n\nTags: ${tags}`
        break
    }

    if (format === 'markdown' || format === 'html') {
      // Download file
      const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${blog.title.toLowerCase().replace(/\s+/g, '-')}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(`Copied for ${format}`)
    }
  }

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const updateReadingTime = () => {
    const text = editorRef.current?.textContent || ''
    const readingTime = calculateReadingTime(text)
    setBlog({ ...blog, readingTime })
  }

  useEffect(() => {
    updateReadingTime()
  }, [blog.content])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Blog Editor</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                >
                  <IconTemplate className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                >
                  <IconFileExport className="h-4 w-4 mr-2" />
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
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">
                  <IconSettings className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <IconEye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

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
                    className="text-2xl font-bold"
                    placeholder="Enter an engaging title..."
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <textarea
                    id="excerpt"
                    value={blog.excerpt}
                    onChange={(e) => {
                      setBlog({ ...blog, excerpt: e.target.value })
                      setIsEditing(true)
                    }}
                    className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="A compelling summary that hooks readers..."
                  />
                </div>

                {/* Rich Text Toolbar */}
                <div className="border rounded-lg p-2 bg-muted/50 flex flex-wrap gap-1">
                  <div className="flex items-center gap-1">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('underline')}
                      className="h-8 w-8 p-0"
                    >
                      <IconUnderline className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('highlight')}
                      className="h-8 w-8 p-0"
                    >
                      <IconHighlight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  <div className="flex items-center gap-1">
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
                  </div>
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  <div className="flex items-center gap-1">
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
                      onClick={() => insertFormatting('code')}
                      className="h-8 w-8 p-0"
                    >
                      <IconCode className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = prompt('Enter URL:')
                        if (url) insertFormatting('link', url)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <IconLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 p-0"
                    >
                      <IconPhoto className="h-4 w-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                {/* Content Editor */}
                <div className="border rounded-lg p-4 min-h-[500px]">
                  <div
                    ref={editorRef}
                    contentEditable
                    className="prose prose-sm max-w-none focus:outline-none"
                    onInput={handleContentChange}
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                {/* Platform Preview Selector */}
                <div className="flex items-center justify-between">
                  <Label>Preview Platform</Label>
                  <Select
                    value={previewPlatform}
                    onValueChange={(value: any) => setPreviewPlatform(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <IconBrandMedium className="h-4 w-4" />
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="linkedin">
                        <div className="flex items-center gap-2">
                          <IconBrandLinkedin className="h-4 w-4" />
                          LinkedIn
                        </div>
                      </SelectItem>
                      <SelectItem value="newsletter">
                        <div className="flex items-center gap-2">
                          <IconMail className="h-4 w-4" />
                          Newsletter
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform-Specific Preview */}
                <Card className={cn(
                  "mx-auto",
                  platformStyles[previewPlatform].maxWidth
                )}>
                  <CardContent className="p-8">
                    <article className={cn(
                      platformStyles[previewPlatform].font,
                      platformStyles[previewPlatform].spacing
                    )}>
                      <h1 className={cn(
                        "font-bold mb-4",
                        platformStyles[previewPlatform].titleSize
                      )}>
                        {blog.title}
                      </h1>
                      
                      {blog.author && (
                        <div className="flex items-center gap-3 mb-6">
                          {blog.author.avatar && (
                            <img
                              src={blog.author.avatar}
                              alt={blog.author.name}
                              className="w-12 h-12 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">{blog.author.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(blog.createdAt).toLocaleDateString()} · {blog.readingTime} min read
                            </p>
                          </div>
                        </div>
                      )}

                      <p className={cn(
                        "text-muted-foreground mb-8",
                        platformStyles[previewPlatform].bodySize
                      )}>
                        {blog.excerpt}
                      </p>

                      <div 
                        className={cn(
                          "prose max-w-none",
                          platformStyles[previewPlatform].bodySize,
                          platformStyles[previewPlatform].lineHeight
                        )}
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                      />

                      {blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
                          {blog.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {previewPlatform === 'linkedin' ? `#${tag}` : tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </article>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Publishing Options */}
        <Card>
          <CardHeader>
            <CardTitle>Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handlePublish('medium')}
              disabled={isPublishing}
            >
              <IconBrandMedium className="h-4 w-4 mr-2" />
              Publish to Medium
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handlePublish('linkedin')}
              disabled={isPublishing}
            >
              <IconBrandLinkedin className="h-4 w-4 mr-2" />
              Share on LinkedIn
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handlePublish('newsletter')}
              disabled={isPublishing}
            >
              <IconMail className="h-4 w-4 mr-2" />
              Send Newsletter
            </Button>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Optimization</CardTitle>
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
                placeholder="60 characters max"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {blog.seoTitle.length}/60 characters
              </p>
            </div>
            <div>
              <Label htmlFor="seo-description">Meta Description</Label>
              <textarea
                id="seo-description"
                value={blog.seoDescription}
                onChange={(e) => {
                  setBlog({ ...blog, seoDescription: e.target.value })
                  setIsEditing(true)
                }}
                className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="160 characters max"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {blog.seoDescription.length}/160 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags & Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {blog.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    setBlog({
                      ...blog,
                      tags: blog.tags.filter((_, i) => i !== index)
                    })
                    setIsEditing(true)
                  }}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setBlog({
                    ...blog,
                    tags: [...blog.tags, e.currentTarget.value.trim()]
                  })
                  setIsEditing(true)
                  e.currentTarget.value = ''
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Content Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Words</span>
              <span className="font-medium">
                {blog.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Characters</span>
              <span className="font-medium">
                {blog.content.replace(/<[^>]*>/g, '').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Reading Time</span>
              <span className="font-medium">{blog.readingTime} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Saved</span>
              <span className="font-medium">
                {blog.updatedAt ? new Date(blog.updatedAt).toLocaleTimeString() : 'Not saved'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Select a template to structure your blog post
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(templates).map(([key, template]) => (
              <Card
                key={key}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => applyTemplate(key)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Perfect for creating structured {template.name.toLowerCase()} content
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Blog Post</DialogTitle>
            <DialogDescription>
              Choose a format to export your blog post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => exportContent('markdown')}
            >
              <span className="flex items-center gap-2">
                <IconDownload className="h-4 w-4" />
                Markdown (.md)
              </span>
              <Badge variant="secondary">Download</Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => exportContent('html')}
            >
              <span className="flex items-center gap-2">
                <IconCode className="h-4 w-4" />
                HTML (.html)
              </span>
              <Badge variant="secondary">Download</Badge>
            </Button>
            <Separator />
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => exportContent('medium')}
            >
              <span className="flex items-center gap-2">
                <IconBrandMedium className="h-4 w-4" />
                Medium Format
              </span>
              <Badge variant="secondary">
                {copied ? <IconCheck className="h-3 w-3" /> : 'Copy'}
              </Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => exportContent('linkedin')}
            >
              <span className="flex items-center gap-2">
                <IconBrandLinkedin className="h-4 w-4" />
                LinkedIn Article
              </span>
              <Badge variant="secondary">
                {copied ? <IconCheck className="h-3 w-3" /> : 'Copy'}
              </Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => exportContent('newsletter')}
            >
              <span className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Newsletter
              </span>
              <Badge variant="secondary">
                {copied ? <IconCheck className="h-3 w-3" /> : 'Copy'}
              </Badge>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 