"use client"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  IconUser,
  IconCamera,
  IconUpload,
  IconSparkles,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
  IconLoader2,
  IconInfoCircle,
  IconX,
  IconAlertCircle
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"

interface PersonaConfigureDialogProps {
  onPersonaCreated?: (persona: any) => void
  children?: React.ReactNode
}

type Step = 1 | 2 | 3
type CaptureMethod = 'camera' | 'upload' | null

const guidelines = [
  "Face should be clearly visible and well-lit",
  "Look directly at the camera",
  "Neutral or professional expression preferred",
  "Avoid strong shadows or backlighting",
  "Simple, uncluttered background works best",
  "Head and shoulders visible in frame"
]

export function PersonaConfigureDialog({ 
  onPersonaCreated,
  children 
}: PersonaConfigureDialogProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [personaName, setPersonaName] = useState("")
  const [personaRole, setPersonaRole] = useState("")
  const [personaDescription, setPersonaDescription] = useState("")
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>(null)
  const [capturedImage, setCapturedImage] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Reset state when dialog closes
  const handleClose = () => {
    setOpen(false)
    setCurrentStep(1)
    setPersonaName("")
    setPersonaRole("")
    setPersonaDescription("")
    setCaptureMethod(null)
    setCapturedImage("")
    setGeneratedImages([])
    setProgress(0)
    
    // Stop camera if active
    stopCamera()
  }

  // Start camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error("Failed to access camera:", error)
      toast.error("Failed to access camera. Please check permissions.")
      setCaptureMethod(null)
    }
  }

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
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

    const reader = new FileReader()
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string)
      // Reset capture method since we have the image
      setCaptureMethod(null)
    }
    reader.readAsDataURL(file)
    
    // Reset file input for future use
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Generate professional images using AI
  const generateProfessionalImages = async () => {
    if (!capturedImage || !personaName) return

    setIsGenerating(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 500)

    try {
      const supabase = createSupabaseBrowserClient()
      
      // Generate 3 professional variations
      const variations = [
        "professional headshot, business attire, neutral background, confident expression",
        "friendly professional portrait, warm smile, modern office background, approachable",
        "creative professional photo, artistic lighting, contemporary style, engaging expression"
      ]

      const generatedUrls: string[] = []

      for (let i = 0; i < variations.length; i++) {
                const response = await fetch('/api/generate-professional-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personaName,
            personaRole,
            originalPhoto: capturedImage,
            variations: [variations[i]]
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.images && data.images.length > 0) {
            generatedUrls.push(...data.images)
          }
        }
      }

      if (generatedUrls.length > 0) {
        setGeneratedImages(generatedUrls)
        setProgress(100)
        toast.success(`Generated ${generatedUrls.length} professional photos!`)
      } else {
        throw new Error("Failed to generate professional photos")
      }

    } catch (error) {
      console.error("Error generating professional images:", error)
      toast.error("Failed to generate professional photos. Please try again.")
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
    }
  }

  // Save persona
  const savePersona = async () => {
    if (!personaName || generatedImages.length === 0) return

    try {
      const supabase = createSupabaseBrowserClient()
      
      // Create persona object
      const persona = {
        id: uuidv4(),
        name: personaName,
        role: personaRole,
        description: personaDescription,
        photos: [
          { url: capturedImage, type: 'original' },
          ...generatedImages.map((url, index) => ({
            url,
            type: `professional-${index + 1}`
          }))
        ],
        created_at: new Date().toISOString()
      }

      // Save to local storage
      const existingPersonas = JSON.parse(localStorage.getItem('personas') || '[]')
      existingPersonas.push(persona)
      localStorage.setItem('personas', JSON.stringify(existingPersonas))

      // Also save the current persona ID to the project if we have a projectId
      const projectId = window.location.pathname.match(/projects\/([^\/]+)/)?.[1]
      if (projectId) {
        // Get current project data first
        const { data: project } = await supabase
          .from('projects')
          .select('metadata')
          .eq('id', projectId)
          .single()
        
        const { error } = await supabase
          .from('projects')
          .update({ 
            selected_persona_id: persona.id,
            metadata: {
              ...project?.metadata,
              personas: existingPersonas,
              currentPersona: persona
            }
          })
          .eq('id', projectId)
          
        if (error) {
          console.error('Failed to update project with persona:', error)
        }
      }

      toast.success("Persona created successfully!")
      
      if (onPersonaCreated) {
        onPersonaCreated(persona)
      }
      
      handleClose()
    } catch (error) {
      console.error("Error saving persona:", error)
      toast.error("Failed to save persona")
    }
  }

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return personaName.trim().length > 0
      case 2:
        return capturedImage.length > 0
      case 3:
        return generatedImages.length > 0
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep === 2 && capturedImage && !generatedImages.length) {
      generateProfessionalImages()
    } else if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step)
    } else {
      savePersona()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      // Reset states when going back from photo capture
      if (currentStep === 2) {
        setCapturedImage("")
        setCaptureMethod(null)
        stopCamera()
      }
      // Reset states when going back from generation
      if (currentStep === 3) {
        setGeneratedImages([])
        setIsGenerating(false)
        setProgress(0)
      }
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              "gap-2 relative group",
              !personaName && "text-primary hover:text-primary"
            )}
          >
            <IconUser className="h-4 w-4" />
            <span className="hidden sm:inline">Configure Persona</span>
            {!personaName && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Configure AI Persona
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStep} of 3: {
                  currentStep === 1 ? "Basic Information" :
                  currentStep === 2 ? "Capture Photo" :
                  "Generate Professional Images"
                }
              </p>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    currentStep === step ? "w-8 bg-primary" : 
                    currentStep > step ? "w-2 bg-primary" : "w-2 bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid gap-4">
                  <Card className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                        <IconUser className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-base font-semibold">
                            Persona Name *
                          </Label>
                          <Input
                            id="name"
                            placeholder="e.g., John Smith, Sarah Johnson"
                            value={personaName}
                            onChange={(e) => setPersonaName(e.target.value)}
                            className="mt-2"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            This name will be used in AI-generated content
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="role" className="text-base font-semibold">
                            Professional Role
                            <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
                          </Label>
                          <Input
                            id="role"
                            placeholder="e.g., CEO, Content Creator, Software Engineer"
                            value={personaRole}
                            onChange={(e) => setPersonaRole(e.target.value)}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-base font-semibold">
                            Brief Description
                            <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Describe the persona's style, expertise, or characteristics..."
                            value={personaDescription}
                            onChange={(e) => setPersonaDescription(e.target.value)}
                            rows={3}
                            className="mt-2 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <IconInfoCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">What is a Persona?</p>
                      <p className="text-muted-foreground mt-1">
                        A persona represents you or your brand in AI-generated content. 
                        It ensures consistency across thumbnails, images, and other visual content.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Capture Photo */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!capturedImage ? (
                  <>
                    {/* Guidelines */}
                    <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <IconInfoCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Photo Guidelines</p>
                          <ul className="mt-1 space-y-0.5 text-muted-foreground">
                            {guidelines.map((guideline, index) => (
                              <li key={index}>• {guideline}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Capture Method Selection */}
                    {!captureMethod ? (
                      <div className="grid gap-4">
                        <Card 
                          className={cn(
                            "p-6 cursor-pointer transition-all hover:shadow-md border-2",
                            "hover:border-primary/50 group"
                          )}
                          onClick={() => {
                            setCaptureMethod('camera')
                            startCamera()
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 group-hover:from-violet-500/20 group-hover:to-pink-500/20 transition-colors">
                              <IconCamera className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">Take Photo</h3>
                              <p className="text-sm text-muted-foreground">
                                Use your device camera to capture a professional photo
                              </p>
                            </div>
                            <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </Card>

                        <Card 
                          className={cn(
                            "p-6 cursor-pointer transition-all hover:shadow-md border-2",
                            "hover:border-primary/50 group"
                          )}
                          onClick={() => {
                            setCaptureMethod('upload')
                            fileInputRef.current?.click()
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-colors">
                              <IconUpload className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">Upload Photo</h3>
                              <p className="text-sm text-muted-foreground">
                                Choose an existing photo from your device
                              </p>
                            </div>
                            <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </Card>
                      </div>
                    ) : (
                      <>
                        {/* Camera View */}
                        {captureMethod === 'camera' && (
                          <div className="space-y-4">
                            <Card className="overflow-hidden">
                              <div className="relative aspect-video bg-black">
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                
                                {/* Camera overlay UI */}
                                <div className="absolute inset-0 pointer-events-none">
                                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-white text-sm font-medium">Camera Active</span>
                                  </div>
                                  
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-white/30 rounded-full" />
                                  </div>
                                </div>
                              </div>
                            </Card>
                            
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setCaptureMethod(null)
                                  if (streamRef.current) {
                                    streamRef.current.getTracks().forEach(track => track.stop())
                                    streamRef.current = null
                                  }
                                }}
                                className="flex-1"
                              >
                                <IconX className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                              <Button
                                onClick={capturePhoto}
                                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                              >
                                <IconCamera className="h-4 w-4" />
                                Capture Photo
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* File Upload (hidden) */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </>
                    )}
                  </>
                ) : (
                  /* Preview Captured Image */
                  <div className="space-y-4">
                    <Card className="overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={capturedImage}
                          alt="Captured photo"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCapturedImage("")
                            setCaptureMethod(null)
                          }}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                        >
                          <IconX className="h-4 w-4 text-white" />
                        </Button>
                        
                        {/* Success overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <div className="flex items-center gap-2 text-white">
                            <IconCheck className="h-5 w-5" />
                            <span className="text-sm font-medium">Photo captured successfully</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    <div className="bg-primary/5 rounded-xl p-4 text-center">
                      <p className="text-sm font-medium">Ready for the next step!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        We'll generate 3 professional variations of your photo
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Generate Professional Images */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {isGenerating ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 space-y-6"
                  >
                    <div className="relative">
                      <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 w-fit mx-auto">
                        <IconSparkles className="h-16 w-16 text-primary animate-pulse" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-4 border-primary/20 animate-ping" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        Creating Your Professional Photos
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Our AI is generating 3 high-quality professional variations. This usually takes 30-45 seconds.
                      </p>
                    </div>
                    <div className="space-y-2 max-w-xs mx-auto">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {progress < 30 ? 'Analyzing your photo...' :
                         progress < 60 ? 'Generating professional styles...' :
                         progress < 90 ? 'Finalizing images...' :
                         'Almost done...'}
                      </p>
                    </div>
                  </motion.div>
                ) : generatedImages.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center p-2 rounded-full bg-green-500/10 mb-2">
                        <IconCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold">Your Professional Photos Are Ready!</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        We've created 3 professional variations. These will be used across all AI-generated content.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Original */}
                      <Card className="overflow-hidden">
                        <div className="p-3 border-b bg-muted/50">
                          <p className="text-sm font-medium text-center flex items-center justify-center gap-2">
                            <IconCamera className="h-4 w-4 text-muted-foreground" />
                            Original Photo
                          </p>
                        </div>
                        <div className="aspect-square relative group">
                          <img
                            src={capturedImage}
                            alt="Original"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Badge variant="secondary" className="bg-white/90 text-black">
                              Source
                            </Badge>
                          </div>
                        </div>
                      </Card>
                      
                      {/* Generated */}
                      {generatedImages.slice(0, 3).map((image, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="p-3 border-b bg-muted/50">
                            <p className="text-sm font-medium text-center flex items-center justify-center gap-2">
                              <IconSparkles className="h-4 w-4 text-primary" />
                              {index === 0 ? 'Professional' : index === 1 ? 'Friendly' : 'Creative'}
                            </p>
                          </div>
                          <div className="aspect-square relative group">
                            <img
                              src={image}
                              alt={`Generated ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Badge className="bg-primary text-primary-foreground">
                                AI Enhanced
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <IconCheck className="h-5 w-5 text-green-700 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-green-900 dark:text-green-300">Everything looks great!</p>
                          <p className="text-sm text-green-800/80 dark:text-green-400/80 mt-1">
                            Your persona "{personaName}" is ready to be saved with these professional photos.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-muted/20">
          {isGenerating ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Creating your professional photos...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? handleClose : handleBack}
                disabled={isGenerating}
                className="gap-2"
              >
                {currentStep === 1 ? (
                  'Cancel'
                ) : (
                  <>
                    <IconArrowLeft className="h-4 w-4" />
                    Back
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isGenerating}
                className="gap-2"
              >
                {currentStep === 3 ? (
                  <>
                    <IconCheck className="h-4 w-4" />
                    Save Persona
                  </>
                ) : currentStep === 2 && capturedImage && !generatedImages.length ? (
                  <>
                    <IconSparkles className="h-4 w-4" />
                    Generate Professional Photos
                  </>
                ) : (
                  <>
                    Next
                    <IconArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 