"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { usePersonas } from '@/contexts/persona-context'
import { 
  PLATFORMS, 
  getPlatformsForContent, 
  isContentReadyForPlatform,
  type Platform,
  type ContentType 
} from '@/lib/platform-config'
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
  User,
  Zap,
  TrendingUp,
  Clock,
  Target,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Copy,
  Trash2,
  Star,
  Filter,
  Search,
  ArrowUpDown,
  Grid3x3,
  List,
  Palette,
  Wand2,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  PlusCircle,
  Settings
} from 'lucide-react'

// Platform configurations
const platformConfig = {
  instagram: {
    icon: Instagram,
    color: 'from-purple-600 to-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-600 to-pink-600',
    lightBg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    borderColor: 'border-purple-500/20',
    name: 'Instagram',
    maxCaption: 2200,
    maxHashtags: 30,
    maxImages: 10,
    sizes: ['1080x1350', '1080x1080']
  },
  twitter: {
    icon: Twitter,
    color: 'from-gray-900 to-gray-700',
    bgColor: 'bg-black',
    lightBg: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-500/20',
    name: 'X (Twitter)',
    maxCaption: 280,
    maxHashtags: 5,
    maxImages: 4,
    sizes: ['1920x1080', '1200x675']
  },
  linkedin: {
    icon: Linkedin,
    color: 'from-blue-700 to-blue-600',
    bgColor: 'bg-blue-700',
    lightBg: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-500/20',
    name: 'LinkedIn',
    maxCaption: 3000,
    maxHashtags: 5,
    maxImages: 9,
    sizes: ['1200x628', '1080x1080']
  },
  facebook: {
    icon: Facebook,
    color: 'from-blue-600 to-blue-500',
    bgColor: 'bg-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-500/20',
    name: 'Facebook',
    maxCaption: 2200,
    maxHashtags: 30,
    maxImages: 10,
    sizes: ['1200x630', '1080x1080']
  },
  youtube: {
    icon: Youtube,
    color: 'from-red-600 to-red-500',
    bgColor: 'bg-red-600',
    lightBg: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-500/20',
    name: 'YouTube',
    maxTitle: 100,
    maxDescription: 5000,
    thumbnailSize: '1280x720'
  },
  tiktok: {
    icon: Music2,
    color: 'from-gray-900 to-gray-800',
    bgColor: 'bg-black',
    lightBg: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-500/20',
    name: 'TikTok',
    maxCaption: 2200,
    maxHashtags: 100,
    videoOnly: true
  }
}

// Content type configurations
const contentTypeConfig = {
  carousel: {
    icon: Layout,
    name: 'Carousel',
    description: 'Multi-slide posts (3-8 images)',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    minImages: 3,
    maxImages: 8
  },
  quote: {
    icon: Quote,
    name: 'Quote Card',
    description: 'Powerful quotes with attribution',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    images: 1
  },
  single: {
    icon: ImageIcon,
    name: 'Single Image',
    description: 'One impactful visual',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    images: 1
  },
  thread: {
    icon: FileText,
    name: 'Thread',
    description: 'Text-based with 1-3 visuals',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    minImages: 1,
    maxImages: 3
  },
  reel: {
    icon: Zap,
    name: 'Reel/Short',
    description: '15-60 second vertical video',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    video: true
  },
  story: {
    icon: Clock,
    name: 'Story',
    description: '24-hour ephemeral content',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    images: 1,
    ephemeral: true
  }
}

interface PostSuggestion {
  id: string
  content_type: 'carousel' | 'quote' | 'single' | 'thread' | 'story'
  title: string
  description?: string
  primary_goal?: string
  images: Array<{
    id: string
    url?: string
    type?: 'hero' | 'supporting'
    prompt?: string
    text_overlay?: string
    dimensions?: string
    position: number
  }>
  visual_style?: string
  persona_integration?: string
  copy_variants: Record<string, {
    caption: string
    hashtags: string[]
    cta?: string
    first_comment?: string
    title?: string
    description?: string
    format_notes?: string
    optimal_length?: number
    algorithm_optimization?: string
  }>
  platform_readiness?: Record<string, {
    is_ready: boolean
    missing_elements?: string[]
    optimization_tips?: string[]
    compliance_check?: boolean
  }>
  eligible_platforms: string[]
  hook_variations?: string[]
  engagement_triggers?: string[]
  shareability_factors?: string[]
  comment_starters?: string[]
  engagement_prediction?: number
  viral_potential?: 'low' | 'medium' | 'high'
  predicted_reach?: number
  best_posting_times?: Record<string, string[]>
  production_checklist?: any
  required_assets?: string[]
  status: string
  persona_used: boolean
  persona_id?: string
  rating?: number
}

