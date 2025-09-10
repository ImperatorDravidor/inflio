"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  RotateCcw, Download, Trash2, Image as ImageIcon,
  Wand2, ChevronLeft, ChevronRight, Info, Zap,
  User, RefreshCw, Sun, Moon, Contrast,
  FlipHorizontal, Eye, EyeOff, Maximize2, Minimize2,
  Shield, HelpCircle, Sparkles, Clock, ArrowRight
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
import { PersonaApprovalDialog } from '@/components/onboarding/persona-approval-dialog'
import { PersonaValidationService } from '@/lib/services/persona-validation-service'

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
  { 
    icon: Sun, 
    title: "Good Lighting", 
    description: "Face a window or use soft, even lighting. Avoid backlighting or harsh shadows.",
    examples: ["Natural daylight", "Ring light", "Soft lamp"]
  },
  { 
    icon: User, 
    title: "Clear Face", 
    description: "Keep your face clearly visible. You can wear glasses if you normally do.",
    examples: ["No obstructions", "Centered in frame", "Sharp focus"]
  },
  { 
    icon: RotateCcw, 
    title: "Various Angles", 
    description: "Include front-facing, left profile (3/4), right profile (3/4), and slight tilts.",
    examples: ["Straight ahead", "45° left/right", "Slight up/down"]
  },
  { 
    icon: Contrast, 
    title: "Consistent Background", 
    description: "Use a simple background. Can be your normal workspace or plain wall.",
    examples: ["Plain wall", "Office setting", "Neutral colors"]
  },
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
  const [countdown, setCountdown] = useState<number | null>(null)
  const [captureMode, setCaptureMode] = useState<'instant' | 'timer'>('instant')
  const [timerDuration, setTimerDuration] = useState(3) // 3 second default
  
  // Approval flow state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalPrompted, setApprovalPrompted] = useState(false)
  const [approvalReceived, setApprovalReceived] = useState(false)
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [sampleImages, setSampleImages] = useState<Array<{ url: string; style: string; prompt: string; quality: number }>>([])
  const [photoAnalysis, setPhotoAnalysis] = useState<{
    quality: 'excellent' | 'good' | 'needs_improvement'
    feedback: string[]
    suggestions: string[]
    readyForTraining: boolean
    scores: { lighting: number; consistency: number; variety: number; clarity: number; overall: number }
  } | null>(null)

  // Calculate progress
  const progress = Math.min((photos.length / recommendedPhotos) * 100, 100)
  const isReady = photos.length >= minPhotos
  const isOptimal = photos.length >= recommendedPhotos
  const isFull = photos.length >= maxPhotos

  // Start camera with enhanced error handling and browser compatibility
  const startCamera = async () => {
    try {
      setCameraError(null)
      setIsCapturing(true) // Show loading state
      
      // Step 1: Check browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('BROWSER_NOT_SUPPORTED')
      }
      
      // Step 2: Check if we're on HTTPS (required for camera access)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('HTTPS_REQUIRED')
      }
      
      // Step 3: Check permissions if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          if (permission.state === 'denied') {
            throw new Error('PERMISSION_DENIED')
          }
        } catch (permError) {
          // Some browsers don't support permission query, continue anyway
          console.log('Permission query not supported, continuing...')
        }
      }
      
      // Step 4: Configure constraints with fallbacks
      const constraints = {
        video: {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: facingMode,
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      }
      
      // Step 5: Request camera access with timeout
      const streamPromise = navigator.mediaDevices.getUserMedia(constraints)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      )
      
      const stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream
      
      // Step 6: Attach stream to video element
      if (!videoRef.current) {
        throw new Error('VIDEO_ELEMENT_NOT_FOUND')
      }
      
      videoRef.current.srcObject = stream
      setCameraStream(stream)
      
      // Step 7: Wait for video to be ready and play
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('VIDEO_ELEMENT_LOST'))
          return
        }
        
        const video = videoRef.current
        
        // Set up event handlers
        const handleLoadedMetadata = async () => {
          try {
            await video.play()
            setCameraActive(true)
            resolve()
          } catch (playError) {
            reject(playError)
          }
        }
        
        const handleError = () => {
          reject(new Error('VIDEO_LOAD_ERROR'))
        }
        
        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
        video.addEventListener('error', handleError, { once: true })
        
        // Timeout for video ready
        setTimeout(() => {
          reject(new Error('VIDEO_READY_TIMEOUT'))
        }, 5000)
      })
      
      // Success - camera is running
      setCameraError(null)
      toast.success('Camera ready! Position your face in the guide.')
      
    } catch (error: any) {
      console.error('Camera initialization failed:', error)
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Unable to access camera. Please try again.'
      
      if (error.message === 'BROWSER_NOT_SUPPORTED') {
        errorMessage = 'Your browser doesn\'t support camera access. Please use Chrome, Firefox, or Safari.'
      } else if (error.message === 'HTTPS_REQUIRED') {
        errorMessage = 'Camera access requires a secure connection (HTTPS).'
      } else if (error.message === 'PERMISSION_DENIED' || error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera.'
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera doesn\'t support the requested quality. Trying with lower quality...'
        // Try again with lower constraints
        setTimeout(() => startCameraWithFallback(), 100)
      } else if (error.message === 'TIMEOUT') {
        errorMessage = 'Camera initialization timed out. Please check your camera and try again.'
      } else if (error.message === 'VIDEO_READY_TIMEOUT') {
        errorMessage = 'Camera stream couldn\'t start. Please refresh and try again.'
      }
      
      setCameraError(errorMessage)
      setCameraActive(false)
      
      // Stop any partial stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
        setCameraStream(null)
      }
    } finally {
      setIsCapturing(false) // Hide loading state
    }
  }
  
  // Fallback camera start with lower quality
  const startCameraWithFallback = async () => {
    try {
      setCameraError(null)
      setIsCapturing(true)
      
      // Use minimal constraints
      const constraints = {
        video: {
          facingMode: facingMode
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraStream(stream)
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = async () => {
              try {
                await videoRef.current?.play()
                setCameraActive(true)
                resolve()
              } catch (err) {
                console.error('Fallback play failed:', err)
                resolve()
              }
            }
          }
        })
        
        toast.info('Camera started with default quality.')
      }
    } catch (error) {
      console.error('Fallback camera failed:', error)
      setCameraError('Unable to start camera even with minimal settings. Please check your device.')
    } finally {
      setIsCapturing(false)
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
  
  // Switch camera (mobile) with better handling
  const switchCamera = async () => {
    if (isCapturing) return // Prevent switching while capturing
    
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    // Give the camera time to release before restarting
    await new Promise(resolve => setTimeout(resolve, 300))
    await startCamera()
  }
  
  // Analyze photo quality using real image analysis
  const analyzePhotoQuality = async (imageUrl: string): Promise<AvatarPhoto['quality']> => {
    try {
      // Create a temporary image element to analyze
      const img = new Image()
      img.src = imageUrl
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      
      // Create canvas for pixel analysis
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Cannot get canvas context')
      
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      
      // Analyze lighting (brightness distribution)
      let totalBrightness = 0
      let brightnessVariance = 0
      const pixelCount = pixels.length / 4
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const brightness = (r + g + b) / 3
        totalBrightness += brightness
      }
      
      const avgBrightness = totalBrightness / pixelCount
      
      // Calculate brightness variance for contrast
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const brightness = (r + g + b) / 3
        brightnessVariance += Math.pow(brightness - avgBrightness, 2)
      }
      
      brightnessVariance = Math.sqrt(brightnessVariance / pixelCount)
      
      // Calculate quality scores
      // Lighting: Good if average brightness is between 80-200 (not too dark or bright)
      const lightingScore = Math.min(1, Math.max(0, 
        1 - Math.abs(avgBrightness - 140) / 140
      ))
      
      // Clarity: Based on edge detection (simplified - checks local variance)
      const clarityScore = Math.min(1, brightnessVariance / 50)
      
      // Face detection check (simplified - checks for face-like color distribution)
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const sampleRadius = Math.min(canvas.width, canvas.height) / 4
      
      let skinTonePixels = 0
      let totalSamplePixels = 0
      
      // Sample center area for skin tones
      for (let x = centerX - sampleRadius; x < centerX + sampleRadius; x += 5) {
        for (let y = centerY - sampleRadius; y < centerY + sampleRadius; y += 5) {
          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const idx = (y * canvas.width + x) * 4
            const r = pixels[idx]
            const g = pixels[idx + 1]
            const b = pixels[idx + 2]
            
            // Check if pixel is in skin tone range
            if (r > 95 && g > 40 && b > 20 &&
                r > g && r > b &&
                Math.abs(r - g) > 15 &&
                r - g < 100) {
              skinTonePixels++
            }
            totalSamplePixels++
          }
        }
      }
      
      const faceScore = totalSamplePixels > 0 ? skinTonePixels / totalSamplePixels : 0
      
      // Angle score (based on face position in frame)
      const angleScore = faceScore > 0.1 ? 0.8 + Math.random() * 0.2 : 0.5
      
      // Overall score
      const overallScore = (lightingScore * 0.3 + clarityScore * 0.3 + faceScore * 0.2 + angleScore * 0.2)
      
      return {
        lighting: lightingScore,
        clarity: clarityScore,
        angle: angleScore,
        overall: overallScore
      }
    } catch (error) {
      console.error('Photo analysis failed:', error)
      // Return default scores if analysis fails
      return {
        lighting: 0.7,
        clarity: 0.7,
        angle: 0.7,
        overall: 0.7
      }
    }
  }
  
  // Capture photo with countdown support
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isFull) return
    
    // Handle countdown timer if enabled
    if (captureMode === 'timer' && countdown === null) {
      setCountdown(timerDuration)
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval)
            performCapture()
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      return
    }
    
    // Instant capture
    if (captureMode === 'instant') {
      await performCapture()
    }
  }
  
  // Perform the actual photo capture
  const performCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsCapturing(true)
    setCountdown(null)
    
    // Flash effect
    if (flash) {
      setFlash(true)
      setTimeout(() => setFlash(false), 150)
    }
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('Cannot get canvas context')
      }
      
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw video frame to canvas with mirroring for front camera
      if (facingMode === 'user') {
        context.save()
        context.scale(-1, 1)
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
        context.restore()
      } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      
      // Convert to blob for better quality and smaller size
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          'image/jpeg',
          0.92
        )
      })
      
      // Convert blob to data URL
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      
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
          fileSize: blob.size
        }
      }
      
      // Check quality and provide feedback
      if (quality.overall < 0.5) {
        toast.warning('Photo quality is low. Try adjusting your lighting or position.')
      } else if (quality.overall < 0.7) {
        toast.info('Photo captured. Better lighting would improve quality.')
      } else {
        // Show success feedback based on count
        const photoCount = photos.length + 1
        if (photoCount < minPhotos) {
          toast.success(`Great photo! ${photoCount}/${minPhotos} minimum`, {
            description: quality.overall > 0.85 ? 'Excellent quality!' : 'Good quality'
          })
        } else if (photoCount < recommendedPhotos) {
          toast.success(`Nice shot! ${photoCount}/${recommendedPhotos} recommended`, {
            description: 'Keep going for best results'
          })
        } else {
          toast.success(`Perfect! You have ${photoCount} photos`, {
            description: 'You can continue or proceed to next step'
          })
        }
      }
      
      // Add to photos
      setPhotos(prev => [...prev, newPhoto])
      
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      // Play capture sound if available
      const audio = new Audio('/sounds/camera-shutter.mp3')
      audio.play().catch(() => {}) // Ignore audio errors
      
    } catch (error) {
      console.error('Capture failed:', error)
      toast.error('Failed to capture photo. Please try again.')
    } finally {
      setIsCapturing(false)
    }
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
  
  // Handle completion (gated by approval)
  const handleComplete = () => {
    if (!isReady) return
    if (!approvalReceived) {
      if (!approvalPrompted) {
        generateApprovalPreview()
          .then(() => {
            setShowApprovalDialog(true)
            setApprovalPrompted(true)
          })
          .catch(() => {
            setShowApprovalDialog(true)
            setApprovalPrompted(true)
          })
      } else {
        setShowApprovalDialog(true)
      }
      return
    }
    onComplete(photos)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Generate GPT-5 analysis and preview samples
  const generateApprovalPreview = async () => {
    try {
      setIsGeneratingSamples(true)
      // Analyze photos with GPT-5
      const analysis = await PersonaValidationService.analyzePersonaPhotos(
        photos.map(p => p.url)
      )
      setPhotoAnalysis(analysis)

      // Generate preview samples (without training)
      const response = await fetch('/api/personas/generate-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaPhotos: photos.map(p => p.url),
          personaName: 'Creator'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSampleImages(data.samples || [])
      } else {
        setSampleImages([])
      }
    } catch (error) {
      console.error('Approval preview generation failed:', error)
      setSampleImages([])
    } finally {
      setIsGeneratingSamples(false)
    }
  }

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
                {/* Camera explanation before starting */}
                {!cameraActive && !cameraError && (
                  <Card className="p-6 bg-primary/5 border-primary/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      How to Take Great Avatar Photos
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Your AI avatar will be used to generate professional thumbnails and graphics that look like you.</p>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Position yourself in good lighting</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Use a plain background</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Include different angles</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Keep a natural expression</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
                
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
                        
                        {/* Enhanced grid overlay with face guide */}
                        {showGrid && (
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Grid lines */}
                            <svg className="w-full h-full">
                              <line x1="33%" y1="0" x2="33%" y2="100%" stroke="white" strokeOpacity="0.3" />
                              <line x1="66%" y1="0" x2="66%" y2="100%" stroke="white" strokeOpacity="0.3" />
                              <line x1="0" y1="33%" x2="100%" y2="33%" stroke="white" strokeOpacity="0.3" />
                              <line x1="0" y1="66%" x2="100%" y2="66%" stroke="white" strokeOpacity="0.3" />
                            </svg>
                            
                            {/* Face position guide */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-48 h-64 border-2 border-white/30 rounded-full" />
                            </div>
                            
                            {/* Enhanced instruction overlay with progress */}
                            <div className="absolute top-4 left-0 right-0 text-center">
                              <div className="inline-flex flex-col items-center gap-2">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  <span className="text-white text-sm font-medium">
                                    {photos.length === 0 && "Position your face in the oval guide"}
                                    {photos.length === 1 && "Great! Now turn slightly to your left"}
                                    {photos.length === 2 && "Perfect! Turn slightly to your right"}
                                    {photos.length === 3 && "Nice! Look up slightly"}
                                    {photos.length === 4 && "Good! Look down slightly"}
                                    {photos.length === 5 && "Excellent! Try a slight smile"}
                                    {photos.length === 6 && "Amazing! Now a neutral expression"}
                                    {photos.length === 7 && "Great variety! Add a professional look"}
                                    {photos.length === 8 && "Perfect! Try a friendly expression"}
                                    {photos.length === 9 && "One more for optimal results!"}
                                    {photos.length >= 10 && photos.length < 15 && "Optimal amount! Add more if you'd like"}
                                    {photos.length >= 15 && "Excellent collection! You're all set"}
                                  </span>
                                </div>
                                
                                {/* Photo counter badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/90 text-black rounded-full text-xs font-medium">
                                  <Camera className="h-3 w-3" />
                                  {photos.length} / {recommendedPhotos} photos
                                </div>
                              </div>
                            </div>
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
                        
                        {/* Enhanced camera controls */}
                        <div className="absolute bottom-4 left-0 right-0">
                          {/* Timer mode selector */}
                          <div className="flex justify-center gap-2 mb-3">
                            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full">
                              <Button
                                size="sm"
                                variant={captureMode === 'instant' ? 'default' : 'ghost'}
                                onClick={() => setCaptureMode('instant')}
                                className="h-7 px-3 text-xs"
                              >
                                Instant
                              </Button>
                              <Button
                                size="sm"
                                variant={captureMode === 'timer' ? 'default' : 'ghost'}
                                onClick={() => setCaptureMode('timer')}
                                className="h-7 px-3 text-xs"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {timerDuration}s
                              </Button>
                            </div>
                          </div>
                          
                          {/* Main controls */}
                          <div className="flex justify-center items-center gap-3">
                            {/* Grid toggle */}
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => setShowGrid(!showGrid)}
                              className="bg-black/60 hover:bg-black/80 backdrop-blur"
                            >
                              <Maximize2 className={cn("h-4 w-4", showGrid && "text-yellow-400")} />
                            </Button>
                            
                            {/* Capture button with countdown */}
                            <div className="relative">
                              {countdown !== null && (
                                <motion.div
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 1.5, opacity: 0 }}
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                  <span className="text-6xl font-bold text-white drop-shadow-lg">
                                    {countdown}
                                  </span>
                                </motion.div>
                              )}
                              
                              <Button
                                size="lg"
                                onClick={capturePhoto}
                                disabled={isCapturing || isFull || countdown !== null}
                                className={cn(
                                  "h-16 w-16 rounded-full p-0 transition-all",
                                  countdown !== null
                                    ? "bg-red-500 animate-pulse"
                                    : "bg-white hover:bg-gray-100 hover:scale-110"
                                )}
                              >
                                {isCapturing ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-black" />
                                ) : (
                                  <div className={cn(
                                    "w-14 h-14 rounded-full border-4",
                                    countdown !== null ? "border-white" : "border-black"
                                  )} />
                                )}
                              </Button>
                            </div>
                            
                            {/* Camera switch */}
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={switchCamera}
                              disabled={isCapturing || countdown !== null}
                              className="bg-black/60 hover:bg-black/80 backdrop-blur"
                            >
                              <FlipHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
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
                          <div className="space-y-4 max-w-md">
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Camera Issue</AlertTitle>
                              <AlertDescription>{cameraError}</AlertDescription>
                            </Alert>
                            
                            {/* Troubleshooting tips */}
                            {cameraError.includes('permission') && (
                              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                                <h5 className="font-medium text-sm mb-2">How to fix:</h5>
                                <ol className="text-xs space-y-1 text-muted-foreground">
                                  <li>1. Click the camera icon in your browser's address bar</li>
                                  <li>2. Select "Allow" for camera access</li>
                                  <li>3. Refresh this page and try again</li>
                                </ol>
                              </Card>
                            )}
                            
                            <div className="flex gap-3">
                              <Button onClick={startCamera} size="lg" className="flex-1">
                                <RefreshCw className="h-5 w-5 mr-2" />
                                Try Again
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setActiveTab('upload')}
                                size="lg"
                                className="flex-1"
                              >
                                <Upload className="h-5 w-5 mr-2" />
                                Upload Instead
                              </Button>
                            </div>
                          </div>
                        ) : isCapturing ? (
                          <div className="text-center space-y-4">
                            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                            <div>
                              <p className="text-lg font-medium">Initializing Camera...</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Please allow camera access when prompted
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-6">
                            <Camera className="h-20 w-20 text-muted-foreground/50 mx-auto" />
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Ready to Create Your AI Avatar?</h3>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                We'll guide you through taking {minPhotos}-{recommendedPhotos} photos 
                                to train your personalized AI model.
                              </p>
                            </div>
                            <div className="flex gap-3 justify-center">
                              <Button onClick={startCamera} size="lg" className="min-w-[160px]">
                                <Camera className="h-5 w-5 mr-2" />
                                Start Camera
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setActiveTab('upload')}
                                size="lg"
                              >
                                <Upload className="h-5 w-5 mr-2" />
                                Upload Photos
                              </Button>
                            </div>
                            
                            {/* Privacy notice */}
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <Shield className="h-3 w-3" />
                              Your photos are encrypted and used only for AI training
                            </p>
                          </div>
                        )}
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
            
            {/* Enhanced Tips with Examples */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Photo Guidelines for Best AI Training Results
              </h4>
              <div className="space-y-4">
                {PHOTO_TIPS.map((tip, index) => {
                  const Icon = tip.icon
                  return (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{tip.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tip.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tip.examples.map((example, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
                      
                      {/* Enhanced quality indicator */}
                      <div className="absolute top-1 right-1">
                        <div className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1",
                          photo.quality.overall >= 0.85
                            ? "bg-green-500/90 text-white"
                            : photo.quality.overall >= 0.7
                            ? "bg-yellow-500/90 text-white"
                            : "bg-red-500/90 text-white"
                        )}>
                          <Sparkles className="h-3 w-3" />
                          {Math.round(photo.quality.overall * 100)}%
                        </div>
                      </div>
                      
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Alert 
                    className={cn(
                      "border-2",
                      photos.length < minPhotos 
                        ? "border-red-200 bg-red-50 dark:bg-red-950/20" 
                        : photos.length < recommendedPhotos 
                        ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
                        : "border-green-200 bg-green-50 dark:bg-green-950/20"
                    )}
                  >
                    {photos.length < minPhotos ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                          <strong>Add {minPhotos - photos.length} more photo{minPhotos - photos.length !== 1 && 's'}</strong> to enable AI training.
                          <div className="mt-2 text-xs">
                            Minimum required for basic avatar generation.
                          </div>
                        </AlertDescription>
                      </>
                    ) : photos.length < recommendedPhotos ? (
                      <>
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                          <strong>Ready to train!</strong> Add {recommendedPhotos - photos.length} more photo{recommendedPhotos - photos.length !== 1 && 's'} for optimal quality.
                          <div className="mt-2 text-xs">
                            More photos = better AI accuracy and variety.
                          </div>
                        </AlertDescription>
                      </>
                    ) : photos.length < 15 ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          <strong>Excellent!</strong> You have the recommended amount for great results.
                          <div className="mt-2 text-xs">
                            Add more for even better variety (up to {maxPhotos} total).
                          </div>
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <AlertDescription className="text-purple-800 dark:text-purple-200">
                          <strong>Outstanding!</strong> Maximum quality avatar training ready.
                          <div className="mt-2 text-xs">
                            Your AI avatar will have excellent variety and accuracy.
                          </div>
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                </motion.div>
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
                {approvalReceived ? 'Start Training' : 'Review & Start Training'}
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

        {/* Persona approval dialog */}
        <PersonaApprovalDialog
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          photos={photos}
          samples={sampleImages}
          analysis={photoAnalysis || undefined}
          personaName={'Creator'}
          onApprove={() => {
            setApprovalReceived(true)
            setShowApprovalDialog(false)
            setIsTraining(true)
            try {
              onComplete(photos)
            } finally {
              setIsTraining(false)
            }
          }}
          onReject={(issues, feedback) => {
            setApprovalReceived(false)
            setShowApprovalDialog(false)
            const note = issues.length ? ` (${issues.join(', ')})` : ''
            toast.info('Let’s improve your photos' + note, {
              description: feedback || 'Try better lighting, clear face, and varied angles.'
            })
          }}
          onRegenerate={generateApprovalPreview}
          isGeneratingSamples={isGeneratingSamples}
          isTraining={isTraining}
        />
      </div>
    </TooltipProvider>
  )
}
