import { fal } from '@fal-ai/client'

// Configure FAL API key
if (process.env.FAL_API_KEY) {
  fal.config({
    credentials: process.env.FAL_API_KEY
  })
}

export interface FluxGenerationParams {
  prompt: string
  model?: 'flux-pro-1.1' | 'flux-dev' | 'flux-schnell' | 'flux-lora'
  imageSize?: 'square' | 'landscape_4_3' | 'landscape_16_9' | 'portrait_4_5' | 'portrait_16_9'
  aspectRatio?: string // Alternative to imageSize
  numInferenceSteps?: number
  guidanceScale?: number
  seed?: number
  loras?: Array<{
    path: string
    scale?: number
  }>
  numImages?: number
  outputFormat?: 'jpeg' | 'png'
  enableSafetyChecker?: boolean
}

export interface LoRATrainingParams {
  imagesDataUrl: string // ZIP archive URL with training images
  triggerPhrase?: string // e.g., "photo of john doe"
  learningRate?: number
  steps?: number
  multiresolutionTraining?: boolean
  subjectCrop?: boolean
  createMasks?: boolean
}

export interface FluxGenerationResult {
  images: Array<{
    url: string
    contentType: string
  }>
  seed: number
  hasNsfwConcepts: boolean[]
  prompt: string
}

export interface LoRATrainingResult {
  diffusersLoraFile: {
    url: string
    contentType: string
    fileName: string
    fileSize: number
  }
  configFile: {
    url: string
    contentType: string
    fileName: string
    fileSize: number
  }
}

export class FALService {
  /**
   * Generate images using FLUX models with optional LoRA
   */
  static async generateImage(params: FluxGenerationParams): Promise<FluxGenerationResult> {
    if (!process.env.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured')
    }

    const {
      prompt,
      model = 'flux-lora',
      imageSize = 'landscape_4_3',
      aspectRatio,
      numInferenceSteps = 28,
      guidanceScale = 3.5,
      seed,
      loras = [],
      numImages = 1,
      outputFormat = 'jpeg',
      enableSafetyChecker = true
    } = params

    try {
      // Map model name to FAL endpoint
      const endpoint = model === 'flux-lora' ? 'fal-ai/flux-lora' : 
                       model === 'flux-dev' ? 'fal-ai/flux/dev' :
                       model === 'flux-schnell' ? 'fal-ai/flux/schnell' :
                       'fal-ai/flux-pro-1.1'

      // Prepare LoRA weights if provided
      const loraWeights = loras.map(lora => ({
        path: lora.path,
        scale: lora.scale || 1.0
      }))

      // Call FAL API
      const result = await fal.subscribe(endpoint, {
        input: {
          prompt,
          image_size: aspectRatio || imageSize,
          num_inference_steps: numInferenceSteps,
          guidance_scale: guidanceScale,
          seed,
          loras: loraWeights,
          num_images: numImages,
          output_format: outputFormat,
          enable_safety_checker: enableSafetyChecker,
          sync_mode: false
        },
        logs: false,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('Generating image...')
          }
        }
      }) as any

      return {
        images: result.data.images || result.images || [],
        seed: result.data.seed || result.seed || Math.floor(Math.random() * 1000000),
        hasNsfwConcepts: result.data.has_nsfw_concepts || result.has_nsfw_concepts || [],
        prompt: result.data.prompt || result.prompt || prompt
      }
    } catch (error) {
      console.error('FAL image generation error:', error)
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Train a LoRA model for portrait generation
   */
  static async trainLoRA(params: LoRATrainingParams): Promise<LoRATrainingResult> {
    if (!process.env.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured')
    }

    const {
      imagesDataUrl,
      triggerPhrase,
      learningRate = 0.00009,
      steps = 2500,
      multiresolutionTraining = true,
      subjectCrop = true,
      createMasks = false
    } = params

    try {
      // Call FAL LoRA training API
      const result = await fal.subscribe('fal-ai/flux-lora-portrait-trainer', {
        input: {
          images_data_url: imagesDataUrl,
          trigger_phrase: triggerPhrase,
          learning_rate: learningRate,
          steps,
          multiresolution_training: multiresolutionTraining,
          subject_crop: subjectCrop
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('Training LoRA...')
            if ('logs' in update) {
              (update as any).logs?.forEach((log: any) => {
                console.log('Training log:', log.message)
              })
            }
          }
        }
      }) as any

      return {
        diffusersLoraFile: result.data.diffusers_lora_file || result.diffusers_lora_file,
        configFile: result.data.config_file || result.config_file
      }
    } catch (error) {
      console.error('FAL LoRA training error:', error)
      throw new Error(`Failed to train LoRA: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate image with persona LoRA
   */
  static async generateWithPersona(
    prompt: string,
    loraUrl: string,
    options: Partial<FluxGenerationParams> = {}
  ): Promise<string> {
    const result = await this.generateImage({
      ...options,
      prompt,
      model: 'flux-lora',
      loras: [
        {
          path: loraUrl,
          scale: options.loras?.[0]?.scale || 1.0
        },
        ...(options.loras?.slice(1) || [])
      ]
    })

    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated')
    }

    return result.images[0].url
  }

  /**
   * Upload images and create ZIP for LoRA training
   */
  static async prepareTrainingData(
    images: Array<{ url: string, caption?: string }>,
    triggerWord: string = '[trigger]'
  ): Promise<string> {
    // In production, this would:
    // 1. Download images from URLs
    // 2. Create caption files with trigger word
    // 3. Create ZIP archive
    // 4. Upload to storage (e.g., Supabase storage)
    // 5. Return public URL

    // For now, assuming images are already in a ZIP at a URL
    // This is a placeholder - implement actual ZIP creation if needed
    
    throw new Error('prepareTrainingData needs implementation for your storage backend')
  }

  /**
   * Validate FAL API key
   */
  static isConfigured(): boolean {
    return !!process.env.FAL_API_KEY
  }
}

// Export convenience functions
export async function generateFluxImage(params: FluxGenerationParams): Promise<FluxGenerationResult> {
  return FALService.generateImage(params)
}

export async function trainPersonaLoRA(params: LoRATrainingParams): Promise<LoRATrainingResult> {
  return FALService.trainLoRA(params)
}

export async function generateWithPersonaLoRA(
  prompt: string,
  loraUrl: string,
  options?: Partial<FluxGenerationParams>
): Promise<string> {
  return FALService.generateWithPersona(prompt, loraUrl, options)
}
