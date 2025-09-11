import { getOpenAI } from '@/lib/openai'
import { ContentAnalysis } from '@/lib/ai-content-service'
import { Persona } from '@/lib/services/persona-service'

export interface Project {
  id: string
  title: string
  content_analysis?: ContentAnalysis
  metadata?: any
}

export interface ThumbnailPromptConfig {
  basePrompt: string
  loraConfig: {
    path: string
    scale: number
  }
  negativePrompt: string
  settings?: {
    guidance_scale?: number
    num_inference_steps?: number
    seed?: number
  }
}

export class ThumbnailPromptService {
  /**
   * Generate optimized prompts for thumbnail with persona LoRA
   */
  static generatePersonaThumbnailPrompt(
    persona: Persona,
    project: Project,
    style: string = 'youtube'
  ): ThumbnailPromptConfig {
    const triggerPhrase = persona.loraTriggerPhrase || `photo of ${persona.name}`
    const contentAnalysis = project.content_analysis
    
    // Extract key elements from content analysis
    const keywords = contentAnalysis?.keywords?.slice(0, 5).join(', ') || ''
    const mainTopic = contentAnalysis?.topics?.[0] || project.title
    const sentiment = contentAnalysis?.sentiment || 'engaging'
    
    // Map style to visual elements
    const styleElements = {
      dramatic: 'dramatic lighting, high contrast, cinematic mood, bold shadows',
      vibrant: 'vibrant colors, energetic mood, dynamic composition, bright highlights',
      professional: 'clean professional appearance, subtle lighting, corporate aesthetic',
      modern: 'contemporary style, minimalist design, trendy aesthetic',
      creative: 'artistic composition, unique perspective, creative lighting'
    }
    
    // Build prompt with trigger phrase properly positioned at the start
    const basePrompt = `${triggerPhrase}, YouTube thumbnail, 1920x1080 resolution, ultra HD quality, 
PROMINENTLY featuring ${persona.name}'s face with ${sentiment} expression,
direct eye contact with viewer, face occupies 30-40% of frame,
professional portrait lighting, sharp facial features, clear skin detail,
${mainTopic} theme visualization,
${keywords ? `incorporating visual elements of ${keywords},` : ''}
${styleElements[style as keyof typeof styleElements] || styleElements.professional},
photorealistic quality, highly detailed, professional photography`.trim()
    
    // Negative prompts to avoid common issues
    const negativePrompt = 'blurry, low quality, distorted face, bad anatomy, extra limbs, extra fingers, disfigured, out of frame, cropped face, partial face, bad lighting, overexposed, underexposed, amateur, low resolution'
    
    // Determine optimal LoRA strength based on style
    const loraScale = style === 'dramatic' ? 1.2 : 
                     style === 'vibrant' ? 1.1 :
                     style === 'creative' ? 1.15 : 1.0
    
    return {
      basePrompt,
      loraConfig: {
        path: persona.loraModelUrl!,
        scale: loraScale
      },
      negativePrompt,
      settings: {
        guidance_scale: style === 'dramatic' ? 8.5 : 
                       style === 'vibrant' ? 8.0 : 7.5,
        num_inference_steps: 35,
        seed: Math.floor(Math.random() * 1000000)
      }
    }
  }
  
  /**
   * Generate smart prompt using GPT-5 analysis
   */
  static async generateSmartPrompt(
    persona: Persona,
    contentAnalysis: ContentAnalysis
  ): Promise<string> {
    try {
      const openai = getOpenAI()
      
      const triggerPhrase = persona.loraTriggerPhrase || `photo of ${persona.name}`
      const thumbnailConcepts = contentAnalysis.thumbnailIdeas?.concepts || []
      const bestConcept = thumbnailConcepts[0]
      
      const systemPrompt = `You are an expert at creating prompts for AI image generation with LoRA models.
Create optimized thumbnail prompts that will work perfectly with a trained LoRA model.
The prompt MUST start with the exact trigger phrase to activate the LoRA.
Focus on YouTube thumbnail best practices: eye-catching, clear focal point, readable at small sizes.`

      const userPrompt = `Create an optimized thumbnail prompt for:
Persona: ${persona.name}
Trigger Phrase: "${triggerPhrase}" (MUST be at the start of the prompt)
Video Topics: ${contentAnalysis.topics?.join(', ')}
Keywords: ${contentAnalysis.keywords?.slice(0, 5).join(', ')}
Sentiment: ${contentAnalysis.sentiment}
${bestConcept ? `
Suggested Concept: ${bestConcept.title}
Visual Elements: ${bestConcept.visualElements?.join(', ')}
Mood: ${bestConcept.mood}
Style: ${bestConcept.style}
` : ''}

Requirements:
1. Start with the EXACT trigger phrase: "${triggerPhrase}"
2. Specify YouTube thumbnail dimensions (1920x1080)
3. Describe facial expression and positioning
4. Include relevant background elements from the video content
5. Maintain photorealistic quality
6. Make it eye-catching and clickable
7. Ensure the face is prominent (30-40% of frame)

Generate a single, detailed prompt (max 200 words).`

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 250,
        temperature: 1.0 // GPT-5 only supports default temperature
      })
      
