"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, User, Users, Wand2, Settings, ChevronRight, 
  AlertCircle, CheckCircle2, TrendingUp, Hash, Eye, 
  Target, Zap, Brain, Palette, Clock, ArrowRight,
  Instagram, Twitter, Linkedin, Facebook, Youtube,
  Info, Plus, X, Check, Edit3, RefreshCw, Save,
  MessageSquare, Image, Film, Layout, Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface SmartPostsGeneratorProps {
  projectId: string
  projectTitle: string
  contentAnalysis: any
  transcript?: string
  onPostsGenerated?: (posts: any[]) => void
}

interface Persona {
  id: string
  name: string
  avatar_url?: string
  description?: string
  brand_voice?: string
  photo_count: number
}

interface ContentSettings {
  contentTypes: string[]
  platforms: string[]
  creativity: number
  tone: 'professional' | 'casual' | 'funny' | 'educational' | 'inspirational'
  includeEmojis: boolean
  includeHashtags: boolean
  includeCTA: boolean
  optimizeForEngagement: boolean
  usePersona: boolean
  selectedPersonaId?: string
  useTrendingTopics: boolean
  targetAudience: string
  contentGoal: 'awareness' | 'engagement' | 'conversion' | 'education'
}

const CONTENT_TYPES = [
  { 
    id: 'carousel', 
    name: 'Carousel', 
    icon: Layout, 
    description: 'Multi-slide posts for storytelling',
    color: 'from-purple-500 to-pink-500' 
  },
  { 
    id: 'quote', 
    name: 'Quote', 
    icon: MessageSquare, 
    description: 'Powerful quotes with visual design',
    color: 'from-blue-500 to-cyan-500' 
  },
  { 
    id: 'single', 
    name: 'Single', 
    icon: Image, 
    description: 'Eye-catching single image posts',
    color: 'from-green-500 to-emerald-500' 
  },
  { 
    id: 'thread', 
    name: 'Thread', 
    icon: Hash, 
    description: 'Multi-part text threads',
    color: 'from-orange-500 to-red-500' 
  },
  { 
    id: 'reel', 
    name: 'Reel/Short', 
    icon: Film, 
    description: 'Short-form video ideas',
    color: 'from-pink-500 to-rose-500' 
  },
  { 
    id: 'story', 
    name: 'Story', 
    icon: Smartphone, 
    description: 'Ephemeral content ideas',
    color: 'from-indigo-500 to-purple-500' 
  }
]

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'tiktok', name: 'TikTok', icon: Hash, color: 'bg-black' }
]