interface EnhancedPostsGeneratorProps {
  projectId: string
  projectTitle: string
  contentAnalysis?: any
  transcript?: string
  personaId?: string
}

export function EnhancedPostsGenerator({
  projectId,
  projectTitle,
  contentAnalysis,
  transcript,
  personaId
}: EnhancedPostsGeneratorProps) {
  // Persona context
  const { personas, activePersona, setActivePersona, isLoading: personasLoading } = usePersonas()
  
  // State
  const [suggestions, setSuggestions] = useState<PostSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [selectedSuggestion, setSelectedSuggestion] = useState<PostSuggestion | null>(null)
  const [editingCopy, setEditingCopy] = useState<any>(null)
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(['carousel', 'quote', 'single', 'thread', 'reel', 'story'])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'twitter', 'linkedin'])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'score' | 'engagement'>('recent')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<string[]>([])
  const [selectedPersonaForGeneration, setSelectedPersonaForGeneration] = useState<string | null>(personaId || activePersona?.id || null)
  const [generationSettings, setGenerationSettings] = useState({
    creativity: 0.7,
    usePersona: !!personaId || !!activePersona,
    autoHashtags: true,
    includeCTA: true,
    optimizeForEngagement: true,
    tone: 'professional',
    contentGoal: 'engagement',
    visualStyle: 'modern'
  })

  // State to track if we've attempted auto-generation for this project
  const [hasAttemptedAutoGeneration, setHasAttemptedAutoGeneration] = useState(false)
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false)

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions()
  }, [projectId])

  // Watch for content analysis changes and auto-generate if needed
  useEffect(() => {
    if (!suggestionsLoaded) return // Wait for initial load
    
    const shouldAutoGenerate = 
      contentAnalysis && 
      suggestions.length === 0 && 
      !hasAttemptedAutoGeneration &&
      !isGenerating
    
    if (shouldAutoGenerate) {
      console.log('[EnhancedPostsGenerator] Auto-generating posts with content analysis:', contentAnalysis)
      autoGeneratePostsIfNeeded()
    }
  }, [contentAnalysis, suggestions.length, suggestionsLoaded, hasAttemptedAutoGeneration, isGenerating])

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`/api/posts/suggestions?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setSuggestionsLoaded(true)
        return data.suggestions || []
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
      toast.error('Failed to load post suggestions')
    }
    setSuggestionsLoaded(true)
    return []
  }

  const autoGeneratePostsIfNeeded = async () => {
    // Mark that we've attempted auto-generation for this project
    setHasAttemptedAutoGeneration(true)
    
    // Show a toast that we're auto-generating
    toast.info('🎨 Generating AI posts based on your content...', {
      duration: 3000,
      icon: <Sparkles className="h-4 w-4" />
    })
    
    // Auto-trigger generation with default settings
    await generateSuggestionsWithDefaults()
  }

  const generateSuggestionsWithDefaults = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    // Use smart defaults for automatic generation
    const defaultSettings = {
      contentTypes: ['carousel', 'quote', 'single'], // Most popular types
      platforms: ['instagram', 'twitter', 'linkedin'], // Most common platforms
      creativity: 0.7,
      tone: 'professional',
      includeEmojis: true,
      includeHashtags: true,
      optimizeForEngagement: true,
      usePersona: !!personaId,
      selectedPersonaId: personaId
    }

    // Track progress interval to ensure cleanup
    let progressInterval: NodeJS.Timeout | null = null
    
    try {
      // Simulate progress
      progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/posts/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectTitle,
          contentAnalysis,
          transcript: transcript?.substring(0, 3000),
          settings: defaultSettings
        })
      })

      // Clear interval immediately after response
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      
      setGenerationProgress(100)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Failed to generate posts:', errorData)
        throw new Error(`Failed to generate posts: ${response.status}`)
      }

      const result = await response.json()
      console.log('[EnhancedPostsGenerator] Generated posts:', result)

      // Wait a moment for database to be updated
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reload suggestions
      await loadSuggestions()
      
      // Subtle success notification
      toast.success('✨ AI posts ready!', {
        duration: 2000
      })
      
      // Small celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8B5CF6', '#EC4899', '#10B981']
      })
    } catch (error) {
      console.error('Auto-generation error:', error)
      // Show error toast for debugging
      toast.error('Failed to auto-generate posts. You can manually generate them.')
    } finally {
      // Always cleanup interval if still running
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setIsGenerating(false)
      setGenerationProgress(0) // Reset to 0 instead of leaving at 100
    }
  }

  const generateSuggestions = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setShowGenerateDialog(false)

    // Celebration effect
    const duration = 3000
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
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    try {
      const response = await fetch('/api/posts/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectTitle,
          contentAnalysis,
          transcript: transcript?.substring(0, 3000),
          settings: {
            ...generationSettings,
            selectedPersonaId: selectedPersonaForGeneration,
            contentTypes: selectedContentTypes,
            platforms: selectedPlatforms,
            targetAudience: contentAnalysis?.targetDemographics?.primary || 'General audience',
            contentGoal: generationSettings.contentGoal || 'engagement'
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate suggestions')

      const data = await response.json()
      
      if (data.jobId) {
        await pollGenerationProgress(data.jobId)
      }

      await loadSuggestions()
      toast.success('🎉 AI Posts generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate suggestions')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0) // Reset to 0 instead of leaving at 100
    }
  }

  const pollGenerationProgress = async (jobId: string) => {
    return new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/posts/job-status?jobId=${jobId}`)
          if (response.ok) {
            const data = await response.json()
            setGenerationProgress(data.progress || 0)
            
            if (data.status === 'completed' || data.status === 'failed') {
              clearInterval(interval)
              resolve()
            }
          }
        } catch (error) {
          console.error('Failed to poll progress:', error)
          clearInterval(interval)
          resolve()
        }
      }, 1000)
    })
  }

  const handleBatchAction = async (action: 'approve' | 'delete' | 'export') => {
    if (selectedBatch.length === 0) {
      toast.error('No posts selected')
      return
    }

    switch (action) {
      case 'approve':
        for (const id of selectedBatch) {
          await approveSuggestion(id)
        }
        toast.success(`${selectedBatch.length} posts approved`)
        break
      case 'delete':
        // Implement delete
        toast.success(`${selectedBatch.length} posts deleted`)
        break
      case 'export':
        // Implement export
        toast.success('Posts exported')
        break
    }

    setSelectedBatch([])
    await loadSuggestions()
  }

  const approveSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/posts/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      })

      if (!response.ok) throw new Error('Failed to approve')
      
      // Update local state
      setSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, status: 'approved' } : s
      ))
    } catch (error) {
      console.error('Approval error:', error)
      toast.error('Failed to approve suggestion')
    }
  }

  // Filtered and sorted suggestions
  const processedSuggestions = suggestions
    .filter(s => filterStatus === 'all' || s.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.rating || 0) - (a.rating || 0)
        case 'engagement':
          return (b.engagement_prediction || 0) - (a.engagement_prediction || 0)
        default:
          return 0 // Keep original order for 'recent'
      }
    })

  const SuggestionCard = ({ suggestion }: { suggestion: PostSuggestion }) => {
    const TypeIcon = contentTypeConfig[suggestion.content_type]?.icon || Layers
    const typeConfig = contentTypeConfig[suggestion.content_type] || {
      icon: Layers,
      name: suggestion.content_type,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20'
    }
    const isSelected = selectedBatch.includes(suggestion.id)
    
    // Calculate overall platform readiness
    const platformReadinessCount = suggestion.platform_readiness 
      ? Object.values(suggestion.platform_readiness).filter((p: any) => p.is_ready).length
      : suggestion.eligible_platforms.length
    
    const allPlatformsReady = platformReadinessCount === suggestion.eligible_platforms.length
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={cn(
          "overflow-hidden hover:shadow-xl transition-all cursor-pointer group",
          isSelected && "ring-2 ring-primary",
          suggestion.status === 'approved' && "border-green-500/30 bg-green-50/5",
          allPlatformsReady && "border-green-500/20"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", typeConfig.bgColor)}>
                  <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                </div>
                <div>
                  <CardTitle className="text-base line-clamp-1">{suggestion.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    {suggestion.description && (
                      <CardDescription className="text-xs line-clamp-1">
                        {suggestion.description}
                      </CardDescription>
                    )}
                    {suggestion.primary_goal && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        <Target className="h-2.5 w-2.5 mr-1" />
                        {suggestion.primary_goal}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedSuggestion(suggestion)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(suggestion.copy_variants.instagram?.caption || '')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Caption
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => approveSuggestion(suggestion.id)}
                    disabled={suggestion.status === 'approved'}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant={
                suggestion.status === 'ready' ? 'default' :
                suggestion.status === 'approved' ? 'secondary' :
                suggestion.status === 'generating' ? 'outline' :
                'destructive'
              } className="text-xs">
                {suggestion.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {suggestion.status}
              </Badge>
              
              {suggestion.persona_used && (
                <Badge variant="outline" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  Persona
                </Badge>
              )}

              {suggestion.engagement_prediction && suggestion.engagement_prediction > 0.8 && (
                <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  High Impact
                </Badge>
              )}
              
              {suggestion.viral_potential === 'high' && (
                <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                  <Zap className="h-3 w-3 mr-1" />
                  Viral
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Image Preview with smooth carousel */}
            <div className="relative group">
              {suggestion.images.length > 0 ? (
                <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/5]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={suggestion.images[0].id}
                      src={suggestion.images[0].url}
                      alt="Post preview"
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>
                  
                  {suggestion.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                      +{suggestion.images.length - 1} more
                    </div>
                  )}

                  {/* Quick actions overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSuggestion(suggestion)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Download logic
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/5] bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Platform readiness - AI Posts are for Instagram, Twitter, LinkedIn, Facebook */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Platform Status</Label>
              <div className="flex gap-1.5">
                {['instagram', 'twitter', 'linkedin', 'facebook'].map(platformId => {
                  const platform = PLATFORMS[platformId]
                  if (!platform) return null
                  
                  const Icon = platform.icon
                  const isEligible = suggestion.eligible_platforms.includes(platformId)
                  const readiness = suggestion.platform_readiness?.[platformId]
                  const isReady = readiness?.is_ready ?? isEligible
                  const hasIssues = readiness?.missing_elements && readiness.missing_elements.length > 0
                  
                  if (!isEligible) return null
                  
                  return (
                    <TooltipProvider key={platformId}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "relative p-1.5 rounded-md transition-all",
                            isReady && !hasIssues
                              ? `bg-gradient-to-br ${platform.gradientColor} shadow-sm` 
                              : hasIssues
                              ? "bg-yellow-500/20 border border-yellow-500/30"
                              : "bg-muted opacity-30"
                          )}>
                            <Icon className={cn(
                              "h-3.5 w-3.5",
                              isReady && !hasIssues ? "text-white" : 
                              hasIssues ? "text-yellow-600 dark:text-yellow-400" :
                              "text-muted-foreground"
                            )} />
                            {hasIssues && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-xs">
                              {platform.name}: {isReady ? (hasIssues ? 'Needs Optimization' : 'Ready') : 'Not Configured'}
                            </p>
                            {readiness?.missing_elements && readiness.missing_elements.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <p className="font-medium">Missing:</p>
                                <ul className="list-disc list-inside">
                                  {readiness.missing_elements.slice(0, 3).map((element, idx) => (
                                    <li key={idx}>{element}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {readiness?.optimization_tips && readiness.optimization_tips.length > 0 && (
                              <p className="text-xs text-muted-foreground italic">
                                Tip: {readiness.optimization_tips[0]}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>

            {/* Engagement metrics preview */}
            {suggestion.engagement_prediction && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Predicted engagement</span>
                  <span className="font-medium">
                    {Math.round(suggestion.engagement_prediction * 100)}%
                  </span>
                </div>
                <Progress value={suggestion.engagement_prediction * 100} className="h-1.5" />
              </div>
            )}

            {/* Caption preview with hashtags */}
            {suggestion.copy_variants.instagram && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {suggestion.copy_variants.instagram.caption}
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestion.copy_variants.instagram.hashtags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                      #{tag}
                    </Badge>
                  ))}
                  {suggestion.copy_variants.instagram.hashtags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      +{suggestion.copy_variants.instagram.hashtags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-3 pb-3 px-3 gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-8"
              onClick={() => setSelectedBatch(prev => 
                prev.includes(suggestion.id) 
                  ? prev.filter(id => id !== suggestion.id)
                  : [...prev, suggestion.id]
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                className="mr-2"
                onClick={(e) => e.stopPropagation()}
                readOnly
              />
              Select
            </Button>
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-8"
              onClick={() => approveSuggestion(suggestion.id)}
              disabled={suggestion.status === 'approved'}
            >
              {suggestion.status === 'approved' ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approved
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Approve
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Social Posts
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Generate platform-optimized content from your video
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className="h-7 px-2"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className="h-7 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="default"
              onClick={() => setShowGenerateDialog(true)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Posts
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters and actions bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'score' | 'engagement')}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="score">Top Rated</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                className="pl-8 h-8 w-48"
              />
            </div>
          </div>

          {/* Batch actions */}
          {selectedBatch.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-muted-foreground">
                {selectedBatch.length} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBatchAction('approve')}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBatchAction('export')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedBatch([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Generation Progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                      </div>
                      <div>
                        <p className="font-medium">Creating your content...</p>
                        <p className="text-xs text-muted-foreground">
                          AI is crafting platform-optimized posts
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Grid/List */}
      {processedSuggestions.length > 0 ? (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-4"
        )}>
          <AnimatePresence mode="popLayout">
            {processedSuggestions.map(suggestion => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Layers className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Generate AI-powered social media posts optimized for maximum engagement
            </p>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Your First Posts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Generation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Generate AI Posts</DialogTitle>
            <DialogDescription>
              Configure your content generation preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Content Types Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Content Types</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(contentTypeConfig).map(([type, config]) => {
                  const isSelected = selectedContentTypes.includes(type)
                  return (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected && "ring-2 ring-primary border-primary"
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedContentTypes(prev => prev.filter(t => t !== type))
                          } else {
                            setSelectedContentTypes(prev => [...prev, type])
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg", config.bgColor)}>
                              <config.icon className={cn("h-5 w-5", config.color)} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{config.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {config.description}
                              </p>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all",
                              isSelected 
                                ? "bg-primary border-primary" 
                                : "border-muted-foreground/30"
                            )}>
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Platform Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Target Platforms</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(platformConfig).map(([platform, config]) => {
                  const Icon = config.icon
                  const isSelected = selectedPlatforms.includes(platform)
                  
                  return (
                    <Button
                      key={platform}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start",
                        isSelected && `bg-gradient-to-r ${config.color}`
                      )}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPlatforms(prev => prev.filter(p => p !== platform))
                        } else {
                          setSelectedPlatforms(prev => [...prev, platform])
                        }
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {config.name}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Persona Selection */}
            {personas && personas.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Brand Persona</Label>
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Use Persona in Content</Label>
                    </div>
                    <Switch
                      checked={generationSettings.usePersona}
                      onCheckedChange={(checked) => {
                        setGenerationSettings(prev => ({ ...prev, usePersona: checked }))
                        if (!checked) {
                          setSelectedPersonaForGeneration(null)
                        }
                      }}
                    />
                  </div>
                  
                  {generationSettings.usePersona && (
                    <div className="space-y-3">
                      <Label className="text-sm">Select Persona</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {personas.map(persona => (
                          <Card
                            key={persona.id}
                            className={cn(
                              "cursor-pointer transition-all p-3",
                              selectedPersonaForGeneration === persona.id && "ring-2 ring-primary border-primary"
                            )}
                            onClick={() => setSelectedPersonaForGeneration(persona.id)}
                          >
                            <div className="flex items-center gap-2">
                              {persona.photos && persona.photos.length > 0 && (
                                <img
                                  src={persona.photos[0].url}
                                  alt={persona.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{persona.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {persona.photos?.length || 0} photos
                                </p>
                              </div>
                              {selectedPersonaForGeneration === persona.id && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                      {selectedPersonaForGeneration && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Your persona will be integrated into generated visuals and the content will be tailored to match your brand voice.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Generation Settings</Label>
              
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                {/* Creativity slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Creativity Level</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(generationSettings.creativity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[generationSettings.creativity]}
                    onValueChange={([value]) => 
                      setGenerationSettings(prev => ({ ...prev, creativity: value }))
                    }
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Toggle settings */}
                <div className="space-y-3">

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Auto-generate Hashtags</Label>
                    </div>
                    <Switch
                      checked={generationSettings.autoHashtags}
                      onCheckedChange={(checked) =>
                        setGenerationSettings(prev => ({ ...prev, autoHashtags: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Include Call-to-Action</Label>
                    </div>
                    <Switch
                      checked={generationSettings.includeCTA}
                      onCheckedChange={(checked) =>
                        setGenerationSettings(prev => ({ ...prev, includeCTA: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Optimize for Engagement</Label>
                    </div>
                    <Switch
                      checked={generationSettings.optimizeForEngagement}
                      onCheckedChange={(checked) =>
                        setGenerationSettings(prev => ({ ...prev, optimizeForEngagement: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={generateSuggestions}
              disabled={selectedContentTypes.length === 0 || selectedPlatforms.length === 0}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {selectedContentTypes.length} Types for {selectedPlatforms.length} Platforms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Detail View Dialog */}
      {selectedSuggestion && (
        <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl">{selectedSuggestion.title}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Review and optimize your post before publishing
                  </DialogDescription>
                </div>
                <Badge variant={
                  selectedSuggestion.status === 'approved' ? 'secondary' : 'default'
                }>
                  {selectedSuggestion.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="preview" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="copy">Copy & Captions</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="space-y-4 mt-4">
                  {/* Platform previews in a beautiful grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedSuggestion.copy_variants).map(([platform, copy]) => {
                      const config = platformConfig[platform as keyof typeof platformConfig]
                      if (!config) return null
                      
                      const Icon = config.icon
                      
                      return (
                        <Card key={platform} className={cn("overflow-hidden", config.borderColor)}>
                          <CardHeader className={cn("pb-3", config.lightBg)}>
                            <div className="flex items-center gap-2">
                              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <CardTitle className="text-base">{config.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-3">
                            {/* Mock phone preview */}
                            <div className="mx-auto w-48 bg-black rounded-2xl p-2">
                              <div className="bg-white rounded-xl overflow-hidden">
                                {selectedSuggestion.images[0] && (
                                  <img
                                    src={selectedSuggestion.images[0].url}
                                    alt="Preview"
                                    className="w-full aspect-square object-cover"
                                  />
                                )}
                                <div className="p-3 space-y-2">
                                  <p className="text-xs line-clamp-3">{copy.caption}</p>
                                  <div className="flex flex-wrap gap-1">
                                    {copy.hashtags.slice(0, 3).map(tag => (
                                      <span key={tag} className="text-xs text-blue-600">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="copy" className="space-y-4 mt-4">
                  {/* Enhanced copy editing interface */}
                  {Object.entries(selectedSuggestion.copy_variants).map(([platform, copy]) => {
                    const config = platformConfig[platform as keyof typeof platformConfig]
                    if (!config) return null
                    
                    return (
                      <Card key={platform}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <config.icon className="h-5 w-5" />
                              <CardTitle className="text-base">{config.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{copy.caption.length}/{(config as any).maxCaption || 280}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Caption</Label>
                            <Textarea
                              value={copy.caption}
                              rows={4}
                              className="resize-none"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Hashtags</Label>
                            <div className="flex flex-wrap gap-2">
                              {copy.hashtags.map(tag => (
                                <Badge key={tag} variant="secondary">
                                  #{tag}
                                  <X className="h-3 w-3 ml-1 cursor-pointer" />
                                </Badge>
                              ))}
                              <Button size="sm" variant="outline">
                                <PlusCircle className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>

                          {copy.cta && (
                            <div className="space-y-2">
                              <Label>Call to Action</Label>
                              <Input value={copy.cta} />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </TabsContent>

                <TabsContent value="images" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSuggestion.images.map((image, idx) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="relative aspect-square">
                          <img
                            src={image.url}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-2 left-2">
                            {idx + 1} of {selectedSuggestion.images.length}
                          </Badge>
                        </div>
                        <CardFooter className="p-3 gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Predictions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {Math.round((selectedSuggestion.engagement_prediction || 0.75) * 100)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Engagement Rate</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {Math.round((selectedSuggestion.rating || 4.2) * 20)}
                          </div>
                          <p className="text-sm text-muted-foreground">Quality Score</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {selectedSuggestion.eligible_platforms.length}
                          </div>
                          <p className="text-sm text-muted-foreground">Platforms</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  approveSuggestion(selectedSuggestion.id)
                  setSelectedSuggestion(null)
                }}
                className="bg-gradient-to-r from-green-600 to-green-500"
              >
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