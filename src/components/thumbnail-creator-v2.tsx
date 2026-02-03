"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  IconSparkles,
  IconUpload,
  IconWand,
  IconPhoto,
  IconLoader2,
  IconCheck,
  IconArrowRight,
  IconDownload,
  IconRefresh,
  IconInfoCircle,
  IconBulb,
  IconBolt,
  IconCrown,
  IconX,
  IconVideo,
  IconCamera,
  IconUser
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { extractVideoFrames, formatDuration } from "@/lib/video-utils"

interface ThumbnailCreatorProps {
  projectId: string
  projectTitle: string
  projectVideoUrl?: string
  contentAnalysis?: any
  currentThumbnail?: string
  onThumbnailUpdate: (thumbnailUrl: string) => void
  selectedPersona?: any // Persona object with photos
}

type CreationMethod = 'quick' | 'custom' | 'upload'
type Step = 'method' | 'create' | 'preview'

interface VideoFrame {
  time: number
  dataUrl: string
}

const quickTemplates = [
  {
    id: 'viral',
    name: 'Viral & Engaging',
    description: 'Eye-catching design that drives clicks',
    icon: IconBolt,
    style: 'gradient',
    color: 'from-pink-500 to-violet-500'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and trustworthy appearance',
    icon: IconCrown,
    style: 'corporate',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'tutorial',
    name: 'Educational',
    description: 'Clear and informative layout',
    icon: IconBulb,
    style: 'flat-design',
    color: 'from-green-500 to-emerald-500'
  }
]