export function SmartPostsGenerator({
  projectId,
  projectTitle,
  contentAnalysis,
  transcript,
  onPostsGenerated
}: SmartPostsGeneratorProps) {
  const [showIntakeDialog, setShowIntakeDialog] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('')
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('content')
  
  const [settings, setSettings] = useState<ContentSettings>({
    contentTypes: ['carousel', 'quote', 'single'],
    platforms: ['instagram', 'twitter', 'linkedin'],
    creativity: 0.7,
    tone: 'professional',
    includeEmojis: true,
    includeHashtags: true,
    includeCTA: true,
    optimizeForEngagement: true,
    usePersona: false,
    selectedPersonaId: undefined,
    useTrendingTopics: true,
    targetAudience: '',
    contentGoal: 'engagement'
  })

  // Load personas on mount and check for selected post idea
  useEffect(() => {
    loadPersonas()
    
    // Check if there's a selected post idea from AI insights
    const storedPost = sessionStorage.getItem('selectedPostIdea')
    if (storedPost) {
      try {
        const post = JSON.parse(storedPost)
        // Pre-populate with AI-generated post content
        const generatedPost = {
          id: `ai-${Date.now()}`,
          type: post.type,
          platform: post.platform[0] || 'instagram',
          content: `${post.hook}\n\n${post.mainContent}\n\n${post.callToAction}`,
          hashtags: contentAnalysis?.keywords?.slice(0, 5).map((k: string) => `#${k.replace(/\s+/g, '')}`) || [],
          estimatedEngagement: post.estimatedEngagement,
          bestTimeToPost: post.bestTimeToPost,
          synergies: post.synergies
        }
        setSuggestions([generatedPost])
        toast.success('AI post idea loaded and ready!')
        
        // Clear the stored post after using it
        sessionStorage.removeItem('selectedPostIdea')
      } catch (error) {
        console.error('Error loading post idea:', error)
      }
    }
    loadExistingSuggestions()
  }, [projectId])

  const loadPersonas = async () => {
    setLoadingPersonas(true)
    try {
      const response = await fetch('/api/personas')
      if (response.ok) {
        const data = await response.json()
        setPersonas(data.personas || [])
        
        // Auto-select first persona if available
        if (data.personas?.length > 0 && !settings.selectedPersonaId) {
          setSettings(prev => ({
            ...prev,
            selectedPersonaId: data.personas[0].id
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
    } finally {
      setLoadingPersonas(false)
    }
  }

  const loadExistingSuggestions = async () => {
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

  const handleGeneratePosts = async () => {
    setIsGenerating(true)
    setGenerationStep('Analyzing content...')

    // Celebration effect
    const duration = 5000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }
    
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
      
      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B']
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#3B82F6', '#EF4444', '#14B8A6', '#F97316']
      })
    }, 250)

    try {
      // Step 1: Generate suggestions
      setGenerationStep('Creating AI-powered content ideas...')
      const response = await fetch('/api/posts/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectTitle,
          contentAnalysis,
          transcript: transcript?.substring(0, 3000),
          settings
        })
      })

      if (!response.ok) throw new Error('Failed to generate posts')

      const data = await response.json()
      
      // Step 2: Enhance with trends if enabled
      if (settings.useTrendingTopics) {
        setGenerationStep('Incorporating trending topics...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Step 3: Optimize for platforms
      setGenerationStep('Optimizing for each platform...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 4: Apply persona if selected
      if (settings.usePersona && settings.selectedPersonaId) {
        setGenerationStep('Applying your brand persona...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      await loadExistingSuggestions()
      setShowIntakeDialog(false)
      toast.success('🎉 Smart posts generated successfully!')
      
      if (onPostsGenerated) {
        onPostsGenerated(data.suggestions)
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate posts. Please try again.')
    } finally {
      setIsGenerating(false)
      setGenerationStep('')
    }
  }

  const toggleContentType = (typeId: string) => {
    setSettings(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(typeId)
        ? prev.contentTypes.filter(t => t !== typeId)
        : [...prev.contentTypes, typeId]
    }))
  }

  const togglePlatform = (platformId: string) => {
    setSettings(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Main Action Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                  AI Social Posts Generator
                </CardTitle>
                <CardDescription className="mt-2">
                  Create market-ready content optimized for engagement across all platforms
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                Powered by GPT-4
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={() => setShowIntakeDialog(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Smart Posts
              </Button>
              {suggestions.length > 0 && (
                <Badge variant="outline" className="px-4 py-2 self-center">
                  {suggestions.length} posts created
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generation Dialog with Sophisticated Intake Form */}
        <Dialog open={showIntakeDialog} onOpenChange={setShowIntakeDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-500" />
                Smart Content Configuration
              </DialogTitle>
              <DialogDescription>
                Configure AI to generate market-ready posts optimized for your goals
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="persona">Persona</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="optimization">AI Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6">
                {/* Content Types Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Content Types to Generate
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {CONTENT_TYPES.map(type => (
                      <Card
                        key={type.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          settings.contentTypes.includes(type.id)
                            ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
                            : "hover:border-gray-300"
                        )}
                        onClick={() => toggleContentType(type.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-lg bg-gradient-to-br",
                              type.color,
                              "text-white"
                            )}>
                              <type.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{type.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                            {settings.contentTypes.includes(type.id) && (
                              <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Platform Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Target Platforms
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PLATFORMS.map(platform => (
                      <Button
                        key={platform.id}
                        variant={settings.platforms.includes(platform.id) ? "default" : "outline"}
                        className={cn(
                          "h-auto py-3 justify-start",
                          settings.platforms.includes(platform.id) && platform.color
                        )}
                        onClick={() => togglePlatform(platform.id)}
                      >
                        <platform.icon className="h-4 w-4 mr-2" />
                        {platform.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="persona" className="space-y-6">
                {/* Persona Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">
                      Use Brand Persona
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={settings.usePersona}
                            onCheckedChange={(checked) => {
                              setSettings(prev => ({ ...prev, usePersona: checked }))
                            }}
                            disabled={personas.length === 0}
                          />
                        </div>
                      </TooltipTrigger>
                      {personas.length === 0 && (
                        <TooltipContent>
                          <p>No personas available. Create one first.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>

                  {loadingPersonas ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>
                  ) : personas.length === 0 ? (
                    <Card className="border-dashed bg-muted/10">
                      <CardContent className="py-8 text-center">
                        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-4">
                          No personas found
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a persona to maintain consistent brand voice across all content
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.location.href = '/personas'}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Persona
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {personas.map(persona => (
                        <Card
                          key={persona.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            settings.usePersona && settings.selectedPersonaId === persona.id
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                              : "hover:border-gray-300",
                            !settings.usePersona && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (settings.usePersona) {
                              setSettings(prev => ({ ...prev, selectedPersonaId: persona.id }))
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {persona.avatar_url ? (
                                <img 
                                  src={persona.avatar_url} 
                                  alt={persona.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                  {persona.name[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{persona.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {persona.description || `${persona.photo_count} photos available`}
                                </div>
                                {persona.brand_voice && (
                                  <Badge variant="secondary" className="mt-1">
                                    {persona.brand_voice}
                                  </Badge>
                                )}
                              </div>
                              {settings.usePersona && settings.selectedPersonaId === persona.id && (
                                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {settings.usePersona && personas.length > 0 && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            Persona Integration Active
                          </p>
                          <p className="text-blue-700 dark:text-blue-300 mt-1">
                            Your selected persona's brand voice and visual style will be applied to all generated content for consistency.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="audience" className="space-y-6">
                {/* Target Audience */}
                <div>
                  <Label htmlFor="audience" className="text-base font-semibold mb-2 block">
                    Target Audience
                  </Label>
                  <Textarea
                    id="audience"
                    placeholder="e.g., Young professionals interested in productivity, entrepreneurs, content creators..."
                    value={settings.targetAudience}
                    onChange={(e) => setSettings(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Content Goal */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Primary Content Goal
                  </Label>
                  <RadioGroup
                    value={settings.contentGoal}
                    onValueChange={(value: any) => setSettings(prev => ({ ...prev, contentGoal: value }))}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'awareness', label: 'Brand Awareness', icon: Eye, description: 'Increase visibility and reach' },
                        { value: 'engagement', label: 'Engagement', icon: TrendingUp, description: 'Maximize likes and comments' },
                        { value: 'conversion', label: 'Conversion', icon: Target, description: 'Drive sales and sign-ups' },
                        { value: 'education', label: 'Education', icon: Brain, description: 'Share knowledge and insights' }
                      ].map(goal => (
                        <div key={goal.value}>
                          <RadioGroupItem value={goal.value} id={goal.value} className="peer sr-only" />
                          <Label 
                            htmlFor={goal.value} 
                            className={cn(
                              "flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                              "hover:border-purple-300",
                              "peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-950/20"
                            )}
                          >
                            <goal.icon className="h-8 w-8 mb-2 text-purple-500" />
                            <span className="font-medium">{goal.label}</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">
                              {goal.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Tone Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Content Tone
                  </Label>
                  <Select
                    value={settings.tone}
                    onValueChange={(value: any) => setSettings(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="funny">Funny</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="optimization" className="space-y-6">
                {/* AI Settings */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">
                        Creativity Level
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(settings.creativity * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[settings.creativity]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, creativity: value }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Conservative</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'includeEmojis', label: 'Include Emojis', icon: '😊', description: 'Add relevant emojis to posts' },
                      { key: 'includeHashtags', label: 'Auto-generate Hashtags', icon: '#', description: 'Create trending hashtags' },
                      { key: 'includeCTA', label: 'Add Call-to-Actions', icon: '🎯', description: 'Include action prompts' },
                      { key: 'optimizeForEngagement', label: 'Optimize for Engagement', icon: '📈', description: 'Maximize interactions' },
                      { key: 'useTrendingTopics', label: 'Incorporate Trending Topics', icon: '🔥', description: 'Use current trends' }
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{setting.icon}</span>
                          <div>
                            <Label htmlFor={setting.key} className="cursor-pointer font-medium">
                              {setting.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {setting.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={setting.key}
                          checked={settings[setting.key as keyof ContentSettings] as boolean}
                          onCheckedChange={(checked) => {
                            setSettings(prev => ({ ...prev, [setting.key]: checked }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowIntakeDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePosts}
                disabled={isGenerating || settings.contentTypes.length === 0 || settings.platforms.length === 0}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {generationStep || 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Smart Posts
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generated Suggestions Display */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Posts</h3>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {suggestions.length} posts ready
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadExistingSuggestions}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {suggestion.title}
                        </CardTitle>
                        <Badge variant="secondary">
                          {suggestion.content_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {suggestion.description}
                      </p>
                      {suggestion.engagement_prediction && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Engagement Score</span>
                            <span>{Math.round(suggestion.engagement_prediction * 100)}%</span>
                          </div>
                          <Progress value={suggestion.engagement_prediction * 100} className="h-2" />
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {suggestion.eligible_platforms?.map((platform: string) => {
                          const platformConfig = PLATFORMS.find(p => p.id === platform)
                          return platformConfig ? (
                            <Tooltip key={platform}>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">
                                  <platformConfig.icon className="h-3 w-3 mr-1" />
                                  {platformConfig.name}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Optimized for {platformConfig.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          )
                        })}
                      </div>
                      {suggestion.persona_used && (
                        <Badge variant="secondary" className="mt-2">
                          <User className="h-3 w-3 mr-1" />
                          Persona Applied
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}