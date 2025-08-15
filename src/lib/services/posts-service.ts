import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { AIImageService } from '@/lib/ai-image-service'

export type PostContentType = 'carousel' | 'quote' | 'single' | 'thread' | 'reel' | 'story'
export type Platform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok'

interface PostSuggestion {
  id: string
  project_id: string
  content_type: PostContentType
  title: string
  description?: string
  images: any[]
  copy_variants: Record<Platform, any>
  eligible_platforms: Platform[]
  platform_requirements: Record<string, any>
  persona_id?: string
  persona_used: boolean
  status: string
  created_at: string
}

interface GeneratePostsParams {
  projectId: string
  contentAnalysis: any
  transcript?: string
  projectTitle: string
  personaId?: string
  contentTypes?: PostContentType[]
  platforms?: Platform[]
}

interface PlatformCopy {
  caption: string
  hashtags: string[]
  cta?: string
  title?: string // For YouTube/LinkedIn
  description?: string // For YouTube/LinkedIn
}

export class PostsService {
  /**
   * Generate post suggestions for a project
   */
  static async generatePostSuggestions(params: GeneratePostsParams) {
    const {
      projectId,
      contentAnalysis,
      transcript,
      projectTitle,
      personaId,
      contentTypes = ['carousel', 'quote', 'single', 'thread', 'reel', 'story'],
      platforms = ['instagram', 'twitter', 'linkedin', 'facebook', 'youtube', 'tiktok']
    } = params

    const supabase = await createSupabaseServerClient()
    const adminSupabase = createSupabaseAdminClient()
    
    // Get user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Create generation job
    const { data: job, error: jobError } = await adminSupabase
      .from('post_generation_jobs')
      .insert({
        project_id: projectId,
        user_id: user.id,
        job_type: 'batch_suggestions',
        status: 'running',
        input_params: params,
        total_items: contentTypes.length
      })
      .select()
      .single()

    if (jobError) throw jobError

    const suggestions = []

    try {
      for (const contentType of contentTypes) {
        const suggestion = await this.generateSingleSuggestion({
          projectId,
          contentAnalysis,
          transcript,
          projectTitle,
          contentType,
          platforms,
          personaId,
          userId: user.id
        })
        
        suggestions.push(suggestion)

        // Update job progress
        await adminSupabase
          .from('post_generation_jobs')
          .update({
            completed_items: suggestions.length
          })
          .eq('id', job.id)
      }

      // Mark job as completed
      await adminSupabase
        .from('post_generation_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output_data: { suggestion_ids: suggestions.map(s => s.id) }
        })
        .eq('id', job.id)

      return { suggestions, jobId: job.id }
    } catch (error) {
      // Mark job as failed
      await adminSupabase
        .from('post_generation_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', job.id)

      throw error
    }
  }

  /**
   * Generate a single post suggestion
   */
  private static async generateSingleSuggestion(params: {
    projectId: string
    contentAnalysis: any
    transcript?: string
    projectTitle: string
    contentType: PostContentType
    platforms: Platform[]
    personaId?: string
    userId: string
    settings?: any
  }) {
    const {
      projectId,
      contentAnalysis,
      transcript,
      projectTitle,
      contentType,
      platforms,
      personaId,
      userId,
      settings = {}
    } = params

    const adminSupabase = createSupabaseAdminClient()

    // Generate content idea based on type
    const contentIdea = await this.generateContentIdea({
      contentType,
      contentAnalysis,
      projectTitle,
      transcript,
      creativity: settings.creativity || 0.7
    })

    // Calculate engagement prediction based on content analysis
    const engagementPrediction = this.calculateEngagementPrediction({
      contentAnalysis,
      contentType,
      platforms
    })

    // Create suggestion record
    const { data: suggestion, error: suggestionError } = await adminSupabase
      .from('post_suggestions')
      .insert({
        project_id: projectId,
        user_id: userId,
        content_type: contentType,
        title: contentIdea.title,
        description: contentIdea.description,
        persona_id: personaId,
        persona_used: !!personaId,
        status: 'generating',
        generation_prompt: contentIdea.prompt,
        generation_model: 'gpt-4-turbo',
        generation_params: settings
      })
      .select()
      .single()

    if (suggestionError) throw suggestionError

    try {
      // Generate images
      const images = await this.generatePostImages({
        suggestionId: suggestion.id,
        contentType,
        contentIdea,
        personaId,
        userId
      })

      // Generate platform-specific copy
      const copyVariants = await this.generatePlatformCopy({
        suggestionId: suggestion.id,
        contentIdea,
        platforms,
        contentType
      })

      // Determine eligible platforms
      const eligiblePlatforms = this.determineEligibility({
        contentType,
        imageCount: images.length,
        copyVariants
      })

      // Update suggestion with generated content
      const { error: updateError } = await adminSupabase
        .from('post_suggestions')
        .update({
          images,
          copy_variants: copyVariants,
          eligible_platforms: eligiblePlatforms,
          platform_requirements: this.getPlatformRequirements(),
          engagement_prediction: engagementPrediction,
          rating: Math.round(4 + Math.random()), // Generate initial rating 4-5
          status: 'ready'
        })
        .eq('id', suggestion.id)

      if (updateError) throw updateError

      return {
        ...suggestion,
        images,
        copy_variants: copyVariants,
        eligible_platforms: eligiblePlatforms
      }
    } catch (error) {
      // Mark suggestion as failed
      await adminSupabase
        .from('post_suggestions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', suggestion.id)

      throw error
    }
  }

  /**
   * Calculate engagement prediction
   */
  private static calculateEngagementPrediction(params: {
    contentAnalysis: any
    contentType: PostContentType
    platforms: Platform[]
  }): number {
    const { contentAnalysis, contentType, platforms } = params
    
    let score = 0.5 // Base score
    
    // Boost for viral content indicators
    if (contentAnalysis?.sentiment === 'positive') score += 0.1
    if (contentAnalysis?.keywords?.length > 5) score += 0.05
    if (contentAnalysis?.topics?.length > 3) score += 0.05
    
    // Content type bonuses
    if (contentType === 'carousel') score += 0.15 // Carousels perform well
    if (contentType === 'quote') score += 0.1 // Quotes are shareable
    
    // Platform optimization
    if (platforms.includes('instagram') && contentType === 'carousel') score += 0.1
    if (platforms.includes('twitter') && contentType === 'thread') score += 0.1
    if (platforms.includes('linkedin') && contentType === 'single') score += 0.05
    
    // Cap at 0.95
    return Math.min(score, 0.95)
  }

  /**
   * Generate content idea based on type
   */
  private static async generateContentIdea(params: {
    contentType: PostContentType
    contentAnalysis: any
    projectTitle: string
    transcript?: string
    creativity?: number
  }) {
    const { contentType, contentAnalysis, projectTitle, transcript, creativity = 0.7 } = params
    const openai = getOpenAI()

    const contentTypeDescriptions = {
      carousel: 'Multi-slide educational or storytelling post (3-8 slides)',
      quote: 'Powerful quote with speaker attribution and visual design',
      single: 'Single impactful image with hook or key message',
      thread: 'Text-based thread with 1-3 supporting visuals'
    }

    const systemPrompt = `You are a viral social media content strategist. Create compelling ${contentType} content ideas that maximize engagement.`

    const userPrompt = `Create a ${contentTypeDescriptions[contentType]} for the video "${projectTitle}".

Content Analysis:
- Topics: ${contentAnalysis.topics?.join(', ') || 'N/A'}
- Keywords: ${contentAnalysis.keywords?.join(', ') || 'N/A'}
- Key Points: ${contentAnalysis.keyPoints?.join('; ') || 'N/A'}
- Mood: ${contentAnalysis.mood || 'professional'}

${transcript ? `Transcript excerpt: ${transcript.substring(0, 500)}...` : ''}

Return a JSON object with:
{
  "title": "Catchy title for the post",
  "description": "Brief description of the content",
  "visual_elements": ["element1", "element2", ...],
  "key_message": "Core message to convey",
  "hook": "Attention-grabbing opening",
  "prompt": "Detailed prompt for image generation"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: creativity,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('Failed to generate content idea')

    return JSON.parse(response)
  }

  /**
   * Generate images for the post
   */
  private static async generatePostImages(params: {
    suggestionId: string
    contentType: PostContentType
    contentIdea: any
    personaId?: string
    userId: string
  }) {
    const { suggestionId, contentType, contentIdea, personaId, userId } = params
    const adminSupabase = createSupabaseAdminClient()

    // Determine number of images based on content type
    const imageCount = contentType === 'carousel' ? 5 : 
                      contentType === 'thread' ? 2 : 1

    // Platform-specific dimensions
    const dimensions = {
      instagram: '1080x1350', // Portrait
      twitter: '1920x1080',   // Landscape
      linkedin: '1200x628',   // OG image
      facebook: '1080x1080'   // Square
    }

    const images = []

    for (let i = 0; i < imageCount; i++) {
      // Generate prompt for this specific image
      const imagePrompt = this.buildImagePrompt({
        contentIdea,
        contentType,
        slideNumber: i + 1,
        totalSlides: imageCount,
        personaId
      })

      try {
        // Generate image using Flux via FAL
        const imageUrl = await AIImageService.generateWithFlux({
          prompt: imagePrompt,
          model: 'flux-pro-1.1',
          aspectRatio: contentType === 'carousel' ? '4:5' : '16:9',
          personaId
        })

        // Store image metadata
        const { data: imageRecord, error } = await adminSupabase
          .from('post_images')
          .insert({
            suggestion_id: suggestionId,
            user_id: userId,
            url: imageUrl,
            platform: 'instagram', // Default, will generate per-platform later
            dimensions: dimensions.instagram,
            prompt: imagePrompt,
            model: 'flux-pro-1.1',
            persona_id: personaId,
            position: i,
            status: 'generated'
          })
          .select()
          .single()

        if (error) throw error
        images.push(imageRecord)
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}:`, error)
        // Continue with other images
      }
    }

    return images
  }

  /**
   * Build image generation prompt
   */
  private static buildImagePrompt(params: {
    contentIdea: any
    contentType: PostContentType
    slideNumber: number
    totalSlides: number
    personaId?: string
  }): string {
    const { contentIdea, contentType, slideNumber, totalSlides, personaId } = params

    let basePrompt = contentIdea.prompt || ''

    // Add slide-specific context for carousels
    if (contentType === 'carousel') {
      basePrompt += ` Slide ${slideNumber} of ${totalSlides}.`
      
      if (slideNumber === 1) {
        basePrompt += ' Hook slide with compelling visual and minimal text.'
      } else if (slideNumber === totalSlides) {
        basePrompt += ' Call-to-action slide with clear next steps.'
      } else {
        basePrompt += ` Content point ${slideNumber - 1}.`
      }
    }

    // Add quote-specific styling
    if (contentType === 'quote') {
      basePrompt += ' Large, readable quote text with speaker attribution. Professional, shareable design.'
    }

    // Add persona if specified
    if (personaId) {
      basePrompt += ' Feature the speaker prominently with professional lighting and composition.'
    }

    // Add quality modifiers
    basePrompt += ' High quality, professional, social media ready, vibrant colors, sharp details.'

    return basePrompt
  }

  /**
   * Generate platform-specific copy
   */
  private static async generatePlatformCopy(params: {
    suggestionId: string
    contentIdea: any
    platforms: Platform[]
    contentType: PostContentType
  }) {
    const { suggestionId, contentIdea, platforms, contentType } = params
    const openai = getOpenAI()
    const adminSupabase = createSupabaseAdminClient()

    const platformLimits = {
      instagram: { caption: 2200, hashtags: 30 },
      twitter: { caption: 280, hashtags: 5 },
      linkedin: { caption: 3000, hashtags: 5 },
      facebook: { caption: 2200, hashtags: 30 },
      youtube: { title: 100, description: 5000 },
      tiktok: { caption: 2200, hashtags: 100 }
    }

    const copyVariants: Record<string, PlatformCopy> = {}

    for (const platform of platforms) {
      const systemPrompt = `You are a ${platform} content expert. Create engaging, platform-optimized copy.`

      const userPrompt = `Create ${platform} copy for this ${contentType} post:
Title: ${contentIdea.title}
Description: ${contentIdea.description}
Key Message: ${contentIdea.key_message}
Hook: ${contentIdea.hook}

Platform limits:
- Caption: ${platformLimits[platform].caption} characters
- Hashtags: ${platformLimits[platform].hashtags} max

Return JSON:
{
  "caption": "Engaging caption within character limit",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "cta": "Call to action",
  ${platform === 'youtube' || platform === 'linkedin' ? '"title": "Post title",' : ''}
  ${platform === 'youtube' || platform === 'linkedin' ? '"description": "Detailed description"' : ''}
}`

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        })

        const response = completion.choices[0].message.content
        if (response) {
          const copy = JSON.parse(response) as PlatformCopy
          copyVariants[platform] = copy

          // Store in database
          await adminSupabase
            .from('post_copy')
            .insert({
              suggestion_id: suggestionId,
              platform,
              caption: copy.caption,
              hashtags: copy.hashtags,
              cta: copy.cta,
              title: copy.title,
              description: copy.description,
              total_length: copy.caption.length + copy.hashtags.join(' ').length
            })
        }
      } catch (error) {
        console.error(`Failed to generate ${platform} copy:`, error)
      }
    }

    return copyVariants
  }

  /**
   * Determine platform eligibility
   */
  private static determineEligibility(params: {
    contentType: PostContentType
    imageCount: number
    copyVariants: Record<string, PlatformCopy>
  }): Platform[] {
    const { contentType, imageCount, copyVariants } = params
    const eligible: Platform[] = []

    // Instagram
    if (copyVariants.instagram && 
        copyVariants.instagram.caption.length <= 2200 &&
        (contentType !== 'carousel' || imageCount <= 10)) {
      eligible.push('instagram')
    }

    // Twitter/X
    if (copyVariants.twitter && 
        copyVariants.twitter.caption.length <= 280 &&
        imageCount <= 4) {
      eligible.push('twitter')
    }

    // LinkedIn
    if (copyVariants.linkedin && 
        copyVariants.linkedin.caption.length <= 3000 &&
        imageCount <= 9) {
      eligible.push('linkedin')
    }

    // Facebook
    if (copyVariants.facebook && 
        copyVariants.facebook.caption.length <= 2200 &&
        (contentType !== 'carousel' || imageCount <= 10)) {
      eligible.push('facebook')
    }

    // YouTube (only for single images as thumbnails)
    if (contentType === 'single' && copyVariants.youtube) {
      eligible.push('youtube')
    }

    // TikTok (images need conversion to video)
    // Not directly eligible for static images

    return eligible
  }

  /**
   * Get platform requirements
   */
  private static getPlatformRequirements() {
    return {
      instagram: {
        max_caption_length: 2200,
        max_hashtags: 30,
        max_images: 10,
        image_sizes: ['1080x1350', '1080x1080'],
        video_max_duration: 60
      },
      twitter: {
        max_caption_length: 280,
        max_hashtags: 5,
        max_images: 4,
        image_sizes: ['1920x1080', '1200x675'],
        video_max_duration: 140
      },
      linkedin: {
        max_caption_length: 3000,
        max_hashtags: 5,
        max_images: 9,
        image_sizes: ['1200x628', '1080x1080'],
        video_max_duration: 600
      },
      facebook: {
        max_caption_length: 2200,
        max_hashtags: 30,
        max_images: 10,
        image_sizes: ['1200x630', '1080x1080'],
        video_max_duration: 240
      },
      youtube: {
        max_title_length: 100,
        max_description_length: 5000,
        max_tags: 500,
        thumbnail_size: '1280x720',
        shorts_max_duration: 60
      },
      tiktok: {
        max_caption_length: 2200,
        max_hashtags: 100,
        video_only: true,
        max_duration: 180,
        min_duration: 3
      }
    }
  }

  /**
   * Regenerate a post suggestion
   */
  static async regenerateSuggestion(suggestionId: string, feedback?: string) {
    const supabase = await createSupabaseServerClient()
    const adminSupabase = createSupabaseAdminClient()

    // Get existing suggestion
    const { data: suggestion, error } = await supabase
      .from('post_suggestions')
      .select('*, post_images(*), post_copy(*)')
      .eq('id', suggestionId)
      .single()

    if (error || !suggestion) throw new Error('Suggestion not found')

    // Update with feedback if provided
    if (feedback) {
      await adminSupabase
        .from('post_suggestions')
        .update({ feedback })
        .eq('id', suggestionId)
    }

    // Regenerate content
    // Implementation would follow similar pattern to generateSingleSuggestion
    // but incorporate the feedback into prompts

    return suggestion
  }

  /**
   * Quick edit post copy
   */
  static async updatePostCopy(
    suggestionId: string, 
    platform: Platform, 
    updates: Partial<PlatformCopy>
  ) {
    const adminSupabase = createSupabaseAdminClient()

    const { error } = await adminSupabase
      .from('post_copy')
      .update({
        edited_caption: updates.caption,
        edited_hashtags: updates.hashtags,
        edited_cta: updates.cta,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('suggestion_id', suggestionId)
      .eq('platform', platform)

    if (error) throw error

    return { success: true }
  }

  /**
   * Approve suggestion and move to staging
   */
  static async approveSuggestion(suggestionId: string) {
    const adminSupabase = createSupabaseAdminClient()

    const { error } = await adminSupabase
      .from('post_suggestions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (error) throw error

    // TODO: Add to staging area
    
    return { success: true }
  }
}