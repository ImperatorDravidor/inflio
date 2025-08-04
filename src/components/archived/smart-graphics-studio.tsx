"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconSparkles,
  IconPhoto,
  IconWand,
  IconRocket,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandTiktok,
  IconLoader2,
  IconCheck,
  IconDownload,
  IconCopy,
  IconEye,
  IconTrendingUp,
  IconClock,
  IconAlertCircle,
  IconRefresh,
  IconPlus,
  IconLayoutGrid,
  IconQuote,
  IconChartBar,
  IconBulb,
  IconCalendar,
  IconHash,
  IconUser,
  IconArrowRight,
  IconTarget,
  IconBrain,
  IconSettings,
  IconFilter,
  IconSortAscending,
  IconDeviceMobile,
  IconMenu2,
  IconX,
  IconShare,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AIGraphicsSuggestionsService, type PlatformContentPlan, type GraphicsSuggestion } from "@/lib/ai-graphics-suggestions"
import { ProjectGraphicsService, type ProjectGraphic } from "@/lib/project-graphics-service"
import { format } from "date-fns"
import { useIsMobile } from "@/hooks/use-mobile"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

interface SmartGraphicsStudioProps {
  project: any
  selectedPersona?: any
  contentAnalysis?: any
  transcription?: any
  onUpdate: () => void
}

const platformIcons = {
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  youtube: IconBrandYoutube,
  tiktok: IconBrandTiktok
}

const platformColors = {
  instagram: 'from-purple-600 to-pink-600',
  twitter: 'from-blue-500 to-blue-600',
  linkedin: 'from-blue-700 to-blue-800',
  youtube: 'from-red-500 to-red-600',
  tiktok: 'from-gray-800 to-black'
}

const typeIcons = {
  quote: IconQuote,
  statistic: IconChartBar,
  tip: IconBulb,
  announcement: IconRocket,
  story: IconLayoutGrid,
  carousel: IconLayoutGrid,
  thumbnail: IconPhoto
}

