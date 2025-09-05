"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  RotateCcw, Download, Trash2, Image as ImageIcon,
  Wand2, ChevronLeft, ChevronRight, Info, Zap,
  User, RefreshCw, Sun, Moon, Contrast,
  FlipHorizontal, Eye, EyeOff, Maximize2, Minimize2,
  Smartphone, Monitor, ArrowRight, Sparkles, Shield,
  Clock, CheckCircle2, XCircle, ChevronUp, Plus,
  Grid3x3, CameraIcon, FolderOpen, CloudUpload,
  Scan, Aperture, Focus, Timer, FileImage, Images,
  Lightbulb, Lock
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { designSystem } from '@/lib/design-system'

interface AvatarPhoto {
  id: string
  url: string
  file?: File
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
  status?: 'analyzing' | 'ready' | 'failed'
}

interface EnhancedAIAvatarTrainingProps {
  userId: string
  onComplete: (photos: AvatarPhoto[]) => void
  onBack?: () => void
  onSkip?: () => void
  minPhotos?: number
  recommendedPhotos?: number
  maxPhotos?: number
  currentStep?: number
  totalSteps?: number
}

// Quick tips carousel content
const QUICK_TIPS = [
  {
    icon: Sun,
    title: "Good Lighting",
    description: "Natural light works best",
    color: "text-yellow-500"
  },
  {
    icon: Camera,
    title: "Multiple Angles",
    description: "Front, left, right views",
    color: "text-blue-500"
  },
  {
    icon: User,
    title: "Clear Face",
    description: "Remove sunglasses",
    color: "text-purple-500"
  },
  {
    icon: Focus,
    title: "Sharp Focus",
    description: "Avoid blurry photos",
    color: "text-green-500"
  }
]

// Sample poses for guidance
const POSE_GUIDES = [
  { id: 'front', label: 'Front', angle: '0°', icon: '😊' },
  { id: 'left', label: 'Left 3/4', angle: '45°', icon: '😏' },
  { id: 'right', label: 'Right 3/4', angle: '-45°', icon: '🙂' },
  { id: 'up', label: 'Slight Up', angle: '↑', icon: '🤔' },
  { id: 'down', label: 'Slight Down', angle: '↓', icon: '😌' },
  { id: 'smile', label: 'Smile', angle: '😁', icon: '😄' }
]

