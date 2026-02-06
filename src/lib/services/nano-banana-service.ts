/**
 * Nano Banana Pro Service
 *
 * Handles image generation using FAL.AI's Nano Banana Pro model
 * with character consistency (no LoRA training required)
 *
 * Key Features:
 * - Character consistency with reference images
 * - Natural language prompting (not tag soups)
 * - Conversational editing
 * - 4K resolution support
 * - Web search integration
 */

import { fal } from '@fal-ai/client'

export interface NanoBananaOptions {
  prompt: string
  referenceImages?: string[] // For character consistency
  resolution?: '1K' | '2K' | '4K'
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16' | '21:9' | '3:2' | '4:3' | '5:4' | '3:4' | '2:3' | 'auto'
  outputFormat?: 'jpeg' | 'png' | 'webp'
  numImages?: number
  enableWebSearch?: boolean
  style?: string // Optional style modifier (e.g., 'photorealistic', 'artistic')
  thinkingMode?: boolean // Enable extended thinking for complex prompts
}

export interface NanoBananaResult {
  url: string
  fileName: string
  contentType: string
}

export interface PhotoAnalysisResult {
  bestPhotos: string[]
  quality: 'excellent' | 'good' | 'needs_improvement'
  recommendations: string[]
  consistencyScore: number
}

// Portrait categories
export type GeneralPortraitType =
  | 'neutral_front'
  | 'friendly_smile'
  | 'angle_left_3_4'
  | 'angle_right_3_4'

export type UseCasePortraitType =
  | 'thumbnail_excited'
  | 'thumbnail_pointing'
  | 'story_casual'
  | 'podcast_host'
  | 'corporate_professional'
  | 'creator_workspace'

export type PortraitType = GeneralPortraitType | UseCasePortraitType

export interface PortraitResult {
  type: PortraitType
  category: 'general' | 'use_case'
  url: string
  title: string
}

export class NanoBananaService {
  constructor() {
    const apiKey = process.env.FAL_KEY
    if (!apiKey) {
      throw new Error('FAL_KEY environment variable is required')
    }

    // Configure FAL client
    fal.config({
      credentials: apiKey
    })
  }

  /**
   * Analyze uploaded photos and select the best ones for reference
   * Uses Gemini for analysis, then Nano Banana for generation
   */
  async analyzePhotos(photoUrls: string[]): Promise<PhotoAnalysisResult> {
    try {
      // For now, use a simple heuristic approach
      // In production, you could use Gemini or another vision model for analysis

      // Simple fallback: Select up to 6 photos (first 6 if provided)
      const bestPhotos = photoUrls.slice(0, 6)

      return {
        bestPhotos,
        quality: photoUrls.length >= 5 ? 'good' : 'needs_improvement',
        recommendations: photoUrls.length < 5
          ? [`Add ${5 - photoUrls.length} more photos for better consistency`]
          : ['Photos are ready for use'],
        consistencyScore: 0.8
      }
    } catch (error) {
      console.error('Photo analysis error:', error)

      // Fallback: Use first 6 photos
      return {
        bestPhotos: photoUrls.slice(0, 6),
        quality: 'good',
        recommendations: ['Using provided photos'],
        consistencyScore: 0.7
      }
    }
  }

