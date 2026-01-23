/**
 * Persona Service V2 - Simplified (No LoRA Training)
 *
 * Uses Nano Banana Pro's character consistency feature instead of LoRA training
 * - Faster: No 10-30 minute training wait
 * - Simpler: Just upload photos and go
 * - State-of-the-art: Nano Banana Pro handles character consistency
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { createNanoBananaService, type PortraitResult, type PortraitType } from './nano-banana-service'

// Check if running on server
const isServer = typeof window === 'undefined'

// Lazy load supabaseAdmin only when needed (server-side only)
const getSupabaseAdmin = async () => {
  if (!isServer) {
    throw new Error('supabaseAdmin can only be used on the server')
  }
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  return supabaseAdmin
}

// Get appropriate Supabase client
const getSupabase = () => {
  if (isServer) {
    // For server-side, we need to use async pattern
    // This function is for client-side reads only
    throw new Error('Use getSupabaseAdmin() for server-side operations')
  }
  return createSupabaseBrowserClient()
}

// Get client for read operations (works on both client and server)
const getSupabaseForRead = async () => {
  if (isServer) {
    return getSupabaseAdmin()
  }
  return createSupabaseBrowserClient()
}

export interface PersonaPhoto {
  id?: string
  url: string
  file?: File
  caption?: string
  metadata?: {
    order_index?: number
    original_filename?: string
    [key: string]: any
  }
}

export interface PersonaPortrait {
  type: PortraitType
  category: 'general' | 'use_case'
  url: string
  title: string
}

export interface Persona {
  id: string
  userId: string
  name: string
  description?: string
  status: 'pending_upload' | 'analyzing' | 'ready' | 'failed'
  metadata?: {
    photoCount: number
    photoUrls: string[]
    referencePhotoUrls?: string[] // Best 6 photos selected by Nano Banana
    // New structured portrait system (10 portraits: 4 general + 6 use-case)
    portraits?: PersonaPortrait[]
    generalPortraitUrls?: string[] // Quick access to general portrait URLs
    useCasePortraitUrls?: string[] // Quick access to use-case portrait URLs
    // Legacy field for backward compatibility
    portraitUrls?: string[]
    analysisQuality?: 'excellent' | 'good' | 'needs_improvement'
    consistencyScore?: number
  }
  createdAt: string
  updatedAt: string
}

export class PersonaServiceV2 {
  /**
   * Create a new persona (simplified - no training)
   * Works on both server and client
   */
  static async createPersona(
    userId: string,
    name: string,
    description?: string,
    photos?: PersonaPhoto[]
  ): Promise<Persona | null> {
    try {
      // Always use admin client for inserts to bypass RLS
      const supabase = await getSupabaseAdmin()

      // Create persona record
      const { data: persona, error } = await supabase
        .from('personas')
        .insert({
          user_id: userId,
          name,
          description,
          status: photos && photos.length >= 5 ? 'analyzing' : 'pending_upload',
          metadata: {
            photoCount: photos?.length || 0,
            photoUrls: photos?.map(p => p.url) || []
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating persona:', error)
        return null
      }

      // If photos provided, process them immediately
      if (photos && photos.length >= 5 && persona) {
        // Upload photos to storage
        await this.uploadPersonaImages(persona.id, userId, photos)

        // Analyze and generate reference portraits (no training!)
        await this.processPersonaPhotos(persona.id, userId, name, photos)
      }

      return persona as Persona
    } catch (error) {
      console.error('Error in createPersona:', error)
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
  ): Promise<string[]> {
    try {
      const supabase = await getSupabaseAdmin() // Use admin for storage operations
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
                    caption: photo.caption,
                    type: 'user_upload'
                  }
                })
            }
          }
        } else if (photo.url) {
          // URL already exists
          uploadedUrls.push(photo.url)

          // Store in persona_images table
          await supabase
            .from('persona_images')
            .insert({
              persona_id: personaId,
              user_id: userId,
              image_url: photo.url,
              metadata: {
                caption: photo.caption,
                type: 'user_upload'
              }
            })
        }
      }

      return uploadedUrls
    } catch (error) {
      console.error('Error uploading persona images:', error)
      return []
    }
  }

  /**
   * Process persona photos using Nano Banana Pro
   * Generates 10 portraits: 4 General + 6 Use-Case specific
   * No training - just analysis and reference portrait generation
   */
  static async processPersonaPhotos(
    personaId: string,
    userId: string,
    personName: string,
    photos: PersonaPhoto[]
  ): Promise<{ success: boolean; portraits: PortraitResult[]; error?: string }> {
    try {
      const supabase = await getSupabaseAdmin()
      const nanoBanana = createNanoBananaService()

      // Update status to analyzing
      await supabase
        .from('personas')
        .update({ status: 'analyzing' })
        .eq('id', personaId)

      // Get photo URLs
      const photoUrls = photos.map(p => p.url).filter(Boolean)
      console.log(`Processing ${photoUrls.length} photos for persona ${personaId}`)

      // Step 1: Analyze photos and select best ones
      console.log('Analyzing photos...')
      const analysis = await nanoBanana.analyzePhotos(photoUrls)
      console.log(`Photo analysis complete: ${analysis.bestPhotos.length} best photos selected`)

      // Step 2: Generate all 10 reference portraits (4 general + 6 use-case)
      console.log('Generating 10 reference portraits with Nano Banana Pro...')
      console.log('  - 4 General: neutral front, friendly smile, 3/4 left, 3/4 right')
      console.log('  - 6 Use-Case: thumbnail excited, thumbnail pointing, story casual, podcast host, corporate professional, creator workspace')

      const portraits = await nanoBanana.generateAllPortraits({
        referencePhotos: analysis.bestPhotos,
        personName,
        onProgress: (completed, total, current) => {
          console.log(`[${completed + 1}/${total}] Generating: ${current}`)
        }
      })
      console.log(`Generated ${portraits.length} reference portraits`)

      // Step 3: Store portraits in persona_images with full metadata
      for (const portrait of portraits) {
        await supabase
          .from('persona_images')
          .insert({
            persona_id: personaId,
            user_id: userId,
            image_url: portrait.url,
            metadata: {
              type: 'reference_portrait',
              portraitType: portrait.type,
              category: portrait.category,
              title: portrait.title,
              generatedBy: 'nano-banana-pro'
            }
          })
      }

      // Separate URLs by category for quick access
      const generalPortraits = portraits.filter(p => p.category === 'general')
      const useCasePortraits = portraits.filter(p => p.category === 'use_case')

      // Step 4: Update persona with analysis results and structured portrait data
      await supabase
        .from('personas')
        .update({
          status: 'ready',
          metadata: {
            photoCount: photoUrls.length,
            photoUrls: photoUrls,
            referencePhotoUrls: analysis.bestPhotos,
            // New structured portrait data
            portraits: portraits.map(p => ({
              type: p.type,
              category: p.category,
              url: p.url,
              title: p.title
            })),
            generalPortraitUrls: generalPortraits.map(p => p.url),
            useCasePortraitUrls: useCasePortraits.map(p => p.url),
            // Legacy field for backward compatibility
            portraitUrls: portraits.map(p => p.url),
            analysisQuality: analysis.quality,
            consistencyScore: analysis.consistencyScore
          }
        })
        .eq('id', personaId)

      console.log(`Persona ${personaId} processing complete`)
      console.log(`  - General portraits: ${generalPortraits.length}`)
      console.log(`  - Use-case portraits: ${useCasePortraits.length}`)

      return { success: true, portraits }
    } catch (error) {
      console.error('Error processing persona photos:', error)

      // Mark as failed
      try {
        const adminClient = await getSupabaseAdmin()
        await adminClient
          .from('personas')
          .update({
            status: 'failed',
            metadata: {
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          })
          .eq('id', personaId)
      } catch (updateError) {
        console.error('Failed to update persona status:', updateError)
      }

      return {
        success: false,
        portraits: [],
        error: error instanceof Error ? error.message : 'Processing failed'
      }
    }
  }

  /**
   * Get all personas for a user
   */
  static async getUserPersonas(userId: string): Promise<Persona[]> {
    try {
      const supabase = await getSupabaseForRead()

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
      const supabase = await getSupabaseForRead()

      // Get default persona ID from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('default_persona_id')
        .eq('clerk_user_id', userId)
        .single()

      if (!profile?.default_persona_id) {
        // If no default, try to get the first ready persona
        const { data: firstPersona } = await supabase
          .from('personas')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'ready')
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
   * Get reference images for a persona
   * Returns the best 6 photos for character consistency
   */
  static async getPersonaReferenceImages(personaId: string): Promise<string[]> {
    try {
      const supabase = await getSupabaseForRead()

      // First try to get from metadata
      const { data: persona } = await supabase
        .from('personas')
        .select('metadata')
        .eq('id', personaId)
        .single()

      if (persona?.metadata?.referencePhotoUrls) {
        return persona.metadata.referencePhotoUrls
      }

      // Fallback: Get from persona_images table
      const { data: images } = await supabase
        .from('persona_images')
        .select('image_url')
        .eq('persona_id', personaId)
        .eq('metadata->>type', 'user_upload')
        .limit(6)

      return images?.map(img => img.image_url) || []
    } catch (error) {
      console.error('Error getting reference images:', error)
      return []
    }
  }

  /**
   * Get generated portraits for a persona
   */
  static async getPersonaPortraits(personaId: string): Promise<string[]> {
    try {
      const supabase = await getSupabaseForRead()

      const { data: images } = await supabase
        .from('persona_images')
        .select('image_url')
        .eq('persona_id', personaId)
        .eq('metadata->>type', 'reference_portrait')
        .order('created_at', { ascending: true })

      return images?.map(img => img.image_url) || []
    } catch (error) {
      console.error('Error getting portraits:', error)
      return []
    }
  }

  /**
   * Delete a persona
   */
  static async deletePersona(personaId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await getSupabaseForRead()

      // Delete persona (cascade will handle related records)
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting persona:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deletePersona:', error)
      return false
    }
  }

  /**
   * Regenerate reference portraits for a persona
   * Generates all 10 portraits (4 general + 6 use-case)
   */
  static async regeneratePortraits(
    personaId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const supabase = await getSupabaseForRead()

      // Get persona details
      const { data: persona } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single()

      if (!persona) {
        console.error('Persona not found')
        return false
      }

      // Get reference photos
      const referencePhotos = await this.getPersonaReferenceImages(personaId)

      if (referencePhotos.length === 0) {
        console.error('No reference photos found')
        return false
      }

      // Generate new portraits (all 10)
      console.log('Regenerating all 10 portraits...')
      const nanoBanana = createNanoBananaService()
      const portraits = await nanoBanana.generateAllPortraits({
        referencePhotos,
        personName: persona.name,
        onProgress: (completed, total, current) => {
          console.log(`[${completed + 1}/${total}] Generating: ${current}`)
        }
      })

      // Delete old portraits
      await supabase
        .from('persona_images')
        .delete()
        .eq('persona_id', personaId)
        .eq('metadata->>type', 'reference_portrait')

      // Store new portraits with full metadata
      for (const portrait of portraits) {
        await supabase
          .from('persona_images')
          .insert({
            persona_id: personaId,
            user_id: userId,
            image_url: portrait.url,
            metadata: {
              type: 'reference_portrait',
              portraitType: portrait.type,
              category: portrait.category,
              title: portrait.title,
              generatedBy: 'nano-banana-pro',
              regenerated: true
            }
          })
      }

      // Separate URLs by category
      const generalPortraits = portraits.filter(p => p.category === 'general')
      const useCasePortraits = portraits.filter(p => p.category === 'use_case')

      // Update metadata with structured portrait data
      await supabase
        .from('personas')
        .update({
          metadata: {
            ...persona.metadata,
            portraits: portraits.map(p => ({
              type: p.type,
              category: p.category,
              url: p.url,
              title: p.title
            })),
            generalPortraitUrls: generalPortraits.map(p => p.url),
            useCasePortraitUrls: useCasePortraits.map(p => p.url),
            portraitUrls: portraits.map(p => p.url)
          }
        })
        .eq('id', personaId)

      console.log('Portraits regenerated successfully!')
      console.log(`  - General: ${generalPortraits.length}`)
      console.log(`  - Use-case: ${useCasePortraits.length}`)
      return true
    } catch (error) {
      console.error('Error regenerating portraits:', error)
      return false
    }
  }

  /**
   * Get portraits by category
   */
  static async getPortraitsByCategory(personaId: string, category: 'general' | 'use_case'): Promise<PersonaPortrait[]> {
    try {
      const supabase = await getSupabaseForRead()

      const { data: persona } = await supabase
        .from('personas')
        .select('metadata')
        .eq('id', personaId)
        .single()

      if (!persona?.metadata?.portraits) {
        return []
      }

      return persona.metadata.portraits.filter((p: PersonaPortrait) => p.category === category)
    } catch (error) {
      console.error('Error getting portraits by category:', error)
      return []
    }
  }

  /**
   * Get a specific portrait by type
   */
  static async getPortraitByType(personaId: string, type: PortraitType): Promise<PersonaPortrait | null> {
    try {
      const supabase = await getSupabaseForRead()

      const { data: persona } = await supabase
        .from('personas')
        .select('metadata')
        .eq('id', personaId)
        .single()

      if (!persona?.metadata?.portraits) {
        return null
      }

      return persona.metadata.portraits.find((p: PersonaPortrait) => p.type === type) || null
    } catch (error) {
      console.error('Error getting portrait by type:', error)
      return null
    }
  }
}
