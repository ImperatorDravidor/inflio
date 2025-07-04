'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  IconX,
  IconUpload,
  IconDeviceFloppy,
  IconExternalLink,
  IconAlertCircle,
  IconChevronRight,
} from '@tabler/icons-react'
import { ThumbnailCreator } from './thumbnail-creator'
import { UnifiedContentSuggestion, VideoSnippet, ContentPersona } from '@/lib/unified-content-service'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface UnifiedContentGeneratorProps {
  projectId: string
  projectTitle: string
  projectVideoUrl?: string
  contentAnalysis?: any
  onContentGenerated?: (content: any) => void
}

interface GenerationProgress {
  total: number
  completed: number
  current: string
  status: 'idle' | 'generating' | 'completed' | 'error'
  errors: string[]
}

interface GeneratedItem {
  id: string
  type: 'thumbnail' | 'social' | 'blog'
  platform?: string
  content: any
  preview?: string
  status: 'success' | 'error'
  error?: string
}

export function UnifiedContentGenerator({
  projectId,
  projectTitle,
  projectVideoUrl,
  contentAnalysis,
  onContentGenerated
}: UnifiedContentGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'settings' | 'results'>('suggestions')
  const videoRef = useRef<HTMLVideoElement>(null)

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
  const [newPersonaName, setNewPersonaName] = useState('')
  const [newPersonaDescription, setNewPersonaDescription] = useState('')
  const [showPersonaManager, setShowPersonaManager] = useState(false)
  
  // Video snippet states
  const [useVideoSnippets, setUseVideoSnippets] = useState(false)
  const [videoSnippets, setVideoSnippets] = useState<VideoSnippet[]>([])
  const [selectedSnippets, setSelectedSnippets] = useState<string[]>([])
  const [extractingSnippets, setExtractingSnippets] = useState(false)
  const [manualTimestamp, setManualTimestamp] = useState('')
  
  // Customization states
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({})
  const [styles, setStyles] = useState<Record<string, string>>({})
  const [platforms, setPlatforms] = useState<string[]>(['youtube', 'instagram', 'linkedin'])
  
  // Generation progress
  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    completed: 0,
    current: '',
    status: 'idle',
    errors: []
  })
  
  // Results
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([])
  const [selectedForExport, setSelectedForExport] = useState<string[]>([])

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

  const savePersona = () => {
    if (!newPersonaName || personaPhotos.length === 0) {
      toast.error('Please add a name and at least one photo')
      return
    }

    const newPersona: ContentPersona = {
      id: `persona-${Date.now()}`,
      name: newPersonaName,
      description: newPersonaDescription || '',
      photos: personaPhotos.map((photo, idx) => ({
        id: `photo-${idx}`,
        url: photo,
        name: `${newPersonaName} photo ${idx + 1}`
      })),
      style: 'professional',
      promptTemplate: `${newPersonaName} in professional setting`,
      keywords: []
    }

    const updatedPersonas = [...personas, newPersona]
    setPersonas(updatedPersonas)
    localStorage.setItem('inflio_user_personas', JSON.stringify(updatedPersonas))
    
    setSelectedPersona(newPersona.id)
    setNewPersonaName('')
    setNewPersonaDescription('')
    setPersonaPhotos([])
    setShowPersonaManager(false)
    toast.success('Persona saved successfully')
  }

  const deletePersona = (id: string) => {
    const updatedPersonas = personas.filter(p => p.id !== id)
    setPersonas(updatedPersonas)
    localStorage.setItem('inflio_user_personas', JSON.stringify(updatedPersonas))
    
    if (selectedPersona === id) {
      setSelectedPersona('')
    }
    toast.success('Persona deleted')
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
    
    setExtractingSnippets(true)
    try {
      const video = videoRef.current || document.createElement('video')
      video.src = projectVideoUrl
      video.crossOrigin = 'anonymous'
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve
      })
      
      const snippets: VideoSnippet[] = []
      const duration = video.duration
      const intervals = [0.1, 0.3, 0.5, 0.7, 0.9]
      
      for (let i = 0; i < intervals.length; i++) {
        const timestamp = Math.floor(duration * intervals[i])
        video.currentTime = timestamp
        
        await new Promise(resolve => {
          video.onseeked = async () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 1280
            canvas.height = video.videoHeight || 720
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
      setSelectedSnippets(snippets.map(s => s.id))
      toast.success('Video snippets extracted successfully')
    } catch (error) {
      console.error('Error extracting video snippets:', error)
      toast.error('Failed to extract video snippets')
    } finally {
      setExtractingSnippets(false)
    }
  }

  const extractManualSnippet = async () => {
    if (!projectVideoUrl || !manualTimestamp) return
    
    const timestamp = parseFloat(manualTimestamp)
    if (isNaN(timestamp)) {
      toast.error('Invalid timestamp')
      return
    }
    
    setExtractingSnippets(true)
    try {
      const video = videoRef.current || document.createElement('video')
      video.src = projectVideoUrl
      video.crossOrigin = 'anonymous'
      video.currentTime = timestamp
      
      await new Promise(resolve => {
        video.onseeked = async () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 1280
          canvas.height = video.videoHeight || 720
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0)
          
          const snippet: VideoSnippet = {
            id: `snippet-manual-${timestamp}`,
            timestamp,
            thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
            description: `Manual capture at ${timestamp}s`
          }
          
          setVideoSnippets(prev => [...prev, snippet])
          setSelectedSnippets(prev => [...prev, snippet.id])
          setManualTimestamp('')
          resolve(true)
        }
      })
      
      toast.success('Snippet captured successfully')
    } catch (error) {
      console.error('Error capturing snippet:', error)
      toast.error('Failed to capture snippet')
    } finally {
      setExtractingSnippets(false)
    }
  }

  const generateAllContent = async () => {
    const selectedSuggs = suggestions.filter(s => selectedSuggestions.includes(s.id))
    if (selectedSuggs.length === 0) {
      toast.error('Please select at least one content suggestion')
      return
    }

    setLoading(true)
    setProgress({
      total: selectedSuggs.length,
      completed: 0,
      current: 'Starting generation...',
      status: 'generating',
      errors: []
    })
    setGeneratedItems([])
    setActiveTab('results')
    
    const results: GeneratedItem[] = []
    
    for (let i = 0; i < selectedSuggs.length; i++) {
      const suggestion = selectedSuggs[i]
      setProgress(prev => ({
        ...prev,
        current: `Generating ${suggestion.type} for ${suggestion.platform || 'general'}...`,
        completed: i
      }))
      
      try {
        let response: Response | null = null
        let generatedContent: any = null
        
        if (suggestion.type === 'thumbnail') {
          response = await fetch('/api/generate-thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              prompt: customPrompts[suggestion.id] || suggestion.enhancedPrompt,
              usePersona: usePersona && suggestion.usePersona,
              personaPhotos: usePersona && selectedPersona ? 
                personas.find(p => p.id === selectedPersona)?.photos.map(p => p.url) || [] : 
                personaPhotos,
              useVideoSnippets: useVideoSnippets && suggestion.useVideoSnippets,
              videoSnippets: useVideoSnippets ? 
                videoSnippets.filter(s => selectedSnippets.includes(s.id)) : [],
              style: styles[suggestion.id] || suggestion.style,
              projectContext: {
                title: projectTitle,
                topics: contentAnalysis?.topics || [],
                keywords: contentAnalysis?.keywords || [],
                summary: contentAnalysis?.summary || ''
              }
            })
          })
          
          if (response.ok) {
            generatedContent = await response.json()
            results.push({
              id: suggestion.id,
              type: 'thumbnail',
              platform: suggestion.platform,
              content: generatedContent,
              preview: generatedContent.url,
              status: 'success'
            })
          }
        } else if (suggestion.type === 'social') {
          response = await fetch('/api/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              prompt: customPrompts[suggestion.id] || suggestion.enhancedPrompt,
              imageType: suggestion.platform === 'instagram' ? 'carousel' : 'social',
              platforms: [suggestion.platform || 'instagram'],
              usePersona: usePersona && suggestion.usePersona,
              personaPhotos: usePersona && selectedPersona ? 
                personas.find(p => p.id === selectedPersona)?.photos.map(p => p.url) || [] : 
                personaPhotos,
              useVideoSnippets: useVideoSnippets && suggestion.useVideoSnippets,
              videoSnippets: useVideoSnippets ? 
                videoSnippets.filter(s => selectedSnippets.includes(s.id)) : [],
              style: styles[suggestion.id] || suggestion.style,
              suggestionId: suggestion.id
            })
          })
          
          if (response.ok) {
            generatedContent = await response.json()
            results.push({
              id: suggestion.id,
              type: 'social',
              platform: suggestion.platform,
              content: generatedContent,
              preview: generatedContent.images?.[0]?.url || generatedContent.url,
              status: 'success'
            })
          }
        } else if (suggestion.type === 'blog') {
          response = await fetch('/api/generate-blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              enhancedContext: {
                contentAnalysis,
                unifiedPrompt: customPrompts[suggestion.id] || suggestion.enhancedPrompt,
                includeVideoMoments: useVideoSnippets,
                selectedMoments: videoSnippets
                  .filter(s => selectedSnippets.includes(s.id))
                  .map(s => ({ timestamp: s.timestamp, description: s.description }))
              }
            })
          })
          
          if (response.ok) {
            generatedContent = await response.json()
            results.push({
              id: suggestion.id,
              type: 'blog',
              content: generatedContent,
              preview: generatedContent.featuredImage,
              status: 'success'
            })
          }
        }
        
        if (!response?.ok) {
          throw new Error(`Failed to generate ${suggestion.type}`)
        }
        
      } catch (error) {
        console.error(`Error generating ${suggestion.type}:`, error)
        results.push({
          id: suggestion.id,
          type: suggestion.type,
          platform: suggestion.platform,
          content: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        setProgress(prev => ({
          ...prev,
          errors: [...prev.errors, `Failed to generate ${suggestion.type} for ${suggestion.platform || 'general'}`]
        }))
      }
      
      setGeneratedItems([...results])
    }
    
    setProgress(prev => ({
      ...prev,
      completed: selectedSuggs.length,
      current: 'Generation complete!',
      status: 'completed'
    }))
    
    const successCount = results.filter(r => r.status === 'success').length
    if (successCount > 0) {
      toast.success(`Generated ${successCount} items successfully!`)
      
      if (onContentGenerated) {
        onContentGenerated(results.filter(r => r.status === 'success'))
      }
    }
    
    setLoading(false)
  }

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  const exportSelected = async () => {
    const itemsToExport = generatedItems.filter(item => 
      selectedForExport.includes(item.id) && item.status === 'success'
    )
    
    if (itemsToExport.length === 0) {
      toast.error('Please select items to export')
      return
    }
    
    // Create a zip file or download individually
    for (const item of itemsToExport) {
      if (item.type === 'thumbnail' || item.type === 'social') {
        // Download images
        if (item.preview) {
          const link = document.createElement('a')
          link.href = item.preview
          link.download = `${projectTitle}-${item.type}-${item.platform || 'content'}.png`
          link.click()
        }
      } else if (item.type === 'blog' && item.content) {
        // Download blog content as markdown
        const content = `# ${item.content.title}\n\n${item.content.content}`
        const blob = new Blob([content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${projectTitle}-blog.md`
        link.click()
        URL.revokeObjectURL(url)
      }
    }
    
    toast.success(`Exported ${itemsToExport.length} items`)
  }

  const retryFailed = async () => {
    const failedSuggestions = generatedItems
      .filter(item => item.status === 'error')
      .map(item => item.id)
    
    if (failedSuggestions.length === 0) return
    
    // Re-select only failed items
    setSelectedSuggestions(failedSuggestions)
    await generateAllContent()
  }

  const renderSuggestionCard = (suggestion: UnifiedContentSuggestion) => {
    const isSelected = selectedSuggestions.includes(suggestion.id)
    const Icon = suggestion.type === 'thumbnail' ? IconPhoto : 
                 suggestion.type === 'social' ? IconBrandInstagram :
                 IconArticle

    return (
      <motion.div
        key={suggestion.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
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
      </motion.div>
    )
  }

  const renderGeneratedItem = (item: GeneratedItem) => {
    const isSelectedForExport = selectedForExport.includes(item.id)
    const suggestion = suggestions.find(s => s.id === item.id)
    
    return (
      <Card 
        key={item.id}
        className={cn(
          "overflow-hidden",
          item.status === 'error' && "border-destructive"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                {item.status === 'success' ? (
                  <IconCheck className="h-3 w-3 mr-1" />
                ) : (
                  <IconX className="h-3 w-3 mr-1" />
                )}
                {item.status}
              </Badge>
              <span className="text-sm font-medium">
                {suggestion?.prompt || item.type}
              </span>
            </div>
            {item.status === 'success' && (
              <Checkbox
                checked={isSelectedForExport}
                onCheckedChange={(checked) => {
                  setSelectedForExport(prev =>
                    checked
                      ? [...prev, item.id]
                      : prev.filter(id => id !== item.id)
                  )
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {item.status === 'success' ? (
            <>
              {item.preview && (
                <div className="mb-3">
                  <img
                    src={item.preview}
                    alt={`Generated ${item.type}`}
                    className="w-full rounded-md"
                  />
                </div>
              )}
              {item.type === 'blog' && item.content && (
                <div className="space-y-2">
                  <h4 className="font-semibold">{item.content.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content.content}
                  </p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="gap-1">
                  <IconEye className="h-3 w-3" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <IconEdit className="h-3 w-3" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <IconCopy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                {item.error || 'Failed to generate content'}
              </AlertDescription>
            </Alert>
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
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Unified Content Generator</DialogTitle>
            <DialogDescription>
              Create a complete content package with AI-powered suggestions
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="suggestions" className="gap-2">
                <IconSparkles className="h-4 w-4" />
                AI Suggestions
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <IconUser className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <IconPhoto className="h-4 w-4" />
                Results {generatedItems.length > 0 && `(${generatedItems.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">AI Content Suggestions</h3>
                    <p className="text-sm text-muted-foreground">
                      Select content to generate based on your video analysis
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSuggestions(suggestions.map(s => s.id))}
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                {/* Suggestions Grid */}
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 gap-3 pr-4">
                    <AnimatePresence>
                      {suggestions.map(renderSuggestionCard)}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {selectedSuggestions.length} of {suggestions.length} selected
                  </div>
                  <Button
                    onClick={() => setActiveTab('settings')}
                    disabled={selectedSuggestions.length === 0}
                    className="gap-2"
                  >
                    Next: Configure Settings
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 pr-4">
                  {/* Persona Settings */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Persona Settings</CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPersonaManager(!showPersonaManager)}
                        >
                          <IconUser className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="use-persona">Use Persona in Images</Label>
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
                              <SelectItem value="new">
                                <IconPlus className="h-4 w-4 mr-2 inline" />
                                Create New
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {selectedPersona && personas.find(p => p.id === selectedPersona) && (
                            <div className="flex gap-2 flex-wrap">
                              {personas.find(p => p.id === selectedPersona)?.photos.map((photo, idx) => (
                                <img 
                                  key={idx}
                                  src={photo.url} 
                                  alt={photo.name}
                                  className="w-16 h-16 object-cover rounded" 
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      
                      {showPersonaManager && (
                        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                          <div className="space-y-2">
                            <Label>New Persona</Label>
                            <Input
                              placeholder="Persona name"
                              value={newPersonaName}
                              onChange={(e) => setNewPersonaName(e.target.value)}
                            />
                            <Input
                              placeholder="Description (optional)"
                              value={newPersonaDescription}
                              onChange={(e) => setNewPersonaDescription(e.target.value)}
                            />
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
                                    alt={`New photo ${idx + 1}`}
                                    className="w-full h-full object-cover rounded" 
                                  />
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-5 w-5"
                                    onClick={() => setPersonaPhotos(prev => prev.filter((_, i) => i !== idx))}
                                  >
                                    <IconX className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button onClick={savePersona} size="sm" className="w-full">
                              <IconDeviceFloppy className="h-4 w-4 mr-2" />
                              Save Persona
                            </Button>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-2">
                            <Label>Saved Personas</Label>
                            {personas.map(persona => (
                              <div key={persona.id} className="flex items-center justify-between p-2 bg-background rounded">
                                <span className="text-sm">{persona.name}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => deletePersona(persona.id)}
                                >
                                  <IconTrash className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
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
                            <div className="space-y-3">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={extractVideoSnippets}
                                disabled={extractingSnippets || !projectVideoUrl}
                              >
                                {extractingSnippets ? (
                                  <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <IconVideo className="h-4 w-4 mr-2" />
                                )}
                                Extract Key Moments Automatically
                              </Button>
                              
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  placeholder="Timestamp (seconds)"
                                  value={manualTimestamp}
                                  onChange={(e) => setManualTimestamp(e.target.value)}
                                />
                                <Button
                                  onClick={extractManualSnippet}
                                  disabled={extractingSnippets || !projectVideoUrl || !manualTimestamp}
                                >
                                  Capture
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2">
                                {videoSnippets.map(snippet => (
                                  <div
                                    key={snippet.id}
                                    className={cn(
                                      "relative cursor-pointer rounded overflow-hidden border-2 transition-all",
                                      selectedSnippets.includes(snippet.id) 
                                        ? "border-primary ring-2 ring-primary/20" 
                                        : "border-muted hover:border-primary/50"
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setVideoSnippets([])
                                  setSelectedSnippets([])
                                }}
                                className="w-full"
                              >
                                Clear & Re-extract
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Platform Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Target Platforms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {['youtube', 'instagram', 'linkedin', 'twitter'].map(platform => (
                          <div key={platform} className="flex items-center space-x-2">
                            <Checkbox
                              id={platform}
                              checked={platforms.includes(platform)}
                              onCheckedChange={(checked) => {
                                setPlatforms(prev =>
                                  checked
                                    ? [...prev, platform]
                                    : prev.filter(p => p !== platform)
                                )
                              }}
                            />
                            <Label
                              htmlFor={platform}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                            >
                              {platform}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generate Button */}
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('suggestions')}
                    >
                      Back to Suggestions
                    </Button>
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
                          Generate Content
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="results" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col gap-4">
                {/* Progress Bar */}
                {progress.status === 'generating' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{progress.current}</span>
                      <span>{progress.completed}/{progress.total}</span>
                    </div>
                    <Progress value={(progress.completed / progress.total) * 100} />
                  </div>
                )}

                {/* Results Grid */}
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 gap-4 pr-4">
                    {generatedItems.map(renderGeneratedItem)}
                  </div>
                  
                  {generatedItems.length === 0 && progress.status === 'idle' && (
                    <div className="text-center py-12">
                      <IconPhoto className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No content generated yet. Configure settings and click generate.
                      </p>
                    </div>
                  )}
                </ScrollArea>

                {/* Actions */}
                {generatedItems.length > 0 && (
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryFailed}
                        className="gap-2"
                      >
                        <IconRefresh className="h-4 w-4" />
                        Retry Failed ({progress.errors.length})
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-sm text-muted-foreground mr-2">
                        {selectedForExport.length} selected
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedForExport(
                          generatedItems
                            .filter(item => item.status === 'success')
                            .map(item => item.id)
                        )}
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={exportSelected}
                        disabled={selectedForExport.length === 0}
                        className="gap-2"
                      >
                        <IconDownload className="h-4 w-4" />
                        Export Selected
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Hidden video element for snippet extraction */}
          <video ref={videoRef} className="hidden" crossOrigin="anonymous" />
        </DialogContent>
      </Dialog>
    </>
  )
} 