  /**
   * Portrait scenario definitions
   * 4 General + 6 Use-Case = 10 total portraits
   *
   * CRITICAL: All prompts emphasize HYPERREALISM and EXACT preservation
   * of the person's actual appearance from reference photos
   */
  private getPortraitScenarios(personName: string): Array<{
    type: PortraitType
    category: 'general' | 'use_case'
    title: string
    prompt: string
  }> {
    // Base instructions for all portraits - emphasizes hyperrealism AND appropriate attire
    const hyperrealismBase = `CRITICAL REQUIREMENTS:
- HYPERREALISTIC photo, indistinguishable from a real photograph
- This must look like an actual studio photograph, NOT AI-generated
- Preserve EXACT facial features from reference: face shape, skin tone, eye color, eyebrows, nose, lips
- Maintain the person's EXACT skin texture, pores, and natural imperfections
- Keep their natural hair color, texture, and style from reference photos
- Real camera characteristics: subtle depth of field, natural lens bokeh, film grain
- Professional studio photography quality with catchlights in eyes

MANDATORY ATTIRE REQUIREMENT:
- The person MUST be wearing appropriate clothing - NEVER generate with bare shoulders or without a shirt
- Default attire: professional shirt, t-shirt, sweater, or business casual top
- Clothing should be clearly visible and appropriate for a professional context
- No bare skin below the neck/collarbone area`

    return [
      // ========== GENERAL PORTRAITS (4) ==========
      {
        type: 'neutral_front' as PortraitType,
        category: 'general',
        title: 'Neutral Front',
        prompt: `Create a HYPERREALISTIC professional studio headshot of ${personName}.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable as the same person in reference photos
- Copy their exact facial structure, features, and proportions
- Match their skin tone and complexion precisely
- Preserve any distinctive features (moles, freckles, dimples, etc.)

ATTIRE:
- Wearing a clean, professional dark-colored dress shirt or business casual top
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Neutral, calm, confident expression with slight hint of approachability
- Facing directly forward, head straight, shoulders square to camera
- Direct eye contact with the viewer

STUDIO PHOTOGRAPHY SETUP:
- Professional studio lighting: key light at 45°, fill light, hair light
- Soft, even lighting with no harsh shadows
- Clean catchlights visible in both eyes
- Subtle rim lighting on shoulders

BACKGROUND:
- Clean, solid neutral gray seamless backdrop
- Slight gradient for depth (darker at edges)
- Professional studio environment

OUTPUT:
- Indistinguishable from a real photograph taken by a professional photographer
- Sharp focus especially on eyes, natural skin texture visible
- 2K resolution, ready for professional use`
      },
      {
        type: 'friendly_smile' as PortraitType,
        category: 'general',
        title: 'Friendly Smile',
        prompt: `Create a HYPERREALISTIC warm, friendly studio portrait of ${personName} with a genuine smile.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable as the same person in reference photos
- Copy their exact smile, teeth, and the way their face creases when smiling
- Preserve their natural laugh lines and how their eyes crinkle

ATTIRE:
- Wearing a comfortable, professional sweater or casual button-up shirt
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Warm, genuine, NATURAL smile - not forced or fake
- Eyes should show real warmth (Duchenne smile - smile with eyes)
- Facing forward with very slight head tilt for friendliness
- Direct, warm eye contact with viewer

STUDIO PHOTOGRAPHY SETUP:
- Soft, warm studio lighting that flatters the face
- Beautiful catchlights in eyes
- Soft shadows that add dimension

BACKGROUND:
- Soft, blurred neutral or warm-toned studio background
- Professional photography studio environment

OUTPUT:
- Must look like an actual candid moment captured in a photo studio
- Natural skin tones, inviting and approachable
- Real photograph quality, 2K resolution`
      },
      {
        type: 'angle_left_3_4' as PortraitType,
        category: 'general',
        title: '3/4 Angle Left',
        prompt: `Create a HYPERREALISTIC dynamic 3/4 angle studio portrait of ${personName} turned slightly left.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable from their reference photos
- Preserve their profile shape, jawline, and nose bridge
- Match their exact features even from this angle

ATTIRE:
- Wearing a professional dark t-shirt or casual blazer
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Body and face turned about 30-45 degrees to the left
- Looking back at camera with confident expression
- Slight professional smile optional

STUDIO PHOTOGRAPHY SETUP:
- Professional studio lighting creating dimensional portrait
- Slight shadow on far side of face for depth (Rembrandt-style)
- Beautiful catchlights in eyes
- Clean, professional quality

BACKGROUND:
- Clean, professional, softly blurred studio background
- Subtle gradient for depth

OUTPUT:
- Looks like an actual photograph from a professional headshot session
- Dimensional and dynamic, professional photography quality
- 2K resolution`
      },
      {
        type: 'angle_right_3_4' as PortraitType,
        category: 'general',
        title: '3/4 Angle Right',
        prompt: `Create a HYPERREALISTIC dynamic 3/4 angle studio portrait of ${personName} turned slightly right.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable from their reference photos
- Preserve their profile shape, jawline, and nose bridge
- Match their exact features even from this angle

ATTIRE:
- Wearing a professional dark t-shirt or casual blazer
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Body and face turned about 30-45 degrees to the right
- Looking back at camera with confident expression
- Slight professional smile optional

STUDIO PHOTOGRAPHY SETUP:
- Professional studio lighting creating dimensional portrait
- Slight shadow on far side of face for depth (Rembrandt-style)
- Beautiful catchlights in eyes
- Clean, professional quality

BACKGROUND:
- Clean, professional, softly blurred studio background
- Subtle gradient for depth

OUTPUT:
- Looks like an actual photograph from a professional headshot session
- Dimensional and dynamic, professional photography quality
- 2K resolution`
      },

      // ========== USE-CASE PORTRAITS (6) ==========
      {
        type: 'thumbnail_excited' as PortraitType,
        category: 'use_case',
        title: 'Thumbnail Excited',
        prompt: `Create a HYPERREALISTIC excited expression portrait of ${personName} for YouTube thumbnails.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable - same person, just excited expression
- Preserve their exact facial features even with exaggerated expression
- Keep their natural appearance, just with genuine excitement

ATTIRE:
- Wearing a vibrant colored t-shirt or branded hoodie
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Genuinely excited, surprised, or amazed expression
- Wide eyes, raised eyebrows, mouth open in authentic excitement
- Facing forward, slightly leaning toward camera
- Intense, direct eye contact grabbing viewer's attention

LIGHTING:
- Bright, professional studio lighting
- Face well-lit with vibrant but realistic quality
- Good contrast while maintaining realistic skin tones

BACKGROUND:
- Vibrant, saturated color (bright blue, orange, or yellow gradient)
- Clean studio backdrop with color

OUTPUT:
- MUST look like a real photograph of the person being genuinely excited
- High quality, thumbnail-optimized, but still a real photo
- 2K resolution`
      },
      {
        type: 'thumbnail_pointing' as PortraitType,
        category: 'use_case',
        title: 'Thumbnail Pointing',
        prompt: `Create a HYPERREALISTIC portrait of ${personName} pointing, perfect for YouTube thumbnails.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable from reference photos
- Their face and body proportions must match exactly
- Preserve their natural hand size and proportions

ATTIRE:
- Wearing a clean t-shirt, polo shirt, or casual top
- Clothing clearly visible, no bare shoulders or arms

EXPRESSION & POSE:
- Upper body visible with clear pointing gesture
- One hand pointing to the right side of frame (viewer's right)
- Engaged, excited expression - as if pointing at something amazing
- Looking at where they're pointing OR at viewer

COMPOSITION:
- ${personName} on the left third of frame
- Clear pointing gesture toward right side
- Space left for text/graphics on right

LIGHTING:
- Bright, professional studio lighting
- Good contrast, punchy but realistic

BACKGROUND:
- Clean, vibrant colored studio backdrop that pops

OUTPUT:
- Must look like a real photograph, just with intentional thumbnail composition
- Dynamic, professional photography quality
- 2K resolution`
      },
      {
        type: 'story_casual' as PortraitType,
        category: 'use_case',
        title: 'Story Casual',
        prompt: `Create a HYPERREALISTIC casual lifestyle portrait of ${personName} for Instagram/TikTok.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable from reference photos
- Their casual expression and posture should still be clearly them
- Preserve exact features in this relaxed setting

ATTIRE:
- Wearing a stylish casual outfit - sweater, casual jacket, or nice t-shirt
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Relaxed, authentic, candid expression
- Natural slight smile, genuine vibe
- Casual posture - slight head tilt, natural gesture
- Can be looking at camera casually or slightly off-camera

LIGHTING:
- Natural, soft lighting like window light
- Golden hour warmth optional
- Realistic environmental lighting

SETTING & BACKGROUND:
- Lifestyle setting with natural bokeh
- Cozy indoor, café, or outdoor urban environment
- Realistic depth of field

OUTPUT:
- Must look like a real candid photo, not posed studio shot
- Authentic, relatable, Instagram-worthy but real
- Portrait orientation, 2K resolution`
      },
      {
        type: 'podcast_host' as PortraitType,
        category: 'use_case',
        title: 'Podcast Host',
        prompt: `Create a HYPERREALISTIC portrait of ${personName} as a podcast host in conversation.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable from reference photos
- Their features must be identical, just in podcast setting
- Preserve their natural presence and energy

ATTIRE:
- Wearing a casual button-up shirt or smart casual top
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Engaged, thoughtful, mid-conversation expression
- Intelligent and interested look
- Slight lean forward showing engagement
- Hands may be gesturing thoughtfully
- Looking slightly off-camera or at camera

SETTING:
- Professional podcast studio environment
- Suggestion of microphone or headphones visible
- Dark or moody podcast studio aesthetic
- Subtle sound panels or studio equipment hints in background

LIGHTING:
- Professional podcast studio lighting
- Warm, intimate, professional quality
- Realistic mixed lighting

OUTPUT:
- Must look like an actual photo from a podcast studio session
- Professional audio/video creator aesthetic
- 2K resolution`
      },
      {
        type: 'corporate_professional' as PortraitType,
        category: 'use_case',
        title: 'Corporate Professional',
        prompt: `Create a HYPERREALISTIC corporate executive portrait of ${personName} for LinkedIn.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable from reference photos
- Their features in professional context must be identical
- Preserve their natural professional presence

EXPRESSION & POSE:
- Confident, trustworthy, professional expression
- Subtle, composed smile that exudes competence
- Formal posture, shoulders back
- Arms may be crossed confidently
- Direct, confident eye contact

ATTIRE:
- Professional business attire (suit, blazer, or formal business wear)
- Clean, well-fitted clothing

SETTING:
- Executive office or clean professional backdrop
- Classic corporate photography environment

LIGHTING:
- Classic corporate lighting setup
- Professional, flattering, polished quality
- Clean catchlights in eyes

OUTPUT:
- Must look like an actual corporate headshot photo
- Polished, executive presence, LinkedIn-ready
- 2K resolution`
      },
      {
        type: 'creator_workspace' as PortraitType,
        category: 'use_case',
        title: 'Creator Workspace',
        prompt: `Create a HYPERREALISTIC environmental portrait of ${personName} in their creator workspace.

${hyperrealismBase}

IDENTITY PRESERVATION:
- This person must be IMMEDIATELY recognizable from reference photos
- In their natural creator environment, still clearly identifiable
- Preserve their authentic presence

ATTIRE:
- Wearing a comfortable hoodie, t-shirt, or casual work outfit
- Clothing clearly visible, no bare shoulders

EXPRESSION & POSE:
- Focused yet approachable, in their element
- Authentic creator vibe
- Natural working pose at desk or with equipment
- Can be looking at camera or focused on work

WORKSPACE SETTING:
- Modern creator workspace environment
- Monitors, camera equipment, ring light visible
- Plants, creative tools, personal touches
- Detailed environment showing creator's world

LIGHTING:
- Mixed natural and practical lighting
- Realistic workspace illumination
- Multiple light sources typical of creator setups

OUTPUT:
- Must look like a real environmental portrait photo
- Authentic, shows personality through environment
- 2K resolution`
      }
    ]
  }