export function EnhancedAIAvatarTraining({
  userId,
  onComplete,
  onBack,
  onSkip,
  minPhotos = 5,
  recommendedPhotos = 10,
  maxPhotos = 20,
  currentStep = 4,
  totalSteps = 7
}: EnhancedAIAvatarTrainingProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
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
  const [countdownActive, setCountdownActive] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [isMobile, setIsMobile] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [capturedPoses, setCapturedPoses] = useState<Set<string>>(new Set())
  const [currentTip, setCurrentTip] = useState(0)
  
  // Calculate progress
  const progress = Math.min((photos.length / recommendedPhotos) * 100, 100)
  const isReady = photos.length >= minPhotos
  const isOptimal = photos.length >= recommendedPhotos
  const isFull = photos.length >= maxPhotos
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % QUICK_TIPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  
  // Enhanced camera start with better error handling
  const startCamera = async () => {
    try {
      setCameraError(null)
      
      // Request permissions first on mobile
      if (isMobile && navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
          if (result.state === 'denied') {
            setCameraError('Camera permission denied. Please enable it in your browser settings.')
            return
          }
        } catch (e) {
          // Permissions API might not be available
          console.log('Permissions API not available')
        }
      }
      
      const constraints = {
        video: {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: facingMode,
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraStream(stream)
        setCameraActive(true)
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch (error: any) {
      console.error('Camera access failed:', error)
      
      let errorMessage = 'Unable to access camera.'
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera or use the upload option.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is in use by another app. Please close other apps and try again.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera doesn\'t support the required quality. Trying with lower quality...'
        // Try with lower constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream
            setCameraStream(simpleStream)
            setCameraActive(true)
            return
          }
        } catch (e) {
          errorMessage = 'Unable to access camera even with basic settings.'
        }
      }
      
      setCameraError(errorMessage)
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
  
  // Switch camera (mobile)
  const switchCamera = async () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    setTimeout(() => startCamera(), 100)
  }
  
  // Analyze photo quality with better algorithm
  const analyzePhotoQuality = async (imageUrl: string): Promise<AvatarPhoto['quality']> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({ lighting: 0.7, clarity: 0.8, angle: 0.75, overall: 0.75 })
          return
        }
        
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Simple quality analysis (in production, use a proper ML model)
        let brightness = 0
        let contrast = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          brightness += gray
        }
        
        brightness = brightness / (data.length / 4) / 255
        
        // Mock quality scores (replace with actual analysis)
        const quality = {
          lighting: Math.min(0.5 + brightness * 0.5 + Math.random() * 0.2, 1),
          clarity: 0.7 + Math.random() * 0.3,
          angle: 0.7 + Math.random() * 0.3,
          overall: 0
        }
        
        quality.overall = (quality.lighting + quality.clarity + quality.angle) / 3
        
        resolve(quality)
      }
      
      img.onerror = () => {
        resolve({ lighting: 0.7, clarity: 0.8, angle: 0.75, overall: 0.75 })
      }
      
      img.src = imageUrl
    })
  }
  
  // Countdown capture
  const startCountdownCapture = () => {
    if (!videoRef.current || !canvasRef.current || isFull) return
    
    setCountdownActive(true)
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setCountdownActive(false)
          capturePhoto()
          return 3
        }
        return prev - 1
      })
    }, 1000)
  }
  
  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isFull) return
    
    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) {
      setIsCapturing(false)
      return
    }
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to blob for better quality
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsCapturing(false)
        return
      }
      
      const imageUrl = URL.createObjectURL(blob)
      const quality = await analyzePhotoQuality(imageUrl)
      
      const newPhoto: AvatarPhoto = {
        id: `photo-${Date.now()}`,
        url: imageUrl,
        file: new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' }),
        type: 'captured',
        quality,
        metadata: {
          timestamp: new Date(),
          fileSize: blob.size
        },
        status: 'ready'
      }
      
      setPhotos(prev => [...prev, newPhoto])
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      // Audio feedback (click sound)
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBiuBzvLZiTYJGmm98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
      audio.volume = 0.1
      audio.play().catch(() => {})
      
      // Show success feedback
      toast.success('Photo captured!', {
        description: `Quality: ${(quality.overall * 100).toFixed(0)}%`
      })
      
      setIsCapturing(false)
      
      // Celebrate milestones
      if (photos.length + 1 === minPhotos) {
        toast.success('Minimum photos reached! You can now continue.', {
          duration: 5000,
          icon: '🎉'
        })
      } else if (photos.length + 1 === recommendedPhotos) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        toast.success('Perfect! You have the recommended amount of photos!', {
          duration: 5000,
          icon: '🎊'
        })
      }
    }, 'image/jpeg', 0.95)
  }
  
  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (isFull) {
      toast.error('Maximum photos reached')
      return
    }
    
    const files = Array.from(e.dataTransfer.files)
    await processFiles(files)
  }
  
  // Process uploaded files
  const processFiles = async (files: File[]) => {
    setIsProcessing(true)
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`)
        return false
      }
      return true
    })
    
    for (let i = 0; i < validFiles.length && photos.length + i < maxPhotos; i++) {
      const file = validFiles[i]
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string
        const quality = await analyzePhotoQuality(imageUrl)
        
        const newPhoto: AvatarPhoto = {
          id: `photo-${Date.now()}-${i}`,
          url: imageUrl,
          file: file,
          type: 'uploaded',
          quality,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            timestamp: new Date()
          },
          status: 'ready'
        }
        
        setPhotos(prev => [...prev, newPhoto])
      }
      reader.readAsDataURL(file)
    }
    
    setIsProcessing(false)
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} uploaded successfully!`)
    }
  }
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || isFull) return
    
    await processFiles(Array.from(files))
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Delete photo
  const deletePhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId)
    if (photo?.url && photo.type === 'captured') {
      URL.revokeObjectURL(photo.url)
    }
    
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (selectedPhoto === photoId) {
      setSelectedPhoto(null)
    }
    
    toast.info('Photo removed')
  }
  
  // Delete all photos
  const deleteAllPhotos = () => {
    photos.forEach(photo => {
      if (photo.url && photo.type === 'captured') {
        URL.revokeObjectURL(photo.url)
      }
    })
    
    setPhotos([])
    setSelectedPhoto(null)
    setCapturedPoses(new Set())
    toast.info('All photos removed')
  }
  
  // Handle completion with upload to storage
  const handleComplete = async () => {
    if (!isReady) return
    
    setIsProcessing(true)
    try {
      // Upload photos to storage
      const formData = new FormData()
      
      // Add photos to form data
      for (const photo of photos) {
        if (photo.file) {
          formData.append('photos', photo.file)
        }
      }
      
      // Add metadata
      formData.append('personaName', 'Main Persona')
      formData.append('description', 'Professional persona for AI-generated content')
      
      // Upload to API
      const response = await fetch('/api/onboarding/upload-photos', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const result = await response.json()
      
      // Clean up object URLs
      stopCamera()
      
      // Pass the uploaded photos data to parent
      onComplete(photos.map((photo, idx) => ({
        ...photo,
        url: result.photos?.[idx]?.url || photo.url
      })))
      
      toast.success('Photos uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photos. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Handle skip
  const handleSkip = () => {
    setShowSkipDialog(true)
  }
  
  const confirmSkip = () => {
    stopCamera()
    if (onSkip) {
      onSkip()
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      photos.forEach(photo => {
        if (photo.url && photo.type === 'captured') {
          URL.revokeObjectURL(photo.url)
        }
      })
    }
  }, [])
  
  return (
    <TooltipProvider>
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Badge variant="outline" className="text-xs">
              Step {currentStep} of {totalSteps}
            </Badge>
            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip this step
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight"
          >
            Train Your AI Avatar
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Create professional thumbnails with your face using AI. 
            {isMobile ? ' Take selfies or upload photos.' : ' Use your camera or upload existing photos.'}
          </motion.p>
          
          {/* Quick Tips Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                {(() => {
                  const IconComponent = QUICK_TIPS[currentTip].icon
                  return <IconComponent className={cn("h-4 w-4", QUICK_TIPS[currentTip].color)} />
                })()}
                <span className="text-sm">
                  <span className="font-medium">{QUICK_TIPS[currentTip].title}:</span>{' '}
                  {QUICK_TIPS[currentTip].description}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* Progress Section */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {photos.length === 0 && 'No photos added yet'}
                  {photos.length > 0 && photos.length < minPhotos && `${minPhotos - photos.length} more needed to continue`}
                  {photos.length >= minPhotos && photos.length < recommendedPhotos && `${recommendedPhotos - photos.length} more for best results`}
                  {photos.length >= recommendedPhotos && '✨ Perfect amount of photos!'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold">{photos.length}</p>
                  <p className="text-xs text-muted-foreground">of {recommendedPhotos} recommended</p>
                </div>
                
                {isOptimal && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Minimum ({minPhotos})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Good ({Math.floor((minPhotos + recommendedPhotos) / 2)})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Recommended ({recommendedPhotos})
                </span>
              </div>
            </div>
            
            {/* Pose tracking */}
            {photos.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Captured angles:</span>
                {POSE_GUIDES.map((pose) => (
                  <Badge
                    key={pose.id}
                    variant={capturedPoses.has(pose.id) ? "default" : "outline"}
                    className="text-xs"
                  >
                    {pose.icon} {pose.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Capture/Upload */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="capture" className="gap-2">
                  <Camera className="h-4 w-4" />
                  {isMobile ? 'Take Photos' : 'Use Camera'}
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Photos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="capture" className="mt-4 space-y-4">
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
                        
                        {/* Camera overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Face guide */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="relative">
                              <div className="w-48 h-56 md:w-56 md:h-64 border-2 border-white/30 rounded-full" />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                                <p className="text-white text-xs">Position face here</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Grid overlay */}
                          {showGrid && (
                            <svg className="absolute inset-0 w-full h-full">
                              <defs>
                                <pattern id="grid" width="33.33%" height="33.33%" patternUnits="userSpaceOnUse">
                                  <rect width="100%" height="100%" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                          )}
                          
                          {/* Countdown overlay */}
                          {countdownActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center"
                            >
                              <motion.div
                                key={countdown}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                className="text-white text-8xl font-bold"
                              >
                                {countdown}
                              </motion.div>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Camera controls */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => setShowGrid(!showGrid)}
                                className="bg-black/50 hover:bg-black/70 text-white"
                              >
                                <Grid3x3 className={cn("h-4 w-4", showGrid && "text-primary")} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle grid</TooltipContent>
                          </Tooltip>
                          
                          {isMobile && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  onClick={switchCamera}
                                  className="bg-black/50 hover:bg-black/70 text-white"
                                >
                                  <FlipHorizontal className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Switch camera</TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Button
                            size="lg"
                            onClick={capturePhoto}
                            disabled={isCapturing || countdownActive || isFull}
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
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={startCountdownCapture}
                                disabled={countdownActive || isFull}
                                className="bg-black/50 hover:bg-black/70 text-white"
                              >
                                <Timer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Timer (3s)</TooltipContent>
                          </Tooltip>
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
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                        {cameraError ? (
                          <Alert className="max-w-md">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Camera Error</AlertTitle>
                            <AlertDescription>{cameraError}</AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                            >
                              <Camera className="h-12 w-12 text-primary" />
                            </motion.div>
                            <div className="text-center space-y-2">
                              <p className="font-medium">Ready to capture your photos?</p>
                              <p className="text-sm text-muted-foreground">
                                We'll guide you through different poses
                              </p>
                            </div>
                          </>
                        )}
                        <Button onClick={startCamera} size="lg" className="gap-2">
                          <Camera className="h-5 w-5" />
                          {isMobile ? 'Open Camera' : 'Start Camera'}
                        </Button>
                      </div>
                    )}
                    
                    {/* Camera Controls */}
                    {cameraActive && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 p-4">
                        <Button
                          onClick={startCountdownCapture}
                          size="lg"
                          disabled={isCapturing || countdownActive || isFull}
                          className="gap-2"
                        >
                          {countdownActive ? (
                            <>
                              <Timer className="h-5 w-5 animate-pulse" />
                              {countdown}s
                            </>
                          ) : (
                            <>
                              <Aperture className="h-5 w-5" />
                              Capture Photo
                            </>
                          )}
                        </Button>
                        
                        {isMobile && (
                          <Button
                            onClick={switchCamera}
                            size="icon"
                            variant="outline"
                          >
                            <FlipHorizontal className="h-5 w-5" />
                          </Button>
                        )}
                        
                        <Button
                          onClick={stopCamera}
                          size="icon"
                          variant="outline"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
                
                {/* Pose guide */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Recommended Poses
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {POSE_GUIDES.map((pose) => (
                      <Button
                        key={pose.id}
                        variant={capturedPoses.has(pose.id) ? "secondary" : "outline"}
                        size="sm"
                        className="h-auto py-2 px-3"
                        onClick={() => {
                          if (cameraActive) {
                            toast.info(`Try this pose: ${pose.label}`)
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{pose.icon}</div>
                          <div className="text-xs">{pose.label}</div>
                          <div className="text-xs text-muted-foreground">{pose.angle}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="upload" className="mt-4 space-y-4">
                <Card className="p-8">
                  <div
                    ref={dropZoneRef}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      {dragActive ? (
                        <CloudUpload className="h-8 w-8 text-primary animate-pulse" />
                      ) : (
                        <Upload className="h-8 w-8 text-primary" />
                      )}
                    </motion.div>
                    
                    <h3 className="font-semibold text-lg mb-2">
                      {dragActive ? 'Drop your photos here' : 'Upload your photos'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isMobile ? 'Tap to select photos' : 'Click to browse or drag and drop'}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileImage className="h-3 w-3" />
                        JPG, PNG, HEIC
                      </span>
                      <span className="flex items-center gap-1">
                        <Images className="h-3 w-3" />
                        Max 10MB each
                      </span>
                      <span className="flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        Multiple files OK
                      </span>
                    </div>
                  </div>
                </Card>
                
                {isProcessing && (
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Processing photos...</p>
                        <p className="text-sm text-muted-foreground">Analyzing quality and preparing for training</p>
                      </div>
                    </div>
                  </Card>
                )}
                
                {/* Upload tips */}
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Pro Tips for Best Results</AlertTitle>
                  <AlertDescription className="mt-2 space-y-1">
                    <p>• Include photos from different angles and expressions</p>
                    <p>• Ensure your face is clearly visible in each photo</p>
                    <p>• Avoid group photos or photos with heavy filters</p>
                    <p>• Higher quality photos = better AI results</p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right: Photo Gallery */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Images className="h-4 w-4" />
                  Your Photos ({photos.length}/{maxPhotos})
                </h3>
                {photos.length > 0 && (
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={deleteAllPhotos}
                          className="h-8 w-8 text-destructive hover:text-destructive"
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center"
                >
                  <div className="text-center p-8">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">No photos yet</p>
                    <p className="text-sm text-muted-foreground">
                      {isMobile ? 'Take or upload photos to get started' : 'Capture or upload photos to get started'}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <AnimatePresence>
                      {photos.map((photo) => (
                        <motion.div
                          key={photo.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group aspect-square"
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                            onClick={() => setSelectedPhoto(photo.id)}
                          />
                          
                          {/* Quality indicator */}
                          <div className="absolute top-1 left-1">
                            <Tooltip>
                              <TooltipTrigger>
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  photo.quality.overall >= 0.8 ? "bg-green-500" :
                                  photo.quality.overall >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                                )} />
                              </TooltipTrigger>
                              <TooltipContent>
                                Quality: {(photo.quality.overall * 100).toFixed(0)}%
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          
                          {/* Type badge */}
                          <Badge
                            variant={photo.type === 'captured' ? 'default' : 'secondary'}
                            className="absolute bottom-1 left-1 text-xs px-1.5 py-0 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {photo.type === 'captured' ? <Camera className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                          </Badge>
                          
                          {/* Delete button */}
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePhoto(photo.id)
                            }}
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Empty slots */}
                    {photos.length < recommendedPhotos && (
                      <>
                        {[...Array(Math.min(recommendedPhotos - photos.length, 12 - photos.length))].map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center"
                          >
                            <span className="text-xs text-muted-foreground">
                              {photos.length + i + 1 <= minPhotos ? (
                                <Badge variant="outline" className="text-xs scale-75">Required</Badge>
                              ) : (
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              )}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  
                  {/* Quality summary */}
                  {photos.length > 0 && (
                    <Card className="p-4 bg-muted/30">
                      <h4 className="text-sm font-medium mb-2">Quality Summary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Average Quality</span>
                          <span className="font-medium">
                            {(photos.reduce((acc, p) => acc + p.quality.overall, 0) / photos.length * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {photos.map((photo) => (
                            <div
                              key={photo.id}
                              className={cn(
                                "flex-1 h-1 rounded-full",
                                photo.quality.overall >= 0.8 ? "bg-green-500" :
                                photo.quality.overall >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </Card>
            
            {/* Status messages */}
            {photos.length > 0 && (
              <Alert variant={isOptimal ? "default" : photos.length >= minPhotos ? "default" : "destructive"}>
                {isOptimal ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Perfect!</AlertTitle>
                    <AlertDescription>
                      You have the recommended amount of photos for excellent AI training results.
                    </AlertDescription>
                  </>
                ) : photos.length >= minPhotos ? (
                  <>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Ready to continue</AlertTitle>
                    <AlertDescription>
                      You can proceed, but adding {recommendedPhotos - photos.length} more photo{recommendedPhotos - photos.length !== 1 && 's'} will improve results.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>More photos needed</AlertTitle>
                    <AlertDescription>
                      Add {minPhotos - photos.length} more photo{minPhotos - photos.length !== 1 && 's'} to continue.
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isProcessing}
            size="lg"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={handleComplete}
              disabled={!isReady || isProcessing}
              size="lg"
              className={cn(
                "min-w-[140px]",
                isOptimal && "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isOptimal ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Training
                </>
              ) : isReady ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Continue
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {minPhotos - photos.length} more needed
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Skip confirmation dialog */}
        <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip AI Avatar Training?</DialogTitle>
              <DialogDescription>
                You can always set up your AI avatar later, but you'll miss out on:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 my-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Personalized thumbnails</p>
                  <p className="text-sm text-muted-foreground">AI-generated thumbnails with your face</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Professional consistency</p>
                  <p className="text-sm text-muted-foreground">Maintain your brand across all content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Higher engagement</p>
                  <p className="text-sm text-muted-foreground">Thumbnails with faces get 38% more clicks</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
                Go Back
              </Button>
              <Button variant="ghost" onClick={confirmSkip}>
                Skip Anyway
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
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
                
                {/* Quality details */}
                {(() => {
                  const photo = photos.find(p => p.id === selectedPhoto)
                  if (!photo) return null
                  
                  return (
                    <Card className="absolute bottom-4 left-4 right-4 p-4 bg-background/95 backdrop-blur">
                      <h4 className="font-semibold mb-3">Photo Quality Analysis</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">Lighting</span>
                          </div>
                          <Progress value={photo.quality.lighting * 100} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            {(photo.quality.lighting * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Focus className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Clarity</span>
                          </div>
                          <Progress value={photo.quality.clarity * 100} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            {(photo.quality.clarity * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Aperture className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">Angle</span>
                          </div>
                          <Progress value={photo.quality.angle * 100} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            {(photo.quality.angle * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Overall</span>
                          </div>
                          <Progress value={photo.quality.overall * 100} className="h-1.5" />
                          <p className="text-xs font-medium">
                            {(photo.quality.overall * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      {photo.metadata && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                          <span>{photo.metadata.fileName || `Photo ${photos.indexOf(photo) + 1}`}</span>
                          {photo.metadata.fileSize && (
                            <span>{(photo.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                          )}
                        </div>
                      )}
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
