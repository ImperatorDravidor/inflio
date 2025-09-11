import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { AIImageService } from '@/lib/ai-image-service'
import { MockPostsGenerator } from './posts-service-mock'

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
  settings?: any
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
      contentTypes = ['carousel', 'quote', 'single', 'thread'],
      platforms = ['instagram', 'twitter', 'linkedin', 'facebook'],
      settings = {}
    } = params

    console.log('[PostsService] Starting generation with params:', {
      projectId,
      contentTypes,
      platforms,
      hasContentAnalysis: !!contentAnalysis,
      personaId
    })

    const supabase = await createSupabaseServerClient()
    const adminSupabase = supabaseAdmin
    
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
          userId: user.id,
          settings
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

    const adminSupabase = supabaseAdmin

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
        generation_model: 'gpt-5',
        generation_params: settings
      })
      .select()
      .single()

    if (suggestionError) throw suggestionError

    try {
      // Defer image generation until user selects a post.
      const images: any[] = []

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
    additionalContext?: string
  }) {
    const { contentType, contentAnalysis, projectTitle, transcript, creativity = 0.7, additionalContext = '' } = params
    const openai = getOpenAI()

    const contentTypeDescriptions: Record<PostContentType, string> = {
      carousel: 'Multi-slide educational or storytelling post (3-8 slides)',
      quote: 'Powerful quote with speaker attribution and visual design',
      single: 'Single impactful image with hook or key message',
      thread: 'Text-based thread with 1-3 supporting visuals',
      reel: 'Short-form video concept with hook and CTA',
      story: 'Ephemeral story content for maximum urgency'
    }

    const systemPrompt = `You are a viral social media content strategist. Create compelling ${contentType} content ideas that maximize engagement.${additionalContext ? '\n\n' + additionalContext : ''}`

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
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      // GPT-5 only supports default temperature (1.0)
      max_completion_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0].message.content
    if (!response) {
      console.warn('[PostsService] No response from AI, using mock data')
      return MockPostsGenerator.generateMockContentIdea({ contentType, projectTitle })
    }
    
    try {
      return JSON.parse(response)
    } catch (parseError) {
      console.error('[PostsService] Failed to parse AI response:', parseError)
      return MockPostsGenerator.generateMockContentIdea({ contentType, projectTitle })
    }
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
    const adminSupabase = supabaseAdmin

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
        let imageUrl
        try {
          // Try to generate image using Flux via FAL
          imageUrl = await AIImageService.generateWithFlux({
            prompt: imagePrompt,
            model: 'flux-pro-1.1',
            aspectRatio: contentType === 'carousel' ? '4:5' : '16:9',
            personaId
          })
        } catch (aiError) {
          console.warn(`[PostsService] AI image generation failed for image ${i + 1}, using mock image:`, aiError)
          // Use mock image if AI service fails
          const mockImages = MockPostsGenerator.generateMockImages(1, contentType)
          imageUrl = mockImages[0].url
        }

        // Store image metadata in memory for now
        // TODO: Store in post_suggestions table as JSON column or create post_images table
        const imageRecord = {
          suggestion_id: suggestionId,
          user_id: userId,
          url: imageUrl,
          platform: 'instagram',
          dimensions: dimensions.instagram,
          prompt: imagePrompt,
          model: 'flux-pro-1.1',
          persona_id: personaId,
          position: i,
          status: 'generated'
        }
        
        images.push(imageRecord)
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error)
        // Add a mock image as fallback
        const mockImages = MockPostsGenerator.generateMockImages(1, contentType)
        images.push({
          suggestion_id: suggestionId,
          user_id: userId,
          url: mockImages[0].url,
          platform: 'instagram',
          dimensions: dimensions.instagram,
          prompt: 'Mock image',
          model: 'mock',
          persona_id: personaId,
          position: i,
          status: 'generated'
        })
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
    additionalContext?: string
  }) {
    const { suggestionId, contentIdea, platforms, contentType, additionalContext = '' } = params
    const adminSupabase = supabaseAdmin
    const openai = getOpenAI()

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
      const systemPrompt = `You are a ${platform} content expert. Create engaging, platform-optimized copy.${additionalContext ? '\n\n' + additionalContext : ''}`

      const userPrompt = `Create ${platform} copy for this ${contentType} post:
Title: ${contentIdea.title}
Description: ${contentIdea.description}
Key Message: ${contentIdea.key_message}
Hook: ${contentIdea.hook}

Platform limits:
- ${platform === 'youtube' ? 'Title' : 'Caption'}: ${platform === 'youtube' ? (platformLimits[platform] as any).title : (platformLimits[platform] as any).caption} characters
- ${platform === 'youtube' ? 'Description' : 'Hashtags'}: ${platform === 'youtube' ? (platformLimits[platform] as any).description + ' characters' : (platformLimits[platform] as any).hashtags + ' max'}

Return JSON:
{
  "caption": "Engaging caption within character limit",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "cta": "Call to action",
  ${platform === 'youtube' || platform === 'linkedin' ? '"title": "Post title",' : ''}
  ${platform === 'youtube' || platform === 'linkedin' ? '"description": "Detailed description"' : ''}
}`

      let copy: PlatformCopy;
      
      try {
        // Generate copy using AI or mock
        const completion = await openai.chat.completions.create({
          model: 'gpt-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 1000,
          temperature: 1.0,
          response_format: { type: 'json_object' }
        });

        const response = completion.choices[0].message.content;
        if (response) {
          copy = JSON.parse(response) as PlatformCopy;
        } else {
          // Fallback to mock if no response
          copy = MockPostsGenerator.generateMockPlatformCopy({ contentIdea, platform, contentType });
        }
        
        copyVariants[platform] = copy;

        // Store in database
        await adminSupabase
          .from('post_copy')
          .insert({
            suggestion_id: suggestionId,
            platform,
            caption: copy.caption,
            hashtags: copy.hashtags || [],
            cta: (copy as any).cta || '',
            title: (copy as any).title || null,
            description: (copy as any).description || null,
            total_length: copy.caption.length + (copy.hashtags?.join(' ').length || 0)
          })
      } catch (error) {
        console.error(`Failed to generate ${platform} copy:`, error)
        // Use mock data as fallback
        const mockCopy = MockPostsGenerator.generateMockPlatformCopy({ contentIdea, platform, contentType });
        copyVariants[platform] = mockCopy
        
        // Still try to store in database
        try {
          await adminSupabase
            .from('post_copy')
            .insert({
              suggestion_id: suggestionId,
              platform,
              caption: mockCopy.caption,
              hashtags: mockCopy.hashtags || [],
              cta: (mockCopy as any).cta || '',
              title: (mockCopy as any).title || null,
              description: (mockCopy as any).description || null,
              total_length: mockCopy.caption.length + (mockCopy.hashtags?.join(' ').length || 0)
            })
        } catch (dbError) {
          console.error(`Failed to store ${platform} copy in database:`, dbError)
        }
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
    const adminSupabase = supabaseAdmin

    // Get existing suggestion with project info
    const { data: suggestion, error } = await adminSupabase
      .from('post_suggestions')
      .select(`
        *,
        projects:project_id (
          id,
          title,
          content_analysis,
          transcription
        )
      `)
      .eq('id', suggestionId)
      .single()

    if (error || !suggestion) throw new Error('Suggestion not found')

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Update status to regenerating
    await adminSupabase
      .from('post_suggestions')
      .update({ 
        status: 'generating',
        feedback: feedback || suggestion.feedback
      })
      .eq('id', suggestionId)

    try {
      // Prepare regeneration with feedback incorporated
      const enhancedPrompt = feedback 
        ? `Previous attempt feedback: "${feedback}". Please address this feedback in the regeneration.`
        : ''

      // Get project details
      const project = suggestion.projects
      const contentAnalysis = project?.content_analysis || {}
      const transcript = project?.transcription?.text

      // Generate new content idea with feedback
      const contentIdea = await this.generateContentIdea({
        contentType: suggestion.content_type,
        contentAnalysis,
        projectTitle: project?.title || 'Untitled',
        transcript,
        creativity: suggestion.generation_params?.creativity || 0.8, // Slightly higher for variation
        additionalContext: enhancedPrompt
      })

      // Regenerate images with new prompts
      const images = await this.generatePostImages({
        suggestionId,
        contentType: suggestion.content_type,
        contentIdea,
        personaId: suggestion.persona_id,
        userId: user.id
      })

      // Regenerate platform copy with feedback
      const copyVariants = await this.generatePlatformCopy({
        suggestionId,
        contentIdea,
        platforms: suggestion.eligible_platforms || ['instagram', 'twitter', 'linkedin'],
        contentType: suggestion.content_type,
        additionalContext: enhancedPrompt
      })

      // Update suggestion with regenerated content
      const { error: updateError } = await adminSupabase
        .from('post_suggestions')
        .update({
          title: contentIdea.title,
          description: contentIdea.description,
          images,
          copy_variants: copyVariants,
          status: 'ready',
          generation_params: {
            ...suggestion.generation_params,
            regenerated: true,
            regeneration_count: (suggestion.generation_params?.regeneration_count || 0) + 1
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)

      if (updateError) throw updateError

      // Return updated suggestion
      const { data: updatedSuggestion } = await adminSupabase
        .from('post_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single()

      return updatedSuggestion
    } catch (error) {
      // Mark as failed
      await adminSupabase
        .from('post_suggestions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Regeneration failed'
        })
        .eq('id', suggestionId)

      throw error
    }
  }

  /**
   * Quick edit post copy
   */
  static async updatePostCopy(
    suggestionId: string, 
    platform: Platform, 
    updates: Partial<PlatformCopy>
  ) {
    const adminSupabase = supabaseAdmin

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
    const adminSupabase = supabaseAdmin
    const supabase = await createSupabaseServerClient()

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the suggestion with all details
    const { data: suggestion, error: fetchError } = await adminSupabase
      .from('post_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single()

    if (fetchError || !suggestion) throw new Error('Suggestion not found')

    // Update suggestion status
    const { error: updateError } = await adminSupabase
      .from('post_suggestions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (updateError) throw updateError

    // Create staging session for this post
    try {
      // Import staging sessions service dynamically to avoid circular dependencies
      const { StagingSessionsService } = await import('@/lib/staging/staging-sessions-service')
      
      // Prepare content for staging
      const stagedContent = {
        id: suggestionId,
        type: suggestion.content_type as 'carousel' | 'quote' | 'single' | 'thread',
        title: suggestion.title,
        description: suggestion.description,
        images: suggestion.images || [],
        platforms: suggestion.eligible_platforms || [],
        platformContent: {} as any,
        metadata: {
          personaUsed: suggestion.persona_used,
          personaId: suggestion.persona_id,
          engagementPrediction: suggestion.engagement_prediction,
          generationModel: suggestion.generation_model
        }
      }

      // Add platform-specific content
      for (const platform of suggestion.eligible_platforms || []) {
        const copyData = suggestion.copy_variants?.[platform]
        if (copyData) {
          stagedContent.platformContent[platform] = {
            caption: copyData.caption,
            hashtags: copyData.hashtags || [],
            cta: copyData.cta,
            title: copyData.title,
            description: copyData.description
          }
        }
      }

      // Create or update staging session
      const result = await StagingSessionsService.saveStagingSession(
        user.id,
        suggestion.project_id,
        {
          ids: [suggestionId],
          items: [stagedContent]
        }
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to save staging session')
      }

      return { 
        success: true, 
        message: 'Post approved and moved to staging'
      }
    } catch (stagingError) {
      console.error('Failed to create staging session:', stagingError)
      // Still return success since approval worked
      return { 
        success: true,
        warning: 'Post approved but staging failed'
      }
    }
  }
}