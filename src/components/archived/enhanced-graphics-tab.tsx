"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  IconSparkles,
  IconPhoto,
  IconWand,
  IconPalette,
  IconDownload,
  IconCopy,
  IconCheck,
  IconLoader2,
  IconSticker,
  IconUser,
  IconRocket,
  IconCalendar,
  IconHash,
  IconMoodHappy,
  IconLayoutGrid,
  IconQuote,
  IconEye,
  IconPlus,
  IconTemplate,
  IconInfoCircle,
  IconBrain,
  IconShare,
  IconMenu2,
  IconX,
  IconCrown,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { predefinedStyles } from "@/lib/ai-image-service"
import { SocialGraphicsGenerator } from "./social-graphics-generator"
import { SocialGraphicsDisplay } from "./social-graphics-display"
import { SmartGraphicsStudio } from "./smart-graphics-studio"
import { MagicCampaignStudio } from "./magic-campaign-studio"
import { PremiumCampaignStudio } from "./premium-campaign-studio"
import { FunctionalCampaignStudio } from "./functional-campaign-studio"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUser } from "@clerk/nextjs"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollBar } from "@/components/ui/scroll-area"

interface EnhancedGraphicsTabProps {
  project: any
  selectedPersona?: any
  contentAnalysis?: any
  onUpdate: () => void
}

interface QuickTemplate {
  id: string
  name: string
  icon: any
  description: string
  prompt: string
  color: string
  category: string
}

const quickTemplates: QuickTemplate[] = [
  {
    id: "quote",
    name: "Quote Card",
    icon: IconQuote,
    description: "Inspiring quotes from your content",
    prompt: "Create a motivational quote graphic with elegant typography",
    color: "from-purple-600 to-pink-600",
    category: "quote"
  },
  {
    id: "tips",
    name: "Tips & Tricks",
    icon: IconWand,
    description: "Educational tips in visual format",
    prompt: "Create a tips and tricks graphic with numbered list",
    color: "from-blue-600 to-cyan-600",
    category: "educational"
  },
  {
    id: "announcement",
    name: "Announcement",
    icon: IconRocket,
    description: "Product launches & updates",
    prompt: "Create an announcement graphic with bold design",
    color: "from-orange-600 to-red-600",
    category: "announcement"
  },
  {
    id: "carousel",
    name: "Carousel",
    icon: IconLayoutGrid,
    description: "Multi-slide storytelling",
    prompt: "Create a carousel slide with consistent branding",
    color: "from-green-600 to-teal-600",
    category: "carousel"
  },
  {
    id: "data",
    name: "Data Visual",
    icon: IconHash,
    description: "Statistics & insights",
    prompt: "Create a data visualization graphic with clean charts",
    color: "from-gray-600 to-gray-800",
    category: "data"
  },
  {
    id: "testimonial",
    name: "Testimonial",
    icon: IconMoodHappy,
    description: "Customer success stories",
    prompt: "Create a testimonial graphic with professional look",
    color: "from-indigo-600 to-purple-600",
    category: "quote"
  }
]

