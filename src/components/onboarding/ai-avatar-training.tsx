"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  RotateCcw, Download, Trash2, Image as ImageIcon,
  Wand2, ChevronLeft, ChevronRight, Info, Zap,
  User, RefreshCw, Sun, Moon, Contrast,
  FlipHorizontal, Eye, EyeOff, Maximize2, Minimize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AvatarPhoto {
  id: string
  url: string
  type: 'captured' | 'uploaded'
  quality: {
    lighting: number
    clarity: number
    angle: number
    overall: number
  }
  metadata?: {
    fileName?: string
    fileSize?: number
    timestamp: Date
  }
}

interface AIAvatarTrainingProps {
  onComplete: (photos: AvatarPhoto[]) => void
  onBack?: () => void
  onSkip?: () => void
  minPhotos?: number
  recommendedPhotos?: number
  maxPhotos?: number
  hideNavigation?: boolean
}

const PHOTO_TIPS = [
  { icon: Sun, title: "Good Lighting", description: "Face a window or use soft, even lighting. Avoid backlighting or harsh shadows." },
  { icon: User, title: "Clear Face", description: "Keep your face clearly visible. You can wear glasses if you normally do." },
  { icon: RotateCcw, title: "Various Angles", description: "Include front-facing, left profile (3/4), right profile (3/4), and slight tilts." },
  { icon: Contrast, title: "Consistent Background", description: "Use a simple background. Can be your normal workspace or plain wall." },
]

const QUALITY_THRESHOLDS = {
  lighting: 0.7,
  clarity: 0.8,
  angle: 0.75,
  overall: 0.75
}