  /**
   * Generate all 10 reference portraits
   * Returns structured results with type and category info
   */
  async generateAllPortraits(params: {
    referencePhotos: string[]
    personName: string
    onProgress?: (completed: number, total: number, current: string) => void
    onPortraitGenerated?: (portrait: PortraitResult) => Promise<void>
  }): Promise<PortraitResult[]> {
    const { referencePhotos, personName, onProgress, onPortraitGenerated } = params
    const scenarios = this.getPortraitScenarios(personName)
    const results: PortraitResult[] = []

    console.log(`Generating ${scenarios.length} portraits for ${personName}...`)

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i]

      try {
        if (onProgress) {
          onProgress(i, scenarios.length, scenario.title)
        }

        console.log(`[${i + 1}/${scenarios.length}] Generating: ${scenario.title}`)

        const result = await this.generateImage({
          prompt: scenario.prompt,
          referenceImages: referencePhotos,
          resolution: '2K',
          aspectRatio: '4:5'
        })

        const portrait: PortraitResult = {
          type: scenario.type,
          category: scenario.category,
          url: result.url,
          title: scenario.title
        }

        results.push(portrait)

        // Call callback immediately after each portrait is generated
        // This allows saving to database one by one for real-time updates
        if (onPortraitGenerated) {
          await onPortraitGenerated(portrait)
        }

        console.log(`[${i + 1}/${scenarios.length}] ✓ ${scenario.title} complete`)
      } catch (error) {
        console.error(`[${i + 1}/${scenarios.length}] ✗ Failed to generate ${scenario.title}:`, error)
        // Continue with other portraits
      }
    }

    console.log(`Portrait generation complete: ${results.length}/${scenarios.length} successful`)
    return results
  }

  /**
   * Generate only general portraits (4)
   */
  async generateGeneralPortraits(params: {
    referencePhotos: string[]
    personName: string
  }): Promise<PortraitResult[]> {
    const scenarios = this.getPortraitScenarios(params.personName)
      .filter(s => s.category === 'general')

    const results: PortraitResult[] = []

    for (const scenario of scenarios) {
      try {
        const result = await this.generateImage({
          prompt: scenario.prompt,
          referenceImages: params.referencePhotos,
          resolution: '2K',
          aspectRatio: '4:5'
        })

        results.push({
          type: scenario.type,
          category: scenario.category,
          url: result.url,
          title: scenario.title
        })
      } catch (error) {
        console.error(`Failed to generate ${scenario.title}:`, error)
      }
    }

    return results
  }

  /**
   * Generate specific use-case portraits
   */
  async generateUseCasePortraits(params: {
    referencePhotos: string[]
    personName: string
    types?: UseCasePortraitType[]
  }): Promise<PortraitResult[]> {
    const allScenarios = this.getPortraitScenarios(params.personName)
      .filter(s => s.category === 'use_case')

    const scenarios = params.types
      ? allScenarios.filter(s => params.types!.includes(s.type as UseCasePortraitType))
      : allScenarios

    const results: PortraitResult[] = []

    for (const scenario of scenarios) {
      try {
        const result = await this.generateImage({
          prompt: scenario.prompt,
          referenceImages: params.referencePhotos,
          resolution: '2K',
          aspectRatio: '4:5'
        })

        results.push({
          type: scenario.type,
          category: scenario.category,
          url: result.url,
          title: scenario.title
        })
      } catch (error) {
        console.error(`Failed to generate ${scenario.title}:`, error)
      }
    }

    return results
  }

  /**
   * Legacy method - generates old 5 portraits for backward compatibility
   * @deprecated Use generateAllPortraits instead
   */
  async generateReferencePortraits(params: {
    referencePhotos: string[]
    personName: string
  }): Promise<string[]> {
    const results = await this.generateAllPortraits(params)
    return results.map(r => r.url)
  }

  /**
   * Generate image using Nano Banana Pro via FAL.AI
   * Following best practices: natural language, descriptive, specific
   *
   * Uses:
   * - nano-banana-pro/edit if referenceImages provided (character consistency)
   * - nano-banana-pro for text-to-image without reference
   */
  async generateImage(options: NanoBananaOptions): Promise<NanoBananaResult> {
    const {
      prompt,
      referenceImages = [],
      resolution = '2K',
      aspectRatio = '16:9',
      outputFormat = 'png',
      numImages = 1,
      enableWebSearch = false
    } = options

    try {
      let result: any

      // If reference images provided, use Gemini 3 Pro Image Preview Edit endpoint for character consistency
      if (referenceImages.length > 0) {
        console.log(`Using Gemini 3 Pro Image Edit with ${referenceImages.length} reference images`)

        result = await fal.subscribe('fal-ai/gemini-3-pro-image-preview/edit', {
          input: {
            prompt: prompt,
            image_urls: referenceImages, // Reference images for character consistency
            num_images: numImages,
            aspect_ratio: aspectRatio === 'auto' ? 'auto' : aspectRatio,
            output_format: outputFormat,
            resolution: resolution, // Supports 1K, 2K, 4K
            enable_web_search: enableWebSearch
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              console.log('Gemini 3 Pro generating with character consistency...', update.logs)
            }
          }
        })
      } else {
        // No reference images, use standard text-to-image
        console.log('Using Nano Banana Pro text-to-image')

        result = await fal.subscribe('fal-ai/nano-banana-pro', {
          input: {
            prompt: prompt,
            num_images: numImages,
            aspect_ratio: aspectRatio,
            output_format: outputFormat,
            resolution: resolution,
            enable_web_search: enableWebSearch
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              console.log('Nano Banana Pro generating...', update.logs)
            }
          }
        })
      }

      // Extract image from result
      const image = result.data.images[0]

      return {
        url: image.url,
        fileName: image.file_name,
        contentType: image.content_type
      }
    } catch (error: any) {
      console.error('Nano Banana Pro generation error:', error)
      // Log the full error body for debugging
      if (error.body) {
        console.error('Error body:', JSON.stringify(error.body, null, 2))
      }
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate batch of images
   */
  async generateBatchImages(
    prompts: string[],
    options: Omit<NanoBananaOptions, 'prompt'>
  ): Promise<NanoBananaResult[]> {
    const results: NanoBananaResult[] = []

    // Process in batches to avoid rate limits
    const batchSize = 2
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(prompt => this.generateImage({ ...options, prompt }))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Generate viral thumbnail using character consistency
   * Following Nano Banana Pro prompting best practices
   */
  async generateViralThumbnail(params: {
    referenceImages: string[]
    personName: string
    videoTitle: string
    keyMessage: string
    brandColors?: { primary: string; accent: string }
    contentTheme?: string
  }): Promise<string> {
    const {
      referenceImages,
      personName,
      videoTitle,
      keyMessage,
      brandColors,
      contentTheme
    } = params

    // Use natural language with context (Creative Director approach)
    const prompt = `Design a viral YouTube thumbnail in 16:9 format for the video: "${videoTitle}".

Character: Feature ${personName} prominently with consistent facial features.
Face: ${personName} should have the same appearance and facial structure throughout.
Expression: Excited, surprised, or intrigued expression that draws viewers in.
Eye Contact: Direct eye contact with the viewer.

Composition:
- Position ${personName} on the left third of the frame
- ${personName} should occupy about 40% of the frame
- Leave clear space on the right for text and graphics

Text Overlay:
- Display this key message prominently: "${keyMessage}"
- Use massive, bold letters with thick white outline and drop shadow
- Text should be instantly readable even at small thumbnail size
- High contrast against background

Visual Elements:
${contentTheme ? `- Incorporate visual elements related to: ${contentTheme}` : ''}
- Add an eye-catching graphic or icon on the right side
${brandColors ? `- Use vibrant ${brandColors.accent} color for highlights and arrows` : ''}

Background:
${brandColors ? `- Use ${brandColors.primary} as the dominant background color` : '- Use vibrant, energetic background'}
- Apply depth with subtle blur or gradient
- High saturation and contrast for maximum clickability

Lighting:
- Professional lighting on ${personName}'s face
- Ensure face is well-lit and clearly visible
- Dramatic lighting to add energy

Quality:
- Photorealistic, professional quality
- Optimized for YouTube thumbnails
- High contrast, vibrant colors
- 2K resolution for crystal clarity

Important: Maintain consistent facial features and appearance for ${personName} based on the character description.`

    const result = await this.generateImage({
      prompt,
      referenceImages,
      resolution: '2K',
      aspectRatio: '16:9'
    })

    return result.url
  }

  /**
   * Generate social media post image with character consistency
   */
  async generateSocialImage(params: {
    referenceImages: string[]
    personName?: string
    contentDescription: string
    aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16'
    brandColors?: { primary: string; secondary: string; accent: string }
    mood?: string
  }): Promise<string> {
    const {
      referenceImages,
      personName,
      contentDescription,
      aspectRatio = '4:5',
      brandColors,
      mood = 'professional'
    } = params

    let prompt = `Create a professional social media image.

${personName ? `
Character: Feature ${personName} with consistent facial features and appearance.
Expression: ${mood} expression that matches the content.
Pose: Natural, engaging pose that complements the content.
` : ''}

Content: ${contentDescription}

${brandColors ? `
Color Palette:
- Primary: ${brandColors.primary} (dominant background or key elements)
- Accent: ${brandColors.accent} (highlights, emphasis, graphics)
- Secondary: ${brandColors.secondary} (supporting elements)
` : ''}

Composition:
- Professional, polished composition
- Clear focal point
- Space for text overlays if needed
- ${aspectRatio === '4:5' ? 'Portrait orientation optimized for Instagram' : ''}
- ${aspectRatio === '16:9' ? 'Landscape orientation optimized for YouTube/Facebook' : ''}

Lighting:
- Professional lighting setup
- Soft shadows, proper exposure
- High-quality, studio-grade appearance

Quality:
- Photorealistic, professional photography quality
- Sharp focus, high detail
- Vibrant colors optimized for social media
- 2K resolution

${personName ? `Important: Maintain consistent facial features and appearance for ${personName}.` : ''}`

    const result = await this.generateImage({
      prompt,
      referenceImages,
      resolution: '2K',
      aspectRatio
    })

    return result.url
  }
}

/**
 * Create and export singleton instance
 */
export function createNanoBananaService(): NanoBananaService {
  return new NanoBananaService()
}
