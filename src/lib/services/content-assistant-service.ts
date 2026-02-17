/**
 * Content Analysis Assistant Service
 *
 * Uses OpenAI GPT-5.2 Responses API with high reasoning to deeply analyze
 * video content and generate intelligent, multi-layered content strategies.
 *
 * This service acts as the "brain" that understands:
 * - What the video is really about (not just keywords)
 * - The emotional journey and key moments
 * - What would make someone click (thumbnail psychology)
 * - How to structure social content narratively
 * - How to align with brand voice and persona
 */

import OpenAI from 'openai'

// Lazy initialization to prevent client-side errors
// OpenAI client is only created when needed (server-side only)
let _openai: OpenAI | null = null
const getOpenAI = () => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return _openai
}

// Types for the content analysis
export interface ContentAssistantInput {
  transcript: string
  projectTitle: string
  projectDescription?: string
  // Persona context
  persona?: {
    id: string
    name: string
    description?: string
    referenceImageUrls?: string[]
  }
  // Brand context
  brand?: {
    name?: string
    voice?: string // e.g., "professional yet approachable", "edgy and bold"
    colors?: { primary?: string; secondary?: string; accent?: string }
    targetAudience?: {
      description?: string
      ageGroups?: string[]
      interests?: string[]
      painPoints?: string[]
    }
    contentGoals?: string[] // e.g., "drive sales", "build authority", "grow audience"
  }
  // Optional previous analysis to build upon
  previousResponseId?: string
}

export interface DeepContentAnalysis {
  // Core understanding
  coreMessage: {
    oneSentence: string // The video in one powerful sentence
    expanded: string // 2-3 sentence explanation
    whyItMatters: string // Why the audience should care
  }

  // Emotional mapping
  emotionalJourney: {
    openingHook: string // How does it grab attention?
    tensionPoints: string[] // Moments of conflict/problem
    resolutionMoments: string[] // Moments of solution/relief
    climax: string // The most impactful moment
    closingEmotion: string // How should viewer feel at end?
  }

  // Key moments for content extraction
  keyMoments: Array<{
    timestamp?: string
    quote: string
    context: string
    emotionalWeight: 'high' | 'medium' | 'low'
    bestFor: ('thumbnail' | 'quote_graphic' | 'carousel_slide' | 'hook' | 'cta')[]
  }>

  // Audience psychology
  audiencePsychology: {
    primaryPainPoint: string
    desiredOutcome: string
    objections: string[] // What might stop them from engaging?
    triggerWords: string[] // Words that resonate with this audience
    clickMotivation: string // What makes them click?
  }

  // Thumbnail strategy
  thumbnailStrategy: {
    concepts: Array<{
      title: string
      visualDescription: string
      emotionalAppeal: string
      textOverlay?: string
      whyItWorks: string
    }>
    bestPersonaExpression: string // e.g., "surprised", "confident smile", "thoughtful"
    colorPsychology: string // What colors evoke the right emotion?
    compositionStyle: string // e.g., "close-up face with text", "action shot"
  }

  // Social content strategy
  socialStrategy: {
    carouselNarrative: {
      hook: string // First slide that stops the scroll
      slides: Array<{
        slideNumber: number
        purpose: string // What this slide achieves
        content: string // What goes on this slide
        visualDirection: string // How it should look
      }>
      cta: string // Final call to action
      narrativeArc: string // How the story flows
    }

    quoteGraphics: Array<{
      quote: string
      context: string // Why this quote matters
      visualStyle: string
      targetPlatform: string
    }>

    hooks: Array<{
      text: string
      platform: string
      whyItWorks: string
    }>

    threadIdeas: Array<{
      topic: string
      tweetSequence: string[]
      engagementStrategy: string
    }>
  }

  // Platform-specific adaptations
  platformAdaptations: {
    instagram: {
      tone: string
      hashtagStrategy: string
      bestContentTypes: string[]
    }
    twitter: {
      tone: string
      engagementTactics: string[]
      bestContentTypes: string[]
    }
    linkedin: {
      tone: string
      professionalAngle: string
      bestContentTypes: string[]
    }
    youtube: {
      communityPostIdeas: string[]
      shortsAngles: string[]
    }
    tiktok: {
      trendAlignment: string
      hookStyle: string
      bestContentTypes: string[]
    }
  }

