"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { VideoChapter } from "@/lib/chapter-generator"
import {
  IconClock,
  IconSparkles,
  IconCopy,
  IconEdit,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconBrandYoutube,
  IconHash,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconDownload,
  IconRefresh,
  IconInfoCircle
} from "@tabler/icons-react"
import { ChapterGenerator } from "@/lib/chapter-generator"

interface VideoChaptersProps {
  projectId: string
  videoDuration: number
  hasTranscript: boolean
  className?: string
}

export function VideoChapters({
  projectId,
  videoDuration,
  hasTranscript,
  className
}: VideoChaptersProps) {
  const [chapters, setChapters] = useState<VideoChapter[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<Record<string, { title: string; description: string }>>({})
  
  // Generation settings
  const [style, setStyle] = useState<'descriptive' | 'concise' | 'engaging' | 'keyword-focused'>('engaging')
  const [minDuration, setMinDuration] = useState(30)
  const [maxChapters, setMaxChapters] = useState(15)
  const [includeIntro, setIncludeIntro] = useState(true)
  const [platform, setPlatform] = useState<'youtube' | 'vimeo' | 'generic'>('youtube')
  
  // Validation state
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] })

  // Load existing chapters
  useEffect(() => {
    loadChapters()
  }, [projectId])

  const loadChapters = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/generate-chapters?projectId=${projectId}`)
      
      if (response.ok) {
        const data = await response.json()
        setChapters(data.chapters || [])
        if (data.chapters && data.chapters.length > 0) {
          validateChapters(data.chapters)
        }
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateChapters = (chapterList: VideoChapter[]) => {
    const result = ChapterGenerator.validateChapters(chapterList, platform)
    setValidation(result)
  }

  const handleGenerateChapters = async () => {
    if (!hasTranscript) {
      toast.error('Please generate a transcript first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          style,
          minChapterDuration: minDuration,
          maxChapters,
          includeIntro,
          targetPlatform: platform
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate chapters')
      }

      const data = await response.json()
      setChapters(data.chapters)
      setValidation(data.validation)
      toast.success(`Generated ${data.totalChapters} chapters successfully!`)
    } catch (error) {
      console.error('Chapter generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate chapters')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditChapter = (chapterId: string, field: 'title' | 'description', value: string) => {
    setEditedData(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        [field]: value
      }
    }))
  }

  const handleSaveEdit = (chapterId: string) => {
    const edited = editedData[chapterId]
    if (!edited) return

    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId
        ? { ...chapter, title: edited.title || chapter.title, description: edited.description || chapter.description }
        : chapter
    ))
    
    setEditingChapter(null)
    delete editedData[chapterId]
    
    // Revalidate after edit
    validateChapters(chapters)
  }

  const handleCancelEdit = (chapterId: string) => {
    setEditingChapter(null)
    delete editedData[chapterId]
  }

  const handleDeleteChapter = (chapterId: string) => {
    const updatedChapters = chapters.filter(ch => ch.id !== chapterId)
    setChapters(updatedChapters)
    validateChapters(updatedChapters)
  }

  const handleAddChapter = () => {
    const newChapter: VideoChapter = {
      id: `chapter_${Date.now()}`,
      title: 'New Chapter',
      description: '',
      timestamp: 0,
      formattedTimestamp: '00:00',
      keywords: [],
      order: chapters.length
    }
    
    const updatedChapters = [...chapters, newChapter].sort((a, b) => a.timestamp - b.timestamp)
    setChapters(updatedChapters)
    setEditingChapter(newChapter.id)
    setEditedData(prev => ({
      ...prev,
      [newChapter.id]: { title: newChapter.title, description: newChapter.description }
    }))
  }

  const copyYouTubeDescription = () => {
    const description = ChapterGenerator.generateYouTubeDescription(chapters)
    navigator.clipboard.writeText(description)
    toast.success('YouTube description copied to clipboard!')
  }

  const copyChapterList = () => {
    const chapterList = chapters
      .map(ch => `${ch.formattedTimestamp} - ${ch.title}`)
      .join('\n')
    navigator.clipboard.writeText(chapterList)
    toast.success('Chapter list copied to clipboard!')
  }

  const downloadChapters = () => {
    const content = {
      chapters: chapters,
      metadata: {
        projectId,
        videoDuration,
        platform,
        generatedAt: new Date().toISOString()
      }
    }
    
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `video-chapters-${projectId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const styleOptions = [
    { value: 'descriptive', label: 'Descriptive', description: 'Clear, explanatory titles' },
    { value: 'concise', label: 'Concise', description: 'Short and punchy' },
    { value: 'engaging', label: 'Engaging', description: 'Compelling and clickable' },
    { value: 'keyword-focused', label: 'SEO Optimized', description: 'Keyword-rich for search' }
  ]

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded mt-2" />
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="h-5 w-5" />
              Video Chapters
            </CardTitle>
            <CardDescription>
              {chapters.length > 0
                ? `${chapters.length} chapters • ${ChapterGenerator.formatTimestamp(videoDuration)}`
                : 'Generate timestamps for easy navigation'}
            </CardDescription>
          </div>
          {chapters.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyChapterList}
              >
                <IconCopy className="h-4 w-4 mr-1" />
                Copy List
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadChapters}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!hasTranscript ? (
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Transcript Required</AlertTitle>
            <AlertDescription>
              Generate a transcript first to create video chapters
            </AlertDescription>
          </Alert>
        ) : chapters.length === 0 ? (
          <div className="space-y-4">
            {/* Generation Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={style} onValueChange={(v: any) => setStyle(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">
                      <div className="flex items-center gap-2">
                        <IconBrandYoutube className="h-4 w-4 text-red-600" />
                        YouTube
                      </div>
                    </SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Min Chapter Duration: {minDuration}s</Label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={minDuration}
                  onChange={(e) => setMinDuration(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Chapters: {maxChapters}</Label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={maxChapters}
                  onChange={(e) => setMaxChapters(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <Label htmlFor="intro">Include Introduction</Label>
                <p className="text-xs text-muted-foreground">
                  Start with an intro chapter at 00:00
                </p>
              </div>
              <Switch
                id="intro"
                checked={includeIntro}
                onCheckedChange={setIncludeIntro}
              />
            </div>

            <Button
              onClick={handleGenerateChapters}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <IconSparkles className="h-5 w-5 mr-2 animate-spin" />
                  Generating Chapters...
                </>
              ) : (
                <>
                  <IconSparkles className="h-5 w-5 mr-2" />
                  Generate Chapters
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Validation Status */}
            {!validation.valid && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Chapter Validation Failed</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {validation.errors.map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Platform Info */}
            {platform === 'youtube' && (
              <Alert>
                <IconInfoCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>YouTube Requirements:</strong> First chapter at 00:00, minimum 3 chapters, 
                  at least 10 seconds between chapters
                </AlertDescription>
              </Alert>
            )}

            {/* Chapter List */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {chapters.map((chapter, index) => {
                  const isEditing = editingChapter === chapter.id
                  const edited = editedData[chapter.id] || { title: chapter.title, description: chapter.description }
                  
                  return (
                    <Card
                      key={chapter.id}
                      className={cn(
                        "transition-all",
                        isEditing && "ring-2 ring-primary"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="font-mono">
                              {chapter.formattedTimestamp}
                            </Badge>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            {isEditing ? (
                              <>
                                <Input
                                  value={edited.title}
                                  onChange={(e) => handleEditChapter(chapter.id, 'title', e.target.value)}
                                  placeholder="Chapter title"
                                  className="font-semibold"
                                />
                                <Textarea
                                  value={edited.description}
                                  onChange={(e) => handleEditChapter(chapter.id, 'description', e.target.value)}
                                  placeholder="Chapter description (optional)"
                                  rows={2}
                                  className="text-sm"
                                />
                                {chapter.keywords.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <IconHash className="h-3 w-3 text-muted-foreground" />
                                    {chapter.keywords.map((keyword, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <h4 className="font-semibold flex items-center gap-2">
                                  {index === 0 && (
                                    <Badge className="text-xs">Start</Badge>
                                  )}
                                  {chapter.title}
                                </h4>
                                {chapter.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {chapter.description}
                                  </p>
                                )}
                                {chapter.keywords.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <IconHash className="h-3 w-3 text-muted-foreground" />
                                    {chapter.keywords.map((keyword, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0 flex gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleSaveEdit(chapter.id)}
                                >
                                  <IconCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleCancelEdit(chapter.id)}
                                >
                                  <IconX className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingChapter(chapter.id)
                                    setEditedData(prev => ({
                                      ...prev,
                                      [chapter.id]: { title: chapter.title, description: chapter.description }
                                    }))
                                  }}
                                >
                                  <IconEdit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteChapter(chapter.id)}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddChapter}
                >
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Chapter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateChapters}
                >
                  <IconRefresh className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
              </div>
              
              <Button
                size="sm"
                onClick={copyYouTubeDescription}
                disabled={!validation.valid}
              >
                <IconBrandYoutube className="h-4 w-4 mr-1" />
                Copy for YouTube
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 