"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Music2,
  ImageIcon,
  Quote,
  Layout,
  FileText,
  Sparkles,
  RefreshCw,
  Edit3,
  Check,
  X,
  Eye,
  Download,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Hash,
  Type,
  Megaphone,
  User
} from 'lucide-react'

// Platform icons mapping
const platformIcons = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2
}

// Platform colors
const platformColors = {
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-600',
  twitter: 'bg-black',
  linkedin: 'bg-blue-700',
  facebook: 'bg-blue-600',
  youtube: 'bg-red-600',
  tiktok: 'bg-black'
}

// Content type icons
const contentTypeIcons = {
  carousel: Layout,
  quote: Quote,
  single: ImageIcon,
  thread: FileText
}

interface PostSuggestion {
  id: string
  content_type: 'carousel' | 'quote' | 'single' | 'thread'
  title: string
  description?: string
  images: Array<{
    id: string
    url: string
    position: number
  }>
  copy_variants: Record<string, {
    caption: string
    hashtags: string[]
    cta?: string
    title?: string
    description?: string
  }>
  eligible_platforms: string[]
  status: string
  persona_used: boolean
}

interface PostsGeneratorProps {
  projectId: string
  projectTitle: string
  contentAnalysis?: any
  transcript?: string
  personaId?: string
}

