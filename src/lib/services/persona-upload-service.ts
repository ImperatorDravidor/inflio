import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PersonaPhoto {
  id: string
  url: string
  fileName: string
  fileSize: number
  width?: number
  height?: number
  qualityScore?: number
}

export class PersonaUploadService {
  private static BUCKET_NAME = 'personas'
  private static MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static MIN_DIMENSION = 512 // Minimum width/height for quality
  private static IDEAL_DIMENSION = 1024 // Ideal dimension for training

  /**
   * Initialize the personas bucket if it doesn't exist
   */
  static async initializeBucket() {
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      
      if (!buckets?.find(b => b.name === this.BUCKET_NAME)) {
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false, // Private bucket for user photos
          fileSizeLimit: this.MAX_FILE_SIZE,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        })
        
        if (error && !error.message?.includes('already exists')) {
          console.error('Error creating personas bucket:', error)
          throw error
        }
      }
    } catch (error) {
      console.error('Bucket initialization error:', error)
      // Non-blocking - bucket might already exist
    }
  }

  /**
   * Validate photo quality for persona training
   */
  static async validatePhoto(file: File): Promise<{ valid: boolean; message?: string; qualityScore: number }> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        message: `File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        qualityScore: 0 
      }
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: 'Invalid file type. Please upload JPEG, PNG, or WebP images',
        qualityScore: 0 
      }
    }

    // Load image to check dimensions
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        const width = img.width
        const height = img.height
        const minDim = Math.min(width, height)
        
        // Calculate quality score (0-100)
        let qualityScore = 0
        
        // Dimension score (40 points)
        if (minDim >= this.IDEAL_DIMENSION) {
          qualityScore += 40
        } else if (minDim >= this.MIN_DIMENSION) {
          qualityScore += 20 + (20 * (minDim - this.MIN_DIMENSION) / (this.IDEAL_DIMENSION - this.MIN_DIMENSION))
        } else {
          qualityScore += 10 * (minDim / this.MIN_DIMENSION)
        }
        
        // Aspect ratio score (20 points) - prefer square or near-square
        const aspectRatio = width / height
        if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
          qualityScore += 20
        } else if (aspectRatio >= 0.6 && aspectRatio <= 1.5) {
          qualityScore += 10
        }
        
        // File size score (20 points) - prefer higher quality
        const sizeMB = file.size / (1024 * 1024)
        if (sizeMB >= 1) {
          qualityScore += Math.min(20, sizeMB * 4)
        }
        
        // Format score (20 points)
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          qualityScore += 20 // JPEG is preferred for photos
        } else if (file.type === 'image/png') {
          qualityScore += 15
        } else {
          qualityScore += 10
        }
        
        // Validate minimum requirements
        if (minDim < this.MIN_DIMENSION) {
          resolve({ 
            valid: false, 
            message: `Image too small. Minimum dimension is ${this.MIN_DIMENSION}px`,
            qualityScore 
          })
        } else {
          resolve({ 
            valid: true,
            qualityScore: Math.round(qualityScore)
          })
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ 
          valid: false, 
          message: 'Failed to load image',
          qualityScore: 0 
        })
      }
      
      img.src = url
    })
  }

  /**
   * Upload multiple photos for a persona
   */
  static async uploadPersonaPhotos(
    userId: string,
    personaId: string,
    files: File[],
    onProgress?: (current: number, total: number) => void
  ): Promise<PersonaPhoto[]> {
    await this.initializeBucket()
    
    const uploadedPhotos: PersonaPhoto[] = []
    let current = 0
    
    for (const file of files) {
      try {
        // Validate photo
        const validation = await this.validatePhoto(file)
        if (!validation.valid) {
          console.warn(`Skipping invalid photo: ${validation.message}`)
          continue
        }
        
        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg'
        const photoId = uuidv4()
        const fileName = `${userId}/${personaId}/${photoId}.${ext}`
        
        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) {
          console.error(`Failed to upload photo: ${error.message}`)
          continue
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(fileName)
        
        // Get image dimensions
        const img = new Image()
        const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
          img.onload = () => resolve({ width: img.width, height: img.height })
          img.onerror = () => resolve({ width: 0, height: 0 })
          img.src = URL.createObjectURL(file)
        })
        
        // Store photo metadata in database
        const { data: photoRecord, error: dbError } = await supabase
          .from('persona_images')
          .insert({
            persona_id: personaId,
            user_id: userId,
            image_url: publicUrl,
            file_size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            quality_score: validation.qualityScore,
            metadata: {
              original_name: file.name,
              mime_type: file.type,
              uploaded_at: new Date().toISOString()
            }
          })
          .select()
          .single()
        
        if (!dbError && photoRecord) {
          uploadedPhotos.push({
            id: photoRecord.id,
            url: publicUrl,
            fileName: file.name,
            fileSize: file.size,
            width: dimensions.width,
            height: dimensions.height,
            qualityScore: validation.qualityScore
          })
        }
        
        current++
        if (onProgress) {
          onProgress(current, files.length)
        }
        
      } catch (error) {
        console.error(`Error uploading photo ${file.name}:`, error)
      }
    }
    
    return uploadedPhotos
  }

  /**
   * Delete a persona photo
   */
  static async deletePersonaPhoto(userId: string, personaId: string, photoId: string): Promise<boolean> {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('persona_images')
        .delete()
        .eq('id', photoId)
        .eq('user_id', userId)
        .eq('persona_id', personaId)
      
      if (dbError) {
        console.error('Error deleting photo record:', dbError)
        return false
      }
      
      // Note: Storage deletion would require the full path
      // which we'd need to retrieve from the database first
      
      return true
    } catch (error) {
      console.error('Error deleting photo:', error)
      return false
    }
  }

  /**
   * Get quality analysis for uploaded photos
   */
  static analyzePhotoSet(photos: PersonaPhoto[]): {
    averageQuality: number
    recommendations: string[]
    readyForTraining: boolean
  } {
    if (photos.length === 0) {
      return {
        averageQuality: 0,
        recommendations: ['Upload at least 5 high-quality photos'],
        readyForTraining: false
      }
    }
    
    const avgQuality = photos.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / photos.length
    const recommendations: string[] = []
    
    // Check photo count
    if (photos.length < 5) {
      recommendations.push(`Add ${5 - photos.length} more photos for better results`)
    } else if (photos.length < 10) {
      recommendations.push(`Add ${10 - photos.length} more photos for optimal training`)
    }
    
    // Check quality
    if (avgQuality < 50) {
      recommendations.push('Upload higher resolution photos (1024x1024 or larger)')
    }
    
    // Check variety
    const lowQualityCount = photos.filter(p => (p.qualityScore || 0) < 40).length
    if (lowQualityCount > 0) {
      recommendations.push(`Replace ${lowQualityCount} low-quality photos`)
    }
    
    // Training readiness
    const readyForTraining = photos.length >= 5 && avgQuality >= 40
    
    if (readyForTraining && photos.length >= 10 && avgQuality >= 60) {
      recommendations.push('Excellent photo set! Ready for high-quality persona training')
    } else if (readyForTraining) {
      recommendations.push('Good photo set! Ready for persona training')
    }
    
    return {
      averageQuality: Math.round(avgQuality),
      recommendations,
      readyForTraining
    }
  }
}