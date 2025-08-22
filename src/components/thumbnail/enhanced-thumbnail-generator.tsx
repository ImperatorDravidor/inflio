"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  Sparkles, RefreshCw, Download, Star, Wand2, 
  ThumbsUp, ThumbsDown, History, Upload, Zap,
  BarChart3, GitBranch, Target, Brain,
  ChevronRight, Copy, ExternalLink, AlertCircle,
  Palette, Image as ImageIcon, Clock, TrendingUp, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Types
interface ThumbnailGeneration {
  id: string
  url: string
  prompt: string
  enhancedPrompt?: string
  style: string
  quality: string
  platform: string
  rating?: number
  feedback?: string
  parentId?: string
  children?: ThumbnailGeneration[]
  iterationNumber?: number
  variationIndex?: number
  textSuggestions?: string[]
  performanceScore?: number
  abTestVariant?: 'A' | 'B' | null
  chosen?: boolean
  usedInPosts?: boolean
  metadata?: {
    model: string
    seed?: number
    personaUsed?: boolean
    generationTime?: number
    dimensions?: { width: number; height: number }
  }
  createdAt: string
}

interface GenerationSettings {
  style: 'modern' | 'classic' | 'minimal' | 'bold' | 'artistic' | 'dramatic' | 'vibrant'
  quality: 'fast' | 'balanced' | 'high'
  platform: 'youtube' | 'instagram' | 'linkedin' | 'universal'
  includePersona: boolean
  personaBlendStrength: number
  textSpace: 'none' | 'minimal' | 'moderate' | 'maximum'
  colorPalette: 'auto' | 'brand' | 'vibrant' | 'muted' | 'dark' | 'light'
}

interface SmartPromptSuggestion {
  category: string
  suggestions: string[]
}

// Style presets with enhanced metadata
const STYLE_PRESETS = {
  modern: { 
    label: 'Modern', 
    icon: Zap, 
    desc: 'Clean, contemporary design',
    params: { contrast: 1.2, saturation: 1.1 }
  },
  classic: { 
    label: 'Classic', 
    icon: ImageIcon, 
    desc: 'Timeless, professional look',
    params: { contrast: 1.0, saturation: 0.9 }
  },
  minimal: { 
    label: 'Minimal', 
    icon: Target, 
    desc: 'Simple, focused composition',
    params: { contrast: 1.1, saturation: 0.8 }
  },
  bold: { 
    label: 'Bold', 
    icon: Sparkles, 
    desc: 'High impact, attention-grabbing',
    params: { contrast: 1.4, saturation: 1.3 }
  },
  artistic: { 
    label: 'Artistic', 
    icon: Palette, 
    desc: 'Creative, unique aesthetic',
    params: { contrast: 1.1, saturation: 1.2 }
  },
  dramatic: { 
    label: 'Dramatic', 
    icon: Sparkles, 
    desc: 'Cinematic, emotional impact',
    params: { contrast: 1.5, saturation: 1.0 }
  },
  vibrant: { 
    label: 'Vibrant', 
    icon: TrendingUp, 
    desc: 'Colorful, energetic feel',
    params: { contrast: 1.2, saturation: 1.5 }
  }
}

// Platform specifications
const PLATFORM_SPECS = {
  youtube: { 
    dimensions: '1280x720', 
    aspectRatio: '16:9',
    bestPractices: ['High contrast', 'Large text', 'Face prominent', 'Bright colors']
  },
  instagram: { 
    dimensions: '1080x1080', 
    aspectRatio: '1:1',
    bestPractices: ['Center composition', 'Mobile-friendly', 'Bold visuals', 'Minimal text']
  },
  linkedin: { 
    dimensions: '1200x628', 
    aspectRatio: '1.91:1',
    bestPractices: ['Professional', 'Clean design', 'Readable text', 'Brand colors']
  },
  universal: { 
    dimensions: '1920x1080', 
    aspectRatio: '16:9',
    bestPractices: ['Versatile design', 'Clear focal point', 'Scalable elements']
  }
}

interface EnhancedThumbnailGeneratorProps {
  projectId: string
  projectTitle?: string
  projectContext?: any
  videoUrl?: string
  transcript?: string
  onThumbnailSelect?: (thumbnailUrl: string, thumbnailId: string) => void
}

