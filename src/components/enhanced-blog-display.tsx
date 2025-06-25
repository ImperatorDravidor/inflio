"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  IconBookmark,
  IconBookmarkFilled,
  IconShare,
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconEye,
  IconClock,
  IconUser,
  IconCalendar,
  IconTag,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconEdit,
  IconArrowUp,
  IconCheck,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconLink,
  IconTextSize,
  IconSun,
  IconMoon,
  IconPalette,
  IconPlayerPlay,
  IconPlayerPause,
  IconAdjustments,
  IconZoomIn,
  IconZoomOut
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BlogPost } from "@/lib/project-types"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format } from "date-fns"

interface EnhancedBlogDisplayProps {
  blog: BlogPost
  onEdit?: () => void
  onShare?: (platform: string) => void
  onBookmark?: () => void
  onLike?: () => void
  className?: string
  showFullContent?: boolean
  isBookmarked?: boolean
  isLiked?: boolean
  likeCount?: number
  viewCount?: number
  author?: {
    name: string
    avatar?: string
    bio?: string
  }
}

type ReadingTheme = 'light' | 'dark' | 'sepia' | 'high-contrast'
type FontSize = 'sm' | 'base' | 'lg' | 'xl'
type LineHeight = 'tight' | 'normal' | 'relaxed' | 'loose'

