/**
 * Enhanced Thumbnail Service
 *
 * Uses GPT-Image 1.5 (via FAL.AI) for high-fidelity thumbnail generation
 * with persona reference images for character consistency.
 *
 * Key features:
 * - Multi-layered prompts from Content Assistant analysis
 * - Persona reference image integration for consistent character appearance
 * - Click psychology-driven composition
 * - Brand color and style alignment
 * - Iterative refinement support
 */

import { fal } from '@fal-ai/client'
import { v4 as uuidv4 } from 'uuid'

// Initialize FAL client
fal.config({
  credentials: process.env.FAL_KEY
})

// Lazy load supabaseAdmin to prevent client-side initialization
const getSupabaseAdmin = async () => {
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  return supabaseAdmin
}

// Types
export interface ThumbnailGenerationInput {
  // From Content Assistant
  prompt: string // The detailed, multi-layered prompt
  negativePrompt?: string

  // Persona integration
  persona?: {
    id: string
    name: string
    referenceImageUrls: string[] // URLs to reference images for consistency
  }

  // Brand settings
  brand?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
  }

  // Generation options
  options?: {
    quality?: 'low' | 'medium' | 'high' // Default: high
    aspectRatio?: '16:9' | '1:1' | '9:16' // Default: 16:9 for thumbnails
    numVariations?: number // 1-4, default: 1
    outputFormat?: 'png' | 'jpeg' | 'webp' // Default: png
    inputFidelity?: 'low' | 'high' // How closely to follow reference images
  }

  // Project context
  projectId: string
  userId: string
}

export interface GeneratedThumbnail {
  id: string
  url: string
  localUrl?: string // After upload to Supabase storage
  width: number
  height: number
  prompt: string
  model: string
  generatedAt: string
}

export interface ThumbnailGenerationResult {
  success: boolean
  thumbnails: GeneratedThumbnail[]
  error?: string
  metadata: {
    model: string
    quality: string
    processingTime: number
    personaUsed: boolean
  }
}

/**
 * Enhanced Thumbnail Service using GPT-Image 1.5
 */
export class EnhancedThumbnailService {
  private model = 'fal-ai/gpt-image-1.5/edit'