export function SmartGraphicsStudio({
  project,
  selectedPersona,
  contentAnalysis,
  transcription,
  onUpdate
}: SmartGraphicsStudioProps) {
  const [activeTab, setActiveTab] = useState<"suggestions" | "generate" | "library">("suggestions")
  const [platformPlans, setPlatformPlans] = useState<PlatformContentPlan[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'twitter', 'linkedin'])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedGraphics, setGeneratedGraphics] = useState<ProjectGraphic[]>([])
  const [usePersona, setUsePersona] = useState(true)
  const [autoBatchSize, setAutoBatchSize] = useState(5)
  const [filterPlatform, setFilterPlatform] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "engagement" | "priority">("date")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedGraphics, setSelectedGraphics] = useState<Set<string>>(new Set())
  const [loadingGraphics, setLoadingGraphics] = useState(true)
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced")
  
  const isMobile = useIsMobile()
  const [isTablet, setIsTablet] = useState(false)
  
  // Check for tablet size
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth <= 1024)
    }
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

  // Real-time sync subscription
  useEffect(() => {
    if (!project.id) return

    // Subscribe to changes
    const supabase = createSupabaseBrowserClient()
    const subscription = supabase
      .channel(`graphics-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_graphics',
          filter: `project_id=eq.${project.id}`
        },
        (payload: any) => {
          setSyncStatus("syncing")
          
          if (payload.eventType === 'INSERT') {
            const newGraphic = payload.new as any
            setGeneratedGraphics(prev => [
              {
                id: newGraphic.id,
                url: newGraphic.url,
                platform: newGraphic.platform,
                size: newGraphic.size,
                template: newGraphic.template,
                prompt: newGraphic.prompt,
                metadata: newGraphic.metadata,
                createdAt: newGraphic.created_at
              },
              ...prev
            ])
          } else if (payload.eventType === 'DELETE') {
            setGeneratedGraphics(prev => prev.filter(g => g.id !== payload.old.id))
          }
          
          setTimeout(() => setSyncStatus("synced"), 1000)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [project.id])

  // Load graphics with better error handling
  const loadGraphics = useCallback(async () => {
    if (!project.id) return
    
    setLoadingGraphics(true)
    try {
      const graphics = await ProjectGraphicsService.getProjectGraphics(project.id)
      setGeneratedGraphics(graphics)
      setSyncStatus("synced")
    } catch (error) {
      console.error("Failed to load graphics:", error)
      setSyncStatus("error")
      toast.error("Failed to load graphics")
    } finally {
      setLoadingGraphics(false)
    }
  }, [project.id])

  // Load graphics on mount
  useEffect(() => {
    loadGraphics()
  }, [loadGraphics])

  // Filtered and sorted graphics
  const processedGraphics = useMemo(() => {
    let filtered = generatedGraphics
    
    // Apply platform filter
    if (filterPlatform !== "all") {
      filtered = ProjectGraphicsService.filterByPlatform(filtered, filterPlatform)
    }
    
    // Apply sorting
    switch (sortBy) {
      case "engagement":
        return ProjectGraphicsService.sortByEngagement(filtered)
      case "priority":
        return filtered.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          const aPriority = priorityOrder[a.metadata?.priority as keyof typeof priorityOrder] ?? 3
          const bPriority = priorityOrder[b.metadata?.priority as keyof typeof priorityOrder] ?? 3
          return aPriority - bPriority
        })
      case "date":
      default:
        return ProjectGraphicsService.sortByDate(filtered)
    }
  }, [generatedGraphics, filterPlatform, sortBy])

  // Analyze content and generate suggestions
  const analyzeContent = async () => {
    if (!contentAnalysis || !transcription) {
      toast.error("Please wait for content analysis to complete")
      return
    }

    setIsAnalyzing(true)
    try {
      const plans = await AIGraphicsSuggestionsService.generateContentPlan(
        contentAnalysis,
        transcription,
        project.title,
        selectedPlatforms
      )
      
      setPlatformPlans(plans)
      
      // Auto-select high priority suggestions
      const highPrioritySuggestions = new Set<string>()
      plans.forEach(plan => {
        plan.graphics
          .filter(g => g.priority === 'high')
          .forEach(g => highPrioritySuggestions.add(g.id))
      })
      setSelectedSuggestions(highPrioritySuggestions)
      
      toast.success(`Generated ${plans.reduce((sum, p) => sum + p.graphics.length, 0)} content suggestions!`)
    } catch (error) {
      toast.error("Failed to analyze content")
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate selected graphics with better error handling
  const generateSelectedGraphics = async () => {
    const suggestions = Array.from(selectedSuggestions).map(id => {
      for (const plan of platformPlans) {
        const suggestion = plan.graphics.find(g => g.id === id)
        if (suggestion) return suggestion
      }
      return null
    }).filter(Boolean) as GraphicsSuggestion[]

    if (suggestions.length === 0) {
      toast.error("Please select graphics to generate")
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setSyncStatus("syncing")
    
    try {
      let completed = 0
      const results: any[] = []
      
      // Process in batches
      for (let i = 0; i < suggestions.length; i += autoBatchSize) {
        const batch = suggestions.slice(i, i + autoBatchSize)
        
        const batchResults = await Promise.all(
          batch.map(async (suggestion) => {
            try {
              const response = await fetch('/api/generate-social-graphics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId: project.id,
                  prompt: suggestion.prompt,
                  platform: suggestion.platform,
                  size: suggestion.size,
                  template: suggestion.type,
                  quality: 'high',
                  personalPhotos: usePersona && selectedPersona?.photos ? 
                    selectedPersona.photos.map((p: any) => p.url) : [],
                  personaName: usePersona ? selectedPersona?.name : undefined,
                  style: suggestion.style,
                  customText: suggestion.contentElements.text,
                  background: suggestion.style === 'minimal' ? 'transparent' : 'opaque',
                  metadata: {
                    suggestionId: suggestion.id,
                    priority: suggestion.priority,
                    estimatedEngagement: suggestion.estimatedEngagement,
                    bestTimeToPost: suggestion.bestTimeToPost
                  }
                })
              })
              
              if (response.ok) {
                const result = await response.json()
                completed++
                setGenerationProgress((completed / suggestions.length) * 100)
                return result.graphics
              }
            } catch (error) {
              console.error(`Failed to generate ${suggestion.id}:`, error)
              return []
            }
          })
        )
        
        results.push(...batchResults.flat())
        
        // Add delay between batches to avoid rate limiting
        if (i + autoBatchSize < suggestions.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      toast.success(`Generated ${results.length} graphics successfully!`)
      await onUpdate()
      
      // Clear selections after generation
      setSelectedSuggestions(new Set())
      setActiveTab("library")
      setSyncStatus("synced")
      
    } catch (error) {
      toast.error("Failed to generate graphics")
      console.error(error)
      setSyncStatus("error")
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedGraphics.size === 0) return
    
    const confirmed = confirm(`Delete ${selectedGraphics.size} graphics?`)
    if (!confirmed) return
    
    setSyncStatus("syncing")
    let deleted = 0
    
    for (const graphicId of selectedGraphics) {
      const success = await ProjectGraphicsService.deleteGraphic(project.id, graphicId)
      if (success) deleted++
    }
    
    toast.success(`Deleted ${deleted} graphics`)
    setSelectedGraphics(new Set())
    setSyncStatus("synced")
    await loadGraphics()
  }

  const handleBulkDownload = async () => {
    const graphics = processedGraphics.filter(g => selectedGraphics.has(g.id))
    if (graphics.length === 0) return
    
    toast.info(`Downloading ${graphics.length} graphics...`)
    await ProjectGraphicsService.bulkDownload(graphics)
  }

  // Auto-analyze on load if we have content
  useEffect(() => {
    if (contentAnalysis && transcription && platformPlans.length === 0) {
      analyzeContent()
    }
  }, [contentAnalysis, transcription])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'a':
            if (activeTab === 'library') {
              e.preventDefault()
              setSelectedGraphics(new Set(processedGraphics.map(g => g.id)))
            }
            break
          case 'd':
            if (selectedGraphics.size > 0) {
              e.preventDefault()
              handleBulkDownload()
            }
            break
          case 'r':
            e.preventDefault()
            analyzeContent()
            break
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [activeTab, processedGraphics, selectedGraphics])

  const totalSuggestions = platformPlans.reduce((sum, plan) => sum + plan.graphics.length, 0)
  const highPrioritySuggestions = platformPlans.reduce(
    (sum, plan) => sum + plan.graphics.filter(g => g.priority === 'high').length, 
    0
  )

  // Mobile-friendly header
  const HeaderContent = () => (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
          <IconBrain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Smart Graphics Studio
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          AI-powered graphics for every platform
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Sync Status Indicator */}
        <Badge 
          variant={syncStatus === "synced" ? "secondary" : syncStatus === "syncing" ? "default" : "destructive"}
          className="text-xs"
        >
          {syncStatus === "synced" && <IconCheck className="h-3 w-3 mr-1" />}
          {syncStatus === "syncing" && <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />}
          {syncStatus === "error" && <IconAlertCircle className="h-3 w-3 mr-1" />}
          {syncStatus}
        </Badge>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={analyzeContent}
                disabled={isAnalyzing}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <IconRefresh className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh AI suggestions (⌘R)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )

  // Mobile-friendly stats cards
  const StatsCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Suggestions</p>
              <p className="text-lg sm:text-2xl font-bold">{totalSuggestions}</p>
            </div>
            <IconSparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500/20" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Priority</p>
              <p className="text-lg sm:text-2xl font-bold">{highPrioritySuggestions}</p>
            </div>
            <IconTarget className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500/20" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Generated</p>
              <p className="text-lg sm:text-2xl font-bold">{generatedGraphics.length}</p>
            </div>
            <IconCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-500/20" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Platforms</p>
              <p className="text-lg sm:text-2xl font-bold">{selectedPlatforms.length}</p>
            </div>
            <IconLayoutGrid className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Smart Insights */}
      <div className="space-y-4">
        <HeaderContent />
        <StatsCards />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="suggestions" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
            <IconWand className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">AI</span> Suggestions
            {selectedSuggestions.size > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedSuggestions.size}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
            <IconSparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
            <IconPhoto className="h-3 w-3 sm:h-4 sm:w-4" />
            Library
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {generatedGraphics.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4 sm:space-y-6">
          {isAnalyzing ? (
            <Card className="p-8 sm:p-12 text-center">
              <IconBrain className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Analyzing Your Content...</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                AI is extracting key insights and generating platform-specific suggestions
              </p>
            </Card>
          ) : platformPlans.length > 0 ? (
            <>
              {/* Platform Selection - Mobile Sheet */}
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <IconFilter className="h-4 w-4" />
                      Select Platforms ({selectedPlatforms.length})
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom">
                    <SheetHeader>
                      <SheetTitle>Select Platforms</SheetTitle>
                      <SheetDescription>
                        Choose which platforms to generate content for
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 py-4">
                      {Object.entries(platformIcons).map(([platform, Icon]) => (
                        <label
                          key={platform}
                          className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted"
                        >
                          <Checkbox
                            checked={selectedPlatforms.includes(platform)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPlatforms([...selectedPlatforms, platform])
                              } else {
                                setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                              }
                            }}
                          />
                          <Icon className="h-5 w-5" />
                          <span className="capitalize font-medium">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="flex items-center gap-4 flex-wrap">
                  <Label>Select Platforms:</Label>
                  {Object.entries(platformIcons).map(([platform, Icon]) => (
                    <label
                      key={platform}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(platform)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform])
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                          }
                        }}
                      />
                      <Icon className="h-4 w-4" />
                      <span className="text-sm capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Platform Content Plans */}
              <div className="space-y-4">
                {platformPlans
                  .filter(plan => selectedPlatforms.includes(plan.platform))
                  .map((plan) => {
                    const Icon = platformIcons[plan.platform as keyof typeof platformIcons]
                    const gradientColor = platformColors[plan.platform as keyof typeof platformColors]
                    
                    return (
                      <Card key={plan.platform} className="overflow-hidden">
                        <CardHeader className={cn(
                          "text-white bg-gradient-to-r",
                          gradientColor,
                          "p-4 sm:p-6"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                              <div>
                                <CardTitle className="text-base sm:text-lg capitalize">
                                  {plan.platform} Content
                                </CardTitle>
                                <CardDescription className="text-white/80 text-xs sm:text-sm">
                                  {plan.totalGraphics} optimized graphics
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const platformIds = new Set(selectedSuggestions)
                                plan.graphics.forEach(g => platformIds.add(g.id))
                                setSelectedSuggestions(platformIds)
                              }}
                              className="text-xs sm:text-sm"
                            >
                              Select All
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="p-3 sm:p-4 bg-muted/50">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              <strong>Strategy:</strong> {plan.strategy}
                            </p>
                          </div>
                          
                          <ScrollArea className="h-[300px] sm:h-[400px]">
                            <div className="p-3 sm:p-4 space-y-3">
                              {plan.graphics.map((suggestion) => {
                                const TypeIcon = typeIcons[suggestion.type as keyof typeof typeIcons]
                                const isSelected = selectedSuggestions.has(suggestion.id)
                                
                                return (
                                  <motion.div
                                    key={suggestion.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                  >
                                    <Card
                                      className={cn(
                                        "cursor-pointer transition-all",
                                        isSelected && "ring-2 ring-primary shadow-lg"
                                      )}
                                      onClick={() => {
                                        const newSelected = new Set(selectedSuggestions)
                                        if (isSelected) {
                                          newSelected.delete(suggestion.id)
                                        } else {
                                          newSelected.add(suggestion.id)
                                        }
                                        setSelectedSuggestions(newSelected)
                                      }}
                                    >
                                      <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-start gap-3">
                                          <div className={cn(
                                            "p-1.5 sm:p-2 rounded-lg",
                                            suggestion.priority === 'high' 
                                              ? "bg-orange-500/20" 
                                              : suggestion.priority === 'medium'
                                              ? "bg-blue-500/20"
                                              : "bg-gray-500/20"
                                          )}>
                                            <TypeIcon className={cn(
                                              "h-4 w-4 sm:h-5 sm:w-5",
                                              suggestion.priority === 'high' 
                                                ? "text-orange-500" 
                                                : suggestion.priority === 'medium'
                                                ? "text-blue-500"
                                                : "text-gray-500"
                                            )} />
                                          </div>
                                          
                                          <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <h4 className="font-semibold text-sm sm:text-base">
                                                  {suggestion.title}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                  {suggestion.description}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {suggestion.priority === 'high' && (
                                                  <Badge variant="destructive" className="text-xs">
                                                    High
                                                  </Badge>
                                                )}
                                                <Checkbox
                                                  checked={isSelected}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="h-4 w-4"
                                                />
                                              </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                              <div className="flex items-center gap-1">
                                                <IconTrendingUp className="h-3 w-3" />
                                                {suggestion.estimatedEngagement}%
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <IconClock className="h-3 w-3" />
                                                {suggestion.bestTimeToPost}
                                              </div>
                                              <Badge variant="secondary" className="text-xs">
                                                {suggestion.size}
                                              </Badge>
                                            </div>
                                            
                                            {suggestion.contentElements.text && (
                                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                                <p className="line-clamp-2">
                                                  {suggestion.contentElements.text}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </>
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <IconWand className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Suggestions Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Click analyze to generate AI-powered content suggestions
              </p>
              <Button onClick={analyzeContent} disabled={!contentAnalysis || !transcription}>
                <IconSparkles className="h-4 w-4 mr-2" />
                Analyze Content
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Batch Generation Settings</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure how graphics are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Persona Toggle */}
              {selectedPersona && (
                <div className="flex items-center space-x-2 p-3 sm:p-4 rounded-lg bg-muted/50">
                  <Checkbox
                    id="use-persona"
                    checked={usePersona}
                    onCheckedChange={(checked) => setUsePersona(checked === true)}
                  />
                  <Label
                    htmlFor="use-persona"
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <IconUser className="h-4 w-4" />
                    Include {selectedPersona.name} in all graphics
                  </Label>
                </div>
              )}
              
              {/* Batch Size */}
              <div className="space-y-2">
                <Label className="text-sm">Batch Size (graphics generated at once)</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={autoBatchSize}
                    onChange={(e) => setAutoBatchSize(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{autoBatchSize}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Smaller batches are more reliable, larger batches are faster
                </p>
              </div>
              
              {/* Selected Summary */}
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  <strong>{selectedSuggestions.size}</strong> graphics selected • 
                  Estimated time: {Math.ceil(selectedSuggestions.size / autoBatchSize) * 10} seconds
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={generateSelectedGraphics}
                disabled={isGenerating || selectedSuggestions.size === 0}
                className="w-full"
                size={isMobile ? "default" : "lg"}
              >
                {isGenerating ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating... {Math.round(generationProgress)}%
                  </>
                ) : (
                  <>
                    <IconRocket className="h-4 w-4 mr-2" />
                    Generate {selectedSuggestions.size} Graphics
                  </>
                )}
              </Button>
              
              {isGenerating && (
                <Progress value={generationProgress} className="w-full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4 sm:space-y-6">
          {loadingGraphics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : generatedGraphics.length > 0 ? (
            <>
              {/* Library Controls */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">
                    Generated Graphics ({processedGraphics.length})
                  </h3>
                  {selectedGraphics.size > 0 && (
                    <Badge variant="secondary">
                      {selectedGraphics.size} selected
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Mobile Actions Menu */}
                  {isMobile && selectedGraphics.size > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleBulkDownload}>
                          <IconDownload className="h-4 w-4 mr-2" />
                          Download Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      {/* Desktop Actions */}
                      {selectedGraphics.size > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDownload}
                          >
                            <IconDownload className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="text-destructive"
                          >
                            <IconTrash className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Filters */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <IconFilter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Platform</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setFilterPlatform("all")}>
                        All Platforms
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {Object.keys(platformIcons).map(platform => (
                        <DropdownMenuItem
                          key={platform}
                          onClick={() => setFilterPlatform(platform)}
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <IconSortAscending className="h-4 w-4 mr-2" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("date")}>
                        Date Created
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("engagement")}>
                        Engagement
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("priority")}>
                        Priority
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* View Mode Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    <IconLayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Graphics Grid/List */}
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              )}>
                {processedGraphics.map((graphic, index) => {
                  const Icon = platformIcons[graphic.platform as keyof typeof platformIcons] || IconPhoto
                  const isSelected = selectedGraphics.has(graphic.id)
                  
                  return (
                    <motion.div
                      key={graphic.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={cn(
                          "overflow-hidden transition-all cursor-pointer",
                          isSelected && "ring-2 ring-primary",
                          viewMode === "list" && "flex flex-row"
                        )}
                        onClick={() => {
                          const newSelected = new Set(selectedGraphics)
                          if (isSelected) {
                            newSelected.delete(graphic.id)
                          } else {
                            newSelected.add(graphic.id)
                          }
                          setSelectedGraphics(newSelected)
                        }}
                      >
                        <div className={cn(
                          "relative bg-muted",
                          viewMode === "grid" ? "aspect-square" : "w-32 h-32 sm:w-48 sm:h-48"
                        )}>
                          <img
                            src={graphic.url}
                            alt={graphic.prompt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 flex gap-2">
                            <Badge className="gap-1 text-xs">
                              <Icon className="h-3 w-3" />
                              {graphic.platform}
                            </Badge>
                            {graphic.metadata?.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                High
                              </Badge>
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <IconCheck className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className={cn(
                          "space-y-3",
                          viewMode === "grid" ? "p-3 sm:p-4" : "flex-1 p-3 sm:p-4"
                        )}>
                          <p className="text-xs sm:text-sm font-medium line-clamp-2">
                            {graphic.prompt}
                          </p>
                          
                          {graphic.metadata?.estimatedEngagement && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <IconTrendingUp className="h-3 w-3" />
                                {graphic.metadata.estimatedEngagement}%
                              </span>
                              {graphic.metadata.bestTimeToPost && (
                                <span className="flex items-center gap-1">
                                  <IconClock className="h-3 w-3" />
                                  {graphic.metadata.bestTimeToPost}
                                </span>
                              )}
                              {graphic.createdAt && (
                                <span>
                                  {format(new Date(graphic.createdAt), 'MMM d')}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                const link = document.createElement('a')
                                link.href = graphic.url
                                link.download = `${graphic.platform}-${graphic.id}.png`
                                link.click()
                              }}
                            >
                              <IconDownload className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={async (e) => {
                                e.stopPropagation()
                                const success = await ProjectGraphicsService.copyToClipboard(graphic)
                                toast.success(success ? 'Copied!' : 'Failed to copy')
                              }}
                            >
                              <IconCopy className="h-4 w-4" />
                            </Button>
                            {'share' in navigator && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  ProjectGraphicsService.shareGraphic(graphic)
                                }}
                              >
                                <IconShare className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
              
              {/* Keyboard Shortcuts Help */}
              {!isMobile && (
                <div className="text-xs text-muted-foreground text-center mt-4">
                  <kbd className="px-2 py-1 bg-muted rounded">⌘A</kbd> Select All • 
                  <kbd className="px-2 py-1 bg-muted rounded ml-2">⌘D</kbd> Download Selected
                </div>
              )}
            </>
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <IconPhoto className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No graphics yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Generate graphics from AI suggestions or create custom ones
              </p>
              <Button onClick={() => setActiveTab("suggestions")}>
                <IconWand className="h-4 w-4 mr-2" />
                View AI Suggestions
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 