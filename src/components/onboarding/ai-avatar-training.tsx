"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
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
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

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
  onComplete: (photos: AvatarPhoto[], personaId?: string) => void
  onBack?: () => void
  onSkip?: () => void
  minPhotos?: number
  recommendedPhotos?: number
  maxPhotos?: number
  hideNavigation?: boolean
  formData?: any
  updateFormData?: (key: string, value: any) => void
  onSaveProgress?: (data: Record<string, any>) => Promise<void>
}

// Pose guidance for each photo
const POSE_GUIDANCE = [
  { instruction: "Look straight at the camera", icon: "👤", tip: "Face forward, neutral expression" },
  { instruction: "Slight smile, facing forward", icon: "😊", tip: "Natural, friendly smile" },
  { instruction: "Turn head slightly left", icon: "👈", tip: "About 30° to your left" },
  { instruction: "Turn head slightly right", icon: "👉", tip: "About 30° to your right" },
  { instruction: "Tilt chin up slightly", icon: "⬆️", tip: "Look slightly above camera" },
  { instruction: "Tilt chin down slightly", icon: "⬇️", tip: "Look slightly below camera" },
  { instruction: "Turn more to your left (3/4 view)", icon: "↩️", tip: "About 45° to your left" },
  { instruction: "Turn more to your right (3/4 view)", icon: "↪️", tip: "About 45° to your right" },
  { instruction: "Professional expression", icon: "💼", tip: "Confident, approachable look" },
  { instruction: "Relaxed, natural expression", icon: "😌", tip: "As if chatting with a friend" },
]