  // Brand alignment notes
  brandAlignment: {
    voiceConsistency: string // How to maintain brand voice
    visualConsistency: string // How to maintain visual brand
    audienceAlignment: string // How this content serves the target audience
  }

  // Metadata
  metadata: {
    responseId: string // For conversation continuity
    analysisDepth: 'surface' | 'moderate' | 'deep'
    confidenceScore: number
  }
}

export interface ThumbnailGenerationPlan {
  concepts: Array<{
    id: string
    title: string
    detailedPrompt: string // Rich, multi-layered prompt
    personaDirection: string // How to position/express the persona
    textOverlay: {
      primary: string
      secondary?: string
      placement: string
    }
    colorScheme: string[]
    emotionalTarget: string
    clickPsychology: string
  }>
  negativePrompt: string
  styleGuide: string
}

export interface SocialContentPlan {
  carousels: Array<{
    id: string
    title: string
    narrativeArc: string
    slides: Array<{
      slideNumber: number
      headline: string
      body: string
      visualPrompt: string
      designNotes: string
    }>
    caption: string
    hashtags: string[]
    cta: string
  }>

  quotes: Array<{
    id: string
    quote: string
    attribution: string
    visualPrompt: string
    caption: string
    platforms: string[]
  }>

  hooks: Array<{
    id: string
    text: string
    visualPrompt: string
    platform: string
    followUp: string
  }>
}

/**
 * Content Analysis Assistant Service
 */
export class ContentAssistantService {
  private model = 'gpt-5.2' // Using GPT-5.2 for best reasoning
  // GPT-5.2 supports: none (default), low, medium, high, xhigh
  private reasoningEffort: 'none' | 'low' | 'medium' | 'high' | 'xhigh' = 'high'

