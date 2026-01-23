/**
 * Intelligent Social Post Service
 *
 * Generates narrative-driven social content based on deep content analysis.
 * Uses GPT-5.2 for intelligent copy generation and GPT-Image 1.5/Nano Banana Pro
 * for persona-consistent image generation.
 *
 * Key features:
 * - Narrative arc carousels (not random slides)
 * - Contextual quote extraction with meaning
 * - Platform-specific optimization
 * - Persona-consistent imagery
 * - Brand voice alignment
 */

import OpenAI from 'openai'
import { fal } from '@fal-ai/client'
import { v4 as uuidv4 } from 'uuid'
import {
  DeepContentAnalysis,
  SocialContentPlan,
  ContentAssistantInput
} from './content-assistant-service'

// Lazy initialization to prevent client-side errors
let _openai: OpenAI | null = null
const getOpenAI = () => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return _openai
}

// FAL config is safe at module level (only uses credentials when called)
fal.config({
  credentials: process.env.FAL_KEY
})

// Lazy load supabaseAdmin
const getSupabaseAdmin = async () => {
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  return supabaseAdmin
}

// Types
export interface SocialPostInput {
  // Content source
  analysis: DeepContentAnalysis
  contentPlan: SocialContentPlan
  transcript: string
  projectTitle: string
  projectId: string
  userId: string

  // Persona for image generation
  persona?: {
    id: string
    name: string
    referenceImageUrls: string[]
  }

  // Brand settings
  brand?: {
    name?: string
    voice?: string
    colors?: { primary?: string; secondary?: string; accent?: string }
    targetAudience?: {
      description?: string
      interests?: string[]
    }
  }

  // Generation options
  options?: {
    platforms?: ('instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok')[]
    contentTypes?: ('carousel' | 'quote' | 'single' | 'thread')[]
    generateImages?: boolean
    imageQuality?: 'low' | 'medium' | 'high'
  }
}

export interface GeneratedCarousel {
  id: string
  title: string
  narrativeArc: string
  slides: Array<{
    slideNumber: number
    headline: string
    body: string
    imageUrl?: string
    imagePrompt: string
    designNotes: string
  }>
  caption: string
  hashtags: string[]
  cta: string
  platforms: string[]
  status: 'draft' | 'ready'
}

export interface GeneratedQuote {
  id: string
  quote: string
  attribution: string
  context: string
  imageUrl?: string
  imagePrompt: string
  caption: string
  hashtags: string[]
  platforms: string[]
  status: 'draft' | 'ready'
}

export interface GeneratedHook {
  id: string
  text: string
  imageUrl?: string
  imagePrompt: string
  platform: string
  followUp: string
  status: 'draft' | 'ready'
}

export interface SocialGenerationResult {
  success: boolean
  carousels: GeneratedCarousel[]
  quotes: GeneratedQuote[]
  hooks: GeneratedHook[]
  error?: string
  metadata: {
    totalImagesGenerated: number
    processingTime: number
    platforms: string[]
  }
}

// Platform-specific dimensions
const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number; aspectRatio: string }> = {
  instagram: { width: 1080, height: 1350, aspectRatio: '4:5' },
  twitter: { width: 1200, height: 675, aspectRatio: '16:9' },
  linkedin: { width: 1200, height: 628, aspectRatio: '1.91:1' },
  facebook: { width: 1080, height: 1080, aspectRatio: '1:1' },
  tiktok: { width: 1080, height: 1920, aspectRatio: '9:16' }
}

// Platform-specific copy limits
const PLATFORM_LIMITS: Record<string, { caption: number; hashtags: number }> = {
  instagram: { caption: 2200, hashtags: 30 },
  twitter: { caption: 280, hashtags: 5 },
  linkedin: { caption: 3000, hashtags: 5 },
  facebook: { caption: 2200, hashtags: 30 },
  tiktok: { caption: 2200, hashtags: 100 }
}

/**
 * Intelligent Social Post Service
 */
export class IntelligentSocialService {
  private model = 'gpt-5.2'
  private imageModel = 'fal-ai/gpt-image-1.5/edit'
  private fluxModel = 'fal-ai/flux-pro/v1.1'