export function AIAvatarTraining({
  onComplete,
  onBack,
  onSkip,
  minPhotos = 5,
  recommendedPhotos = 10,
  maxPhotos = 10,
  hideNavigation = false,
  formData,
  updateFormData,
  onSaveProgress
}: AIAvatarTrainingProps) {
  const { user } = useUser()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captureInProgressRef = useRef(false) // Ref to prevent double captures

  const [photos, setPhotos] = useState<AvatarPhoto[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [showFlash, setShowFlash] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)

  // Training state
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingStatus, setTrainingStatus] = useState('')
  const [personaName, setPersonaName] = useState(formData?.fullName || '')
  const [personaId, setPersonaId] = useState<string | null>(null)

  // Calculate progress
  const progress = Math.min((photos.length / recommendedPhotos) * 100, 100)
  const isReady = photos.length >= minPhotos
  const isOptimal = photos.length >= recommendedPhotos
  const isFull = photos.length >= maxPhotos

  // Get current pose guidance
  const getCurrentPoseGuidance = () => {
    const index = Math.min(photos.length, POSE_GUIDANCE.length - 1)
    return POSE_GUIDANCE[index]
  }
  const currentPose = getCurrentPoseGuidance()

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(null)
      setIsCapturing(true)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('BROWSER_NOT_SUPPORTED')
      }

      const constraints = {
        video: {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: facingMode,
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (!videoRef.current) {
        throw new Error('VIDEO_ELEMENT_NOT_FOUND')
      }

      videoRef.current.srcObject = stream
      setCameraStream(stream)

      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('VIDEO_ELEMENT_LOST'))
          return
        }

        const video = videoRef.current

        const handleLoadedMetadata = async () => {
          try {
            await video.play()
            setCameraActive(true)
            resolve()
          } catch (playError) {
            reject(playError)
          }
        }

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
        setTimeout(() => reject(new Error('VIDEO_READY_TIMEOUT')), 5000)
      })

      setCameraError(null)

    } catch (error: any) {
      console.error('Camera initialization failed:', error)

      let errorMessage = 'Unable to access camera. Please try again.'

      if (error.message === 'BROWSER_NOT_SUPPORTED') {
        errorMessage = 'Your browser doesn\'t support camera access.'
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another app.'
      }

      setCameraError(errorMessage)
      setCameraActive(false)

      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
        setCameraStream(null)
      }
    } finally {
      setIsCapturing(false)
    }
  }

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setCameraActive(false)
  }, [cameraStream])

  // Switch camera
  const switchCamera = async () => {
    if (isCapturing) return
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    await new Promise(resolve => setTimeout(resolve, 300))
    await startCamera()
  }

  // Open camera modal
  const openCameraModal = async () => {
    setShowCameraModal(true)
    // Start camera after modal opens
    setTimeout(() => startCamera(), 100)
  }

  // Close camera modal
  const closeCameraModal = () => {
    stopCamera()
    setShowCameraModal(false)
  }

  // Analyze photo quality
  const analyzePhotoQuality = async (imageUrl: string): Promise<AvatarPhoto['quality']> => {
    try {
      const img = new Image()
      img.src = imageUrl

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Cannot get canvas context')

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data

      let totalBrightness = 0
      let brightnessVariance = 0
      const pixelCount = pixels.length / 4

      for (let i = 0; i < pixels.length; i += 4) {
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
        totalBrightness += brightness
      }

      const avgBrightness = totalBrightness / pixelCount

      for (let i = 0; i < pixels.length; i += 4) {
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
        brightnessVariance += Math.pow(brightness - avgBrightness, 2)
      }

      brightnessVariance = Math.sqrt(brightnessVariance / pixelCount)

      const lightingScore = Math.min(1, Math.max(0, 1 - Math.abs(avgBrightness - 140) / 140))
      const clarityScore = Math.min(1, brightnessVariance / 50)
      const angleScore = 0.8 + Math.random() * 0.2
      const overallScore = (lightingScore * 0.3 + clarityScore * 0.3 + angleScore * 0.4)

      return { lighting: lightingScore, clarity: clarityScore, angle: angleScore, overall: overallScore }
    } catch {
      return { lighting: 0.7, clarity: 0.7, angle: 0.7, overall: 0.7 }
    }
  }

  // Capture photo - with guard against double captures
  const capturePhoto = async () => {
    // Guard against double captures
    if (captureInProgressRef.current || !videoRef.current || !canvasRef.current || isFull) {
      return
    }

    captureInProgressRef.current = true
    setIsCapturing(true)

    // Flash effect
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 150)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error('Camera stream not ready. Please wait.')
        return
      }

      const context = canvas.getContext('2d')
      if (!context) throw new Error('Cannot get canvas context')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw with mirroring for front camera
      if (facingMode === 'user') {
        context.save()
        context.scale(-1, 1)
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
        context.restore()
      } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          'image/jpeg',
          0.92
        )
      })

      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const quality = await analyzePhotoQuality(imageUrl)

      const newPhoto: AvatarPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        type: 'captured',
        quality,
        metadata: { timestamp: new Date(), fileSize: blob.size }
      }

      setPhotos(prev => [...prev, newPhoto])

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50)

      // Success feedback
      const photoCount = photos.length + 1
      if (photoCount >= recommendedPhotos) {
        toast.success(`${photoCount} photos captured!`, { description: 'You can continue or add more' })
      } else if (photoCount >= minPhotos) {
        toast.success(`${photoCount}/${recommendedPhotos} - Looking good!`)
      }

    } catch (error) {
      console.error('Capture failed:', error)
      toast.error('Failed to capture photo')
    } finally {
      setIsCapturing(false)
      // Reset the capture guard after a short delay
      setTimeout(() => {
        captureInProgressRef.current = false
      }, 300)
    }
  }

  // Handle file upload with proper validation feedback
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check if already at max
    if (isFull) {
      toast.error(`Maximum ${maxPhotos} photos allowed`, {
        description: 'Remove some photos to add new ones'
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsProcessing(true)
    const validFiles: File[] = []
    const rejectedFiles: { name: string; reason: string }[] = []
    const availableSlots = maxPhotos - photos.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check if we've reached available slots
      if (validFiles.length >= availableSlots) {
        rejectedFiles.push({ name: file.name, reason: `Limit reached (max ${maxPhotos})` })
        continue
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        rejectedFiles.push({ name: file.name, reason: 'Not an image file' })
        continue
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        rejectedFiles.push({ name: file.name, reason: `Too large (${(file.size / 1024 / 1024).toFixed(1)}MB > 10MB)` })
        continue
      }
      
      validFiles.push(file)
    }

    // Show rejection feedback
    if (rejectedFiles.length > 0) {
      const skippedCount = rejectedFiles.length
      if (skippedCount === 1) {
        toast.warning(`Skipped: ${rejectedFiles[0].name}`, {
          description: rejectedFiles[0].reason
        })
      } else if (skippedCount <= 3) {
        toast.warning(`${skippedCount} files skipped`, {
          description: rejectedFiles.map(f => `${f.name}: ${f.reason}`).join('\n')
        })
      } else {
        toast.warning(`${skippedCount} files skipped`, {
          description: `${rejectedFiles.slice(0, 2).map(f => f.name).join(', ')} and ${skippedCount - 2} more. Check file types and sizes.`
        })
      }
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsProcessing(false)
      return
    }

    try {
      const newPhotos = await Promise.all(
        validFiles.map(async (file, index) => {
          const imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          const quality = await analyzePhotoQuality(imageUrl)

          return {
            id: `photo-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            url: imageUrl,
            type: 'uploaded' as const,
            quality,
            metadata: { fileName: file.name, fileSize: file.size, timestamp: new Date() }
          }
        })
      )

      setPhotos(prev => [...prev, ...newPhotos])
      
      // Show success with context
      const totalAfter = photos.length + newPhotos.length
      if (totalAfter >= recommendedPhotos) {
        toast.success(`${newPhotos.length} photo${newPhotos.length !== 1 ? 's' : ''} added!`, {
          description: `You now have ${totalAfter} photos - ready to create your avatar!`
        })
      } else if (totalAfter >= minPhotos) {
        toast.success(`${newPhotos.length} photo${newPhotos.length !== 1 ? 's' : ''} added!`, {
          description: `${totalAfter}/${recommendedPhotos} photos. Add ${recommendedPhotos - totalAfter} more for best results.`
        })
      } else {
        toast.success(`${newPhotos.length} photo${newPhotos.length !== 1 ? 's' : ''} added!`, {
          description: `${totalAfter}/${minPhotos} minimum photos. Add ${minPhotos - totalAfter} more.`
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Some photos failed to process')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsProcessing(false)
    }
  }

  // Handle drag and drop
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0 || isFull) return

    const dataTransfer = new DataTransfer()
    Array.from(files).forEach(file => dataTransfer.items.add(file))

    const syntheticEvent = {
      target: { files: dataTransfer.files }
    } as React.ChangeEvent<HTMLInputElement>

    await handleFileUpload(syntheticEvent)
  }

  // Delete photo
  const deletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (selectedPhoto === photoId) setSelectedPhoto(null)
  }

  // Delete all photos
  const deleteAllPhotos = () => {
    setPhotos([])
    setSelectedPhoto(null)
    toast.info("All photos removed")
  }

  // Handle completion
  const handleComplete = () => {
    if (!isReady) return
    startPersonaTraining()
  }

  // Start persona creation (now with background processing)
  const startPersonaTraining = async () => {
    if (!isReady || isTraining) return

    setIsTraining(true)
    setTrainingProgress(0)
    setTrainingStatus('Preparing your photos...')

    try {
      // Get Clerk user ID
      if (!user?.id) {
        throw new Error('Please sign in to create a persona')
      }
      const userId = user.id

      const supabase = createSupabaseBrowserClient()

      // Step 1: Upload photos directly to Supabase Storage
      setTrainingProgress(10)
      setTrainingStatus('Uploading photos to storage...')

      const photoUrls: string[] = []
      const totalPhotos = photos.length

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        setTrainingStatus(`Uploading photo ${i + 1} of ${totalPhotos}...`)
        setTrainingProgress(10 + Math.floor((i / totalPhotos) * 40))

        // Convert data URL to blob
        const response = await fetch(photo.url)
        const blob = await response.blob()

        // Generate unique filename
        const ext = 'jpg'
        const fileName = `${userId}/persona_${Date.now()}_${i}.${ext}`

        // Check file size (50MB limit)
        const MAX_SIZE = 50 * 1024 * 1024 // 50MB
        if (blob.size > MAX_SIZE) {
          console.warn(`Photo ${i + 1} is ${(blob.size / 1024 / 1024).toFixed(1)}MB - consider using smaller images`)
          toast.warning(`Photo ${i + 1} is large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Consider using smaller images for faster uploads.`)
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('persona-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (uploadError) {
          console.error(`Failed to upload photo ${i + 1}:`, {
            message: uploadError.message,
            name: uploadError.name,
            details: JSON.stringify(uploadError)
          })
          toast.error(`Failed to upload photo ${i + 1}: ${uploadError.message || 'Unknown error'}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('persona-photos')
          .getPublicUrl(fileName)

        photoUrls.push(publicUrl)
      }

      if (photoUrls.length < 5) {
        throw new Error(`Only ${photoUrls.length} photos uploaded successfully. Minimum 5 required.`)
      }

      // Step 2: Call API with just URLs (small payload)
      setTrainingProgress(60)
      setTrainingStatus('Creating your AI Avatar...')

      const response = await fetch('/api/personas/create-from-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: personaName || formData?.fullName || 'Creator',
          description: 'AI Avatar for content creation',
          photoUrls
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to create persona')
      }

      const result = await response.json()

      // Step 3: Save persona ID (portraits generating in background)
      setTrainingProgress(80)
      setTrainingStatus('Starting AI portrait generation...')

      setPersonaId(result.persona.id)

      if (updateFormData) {
        updateFormData('personaId', result.persona.id)
        updateFormData('personaName', personaName)
        updateFormData('personaStatus', 'analyzing') // Processing in background
        updateFormData('personaTrained', true)
      }

      // Immediately save progress to prevent loss on refresh
      if (onSaveProgress) {
        try {
          await onSaveProgress({
            personaId: result.persona.id,
            personaName,
            personaStatus: 'analyzing',
            personaTrained: true
          })
          console.log('Persona progress saved immediately')
        } catch (error) {
          console.error('Error saving persona progress:', error)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      setTrainingProgress(100)
      setTrainingStatus('Photos uploaded successfully!')

      // Show success toast
      toast.success('AI Avatar creation started!', {
        description: 'Your 10 portraits are being generated in the background. This takes 3-5 minutes.'
      })

      // Continue to next step
      setTimeout(() => onComplete(photos, result.persona.id), 1000)

    } catch (error) {
      console.error('Persona creation error:', error)
      setTrainingStatus('Upload failed')
      setTrainingProgress(0)

      toast.error(error instanceof Error ? error.message : 'Failed to create persona')

      setTimeout(() => {
        setIsTraining(false)
      }, 1500)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-5xl mx-auto pb-28">
        {/* Header - Compact */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Create Your AI Avatar</h2>
          <p className="text-muted-foreground text-sm">
            Upload {minPhotos}-{maxPhotos} photos for hyperrealistic AI portraits
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{photos.length}</span>
              <span className="text-muted-foreground">/ {recommendedPhotos} photos</span>
            </div>
            {isReady ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                <Check className="h-3 w-3 mr-1" />
                Ready to create
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {minPhotos - photos.length} more needed
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Upload Options + Gallery */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload Actions - Horizontal */}
            <div className="grid grid-cols-2 gap-3">
              {/* Take Photos */}
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md group",
                  isFull && "opacity-50 pointer-events-none"
                )}
                onClick={openCameraModal}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">Take Photos</h3>
                    <p className="text-xs text-muted-foreground">Use camera with guided poses</p>
                  </div>
                </div>
              </Card>

              {/* Upload Photos */}
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md",
                  isDragging ? "border-primary bg-primary/5" : "hover:border-primary",
                  isFull && "opacity-50 pointer-events-none"
                )}
                onClick={() => !isFull && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {isProcessing ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{isProcessing ? 'Processing...' : 'Upload Photos'}</h3>
                    <p className="text-xs text-muted-foreground">Drop or browse files</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Photo Gallery */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Your Photos</h3>
                {photos.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={deleteAllPhotos}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {photos.map((photo, idx) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative group aspect-square"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:ring-2 ring-primary transition-all"
                        onClick={() => setSelectedPhoto(photo.id)}
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                        className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                        {idx + 1}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Add more indicator */}
                  {!isFull && (
                    <div 
                      className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground">Add</span>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No photos yet</p>
                  <p className="text-xs text-muted-foreground">Click to upload or use camera</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Tips - Compact */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Photo Tips</h3>
              </div>
              
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-medium text-primary mb-1">📸 Best Photos</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>• Professional headshots</li>
                    <li>• High resolution, clear face</li>
                    <li>• Good lighting</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <p className="font-medium mb-1">📐 Variety Needed</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>• Front facing</li>
                    <li>• Left & right angles</li>
                    <li>• Different expressions</li>
                  </ul>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-3">
                  <p className="text-amber-700 dark:text-amber-300">
                    <strong>Tip:</strong> Better photos = more realistic AI portraits
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-6 z-40">
          <div className="max-w-5xl mx-auto px-6">
            {!hideNavigation ? (
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="lg" onClick={onBack}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                <div className="flex gap-3">
                  {onSkip && (
                    <Button variant="outline" onClick={onSkip}>
                      Skip for now
                    </Button>
                  )}

                  <Button 
                    size="lg" 
                    onClick={handleComplete} 
                    disabled={!isReady || isProcessing || isTraining}
                  >
                    {isReady ? (
                      <>
                        Create AI Avatar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      `Add ${minPhotos - photos.length} more photo${minPhotos - photos.length !== 1 ? 's' : ''}`
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleComplete} 
                  disabled={!isReady || isProcessing || isTraining}
                >
                  {isReady ? (
                    <>
                      Create AI Avatar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    `Add ${minPhotos - photos.length} more photo${minPhotos - photos.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== FULLSCREEN CAMERA MODAL ==================== */}
        <AnimatePresence>
          {showCameraModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black"
            >
              {/* Hidden video/canvas elements */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  !cameraActive && "hidden"
                )}
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Flash effect */}
              <AnimatePresence>
                {showFlash && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-white z-50"
                  />
                )}
              </AnimatePresence>

              {cameraActive ? (
                <>
                  {/* Face guide oval */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-80 border-2 border-white/30 rounded-full" />
                  </div>

                  {/* Top bar - pose guidance */}
                  <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="max-w-lg mx-auto">
                      <motion.div
                        key={photos.length}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/50 backdrop-blur-md rounded-2xl p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{currentPose.icon}</div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-lg">
                              Photo {photos.length + 1}: {currentPose.instruction}
                            </p>
                            <p className="text-white/70 text-sm">{currentPose.tip}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold text-2xl">{photos.length}/{recommendedPhotos}</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((photos.length / recommendedPhotos) * 100, 100)}%` }}
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={closeCameraModal}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Bottom controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-center justify-center gap-6">
                      {/* Switch camera */}
                      <button
                        onClick={switchCamera}
                        disabled={isCapturing}
                        className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                      >
                        <FlipHorizontal className="h-5 w-5" />
                      </button>

                      {/* Capture button */}
                      <button
                        onClick={capturePhoto}
                        disabled={isCapturing || isFull}
                        className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        <div className="w-16 h-16 rounded-full border-4 border-black" />
                      </button>

                      {/* Done button */}
                      <button
                        onClick={closeCameraModal}
                        disabled={photos.length === 0}
                        className={cn(
                          "w-12 h-12 rounded-full backdrop-blur flex items-center justify-center transition-colors",
                          photos.length >= minPhotos
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-white/20 text-white hover:bg-white/30"
                        )}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Photo count indicator */}
                    {photos.length > 0 && (
                      <p className="text-center text-white/70 text-sm mt-3">
                        {photos.length < minPhotos
                          ? `${minPhotos - photos.length} more photo${minPhotos - photos.length !== 1 ? 's' : ''} needed`
                          : photos.length < recommendedPhotos
                            ? `${recommendedPhotos - photos.length} more for optimal results`
                            : 'Great! You have enough photos'}
                      </p>
                    )}

                    {/* Recent photos preview */}
                    {photos.length > 0 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {photos.slice(-5).map((photo) => (
                          <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/30"
                          >
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Camera loading/error state */
                <div className="absolute inset-0 flex items-center justify-center">
                  {cameraError ? (
                    <div className="max-w-sm text-center p-6">
                      <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">Camera Error</h3>
                      <p className="text-white/70 text-sm mb-6">{cameraError}</p>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={startCamera} variant="default">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                        <Button onClick={closeCameraModal} variant="outline">
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="h-16 w-16 animate-spin text-white mx-auto mb-4" />
                      <p className="text-white text-lg">Starting camera...</p>
                      <p className="text-white/60 text-sm mt-2">Please allow camera access</p>
                    </div>
                  )}

                  {/* Close button for loading/error state */}
                  <button
                    onClick={closeCameraModal}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress Overlay */}
        <AnimatePresence>
          {isTraining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-sm w-full"
              >
                <Card className="p-8 bg-card/95 backdrop-blur border-border/50">
                  <div className="space-y-6">
                    {/* Animated icon */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          {trainingProgress < 100 ? (
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                          ) : (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                            >
                              <Check className="h-10 w-10 text-green-500" />
                            </motion.div>
                          )}
                        </div>
                        {/* Progress ring */}
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-muted/20"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={`${trainingProgress * 2.26} 226`}
                            className="text-primary transition-all duration-300"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Status text */}
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">
                        {trainingProgress < 100 ? 'Uploading Photos' : 'Upload Complete!'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{trainingStatus}</p>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <Progress value={trainingProgress} className="h-1.5" />
                      <p className="text-xs text-center text-muted-foreground">
                        {trainingProgress}%
                      </p>
                    </div>

                    {/* Info message */}
                    {trainingProgress >= 80 && trainingProgress < 100 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/5 rounded-lg p-3 text-center"
                      >
                        <p className="text-xs text-muted-foreground">
                          <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
                          10 AI portraits will be generated in the background
                        </p>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="max-w-2xl max-h-[80vh] relative"
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
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </TooltipProvider>
  )
}