export function AIAvatarTraining({ 
  onComplete, 
  onBack, 
  onSkip,
  minPhotos = 5,
  recommendedPhotos = 10,
  maxPhotos = 20,
  hideNavigation = false
}: AIAvatarTrainingProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [photos, setPhotos] = useState<AvatarPhoto[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'capture' | 'upload'>('capture')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [showGrid, setShowGrid] = useState(true)
  const [flash, setFlash] = useState(false)
  
  // Calculate progress
  const progress = Math.min((photos.length / recommendedPhotos) * 100, 100)
  const isReady = photos.length >= minPhotos
  const isOptimal = photos.length >= recommendedPhotos
  const isFull = photos.length >= maxPhotos
  
  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(null)
      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: facingMode,
          aspectRatio: 16/9
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraStream(stream)
        setCameraActive(true)
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch (error: any) {
      console.error('Camera access failed:', error)
      
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please check your browser permissions.')
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera and try again.')
      } else if (error.name === 'NotReadableError') {
        setCameraError('Camera is already in use by another application.')
      } else {
        setCameraError('Unable to access camera. Please try again.')
      }
      
      setCameraActive(false)
    }
  }
  
  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setCameraActive(false)
  }
  
  // Toggle camera
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }
  
  // Switch camera (mobile)
  const switchCamera = async () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    setTimeout(() => startCamera(), 100)
  }
  
  // Analyze photo quality (mock implementation - replace with actual ML model)
  const analyzePhotoQuality = async (imageUrl: string): Promise<AvatarPhoto['quality']> => {
    // This would normally use a real image analysis API
    // For now, return mock quality scores
    return {
      lighting: 0.75 + Math.random() * 0.25,
      clarity: 0.8 + Math.random() * 0.2,
      angle: 0.7 + Math.random() * 0.3,
      overall: 0.75 + Math.random() * 0.25
    }
  }
  
  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isFull) return
    
    setIsCapturing(true)
    
    // Flash effect
    if (flash) {
      setFlash(true)
      setTimeout(() => setFlash(false), 100)
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) {
      setIsCapturing(false)
      return
    }
    
    // Set canvas size to video dimensions
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to data URL
    const imageUrl = canvas.toDataURL('image/jpeg', 0.95)
    
    // Analyze quality
    const quality = await analyzePhotoQuality(imageUrl)
    
    // Create photo object
    const newPhoto: AvatarPhoto = {
      id: `photo-${Date.now()}`,
      url: imageUrl,
      type: 'captured',
      quality,
      metadata: {
        timestamp: new Date(),
        fileSize: Math.round(imageUrl.length * 0.75) // Approximate size
      }
    }
    
    // Add to photos
    setPhotos(prev => [...prev, newPhoto])
    
    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    // Show feedback
    const photoCount = photos.length + 1
    if (photoCount < minPhotos) {
      toast.info(`Photo captured! ${photoCount}/${minPhotos} minimum`)
    } else if (photoCount < recommendedPhotos) {
      toast.success(`Photo captured! ${photoCount}/${recommendedPhotos} recommended`)
    } else {
      toast.success(`Great! You have ${photoCount} photos`)
    }
    
    setIsCapturing(false)
  }
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || isFull) return
    
    setIsProcessing(true)
    
    for (let i = 0; i < files.length && photos.length + i < maxPhotos; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`)
        continue
      }
      
      // Read file
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string
        
        // Analyze quality
        const quality = await analyzePhotoQuality(imageUrl)
        
        // Create photo object
        const newPhoto: AvatarPhoto = {
          id: `photo-${Date.now()}-${i}`,
          url: imageUrl,
          type: 'uploaded',
          quality,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            timestamp: new Date()
          }
        }
        
        // Add to photos
        setPhotos(prev => [...prev, newPhoto])
      }
      reader.readAsDataURL(file)
    }
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    setIsProcessing(false)
    
    toast.success(`${files.length} photos uploaded successfully!`)
  }
  
  // Delete photo
  const deletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (selectedPhoto === photoId) {
      setSelectedPhoto(null)
    }
    const remaining = photos.length - 1
    if (remaining < minPhotos) {
      toast.warning(`Photo removed. ${remaining}/${minPhotos} minimum photos`)
    } else if (remaining < recommendedPhotos) {
      toast.info(`Photo removed. ${remaining}/${recommendedPhotos} recommended`)
    } else {
      toast.info(`Photo removed. ${remaining} photos remaining`)
    }
  }
  
  // Delete all photos
  const deleteAllPhotos = () => {
    setPhotos([])
    setSelectedPhoto(null)
    toast.info("All photos removed. Start fresh with new photos")
  }
  
  // Download all photos (for backup)
  const downloadAllPhotos = () => {
    photos.forEach((photo, index) => {
      const link = document.createElement('a')
      link.href = photo.url
      link.download = `avatar-photo-${index + 1}.jpg`
      link.click()
    })
    toast.success(`${photos.length} photos downloaded to your device`)
  }
  
  // Handle completion
  const handleComplete = () => {
    if (!isReady) return
    onComplete(photos)
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Train Your AI Avatar</h2>
          <p className="text-muted-foreground">
            Upload or capture photos to create your personalized AI model
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Badge variant="outline" className="bg-red-50">
              <AlertCircle className="h-3 w-3 mr-1" />
              Minimum: {minPhotos} photos
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              <Check className="h-3 w-3 mr-1" />
              Recommended: {recommendedPhotos} photos
            </Badge>
          </div>
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {photos.length} photos
              {photos.length < minPhotos && ` (${minPhotos - photos.length} more needed)`}
              {photos.length >= minPhotos && photos.length < recommendedPhotos && ` (${recommendedPhotos - photos.length} more recommended)`}
            </span>
            {isOptimal ? (
              <Badge className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Optimal amount
              </Badge>
            ) : isReady ? (
              <Badge className="bg-yellow-500">
                <Check className="h-3 w-3 mr-1" />
                Ready to train
              </Badge>
            ) : null}
          </div>
          <Progress 
            value={progress} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum ({minPhotos})</span>
            <span>Recommended ({recommendedPhotos})</span>
            <span>Maximum ({maxPhotos})</span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Capture/Upload */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="capture">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="capture" className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="aspect-[4/3] bg-black relative">
                    {cameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Grid overlay */}
                        {showGrid && (
                          <div className="absolute inset-0 pointer-events-none">
                            <svg className="w-full h-full">
                              <line x1="33%" y1="0" x2="33%" y2="100%" stroke="white" strokeOpacity="0.3" />
                              <line x1="66%" y1="0" x2="66%" y2="100%" stroke="white" strokeOpacity="0.3" />
                              <line x1="0" y1="33%" x2="100%" y2="33%" stroke="white" strokeOpacity="0.3" />
                              <line x1="0" y1="66%" x2="100%" y2="66%" stroke="white" strokeOpacity="0.3" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Flash effect */}
                        {flash && (
                          <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="absolute inset-0 bg-white pointer-events-none"
                          />
                        )}
                        
                        {/* Camera controls */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => setShowGrid(!showGrid)}
                            className="bg-black/50 hover:bg-black/70"
                          >
                            <Maximize2 className={cn("h-4 w-4", showGrid && "text-primary")} />
                          </Button>
                          
                          <Button
                            size="lg"
                            onClick={capturePhoto}
                            disabled={isCapturing || isFull}
                            className="bg-white hover:bg-gray-100 text-black px-8"
                          >
                            {isCapturing ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Camera className="h-5 w-5 mr-2" />
                                Capture
                              </>
                            )}
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={switchCamera}
                            className="bg-black/50 hover:bg-black/70"
                          >
                            <FlipHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Top controls */}
                        <div className="absolute top-4 right-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={stopCamera}
                            className="bg-black/50 hover:bg-black/70 text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        {cameraError ? (
                          <Alert className="max-w-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Camera Error</AlertTitle>
                            <AlertDescription>{cameraError}</AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <Camera className="h-16 w-16 text-muted-foreground" />
                            <p className="text-muted-foreground">Camera not active</p>
                          </>
                        )}
                        <Button onClick={startCamera} size="lg">
                          <Camera className="h-5 w-5 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <Card className="p-8">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Upload Photos</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG up to 10MB each
                    </p>
                  </div>
                </Card>
                
                {isProcessing && (
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Processing uploaded photos...</span>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Tips */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Photo Guidelines for Best Results
              </h4>
              <div className="space-y-3">
                {PHOTO_TIPS.map((tip, index) => {
                  const Icon = tip.icon
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-md bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tip.title}</p>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  )
                })}
                
                <Separator className="my-3" />
                
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-600">✅ Good Photos Include:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Different facial expressions (smile, neutral, serious)</li>
                    <li>• Various distances (close-up, medium, full face)</li>
                    <li>• Different times of day for natural lighting variety</li>
                    <li>• Your typical appearance (glasses if you wear them)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600">❌ Avoid:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Blurry or low-quality images</li>
                    <li>• Photos with other people in them</li>
                    <li>• Heavy filters or editing</li>
                    <li>• Extreme angles or artistic shots</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right: Photo Gallery */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Your Photos ({photos.length}/{maxPhotos})
                </h3>
                {photos.length > 0 && (
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={downloadAllPhotos}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download all photos</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={deleteAllPhotos}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete all photos</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
              
              {photos.length === 0 ? (
                <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No photos yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Capture or upload photos to get started
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group aspect-square"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                        onClick={() => setSelectedPhoto(photo.id)}
                      />
                      
                      {/* Quality indicator */}
                      <div className={cn(
                        "absolute top-1 right-1 w-2 h-2 rounded-full",
                        photo.quality.overall >= QUALITY_THRESHOLDS.overall
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      )} />
                      
                      {/* Delete button */}
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deletePhoto(photo.id)}
                        className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      {/* Type badge */}
                      <Badge
                        variant={photo.type === 'captured' ? 'default' : 'secondary'}
                        className="absolute bottom-1 left-1 text-xs px-1 py-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {photo.type}
                      </Badge>
                    </motion.div>
                  ))}
                  
                  {/* Empty slots */}
                  {photos.length < recommendedPhotos && (
                    <>
                      {[...Array(Math.min(recommendedPhotos - photos.length, 12 - photos.length))].map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center"
                        >
                          <span className="text-xs text-muted-foreground">
                            {photos.length + i + 1 <= minPhotos ? "Required" : "Optional"}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              
              {photos.length > 0 && (
                <Alert className="mt-4" variant={photos.length < minPhotos ? "destructive" : photos.length < recommendedPhotos ? "default" : "default"}>
                  {photos.length < minPhotos ? (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Add {minPhotos - photos.length} more photo{minPhotos - photos.length !== 1 && 's'} to start training
                      </AlertDescription>
                    </>
                  ) : photos.length < recommendedPhotos ? (
                    <>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Add {recommendedPhotos - photos.length} more photo{recommendedPhotos - photos.length !== 1 && 's'} for best results
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        Perfect! You have enough photos for excellent results
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              )}
            </Card>
          </div>
        </div>
        
        {/* Actions */}
        {!hideNavigation ? (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isProcessing}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex gap-3">
              {onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  disabled={isProcessing}
                >
                  Skip for now
                </Button>
              )}
              
              <Button
                onClick={handleComplete}
                disabled={!isReady || isProcessing}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Start Training
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={handleComplete}
              disabled={!isReady || isProcessing}
              size="lg"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {isReady ? 'Save Photos' : `Add ${minPhotos - photos.length} more photo${minPhotos - photos.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
        
        {/* Selected photo modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="max-w-4xl max-h-[90vh] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={photos.find(p => p.id === selectedPhoto)?.url}
                  alt=""
                  className="w-full h-full object-contain rounded-lg"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {/* Quality scores */}
                {(() => {
                  const photo = photos.find(p => p.id === selectedPhoto)
                  if (!photo) return null
                  
                  return (
                    <Card className="absolute bottom-4 left-4 right-4 p-4 bg-background/95">
                      <h4 className="font-semibold mb-2">Photo Quality</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Lighting</p>
                          <Progress value={photo.quality.lighting * 100} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clarity</p>
                          <Progress value={photo.quality.clarity * 100} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Angle</p>
                          <Progress value={photo.quality.angle * 100} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Overall</p>
                          <Progress value={photo.quality.overall * 100} className="h-1 mt-1" />
                        </div>
                      </div>
                    </Card>
                  )
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