export function EnhancedThumbnailGenerator({ 
  projectId, 
  projectTitle = 'Your Video',
  projectContext,
  videoUrl,
  transcript,
  onThumbnailSelect 
}: EnhancedThumbnailGeneratorProps) {
  // State
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [showSmartPrompt, setShowSmartPrompt] = useState(false)
  const [smartSuggestions, setSmartSuggestions] = useState<SmartPromptSuggestion[]>([])
  const [generations, setGenerations] = useState<ThumbnailGeneration[]>([])
  const [selectedGeneration, setSelectedGeneration] = useState<ThumbnailGeneration | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showVariations, setShowVariations] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('generate')
  
  const [settings, setSettings] = useState<GenerationSettings>({
    style: 'modern',
    quality: 'balanced',
    platform: 'youtube',
    includePersona: false,
    personaBlendStrength: 50,
    textSpace: 'moderate',
    colorPalette: 'auto'
  })

  const [feedback, setFeedback] = useState({
    rating: 3,
    text: '',
    improvements: [] as string[]
  })

  // Load history on mount and check for selected concept
  useEffect(() => {
    loadGenerationHistory()
    
    // Check if there's a selected thumbnail concept from AI insights
    const storedConcept = sessionStorage.getItem('selectedThumbnailConcept')
    if (storedConcept) {
      try {
        const concept = JSON.parse(storedConcept)
        // Use the AI-generated prompt
        if (concept.aiPrompt) {
          setPrompt(concept.aiPrompt)
          toast.success('AI thumbnail concept loaded!')
        }
        // Set style based on concept
        if (concept.style && settings.style !== concept.style) {
          setSettings(prev => ({ ...prev, style: concept.style as any }))
        }
        // Clear the stored concept after using it
        sessionStorage.removeItem('selectedThumbnailConcept')
      } catch (error) {
        console.error('Error loading thumbnail concept:', error)
      }
    }
  }, [projectId])

  const loadGenerationHistory = async () => {
    try {
      const response = await fetch(`/api/thumbnail/history?projectId=${projectId}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setGenerations(buildGenerationTree(data.thumbnails || []))
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const buildGenerationTree = (thumbnails: ThumbnailGeneration[]): ThumbnailGeneration[] => {
    const map = new Map<string, ThumbnailGeneration>()
    const roots: ThumbnailGeneration[] = []
    
    // First pass: create map
    thumbnails.forEach(thumb => {
      map.set(thumb.id, { ...thumb, children: [] })
    })
    
    // Second pass: build tree
    thumbnails.forEach(thumb => {
      if (thumb.parentId) {
        const parent = map.get(thumb.parentId)
        if (parent && parent.children) {
          parent.children.push(map.get(thumb.id)!)
        }
      } else {
        roots.push(map.get(thumb.id)!)
      }
    })
    
    return roots
  }

  // Smart Prompt Builder
  const buildSmartPrompt = async () => {
    setShowSmartPrompt(true)
    
    try {
      const response = await fetch('/api/thumbnail/smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          projectContext,
          transcript: transcript?.slice(0, 1000), // First 1000 chars
          platform: settings.platform,
          style: settings.style
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSmartSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Smart prompt error:', error)
      toast.error('Failed to generate smart suggestions')
    }
  }

  // Generate thumbnail with enhanced progress tracking
  const generateThumbnail = async () => {
    if (!prompt.trim() && !projectContext) {
      toast.error('Please provide a prompt or use Smart Prompt')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 10, 90))
    }, 500)

    try {
      const response = await fetch('/api/thumbnail/generate-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt: prompt || `Create an engaging ${settings.platform} thumbnail for: ${projectTitle}`,
          settings,
          projectContext,
          videoFrameUrl: videoUrl // For extracting key frame
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      const newGeneration: ThumbnailGeneration = {
        id: data.id,
        url: data.url,
        prompt: data.prompt,
        enhancedPrompt: data.enhancedPrompt,
        style: settings.style,
        quality: settings.quality,
        platform: settings.platform,
        textSuggestions: data.textSuggestions,
        metadata: data.metadata,
        createdAt: new Date().toISOString()
      }

      setGenerations([newGeneration, ...generations])
      setSelectedGeneration(newGeneration)
      setGenerationProgress(100)
      
      toast.success('Thumbnail generated successfully!')
      
      // Auto-switch to preview tab
      setActiveTab('preview')
      
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Generate variations
  const generateVariations = async () => {
    if (!selectedGeneration) return
    
    setShowVariations(true)
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/thumbnail/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          parentId: selectedGeneration.id,
          count: 4,
          settings
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const variations = data.variations.map((v: any, i: number) => ({
          ...v,
          variationIndex: i + 1,
          parentId: selectedGeneration.id
        }))
        
        // Update parent with children
        const updatedGeneration = {
          ...selectedGeneration,
          children: [...(selectedGeneration.children || []), ...variations]
        }
        
        setSelectedGeneration(updatedGeneration)
        toast.success(`Generated ${variations.length} variations`)
      }
    } catch (error) {
      console.error('Variations error:', error)
      toast.error('Failed to generate variations')
    } finally {
      setIsGenerating(false)
    }
  }

  // Magic Enhance - one-click improvement
  const magicEnhance = async () => {
    if (!selectedGeneration) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/thumbnail/magic-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          thumbnailId: selectedGeneration.id,
          platform: settings.platform,
          currentPerformance: selectedGeneration.performanceScore
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const enhanced: ThumbnailGeneration = {
          ...data.enhanced,
          parentId: selectedGeneration.id,
          iterationNumber: (selectedGeneration.iterationNumber || 0) + 1
        }
        
        setGenerations([enhanced, ...generations])
        setSelectedGeneration(enhanced)
        
        toast.success('Thumbnail enhanced with best practices!')
        
        if (data.improvements) {
          toast.info(`Improvements: ${data.improvements.join(', ')}`)
        }
      }
    } catch (error) {
      console.error('Magic enhance error:', error)
      toast.error('Enhancement failed')
    } finally {
      setIsGenerating(false)
    }
  }

  // Mark for A/B testing
  const markForABTest = (variant: 'A' | 'B') => {
    if (!selectedGeneration) return
    
    const updated = {
      ...selectedGeneration,
      abTestVariant: variant
    }
    
    setSelectedGeneration(updated)
    setGenerations(generations.map(g => 
      g.id === selectedGeneration.id ? updated : g
    ))
    
    toast.success(`Marked as Variant ${variant} for A/B testing`)
  }

  // Performance analytics view
  const PerformanceAnalytics = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">Avg. CTR</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.2</div>
              <p className="text-xs text-muted-foreground">Avg. Rating</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Total Generated</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Used in Posts</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label>Best Performing Styles</Label>
            <div className="flex gap-2 mt-2">
              <Badge variant="default">Bold (45% CTR)</Badge>
              <Badge variant="secondary">Vibrant (38% CTR)</Badge>
              <Badge variant="outline">Modern (32% CTR)</Badge>
            </div>
          </div>
          
          <div>
            <Label>Platform Performance</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">YouTube</span>
                <Progress value={78} className="w-32" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Instagram</span>
                <Progress value={65} className="w-32" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">LinkedIn</span>
                <Progress value={52} className="w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">
            <Wand2 className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="preview">
            <ImageIcon className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
            {generations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {generations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate AI Thumbnail</CardTitle>
              <CardDescription>
                Create stunning thumbnails optimized for {PLATFORM_SPECS[settings.platform].aspectRatio} aspect ratio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Selector */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(PLATFORM_SPECS).map(([platform, spec]) => (
                  <button
                    key={platform}
                    onClick={() => setSettings({...settings, platform: platform as any})}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all",
                      settings.platform === platform
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium capitalize">{platform}</div>
                    <div className="text-xs text-muted-foreground">{spec.dimensions}</div>
                  </button>
                ))}
              </div>

              {/* Style Grid */}
              <div>
                <Label>Style Preset</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                  {Object.entries(STYLE_PRESETS).map(([key, preset]) => {
                    const Icon = preset.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setSettings({...settings, style: key as any})}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all",
                          settings.style === key
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                        )}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <div className="text-xs font-medium">{preset.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* AI-Generated Suggestions (if available) */}
              {projectContext?.thumbnailIdeas?.concepts && projectContext.thumbnailIdeas.concepts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <Label>AI-Generated Concepts</Label>
                    <Badge variant="secondary" className="text-xs">
                      {projectContext.thumbnailIdeas.concepts.length} ideas
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {projectContext.thumbnailIdeas.concepts.slice(0, 4).map((concept: any, idx: number) => (
                      <button
                        key={concept.id || idx}
                        onClick={() => {
                          setPrompt(concept.aiPrompt || concept.description)
                          if (concept.style) {
                            setSettings(prev => ({ ...prev, style: concept.style as any }))
                          }
                          toast.success('AI concept applied!')
                        }}
                        className="p-3 rounded-lg border-2 border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5 text-left transition-all"
                      >
                        <div className="font-medium text-sm mb-1">{concept.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {concept.description}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {concept.style}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {concept.mood}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Prompt Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">Describe your thumbnail</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={buildSmartPrompt}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Smart Prompt
                  </Button>
                </div>
                
                <Textarea
                  id="prompt"
                  placeholder={`e.g., "${projectTitle}" with excited expression, bright colors, professional setting...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
                
                {/* Smart Suggestions */}
                {showSmartPrompt && smartSuggestions.length > 0 && (
                  <Card className="p-3 bg-muted/50">
                    <div className="space-y-3">
                      {smartSuggestions.map((category) => (
                        <div key={category.category}>
                          <Label className="text-xs">{category.category}</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {category.suggestions.map((suggestion) => (
                              <Badge
                                key={suggestion}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={() => setPrompt(prev => 
                                  prev ? `${prev}, ${suggestion}` : suggestion
                                )}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Quality</Label>
                  <RadioGroup 
                    value={settings.quality}
                    onValueChange={(value) => setSettings({...settings, quality: value as any})}
                    className="flex gap-3"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="fast" />
                      <span className="text-sm">Fast</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="balanced" />
                      <span className="text-sm">Balanced</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="high" />
                      <span className="text-sm">High</span>
                    </label>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Persona</Label>
                    <p className="text-xs text-muted-foreground">Use your trained face model</p>
                  </div>
                  <Switch
                    checked={settings.includePersona}
                    onCheckedChange={(checked) => setSettings({...settings, includePersona: checked})}
                  />
                </div>

                {settings.includePersona && (
                  <div>
                    <Label>Persona Blend Strength</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Slider
                        value={[settings.personaBlendStrength]}
                        onValueChange={([value]) => setSettings({...settings, personaBlendStrength: value})}
                        min={0}
                        max={100}
                        step={10}
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">{settings.personaBlendStrength}%</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Text Space</Label>
                  <Select
                    value={settings.textSpace}
                    onValueChange={(value) => setSettings({...settings, textSpace: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Text Space</SelectItem>
                      <SelectItem value="minimal">Minimal (10%)</SelectItem>
                      <SelectItem value="moderate">Moderate (25%)</SelectItem>
                      <SelectItem value="maximum">Maximum (40%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={generateThumbnail} 
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating... {generationProgress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Thumbnail
                    </>
                  )}
                </Button>
                
                {selectedGeneration && (
                  <Button
                    variant="outline"
                    onClick={magicEnhance}
                    disabled={isGenerating}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Magic Enhance
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isGenerating && (
                <Progress value={generationProgress} className="h-2" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {selectedGeneration ? (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={selectedGeneration.url}
                      alt="Generated thumbnail"
                      fill
                      className="object-contain"
                    />
                    
                    {/* Overlay badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge>{selectedGeneration.platform}</Badge>
                      <Badge variant="secondary">{selectedGeneration.style}</Badge>
                      {selectedGeneration.metadata?.personaUsed && (
                        <Badge variant="outline">Persona</Badge>
                      )}
                    </div>
                    
                    {/* A/B Test Marker */}
                    {selectedGeneration.abTestVariant && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="destructive">
                          Variant {selectedGeneration.abTestVariant}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Performance Score */}
                    {selectedGeneration.performanceScore && (
                      <div className="absolute bottom-4 right-4 bg-background/90 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {selectedGeneration.performanceScore}% CTR
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Feedback Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Rate & Improve</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedback({...feedback, rating: star})}
                          className="p-1"
                        >
                          <Star className={cn(
                            "h-5 w-5",
                            star <= feedback.rating 
                              ? "fill-yellow-500 text-yellow-500" 
                              : "text-gray-300"
                          )} />
                        </button>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowFeedback(true)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Iterate
                    </Button>
                  </CardContent>
                </Card>

                {/* Variations Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Variations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Generate similar versions
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={generateVariations}
                      disabled={isGenerating}
                    >
                      <GitBranch className="h-4 w-4 mr-2" />
                      Create 4 Variations
                    </Button>
                  </CardContent>
                </Card>

                {/* A/B Test Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">A/B Testing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Mark for testing
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedGeneration.abTestVariant === 'A' ? 'default' : 'outline'}
                        size="sm" 
                        className="flex-1"
                        onClick={() => markForABTest('A')}
                      >
                        Variant A
                      </Button>
                      <Button 
                        variant={selectedGeneration.abTestVariant === 'B' ? 'default' : 'outline'}
                        size="sm" 
                        className="flex-1"
                        onClick={() => markForABTest('B')}
                      >
                        Variant B
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Text Suggestions */}
              {selectedGeneration.textSuggestions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Text Overlay Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedGeneration.textSuggestions.map((text, i) => (
                        <div 
                          key={i}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer group"
                        >
                          <p className="text-sm font-medium">{text}</p>
                          <button className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Use This Thumbnail
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Editor
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No thumbnail selected</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('generate')}
              >
                Generate Your First Thumbnail
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>
                Your recent thumbnails with full lineage tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generations.length > 0 ? (
                <div className="space-y-4">
                  {generations.map((gen) => (
                    <motion.div
                      key={gen.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedGeneration(gen)
                        setActiveTab('preview')
                      }}
                    >
                      <div className="flex gap-4">
                        <div className="relative w-32 h-20 bg-muted rounded flex-shrink-0">
                          <Image
                            src={gen.url}
                            alt="Thumbnail"
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium line-clamp-1">
                                {gen.prompt}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {gen.style}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {gen.platform}
                                </Badge>
                                {gen.rating && (
                                  <Badge variant="secondary" className="text-xs">
                                    ⭐ {gen.rating}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(gen.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Show children/variations */}
                          {gen.children && gen.children.length > 0 && (
                            <div className="mt-2 flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {gen.children.length} variations
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No generation history yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <PerformanceAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}

