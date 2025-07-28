"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { GeneratedThread, ThreadSegment } from "@/lib/thread-generator"
import {
  IconBrandTwitter,
  IconBrandLinkedin,
  IconCopy,
  IconDownload,
  IconEdit,
  IconSparkles,
  IconCheck,
  IconX,
  IconRefresh,
  IconHash,
  IconMessageCircle,
  IconArrowRight,
  IconBulb,
  IconChartBar
} from "@tabler/icons-react"

interface ThreadGeneratorProps {
  content?: string
  title?: string
  sourceType?: 'blog' | 'transcript' | 'custom'
  onThreadGenerated?: (thread: GeneratedThread) => void
}

export function ThreadGeneratorComponent({
  content: initialContent = '',
  title: initialTitle = '',
  sourceType = 'custom',
  onThreadGenerated
}: ThreadGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [platform, setPlatform] = useState<'twitter' | 'linkedin'>('twitter')
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational' | 'inspiring'>('professional')
  const [includeHashtags, setIncludeHashtags] = useState(true)
  const [includeCTA, setIncludeCTA] = useState(true)
  const [ctaText, setCtaText] = useState('')
  const [targetAudience, setTargetAudience] = useState('professionals')
  const [maxSegments, setMaxSegments] = useState(10)
  const [generatedThread, setGeneratedThread] = useState<GeneratedThread | null>(null)
  const [editingSegment, setEditingSegment] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})

  const platformConfig = {
    twitter: {
      icon: IconBrandTwitter,
      name: 'Twitter/X',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      characterLimit: 280
    },
    linkedin: {
      icon: IconBrandLinkedin,
      name: 'LinkedIn',
      color: 'text-blue-700',
      bgColor: 'bg-blue-700/10',
      borderColor: 'border-blue-700/20',
      characterLimit: 3000
    }
  }

  const toneOptions = [
    { value: 'professional', label: 'Professional', icon: IconChartBar },
    { value: 'casual', label: 'Casual', icon: IconMessageCircle },
    { value: 'educational', label: 'Educational', icon: IconBulb },
    { value: 'inspiring', label: 'Inspiring', icon: IconSparkles }
  ]

  const handleGenerateThread = async () => {
    if (!content.trim() || !title.trim()) {
      toast.error('Please provide both title and content')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title,
          platform,
          tone,
          includeHashtags,
          maxSegments,
          includeCTA,
          ctaText,
          targetAudience
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate thread')
      }

      const data = await response.json()
      setGeneratedThread(data.thread)
      onThreadGenerated?.(data.thread)
      toast.success('Thread generated successfully!')
    } catch (error) {
      console.error('Thread generation error:', error)
      toast.error('Failed to generate thread. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditSegment = (segmentId: string, newContent: string) => {
    setEditedContent(prev => ({
      ...prev,
      [segmentId]: newContent
    }))
  }

  const handleSaveEdit = (segmentId: string) => {
    if (generatedThread) {
      const updatedSegments = generatedThread.segments.map(segment =>
        segment.id === segmentId
          ? { ...segment, content: editedContent[segmentId] || segment.content, characterCount: (editedContent[segmentId] || segment.content).length }
          : segment
      )
      setGeneratedThread({
        ...generatedThread,
        segments: updatedSegments
      })
    }
    setEditingSegment(null)
  }

  const copySegmentToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  const copyFullThread = () => {
    if (!generatedThread) return
    
    const fullThread = generatedThread.segments
      .map(segment => segment.content)
      .join('\n\n---\n\n')
    
    const hashtagsText = generatedThread.hashtags.length > 0 
      ? '\n\n' + generatedThread.hashtags.map(tag => `#${tag}`).join(' ')
      : ''
    
    navigator.clipboard.writeText(fullThread + hashtagsText)
    toast.success('Full thread copied to clipboard!')
  }

  const downloadThread = () => {
    if (!generatedThread) return
    
    const content = generatedThread.segments
      .map((segment, index) => {
        const label = segment.isHook ? '[HOOK]' : segment.isCTA ? '[CTA]' : `[${index + 1}]`
        return `${label}\n${segment.content}`
      })
      .join('\n\n---\n\n')
    
    const hashtagsText = generatedThread.hashtags.length > 0 
      ? '\n\nHashtags: ' + generatedThread.hashtags.map(tag => `#${tag}`).join(' ')
      : ''
    
    const blob = new Blob([content + hashtagsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedThread.title.replace(/\s+/g, '-').toLowerCase()}-thread.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSegmentProgress = (segment: ThreadSegment): number => {
    const config = platformConfig[platform]
    return (segment.characterCount / config.characterLimit) * 100
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        variant="outline"
      >
        <IconBrandTwitter className="h-4 w-4" />
        Generate Thread
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Thread Generator</DialogTitle>
            <DialogDescription>
              Convert your content into engaging social media threads
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="settings" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="preview" disabled={!generatedThread}>
                Preview {generatedThread && `(${generatedThread.totalSegments})`}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="settings" className="space-y-6 p-4">
                {/* Platform Selection */}
                <div className="space-y-3">
                  <Label>Platform</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['twitter', 'linkedin'] as const).map((p) => {
                      const config = platformConfig[p]
                      const Icon = config.icon
                      return (
                        <Card
                          key={p}
                          className={cn(
                            "cursor-pointer transition-all",
                            platform === p && `${config.borderColor} border-2`
                          )}
                          onClick={() => setPlatform(p)}
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", config.bgColor)}>
                              <Icon className={cn("h-5 w-5", config.color)} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{config.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {config.characterLimit} char limit
                              </p>
                            </div>
                            {platform === p && (
                              <IconCheck className="h-4 w-4 text-primary" />
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Tone Selection */}
                <div className="space-y-3">
                  <Label>Tone</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {toneOptions.map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={tone === value ? "default" : "outline"}
                        className="justify-start gap-2"
                        onClick={() => setTone(value as any)}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="hashtags">Include Hashtags</Label>
                      <p className="text-xs text-muted-foreground">
                        Add relevant hashtags to your thread
                      </p>
                    </div>
                    <Switch
                      id="hashtags"
                      checked={includeHashtags}
                      onCheckedChange={setIncludeHashtags}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="cta">Include Call-to-Action</Label>
                      <p className="text-xs text-muted-foreground">
                        End with an engaging CTA
                      </p>
                    </div>
                    <Switch
                      id="cta"
                      checked={includeCTA}
                      onCheckedChange={setIncludeCTA}
                    />
                  </div>

                  {includeCTA && (
                    <div className="space-y-2">
                      <Label htmlFor="cta-text">Custom CTA Text (optional)</Label>
                      <Input
                        id="cta-text"
                        placeholder="Follow for more insights!"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      placeholder="e.g., marketers, developers, entrepreneurs"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-segments">
                      Maximum Segments: {maxSegments}
                    </Label>
                    <input
                      id="max-segments"
                      type="range"
                      min="5"
                      max="25"
                      value={maxSegments}
                      onChange={(e) => setMaxSegments(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter thread title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your blog post, transcript, or write custom content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.split(' ').filter(w => w).length} words
                  </p>
                </div>

                <Button
                  onClick={handleGenerateThread}
                  disabled={isGenerating || !content.trim() || !title.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <IconSparkles className="h-5 w-5 mr-2 animate-spin" />
                      Generating Thread...
                    </>
                  ) : (
                    <>
                      <IconSparkles className="h-5 w-5 mr-2" />
                      Generate Thread
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="preview" className="p-4">
                {generatedThread && (
                  <div className="space-y-4">
                    {/* Thread Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{generatedThread.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            {React.createElement(platformConfig[generatedThread.platform].icon, { className: "h-4 w-4" })}
                            {platformConfig[generatedThread.platform].name}
                          </span>
                          <span>•</span>
                          <span>{generatedThread.totalSegments} segments</span>
                          <span>•</span>
                          <span>~{generatedThread.estimatedReadTime} min read</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyFullThread}
                        >
                          <IconCopy className="h-4 w-4 mr-1" />
                          Copy All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadThread}
                        >
                          <IconDownload className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Hashtags */}
                    {generatedThread.hashtags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <IconHash className="h-4 w-4 text-muted-foreground" />
                        {generatedThread.hashtags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Thread Segments */}
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {generatedThread.segments.map((segment, index) => {
                          const isEditing = editingSegment === segment.id
                          const content = editedContent[segment.id] || segment.content
                          const progress = getSegmentProgress({...segment, content, characterCount: content.length})
                          
                          return (
                            <Card
                              key={segment.id}
                              className={cn(
                                "relative",
                                segment.isHook && "border-primary",
                                segment.isCTA && "border-green-500"
                              )}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {segment.isHook && (
                                      <Badge variant="default" className="text-xs">
                                        Hook
                                      </Badge>
                                    )}
                                    {segment.isCTA && (
                                      <Badge className="bg-green-500 text-xs">
                                        CTA
                                      </Badge>
                                    )}
                                    {!segment.isHook && !segment.isCTA && (
                                      <Badge variant="outline" className="text-xs">
                                        {index + 1}/{generatedThread.totalSegments}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {content.length}/{platformConfig[generatedThread.platform].characterLimit}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    {isEditing ? (
                                      <>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => handleSaveEdit(segment.id)}
                                        >
                                          <IconCheck className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => {
                                            setEditingSegment(null)
                                            delete editedContent[segment.id]
                                          }}
                                        >
                                          <IconX className="h-3 w-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => setEditingSegment(segment.id)}
                                        >
                                          <IconEdit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => copySegmentToClipboard(content)}
                                        >
                                          <IconCopy className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Progress 
                                  value={progress} 
                                  className={cn(
                                    "h-1 mt-2",
                                    progress > 90 && "bg-red-100",
                                    progress > 80 && progress <= 90 && "bg-orange-100"
                                  )}
                                />
                              </CardHeader>
                              <CardContent>
                                {isEditing ? (
                                  <Textarea
                                    value={content}
                                    onChange={(e) => handleEditSegment(segment.id, e.target.value)}
                                    rows={4}
                                    className="font-medium"
                                  />
                                ) : (
                                  <p className="whitespace-pre-wrap font-medium">
                                    {content}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
} 