  constructor(options?: { reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh' }) {
    if (options?.reasoningEffort) {
      this.reasoningEffort = options.reasoningEffort
    }
  }

  /**
   * Perform deep content analysis using GPT-5.2 with high reasoning
   */
  async analyzeContent(input: ContentAssistantInput): Promise<DeepContentAnalysis> {
    const systemPrompt = this.buildSystemPrompt(input)
    const userPrompt = this.buildAnalysisPrompt(input)

    try {
      // Use the Responses API for better reasoning chain handling
      // @ts-expect-error - GPT-5.2 supports none/xhigh but SDK types may not be updated
      const response = await getOpenAI().responses.create({
        model: this.model,
        input: userPrompt,
        instructions: systemPrompt,
        reasoning: {
          effort: this.reasoningEffort
        },
        text: {
          format: {
            type: 'json_schema',
            json_schema: {
              name: 'deep_content_analysis',
              schema: this.getAnalysisSchema(),
              strict: true
            }
          }
        },
        max_output_tokens: 8000,
        store: true, // Store for conversation continuity
        previous_response_id: input.previousResponseId
      })

      // Extract the text content from the response
      const outputText = this.extractOutputText(response)
      const analysis = JSON.parse(outputText) as DeepContentAnalysis

      // Add metadata
      analysis.metadata = {
        responseId: response.id,
        analysisDepth: 'deep',
        confidenceScore: 0.9
      }

      return analysis
    } catch (error) {
      console.error('Content analysis error:', error)
      throw new Error(`Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate detailed thumbnail concepts based on content analysis
   */
  async generateThumbnailPlan(
    analysis: DeepContentAnalysis,
    input: ContentAssistantInput
  ): Promise<ThumbnailGenerationPlan> {
    const systemPrompt = `You are an expert YouTube thumbnail designer and click psychology specialist.
Your job is to create thumbnail concepts that:
1. Stop the scroll - visually arresting and emotionally compelling
2. Communicate value instantly - viewer knows what they'll get
3. Trigger curiosity - create an information gap they need to fill
4. Feel authentic - not clickbait, but genuinely representative of content
5. Work with the persona - if a person is featured, direct their expression and positioning

You understand that thumbnails are not just images - they're promises and emotional triggers.
A great thumbnail makes the viewer feel something before they even click.

${input.persona ? `
PERSONA CONTEXT:
- Name: ${input.persona.name}
- Description: ${input.persona.description || 'Content creator'}
- You must create prompts that will generate the persona consistently using reference images.
- Always specify facial expression, body language, and positioning relative to other elements.
` : ''}

${input.brand ? `
BRAND CONTEXT:
- Brand: ${input.brand.name || 'Creator brand'}
- Voice: ${input.brand.voice || 'Professional and engaging'}
- Colors: ${JSON.stringify(input.brand.colors || {})}
- Target Audience: ${input.brand.targetAudience?.description || 'General audience'}
- Audience Pain Points: ${input.brand.targetAudience?.painPoints?.join(', ') || 'Not specified'}
` : ''}`

    const userPrompt = `Based on this deep content analysis, create 3 distinct thumbnail concepts.

CONTENT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

VIDEO TITLE: ${input.projectTitle}

For each thumbnail concept, provide:
1. A descriptive title for the concept
2. A DETAILED image generation prompt (200+ words) that includes:
   - Exact composition and framing
   - Lighting direction and mood
   - Color palette and contrast
   - ${input.persona ? 'Persona expression, pose, and positioning' : 'Human elements if any'}
   - Background elements and depth
   - Emotional atmosphere
   - Style references (cinematic, editorial, etc.)
3. Text overlay recommendations with exact placement
4. The psychological reason why this thumbnail will get clicks
5. The emotional response it triggers

Make each concept distinctly different:
- Concept 1: Emotion-focused (face/expression dominant)
- Concept 2: Curiosity-focused (visual mystery/information gap)
- Concept 3: Value-focused (clear benefit/outcome shown)

Return as JSON with the ThumbnailGenerationPlan structure.`

    try {
      // @ts-expect-error - GPT-5.2 supports none/xhigh but SDK types may not be updated
      const response = await getOpenAI().responses.create({
        model: this.model,
        input: userPrompt,
        instructions: systemPrompt,
        reasoning: {
          effort: this.reasoningEffort
        },
        text: {
          format: {
            type: 'json_schema',
            json_schema: {
              name: 'thumbnail_generation_plan',
              schema: this.getThumbnailPlanSchema(),
              strict: true
            }
          }
        },
        max_output_tokens: 4000,
        previous_response_id: analysis.metadata?.responseId
      })

      const outputText = this.extractOutputText(response)
      return JSON.parse(outputText) as ThumbnailGenerationPlan
    } catch (error) {
      console.error('Thumbnail plan generation error:', error)
      throw new Error(`Failed to generate thumbnail plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate detailed social content plan based on content analysis
   */
  async generateSocialContentPlan(
    analysis: DeepContentAnalysis,
    input: ContentAssistantInput,
    platforms: string[] = ['instagram', 'twitter', 'linkedin']
  ): Promise<SocialContentPlan> {
    const systemPrompt = `You are a viral social media strategist who understands narrative psychology.
Your content doesn't just inform - it transforms. Every piece you create has:
1. A narrative arc - even a single image tells a story
2. Emotional resonance - viewers feel something
3. Pattern interruption - it stops the scroll
4. Value delivery - viewers learn or gain something
5. Social proof alignment - feels shareable and discussable

CAROUSEL PHILOSOPHY:
- Slide 1 is NOT a title card. It's a pattern interrupt that creates an open loop.
- Each slide builds tension or delivers value progressively
- The narrative should feel like a journey, not a list
- Final slide closes the loop AND opens a new one (CTA)

QUOTE PHILOSOPHY:
- Great quotes are not just words - they're realizations
- Context matters: who said it, why, and what it means for the viewer
- Visual design should amplify the emotional weight

HOOK PHILOSOPHY:
- Hooks are promises of transformation
- They address pain points or desires directly
- Platform-specific: Twitter hooks differ from Instagram hooks

${input.persona ? `
PERSONA CONTEXT:
- Name: ${input.persona.name}
- All visual content should feature or reference the persona appropriately
- Maintain character consistency across all generated images
` : ''}

${input.brand ? `
BRAND VOICE: ${input.brand.voice || 'Engaging and authentic'}
TARGET AUDIENCE: ${input.brand.targetAudience?.description || 'General audience'}
CONTENT GOALS: ${input.brand.contentGoals?.join(', ') || 'Engagement and growth'}
` : ''}`

    const userPrompt = `Create a comprehensive social content plan based on this analysis.

CONTENT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

TARGET PLATFORMS: ${platforms.join(', ')}
VIDEO TITLE: ${input.projectTitle}

Generate:

1. TWO CAROUSEL CONCEPTS (5-7 slides each):
   - Each with a clear narrative arc
   - Detailed visual prompts for each slide
   - Caption that enhances but doesn't repeat the carousel
   - Platform-optimized hashtags

2. THREE QUOTE GRAPHICS:
   - Pulled from key moments in the analysis
   - With context on why each quote resonates
   - Detailed visual prompts
   - Platform-specific captions

3. FIVE HOOKS (text + visual pairs):
   - Different angles on the same content
   - Platform-specific variations
   - Follow-up content suggestions

For EVERY visual prompt, include:
- Composition and layout
- Color mood and lighting
- Typography style and placement
- ${input.persona ? 'How the persona appears (expression, pose)' : 'Human elements if any'}
- Emotional atmosphere
- Platform-specific sizing considerations

Return as JSON with the SocialContentPlan structure.`

    try {
      // @ts-expect-error - GPT-5.2 supports none/xhigh but SDK types may not be updated
      const response = await getOpenAI().responses.create({
        model: this.model,
        input: userPrompt,
        instructions: systemPrompt,
        reasoning: {
          effort: this.reasoningEffort
        },
        text: {
          format: {
            type: 'json_schema',
            json_schema: {
              name: 'social_content_plan',
              schema: this.getSocialContentPlanSchema(),
              strict: true
            }
          }
        },
        max_output_tokens: 6000,
        previous_response_id: analysis.metadata?.responseId
      })

      const outputText = this.extractOutputText(response)
      return JSON.parse(outputText) as SocialContentPlan
    } catch (error) {
      console.error('Social content plan generation error:', error)
      throw new Error(`Failed to generate social content plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Iterate on a thumbnail concept with feedback
   */
  async iterateThumbnailConcept(
    concept: ThumbnailGenerationPlan['concepts'][0],
    feedback: string,
    previousResponseId?: string
  ): Promise<ThumbnailGenerationPlan['concepts'][0]> {
    const userPrompt = `Improve this thumbnail concept based on the feedback.

CURRENT CONCEPT:
${JSON.stringify(concept, null, 2)}

FEEDBACK:
${feedback}

Maintain the core idea but address the feedback. Return an improved version with:
- Updated detailed prompt incorporating feedback
- Adjusted text overlay if needed
- Refined emotional targeting
- Better click psychology if applicable`

    try {
      const response = await getOpenAI().responses.create({
        model: this.model,
        input: userPrompt,
        instructions: 'You are a thumbnail design expert. Iterate on concepts based on feedback while maintaining what works.',
        reasoning: {
          effort: 'medium' // Lower reasoning for iterations
        },
        text: {
          format: {
            type: 'json_object'
          }
        },
        max_output_tokens: 2000,
        previous_response_id: previousResponseId
      })

      const outputText = this.extractOutputText(response)
      return JSON.parse(outputText)
    } catch (error) {
      console.error('Thumbnail iteration error:', error)
      throw new Error(`Failed to iterate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper methods
  private buildSystemPrompt(input: ContentAssistantInput): string {
    return `You are an elite content strategist and audience psychologist.

Your role is to DEEPLY understand video content - not just what it says, but:
- What it MEANS to the viewer
- What EMOTIONS it triggers
- What TRANSFORMATION it offers
- What makes someone STOP SCROLLING for it
- What makes someone CLICK on it
- What makes someone SHARE it

You think in terms of:
1. PSYCHOLOGY - What drives human behavior and attention?
2. NARRATIVE - How does story create engagement?
3. EMOTION - What feelings create action?
4. VALUE - What does the viewer gain?
5. CURIOSITY - What creates an information gap?

${input.persona ? `
PERSONA CONTEXT:
This creator has an AI avatar named "${input.persona.name}".
${input.persona.description ? `Description: ${input.persona.description}` : ''}
All content recommendations should consider how to feature this persona effectively.
` : ''}

${input.brand ? `
BRAND CONTEXT:
${input.brand.name ? `Brand: ${input.brand.name}` : ''}
${input.brand.voice ? `Voice: ${input.brand.voice}` : ''}
${input.brand.targetAudience ? `
Target Audience:
- Description: ${input.brand.targetAudience.description || 'Not specified'}
- Age Groups: ${input.brand.targetAudience.ageGroups?.join(', ') || 'Not specified'}
- Interests: ${input.brand.targetAudience.interests?.join(', ') || 'Not specified'}
- Pain Points: ${input.brand.targetAudience.painPoints?.join(', ') || 'Not specified'}
` : ''}
${input.brand.contentGoals ? `Content Goals: ${input.brand.contentGoals.join(', ')}` : ''}
` : ''}

Analyze with HIGH REASONING DEPTH. Take your time to truly understand the content before generating insights.`
  }

  private buildAnalysisPrompt(input: ContentAssistantInput): string {
    // Truncate transcript if too long, but keep key parts
    const maxTranscriptLength = 15000
    let transcript = input.transcript
    if (transcript.length > maxTranscriptLength) {
      // Keep beginning and end, summarize middle
      const beginning = transcript.substring(0, maxTranscriptLength * 0.4)
      const end = transcript.substring(transcript.length - maxTranscriptLength * 0.4)
      transcript = `${beginning}\n\n[...middle section truncated for length...]\n\n${end}`
    }

    return `Analyze this video content deeply.

VIDEO TITLE: ${input.projectTitle}
${input.projectDescription ? `DESCRIPTION: ${input.projectDescription}` : ''}

FULL TRANSCRIPT:
---
${transcript}
---

Perform a DEEP ANALYSIS covering:

1. CORE MESSAGE
- What is this video REALLY about? (Not just the topic, but the transformation/insight)
- Why should anyone care?
- What's the one sentence that captures its essence?

2. EMOTIONAL JOURNEY
- How does it hook the viewer initially?
- Where are the tension/conflict points?
- Where are the resolution/relief moments?
- What's the emotional climax?
- How should the viewer feel at the end?

3. KEY MOMENTS
- Extract 5-8 powerful moments (quotes, insights, revelations)
- For each: the quote, its context, emotional weight, and what it's best used for

4. AUDIENCE PSYCHOLOGY
- What pain point does this address?
- What outcome does the viewer desire?
- What might stop them from engaging?
- What words/phrases resonate with this audience?
- What would make them click?

5. THUMBNAIL STRATEGY
- 3 distinct thumbnail concepts with detailed visual descriptions
- What expression should the persona have?
- What colors create the right emotion?
- What composition style works best?

6. SOCIAL CONTENT STRATEGY
- Carousel narrative (hook → journey → CTA)
- Quote graphics with context
- Platform-specific hooks
- Thread ideas for Twitter/X

7. PLATFORM ADAPTATIONS
- How to adjust tone and content for each platform

8. BRAND ALIGNMENT
- How to maintain voice and visual consistency

Return as a complete DeepContentAnalysis JSON object.`
  }

  private extractOutputText(response: any): string {
    // Handle different response structures from Responses API
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

    // Fallback for direct text response
    if (response.output_text) {
      return response.output_text
    }

    throw new Error('Could not extract output text from response')
  }

  private getAnalysisSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        coreMessage: {
          type: 'object',
          properties: {
            oneSentence: { type: 'string' },
            expanded: { type: 'string' },
            whyItMatters: { type: 'string' }
          },
          required: ['oneSentence', 'expanded', 'whyItMatters'],
          additionalProperties: false
        },
        emotionalJourney: {
          type: 'object',
          properties: {
            openingHook: { type: 'string' },
            tensionPoints: { type: 'array', items: { type: 'string' } },
            resolutionMoments: { type: 'array', items: { type: 'string' } },
            climax: { type: 'string' },
            closingEmotion: { type: 'string' }
          },
          required: ['openingHook', 'tensionPoints', 'resolutionMoments', 'climax', 'closingEmotion'],
          additionalProperties: false
        },
        keyMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              quote: { type: 'string' },
              context: { type: 'string' },
              emotionalWeight: { type: 'string', enum: ['high', 'medium', 'low'] },
              bestFor: { type: 'array', items: { type: 'string' } }
            },
            required: ['quote', 'context', 'emotionalWeight', 'bestFor'],
            additionalProperties: false
          }
        },
        audiencePsychology: {
          type: 'object',
          properties: {
            primaryPainPoint: { type: 'string' },
            desiredOutcome: { type: 'string' },
            objections: { type: 'array', items: { type: 'string' } },
            triggerWords: { type: 'array', items: { type: 'string' } },
            clickMotivation: { type: 'string' }
          },
          required: ['primaryPainPoint', 'desiredOutcome', 'objections', 'triggerWords', 'clickMotivation'],
          additionalProperties: false
        },
        thumbnailStrategy: {
          type: 'object',
          properties: {
            concepts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  visualDescription: { type: 'string' },
                  emotionalAppeal: { type: 'string' },
                  textOverlay: { type: 'string' },
                  whyItWorks: { type: 'string' }
                },
                required: ['title', 'visualDescription', 'emotionalAppeal', 'whyItWorks'],
                additionalProperties: false
              }
            },
            bestPersonaExpression: { type: 'string' },
            colorPsychology: { type: 'string' },
            compositionStyle: { type: 'string' }
          },
          required: ['concepts', 'bestPersonaExpression', 'colorPsychology', 'compositionStyle'],
          additionalProperties: false
        },
        socialStrategy: {
          type: 'object',
          properties: {
            carouselNarrative: {
              type: 'object',
              properties: {
                hook: { type: 'string' },
                slides: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      slideNumber: { type: 'integer' },
                      purpose: { type: 'string' },
                      content: { type: 'string' },
                      visualDirection: { type: 'string' }
                    },
                    required: ['slideNumber', 'purpose', 'content', 'visualDirection'],
                    additionalProperties: false
                  }
                },
                cta: { type: 'string' },
                narrativeArc: { type: 'string' }
              },
              required: ['hook', 'slides', 'cta', 'narrativeArc'],
              additionalProperties: false
            },
            quoteGraphics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  quote: { type: 'string' },
                  context: { type: 'string' },
                  visualStyle: { type: 'string' },
                  targetPlatform: { type: 'string' }
                },
                required: ['quote', 'context', 'visualStyle', 'targetPlatform'],
                additionalProperties: false
              }
            },
            hooks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  platform: { type: 'string' },
                  whyItWorks: { type: 'string' }
                },
                required: ['text', 'platform', 'whyItWorks'],
                additionalProperties: false
              }
            },
            threadIdeas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  tweetSequence: { type: 'array', items: { type: 'string' } },
                  engagementStrategy: { type: 'string' }
                },
                required: ['topic', 'tweetSequence', 'engagementStrategy'],
                additionalProperties: false
              }
            }
          },
          required: ['carouselNarrative', 'quoteGraphics', 'hooks', 'threadIdeas'],
          additionalProperties: false
        },
        platformAdaptations: {
          type: 'object',
          properties: {
            instagram: {
              type: 'object',
              properties: {
                tone: { type: 'string' },
                hashtagStrategy: { type: 'string' },
                bestContentTypes: { type: 'array', items: { type: 'string' } }
              },
              required: ['tone', 'hashtagStrategy', 'bestContentTypes'],
              additionalProperties: false
            },
            twitter: {
              type: 'object',
              properties: {
                tone: { type: 'string' },
                engagementTactics: { type: 'array', items: { type: 'string' } },
                bestContentTypes: { type: 'array', items: { type: 'string' } }
              },
              required: ['tone', 'engagementTactics', 'bestContentTypes'],
              additionalProperties: false
            },
            linkedin: {
              type: 'object',
              properties: {
                tone: { type: 'string' },
                professionalAngle: { type: 'string' },
                bestContentTypes: { type: 'array', items: { type: 'string' } }
              },
              required: ['tone', 'professionalAngle', 'bestContentTypes'],
              additionalProperties: false
            },
            youtube: {
              type: 'object',
              properties: {
                communityPostIdeas: { type: 'array', items: { type: 'string' } },
                shortsAngles: { type: 'array', items: { type: 'string' } }
              },
              required: ['communityPostIdeas', 'shortsAngles'],
              additionalProperties: false
            },
            tiktok: {
              type: 'object',
              properties: {
                trendAlignment: { type: 'string' },
                hookStyle: { type: 'string' },
                bestContentTypes: { type: 'array', items: { type: 'string' } }
              },
              required: ['trendAlignment', 'hookStyle', 'bestContentTypes'],
              additionalProperties: false
            }
          },
          required: ['instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
          additionalProperties: false
        },
        brandAlignment: {
          type: 'object',
          properties: {
            voiceConsistency: { type: 'string' },
            visualConsistency: { type: 'string' },
            audienceAlignment: { type: 'string' }
          },
          required: ['voiceConsistency', 'visualConsistency', 'audienceAlignment'],
          additionalProperties: false
        }
      },
      required: [
        'coreMessage',
        'emotionalJourney',
        'keyMoments',
        'audiencePsychology',
        'thumbnailStrategy',
        'socialStrategy',
        'platformAdaptations',
        'brandAlignment'
      ],
      additionalProperties: false
    }
  }

  private getThumbnailPlanSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              detailedPrompt: { type: 'string' },
              personaDirection: { type: 'string' },
              textOverlay: {
                type: 'object',
                properties: {
                  primary: { type: 'string' },
                  secondary: { type: 'string' },
                  placement: { type: 'string' }
                },
                required: ['primary', 'placement'],
                additionalProperties: false
              },
              colorScheme: { type: 'array', items: { type: 'string' } },
              emotionalTarget: { type: 'string' },
              clickPsychology: { type: 'string' }
            },
            required: ['id', 'title', 'detailedPrompt', 'personaDirection', 'textOverlay', 'colorScheme', 'emotionalTarget', 'clickPsychology'],
            additionalProperties: false
          }
        },
        negativePrompt: { type: 'string' },
        styleGuide: { type: 'string' }
      },
      required: ['concepts', 'negativePrompt', 'styleGuide'],
      additionalProperties: false
    }
  }

  private getSocialContentPlanSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        carousels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              narrativeArc: { type: 'string' },
              slides: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    slideNumber: { type: 'integer' },
                    headline: { type: 'string' },
                    body: { type: 'string' },
                    visualPrompt: { type: 'string' },
                    designNotes: { type: 'string' }
                  },
                  required: ['slideNumber', 'headline', 'body', 'visualPrompt', 'designNotes'],
                  additionalProperties: false
                }
              },
              caption: { type: 'string' },
              hashtags: { type: 'array', items: { type: 'string' } },
              cta: { type: 'string' }
            },
            required: ['id', 'title', 'narrativeArc', 'slides', 'caption', 'hashtags', 'cta'],
            additionalProperties: false
          }
        },
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              quote: { type: 'string' },
              attribution: { type: 'string' },
              visualPrompt: { type: 'string' },
              caption: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'quote', 'attribution', 'visualPrompt', 'caption', 'platforms'],
            additionalProperties: false
          }
        },
        hooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              visualPrompt: { type: 'string' },
              platform: { type: 'string' },
              followUp: { type: 'string' }
            },
            required: ['id', 'text', 'visualPrompt', 'platform', 'followUp'],
            additionalProperties: false
          }
        }
      },
      required: ['carousels', 'quotes', 'hooks'],
      additionalProperties: false
    }
  }
}

// Factory function for easy instantiation
// GPT-5.2 supports: none (default), low, medium, high, xhigh
export function createContentAssistant(options?: { reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh' }) {
  return new ContentAssistantService(options)
}

// Default export
export default ContentAssistantService
