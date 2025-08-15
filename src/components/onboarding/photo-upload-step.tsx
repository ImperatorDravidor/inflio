"use client"

import { useState, useCallback } from 'react'
import { Upload, X, Camera, AlertCircle, Check, Star, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoUploadStepProps {
  onPhotosChange: (photos: File[], analysis: PhotoAnalysis) => void
  initialPhotos?: File[]
}

interface PhotoAnalysis {
  totalPhotos: number
  averageQuality: number
  recommendations: string[]
  readyForTraining: boolean
}

interface PhotoPreview {
  file: File
  url: string
  quality?: number
  dimensions?: { width: number; height: number }
  issues?: string[]
}

const QUALITY_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
  poor: 0
}

const QUALITY_COLORS = {
  excellent: 'text-green-500 bg-green-50 border-green-200',
  good: 'text-blue-500 bg-blue-50 border-blue-200',
  fair: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  poor: 'text-red-500 bg-red-50 border-red-200'
}

export function PhotoUploadStep({ onPhotosChange, initialPhotos = [] }: PhotoUploadStepProps) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const analyzePhoto = async (file: File): Promise<PhotoPreview> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        const width = img.width
        const height = img.height
        const minDim = Math.min(width, height)
        const issues: string[] = []
        
        // Calculate quality score
        let quality = 0
        
        // Dimension score (40%)
        if (minDim >= 1024) {
          quality += 40
        } else if (minDim >= 512) {
          quality += 20 + (20 * (minDim - 512) / 512)
          issues.push('Higher resolution recommended')
        } else {
          quality += 10
          issues.push('Image resolution too low')
        }
        
        // Aspect ratio score (20%)
        const aspectRatio = width / height
        if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
          quality += 20
        } else if (aspectRatio >= 0.6 && aspectRatio <= 1.5) {
          quality += 10
          issues.push('Square or near-square photos work best')
        } else {
          issues.push('Aspect ratio not ideal')
        }
        
        // File size score (20%)
        const sizeMB = file.size / (1024 * 1024)
        if (sizeMB >= 1 && sizeMB <= 5) {
          quality += 20
        } else if (sizeMB < 1) {
          quality += 10
          issues.push('File size suggests low quality')
        } else if (sizeMB > 10) {
          issues.push('File size too large')
        } else {
          quality += 15
        }
        
        // Format score (20%)
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          quality += 20
        } else if (file.type === 'image/png') {
          quality += 15
        } else {
          quality += 10
          issues.push('JPEG format preferred')
        }
        
        resolve({
          file,
          url,
          quality: Math.round(quality),
          dimensions: { width, height },
          issues
        })
      }
      
      img.onerror = () => {
        resolve({
          file,
          url,
          quality: 0,
          issues: ['Failed to load image']
        })
      }
      
      img.src = url
    })
  }

  const analyzePhotoSet = (photoList: PhotoPreview[]): PhotoAnalysis => {
    if (photoList.length === 0) {
      return {
        totalPhotos: 0,
        averageQuality: 0,
        recommendations: ['Upload at least 5 high-quality photos of yourself'],
        readyForTraining: false
      }
    }
    
    const avgQuality = photoList.reduce((sum, p) => sum + (p.quality || 0), 0) / photoList.length
    const recommendations: string[] = []
    
    // Photo count recommendations
    if (photoList.length < 5) {
      recommendations.push(`📸 Add ${5 - photoList.length} more photos (minimum 5 required)`)
    } else if (photoList.length < 10) {
      recommendations.push(`✨ Add ${10 - photoList.length} more photos for optimal results`)
    } else if (photoList.length >= 15) {
      recommendations.push('🎯 Excellent variety! You have plenty of photos')
    }
    
    // Quality recommendations
    const lowQualityCount = photoList.filter(p => (p.quality || 0) < 40).length
    if (lowQualityCount > 0) {
      recommendations.push(`⚠️ Replace ${lowQualityCount} low-quality photo${lowQualityCount > 1 ? 's' : ''}`)
    }
    
    if (avgQuality < 50) {
      recommendations.push('📐 Use higher resolution photos (1024x1024 or larger)')
    } else if (avgQuality >= 70) {
      recommendations.push('✅ Great photo quality overall!')
    }
    
    // Variety recommendations
    if (photoList.length >= 5) {
      recommendations.push('💡 Include varied angles, expressions, and lighting')
    }
    
    const readyForTraining = photoList.length >= 5 && avgQuality >= 40
    
    return {
      totalPhotos: photoList.length,
      averageQuality: Math.round(avgQuality),
      recommendations,
      readyForTraining
    }
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsAnalyzing(true)
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isUnder10MB = file.size < 10 * 1024 * 1024
      return isImage && isUnder10MB
    })
    
    if (validFiles.length !== fileArray.length) {
      toast.warning(`${fileArray.length - validFiles.length} files skipped (not images or >10MB)`)
    }
    
    // Analyze each photo
    const newPhotos: PhotoPreview[] = []
    for (let i = 0; i < validFiles.length; i++) {
      setUploadProgress((i / validFiles.length) * 100)
      const analyzed = await analyzePhoto(validFiles[i])
      newPhotos.push(analyzed)
    }
    
    const updatedPhotos = [...photos, ...newPhotos]
    setPhotos(updatedPhotos)
    setUploadProgress(0)
    setIsAnalyzing(false)
    
    // Analyze the complete set
    const analysis = analyzePhotoSet(updatedPhotos)
    onPhotosChange(
      updatedPhotos.map(p => p.file),
      analysis
    )
    
    // Show feedback
    if (analysis.readyForTraining) {
      toast.success('Great photo set! Ready for AI training')
    } else if (updatedPhotos.length > 0) {
      toast.info(analysis.recommendations[0])
    }
  }, [photos, onPhotosChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    URL.revokeObjectURL(photos[index].url)
    setPhotos(newPhotos)
    
    const analysis = analyzePhotoSet(newPhotos)
    onPhotosChange(
      newPhotos.map(p => p.file),
      analysis
    )
  }

  const getQualityLevel = (quality: number): keyof typeof QUALITY_COLORS => {
    if (quality >= QUALITY_THRESHOLDS.excellent) return 'excellent'
    if (quality >= QUALITY_THRESHOLDS.good) return 'good'
    if (quality >= QUALITY_THRESHOLDS.fair) return 'fair'
    return 'poor'
  }

  const analysis = analyzePhotoSet(photos)

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert className="border-primary/20 bg-primary/5">
        <Camera className="h-4 w-4" />
        <AlertDescription>
          <strong>For best AI personas:</strong> Upload 10-20 high-quality photos with:
          <ul className="mt-2 ml-4 text-sm list-disc">
            <li>Clear face visibility from different angles</li>
            <li>Varied expressions and lighting conditions</li>
            <li>Minimum 512x512px, ideally 1024x1024px or larger</li>
            <li>JPEG format preferred for photos</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <div>
        <label htmlFor="photo-upload" className="cursor-pointer">
          <div 
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center 
              transition-all duration-200 
              ${isDragging 
                ? 'border-primary bg-primary/10 scale-[1.02]' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-base font-medium mb-1">
              {isDragging ? 'Drop photos here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, WebP up to 10MB each
            </p>
            {photos.length > 0 && (
              <Badge variant="secondary" className="mt-3">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
              </Badge>
            )}
          </div>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>

      {/* Upload Progress */}
      {isAnalyzing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Analyzing photos...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Your Photos</h4>
            <div className="flex items-center gap-4">
              <Badge 
                variant={analysis.readyForTraining ? "default" : "secondary"}
                className="gap-1"
              >
                {analysis.readyForTraining ? (
                  <>
                    <Check className="h-3 w-3" />
                    Ready for training
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    {5 - photos.length > 0 ? `${5 - photos.length} more needed` : 'Improve quality'}
                  </>
                )}
              </Badge>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Avg. Quality:</span>
                <Badge variant="outline" className={getQualityLevel(analysis.averageQuality)}>
                  {analysis.averageQuality}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <AnimatePresence>
              {photos.map((photo, i) => {
                const qualityLevel = getQualityLevel(photo.quality || 0)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`relative group overflow-hidden border-2 ${QUALITY_COLORS[qualityLevel]}`}>
                      <div className="aspect-square">
                        <img 
                          src={photo.url} 
                          alt={`Upload ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Quality Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {photo.quality}%
                            </Badge>
                            {photo.dimensions && (
                              <span className="text-xs text-white">
                                {photo.dimensions.width}×{photo.dimensions.height}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      
                      {/* Quality Indicator */}
                      {photo.quality && photo.quality >= 80 && (
                        <div className="absolute top-1 left-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card className="p-4 bg-muted/50">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Recommendations
              </h5>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}