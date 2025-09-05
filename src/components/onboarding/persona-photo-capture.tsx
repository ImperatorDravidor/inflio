'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, X, Check, Loader2, RefreshCw, Trash2, AlertCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PersonaPhoto {
  id: string
  url: string
  file: File
  status: 'captured' | 'uploaded'
}

interface PersonaPhotoCaptureProps {
  userId: string
  personaName?: string
  personaDescription?: string
  onComplete: (photos: PersonaPhoto[], personaId?: string) => void
  onSkip?: () => void
  minPhotos?: number
  maxPhotos?: number
  showNameInput?: boolean
}

export function PersonaPhotoCapture({
  userId,
  personaName: initialPersonaName,
  personaDescription: initialDescription,
  onComplete,
  onSkip,
  minPhotos = 5,
  maxPhotos = 20,
  showNameInput = false
}: PersonaPhotoCaptureProps) {
  const [photos, setPhotos] = useState<PersonaPhoto[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [personaName, setPersonaName] = useState(initialPersonaName || '')
  const [personaDescription, setPersonaDescription] = useState(initialDescription || '')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error('Camera error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      setError(`Camera access failed: ${errorMessage}`)
      toast.error('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || photos.length >= maxPhotos) return
    
    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) {
      setIsCapturing(false)
      return
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        setIsCapturing(false)
        return
      }
      
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      
      const newPhoto: PersonaPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        file,
        status: 'captured'
      }
      
      setPhotos(prev => [...prev, newPhoto])
      setIsCapturing(false)
      
      toast.success(`Photo captured! ${photos.length + 1}/${minPhotos} minimum`)
    }, 'image/jpeg', 0.9)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    
    const newPhotos: PersonaPhoto[] = []
    
    Array.from(files).forEach(file => {
      if (photos.length + newPhotos.length >= maxPhotos) return
      
      const url = URL.createObjectURL(file)
      newPhotos.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        file,
        status: 'captured'
      })
    })
    
    setPhotos(prev => [...prev, ...newPhotos])
    toast.success(`Added ${newPhotos.length} photos`)
  }

  const removePhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId)
    if (photo) {
      URL.revokeObjectURL(photo.url)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    }
  }

  const uploadPhotos = async () => {
    if (photos.length < minPhotos) {
      toast.error(`Please capture at least ${minPhotos} photos`)
      return
    }
    
    if (showNameInput && !personaName.trim()) {
      toast.error('Please enter a name for your persona')
      return
    }
    
    setUploading(true)
    
    try {
      // Create FormData for upload
      const formData = new FormData()
      photos.forEach(photo => {
        formData.append('photos', photo.file)
      })
      formData.append('personaName', personaName || 'Main Persona')
      formData.append('description', personaDescription || 'AI persona for content generation')
      
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
      
      toast.success('Persona created successfully!')
      
      // Clean up
      stopCamera()
      photos.forEach(photo => URL.revokeObjectURL(photo.url))
      
      // Call completion handler with persona ID
      onComplete(photos, result.personaId)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photos. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Capture Your Photos</h2>
        <p className="text-muted-foreground">
          Take or upload at least {minPhotos} photos for {personaName || 'your AI persona'}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant={photos.length >= minPhotos ? 'default' : 'outline'}>
            {photos.length}/{minPhotos} minimum
          </Badge>
          <Badge variant="outline">
            Max {maxPhotos} photos
          </Badge>
        </div>
      </div>

      {/* Name Input Section */}
      {showNameInput && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Persona Details</h3>
            </div>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="persona-name">Persona Name *</Label>
                <Input
                  id="persona-name"
                  placeholder="e.g., Professional, Casual, Creative"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="persona-description">Description (optional)</Label>
                <Input
                  id="persona-description"
                  placeholder="e.g., Professional look for business content"
                  value={personaDescription}
                  onChange={(e) => setPersonaDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Camera/Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera View */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Camera Capture</h3>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
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
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Camera className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!cameraActive ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={capturePhoto} 
                    disabled={isCapturing || photos.length >= maxPhotos}
                    className="flex-1"
                  >
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= maxPhotos}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </Card>

        {/* Photos Grid */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Captured Photos ({photos.length})</h3>
              {photos.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    photos.forEach(p => URL.revokeObjectURL(p.url))
                    setPhotos([])
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Captured"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {photos.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  No photos captured yet
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
        
        <Button
          onClick={uploadPhotos}
          disabled={photos.length < minPhotos || uploading}
          className="ml-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Complete ({photos.length} photos)
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