export function PostsGenerator({
  projectId,
  projectTitle,
  contentAnalysis,
  transcript,
  personaId
}: PostsGeneratorProps) {
  const [suggestions, setSuggestions] = useState<PostSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [selectedSuggestion, setSelectedSuggestion] = useState<PostSuggestion | null>(null)
  const [editingCopy, setEditingCopy] = useState<{
    suggestionId: string
    platform: string
    copy: any
  } | null>(null)
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(['carousel', 'quote', 'single'])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'twitter', 'linkedin'])

  // Load existing suggestions on mount
  useEffect(() => {
    loadSuggestions()
  }, [projectId])

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`/api/posts/suggestions?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  const generateSuggestions = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const response = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectTitle,
          contentAnalysis,
          transcript: transcript?.substring(0, 2000), // Limit transcript size
          personaId,
          contentTypes: selectedContentTypes,
          platforms: selectedPlatforms
        })
      })

      if (!response.ok) throw new Error('Failed to generate suggestions')

      const data = await response.json()
      
      // Poll for progress
      if (data.jobId) {
        pollGenerationProgress(data.jobId)
      }

      // Reload suggestions
      await loadSuggestions()
      
      toast.success('Post suggestions generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate suggestions')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(100)
    }
  }

  const pollGenerationProgress = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/posts/job-status?jobId=${jobId}`)
        if (response.ok) {
          const data = await response.json()
          setGenerationProgress(data.progress || 0)
          
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval)
            await loadSuggestions()
          }
        }
      } catch (error) {
        console.error('Failed to poll progress:', error)
        clearInterval(interval)
      }
    }, 1000)
  }

  const regenerateSuggestion = async (suggestionId: string, feedback?: string) => {
    try {
      const response = await fetch(`/api/posts/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, feedback })
      })

      if (!response.ok) throw new Error('Failed to regenerate')

      await loadSuggestions()
      toast.success('Suggestion regenerated!')
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error('Failed to regenerate suggestion')
    }
  }

  const saveCopyEdits = async () => {
    if (!editingCopy) return

    try {
      const response = await fetch(`/api/posts/update-copy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: editingCopy.suggestionId,
          platform: editingCopy.platform,
          updates: editingCopy.copy
        })
      })

      if (!response.ok) throw new Error('Failed to save edits')

      await loadSuggestions()
      setEditingCopy(null)
      toast.success('Copy updated!')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save edits')
    }
  }

  const approveSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/posts/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      })

      if (!response.ok) throw new Error('Failed to approve')

      await loadSuggestions()
      toast.success('Post approved and moved to staging!')
    } catch (error) {
      console.error('Approval error:', error)
      toast.error('Failed to approve suggestion')
    }
  }

  const SuggestionCard = ({ suggestion }: { suggestion: PostSuggestion }) => {
    const TypeIcon = contentTypeIcons[suggestion.content_type]
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
            </div>
            <Badge variant={
              suggestion.status === 'ready' ? 'default' :
              suggestion.status === 'approved' ? 'secondary' :
              suggestion.status === 'generating' ? 'outline' :
              'destructive'
            }>
              {suggestion.status}
            </Badge>
          </div>
          {suggestion.description && (
            <CardDescription className="mt-2">
              {suggestion.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            {suggestion.images.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {suggestion.images.slice(0, 3).map((image, idx) => (
                  <div key={image.id} className="relative flex-shrink-0">
                    <img
                      src={image.url}
                      alt={`Slide ${idx + 1}`}
                      className="w-32 h-40 object-cover rounded-lg"
                    />
                    {suggestion.images.length > 3 && idx === 2 && (
                      <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{suggestion.images.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            {/* Persona indicator */}
            {suggestion.persona_used && (
              <Badge className="absolute top-2 right-2" variant="secondary">
                <User className="h-3 w-3 mr-1" />
                Persona
              </Badge>
            )}
          </div>

          {/* Platform eligibility */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Eligible for:</span>
            <div className="flex gap-1">
              {suggestion.eligible_platforms.map(platform => {
                const Icon = platformIcons[platform as keyof typeof platformIcons]
                return Icon ? (
                  <div
                    key={platform}
                    className={`p-1.5 rounded-md ${platformColors[platform as keyof typeof platformColors]}`}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                ) : null
              })}
            </div>
          </div>

          {/* Sample copy */}
          {suggestion.copy_variants.instagram && (
            <div className="space-y-2">
              <Label className="text-xs">Instagram Caption Preview</Label>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {suggestion.copy_variants.instagram.caption}
              </p>
              <div className="flex flex-wrap gap-1">
                {suggestion.copy_variants.instagram.hashtags.slice(0, 5).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedSuggestion(suggestion)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => regenerateSuggestion(suggestion.id)}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={() => approveSuggestion(suggestion.id)}
            disabled={suggestion.status === 'approved'}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Posts Generator</h2>
          <p className="text-muted-foreground">
            Create engaging social media content from your video
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Posts
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Post Suggestions</DialogTitle>
              <DialogDescription>
                Select content types and platforms to generate tailored posts
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Content Types */}
              <div className="space-y-2">
                <Label>Content Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(contentTypeIcons).map(([type, Icon]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type}
                        checked={selectedContentTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContentTypes([...selectedContentTypes, type])
                          } else {
                            setSelectedContentTypes(selectedContentTypes.filter(t => t !== type))
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={type} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <Label>Target Platforms</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(platformIcons).map(([platform, Icon]) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={platform}
                        checked={selectedPlatforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform])
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={platform} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persona */}
              {personaId && (
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    Your persona will be used in generated images
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={generateSuggestions}
                disabled={isGenerating || selectedContentTypes.length === 0 || selectedPlatforms.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating suggestions...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions Grid */}
      {suggestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.map(suggestion => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Generate AI-powered social media posts from your video content
            </p>
            <Button onClick={generateSuggestions} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate First Posts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail View Dialog */}
      {selectedSuggestion && (
        <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSuggestion.title}</DialogTitle>
              <DialogDescription>
                Review and edit your post before staging
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="preview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="copy">Copy</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                {/* Image carousel */}
                {selectedSuggestion.images.length > 0 && (
                  <div className="relative">
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {selectedSuggestion.images.map((image, idx) => (
                          <div key={image.id} className="relative flex-shrink-0">
                            <img
                              src={image.url}
                              alt={`Slide ${idx + 1}`}
                              className="w-64 h-80 object-cover rounded-lg"
                            />
                            <Badge className="absolute top-2 left-2">
                              {idx + 1} / {selectedSuggestion.images.length}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Platform previews */}
                <div className="grid gap-4">
                  {Object.entries(selectedSuggestion.copy_variants).map(([platform, copy]) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons]
                    return Icon ? (
                      <Card key={platform}>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-md ${platformColors[platform as keyof typeof platformColors]}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <CardTitle className="text-base">
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm">{copy.caption}</p>
                          <div className="flex flex-wrap gap-1">
                            {copy.hashtags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          {copy.cta && (
                            <div className="pt-2">
                              <Badge variant="secondary">
                                <Megaphone className="h-3 w-3 mr-1" />
                                {copy.cta}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : null
                  })}
                </div>
              </TabsContent>

              <TabsContent value="copy" className="space-y-4">
                {Object.entries(selectedSuggestion.copy_variants).map(([platform, copy]) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons]
                  const isEditing = editingCopy?.suggestionId === selectedSuggestion.id && 
                                   editingCopy?.platform === platform

                  return Icon ? (
                    <Card key={platform}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <CardTitle className="text-base">{platform}</CardTitle>
                          </div>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveCopyEdits}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingCopy(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCopy({
                                suggestionId: selectedSuggestion.id,
                                platform,
                                copy: { ...copy }
                              })}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isEditing ? (
                          <>
                            <div className="space-y-2">
                              <Label>Caption</Label>
                              <Textarea
                                value={editingCopy.copy.caption}
                                onChange={(e) => setEditingCopy({
                                  ...editingCopy,
                                  copy: { ...editingCopy.copy, caption: e.target.value }
                                })}
                                rows={4}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Hashtags (comma separated)</Label>
                              <Input
                                value={editingCopy.copy.hashtags.join(', ')}
                                onChange={(e) => setEditingCopy({
                                  ...editingCopy,
                                  copy: {
                                    ...editingCopy.copy,
                                    hashtags: e.target.value.split(',').map(t => t.trim())
                                  }
                                })}
                              />
                            </div>
                            {editingCopy.copy.cta !== undefined && (
                              <div className="space-y-2">
                                <Label>Call to Action</Label>
                                <Input
                                  value={editingCopy.copy.cta}
                                  onChange={(e) => setEditingCopy({
                                    ...editingCopy,
                                    copy: { ...editingCopy.copy, cta: e.target.value }
                                  })}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <Label className="text-xs text-muted-foreground">Caption</Label>
                              <p className="text-sm mt-1">{copy.caption}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Hashtags</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {copy.hashtags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {copy.cta && (
                              <div>
                                <Label className="text-xs text-muted-foreground">CTA</Label>
                                <p className="text-sm mt-1">{copy.cta}</p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ) : null
                })}
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedSuggestion.images.map((image, idx) => (
                    <div key={image.id} className="space-y-2">
                      <img
                        src={image.url}
                        alt={`Image ${idx + 1}`}
                        className="w-full rounded-lg"
                      />
                      <div className="flex justify-between">
                        <Badge variant="outline">Slide {idx + 1}</Badge>
                        <Button size="sm" variant="outline" asChild>
                          <a href={image.url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
                Close
              </Button>
              <Button onClick={() => approveSuggestion(selectedSuggestion.id)}>
                <Send className="h-4 w-4 mr-2" />
                Approve & Stage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}