"use client"

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  Image as ImageIcon, Sparkles, ArrowRight, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PersonaUploadSimpleProps {
  onComplete: (personaId: string) => void
  onSkip?: () => void
  formData?: any
  updateFormData?: (key: string, value: any) => void
}

export function PersonaUploadSimple({ 
  onComplete, 
  onSkip,
  formData,
  updateFormData
}: PersonaUploadSimpleProps) {
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [personaName, setPersonaName] = useState(formData?.fullName || '')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [trainingStatus, setTrainingStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    
    if (photos.length + imageFiles.length > 20) {
      toast.error('Maximum 20 photos allowed')
      return
    }

    // Create preview URLs
    const newUrls = imageFiles.map(f => URL.createObjectURL(f))
    setPhotos(prev => [...prev, ...imageFiles])
    setPhotoUrls(prev => [...prev, ...newUrls])
    
    toast.success(`Added ${imageFiles.length} photo${imageFiles.length > 1 ? 's' : ''}`)
  }, [photos])

  const removePhoto = useCallback((index: number) => {
    URL.revokeObjectURL(photoUrls[index])
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoUrls(prev => prev.filter((_, i) => i !== index))
  }, [photoUrls])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setCameraStream(stream)
      setShowCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      toast.error('Could not access camera')
    }
  }

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
          const url = URL.createObjectURL(blob)
          
          setPhotos(prev => [...prev, file])
          setPhotoUrls(prev => [...prev, url])
          toast.success('Photo captured!')
        }
      }, 'image/jpeg', 0.95)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }, [cameraStream])

  const handleSubmit = async () => {
    if (!personaName || photos.length < 5) {
      toast.error('Please provide a name and at least 5 photos')
      return
    }

    setIsUploading(true)
    setProgress(0)
    setTrainingStatus('Uploading photos...')

    try {
      const formData = new FormData()
      formData.append('name', personaName)
      formData.append('description', description)
      formData.append('triggerPhrase', personaName.toLowerCase().replace(/\s+/g, '_'))
      formData.append('autoTrain', 'true')
      
      photos.forEach((photo) => {
        formData.append('photos', photo)
      })

      setProgress(20)
      setTrainingStatus('Creating persona...')

      const response = await fetch('/api/personas/create', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create persona')
      }

      const result = await response.json()
      
      setProgress(40)
      setIsUploading(false)
      setIsTraining(true)
      setTrainingStatus('Starting AI training...')

      // Save persona ID to form data
      if (updateFormData) {
        updateFormData('personaId', result.persona.id)
        updateFormData('personaName', personaName)
        updateFormData('personaStatus', result.persona.status)
      }

      // Simulate training progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 3000)

      // Poll for training status
      const checkStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/personas/train-lora?personaId=${result.persona.id}`)
          const statusData = await statusResponse.json()
          
          if (statusData.latestJob) {
            const job = statusData.latestJob
            
            if (job.status === 'completed') {
              clearInterval(progressInterval)
              setProgress(100)
              setTrainingStatus('Training complete!')
              setIsTraining(false)
              
              toast.success('Your AI avatar is ready!')
              setTimeout(() => {
                onComplete(result.persona.id)
              }, 1500)
              return true
            } else if (job.status === 'failed') {
              clearInterval(progressInterval)
              setIsTraining(false)
              toast.error('Training failed. Please try again.')
              return true
            }
          }
          
          return false
        } catch (error) {
          console.error('Status check error:', error)
          return false
        }
      }

      // Check status every 10 seconds
      const statusInterval = setInterval(async () => {
        const isDone = await checkStatus()
        if (isDone) {
          clearInterval(statusInterval)
        }
      }, 10000)

      // Initial status check
      setTimeout(() => checkStatus(), 5000)

      setTrainingStatus('Training your AI avatar (this takes 10-30 minutes)...')
      
    } catch (error) {
      console.error('Persona creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create persona')
      setIsUploading(false)
      setIsTraining(false)
    }
  }

  const isProcessing = isUploading || isTraining

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Create Your AI Avatar</h2>
        <p className="text-muted-foreground">
          Upload photos to train your personalized AI model for accurate thumbnails
        </p>
      </div>

      {/* Main Content */}
      {!isProcessing ? (
        <Card className="p-6 space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Brief description for your AI avatar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Photo Upload Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Photos ({photos.length}/20)
              </label>
              <span className="text-xs text-muted-foreground">
                Minimum 5 photos required
              </span>
            </div>

            {/* Upload Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
              <Button
                variant="outline"
                onClick={showCamera ? stopCamera : startCamera}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {showCamera ? 'Close Camera' : 'Take Photos'}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Camera View */}
            <AnimatePresence>
              {showCamera && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative rounded-lg overflow-hidden bg-black"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="rounded-full h-16 w-16"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="secondary"
                      size="lg"
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {photoUrls.map((url, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Requirements */}
            {photos.length < 5 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload at least {5 - photos.length} more photo{5 - photos.length !== 1 ? 's' : ''} to continue.
                  For best results, include different angles and expressions.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onSkip && (
              <Button
                variant="ghost"
                onClick={onSkip}
                className="flex-1"
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={photos.length < 5 || !personaName}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create & Train Avatar
            </Button>
          </div>
        </Card>
      ) : (
        /* Training Progress */
        <Card className="p-8">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <h3 className="text-xl font-semibold">
                {isUploading ? 'Creating Your Avatar' : 'Training AI Model'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {trainingStatus}
              </p>
            </div>

            <Progress value={progress} className="h-2" />

            {isTraining && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Your AI avatar is being trained with advanced machine learning.
                  This process typically takes 10-30 minutes. You can continue with
                  the onboarding or come back later.
                </AlertDescription>
              </Alert>
            )}

            {isTraining && onSkip && (
              <Button
                variant="outline"
                onClick={onSkip}
                className="w-full"
              >
                Continue Setup (Training in Background)
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