  /**
   * Generate all social content from content plan
   */
  async generateSocialContent(input: SocialPostInput): Promise<SocialGenerationResult> {
    const startTime = Date.now()
    const options = input.options || {}
    const platforms = options.platforms || ['instagram', 'twitter', 'linkedin']
    const contentTypes = options.contentTypes || ['carousel', 'quote']
    const generateImages = options.generateImages !== false

    const carousels: GeneratedCarousel[] = []
    const quotes: GeneratedQuote[] = []
    const hooks: GeneratedHook[] = []
    let totalImagesGenerated = 0

    try {
      // Generate carousels if requested
      if (contentTypes.includes('carousel') && input.contentPlan.carousels.length > 0) {
        console.log('[IntelligentSocial] Generating carousels...')
        for (const carouselPlan of input.contentPlan.carousels) {
          const carousel = await this.generateCarousel(
            carouselPlan,
            input,
            platforms,
            generateImages
          )
          carousels.push(carousel)
          totalImagesGenerated += carousel.slides.filter(s => s.imageUrl).length
        }
      }

      // Generate quotes if requested
      if (contentTypes.includes('quote') && input.contentPlan.quotes.length > 0) {
        console.log('[IntelligentSocial] Generating quote graphics...')
        for (const quotePlan of input.contentPlan.quotes) {
          const quote = await this.generateQuoteGraphic(
            quotePlan,
            input,
            platforms,
            generateImages
          )
          quotes.push(quote)
          if (quote.imageUrl) totalImagesGenerated++
        }
      }

      // Generate hooks if requested
      if (contentTypes.includes('single') && input.contentPlan.hooks.length > 0) {
        console.log('[IntelligentSocial] Generating hooks...')
        for (const hookPlan of input.contentPlan.hooks.slice(0, 3)) { // Limit to 3 hooks
          const hook = await this.generateHook(
            hookPlan,
            input,
            generateImages
          )
          hooks.push(hook)
          if (hook.imageUrl) totalImagesGenerated++
        }
      }

      // Save all generated content
      await this.saveGeneratedContent(input.projectId, input.userId, { carousels, quotes, hooks })

      return {
        success: true,
        carousels,
        quotes,
        hooks,
        metadata: {
          totalImagesGenerated,
          processingTime: Date.now() - startTime,
          platforms
        }
      }
    } catch (error) {
      console.error('Social content generation error:', error)
      return {
        success: false,
        carousels,
        quotes,
        hooks,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          totalImagesGenerated,
          processingTime: Date.now() - startTime,
          platforms
        }
      }
    }
  }

  /**
   * Generate a single carousel with narrative flow
   */
  private async generateCarousel(
    plan: SocialContentPlan['carousels'][0],
    input: SocialPostInput,
    platforms: string[],
    generateImages: boolean
  ): Promise<GeneratedCarousel> {
    const carouselId = uuidv4()

    // Enhance slide content with platform-specific optimization
    const enhancedSlides = await this.enhanceCarouselSlides(plan, input)

    // Generate images for each slide if requested
    const slidesWithImages = generateImages
      ? await this.generateCarouselImages(enhancedSlides, input)
      : enhancedSlides.map(slide => ({ ...slide, imageUrl: undefined }))

    // Generate platform-specific captions
    const { caption, hashtags } = await this.generatePlatformCaption(
      plan,
      input,
      platforms[0] // Primary platform
    )

    return {
      id: carouselId,
      title: plan.title,
      narrativeArc: plan.narrativeArc,
      slides: slidesWithImages,
      caption,
      hashtags,
      cta: plan.cta,
      platforms,
      status: generateImages ? 'ready' : 'draft'
    }
  }

  /**
   * Enhance carousel slides with better copy using GPT-5.2
   */
  private async enhanceCarouselSlides(
    plan: SocialContentPlan['carousels'][0],
    input: SocialPostInput
  ): Promise<GeneratedCarousel['slides']> {
    const systemPrompt = `You are an expert social media copywriter who creates carousel content that:
1. Stops the scroll with the first slide (pattern interrupt)
2. Delivers value progressively (not front-loaded)
3. Creates micro-cliffhangers between slides
4. Ends with a clear, compelling CTA

${input.brand?.voice ? `BRAND VOICE: ${input.brand.voice}` : ''}
${input.brand?.targetAudience?.description ? `TARGET AUDIENCE: ${input.brand.targetAudience.description}` : ''}

Each slide should:
- Have a punchy headline (max 8 words)
- Have a body that elaborates (max 30 words)
- Build on the previous slide
- Create desire to see the next slide`

    const userPrompt = `Enhance this carousel for maximum engagement:

CAROUSEL PLAN:
${JSON.stringify(plan, null, 2)}

CONTENT CONTEXT:
- Title: ${input.projectTitle}
- Core Message: ${input.analysis.coreMessage.oneSentence}
- Audience Pain Point: ${input.analysis.audiencePsychology.primaryPainPoint}
- Desired Outcome: ${input.analysis.audiencePsychology.desiredOutcome}

Return a JSON array of slides with: slideNumber, headline, body, visualPrompt, designNotes`

    try {
      const response = await getOpenAI().responses.create({
        model: this.model,
        input: userPrompt,
        instructions: systemPrompt,
        reasoning: { effort: 'medium' },
        text: { format: { type: 'json_object' } },
        max_output_tokens: 2000
      })

      const outputText = this.extractOutputText(response)
      const result = JSON.parse(outputText)

      // Map to our structure
      return (result.slides || plan.slides).map((slide: any, index: number) => ({
        slideNumber: slide.slideNumber || index + 1,
        headline: slide.headline || plan.slides[index]?.headline || '',
        body: slide.body || plan.slides[index]?.body || '',
        imagePrompt: slide.visualPrompt || plan.slides[index]?.visualPrompt || '',
        designNotes: slide.designNotes || plan.slides[index]?.designNotes || ''
      }))
    } catch (error) {
      console.error('Slide enhancement error:', error)
      // Fallback to original plan
      return plan.slides.map(slide => ({
        slideNumber: slide.slideNumber,
        headline: slide.headline,
        body: slide.body,
        imagePrompt: slide.visualPrompt,
        designNotes: slide.designNotes
      }))
    }
  }

  /**
   * Generate images for carousel slides
   */
  private async generateCarouselImages(
    slides: GeneratedCarousel['slides'],
    input: SocialPostInput
  ): Promise<GeneratedCarousel['slides']> {
    const slidesWithImages: GeneratedCarousel['slides'] = []
    const dimensions = PLATFORM_DIMENSIONS.instagram // Default to Instagram carousel size

    for (const slide of slides) {
      try {
        // Build enhanced image prompt for this slide
        const imagePrompt = this.buildSlideImagePrompt(slide, input, slides.length)

        // Generate image
        const imageUrl = await this.generateImage(
          imagePrompt,
          input.persona,
          dimensions.aspectRatio,
          input.options?.imageQuality || 'high'
        )

        // Upload to storage
        const localUrl = imageUrl
          ? await this.uploadToStorage(imageUrl, input.projectId, `carousel_${slide.slideNumber}`)
          : undefined

        slidesWithImages.push({
          ...slide,
          imageUrl: localUrl || imageUrl
        })
      } catch (error) {
        console.error(`Failed to generate image for slide ${slide.slideNumber}:`, error)
        slidesWithImages.push({ ...slide, imageUrl: undefined })
      }
    }

    return slidesWithImages
  }

  /**
   * Build an enhanced image prompt for a carousel slide
   */
  private buildSlideImagePrompt(
    slide: GeneratedCarousel['slides'][0],
    input: SocialPostInput,
    totalSlides: number
  ): string {
    const isFirstSlide = slide.slideNumber === 1
    const isLastSlide = slide.slideNumber === totalSlides

    let prompt = slide.imagePrompt

    // Add slide-specific context
    if (isFirstSlide) {
      prompt += `

FIRST SLIDE REQUIREMENTS:
- This is the HOOK slide that must stop the scroll
- Bold, attention-grabbing visual
- Create intrigue and curiosity
- Headline should be prominently placed: "${slide.headline}"`
    } else if (isLastSlide) {
      prompt += `

FINAL SLIDE REQUIREMENTS:
- This is the CTA slide
- Clear call-to-action visual
- Inviting and action-oriented
- CTA text should be prominent`
    } else {
      prompt += `

CONTENT SLIDE ${slide.slideNumber}/${totalSlides}:
- Continue the visual narrative
- Headline: "${slide.headline}"
- Support the body text: "${slide.body}"`
    }

    // Add persona instructions if available
    if (input.persona) {
      prompt += `

PERSONA: Feature ${input.persona.name} consistently with reference images.
- Maintain exact appearance and features
- Professional, engaging expression
- Appropriate for social media carousel format`
    }

    // Add design notes
    if (slide.designNotes) {
      prompt += `\n\nDESIGN NOTES: ${slide.designNotes}`
    }

    // Add technical requirements
    prompt += `

TECHNICAL REQUIREMENTS:
- Clean, modern social media design
- Text-friendly composition (leave space for overlay)
- High contrast and readability
- ${PLATFORM_DIMENSIONS.instagram.width}x${PLATFORM_DIMENSIONS.instagram.height} optimized
- Professional quality, no artifacts`

    return prompt
  }

  /**
   * Generate a quote graphic
   */
  private async generateQuoteGraphic(
    plan: SocialContentPlan['quotes'][0],
    input: SocialPostInput,
    platforms: string[],
    generateImages: boolean
  ): Promise<GeneratedQuote> {
    const quoteId = uuidv4()

    // Build the image prompt for the quote
    const imagePrompt = this.buildQuoteImagePrompt(plan, input)

    // Generate image if requested
    let imageUrl: string | undefined
    if (generateImages) {
      try {
        const generatedUrl = await this.generateImage(
          imagePrompt,
          input.persona,
          '1:1', // Quotes work well as squares
          input.options?.imageQuality || 'high'
        )

        if (generatedUrl) {
          imageUrl = await this.uploadToStorage(generatedUrl, input.projectId, `quote_${quoteId}`)
        }
      } catch (error) {
        console.error('Quote image generation error:', error)
      }
    }

    // Generate platform-specific caption
    const { caption, hashtags } = await this.generateQuoteCaption(plan, input, platforms[0])

    return {
      id: quoteId,
      quote: plan.quote,
      attribution: plan.attribution,
      context: plan.caption, // Context of why this quote matters
      imageUrl,
      imagePrompt,
      caption,
      hashtags,
      platforms,
      status: imageUrl ? 'ready' : 'draft'
    }
  }

  /**
   * Build image prompt for a quote graphic
   */
  private buildQuoteImagePrompt(
    plan: SocialContentPlan['quotes'][0],
    input: SocialPostInput
  ): string {
    let prompt = plan.visualPrompt

    prompt += `

QUOTE GRAPHIC REQUIREMENTS:
- Design a shareable quote graphic
- Quote text should be the focal point: "${plan.quote}"
- Attribution: ${plan.attribution}
- Clean, minimalist design with impact
- High contrast for readability
- Professional typography feel`

    if (input.persona) {
      prompt += `

PERSONA INTEGRATION:
- Feature ${input.persona.name} thoughtfully (not dominating)
- Position persona to support the quote, not overshadow it
- Could be: small headshot, partial silhouette, or subtle presence
- Maintain character consistency with reference images`
    }

    if (input.brand?.colors) {
      prompt += `

BRAND COLORS:
- Primary: ${input.brand.colors.primary || 'professional neutral'}
- Accent: ${input.brand.colors.accent || 'subtle highlight'}`
    }

    prompt += `

TECHNICAL:
- Square format (1080x1080)
- Leave clear space for text overlay
- High resolution, social media ready
- No watermarks or artifacts`

    return prompt
  }

  /**
   * Generate a hook post
   */
  private async generateHook(
    plan: SocialContentPlan['hooks'][0],
    input: SocialPostInput,
    generateImages: boolean
  ): Promise<GeneratedHook> {
    const hookId = uuidv4()

    // Build image prompt
    const imagePrompt = this.buildHookImagePrompt(plan, input)

    // Generate image if requested
    let imageUrl: string | undefined
    if (generateImages) {
      try {
        const dimensions = PLATFORM_DIMENSIONS[plan.platform] || PLATFORM_DIMENSIONS.instagram
        const generatedUrl = await this.generateImage(
          imagePrompt,
          input.persona,
          dimensions.aspectRatio,
          input.options?.imageQuality || 'high'
        )

        if (generatedUrl) {
          imageUrl = await this.uploadToStorage(generatedUrl, input.projectId, `hook_${hookId}`)
        }
      } catch (error) {
        console.error('Hook image generation error:', error)
      }
    }

    return {
      id: hookId,
      text: plan.text,
      imageUrl,
      imagePrompt,
      platform: plan.platform,
      followUp: plan.followUp,
      status: imageUrl ? 'ready' : 'draft'
    }
  }

  /**
   * Build image prompt for a hook post
   */
  private buildHookImagePrompt(
    plan: SocialContentPlan['hooks'][0],
    input: SocialPostInput
  ): string {
    let prompt = plan.visualPrompt

    prompt += `

HOOK POST REQUIREMENTS:
- This image must STOP THE SCROLL
- Create immediate visual interest
- Hook text context: "${plan.text}"
- Design for ${plan.platform} feed appearance`

    if (input.persona) {
      prompt += `

PERSONA:
- Feature ${input.persona.name} prominently
- Engaging, attention-grabbing expression
- Direct eye contact with viewer if appropriate
- Maintain character consistency`
    }

    prompt += `

TECHNICAL:
- Optimized for ${plan.platform}
- High impact, bold composition
- Professional quality
- Social media ready`

    return prompt
  }

  /**
   * Generate an image using GPT-Image 1.5 or Flux
   */
  private async generateImage(
    prompt: string,
    persona?: SocialPostInput['persona'],
    aspectRatio: string = '1:1',
    quality: string = 'high'
  ): Promise<string | undefined> {
    try {
      if (persona?.referenceImageUrls && persona.referenceImageUrls.length > 0) {
        // Use GPT-Image 1.5 Edit with persona references
        const result = await fal.subscribe(this.imageModel, {
          input: {
            prompt,
            image_urls: persona.referenceImageUrls.slice(0, 4),
            image_size: this.mapAspectRatio(aspectRatio),
            quality,
            input_fidelity: 'high',
            num_images: 1,
            output_format: 'png'
          },
          logs: true
        })

        if (result.data?.images?.[0]?.url) {
          return result.data.images[0].url
        }
      } else {
        // Use Flux Pro v1.1 for text-to-image
        // Note: Flux Pro v1.1 does NOT support num_inference_steps or guidance_scale
        const result = await fal.subscribe(this.fluxModel, {
          input: {
            prompt,
            image_size: this.mapAspectRatioFlux(aspectRatio) as 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9',
            num_images: 1,
            output_format: 'png' as 'png' | 'jpeg',
            safety_tolerance: '2'
          },
          logs: true
        })

        if (result.data?.images?.[0]?.url) {
          return result.data.images[0].url
        }
      }

      return undefined
    } catch (error) {
      console.error('Image generation error:', error)
      return undefined
    }
  }

  /**
   * Generate platform-specific caption for carousel
   */
  private async generatePlatformCaption(
    plan: SocialContentPlan['carousels'][0],
    input: SocialPostInput,
    platform: string
  ): Promise<{ caption: string; hashtags: string[] }> {
    const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.instagram

    const systemPrompt = `You are a ${platform} content expert who writes captions that:
1. Complement (not repeat) the carousel content
2. Add context and personality
3. Include a clear CTA
4. Use appropriate hashtags

${input.brand?.voice ? `BRAND VOICE: ${input.brand.voice}` : ''}
CHARACTER LIMIT: ${limits.caption} characters
HASHTAG LIMIT: ${limits.hashtags} hashtags`

    const userPrompt = `Write a ${platform} caption for this carousel:

CAROUSEL TITLE: ${plan.title}
NARRATIVE: ${plan.narrativeArc}
CTA: ${plan.cta}

CONTENT CONTEXT:
${input.analysis.coreMessage.oneSentence}

Audience trigger words: ${input.analysis.audiencePsychology.triggerWords.join(', ')}

Return JSON with: caption (string), hashtags (array of strings without #)`

    try {
      const response = await getOpenAI().responses.create({
        model: this.model,
        input: userPrompt,
        instructions: systemPrompt,
        reasoning: { effort: 'low' },
        text: { format: { type: 'json_object' } },
        max_output_tokens: 500
      })

      const outputText = this.extractOutputText(response)
      const result = JSON.parse(outputText)

      return {
        caption: result.caption || plan.caption,
        hashtags: (result.hashtags || plan.hashtags).slice(0, limits.hashtags)
      }
    } catch (error) {
      console.error('Caption generation error:', error)
      return {
        caption: plan.caption,
        hashtags: plan.hashtags.slice(0, limits.hashtags)
      }
    }
  }

  /**
   * Generate caption for quote graphic
   */
  private async generateQuoteCaption(
    plan: SocialContentPlan['quotes'][0],
    input: SocialPostInput,
    platform: string
  ): Promise<{ caption: string; hashtags: string[] }> {
    const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.instagram

    const systemPrompt = `You are a ${platform} expert writing a caption for a quote graphic.
The caption should:
1. Provide context for why this quote matters
2. Connect it to the audience's life/work
3. Invite engagement (thoughts, shares, saves)

${input.brand?.voice ? `BRAND VOICE: ${input.brand.voice}` : ''}`

    const userPrompt = `Write a caption for this quote graphic:

QUOTE: "${plan.quote}"
ATTRIBUTION: ${plan.attribution}
CONTEXT: ${plan.caption}

Return JSON with: caption, hashtags (array without #)`

    try {
      const response = await getOpenAI().responses.create({
        model: this.model,
        input: userPrompt,
        instructions: systemPrompt,
        reasoning: { effort: 'low' },
        text: { format: { type: 'json_object' } },
        max_output_tokens: 400
      })

      const outputText = this.extractOutputText(response)
      const result = JSON.parse(outputText)

      return {
        caption: result.caption || plan.caption,
        hashtags: (result.hashtags || []).slice(0, limits.hashtags)
      }
    } catch (error) {
      console.error('Quote caption generation error:', error)
      return {
        caption: plan.caption,
        hashtags: []
      }
    }
  }

  // Helper methods

  private extractOutputText(response: any): string {
    if (response.output && Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text' && content.text) {
              return content.text
            }
          }
        }
      }
    }
    if (response.output_text) {
      return response.output_text
    }
    throw new Error('Could not extract output text')
  }

  private mapAspectRatio(aspectRatio: string): string {
    const map: Record<string, string> = {
      '1:1': '1024x1024',
      '4:5': '1024x1536',
      '16:9': '1536x1024',
      '9:16': '1024x1536',
      '1.91:1': '1536x1024'
    }
    return map[aspectRatio] || '1024x1024'
  }

  private mapAspectRatioFlux(aspectRatio: string): string {
    const map: Record<string, string> = {
      '1:1': 'square',
      '4:5': 'portrait_4_3',
      '16:9': 'landscape_16_9',
      '9:16': 'portrait_16_9',
      '1.91:1': 'landscape_16_9'
    }
    return map[aspectRatio] || 'square'
  }

  private async uploadToStorage(
    imageUrl: string,
    projectId: string,
    filename: string
  ): Promise<string | undefined> {
    try {
      const supabase = await getSupabaseAdmin()

      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error('Failed to download')

      const blob = await response.blob()
      const buffer = Buffer.from(await blob.arrayBuffer())

      const filePath = `${projectId}/social/${filename}_${Date.now()}.png`
      const { error } = await supabase.storage
        .from('social-graphics')
        .upload(filePath, buffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (error) {
        console.error('Upload error:', error)
        return imageUrl // Return original URL as fallback
      }

      const { data: { publicUrl } } = supabase.storage
        .from('social-graphics')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Storage upload failed:', error)
      return imageUrl
    }
  }

  private async saveGeneratedContent(
    projectId: string,
    userId: string,
    content: {
      carousels: GeneratedCarousel[]
      quotes: GeneratedQuote[]
      hooks: GeneratedHook[]
    }
  ): Promise<void> {
    try {
      const supabase = await getSupabaseAdmin()

      // Save each content type to post_suggestions table
      const suggestions = []

      for (const carousel of content.carousels) {
        suggestions.push({
          id: carousel.id,
          project_id: projectId,
          user_id: userId,
          content_type: 'carousel',
          title: carousel.title,
          status: carousel.status,
          metadata: {
            narrativeArc: carousel.narrativeArc,
            slides: carousel.slides,
            caption: carousel.caption,
            hashtags: carousel.hashtags,
            cta: carousel.cta,
            platforms: carousel.platforms
          }
        })
      }

      for (const quote of content.quotes) {
        suggestions.push({
          id: quote.id,
          project_id: projectId,
          user_id: userId,
          content_type: 'quote',
          title: quote.quote.substring(0, 50) + '...',
          status: quote.status,
          metadata: {
            quote: quote.quote,
            attribution: quote.attribution,
            context: quote.context,
            imageUrl: quote.imageUrl,
            caption: quote.caption,
            hashtags: quote.hashtags,
            platforms: quote.platforms
          }
        })
      }

      for (const hook of content.hooks) {
        suggestions.push({
          id: hook.id,
          project_id: projectId,
          user_id: userId,
          content_type: 'single',
          title: hook.text.substring(0, 50) + '...',
          status: hook.status,
          metadata: {
            text: hook.text,
            imageUrl: hook.imageUrl,
            platform: hook.platform,
            followUp: hook.followUp
          }
        })
      }

      if (suggestions.length > 0) {
        await supabase.from('post_suggestions').upsert(suggestions)
      }
    } catch (error) {
      console.error('Failed to save generated content:', error)
    }
  }
}

// Factory function
export function createIntelligentSocialService(): IntelligentSocialService {
  return new IntelligentSocialService()
}

export default IntelligentSocialService
