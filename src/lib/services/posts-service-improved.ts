/**
 * @deprecated — Use AdvancedPostsService from '@/lib/ai-posts-advanced' instead.
 *
 * This service is superseded by AdvancedPostsService which uses GPT-5.2 via
 * the Responses API with full brand identity and persona context.
 * Kept temporarily for backward compatibility with any remaining callers.
 *
 * Previous: Improved Posts Service
 * - Generates content-aware, intuitive social post suggestions
 * - Tied to actual transcript content
 * - Uses brand voice and settings
 * - Generates images with Nano Banana Pro + persona
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai'

// Lazy load supabaseAdmin to prevent client-side initialization
const getSupabaseAdmin = async () => {
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  return supabaseAdmin
}
import { createNanoBananaService } from './nano-banana-service'
import { PersonaServiceV2 } from './persona-service-v2'

export type PostContentType = 'carousel' | 'quote' | 'single' | 'thread' | 'reel' | 'story'
export type Platform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok'

interface GeneratePostsParams {
  projectId: string
  contentAnalysis: any
  transcript: string // REQUIRED - full transcript text
  projectTitle: string
  personaId?: string
  contentTypes?: PostContentType[]
  platforms?: Platform[]
  settings?: any
}

interface UserProfile {
  id: string
  clerk_user_id: string
  company_name?: string
  // Legacy fields (kept for compatibility)
  brand_voice?: string
  brand_colors?: {
    primary: string
    secondary: string
    accent: string
  }
  brand_fonts?: {
    heading: string
    body: string
  }
  target_audience?: {
    description: string
    age_groups?: string[]
    interests?: string[]
  }
  content_goals?: string[]
  primary_platforms?: string[]
  // New brand_identity structure from onboarding
  brand_identity?: {
    colors?: {
      primary?: { hex?: string[] }
      secondary?: { hex?: string[] }
      accent?: { hex?: string[] }
    }
    voice?: {
      tone?: string[]
      personality?: string[]
    }
    targetAudience?: {
      demographics?: { age?: string; location?: string; interests?: string[] }
      psychographics?: string[]
      needs?: string[]
    }
    brandStrategy?: {
      mission?: string
      values?: string[]
    }
  }
  brand_analysis?: any // Fallback for older data
}

// Helper to extract brand settings from profile
function extractBrandSettings(profile?: UserProfile) {
  if (!profile) return { voice: '', audience: '', goals: '', platforms: '' }

  const brand = profile.brand_identity || profile.brand_analysis

  // Extract voice
  let voice = profile.brand_voice || ''
  if (!voice && brand?.voice?.tone) {
    voice = Array.isArray(brand.voice.tone) ? brand.voice.tone.join(', ') : brand.voice.tone
  }

  // Extract target audience
  let audience = profile.target_audience?.description || ''
  if (!audience && brand?.targetAudience) {
    const parts: string[] = []
    if (brand.targetAudience.demographics?.age) {
      parts.push(`Age: ${brand.targetAudience.demographics.age}`)
    }
    if (brand.targetAudience.psychographics?.length) {
      parts.push(brand.targetAudience.psychographics.slice(0, 3).join(', '))
    }
    audience = parts.join(' | ')
  }

  // Extract goals
  const goals = profile.content_goals?.join(', ') || brand?.brandStrategy?.mission || ''

  // Extract platforms
  const platforms = profile.primary_platforms?.join(', ') || ''

  return { voice, audience, goals, platforms }
}

export class ImprovedPostsService {
  /**
   * Generate post suggestions with full context
   */
  static async generatePostSuggestions(params: GeneratePostsParams) {
    const {
      projectId,
      contentAnalysis,
      transcript,
      projectTitle,
      personaId,
      contentTypes = ['carousel', 'quote', 'single'],
      platforms = ['instagram', 'twitter', 'linkedin'],
      settings = {}
    } = params

    if (!transcript) {
      throw new Error('Transcript is required for generating quality post suggestions')
    }

    console.log('[ImprovedPostsService] Starting generation with:', {
      projectId,
      contentTypes,
      platforms,
      transcriptLength: transcript.length,
      personaId
    })

    const supabase = await createSupabaseServerClient()
    const adminSupabase = await getSupabaseAdmin()

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get user profile for brand settings
    const { data: userProfile } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', user.id)
      .single()

    // Get persona reference images if available
    let personaReferenceImages: string[] = []
    if (personaId) {
      personaReferenceImages = await PersonaServiceV2.getPersonaReferenceImages(personaId)
    }

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
          personaReferenceImages,
          userId: user.id,
          userProfile,
          settings
        })

        suggestions.push(suggestion)

        // Update job progress
        await adminSupabase
          .from('post_generation_jobs')
          .update({ completed_items: suggestions.length })
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
   * Generate a single post suggestion with deep content analysis
   */
  private static async generateSingleSuggestion(params: {
    projectId: string
    contentAnalysis: any
    transcript: string
    projectTitle: string
    contentType: PostContentType
    platforms: Platform[]
    personaId?: string
    personaReferenceImages: string[]
    userId: string
    userProfile?: UserProfile
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
      personaReferenceImages,
      userId,
      userProfile,
      settings = {}
    } = params

    const adminSupabase = await getSupabaseAdmin()

    // Extract key moments from transcript
    const keyMoments = this.extractKeyMoments(transcript, contentAnalysis)

    // Generate content idea with full context
    const contentIdea = await this.generateContentIdea({
      contentType,
      contentAnalysis,
      projectTitle,
      transcript,
      keyMoments,
      userProfile,
      creativity: settings.creativity || 0.7
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
      // Generate images immediately with Nano Banana Pro + persona
      const images = await this.generatePostImages({
        suggestionId: suggestion.id,
        contentType,
        contentIdea,
        personaId,
        personaReferenceImages,
        userId,
        userProfile
      })

      // Generate platform-specific copy
      const copyVariants = await this.generatePlatformCopy({
        suggestionId: suggestion.id,
        contentIdea,
        platforms,
        contentType,
        userProfile
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
          rating: Math.round(4 + Math.random()), // Initial rating 4-5
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
   * Extract the most impactful moments from transcript
   * Returns actual quotes and context, not just metadata
   */
  private static extractKeyMoments(
    transcript: string,
    contentAnalysis: any
  ): string {
    // Get key moments from content analysis
    const keyMoments = contentAnalysis?.keyMoments || []

    if (keyMoments.length === 0) {
      // Fallback: Return first meaningful chunk (first 1500 chars)
      return transcript.substring(0, 1500) + '...'
    }

    // Extract segments around key moments with actual quotes
    const segments = keyMoments.slice(0, 5).map((moment: any, index: number) => {
      const timestamp = moment.timestamp || 0
      const description = moment.description || 'Key moment'

      // Try to find corresponding text in transcript
      // This is a simple approach - in production, you'd want timestamp-based extraction
      const segmentStart = Math.max(0, index * Math.floor(transcript.length / 5))
      const segmentEnd = Math.min(transcript.length, segmentStart + 300)
      const quote = transcript.substring(segmentStart, segmentEnd)

      return `[${Math.floor(timestamp / 60)}:${String(Math.floor(timestamp % 60)).padStart(2, '0')}] ${description}\n"${quote}..."`
    })

    return segments.join('\n\n')
  }

  /**
   * Generate content idea with deep context
   * Uses actual transcript content, not just metadata
   */
  private static async generateContentIdea(params: {
    contentType: PostContentType
    contentAnalysis: any
    projectTitle: string
    transcript: string
    keyMoments: string
    userProfile?: UserProfile
    creativity?: number
  }) {
    const {
      contentType,
      contentAnalysis,
      projectTitle,
      transcript,
      keyMoments,
      userProfile,
      creativity = 0.7
    } = params

    const openai = getOpenAI()

    // Extract brand settings from the profile (supports both old and new structures)
    const brandSettings = extractBrandSettings(userProfile)

    const contentTypeDescriptions: Record<PostContentType, string> = {
      carousel: '5-slide educational carousel (hook → 3 content slides → CTA)',
      quote: 'Powerful quote with context and visual design',
      single: 'Single impactful image with compelling caption',
      thread: 'Multi-tweet thread with supporting visuals',
      reel: 'Short-form video concept (15-60s)',
      story: 'Ephemeral story content for urgency'
    }

    // Build context-rich system prompt with brand voice
    const systemPrompt = `You are a viral content strategist specializing in ${contentType} posts.

Context: Creating content for ${userProfile?.company_name || 'a brand'}.
Brand Voice: ${brandSettings.voice || 'professional and engaging'}
Target Audience: ${brandSettings.audience || 'general audience'}
Platform Focus: ${brandSettings.platforms || 'social media'}
Content Goals: ${brandSettings.goals || 'engagement and growth'}

Your mission: Create ${contentType} content that is:
1. **Content-Aware**: Directly tied to actual quotes and moments from the video
2. **Intuitive**: Makes logical sense and flows naturally
3. **Qualitative**: Thoughtful, not generic or vague
4. **Brand-Aligned**: Matches the specified brand voice and goals
5. **Platform-Optimized**: Designed for ${brandSettings.platforms?.split(',')[0]?.trim() || 'Instagram'} engagement

Critical: Use ACTUAL QUOTES from the transcript. Be specific, not vague.`

    const userPrompt = `Create a ${contentTypeDescriptions[contentType]} for this video.

Video Title: "${projectTitle}"

Key Moments & Quotes from Transcript:
${keyMoments}

Full Content Analysis:
- Main Topics: ${contentAnalysis.topics?.join(', ') || 'N/A'}
- Key Takeaways: ${contentAnalysis.keyPoints?.map((p: string) => `\n  • ${p}`).join('') || 'N/A'}
- Emotional Tone: ${contentAnalysis.sentiment || 'neutral'}
- Target Keywords: ${contentAnalysis.keywords?.slice(0, 8).join(', ') || 'N/A'}

Requirements:
1. Hook: Use an ACTUAL QUOTE or specific moment from the transcript as your hook
2. Main Content: Build around key takeaways, citing specific examples from the video
3. Visual Elements: Describe visuals that directly relate to transcript moments (not generic)
4. Brand Voice: Write in a ${brandSettings.voice || 'professional'} tone
5. CTA: Align with goals: ${brandSettings.goals?.split(',')[0]?.trim() || 'engagement'}
6. Authenticity: Everything must feel authentic to the actual video content

${contentType === 'carousel' ? `
Carousel Structure:
- Slide 1 (Hook): Eye-catching opening with a quote or question from the video
- Slides 2-4 (Content): Each slide addresses one key point with specific examples
- Slide 5 (CTA): Clear call-to-action tied to content goals
` : ''}

Return JSON:
{
  "title": "Attention-grabbing title based on transcript theme",
  "description": "1-2 sentence description tied to actual content",
  "hook": "Opening hook using an actual quote or moment",
  "main_content": "Core message with specific references",
  "visual_elements": ["Specific visual element 1 from content", "Specific element 2"],
  "key_message": "Main takeaway message",
  "transcript_quotes": ["Actual quote 1", "Actual quote 2", "Actual quote 3"],
  ${contentType === 'carousel' ? '"slide_breakdown": ["Slide 1 content", "Slide 2 content", "Slide 3 content", "Slide 4 content", "Slide 5 content"],' : ''}
  "cta": "Specific call to action",
  "mood": "emotional mood",
  "prompt": "Detailed Nano Banana Pro image generation prompt using natural language"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 1800,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('No response from GPT-5')
    }

    return JSON.parse(response)
  }

  /**
   * Generate images using Nano Banana Pro with character consistency
   * IMMEDIATELY generates images (not deferred)
   */
  private static async generatePostImages(params: {
    suggestionId: string
    contentType: PostContentType
    contentIdea: any
    personaId?: string
    personaReferenceImages: string[]
    userId: string
    userProfile?: UserProfile
  }) {
    const {
      suggestionId,
      contentType,
      contentIdea,
      personaId,
      personaReferenceImages,
      userId,
      userProfile
    } = params

    const nanoBanana = createNanoBananaService()

    // Determine image count
    const imageCount = contentType === 'carousel' ? 5 :
                      contentType === 'thread' ? 2 : 1

    const images = []

    for (let i = 0; i < imageCount; i++) {
      const slideContext = contentType === 'carousel'
        ? this.getCarouselSlideContext(i, imageCount, contentIdea)
        : contentIdea

      // Build Nano Banana Pro prompt
      const prompt = this.buildNanoBananaPrompt({
        contentIdea: slideContext,
        contentType,
        slideNumber: i + 1,
        totalSlides: imageCount,
        brandColors: userProfile?.brand_colors,
        brandVoice: userProfile?.brand_voice,
        hasPersona: personaReferenceImages.length > 0,
        personaName: personaId ? 'the person' : undefined
      })

      try {
        const imageUrl = await nanoBanana.generateImage({
          prompt,
          referenceImages: personaReferenceImages,
          resolution: '2K',
          style: 'photorealistic',
          thinkingMode: true,
          aspectRatio: contentType === 'carousel' ? '4:5' : '16:9'
        })

        images.push({
          suggestion_id: suggestionId,
          user_id: userId,
          url: imageUrl,
          platform: 'instagram',
          dimensions: contentType === 'carousel' ? '1080x1350' : '1920x1080',
          prompt: prompt,
          model: 'nano-banana-pro',
          persona_id: personaId,
          position: i,
          status: 'generated'
        })
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}:`, error)
        // Use placeholder
        images.push({
          suggestion_id: suggestionId,
          user_id: userId,
          url: `https://placehold.co/${contentType === 'carousel' ? '1080x1350' : '1920x1080'}/png?text=Image+${i + 1}`,
          platform: 'instagram',
          dimensions: contentType === 'carousel' ? '1080x1350' : '1920x1080',
          prompt: 'Placeholder',
          model: 'placeholder',
          persona_id: personaId,
          position: i,
          status: 'failed'
        })
      }
    }

    return images
  }

  /**
   * Build Nano Banana Pro prompt following best practices
   * Golden Rules: Natural language, specific, descriptive, with context
   */
  private static buildNanoBananaPrompt(params: {
    contentIdea: any
    contentType: PostContentType
    slideNumber: number
    totalSlides: number
    brandColors?: { primary: string; secondary: string; accent: string }
    brandVoice?: string
    hasPersona: boolean
    personaName?: string
  }): string {
    const {
      contentIdea,
      contentType,
      slideNumber,
      totalSlides,
      brandColors,
      brandVoice,
      hasPersona,
      personaName
    } = params

    let basePrompt = contentIdea.prompt || contentIdea.description || ''

    // Add persona character consistency
    if (hasPersona && personaName) {
      basePrompt = `Create a professional ${contentType === 'carousel' ? 'social media carousel slide' : 'social media image'} featuring ${personaName} from the reference images.

Character Consistency: Keep ${personaName}'s facial features exactly the same as the reference images.
Expression: ${contentIdea.mood || 'confident and engaging'}
Pose: ${slideNumber === 1 ? 'Direct eye contact with viewer, centered in frame' : 'Natural, dynamic pose that complements the content'}
Eye Contact: ${slideNumber === 1 ? 'Direct eye contact for maximum engagement' : 'Contextual based on content'}

Content: ${basePrompt}`
    }

    // Add carousel-specific guidance
    if (contentType === 'carousel') {
      const slideContent = contentIdea.slide_breakdown?.[slideNumber - 1] || contentIdea.key_message

      if (slideNumber === 1) {
        basePrompt += `\n\nSlide 1 of ${totalSlides} - HOOK SLIDE
Create a visually striking opening image that stops the scroll.
Content Focus: ${slideContent}
Leave strategic white space at the top or bottom for bold text overlay.
Make it eye-catching, high energy, and curiosity-inducing.`
      } else if (slideNumber === totalSlides) {
        basePrompt += `\n\nSlide ${slideNumber} of ${totalSlides} - CTA SLIDE
Create a clean, professional closing image.
Content Focus: ${slideContent}
Leave clear space for call-to-action text.
Polished, elegant finish that encourages action.`
      } else {
        basePrompt += `\n\nSlide ${slideNumber} of ${totalSlides} - CONTENT SLIDE
Visual supports this specific point: ${slideContent}
Clear, informative, easy to understand.
Professional and polished.`
      }
    }

    // Add brand color guidance
    if (brandColors) {
      basePrompt += `\n\nBrand Color Palette:
Primary Color: ${brandColors.primary} (dominant background or key elements)
Accent Color: ${brandColors.accent} (highlights, emphasis, graphics)
Secondary: ${brandColors.secondary} (supporting elements)

Ensure the overall mood matches a ${brandVoice || 'professional'} brand voice.
Colors should feel cohesive with the brand identity.`
    }

    // Add quality descriptors
    basePrompt += `\n\nQuality Requirements:
- Photorealistic, professional photography quality
- Sharp focus, proper studio lighting
- High contrast and vibrant colors optimized for social media
- Composition optimized for ${contentType === 'carousel' ? '4:5 portrait (1080x1350)' : '16:9 landscape (1920x1080)'} format
- Leave strategic white space for text overlays
- Professional, polished, ready for immediate posting`

    return basePrompt
  }

  /**
   * Get carousel-specific context for each slide
   */
  private static getCarouselSlideContext(
    slideIndex: number,
    totalSlides: number,
    contentIdea: any
  ): any {
    if (contentIdea.slide_breakdown && contentIdea.slide_breakdown[slideIndex]) {
      return {
        ...contentIdea,
        key_message: contentIdea.slide_breakdown[slideIndex],
        prompt: contentIdea.slide_breakdown[slideIndex],
        mood: slideIndex === 0 ? 'attention-grabbing' :
              slideIndex === totalSlides - 1 ? 'inviting' : 'informative'
      }
    }

    // Fallback logic
    if (slideIndex === 0) {
      return {
        ...contentIdea,
        key_message: contentIdea.hook,
        mood: 'attention-grabbing'
      }
    } else if (slideIndex === totalSlides - 1) {
      return {
        ...contentIdea,
        key_message: contentIdea.cta || 'Call to action',
        mood: 'inviting'
      }
    } else {
      const visualElement = contentIdea.visual_elements?.[slideIndex - 1] || contentIdea.key_message
      return {
        ...contentIdea,
        key_message: visualElement,
        mood: 'informative'
      }
    }
  }

  /**
   * Generate platform-specific copy with brand voice
   */
  private static async generatePlatformCopy(params: {
    suggestionId: string
    contentIdea: any
    platforms: Platform[]
    contentType: PostContentType
    userProfile?: UserProfile
  }) {
    const { suggestionId, contentIdea, platforms, contentType, userProfile } = params
    const adminSupabase = await getSupabaseAdmin()
    const openai = getOpenAI()

    const platformLimits = {
      instagram: { caption: 2200, hashtags: 30 },
      twitter: { caption: 280, hashtags: 5 },
      linkedin: { caption: 3000, hashtags: 5 },
      facebook: { caption: 2200, hashtags: 30 },
      youtube: { title: 100, description: 5000 },
      tiktok: { caption: 2200, hashtags: 100 }
    }

    const copyVariants: Record<string, any> = {}

    for (const platform of platforms) {
      const systemPrompt = `You are a ${platform} content expert specialized in the ${userProfile?.brand_voice || 'professional'} brand voice.

Brand Context:
- Voice: ${userProfile?.brand_voice || 'professional and engaging'}
- Audience: ${userProfile?.target_audience?.description || 'general audience'}
- Goals: ${userProfile?.content_goals?.join(', ') || 'engagement'}

Create engaging, platform-optimized copy that matches this brand voice exactly.`

      const userPrompt = `Create ${platform} copy for this ${contentType} post:

Title: ${contentIdea.title}
Description: ${contentIdea.description}
Key Message: ${contentIdea.key_message}
Hook: ${contentIdea.hook}
Actual Quotes from Content: ${contentIdea.transcript_quotes?.join(' | ') || 'N/A'}

Platform Limits:
- ${platform === 'youtube' ? 'Title' : 'Caption'}: ${platform === 'youtube' ? (platformLimits[platform] as any).title : (platformLimits[platform] as any).caption} characters max
- Hashtags: ${(platformLimits[platform] as any).hashtags || 30} max

Brand Voice Guidelines:
- Write in a ${userProfile?.brand_voice || 'professional'} tone
- Target audience: ${userProfile?.target_audience?.description || 'general'}
- Primary goal: ${userProfile?.content_goals?.[0] || 'engagement'}

Return JSON:
{
  "caption": "Engaging caption within character limit, matching brand voice",
  "hashtags": ["relevant1", "relevant2"],
  "cta": "Call to action matching brand goals",
  ${platform === 'youtube' || platform === 'linkedin' ? '"title": "Post title",' : ''}
  ${platform === 'youtube' || platform === 'linkedin' ? '"description": "Detailed description"' : ''}
}`

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 1000,
          response_format: { type: 'json_object' }
        })

        const response = completion.choices[0].message.content
        if (response) {
          const copy = JSON.parse(response)
          copyVariants[platform] = copy

          // Store in database
          await adminSupabase
            .from('post_copy')
            .insert({
              suggestion_id: suggestionId,
              platform,
              caption: copy.caption,
              hashtags: copy.hashtags || [],
              cta: copy.cta || '',
              title: copy.title || null,
              description: copy.description || null,
              total_length: copy.caption.length + (copy.hashtags?.join(' ').length || 0)
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
    copyVariants: Record<string, any>
  }): Platform[] {
    const { contentType, imageCount, copyVariants } = params
    const eligible: Platform[] = []

    if (copyVariants.instagram && copyVariants.instagram.caption.length <= 2200) {
      eligible.push('instagram')
    }

    if (copyVariants.twitter && copyVariants.twitter.caption.length <= 280) {
      eligible.push('twitter')
    }

    if (copyVariants.linkedin && copyVariants.linkedin.caption.length <= 3000) {
      eligible.push('linkedin')
    }

    if (copyVariants.facebook && copyVariants.facebook.caption.length <= 2200) {
      eligible.push('facebook')
    }

    if (contentType === 'single' && copyVariants.youtube) {
      eligible.push('youtube')
    }

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
}
