"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  IconSparkles,
  IconPhoto,
  IconDownload,
  IconTrash,
  IconEdit,
  IconCopy,
  IconCheck,
  IconX,
  IconLoader2,
  IconWand,
  IconPalette,
  IconTypography,
  IconUpload,
  IconPlus,
  IconLayoutGrid as IconGrid,
  IconList,
  IconEye,
  IconRefresh,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandTiktok,
  IconInfoCircle,
  IconUserCircle,
  IconTemplate,
  IconAspectRatio,
  IconRocket,
  IconCalendar,
  IconHash,
  IconAlertCircle,
  IconArrowRight,
  IconLayoutGrid,
  IconSettings,
  IconExternalLink,
  IconMoodHappy,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  PLATFORM_SPECS,
  GRAPHICS_TEMPLATES,
  CONTENT_SUGGESTIONS,
  type GraphicsTemplate
} from "@/lib/social-graphics-config"

interface ProjectGraphicsSectionProps {
  projectId: string
  projectTitle: string
  contentAnalysis?: any
  selectedPersona?: any
  existingGraphics?: any[]
  onGraphicsUpdate?: () => void
}

interface QuickTemplate {
  id: string
  name: string
  icon: any
  description: string
  prompt: string
  platforms: string[]
  style: string
  color: string
}

const quickTemplates: QuickTemplate[] = [
  {
    id: "quote",
    name: "Motivational Quote",
    icon: IconMoodHappy,
    description: "Inspiring quotes from your video",
    prompt: "Create an inspiring quote graphic with elegant typography",
    platforms: ["instagram", "twitter", "linkedin"],
    style: "gradient",
    color: "from-purple-600 to-pink-600"
  },
  {
    id: "tips",
    name: "Tips & Tricks",
    icon: IconWand,
    description: "Educational tips in visual format",
    prompt: "Create a tips and tricks graphic with numbered list",
    platforms: ["instagram", "linkedin"],
    style: "minimal",
    color: "from-blue-600 to-cyan-600"
  },
  {
    id: "announcement",
    name: "Announcement",
    icon: IconRocket,
    description: "Product launches & updates",
    prompt: "Create an announcement graphic with bold design",
    platforms: ["twitter", "linkedin", "facebook"],
    style: "bold",
    color: "from-orange-600 to-red-600"
  },
  {
    id: "carousel",
    name: "Carousel Series",
    icon: IconLayoutGrid,
    description: "Multi-slide storytelling",
    prompt: "Create a carousel slide with consistent branding",
    platforms: ["instagram", "linkedin"],
    style: "series",
    color: "from-green-600 to-teal-600"
  },
  {
    id: "event",
    name: "Event Promo",
    icon: IconCalendar,
    description: "Webinars & live events",
    prompt: "Create an event promotion graphic with date and time",
    platforms: ["instagram", "twitter", "linkedin", "facebook"],
    style: "dynamic",
    color: "from-indigo-600 to-purple-600"
  },
  {
    id: "data",
    name: "Data Visual",
    icon: IconHash,
    description: "Statistics & insights",
    prompt: "Create a data visualization graphic with clean charts",
    platforms: ["linkedin", "twitter"],
    style: "professional",
    color: "from-gray-600 to-gray-800"
  }
]

const platformIcons = {
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  youtube: IconBrandYoutube,
  tiktok: IconBrandTiktok
}