      const generatedPrompt = completion.choices[0].message.content || ''
      
      // Ensure the trigger phrase is at the start
      if (!generatedPrompt.startsWith(triggerPhrase)) {
        return `${triggerPhrase}, ${generatedPrompt}`
      }
      
      return generatedPrompt
    } catch (error) {
      console.error('Smart prompt generation error:', error)
      
      // Fallback to basic prompt generation
      return this.generatePersonaThumbnailPrompt(
        persona,
        { 
          id: 'fallback',
          title: contentAnalysis.summary || 'Content',
          content_analysis: contentAnalysis
        },
        'youtube'
      ).basePrompt
    }
  }
  
  /**
   * Improve prompt based on user feedback
   */
  static async improvePrompt(
    currentPrompt: string,
    feedback: string,
    persona: Persona
  ): Promise<string> {
    try {
      const openai = getOpenAI()
      const triggerPhrase = persona.loraTriggerPhrase || `photo of ${persona.name}`
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: `Improve AI image generation prompts based on user feedback.
Keep the trigger phrase "${triggerPhrase}" at the start.
Make specific improvements while maintaining the core concept.`
          },
          {
            role: 'user',
            content: `Current prompt: "${currentPrompt}"
            
User feedback: "${feedback}"

Generate an improved prompt that addresses the feedback.
Keep the same general concept but make the requested changes.
The prompt MUST start with: "${triggerPhrase}"

Return only the improved prompt, no explanation.`
          }
        ],
        max_completion_tokens: 250,
        temperature: 1.0
      })
      
      const improvedPrompt = completion.choices[0].message.content || currentPrompt
      
      // Ensure trigger phrase is preserved
      if (!improvedPrompt.startsWith(triggerPhrase)) {
        return `${triggerPhrase}, ${improvedPrompt}`
      }
      
      return improvedPrompt
    } catch (error) {
      console.error('Prompt improvement error:', error)
      return currentPrompt // Return original if improvement fails
    }
  }
  
  /**
   * Generate batch of diverse thumbnail prompts
   */
  static async generateBatchPrompts(
    persona: Persona,
    contentAnalysis: ContentAnalysis,
    count: number = 3
  ): Promise<string[]> {
    try {
      const openai = getOpenAI()
      const triggerPhrase = persona.loraTriggerPhrase || `photo of ${persona.name}`
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'Generate diverse thumbnail prompts for A/B testing. Each should have a different angle or approach.'
          },
          {
            role: 'user',
            content: `Create ${count} different thumbnail prompts for:
Persona: ${persona.name} (trigger: "${triggerPhrase}")
Topics: ${contentAnalysis.topics?.join(', ')}
Keywords: ${contentAnalysis.keywords?.slice(0, 5).join(', ')}

Each prompt should:
1. Start with "${triggerPhrase}"
2. Have a different visual approach
3. Target different viewer psychology
4. Be optimized for YouTube thumbnails

Return JSON:
{
  "prompts": [
    "Prompt 1 starting with trigger phrase",
    "Prompt 2 starting with trigger phrase",
    "Prompt 3 starting with trigger phrase"
  ]
}`
          }
        ],
        max_completion_tokens: 600,
        temperature: 1.0,
        response_format: { type: 'json_object' }
      })
      
      const result = JSON.parse(completion.choices[0].message.content || '{}')
      const prompts = result.prompts || []
      
      // Ensure all prompts start with trigger phrase
      return prompts.map((prompt: string) => {
        if (!prompt.startsWith(triggerPhrase)) {
          return `${triggerPhrase}, ${prompt}`
        }
        return prompt
      })
    } catch (error) {
      console.error('Batch prompt generation error:', error)
      
      // Fallback: generate variations manually
      const baseConfig = this.generatePersonaThumbnailPrompt(persona, {
        id: 'fallback',
        title: contentAnalysis.summary || 'Content',
        content_analysis: contentAnalysis
      }, 'youtube')
      
      return [
        baseConfig.basePrompt,
        baseConfig.basePrompt.replace('engaging', 'excited'),
        baseConfig.basePrompt.replace('professional', 'dynamic')
      ]
    }
  }
}