export function ThumbnailCreatorV2({ 
  projectId, 
  projectTitle, 
  projectVideoUrl,
  contentAnalysis,
  currentThumbnail,
  onThumbnailUpdate,
  selectedPersona
}: ThumbnailCreatorProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('method')
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('viral')
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [usePersona, setUsePersona] = useState(true)
  
  // Detect if selected persona has a trained LoRA model
  const loRAActive = !!(
    (selectedPersona as any)?.lora_model_url ||
    (selectedPersona as any)?.loraModelUrl ||
    (selectedPersona as any)?.lora_training_status === 'trained' ||
    (selectedPersona as any)?.loraTrainingStatus === 'trained' ||
    (selectedPersona as any)?.status === 'trained'
  )
  
  // Video frame extraction states
  const [showVideoFrames, setShowVideoFrames] = useState(false)
  const [videoFrames, setVideoFrames] = useState<VideoFrame[]>([])
  const [selectedFrames, setSelectedFrames] = useState<VideoFrame[]>([])
  const [loadingFrames, setLoadingFrames] = useState(false)
  const [iterationPrompt, setIterationPrompt] = useState("")
  const [isIterating, setIsIterating] = useState(false)

  // Add state for streaming
  const [streamingMessage, setStreamingMessage] = useState("")
  const [useStreaming, setUseStreaming] = useState(true)
  const [showFullScreenOverlay, setShowFullScreenOverlay] = useState(false)
  const [overlayMessage, setOverlayMessage] = useState<string>("")

  // Reset state when dialog closes
  const handleClose = () => {
    setOpen(false)
    setCurrentStep('method')
    setSelectedMethod(null)
    setGeneratedUrl("")
    setCustomPrompt("")
    setUploadedFile(null)
    setUploadPreview("")
    setProgress(0)
    setVideoFrames([])
    setSelectedFrames([])
    setIterationPrompt("")
  }

  // Extract video frames
  const extractFrames = async () => {
    if (!projectVideoUrl) return
    
    setLoadingFrames(true)
    try {
      const frames = await extractVideoFrames(projectVideoUrl, 8)
      setVideoFrames(frames)
      setShowVideoFrames(true)
    } catch (error) {
      console.error("Failed to extract video frames:", error)
      toast.error("Failed to extract video frames")
    } finally {
      setLoadingFrames(false)
    }
  }

  // Handle frame selection
  const toggleFrameSelection = (frame: VideoFrame) => {
    setSelectedFrames(prev => {
      const isSelected = prev.some(f => f.time === frame.time)
      if (isSelected) {
        return prev.filter(f => f.time !== frame.time)
      } else {
        return [...prev, frame].slice(0, 3) // Max 3 frames
      }
    })
  }

  // Handle method selection
  const handleMethodSelect = (method: CreationMethod) => {
    setSelectedMethod(method)
    setCurrentStep('create')
  }

  // Generate thumbnail
  const handleGenerate = async () => {
    if (!customPrompt && !selectedTemplate) {
      toast.error("Please select a template or enter a custom prompt")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    // Take user off the form immediately
    setOverlayMessage("Starting thumbnail generation...")
    setShowFullScreenOverlay(true)
    setOpen(false)

    try {
      let prompt = ""
      let quality = 'medium'
      let style = 'modern'

      if (selectedMethod === 'quick') {
        if (selectedTemplate) {
          const template = quickTemplates.find(t => t.id === selectedTemplate)
          if (!template) return
          
          prompt = `YouTube thumbnail for "${projectTitle}", ${template.name.toLowerCase()} style, ${template.description}, high quality, engaging, clickable`
          
          // Add persona context if available and enabled
          const personaImages = selectedPersona?.photos || selectedPersona?.portraits || []
          if (usePersona && selectedPersona && personaImages.length > 0) {
            prompt = `${prompt}, featuring ${selectedPersona.name} prominently with engaging expression from the reference photos`
          }
          
          quality = 'high'
          style = template.style
        }
      } else if (selectedMethod === 'custom') {
        prompt = customPrompt
        
        // Add persona context if available and enabled
        const customPersonaImages = selectedPersona?.photos || selectedPersona?.portraits || []
        if (usePersona && selectedPersona && customPersonaImages.length > 0 && !customPrompt.toLowerCase().includes(selectedPersona.name.toLowerCase())) {
          prompt = `${prompt}, featuring ${selectedPersona.name} from the reference photos`
        }
        
        quality = 'high'
        style = 'modern'
      }

      // Prepare persona photos for API (only if persona is enabled)
      const allPersonaPhotos = selectedPersona?.photos || selectedPersona?.portraits || []
      const personaPhotos = usePersona && allPersonaPhotos.length > 0 ?
        allPersonaPhotos.map((photo: any) => photo.url || photo.image_url) : []
      
      // Add selected video frames
      const videoSnippets = selectedFrames.map(frame => {
        return {
          thumbnailUrl: frame.dataUrl,
          time: frame.time
        }
      })

      if (useStreaming) {
        // Use streaming endpoint with fetch
        const response = await fetch('/api/generate-thumbnail-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: projectId,
            prompt,
            style,
            quality,
            size: '1536x1024',
            personalPhotos: personaPhotos,
            personaName: usePersona ? selectedPersona?.name : undefined,
            mergeVideoWithPersona: usePersona && personaPhotos.length > 0,
            videoSnippets: videoSnippets.length > 0 ? videoSnippets : undefined,
            referenceImageUrl: iterationPrompt ? generatedUrl : undefined
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to start streaming')
        }
        
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  if (data.type === 'progress') {
                    setProgress(data.progress)
                    setStreamingMessage(data.message)
                    setOverlayMessage(data.message)
                  } else if (data.type === 'complete') {
                    setGeneratedUrl(data.url)
                    setCurrentStep('preview')
                    toast.success(data.message)
                    // Bring dialog back with preview ready
                    setShowFullScreenOverlay(false)
                    setOpen(true)
                  } else if (data.type === 'error') {
                    toast.error(data.error)
                    setOverlayMessage(data.error)
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }


      } else {
        // Use standard endpoint
        const response = await fetch('/api/generate-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: projectId,
            prompt,
            style,
            quality,
            personalPhotos: personaPhotos,
            personaName: usePersona ? selectedPersona?.name : undefined,
            mergeVideoWithPersona: usePersona && personaPhotos.length > 0,
            videoSnippets: videoSnippets.length > 0 ? videoSnippets : undefined,
            referenceImageUrl: iterationPrompt ? generatedUrl : undefined
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.details || 'Failed to generate thumbnail')
        }

        const result = await response.json()
        if (result.url) {
          setGeneratedUrl(result.url)
          setCurrentStep('preview')
          toast.success("Thumbnail generated successfully!")
          setShowFullScreenOverlay(false)
          setOpen(true)
        } else {
          throw new Error('No URL in response')
        }
      }
    } catch (error) {
      console.error("Generation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate thumbnail")
      setOverlayMessage(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
      setStreamingMessage("")
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string)
      setCurrentStep('preview')
    }
    reader.readAsDataURL(file)
  }

  // Confirm and save thumbnail
  const handleConfirm = async () => {
    if (selectedMethod === 'upload' && uploadedFile) {
      setIsGenerating(true)
      try {
        const formData = new FormData()
        formData.append('file', uploadedFile)
        formData.append('projectId', projectId)
        formData.append('type', 'thumbnail')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Failed to upload thumbnail')

        const data = await response.json()
        onThumbnailUpdate(data.url)
        toast.success("Thumbnail uploaded successfully!")
        handleClose()
      } catch (error) {
        console.error("Error uploading thumbnail:", error)
        toast.error("Failed to upload thumbnail")
      } finally {
        setIsGenerating(false)
      }
    } else if (generatedUrl) {
      onThumbnailUpdate(generatedUrl)
      toast.success("Thumbnail updated successfully!")
      handleClose()
    }
  }

  return (
    <>
      {/* Full-screen overlay during generation */}
      {showFullScreenOverlay && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-800 p-6 text-center shadow-2xl">
            <div className="mb-3 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            </div>
            <p className="text-white/90 font-medium">Generating thumbnail...</p>
            <p className="text-white/60 text-sm mt-1">{overlayMessage || 'This can take up to 30 seconds'}</p>
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-white/50 mt-2">{Math.max(0, Math.min(100, Math.round(progress)))}%</p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "gap-2 relative group",
            !currentThumbnail && "text-primary hover:text-primary"
          )}
        >
          <IconPhoto className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentThumbnail ? "Change" : "Add"} Thumbnail
          </span>
          {selectedPersona && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              <IconUser className="h-3 w-3 mr-1" />
              {selectedPersona.name}
            </Badge>
          )}
          {!currentThumbnail && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {currentThumbnail ? 'Update' : 'Create'} Thumbnail
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentStep === 'method' && "Choose how you'd like to create your thumbnail"}
                {currentStep === 'create' && "Customize your thumbnail"}
                {currentStep === 'preview' && "Review and confirm your thumbnail"}
              </p>
            </div>
            
            {/* Persona Toggle */}
            {selectedPersona && (
              <div className="flex items-center gap-3 mx-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePersona}
                    onChange={(e) => setUsePersona(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Use Persona</span>
                </label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="p-1 rounded-full bg-primary/10">
                    <IconUser className="h-3 w-3 text-primary" />
                  </div>
                  <span>{selectedPersona.name}</span>
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        loRAActive ? "bg-green-500" : "bg-yellow-500"
                      )}
                    />
                    <span className={cn("text-xs", loRAActive ? "text-green-600" : "text-yellow-600")}> 
                      {loRAActive ? 'Model ready' : 'Training pending'}
                    </span>
                  </span>
                </div>
              </div>
            )}
            
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {['method', 'create', 'preview'].map((step, idx) => (
                <div
                  key={step}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    currentStep === step ? "w-8 bg-primary" : "w-2 bg-muted",
                    ['create', 'preview'].includes(currentStep) && idx === 0 && "bg-primary/50"
                  )}
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Choose Method */}
            {currentStep === 'method' && (
              <motion.div
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid gap-4">
                  {/* Quick AI Generate */}
                  <Card 
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:shadow-md border-2",
                      "hover:border-primary/50 group"
                    )}
                    onClick={() => handleMethodSelect('quick')}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 group-hover:from-violet-500/20 group-hover:to-pink-500/20 transition-colors">
                        <IconWand className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                          Quick AI Generate
                          <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Let AI create a professional thumbnail in seconds using smart templates
                        </p>
                      </div>
                      <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>

                  {/* Custom Prompt */}
                  <Card 
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:shadow-md border-2",
                      "hover:border-primary/50 group"
                    )}
                    onClick={() => handleMethodSelect('custom')}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-colors">
                        <IconSparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">Custom AI Prompt</h3>
                        <p className="text-sm text-muted-foreground">
                          Describe exactly what you want and let AI bring your vision to life
                        </p>
                      </div>
                      <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>

                  {/* Upload */}
                  <Card 
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:shadow-md border-2",
                      "hover:border-primary/50 group"
                    )}
                    onClick={() => handleMethodSelect('upload')}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-colors">
                        <IconUpload className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">Upload Your Own</h3>
                        <p className="text-sm text-muted-foreground">
                          Already have a thumbnail? Upload it directly
                        </p>
                      </div>
                      <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 2: Create */}
            {currentStep === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Persona Indicator */}
                {selectedPersona && (
                  <div className="bg-primary/10 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {(selectedPersona.photos || selectedPersona.portraits || []).slice(0, 3).map((photo: any, idx: number) => (
                          <img
                            key={idx}
                            src={photo.url || photo.image_url}
                            alt={`${selectedPersona.name} ${idx + 1}`}
                            className="w-10 h-10 rounded-full border-2 border-background object-cover"
                          />
                        ))}
                      </div>
                      <div>
                        <p className="font-medium">Using {selectedPersona.name} persona</p>
                        <p className="text-xs text-muted-foreground">
                          AI will incorporate these photos into your thumbnail
                        </p>
                        <p className="text-xs mt-1">
                          {loRAActive 
                            ? (
                              <span className="text-green-600">Trained AI model detected. Likeness will be preserved via LoRA.</span>
                            ) : (
                              <span className="text-yellow-700">Your AI model is still training. We will use your photos; results improve after training completes.</span>
                            )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick AI Generate Options */}
                {selectedMethod === 'quick' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Choose a style</Label>
                      <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <div className="grid gap-3">
                          {quickTemplates.map((template) => {
                            const Icon = template.icon
                            return (
                              <Label
                                key={template.id}
                                htmlFor={template.id}
                                className={cn(
                                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                  selectedTemplate === template.id 
                                    ? "border-primary bg-primary/5" 
                                    : "border-muted hover:border-primary/50"
                                )}
                              >
                                <RadioGroupItem value={template.id} id={template.id} className="sr-only" />
                                <div className={cn(
                                  "p-2 rounded-lg bg-gradient-to-br",
                                  template.color,
                                  "text-white"
                                )}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{template.name}</p>
                                  <p className="text-sm text-muted-foreground">{template.description}</p>
                                </div>
                                {selectedTemplate === template.id && (
                                  <IconCheck className="h-5 w-5 text-primary" />
                                )}
                              </Label>
                            )
                          })}
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <IconInfoCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">AI will automatically:</p>
                          <ul className="mt-1 space-y-0.5 text-muted-foreground">
                            <li>• Analyze your video content</li>
                            <li>• Extract key visual elements</li>
                            <li>• Add engaging text overlay</li>
                            <li>• Optimize for maximum clicks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Prompt */}
                {selectedMethod === 'custom' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="prompt" className="text-base font-semibold mb-2 block">
                        Describe your thumbnail
                      </Label>
                      <Textarea
                        id="prompt"
                        placeholder="E.g., Split screen showing before and after results, with shocked facial expression, bright colors, large text saying 'You Won't Believe This!'"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Be specific about colors, text, layout, and emotions you want to convey
                      </p>
                    </div>

                    {/* Quick suggestions */}
                    <div>
                      <p className="text-sm font-medium mb-2">Quick ideas:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Shocked expression",
                          "Before/After split",
                          "Big bold text",
                          "Bright colors",
                          "Arrow pointing"
                        ].map((idea) => (
                          <Button
                            key={idea}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCustomPrompt(prev => prev ? `${prev}, ${idea.toLowerCase()}` : idea)
                            }}
                          >
                            {idea}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload */}
                {selectedMethod === 'upload' && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold block">Upload your thumbnail</Label>
                    <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <Label
                        htmlFor="thumbnail-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <div className="p-4 rounded-full bg-primary/10">
                          <IconUpload className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-base">Click to upload or drag and drop</p>
                          <p className="text-sm text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                          <p className="text-xs text-muted-foreground mt-2">Recommended: 1280×720 pixels</p>
                        </div>
                      </Label>
                    </div>
                  </div>
                )}

                {/* Video Frame Selection */}
                {projectVideoUrl && selectedMethod !== 'upload' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Use video frames (Optional)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={extractFrames}
                        disabled={loadingFrames}
                        type="button"
                      >
                        {loadingFrames ? (
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <IconVideo className="h-4 w-4 mr-1" />
                            Extract Frames
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showVideoFrames && videoFrames.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                          {videoFrames.map((frame) => (
                            <div
                              key={frame.time}
                              className={cn(
                                "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                                selectedFrames.some(f => f.time === frame.time) 
                                  ? "border-primary ring-2 ring-primary/20" 
                                  : "border-muted hover:border-primary/30"
                              )}
                              onClick={() => toggleFrameSelection(frame)}
                            >
                              <img 
                                src={frame.dataUrl} 
                                alt={`Frame at ${formatDuration(frame.time)}`}
                                className="w-full h-20 object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5">
                                {formatDuration(frame.time)}
                              </div>
                              {selectedFrames.some(f => f.time === frame.time) && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <IconCheck className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {selectedFrames.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            <IconCamera className="inline h-4 w-4 mr-1" />
                            {selectedFrames.length} frame{selectedFrames.length > 1 ? 's' : ''} selected - these will be incorporated into your thumbnail
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('method')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={
                      isGenerating || 
                      (selectedMethod === 'custom' && !customPrompt.trim()) ||
                      (selectedMethod === 'upload')
                    }
                    className="flex-1 gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconSparkles className="h-4 w-4" />
                        Generate Thumbnail
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress indicator */}
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Creating your perfect thumbnail...
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Your thumbnail is ready!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Preview your thumbnail below and confirm to use it
                    </p>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border shadow-lg">
                    {(generatedUrl || uploadPreview) && (
                      <img
                        src={generatedUrl || uploadPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-center gap-2">
                    {generatedUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(generatedUrl, '_blank')}
                        >
                          <IconDownload className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentStep('create')
                            setGeneratedUrl("")
                          }}
                        >
                          <IconRefresh className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Iteration Section */}
                  {generatedUrl && !isIterating && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-xl space-y-3">
                      <Label className="text-sm font-medium">Want to refine this thumbnail?</Label>
                      <Textarea
                        placeholder="Describe what you'd like to change (e.g., 'Make the text bigger', 'Add more contrast', 'Change the background color to blue')"
                        value={iterationPrompt}
                        onChange={(e) => setIterationPrompt(e.target.value)}
                        rows={2}
                        className="resize-none text-sm"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          if (!iterationPrompt.trim()) return
                          
                          setIsIterating(true)
                          try {
                            const response = await fetch('/api/generate-thumbnail', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                projectId,
                                prompt: `${customPrompt || `YouTube thumbnail for "${projectTitle}"`}. IMPORTANT CHANGES: ${iterationPrompt}`,
                                style: selectedMethod === 'quick' ? quickTemplates.find(t => t.id === selectedTemplate)?.style : 'photorealistic',
                                quality: 'high',
                                personalPhotos: selectedPersona?.photos?.map((photo: any) => photo.url) || [],
                                personaName: selectedPersona?.name,
                                mergeVideoWithPersona: true,
                                videoSnippets: selectedFrames.length > 0 ? selectedFrames.map(f => ({
                                  timestamp: f.time,
                                  thumbnailUrl: f.dataUrl
                                })) : undefined,
                                referenceImageUrl: generatedUrl
                              })
                            })
                            
                            if (response.ok) {
                              const data = await response.json()
                              if (data.imageUrl) {
                                setGeneratedUrl(data.imageUrl)
                                setIterationPrompt("")
                                toast.success("Thumbnail refined successfully!")
                              }
                            }
                          } catch (error) {
                            console.error("Failed to refine thumbnail:", error)
                            toast.error("Failed to refine thumbnail")
                          } finally {
                            setIsIterating(false)
                          }
                        }}
                        disabled={!iterationPrompt.trim() || isIterating}
                        className="w-full"
                      >
                        {isIterating ? (
                          <>
                            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                            Refining...
                          </>
                        ) : (
                          <>
                            <IconWand className="h-4 w-4 mr-2" />
                            Refine Thumbnail
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedMethod === 'upload') {
                        setCurrentStep('create')
                        setUploadPreview("")
                        setUploadedFile(null)
                      } else {
                        setCurrentStep('create')
                        setGeneratedUrl("")
                      }
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isGenerating}
                    className="flex-1 gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconCheck className="h-4 w-4" />
                        Use This Thumbnail
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
} 