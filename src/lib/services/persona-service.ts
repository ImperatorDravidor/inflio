import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { toast } from 'sonner'

export interface PersonaPhoto {
  id: string
  url: string
  file?: File
  caption?: string
}

export interface Persona {
  id: string
  userId: string
  name: string
  description?: string
  status: 'pending_upload' | 'preparing' | 'training' | 'trained' | 'failed'
  modelRef?: string
  loraModelUrl?: string
  loraConfigUrl?: string
  loraTriggerPhrase?: string
  loraTrainingStatus?: string
  loraTrainedAt?: string
  trainingJobId?: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

export interface TrainingJob {
  id: string
  personaId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  errorMessage?: string
  loraModelUrl?: string
  loraConfigUrl?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export class PersonaService {
  /**
   * Create a new persona
   */
  static async createPersona(
    userId: string,
    name: string,
    description?: string,
    photos?: PersonaPhoto[]
  ): Promise<Persona | null> {
    try {
      const supabase = createSupabaseBrowserClient()

      // Create persona record
      const { data: persona, error } = await supabase
        .from('personas')
        .insert({
          user_id: userId,
          name,
          description,
          status: photos && photos.length > 0 ? 'preparing' : 'pending_upload',
          metadata: {
            photoCount: photos?.length || 0,
            photoUrls: photos?.map(p => p.url) || []
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating persona:', error)
        toast.error('Failed to create persona')
        return null
      }

      // If photos provided, upload them and start training
      if (photos && photos.length > 0 && persona) {
        await this.uploadPersonaImages(persona.id, userId, photos)
        
        // Start training if enough photos
        if (photos.length >= 5) {
          await this.startTraining(persona.id, userId, photos)
        }
      }

      return persona as Persona
    } catch (error) {
      console.error('Error in createPersona:', error)
      toast.error('Failed to create persona')
      return null
    }
  }

  /**
   * Upload persona images to storage
   */
  static async uploadPersonaImages(
    personaId: string,
    userId: string,
    photos: PersonaPhoto[]
  ): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      const uploadedUrls: string[] = []

      for (const photo of photos) {
        if (photo.file) {
          // Upload file to storage
          const fileName = `${userId}/${personaId}/${Date.now()}_${photo.id}.jpg`
          const { data, error } = await supabase.storage
            .from('personas')
            .upload(fileName, photo.file, {
              contentType: photo.file.type || 'image/jpeg',
              upsert: false
            })

          if (!error && data) {
            const { data: urlData } = supabase.storage
              .from('personas')
              .getPublicUrl(fileName)
            
            if (urlData) {
              uploadedUrls.push(urlData.publicUrl)
              
              // Store in persona_images table
              await supabase
                .from('persona_images')
                .insert({
                  persona_id: personaId,
                  user_id: userId,
                  image_url: urlData.publicUrl,
                  file_size: photo.file.size,
                  metadata: {
                    originalName: photo.file.name,
                    caption: photo.caption
                  }
                })
            }
          }
        } else if (photo.url) {
          // URL already exists (from camera capture)
          uploadedUrls.push(photo.url)
          
          // Store in persona_images table
          await supabase
            .from('persona_images')
            .insert({
              persona_id: personaId,
              user_id: userId,
              image_url: photo.url,
              metadata: {
                caption: photo.caption
              }
            })
        }
      }

      // Update persona with image count
      await supabase
        .from('personas')
        .update({
          metadata: {
            photoCount: uploadedUrls.length,
            photoUrls: uploadedUrls
          }
        })
        .eq('id', personaId)

      return true
    } catch (error) {
      console.error('Error uploading persona images:', error)
      return false
    }
  }

  /**
   * Start LoRA training for a persona
   */
  static async startTraining(
    personaId: string,
    userId: string,
    photos: PersonaPhoto[]
  ): Promise<TrainingJob | null> {
    try {
      // First, prepare training data (create ZIP)
      const prepareResponse = await fetch('/api/personas/prepare-training-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId,
          images: photos.map(p => ({
            url: p.url,
            caption: p.caption || `professional photo of [trigger]`
          })),
          triggerWord: '[trigger]'
        })
      })

      if (!prepareResponse.ok) {
        throw new Error('Failed to prepare training data')
      }

      const { trainingDataUrl } = await prepareResponse.json()

      // Get persona name for trigger phrase
      const supabase = createSupabaseBrowserClient()
      const { data: persona } = await supabase
        .from('personas')
        .select('name')
        .eq('id', personaId)
        .single()