export function ProjectGraphicsSection({
  projectId,
  projectTitle,
  contentAnalysis,
  selectedPersona,
  existingGraphics = [],
  onGraphicsUpdate
}: ProjectGraphicsSectionProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [graphics, setGraphics] = useState(existingGraphics)
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState("")
  const [brandColor, setBrandColor] = useState("#000000")
  const [customText, setCustomText] = useState("")
  const [usePersona, setUsePersona] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [selectedGraphic, setSelectedGraphic] = useState<any>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState<string>("all")
  const [selectedGraphics, setSelectedGraphics] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [editingGraphic, setEditingGraphic] = useState<any>(null)

  // Load graphics on mount
  useEffect(() => {
    loadGraphics()
  }, [projectId])

  const loadGraphics = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/graphics`)
      if (response.ok) {
        const data = await response.json()
        setGraphics(data.graphics || [])
      }
    } catch (error) {
      console.error("Failed to load graphics:", error)
    }
  }

  const generateGraphics = async () => {
    if (!selectedTemplate || selectedPlatforms.length === 0) {
      toast.error("Please select a template and at least one platform")
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const totalToGenerate = selectedPlatforms.length
      let completed = 0

      for (const platform of selectedPlatforms) {
        // Get optimal size for platform
        const platformSpec = PLATFORM_SPECS[platform]
        const size = Object.keys(platformSpec.sizes)[0] // Get first size
        const sizeSpec = platformSpec.sizes[size]

        // Build prompt
        let prompt = customPrompt || selectedTemplate.prompt
        
        if (usePersona && selectedPersona) {
          prompt = prompt.replace("{personaName}", selectedPersona.name)
          prompt += ` featuring ${selectedPersona.name}`
        }

        if (contentAnalysis?.keywords?.length > 0) {
          prompt += `. Context: ${contentAnalysis.keywords.slice(0, 3).join(', ')}`
        }

        const response = await fetch('/api/generate-social-graphics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            prompt,
            platform,
            size: `${sizeSpec.width}x${sizeSpec.height}`,
            template: selectedTemplate.id,
            quality: 'high',
            personalPhotos: usePersona && selectedPersona?.photos || [],
            personaName: usePersona && selectedPersona?.name,
            brandColor,
            customText,
            needsTransparency: false,
            variations: 1
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.graphics && result.graphics.length > 0) {
            setGraphics(prev => [...result.graphics, ...prev])
          }
        }

        completed++
        setGenerationProgress((completed / totalToGenerate) * 100)
      }

      toast.success(`Generated ${completed} graphics successfully!`)
      if (onGraphicsUpdate) onGraphicsUpdate()
      
      // Reset form
      setSelectedTemplate(null)
      setSelectedPlatforms([])
      setCustomPrompt("")
      setCustomText("")
      
    } catch (error) {
      console.error("Generation error:", error)
      toast.error("Failed to generate graphics")
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const deleteGraphic = async (graphicId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/graphics/${graphicId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setGraphics(prev => prev.filter(g => g.id !== graphicId))
        toast.success("Graphic deleted")
        if (onGraphicsUpdate) onGraphicsUpdate()
      }
    } catch (error) {
      toast.error("Failed to delete graphic")
    }
  }

  const bulkDelete = async () => {
    if (selectedGraphics.size === 0) return

    try {
      const promises = Array.from(selectedGraphics).map(id =>
        fetch(`/api/projects/${projectId}/graphics/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(promises)
      
      setGraphics(prev => prev.filter(g => !selectedGraphics.has(g.id)))
      setSelectedGraphics(new Set())
      setShowBulkActions(false)
      toast.success(`Deleted ${selectedGraphics.size} graphics`)
      if (onGraphicsUpdate) onGraphicsUpdate()
    } catch (error) {
      toast.error("Failed to delete graphics")
    }
  }

  const downloadGraphic = (graphic: any) => {
    const link = document.createElement('a')
    link.href = graphic.url
    link.download = `${graphic.platform}-${graphic.template}-${graphic.id}.png`
    link.click()
  }

  const filteredGraphics = filterPlatform === "all" 
    ? graphics 
    : graphics.filter(g => g.platform === filterPlatform)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Social Graphics Studio</h2>
        <p className="text-muted-foreground">
          Generate professional graphics for all your social platforms
        </p>
      </div>

      {/* Quick Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Quick Templates</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <IconSettings className="h-4 w-4 mr-2" />
            {showAdvanced ? "Simple Mode" : "Advanced Mode"}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickTemplates.map((template) => {
            const Icon = template.icon
            const isSelected = selectedTemplate?.id === template.id
            
            return (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all h-full",
                    isSelected && "ring-2 ring-primary shadow-lg"
                  )}
                  onClick={() => setSelectedTemplate(isSelected ? null : template)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className={cn(
                      "w-12 h-12 mx-auto rounded-lg flex items-center justify-center bg-gradient-to-br",
                      template.color,
                      "text-white"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Generation Form */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      selectedTemplate.color,
                      "text-white"
                    )}>
                      <selectedTemplate.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Selection */}
                <div className="space-y-3">
                  <Label>Select Platforms</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {selectedTemplate.platforms.map((platform) => {
                      const Icon = platformIcons[platform as keyof typeof platformIcons]
                      const isSelected = selectedPlatforms.includes(platform)
                      const spec = PLATFORM_SPECS[platform]
                      
                      return (
                        <label
                          key={platform}
                          className={cn(
                            "relative cursor-pointer rounded-lg border-2 p-3 text-center transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-muted hover:border-muted-foreground/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlatforms([...selectedPlatforms, platform])
                              } else {
                                setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                              }
                            }}
                          />
                          <Icon className={cn(
                            "h-6 w-6 mx-auto mb-1",
                            isSelected && "text-primary"
                          )} />
                          <p className="text-xs font-medium">{spec.name}</p>
                          {isSelected && (
                            <div className="absolute top-1 right-1">
                              <IconCheck className="h-3 w-3 text-primary" />
                            </div>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Text */}
                <div className="space-y-2">
                  <Label htmlFor="custom-text">Custom Text (Optional)</Label>
                  <Textarea
                    id="custom-text"
                    placeholder="Add text to appear on the graphics..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Custom Prompt */}
                    <div className="space-y-2">
                      <Label htmlFor="custom-prompt">Custom Prompt (Optional)</Label>
                      <Textarea
                        id="custom-prompt"
                        placeholder="Override the default prompt with your own..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Brand Color */}
                    <div className="space-y-2">
                      <Label htmlFor="brand-color">Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="brand-color"
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Persona Toggle */}
                {selectedPersona && (
                  <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted/50">
                    <Checkbox
                      id="use-persona"
                      checked={usePersona}
                      onCheckedChange={(checked) => setUsePersona(checked === true)}
                    />
                    <Label
                      htmlFor="use-persona"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <IconUserCircle className="h-4 w-4" />
                      Include {selectedPersona.name} in graphics
                    </Label>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} selected
                  </div>
                  <Button
                    onClick={generateGraphics}
                    disabled={isGenerating || selectedPlatforms.length === 0}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconSparkles className="h-4 w-4" />
                        Generate Graphics
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress */}
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} />
                    <p className="text-xs text-center text-muted-foreground">
                      Generating high-quality graphics...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Graphics Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Generated Graphics ({filteredGraphics.length})
          </h3>
          
          <div className="flex items-center gap-2">
            {/* Filter */}
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {Object.entries(PLATFORM_SPECS).map(([key, spec]) => (
                  <SelectItem key={key} value={key}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <IconGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <IconList className="h-4 w-4" />
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedGraphics.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={bulkDelete}
              >
                Delete {selectedGraphics.size}
              </Button>
            )}
          </div>
        </div>

        {/* Graphics Grid/List */}
        {filteredGraphics.length > 0 ? (
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "space-y-4"
          )}>
            {filteredGraphics.map((graphic) => {
              const Icon = platformIcons[graphic.platform as keyof typeof platformIcons]
              const isSelected = selectedGraphics.has(graphic.id)
              
              return viewMode === "grid" ? (
                <motion.div
                  key={graphic.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={cn(
                    "overflow-hidden group relative",
                    isSelected && "ring-2 ring-primary"
                  )}>
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedGraphics)
                          if (checked) {
                            newSelected.add(graphic.id)
                          } else {
                            newSelected.delete(graphic.id)
                          }
                          setSelectedGraphics(newSelected)
                        }}
                        className="bg-background"
                      />
                    </div>

                    {/* Image */}
                    <div 
                      className="aspect-square relative bg-muted cursor-pointer"
                      onClick={() => setSelectedGraphic(graphic)}
                    >
                      <img
                        src={graphic.url}
                        alt={`${graphic.platform} graphic`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadGraphic(graphic)
                          }}
                        >
                          <IconDownload className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGraphic(graphic)
                          }}
                        >
                          <IconEye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingGraphic(graphic)
                          }}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">
                            {graphic.platform}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {graphic.template}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(graphic.created_at || Date.now()), "MMM d, h:mm a")}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card key={graphic.id} className={cn(
                  "p-4",
                  isSelected && "ring-2 ring-primary"
                )}>
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedGraphics)
                        if (checked) {
                          newSelected.add(graphic.id)
                        } else {
                          newSelected.delete(graphic.id)
                        }
                        setSelectedGraphics(newSelected)
                      }}
                    />
                    
                    <img
                      src={graphic.url}
                      alt={`${graphic.platform} graphic`}
                      className="w-20 h-20 rounded object-cover cursor-pointer"
                      onClick={() => setSelectedGraphic(graphic)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium capitalize">{graphic.platform}</span>
                        <Badge variant="secondary">{graphic.template}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {graphic.size} • {format(new Date(graphic.created_at || Date.now()), "MMM d, yyyy h:mm a")}
                      </p>
                      {graphic.metadata?.customText && (
                        <p className="text-sm mt-1 line-clamp-1">"{graphic.metadata.customText}"</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => downloadGraphic(graphic)}
                      >
                        <IconDownload className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingGraphic(graphic)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteGraphic(graphic.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <IconPhoto className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No graphics yet</h3>
            <p className="text-muted-foreground mb-4">
              Select a template above to generate your first social graphics
            </p>
          </Card>
        )}
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={!!selectedGraphic} onOpenChange={() => setSelectedGraphic(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Graphic Details</DialogTitle>
          </DialogHeader>
          {selectedGraphic && (
            <div className="space-y-4">
              <img
                src={selectedGraphic.url}
                alt="Graphic preview"
                className="w-full rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <p className="text-sm">{PLATFORM_SPECS[selectedGraphic.platform]?.name}</p>
                </div>
                <div>
                  <Label>Size</Label>
                  <p className="text-sm">{selectedGraphic.size}</p>
                </div>
                <div>
                  <Label>Template</Label>
                  <p className="text-sm">{selectedGraphic.template}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">
                    {format(new Date(selectedGraphic.created_at || Date.now()), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
              {selectedGraphic.prompt && (
                <div>
                  <Label>Prompt</Label>
                  <p className="text-sm text-muted-foreground">{selectedGraphic.prompt}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedGraphic(null)}>
                  Close
                </Button>
                <Button onClick={() => downloadGraphic(selectedGraphic)}>
                  <IconDownload className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 