  /**
   * Generate thumbnail(s) with persona reference images
   */
  async generateThumbnail(input: ThumbnailGenerationInput): Promise<ThumbnailGenerationResult> {
    const startTime = Date.now()
    const options = input.options || {}

    try {
      // Build the enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt(input)

      // Prepare image URLs (persona references)
      const imageUrls = input.persona?.referenceImageUrls || []

      if (imageUrls.length === 0) {
        // If no persona references, use text-to-image generation instead
        return this.generateWithoutPersona(input, startTime)
      }

      // Use GPT-Image 1.5 Edit endpoint with reference images
      const result = await fal.subscribe(this.model, {
        input: {
          prompt: enhancedPrompt,
          image_urls: imageUrls.slice(0, 4), // Max 4 reference images
          image_size: this.mapAspectRatioToSize(options.aspectRatio || '16:9'),
          quality: options.quality || 'high',
          input_fidelity: options.inputFidelity || 'high',
          num_images: options.numVariations || 1,
          output_format: options.outputFormat || 'png',
          background: 'opaque'
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS' && update.logs) {
            update.logs.forEach(log => console.log('[GPT-Image 1.5]', log.message))
          }
        }
      })

      // Process results
      const thumbnails: GeneratedThumbnail[] = []

      if (result.data?.images && Array.isArray(result.data.images)) {
        for (const image of result.data.images) {
          const thumbnailId = uuidv4()

          // Upload to Supabase storage
          const localUrl = await this.uploadToStorage(
            image.url,
            input.projectId,
            thumbnailId,
            options.outputFormat || 'png'
          )

          thumbnails.push({
            id: thumbnailId,
            url: image.url,
            localUrl,
            width: image.width || 1920,
            height: image.height || 1080,
            prompt: enhancedPrompt,
            model: this.model,
            generatedAt: new Date().toISOString()
          })
        }
      }

      // Save to thumbnail history
      await this.saveThumbnailHistory(input, thumbnails)

      return {
        success: true,
        thumbnails,
        metadata: {
          model: this.model,
          quality: options.quality || 'high',
          processingTime: Date.now() - startTime,
          personaUsed: true
        }
      }
    } catch (error) {
      console.error('Enhanced thumbnail generation error:', error)
      return {
        success: false,
        thumbnails: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          model: this.model,
          quality: options.quality || 'high',
          processingTime: Date.now() - startTime,
          personaUsed: !!input.persona
        }
      }
    }
  }

  /**
   * Generate thumbnail without persona (text-to-image)
   */
  private async generateWithoutPersona(
    input: ThumbnailGenerationInput,
    startTime: number
  ): Promise<ThumbnailGenerationResult> {
    const options = input.options || {}

    try {
      // Use Flux for text-to-image when no persona
      const fluxModel = 'fal-ai/flux-pro/v1.1'

      // Map output format (Flux only supports png/jpeg)
      const fluxFormat = options.outputFormat === 'webp' ? 'png' : (options.outputFormat || 'png')

      const result = await fal.subscribe(fluxModel, {
        input: {
          prompt: this.buildEnhancedPrompt(input),
          image_size: this.mapAspectRatioToFluxSize(options.aspectRatio || '16:9') as 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9',
          num_images: options.numVariations || 1,
          output_format: fluxFormat as 'png' | 'jpeg',
          safety_tolerance: '2'
        },
        logs: true
      })

      const thumbnails: GeneratedThumbnail[] = []

      if (result.data?.images && Array.isArray(result.data.images)) {
        for (const image of result.data.images) {
          const thumbnailId = uuidv4()

          const localUrl = await this.uploadToStorage(
            image.url,
            input.projectId,
            thumbnailId,
            options.outputFormat || 'png'
          )

          thumbnails.push({
            id: thumbnailId,
            url: image.url,
            localUrl,
            width: image.width || 1920,
            height: image.height || 1080,
            prompt: this.buildEnhancedPrompt(input),
            model: fluxModel,
            generatedAt: new Date().toISOString()
          })
        }
      }

      await this.saveThumbnailHistory(input, thumbnails)

      return {
        success: true,
        thumbnails,
        metadata: {
          model: fluxModel,
          quality: options.quality || 'high',
          processingTime: Date.now() - startTime,
          personaUsed: false
        }
      }
    } catch (error) {
      console.error('Flux thumbnail generation error:', error)
      return {
        success: false,
        thumbnails: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          model: 'fal-ai/flux-pro/v1.1',
          quality: options.quality || 'high',
          processingTime: Date.now() - startTime,
          personaUsed: false
        }
      }
    }
  }

  /**
   * Generate multiple thumbnail variations from a single concept
   */
  async generateVariations(
    input: ThumbnailGenerationInput,
    count: number = 3
  ): Promise<ThumbnailGenerationResult> {
    // Generate multiple variations
    const variationPrompts = this.createVariationPrompts(input.prompt, count)
    const allThumbnails: GeneratedThumbnail[] = []
    let totalTime = 0

    for (const variationPrompt of variationPrompts) {
      const result = await this.generateThumbnail({
        ...input,
        prompt: variationPrompt,
        options: {
          ...input.options,
          numVariations: 1
        }
      })

      if (result.success) {
        allThumbnails.push(...result.thumbnails)
      }
      totalTime += result.metadata.processingTime
    }

    return {
      success: allThumbnails.length > 0,
      thumbnails: allThumbnails,
      metadata: {
        model: this.model,
        quality: input.options?.quality || 'high',
        processingTime: totalTime,
        personaUsed: !!input.persona
      }
    }
  }

  /**
   * Edit/refine an existing thumbnail
   */
  async refineThumbnail(
    existingThumbnailUrl: string,
    refinementPrompt: string,
    input: Partial<ThumbnailGenerationInput>
  ): Promise<ThumbnailGenerationResult> {
    const startTime = Date.now()

    try {
      // Combine existing thumbnail with persona references if available
      const imageUrls = [existingThumbnailUrl]
      if (input.persona?.referenceImageUrls) {
        imageUrls.push(...input.persona.referenceImageUrls.slice(0, 2))
      }

      const result = await fal.subscribe(this.model, {
        input: {
          prompt: refinementPrompt,
          image_urls: imageUrls,
          image_size: 'auto',
          quality: input.options?.quality || 'high',
          input_fidelity: 'high', // High fidelity to preserve original
          num_images: 1,
          output_format: input.options?.outputFormat || 'png'
        },
        logs: true
      })

      const thumbnails: GeneratedThumbnail[] = []

      if (result.data?.images && Array.isArray(result.data.images)) {
        for (const image of result.data.images) {
          const thumbnailId = uuidv4()

          const localUrl = input.projectId
            ? await this.uploadToStorage(
                image.url,
                input.projectId,
                thumbnailId,
                input.options?.outputFormat || 'png'
              )
            : undefined

          thumbnails.push({
            id: thumbnailId,
            url: image.url,
            localUrl,
            width: image.width || 1920,
            height: image.height || 1080,
            prompt: refinementPrompt,
            model: this.model,
            generatedAt: new Date().toISOString()
          })
        }
      }

      return {
        success: true,
        thumbnails,
        metadata: {
          model: this.model,
          quality: input.options?.quality || 'high',
          processingTime: Date.now() - startTime,
          personaUsed: !!input.persona
        }
      }
    } catch (error) {
      console.error('Thumbnail refinement error:', error)
      return {
        success: false,
        thumbnails: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          model: this.model,
          quality: input.options?.quality || 'high',
          processingTime: Date.now() - startTime,
          personaUsed: !!input.persona
        }
      }
    }
  }

  // Helper methods

  private buildEnhancedPrompt(input: ThumbnailGenerationInput): string {
    let prompt = input.prompt

    // Add persona-specific instructions if using persona
    if (input.persona) {
      prompt = `Create a professional YouTube thumbnail featuring ${input.persona.name}.
The person in the reference images should be the main subject, maintaining their exact appearance, facial features, and identity.

${prompt}

CRITICAL REQUIREMENTS FOR PERSONA:
- Maintain exact facial features and appearance from reference images
- Professional lighting on face with clear visibility
- Face should occupy 30-40% of the frame
- Direct eye contact with viewer
- Sharp, high-definition facial details
- Natural skin tones and textures`
    }

    // Add brand color hints
    if (input.brand) {
      const colorHints = []
      if (input.brand.primaryColor) colorHints.push(`primary color: ${input.brand.primaryColor}`)
      if (input.brand.accentColor) colorHints.push(`accent color: ${input.brand.accentColor}`)

      if (colorHints.length > 0) {
        prompt += `\n\nBRAND COLORS: ${colorHints.join(', ')}. Incorporate these colors subtly in the composition.`
      }
    }

    // Add universal thumbnail requirements
    prompt += `

THUMBNAIL TECHNICAL REQUIREMENTS:
- Ultra HD quality, 4K resolution appearance
- High contrast for visibility at small sizes
- Clean composition with clear focal point
- Professional color grading
- No blur, artifacts, or distortions
- Optimized for YouTube thumbnail display`

    return prompt
  }

  private createVariationPrompts(basePrompt: string, count: number): string[] {
    const variations = [
      // Variation 1: Emotion emphasis
      `${basePrompt}\n\nEMPHASIS: Focus on emotional expression and connection with viewer. Make the emotion the primary visual element.`,

      // Variation 2: Dynamic composition
      `${basePrompt}\n\nEMPHASIS: Use dynamic angles and dramatic composition. Create visual tension and energy.`,

      // Variation 3: Color impact
      `${basePrompt}\n\nEMPHASIS: Bold, vibrant colors that pop. High saturation and contrast for maximum scroll-stopping impact.`,

      // Variation 4: Minimalist clarity
      `${basePrompt}\n\nEMPHASIS: Clean, minimalist composition with strong negative space. Let the subject breathe.`,

      // Variation 5: Story moment
      `${basePrompt}\n\nEMPHASIS: Capture a specific moment that tells a story. Create narrative intrigue.`
    ]

    return variations.slice(0, count)
  }

  private mapAspectRatioToSize(aspectRatio: string): string {
    const sizeMap: Record<string, string> = {
      '16:9': '1536x1024', // Closest to 16:9 in GPT-Image 1.5 options
      '1:1': '1024x1024',
      '9:16': '1024x1536'
    }
    return sizeMap[aspectRatio] || '1536x1024'
  }

  private mapAspectRatioToFluxSize(aspectRatio: string): string {
    const sizeMap: Record<string, string> = {
      '16:9': 'landscape_16_9',
      '1:1': 'square',
      '9:16': 'portrait_16_9'
    }
    return sizeMap[aspectRatio] || 'landscape_16_9'
  }

  private async uploadToStorage(
    imageUrl: string,
    projectId: string,
    thumbnailId: string,
    format: string
  ): Promise<string | undefined> {
    try {
      const supabase = await getSupabaseAdmin()

      // Download image
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error('Failed to download image')

      const blob = await response.blob()
      const buffer = Buffer.from(await blob.arrayBuffer())

      // Upload to Supabase
      const fileName = `${projectId}/thumbnails/${thumbnailId}.${format}`
      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, buffer, {
          contentType: `image/${format}`,
          upsert: true
        })

      if (error) {
        console.error('Storage upload error:', error)
        return undefined
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Failed to upload to storage:', error)
      return undefined
    }
  }

  private async saveThumbnailHistory(
    input: ThumbnailGenerationInput,
    thumbnails: GeneratedThumbnail[]
  ): Promise<void> {
    try {
      const supabase = await getSupabaseAdmin()

      for (const thumbnail of thumbnails) {
        await supabase.from('thumbnail_history').insert({
          id: thumbnail.id,
          project_id: input.projectId,
          user_id: input.userId,
          prompt: thumbnail.prompt,
          image_url: thumbnail.localUrl || thumbnail.url,
          model: thumbnail.model,
          status: 'completed',
          metadata: {
            originalUrl: thumbnail.url,
            width: thumbnail.width,
            height: thumbnail.height,
            personaId: input.persona?.id,
            personaName: input.persona?.name,
            quality: input.options?.quality || 'high',
            aspectRatio: input.options?.aspectRatio || '16:9'
          }
        })
      }
    } catch (error) {
      console.error('Failed to save thumbnail history:', error)
      // Don't throw - this is not critical
    }
  }
}

// Factory function
export function createEnhancedThumbnailService(): EnhancedThumbnailService {
  return new EnhancedThumbnailService()
}

// Default export
export default EnhancedThumbnailService