      // Start training
      const trainResponse = await fetch('/api/personas/train-lora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId,
          imagesDataUrl: trainingDataUrl,
          triggerPhrase: `photo of ${persona?.name || 'person'}`,
          learningRate: 0.00009,
          steps: 2500,
          multiresolutionTraining: true,
          subjectCrop: true,
          createMasks: false
        })
      })

      if (!trainResponse.ok) {
        throw new Error('Failed to start training')
      }

      const { jobId, message } = await trainResponse.json()

      // Update persona status
      await supabase
        .from('personas')
        .update({
          status: 'training',
          training_job_id: jobId
        })
        .eq('id', personaId)

      toast.success(message || 'LoRA training started! This will take 10-30 minutes.')

      return {
        id: jobId,
        personaId,
        status: 'processing',
        createdAt: new Date().toISOString()
      } as TrainingJob
    } catch (error) {
      console.error('Error starting training:', error)
      toast.error('Failed to start training')
      return null
    }
  }

  /**
   * Get training status for a persona
   */
  static async getTrainingStatus(personaId: string): Promise<TrainingJob | null> {
    try {
      const response = await fetch(`/api/personas/train-lora?personaId=${personaId}`)
      
      if (!response.ok) {
        return null
      }

      const { latestJob } = await response.json()
      return latestJob
    } catch (error) {
      console.error('Error getting training status:', error)
      return null
    }
  }

  /**
   * Get all personas for a user
   */
  static async getUserPersonas(userId: string): Promise<Persona[]> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      const { data: personas, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching personas:', error)
        return []
      }

      return personas as Persona[]
    } catch (error) {
      console.error('Error in getUserPersonas:', error)
      return []
    }
  }

  /**
   * Get user's default persona
   */
  static async getDefaultPersona(userId: string): Promise<Persona | null> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // First get user's default persona ID from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('default_persona_id')
        .eq('clerk_user_id', userId)
        .single()

      if (!profile?.default_persona_id) {
        // If no default, try to get the first persona
        const { data: firstPersona } = await supabase
          .from('personas')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'trained')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        return firstPersona as Persona || null
      }

      // Get the specific persona
      const { data: persona } = await supabase
        .from('personas')
        .select('*')
        .eq('id', profile.default_persona_id)
        .single()

      return persona as Persona || null
    } catch (error) {
      console.error('Error getting default persona:', error)
      return null
    }
  }

  /**
   * Delete a persona
   */
  static async deletePersona(personaId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()

      // Delete persona (cascade will handle related records)
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting persona:', error)
        toast.error('Failed to delete persona')
        return false
      }

      toast.success('Persona deleted successfully')
      return true
    } catch (error) {
      console.error('Error in deletePersona:', error)
      toast.error('Failed to delete persona')
      return false
    }
  }

  /**
   * Update persona photos
   */
  static async updatePersonaPhotos(
    personaId: string,
    userId: string,
    photos: PersonaPhoto[]
  ): Promise<boolean> {
    try {
      // Upload new photos
      const success = await this.uploadPersonaImages(personaId, userId, photos)
      
      if (success && photos.length >= 5) {
        // Offer to retrain if photos updated
        const shouldRetrain = window.confirm(
          'Would you like to retrain the AI model with the updated photos? This will take 10-30 minutes.'
        )
        
        if (shouldRetrain) {
          await this.startTraining(personaId, userId, photos)
        }
      }

      return success
    } catch (error) {
      console.error('Error updating persona photos:', error)
      return false
    }
  }

  /**
   * Check if FAL.ai is configured
   */
  static async checkConfiguration(): Promise<boolean> {
    try {
      const response = await fetch('/api/personas/check-config')
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Monitor training progress
   */
  static async monitorTrainingProgress(
    jobId: string,
    onProgress?: (status: string, progress?: number) => void,
    onComplete?: (result: TrainingJob) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const checkInterval = 30000 // Check every 30 seconds
    let attempts = 0
    const maxAttempts = 60 // Max 30 minutes

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/personas/train-lora?jobId=${jobId}`)
        
        if (!response.ok) {
          throw new Error('Failed to check status')
        }

        const job = await response.json()

        if (job.status === 'completed') {
          onComplete?.(job)
          toast.success('LoRA training completed successfully!')
          return
        } else if (job.status === 'failed') {
          const error = job.error_message || 'Training failed'
          onError?.(error)
          toast.error(error)
          return
        } else if (job.status === 'processing') {
          // Estimate progress based on time elapsed
          const startTime = new Date(job.started_at).getTime()
          const elapsed = Date.now() - startTime
          const estimatedDuration = 15 * 60 * 1000 // 15 minutes average
          const progress = Math.min(95, (elapsed / estimatedDuration) * 100)
          
          onProgress?.(job.status, progress)
        }

        // Continue checking
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, checkInterval)
        } else {
          onError?.('Training timeout - please check status later')
        }
      } catch (error) {
        console.error('Error monitoring training:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, checkInterval)
        }
      }
    }

    // Start monitoring
    checkStatus()
  }
}