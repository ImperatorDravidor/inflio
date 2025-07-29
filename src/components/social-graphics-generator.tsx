"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandTiktok,
  IconSparkles,
  IconPhoto,
  IconDownload,
  IconCheck,
  IconX,
  IconLoader2,
  IconPlus,
  IconTemplate,
  IconPalette,
  IconTypography,
  IconAspectRatio,
  IconEye,
  IconCopy,
  IconUser,
  IconWand
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  PLATFORM_SPECS,
  GRAPHICS_TEMPLATES,
  getOptimalSize,
  getTemplatesByPlatform,
  type GraphicsTemplate
} from "@/lib/social-graphics-config"

interface SocialGraphicsGeneratorProps {
  projectId: string
  projectTitle: string
  contentAnalysis?: any
  selectedPersona?: any
  onGraphicsGenerated?: (graphics: GeneratedGraphic[]) => void
}

interface GeneratedGraphic {
  id: string
  url: string
  platform: string
  size: string
  template: string
  prompt: string
  timestamp: string
}

interface PlatformSelection {
  platform: string
  sizes: string[]
  template: string
  customPrompt?: string
}

const platformIcons = {
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  youtube: IconBrandYoutube,
  tiktok: IconBrandTiktok
}

export function SocialGraphicsGenerator({
  projectId,
  projectTitle,
  contentAnalysis,
  selectedPersona,
  onGraphicsGenerated
}: SocialGraphicsGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState("platforms")
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformSelection[]>([])
  const [customText, setCustomText] = useState("")
  const [brandColor, setBrandColor] = useState("#000000")
  const [includePersona, setIncludePersona] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedGraphics, setGeneratedGraphics] = useState<GeneratedGraphic[]>([])
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")

  // Platform selection handlers
  const togglePlatform = (platform: string) => {
    const existing = selectedPlatforms.find(p => p.platform === platform)
    if (existing) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p.platform !== platform))
    } else {
      const defaultSize = Object.keys(PLATFORM_SPECS[platform].sizes)[0]
      setSelectedPlatforms([...selectedPlatforms, {
        platform,
        sizes: [defaultSize],
        template: getTemplatesByPlatform(platform)[0]?.id || ''
      }])
    }
  }

  const updatePlatformConfig = (platform: string, config: Partial<PlatformSelection>) => {
    setSelectedPlatforms(selectedPlatforms.map(p => 
      p.platform === platform ? { ...p, ...config } : p
    ))
  }

  // Generate graphics for all selected platforms
  const generateGraphics = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setGeneratedGraphics([])
    
    const totalGraphics = selectedPlatforms.reduce((sum, p) => sum + p.sizes.length, 0)
    let completedGraphics = 0

    try {
      for (const platformConfig of selectedPlatforms) {
        const { platform, sizes, template: templateId, customPrompt } = platformConfig
        const template = GRAPHICS_TEMPLATES.find(t => t.id === templateId)
        
        for (const sizeKey of sizes) {
          const size = PLATFORM_SPECS[platform].sizes[sizeKey]
          
          setProgressMessage(`Generating ${platform} ${size.displayName}...`)
          
          // Build the prompt
          let prompt = customPrompt || (
            includePersona && selectedPersona && template?.prompts.withPersona
              ? template.prompts.withPersona.replace('{personaName}', selectedPersona.name)
              : template?.prompts.withoutPersona || ''
          )
          
          // Add custom text if provided
          if (customText) {
            prompt += `. Include the text: "${customText}"`
          }
          
          // Add brand color instruction
          prompt += `. Use ${brandColor} as the primary brand color.`
          
          // Add content analysis context
          if (contentAnalysis?.keywords?.length > 0) {
            prompt += ` Context: ${contentAnalysis.keywords.slice(0, 3).join(', ')}`
          }

          // Call the API
          const response = await fetch('/api/generate-social-graphics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              prompt,
              platform,
              size: `${size.width}x${size.height}`,
              template: templateId,
              quality: 'high',
              personalPhotos: includePersona && selectedPersona?.photos || [],
              personaName: includePersona && selectedPersona?.name,
              brandColor,
              customText,
              needsTransparency: template?.style.background === 'transparent'
            })
          })

          if (!response.ok) {
            throw new Error(`Failed to generate ${platform} graphic`)
          }

          const result = await response.json()
          
          if (result.graphics && result.graphics.length > 0) {
            const newGraphic: GeneratedGraphic = {
              id: result.graphics[0].id,
              url: result.graphics[0].url,
              platform,
              size: sizeKey,
              template: templateId,
              prompt,
              timestamp: new Date().toISOString()
            }
            
            setGeneratedGraphics(prev => [...prev, newGraphic])
            completedGraphics++
            setProgress((completedGraphics / totalGraphics) * 100)
          }
        }
      }
      
      setCurrentTab("results")
      toast.success(`Generated ${completedGraphics} graphics successfully!`)
      
      if (onGraphicsGenerated) {
        onGraphicsGenerated(generatedGraphics)
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate graphics')
    } finally {
      setIsGenerating(false)
      setProgressMessage("")
    }
  }

  // Download all graphics
  const downloadAll = async () => {
    for (const graphic of generatedGraphics) {
      const link = document.createElement('a')
      link.href = graphic.url
      link.download = `${graphic.platform}-${graphic.size}-${graphic.id}.png`
      link.click()
      await new Promise(resolve => setTimeout(resolve, 500)) // Delay between downloads
    }
    toast.success('All graphics downloaded!')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <IconSparkles className="h-4 w-4" />
          Generate Social Graphics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              AI Social Graphics Generator
            </DialogTitle>
            {selectedPersona && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-persona"
                  checked={includePersona}
                  onCheckedChange={(checked) => setIncludePersona(checked === true)}
                />
                <Label htmlFor="use-persona" className="flex items-center gap-2 cursor-pointer">
                  <IconUser className="h-4 w-4" />
                  Use {selectedPersona.name}
                </Label>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1">
          <TabsList className="w-full justify-start px-6 h-auto py-2 bg-transparent">
            <TabsTrigger value="platforms" className="gap-2">
              <IconAspectRatio className="h-4 w-4" />
              Platforms & Sizes
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-2">
              <IconPalette className="h-4 w-4" />
              Design & Content
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={generatedGraphics.length === 0}>
              <IconPhoto className="h-4 w-4" />
              Results ({generatedGraphics.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] px-6">
            <TabsContent value="platforms" className="space-y-6 pb-6">
              {/* Platform Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <IconTemplate className="h-5 w-5" />
                  Select Platforms
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(PLATFORM_SPECS).map(([platform, spec]) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons]
                    const isSelected = selectedPlatforms.some(p => p.platform === platform)
                    
                    return (
                      <Card
                        key={platform}
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected && "border-primary shadow-md"
                        )}
                        onClick={() => togglePlatform(platform)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={cn(
                                "h-5 w-5",
                                isSelected && "text-primary"
                              )} />
                              <CardTitle className="text-base">{spec.name}</CardTitle>
                            </div>
                            {isSelected && <IconCheck className="h-4 w-4 text-primary" />}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {Object.keys(spec.sizes).length} formats available
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Size Selection for Each Platform */}
              {selectedPlatforms.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configure Each Platform</h3>
                  
                  {selectedPlatforms.map(platformConfig => {
                    const spec = PLATFORM_SPECS[platformConfig.platform]
                    const Icon = platformIcons[platformConfig.platform as keyof typeof platformIcons]
                    const templates = getTemplatesByPlatform(platformConfig.platform)
                    
                    return (
                      <Card key={platformConfig.platform}>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <CardTitle className="text-base">{spec.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Size Selection */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Select Sizes</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(spec.sizes).map(([sizeKey, sizeSpec]) => (
                                <label
                                  key={sizeKey}
                                  className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted"
                                >
                                  <Checkbox
                                    checked={platformConfig.sizes.includes(sizeKey)}
                                    onCheckedChange={(checked) => {
                                      const newSizes = checked
                                        ? [...platformConfig.sizes, sizeKey]
                                        : platformConfig.sizes.filter(s => s !== sizeKey)
                                      updatePlatformConfig(platformConfig.platform, { sizes: newSizes })
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{sizeSpec.displayName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {sizeSpec.width}x{sizeSpec.height}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Template Selection */}
                          <div>
                            <Label htmlFor={`template-${platformConfig.platform}`}>Template</Label>
                            <Select
                              value={platformConfig.template}
                              onValueChange={(value) => 
                                updatePlatformConfig(platformConfig.platform, { template: value })
                              }
                            >
                              <SelectTrigger id={`template-${platformConfig.platform}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    <div>
                                      <p className="font-medium">{template.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {template.description}
                                      </p>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="design" className="space-y-6 pb-6">
              {/* Custom Text */}
              <div className="space-y-2">
                <Label htmlFor="custom-text" className="flex items-center gap-2">
                  <IconTypography className="h-4 w-4" />
                  Custom Text (Optional)
                </Label>
                <Textarea
                  id="custom-text"
                  placeholder="Add custom text to appear on graphics..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This text will be prominently displayed on all graphics
                </p>
              </div>

              {/* Brand Color */}
              <div className="space-y-2">
                <Label htmlFor="brand-color" className="flex items-center gap-2">
                  <IconPalette className="h-4 w-4" />
                  Brand Color
                </Label>
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

              {/* AI Suggestions */}
              {contentAnalysis && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IconWand className="h-4 w-4" />
                    AI Content Suggestions
                  </Label>
                  <Card className="p-4 bg-primary/5">
                    <div className="space-y-2">
                      {contentAnalysis.keywords && (
                        <div>
                          <p className="text-sm font-medium">Keywords:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contentAnalysis.keywords.map((keyword: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {contentAnalysis.tone && (
                        <p className="text-sm">
                          <span className="font-medium">Tone:</span> {contentAnalysis.tone}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Preview */}
              <div className="space-y-2">
                <Label>Generation Preview</Label>
                <Card className="p-4 bg-muted/50">
                  <div className="space-y-2 text-sm">
                    <p><strong>Platforms:</strong> {selectedPlatforms.length} selected</p>
                    <p><strong>Total Graphics:</strong> {
                      selectedPlatforms.reduce((sum, p) => sum + p.sizes.length, 0)
                    }</p>
                    <p><strong>Persona:</strong> {
                      includePersona && selectedPersona ? selectedPersona.name : 'Not included'
                    }</p>
                    <p><strong>Brand Color:</strong> 
                      <span 
                        className="inline-block w-4 h-4 rounded ml-2 align-middle border"
                        style={{ backgroundColor: brandColor }}
                      />
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6 pb-6">
              {generatedGraphics.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Graphics</h3>
                    <Button onClick={downloadAll} size="sm" className="gap-2">
                      <IconDownload className="h-4 w-4" />
                      Download All
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedGraphics.map((graphic) => {
                      const spec = PLATFORM_SPECS[graphic.platform]
                      const size = spec.sizes[graphic.size]
                      const Icon = platformIcons[graphic.platform as keyof typeof platformIcons]
                      
                      return (
                        <Card key={graphic.id} className="overflow-hidden">
                          <div className="aspect-square relative bg-muted">
                            <img
                              src={graphic.url}
                              alt={`${graphic.platform} ${graphic.size}`}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="gap-1">
                                <Icon className="h-3 w-3" />
                                {spec.name}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-3 space-y-2">
                            <p className="text-sm font-medium">{size.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {size.width}x{size.height}
                            </p>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = graphic.url
                                  link.download = `${graphic.platform}-${graphic.size}-${graphic.id}.png`
                                  link.click()
                                }}
                              >
                                <IconDownload className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  navigator.clipboard.writeText(graphic.url)
                                  toast.success('URL copied!')
                                }}
                              >
                                <IconCopy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.open(graphic.url, '_blank')}
                              >
                                <IconEye className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <IconPhoto className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No graphics generated yet</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-muted/50">
          {currentTab !== "results" && (
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {selectedPlatforms.length} platforms • {
                  selectedPlatforms.reduce((sum, p) => sum + p.sizes.length, 0)
                } graphics
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
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
            </div>
          )}
        </DialogFooter>

        {/* Progress Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="text-center space-y-4 p-8">
                <div className="relative">
                  <IconSparkles className="h-16 w-16 text-primary mx-auto animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20 animate-ping" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Generating Your Graphics</h3>
                  <p className="text-sm text-muted-foreground">{progressMessage}</p>
                </div>
                <Progress value={progress} className="w-64" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
} 