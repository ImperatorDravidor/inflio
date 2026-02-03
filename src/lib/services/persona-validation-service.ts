import { getOpenAI } from '@/lib/openai'
import { ContentAnalysis } from '@/lib/ai-content-service'

export interface PhotoAnalysis {
  quality: 'excellent' | 'good' | 'needs_improvement'
  feedback: string[]
  suggestions: string[]
  readyForTraining: boolean
  scores: {
    lighting: number
    consistency: number
    variety: number
    clarity: number
    overall: number
  }
}

export interface PersonaPreview {
  thumbnailConcepts: string[]
  socialPostConcepts: string[]
  potentialIssues: string[]
  recommendations: string[]
}

export interface UserFeedbackAnalysis {
  shouldProceed: boolean
  recommendations: string[]
  suggestedActions: string[]
}

export class PersonaValidationService {
  /**
   * Analyze uploaded photos for LoRA training quality using GPT-5
   * Per user preference: Using GPT-5 with default temperature (1.0)
   */
  static async analyzePersonaPhotos(
    photos: string[],
    personaName?: string
  ): Promise<PhotoAnalysis> {
    try {
      const openai = getOpenAI()
      
      const systemPrompt = `You are an expert in AI portrait training, specifically for LoRA model fine-tuning.
Analyze the provided photos for training quality and provide specific, actionable feedback.
Focus on factors that affect LoRA training success: consistency, variety, lighting, and clarity.`

      const userPrompt = `Analyze these ${photos.length} photos for AI persona training${personaName ? ` for ${personaName}` : ''}.
      
Check for:
1. Facial consistency - Are these all the same person?
2. Lighting quality - Is lighting even and professional?
3. Angle variety - Do we have different angles (front, 3/4 profiles)?
4. Background consistency - Are backgrounds simple and consistent?
5. Expression variety - Natural range of expressions?
6. Image clarity - Sharp focus on face?
7. Training readiness - Will these produce a good LoRA model?

Provide scores (0-1) and specific feedback.

Return JSON:
{
  "quality": "excellent|good|needs_improvement",
  "readyForTraining": true/false,
  "scores": {
    "lighting": 0.0-1.0,
    "consistency": 0.0-1.0,
    "variety": 0.0-1.0,
    "clarity": 0.0-1.0,
    "overall": 0.0-1.0
  },
  "feedback": [
    "Specific observation 1",
    "Specific observation 2"
  ],
  "suggestions": [
    "Actionable improvement 1",
    "Actionable improvement 2"
  ]
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 500,
        temperature: 1.0, // GPT-5 only supports default temperature
        response_format: { type: 'json_object' }
      })
      
      const result = JSON.parse(completion.choices[0].message.content || '{}')
      
      return {
        quality: result.quality || 'needs_improvement',
        feedback: result.feedback || ['Unable to analyze photos'],
        suggestions: result.suggestions || [],
        readyForTraining: result.readyForTraining || false,
        scores: result.scores || {
          lighting: 0,
          consistency: 0,
          variety: 0,
          clarity: 0,
          overall: 0
        }
      }
    } catch (error) {
      console.error('Photo analysis error:', error)
      
      // Fallback to basic analysis
      return {
        quality: photos.length >= 5 ? 'good' : 'needs_improvement',
        feedback: ['Analysis service temporarily unavailable'],
        suggestions: photos.length < 5 
          ? [`Add ${5 - photos.length} more photos for training`]
          : ['Photos look ready for training'],
        readyForTraining: photos.length >= 5,
        scores: {
          lighting: 0.7,
          consistency: 0.7,
          variety: 0.7,
          clarity: 0.7,
          overall: 0.7
        }
      }
    }
  }

  /**
   * Generate preview descriptions for how the persona will look in content
   */
  static async generatePersonaPreview(
    personaName: string,
    photos: string[],
    contentContext?: string
  ): Promise<PersonaPreview> {
    try {
      const openai = getOpenAI()
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'Generate preview concepts for how this persona will appear in AI-generated content. Be specific and visual.'
          },
          {
            role: 'user',
            content: `Based on ${photos.length} photos of ${personaName}, describe how they will appear in generated content.
            ${contentContext ? `Content context: ${contentContext}` : ''}
            
Provide:
1. 3 YouTube thumbnail concepts (visual descriptions)
2. 3 social media post concepts (how they'll appear)
3. Any potential issues to address before training
4. Recommendations for best results

Return JSON:
{
  "thumbnailConcepts": [
    "Detailed visual description 1",
    "Detailed visual description 2",
    "Detailed visual description 3"
  ],
  "socialPostConcepts": [
    "Social appearance description 1",
    "Social appearance description 2",
    "Social appearance description 3"
  ],
  "potentialIssues": ["Issue 1", "Issue 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`
          }
        ],
        max_completion_tokens: 800,
        temperature: 1.0,
        response_format: { type: 'json_object' }
      })
      
      const result = JSON.parse(completion.choices[0].message.content || '{}')
      
      return {
        thumbnailConcepts: result.thumbnailConcepts || [
          `${personaName} with engaging expression in professional setting`,
          `${personaName} with dynamic pose and vibrant background`,
          `${personaName} in close-up with text overlay space`
        ],
        socialPostConcepts: result.socialPostConcepts || [
          `${personaName} in lifestyle setting with natural lighting`,
          `${personaName} in professional headshot style`,
          `${personaName} in creative artistic composition`
        ],
        potentialIssues: result.potentialIssues || [],
        recommendations: result.recommendations || []
      }
    } catch (error) {
      console.error('Preview generation error:', error)
      
      // Fallback previews
      return {
        thumbnailConcepts: [
          `${personaName} featured prominently in YouTube thumbnail`,
          `${personaName} with professional appearance`,
          `${personaName} in engaging pose`
        ],
        socialPostConcepts: [
          `${personaName} in social media style`,
          `${personaName} with brand consistency`,
          `${personaName} in various contexts`
        ],
        potentialIssues: [],
        recommendations: ['Photos are ready for training']
      }
    }
  }

  /**
   * Process user feedback and determine next steps
   */
  static async processUserFeedback(
    feedback: string,
    selectedIssues: string[],
    currentPhotos: number
  ): Promise<UserFeedbackAnalysis> {
    try {
      const openai = getOpenAI()
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'Analyze user feedback about their persona photos and provide recommendations.'
          },
          {
            role: 'user',
            content: `User feedback about persona photos:
Issues selected: ${selectedIssues.join(', ')}
Additional feedback: "${feedback}"
Current photo count: ${currentPhotos}

Should they proceed with training or upload different photos?
What specific actions should they take?

Return JSON:
{
  "shouldProceed": true/false,
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2"],
  "suggestedActions": ["Action 1", "Action 2"]
}`
          }
        ],
        max_completion_tokens: 300,
        temperature: 1.0,
        response_format: { type: 'json_object' }
      })
      
      const result = JSON.parse(completion.choices[0].message.content || '{}')
      
      return {
        shouldProceed: result.shouldProceed || false,
        recommendations: result.recommendations || [],
        suggestedActions: result.suggestedActions || []
      }
    } catch (error) {
      console.error('Feedback processing error:', error)
      
      // Fallback logic
      const hasSeriousIssues = selectedIssues.includes("Doesn't look like me") || 
                              selectedIssues.includes("Quality issues")
      
      return {
        shouldProceed: !hasSeriousIssues && currentPhotos >= 5,
        recommendations: hasSeriousIssues 
          ? ['Consider uploading new photos with better quality']
          : ['Photos are acceptable for training'],
        suggestedActions: hasSeriousIssues
          ? ['Take photos in better lighting', 'Ensure face is clearly visible']
          : ['Proceed with training']
      }
    }
  }

  /**
   * Generate sample validation prompts for preview images
   * IMPORTANT: All prompts MUST require appropriate clothing
   */
  static async generateSamplePrompts(
    personaName: string,
    style: string
  ): Promise<string[]> {
    try {
      const openai = getOpenAI()

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: `Generate diverse preview prompts for persona samples.
CRITICAL REQUIREMENT: Every prompt MUST explicitly include that the person is wearing appropriate clothing (shirt, business attire, casual wear, etc.).
Never generate prompts that could result in inappropriate or unclothed images.`
          },
          {
            role: 'user',
            content: `Create 5 different prompts for generating preview samples of ${personaName} in ${style} style.
Each prompt should show a different use case or context.
IMPORTANT: Every prompt MUST include specific clothing (e.g., "wearing a professional suit", "wearing a casual t-shirt", "wearing a business shirt").

Return JSON:
{
  "prompts": [
    "Detailed prompt 1 with clothing specified",
    "Detailed prompt 2 with clothing specified",
    "Detailed prompt 3 with clothing specified",
    "Detailed prompt 4 with clothing specified",
    "Detailed prompt 5 with clothing specified"
  ]
}`
          }
        ],
        max_completion_tokens: 400,
        temperature: 1.0,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')
      // Ensure all prompts have clothing requirement
      const clothingCheck = 'wearing appropriate clothing, fully clothed'
      const prompts = (result.prompts || []).map((p: string) => {
        if (!p.toLowerCase().includes('wearing')) {
          return `${p}, ${clothingCheck}`
        }
        return p
      })
      return prompts
    } catch (error) {
      console.error('Sample prompt generation error:', error)

      // Fallback prompts - all explicitly include clothing
      return [
        `professional headshot of ${personaName}, wearing business suit or dress shirt, ${style} style, high quality`,
        `casual portrait of ${personaName}, wearing casual t-shirt or sweater, ${style} style, natural lighting`,
        `${personaName} in YouTube thumbnail style, wearing branded hoodie or shirt, ${style} aesthetic`,
        `social media profile photo of ${personaName}, wearing smart casual attire, ${style} style`,
        `creative artistic portrait of ${personaName}, wearing stylish outfit, ${style} mood`
      ]
    }
  }
}