export function EnhancedBlogDisplay({
  blog,
  onEdit,
  onShare,
  onBookmark,
  onLike,
  className,
  showFullContent = false,
  isBookmarked = false,
  isLiked = false,
  likeCount = 0,
  viewCount = 0,
  author
}: EnhancedBlogDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(showFullContent)
  const [readingProgress, setReadingProgress] = useState(0)
  const [isReadingMode, setIsReadingMode] = useState(false)
  const [estimatedReadTime, setEstimatedReadTime] = useState(0)
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light')
  const [fontSize, setFontSize] = useState<FontSize>('base')
  const [lineHeight, setLineHeight] = useState<LineHeight>('normal')
  const [showTableOfContents, setShowTableOfContents] = useState(false)
  const [isTextToSpeech, setIsTextToSpeech] = useState(false)
  const [tocItems, setTocItems] = useState<Array<{ id: string; text: string; level: number }>>([])
  
  const contentRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Calculate reading time and progress
  useEffect(() => {
    const words = blog.content.split(/\s+/).length
    const averageWPM = 200
    setEstimatedReadTime(Math.ceil(words / averageWPM))
  }, [blog.content])

  // Extract table of contents from content
  useEffect(() => {
    const headings = blog.content.match(/^#{1,6}\s+.+$/gm) || []
    const toc = headings.map((heading, index) => {
      const level = heading.match(/^#+/)?.[0].length || 1
      const text = heading.replace(/^#+\s+/, '')
      return {
        id: `heading-${index}`,
        text,
        level
      }
    })
    setTocItems(toc)
  }, [blog.content])

  // Reading progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      
      const element = contentRef.current
      const scrollTop = element.scrollTop
      const scrollHeight = element.scrollHeight - element.clientHeight
      const progress = (scrollTop / scrollHeight) * 100
      
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }

    const element = contentRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [isExpanded])

  // Text-to-speech functionality
  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isTextToSpeech) {
        speechSynthesis.cancel()
        setIsTextToSpeech(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(blog.content)
        utterance.rate = 0.8
        utterance.pitch = 1
        utterance.onend = () => setIsTextToSpeech(false)
        speechSynthesis.speak(utterance)
        setIsTextToSpeech(true)
      }
    } else {
      toast.error('Text-to-speech not supported in this browser')
    }
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = blog.title
    const text = blog.excerpt

    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
        return
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
    onShare?.(platform)
  }

  const getThemeClasses = (theme: ReadingTheme) => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100'
      case 'sepia':
        return 'bg-yellow-50 text-yellow-900'
      case 'high-contrast':
        return 'bg-black text-white'
      default:
        return 'bg-white text-gray-900'
    }
  }

  const getFontSizeClasses = (size: FontSize) => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-lg'
      case 'xl':
        return 'text-xl'
      default:
        return 'text-base'
    }
  }

  const getLineHeightClasses = (height: LineHeight) => {
    switch (height) {
      case 'tight':
        return 'leading-tight'
      case 'relaxed':
        return 'leading-relaxed'
      case 'loose':
        return 'leading-loose'
      default:
        return 'leading-normal'
    }
  }

  const exportBlog = (format: 'md' | 'pdf' | 'html') => {
    let content = ''
    let filename = `${blog.title.toLowerCase().replace(/\s+/g, '-')}`
    let mimeType = 'text/plain'

    switch (format) {
      case 'md':
        content = `# ${blog.title}\n\n${blog.excerpt}\n\n${blog.content}`
        filename += '.md'
        mimeType = 'text/markdown'
        break
      case 'html':
        content = `<!DOCTYPE html>
<html>
<head>
  <title>${blog.title}</title>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <h1>${blog.title}</h1>
  <div class="meta">
    <p>${blog.excerpt}</p>
    <p>Reading time: ${estimatedReadTime} minutes • Tags: ${blog.tags.join(', ')}</p>
  </div>
  ${blog.content.replace(/\n/g, '<br>')}
</body>
</html>`
        filename += '.html'
        mimeType = 'text/html'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`Blog exported as ${format.toUpperCase()}`)
  }

  if (isReadingMode) {
    return (
      <div className={cn(
        "min-h-screen transition-colors duration-300",
        getThemeClasses(readingTheme)
      )}>
        {/* Reading Mode Header */}
        <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReadingMode(false)}
              >
                ← Exit Reading Mode
              </Button>
              
              <div className="flex items-center gap-2">
                <Progress value={readingProgress} className="w-32" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(readingProgress)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <IconAdjustments className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Theme</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {(['light', 'dark', 'sepia', 'high-contrast'] as ReadingTheme[]).map((theme) => (
                            <Button
                              key={theme}
                              size="sm"
                              variant={readingTheme === theme ? 'default' : 'outline'}
                              onClick={() => setReadingTheme(theme)}
                              className="capitalize"
                            >
                              {theme.replace('-', ' ')}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Font Size</label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFontSize(fontSize === 'sm' ? 'sm' : fontSize === 'base' ? 'sm' : fontSize === 'lg' ? 'base' : 'lg')}
                          >
                            <IconZoomOut className="h-4 w-4" />
                          </Button>
                          <span className="px-3 py-1 bg-muted rounded text-sm">{fontSize}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFontSize(fontSize === 'sm' ? 'base' : fontSize === 'base' ? 'lg' : fontSize === 'lg' ? 'xl' : 'xl')}
                          >
                            <IconZoomIn className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTextToSpeech}
                >
                                            {isTextToSpeech ? <IconPlayerPause className="h-4 w-4" /> : <IconPlayerPlay className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Content */}
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <article className={cn(
            "prose prose-lg dark:prose-invert mx-auto",
            getFontSizeClasses(fontSize),
            getLineHeightClasses(lineHeight)
          )}>
            <header className="not-prose mb-8">
              <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{blog.excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{estimatedReadTime} min read</span>
                <span>•</span>
                <span>{blog.content.split(' ').length} words</span>
                <span>•</span>
                <span>{format(new Date(blog.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </header>
            
            <div ref={contentRef}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="scroll-mt-20">{children}</h1>,
                  h2: ({ children }) => <h2 className="scroll-mt-20">{children}</h2>,
                  h3: ({ children }) => <h3 className="scroll-mt-20">{children}</h3>,
                }}
              >
                {blog.content}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative", className)}
    >
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <IconTag className="h-3 w-3 mr-1" />
                  Blog Post
                </Badge>
                {blog.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-2xl font-bold leading-tight mb-3 hover:text-primary transition-colors cursor-pointer">
                {blog.title}
              </h1>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                {blog.excerpt}
              </p>

              {/* Blog Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconClock className="h-4 w-4" />
                  <span>{blog.readingTime || estimatedReadTime} min read</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconCalendar className="h-4 w-4" />
                  <span>{format(new Date(blog.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconEye className="h-4 w-4" />
                  <span>{viewCount} views</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconMessage className="h-4 w-4" />
                  <span>{blog.content.split(' ').length} words</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <IconShare className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="grid grid-cols-1 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                      className="justify-start"
                    >
                      <IconBrandTwitter className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                      className="justify-start"
                    >
                      <IconBrandLinkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('facebook')}
                      className="justify-start"
                    >
                      <IconBrandFacebook className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('copy')}
                      className="justify-start"
                    >
                      <IconLink className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onBookmark?.()
                  toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
                }}
              >
                {isBookmarked ? <IconBookmarkFilled className="h-4 w-4" /> : <IconBookmark className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onLike?.()
                  toast.success('Thanks for the feedback!')
                }}
              >
                <div className="flex items-center gap-1">
                  {isLiked ? <IconHeartFilled className="h-4 w-4 text-red-500" /> : <IconHeart className="h-4 w-4" />}
                  {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
                </div>
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isExpanded && readingProgress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Reading Progress</span>
                <span>{Math.round(readingProgress)}%</span>
              </div>
              <Progress value={readingProgress} className="h-1" />
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <AnimatePresence>
            <motion.div
              initial={{ height: isExpanded ? 'auto' : 200 }}
              animate={{ height: isExpanded ? 'auto' : 200 }}
              className="relative overflow-hidden"
            >
              <ScrollArea
                ref={contentRef}
                className={cn(
                  "w-full rounded-md",
                  isExpanded ? "h-[600px]" : "h-48"
                )}
              >
                <article className={cn(
                  "prose prose-sm max-w-none dark:prose-invert",
                  "prose-headings:font-semibold prose-headings:text-foreground",
                  "prose-p:text-muted-foreground prose-p:leading-relaxed",
                  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                  "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
                  "prose-pre:bg-muted",
                  "prose-blockquote:border-primary prose-blockquote:bg-muted/50",
                  getFontSizeClasses(fontSize),
                  getLineHeightClasses(lineHeight)
                )}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary bg-muted/50 p-4 my-4 italic">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className
                        return isInline ? (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code className="text-sm font-mono">{children}</code>
                          </pre>
                        )
                      }
                    }}
                  >
                    {blog.content}
                  </ReactMarkdown>
                </article>
              </ScrollArea>

              {/* Fade overlay for collapsed view */}
              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent" />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 sm:flex-none"
            >
              <IconEye className="h-4 w-4 mr-2" />
              {isExpanded ? 'Show Less' : 'Read Full Post'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsReadingMode(true)}
              className="flex-1 sm:flex-none"
            >
              <IconTextSize className="h-4 w-4 mr-2" />
              Reading Mode
            </Button>

            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="flex-1 sm:flex-none"
              >
                <IconEdit className="h-4 w-4 mr-2" />
                Edit Post
              </Button>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <IconDownload className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="grid grid-cols-1 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportBlog('md')}
                    className="justify-start"
                  >
                    Markdown (.md)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportBlog('html')}
                    className="justify-start"
                  >
                    HTML (.html)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(blog.content)
                      toast.success('Content copied to clipboard!')
                    }}
                    className="justify-start"
                  >
                    Copy Content
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Table of Contents for expanded view */}
          {isExpanded && tocItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-4 border-t"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className="mb-3"
              >
                Table of Contents ({tocItems.length} sections)
              </Button>
              
              <AnimatePresence>
                {showTableOfContents && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-muted/50 rounded-lg p-4"
                  >
                    <nav className="space-y-1">
                      {tocItems.map((item, index) => (
                        <button
                          key={index}
                          className={cn(
                            "block w-full text-left text-sm hover:text-primary transition-colors",
                            item.level === 1 && "font-medium",
                            item.level === 2 && "pl-4",
                            item.level >= 3 && "pl-8 text-muted-foreground"
                          )}
                          onClick={() => {
                            const element = document.getElementById(item.id)
                            element?.scrollIntoView({ behavior: 'smooth' })
                          }}
                        >
                          {item.text}
                        </button>
                      ))}
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 