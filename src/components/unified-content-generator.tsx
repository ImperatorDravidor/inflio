'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  IconWand,
  IconPhoto,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandFacebook,
  IconArticle,
  IconUser,
  IconVideo,
  IconSparkles,
  IconLoader2,
  IconCheck,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconDownload,
  IconEye,
  IconEdit,
  IconCopy,
} from '@tabler/icons-react'
import { ThumbnailCreator } from './thumbnail-creator'
import { UnifiedContentSuggestion, VideoSnippet, ContentPersona } from '@/lib/unified-content-service'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface UnifiedContentGeneratorProps {
  projectId: string
  projectTitle: string
  projectVideoUrl?: string
  contentAnalysis?: any
  onContentGenerated?: (content: any) => void
}

export function UnifiedContentGenerator({
  projectId,
  projectTitle,
  projectVideoUrl,
  contentAnalysis,
  onContentGenerated
}: UnifiedContentGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'thumbnail' | 'social' | 'blog'>('all')

  // States
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<UnifiedContentSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  
  // Persona states
  const [usePersona, setUsePersona] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<string>('')
  const [personas, setPersonas] = useState<ContentPersona[]>([])
  const [personaPhotos, setPersonaPhotos] = useState<string[]>([])
  
  // Video snippet states
  const [useVideoSnippets, setUseVideoSnippets] = useState(false)
  const [videoSnippets, setVideoSnippets] = useState<VideoSnippet[]>([])
  const [selectedSnippets, setSelectedSnippets] = useState<string[]>([])
  
  // Customization states
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({})
  const [styles, setStyles] = useState<Record<string, string>>({})
  const [platforms, setPlatforms] = useState<string[]>(['youtube', 'instagram', 'linkedin'])
  
  // Results
  const [generatedContent, setGeneratedContent] = useState<any>({})

  // Load personas and suggestions on mount
  useEffect(() => {
    if (open) {
      loadPersonas()
      loadAISuggestions()
    }
  }, [open])

  const loadPersonas = async () => {
    try {
      // Load from localStorage (for now)
      const storedPersonas = localStorage.getItem('inflio_user_personas')
      if (storedPersonas) {
        const parsedPersonas = JSON.parse(storedPersonas)
        setPersonas(parsedPersonas)
      }
    } catch (error) {
      console.error('Error loading personas:', error)
    }
  }

  const loadAISuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch('/api/generate-unified-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          contentAnalysis
        })
      })

      if (!response.ok) throw new Error('Failed to load suggestions')
      
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      
      // Auto-select high relevance suggestions
      const autoSelected = data.suggestions
        .filter((s: UnifiedContentSuggestion) => s.relevanceScore >= 8)
        .map((s: UnifiedContentSuggestion) => s.id)
      setSelectedSuggestions(autoSelected)
      
    } catch (error) {
      console.error('Error loading suggestions:', error)
      // Use fallback suggestions
      generateFallbackSuggestions()
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const generateFallbackSuggestions = () => {
    const fallbacks: UnifiedContentSuggestion[] = [
      {
        id: 'thumb-1',
        type: 'thumbnail',
        prompt: `YouTube thumbnail for "${projectTitle}"`,
        enhancedPrompt: `High-CTR YouTube thumbnail featuring bold text "${projectTitle}", emotional expression, bright colors, 1280x720`,
        style: 'modern',
        platform: 'youtube',
        usePersona: true,
        useVideoSnippets: false,
        relevanceScore: 9
      },
      {
        id: 'social-1',
        type: 'social',
        prompt: `Instagram carousel about ${projectTitle}`,
        enhancedPrompt: `3-slide educational carousel about ${projectTitle}, consistent branding, engaging visuals`,
        style: 'modern',
        platform: 'instagram',
        usePersona: false,
        useVideoSnippets: true,
        relevanceScore: 8
      },
      {
        id: 'social-2',
        type: 'social',
        prompt: `LinkedIn post graphic for ${projectTitle}`,
        enhancedPrompt: `Professional LinkedIn graphic about ${projectTitle}, corporate design, data visualization`,
        style: 'corporate',
        platform: 'linkedin',
        usePersona: false,
        useVideoSnippets: false,
        relevanceScore: 7
      },
      {
        id: 'blog-1',
        type: 'blog',
        prompt: `Blog featured image for ${projectTitle}`,
        enhancedPrompt: `Hero image for blog post about ${projectTitle}, 1200x800, professional quality`,
        style: 'professional',
        platform: 'blog',
        usePersona: false,
        useVideoSnippets: true,
        relevanceScore: 8
      }
    ]
    setSuggestions(fallbacks)
  }

  const extractVideoSnippets = async () => {
    if (!projectVideoUrl) return
    
    setLoading(true)
    try {
      // Extract 5 key moments from video
      const video = document.createElement('video')
      video.src = projectVideoUrl
      video.crossOrigin = 'anonymous'
      
      const snippets: VideoSnippet[] = []
      const duration = video.duration
      const intervals = [0.1, 0.3, 0.5, 0.7, 0.9]
      
      for (let i = 0; i < intervals.length; i++) {
        const timestamp = Math.floor(duration * intervals[i])
        video.currentTime = timestamp
        
        await new Promise(resolve => {
          video.onseeked = async () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(video, 0, 0)
            
            snippets.push({
              id: `snippet-${i}`,
              timestamp,
              thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
              description: `Key moment at ${timestamp}s`
            })
            resolve(true)
          }
        })
      }
      
      setVideoSnippets(snippets)
      toast.success('Video snippets extracted successfully')
    } catch (error) {
      console.error('Error extracting video snippets:', error)
      toast.error('Failed to extract video snippets')
    } finally {
      setLoading(false)
    }
  }

  const generateAllContent = async () => {
    setLoading(true)
    const results: any = {}
    
    try {
      const selectedSuggs = suggestions.filter(s => selectedSuggestions.includes(s.id))
      
      // Generate thumbnails
      const thumbnailSuggs = selectedSuggs.filter(s => s.type === 'thumbnail')
      if (thumbnailSuggs.length > 0) {
        const thumbnailPrompt = customPrompts['thumbnail'] || thumbnailSuggs[0].enhancedPrompt
        
        const response = await fetch('/api/generate-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            prompt: thumbnailPrompt,
            usePersona: usePersona && thumbnailSuggs[0].usePersona,
            personaPhotos: usePersona ? personaPhotos : [],
            useVideoSnippets: useVideoSnippets && thumbnailSuggs[0].useVideoSnippets,
            videoSnippets: useVideoSnippets ? videoSnippets.filter(s => selectedSnippets.includes(s.id)) : [],
            style: styles['thumbnail'] || thumbnailSuggs[0].style,
            projectContext: {
              title: projectTitle,
              topics: contentAnalysis?.topics || [],
              keywords: contentAnalysis?.keywords || [],
              summary: contentAnalysis?.summary || ''
            }
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          results.thumbnail = data
        }
      }
      
      // Generate social graphics
      const socialSuggs = selectedSuggs.filter(s => s.type === 'social')
      if (socialSuggs.length > 0) {
        const socialResults = []
        
        for (const sugg of socialSuggs) {
          const response = await fetch('/api/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              prompt: customPrompts[sugg.id] || sugg.enhancedPrompt,
              imageType: sugg.platform === 'instagram' ? 'carousel' : 'social',
              platforms: [sugg.platform || 'instagram'],
              usePersona: usePersona && sugg.usePersona,
              personaPhotos: usePersona ? personaPhotos : [],
              useVideoSnippets: useVideoSnippets && sugg.useVideoSnippets,
              videoSnippets: useVideoSnippets ? videoSnippets.filter(s => selectedSnippets.includes(s.id)) : [],
              style: styles[sugg.id] || sugg.style,
              suggestionId: sugg.id
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            socialResults.push({
              ...data,
              platform: sugg.platform,
              suggestionId: sugg.id
            })
          }
        }
        
        results.socialGraphics = socialResults
      }
      
      // Generate blog content
      const blogSuggs = selectedSuggs.filter(s => s.type === 'blog')
      if (blogSuggs.length > 0) {
        const response = await fetch('/api/generate-blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            enhancedContext: {
              contentAnalysis,
              unifiedPrompt: customPrompts['blog'] || blogSuggs[0].enhancedPrompt,
              includeVideoMoments: useVideoSnippets,
              selectedMoments: videoSnippets
                .filter(s => selectedSnippets.includes(s.id))
                .map(s => ({ timestamp: s.timestamp, description: s.description }))
            }
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          results.blog = data
        }
      }
      
      setGeneratedContent(results)
      toast.success('Content package generated successfully!')
      
      if (onContentGenerated) {
        onContentGenerated(results)
      }
      
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content package')
    } finally {
      setLoading(false)
    }
  }

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  const renderSuggestionCard = (suggestion: UnifiedContentSuggestion) => {
    const isSelected = selectedSuggestions.includes(suggestion.id)
    const Icon = suggestion.type === 'thumbnail' ? IconPhoto : 
                 suggestion.type === 'social' ? IconBrandInstagram :
                 IconArticle

    return (
      <Card
        key={suggestion.id}
        className={cn(
          "cursor-pointer transition-all",
          isSelected && "border-primary ring-2 ring-primary/20"
        )}
        onClick={() => toggleSuggestion(suggestion.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{suggestion.type}</Badge>
              {suggestion.platform && (
                <Badge variant="secondary">{suggestion.platform}</Badge>
              )}
            </div>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSuggestion(suggestion.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <p className="text-sm font-medium mb-1">{suggestion.prompt}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.enhancedPrompt}</p>
          
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              <IconSparkles className="h-3 w-3" />
              <span className="text-xs">{suggestion.relevanceScore}/10</span>
            </div>
            {suggestion.usePersona && (
              <Badge variant="outline" className="text-xs">
                <IconUser className="h-3 w-3 mr-1" />
                Persona
              </Badge>
            )}
            {suggestion.useVideoSnippets && (
              <Badge variant="outline" className="text-xs">
                <IconVideo className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
          </div>
          
          {isSelected && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Customize prompt..."
                value={customPrompts[suggestion.id] || ''}
                onChange={(e) => setCustomPrompts(prev => ({
                  ...prev,
                  [suggestion.id]: e.target.value
                }))}
                onClick={(e) => e.stopPropagation()}
                className="text-xs h-16"
              />
              <Select
                value={styles[suggestion.id] || suggestion.style}
                onValueChange={(value) => setStyles(prev => ({
                  ...prev,
                  [suggestion.id]: value
                }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2"
        variant="default"
      >
        <IconWand className="h-4 w-4" />
        Generate Content Package
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Unified Content Generator</DialogTitle>
            <DialogDescription>
              Create a complete content package with AI-powered suggestions
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all" className="gap-2">
                <IconSparkles className="h-4 w-4" />
                All Content
              </TabsTrigger>
              <TabsTrigger value="thumbnail" className="gap-2">
                <IconPhoto className="h-4 w-4" />
                Thumbnail
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <IconBrandInstagram className="h-4 w-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="blog" className="gap-2">
                <IconArticle className="h-4 w-4" />
                Blog
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-6">
              {/* AI Suggestions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">AI Content Suggestions</h3>
                    <p className="text-sm text-muted-foreground">
                      Pre-generated suggestions based on your video analysis
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAISuggestions}
                    disabled={loadingSuggestions}
                  >
                    {loadingSuggestions ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconRefresh className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    {suggestions.map(renderSuggestionCard)}
                  </div>
                </ScrollArea>
              </div>

              {/* Global Options */}
              <div className="grid grid-cols-2 gap-6">
                {/* Persona Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Persona Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use-persona">Use Persona</Label>
                      <Checkbox
                        id="use-persona"
                        checked={usePersona}
                        onCheckedChange={(checked) => setUsePersona(checked as boolean)}
                      />
                    </div>
                    
                    {usePersona && (
                      <>
                        <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select persona" />
                          </SelectTrigger>
                          <SelectContent>
                            {personas.map(persona => (
                              <SelectItem key={persona.id} value={persona.id}>
                                {persona.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="upload">
                              <IconPlus className="h-4 w-4 mr-2 inline" />
                              Upload Photos
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {selectedPersona === 'upload' && (
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                files.forEach(file => {
                                  const reader = new FileReader()
                                  reader.onload = (event) => {
                                    setPersonaPhotos(prev => [...prev, event.target?.result as string])
                                  }
                                  reader.readAsDataURL(file)
                                })
                              }}
                            />
                            <div className="flex gap-2 flex-wrap">
                              {personaPhotos.map((photo, idx) => (
                                <div key={idx} className="relative w-16 h-16">
                                  <img 
                                    src={photo} 
                                    alt={`Persona photo ${idx + 1}`}
                                    className="w-full h-full object-cover rounded" 
                                  />
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6"
                                    onClick={() => setPersonaPhotos(prev => prev.filter((_, i) => i !== idx))}
                                  >
                                    <IconTrash className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Video Snippets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Video Snippets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use-video">Use Video Moments</Label>
                      <Checkbox
                        id="use-video"
                        checked={useVideoSnippets}
                        onCheckedChange={(checked) => setUseVideoSnippets(checked as boolean)}
                      />
                    </div>
                    
                    {useVideoSnippets && (
                      <>
                        {videoSnippets.length === 0 ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={extractVideoSnippets}
                            disabled={loading || !projectVideoUrl}
                          >
                            {loading ? (
                              <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <IconVideo className="h-4 w-4 mr-2" />
                            )}
                            Extract Key Moments
                          </Button>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {videoSnippets.map(snippet => (
                              <div
                                key={snippet.id}
                                className={cn(
                                  "relative cursor-pointer rounded overflow-hidden border-2",
                                  selectedSnippets.includes(snippet.id) && "border-primary"
                                )}
                                onClick={() => {
                                  setSelectedSnippets(prev =>
                                    prev.includes(snippet.id)
                                      ? prev.filter(s => s !== snippet.id)
                                      : [...prev, snippet.id]
                                  )
                                }}
                              >
                                <img
                                  src={snippet.thumbnailUrl}
                                  alt={`Video moment at ${snippet.timestamp}s`}
                                  className="w-full aspect-video object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                                  {snippet.timestamp}s
                                </div>
                                {selectedSnippets.includes(snippet.id) && (
                                  <div className="absolute top-1 right-1">
                                    <IconCheck className="h-4 w-4 text-white bg-primary rounded-full p-0.5" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Generate Button */}
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground">
                  {selectedSuggestions.length} items selected
                </div>
                <Button
                  onClick={generateAllContent}
                  disabled={loading || selectedSuggestions.length === 0}
                  size="lg"
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconSparkles className="h-4 w-4" />
                      Generate All Content
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Individual tabs for specific content types */}
            <TabsContent value="thumbnail">
              <ThumbnailCreator
                projectId={projectId}
                projectTitle={projectTitle}
                projectVideoUrl={projectVideoUrl}
                contentAnalysis={contentAnalysis}
                currentThumbnail=""
                onThumbnailUpdate={() => {}}
              />
            </TabsContent>

            <TabsContent value="social">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Use the "All Content" tab to generate social graphics with AI suggestions
                </p>
              </div>
            </TabsContent>

            <TabsContent value="blog">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Use the "All Content" tab to generate blog content with AI suggestions
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
} 