export function EnhancedGraphicsTab({
  project,
  selectedPersona,
  contentAnalysis,
  onUpdate
}: EnhancedGraphicsTabProps) {
  const [customPrompt, setCustomPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("realistic")
  const [selectedQuality, setSelectedQuality] = useState("medium")
  const [selectedSize, setSelectedSize] = useState("1024x1024")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState(project.folders?.images || [])
  const [usePersona, setUsePersona] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null)
  const [streamingProgress, setStreamingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<"generate" | "library">("generate")
  const [useSmartStudio, setUseSmartStudio] = useState(false)
  const [useMagicStudio, setUseMagicStudio] = useState(false)
  const [usePremiumStudio, setUsePremiumStudio] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const isMobile = useIsMobile()
  const { user } = useUser()
  const isPremiumUser = user?.publicMetadata?.tier === 'premium' || true // Enable for demo

  useEffect(() => {
    setGeneratedImages(project.folders?.images || [])
  }, [project.folders?.images])

  const handleGenerateFromTemplate = async (template: QuickTemplate) => {
    let prompt = template.prompt
    
    if (usePersona && selectedPersona) {
      prompt = `${prompt} featuring ${selectedPersona.name}`
    }
    
    if (contentAnalysis?.keywords?.length > 0) {
      prompt += `. Context: ${contentAnalysis.keywords.slice(0, 3).join(', ')}`
    }
    
    setCustomPrompt(prompt)
    setSelectedTemplate(template)
    
    // Auto-generate if template is selected
    handleGenerate(prompt)
  }

  const handleGenerate = async (promptOverride?: string) => {
    const prompt = promptOverride || customPrompt
    if (!prompt.trim()) {
      toast.error("Please enter a prompt or select a template")
      return
    }

    setIsGenerating(true)
    setStreamingProgress(0)

    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          prompt,
          quality: selectedQuality,
          size: selectedSize,
          style: selectedStyle,
          n: 1,
          personalPhotos: usePersona && selectedPersona?.photos ? 
            selectedPersona.photos.map((photo: any) => photo.url) : [],
          personaName: usePersona ? selectedPersona?.name : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate image')
      }

      const result = await response.json()
      if (result.images && result.images.length > 0) {
        setGeneratedImages((prev: any[]) => [...result.images, ...prev])
        toast.success("Image generated successfully!")
        await onUpdate()
        setCustomPrompt("")
        setSelectedTemplate(null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate image")
      console.error("Image generation error:", error)
    } finally {
      setIsGenerating(false)
      setStreamingProgress(0)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleBulkDownload = () => {
    selectedImages.forEach((imageId) => {
      const image = generatedImages.find((img: any) => img.id === imageId)
      if (image) {
        const link = document.createElement('a')
        link.href = image.url
        link.download = `social-graphic-${image.id}.png`
        link.click()
      }
    })
    toast.success(`Downloading ${selectedImages.size} images...`)
  }

  const handleBulkDelete = () => {
    const confirmed = confirm(`Delete ${selectedImages.size} images?`)
    if (!confirmed) return
    
    const updatedImages = generatedImages.filter((img: any) => !selectedImages.has(img.id))
    setGeneratedImages(updatedImages)
    setSelectedImages(new Set())
    toast.success(`Deleted ${selectedImages.size} images`)
    onUpdate()
  }

  const handleShareImage = async (image: any) => {
    if ('share' in navigator) {
      try {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const file = new File([blob], `social-graphic.png`, { type: blob.type })
        
        await navigator.share({
          title: 'Social Graphic',
          text: image.prompt || 'Check out this graphic!',
          files: [file]
        })
      } catch (error) {
        // Fallback to copying URL
        await navigator.clipboard.writeText(image.url)
        toast.success('Link copied!')
      }
    } else {
      navigator.clipboard.writeText(image.url)
      toast.success('Link copied!')
    }
  }

  // Render appropriate studio based on selected mode
  if (usePremiumStudio && isPremiumUser) {
    return (
      <PremiumCampaignStudio
        project={project}
        transcription={project.transcription}
        contentAnalysis={contentAnalysis}
        selectedPersona={selectedPersona}
        onUpdate={onUpdate}
      />
    )
  }
  
  if (useMagicStudio) {
    return (
      <FunctionalCampaignStudio
        project={project}
        transcription={project.transcription}
        onUpdate={onUpdate}
      />
    )
  }

  if (useSmartStudio) {
    return (
      <SmartGraphicsStudio
        project={project}
        selectedPersona={selectedPersona}
        contentAnalysis={contentAnalysis}
        transcription={project.transcription}
        onUpdate={onUpdate}
      />
    )
  }

  // Otherwise, render the regular interface
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Social Media Studio
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Transform your video into social media content with AI
            </p>
          </div>
                      <div className="flex items-center gap-2 sm:gap-3">
              <Tabs 
                value={
                  usePremiumStudio ? "premium" : 
                  useMagicStudio ? "campaign" : 
                  useSmartStudio ? "ai-assisted" : 
                  "manual"
                } 
                onValueChange={(value) => {
                  setUsePremiumStudio(value === "premium")
                  setUseMagicStudio(value === "campaign")
                  setUseSmartStudio(value === "ai-assisted")
                }}
                className="w-auto"
              >
                <TabsList className={cn(
                  "grid w-full",
                  isPremiumUser ? "grid-cols-4" : "grid-cols-3"
                )}>
                  <TabsTrigger value="manual" className="text-xs sm:text-sm">
                    <IconPhoto className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Create</span>
                    <span className="sm:hidden">Create</span>
                  </TabsTrigger>
                  <TabsTrigger value="ai-assisted" className="text-xs sm:text-sm">
                    <IconBrain className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">AI Assist</span>
                    <span className="sm:hidden">AI</span>
                  </TabsTrigger>
                  <TabsTrigger value="campaign" className="text-xs sm:text-sm">
                    <IconRocket className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Campaign</span>
                    <span className="sm:hidden">Campaign</span>
                  </TabsTrigger>
                  {isPremiumUser && (
                    <TabsTrigger 
                      value="premium" 
                      className="text-xs sm:text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-700 data-[state=active]:to-orange-700"
                    >
                      <IconCrown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Premium</span>
                      <span className="sm:hidden">Pro</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline">
                    <IconMenu2 className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Quick Actions</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <SocialGraphicsGenerator
                      projectId={project.id}
                      projectTitle={project.title}
                      contentAnalysis={contentAnalysis}
                      selectedPersona={selectedPersona}
                      onGraphicsGenerated={(graphics) => {
                        onUpdate()
                        toast.success(`Generated ${graphics.length} social graphics!`)
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <SocialGraphicsGenerator
                projectId={project.id}
                projectTitle={project.title}
                contentAnalysis={contentAnalysis}
                selectedPersona={selectedPersona}
                onGraphicsGenerated={(graphics) => {
                  onUpdate()
                  toast.success(`Generated ${graphics.length} social graphics!`)
                }}
              />
            )}
          </div>
              </div>
      
      {/* Mode Description */}
      <Alert className={cn(
        "border-primary/20 bg-primary/5",
        usePremiumStudio && "border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5"
      )}>
        <AlertDescription className="text-sm">
          {usePremiumStudio ? (
            <>
              <strong className="text-amber-700 dark:text-amber-300">Premium Mode:</strong> Enterprise-grade AI with trend analysis, competitor intelligence, A/B testing, performance predictions, and ROI projections. Generate 20-30 optimized posts with 85%+ viral probability.
            </>
          ) : useMagicStudio ? (
            <>
              <strong>Full Campaign Mode:</strong> AI analyzes your video and generates a complete 2-week social media campaign with 15-20 posts, including captions, hashtags, and optimal posting times.
            </>
          ) : useSmartStudio ? (
            <>
              <strong>AI Assistant Mode:</strong> Get intelligent suggestions for graphics based on your video content. AI recommends the best visuals for different platforms.
            </>
          ) : (
            <>
              <strong>Manual Mode:</strong> Create custom graphics with full control over design, text, and styling. Perfect for specific branding needs.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <IconPhoto className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{generatedImages.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <IconTemplate className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{quickTemplates.length}</p>
                  <p className="text-xs text-muted-foreground">Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <IconSparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">AI</p>
                  <p className="text-xs text-muted-foreground">Powered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <IconPalette className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{predefinedStyles.length}</p>
                  <p className="text-xs text-muted-foreground">Styles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="generate" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <IconSparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <IconPhoto className="h-3 w-3 sm:h-4 sm:w-4" />
            Library ({generatedImages.length})
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab - Mobile Optimized */}
        <TabsContent value="generate" className="space-y-4 sm:space-y-6">
          {/* Quick Templates - Mobile Scroll */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3">Quick Templates</h3>
            <ScrollArea className={cn(
              "pb-3",
              isMobile ? "w-full" : ""
            )}>
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-flow-col grid-rows-2 auto-cols-[200px]" : "grid-cols-2 md:grid-cols-3"
              )}>
                {quickTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg",
                        selectedTemplate?.id === template.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleGenerateFromTemplate(template)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            template.color
                          )}>
                            <template.icon className={cn(
                              "h-4 w-4 sm:h-5 sm:w-5",
                              template.iconColor
                            )} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{template.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {isMobile && <ScrollBar orientation="horizontal" />}
            </ScrollArea>
          </div>

          {/* Custom Generation - Mobile Optimized */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Custom Generation</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Create graphics with your own prompt and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-sm">
                  Prompt
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconInfoCircle className="h-3 w-3 ml-1 inline-block text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="text-xs">Describe what you want to create. Be specific!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="A modern social media post about..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Settings Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Style Selection */}
                <div className="space-y-2">
                  <Label htmlFor="style" className="text-sm">Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger id="style" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quality Selection */}
                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-sm">Quality</Label>
                  <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                    <SelectTrigger id="quality" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Faster)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Slower)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Size Selection */}
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-sm">Size</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger id="size" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">Square (1:1)</SelectItem>
                      <SelectItem value="1536x1024">Landscape (3:2)</SelectItem>
                      <SelectItem value="1024x1536">Portrait (2:3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Persona Toggle */}
              {selectedPersona && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
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
                    Include {selectedPersona.name} in graphics
                  </Label>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !customPrompt.trim()}
                className="w-full"
                size={isMobile ? "default" : "lg"}
              >
                {isGenerating ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating... {streamingProgress > 0 && `${streamingProgress}%`}
                  </>
                ) : (
                  <>
                    <IconSparkles className="h-4 w-4 mr-2" />
                    Generate Graphic
                  </>
                )}
              </Button>

              {streamingProgress > 0 && (
                <Progress value={streamingProgress} className="w-full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library Tab - Mobile Optimized */}
        <TabsContent value="library" className="space-y-4">
          {generatedImages.length > 0 ? (
            <>
              {/* Library Controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">
                  Your Graphics
                  {selectedImages.size > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedImages.size} selected
                    </Badge>
                  )}
                </h3>
                {selectedImages.size > 0 && (
                  <div className="flex gap-2">
                    {isMobile ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleBulkDownload}>
                            <IconDownload className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={handleBulkDelete}
                            className="text-destructive"
                          >
                            <IconX className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
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
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Graphics Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((image, index) => {
                  const isSelected = selectedImages.has(image.id)
                  
                  return (
                    <motion.div
                      key={image.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={cn(
                          "overflow-hidden hover:shadow-xl transition-all cursor-pointer",
                          isSelected && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          const newSelected = new Set(selectedImages)
                          if (isSelected) {
                            newSelected.delete(image.id)
                          } else {
                            newSelected.add(image.id)
                          }
                          setSelectedImages(newSelected)
                        }}
                      >
                        <div className="aspect-square relative bg-muted">
                          <img
                            src={image.url}
                            alt={image.prompt || "Generated graphic"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {image.platform && (
                            <Badge className="absolute top-2 left-2 text-xs">
                              {image.platform}
                            </Badge>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <IconCheck className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3 sm:p-4 space-y-3">
                          <p className="text-xs sm:text-sm font-medium line-clamp-2">
                            {image.prompt || "AI Generated Graphic"}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                const link = document.createElement('a')
                                link.href = image.url
                                link.download = `social-graphic-${image.id}.png`
                                link.click()
                              }}
                            >
                              <IconDownload className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(image.url)
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
                                  handleShareImage(image)
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
            </>
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <IconPhoto className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No graphics yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Generate your first graphic using templates or custom prompts
              </p>
              <Button onClick={() => setActiveTab("generate")}>
                <IconSparkles className="h-4 w-4 mr-2" />
                Start Creating
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 