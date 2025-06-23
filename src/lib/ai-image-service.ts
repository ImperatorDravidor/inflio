import { getOpenAI } from './openai'
import { ContentAnalysis } from './ai-content-service'

export interface ImageSuggestion {
  id: string
  prompt: string
  type: 'quote' | 'visual' | 'carousel' | 'infographic' | 'thumbnail'
  style?: string
  description: string
  recommendedSize: string
  recommendedQuality: 'low' | 'medium' | 'high'
}

export const predefinedStyles = [
  { id: 'photorealistic', name: 'Photorealistic', description: 'Ultra-realistic, high-detail photography' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean, simple, modern design' },
  { id: 'watercolor', name: 'Watercolor', description: 'Soft, artistic watercolor painting style' },
  { id: 'flat-design', name: 'Flat Design', description: 'Modern flat design with bold colors' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Futuristic, neon-lit cyberpunk aesthetic' },
  { id: 'vintage', name: 'Vintage', description: 'Retro, nostalgic vintage style' },
  { id: 'corporate', name: 'Corporate', description: 'Professional business presentation style' },
  { id: 'hand-drawn', name: 'Hand Drawn', description: 'Sketch-like hand-drawn illustration' },
  { id: 'gradient', name: 'Gradient', description: 'Modern gradient with vibrant colors' },
  { id: 'isometric', name: 'Isometric', description: '3D isometric design style' },
]

export class AIImageService {
  /**
   * Generate image suggestions based on content analysis
   */
  static async generateImageSuggestions(
    contentAnalysis: ContentAnalysis,
    projectTitle: string
  ): Promise<ImageSuggestion[]> {
    try {
      const openai = getOpenAI()
      
      const systemPrompt = `You are an expert visual content strategist specializing in creating engaging social media graphics and visual content.
Your task is to generate creative image prompts based on video content analysis.
Each prompt should be detailed, visually descriptive, and optimized for AI image generation.`

      const userPrompt = `Based on this video content analysis, generate 6-8 creative image suggestions:

Video Title: ${projectTitle}
Main Topics: ${contentAnalysis.topics.join(', ')}
Keywords: ${contentAnalysis.keywords.join(', ')}
Summary: ${contentAnalysis.summary}
Key Moments: ${contentAnalysis.keyMoments.map(m => m.description).join('; ')}

Generate diverse image suggestions including:
1. Quote graphics (text overlays on backgrounds)
2. Visual representations of key concepts
3. Carousel posts (multi-image series)
4. Infographics
5. Thumbnail images

Return in JSON format:
{
  "suggestions": [
    {
      "prompt": "Detailed image generation prompt",
      "type": "quote|visual|carousel|infographic|thumbnail",
      "description": "What this image will be used for",
      "recommendedSize": "1024x1024|1024x1536|1536x1024",
      "recommendedQuality": "low|medium|high",
      "style": "suggested style keyword"
    }
  ]
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const { suggestions } = JSON.parse(response)
      
      // Add IDs and ensure all fields are present
      return suggestions.map((suggestion: any) => ({
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `suggest-${Date.now()}-${Math.random()}`,
        prompt: suggestion.prompt,
        type: suggestion.type || 'visual',
        style: suggestion.style || '',
        description: suggestion.description || '',
        recommendedSize: suggestion.recommendedSize || '1024x1024',
        recommendedQuality: suggestion.recommendedQuality || 'medium'
      }))
    } catch (error) {
      console.error('Error generating image suggestions:', error)
      
      // Return fallback suggestions
      return AIImageService.generateFallbackSuggestions(contentAnalysis, projectTitle)
    }
  }

  /**
   * Generate enhanced prompt with style
   */
  static enhancePromptWithStyle(basePrompt: string, style: string): string {
    if (!style) return basePrompt
    
    const styleEnhancements: Record<string, string> = {
      'photorealistic': 'ultra-realistic photography, professional lighting, high detail, 8K resolution',
      'minimalist': 'minimal design, clean lines, simple shapes, lots of white space, modern aesthetic',
      'watercolor': 'soft watercolor painting, artistic brushstrokes, flowing colors, dreamy atmosphere',
      'flat-design': 'flat design style, bold colors, no shadows, simple geometric shapes, modern illustration',
      'cyberpunk': 'cyberpunk aesthetic, neon lights, futuristic city, holographic elements, dark atmosphere',
      'vintage': 'vintage style, retro colors, aged texture, nostalgic feel, classic design elements',
      'corporate': 'professional business style, clean layout, corporate colors, modern presentation',
      'hand-drawn': 'hand-drawn sketch style, pencil illustration, artistic linework, organic feel',
      'gradient': 'vibrant gradient background, smooth color transitions, modern design, dynamic flow',
      'isometric': '3D isometric view, geometric shapes, depth and dimension, modern technical illustration'
    }
    
    const enhancement = styleEnhancements[style] || style
    return `${basePrompt}. Style: ${enhancement}`
  }

  /**
   * Fallback suggestions when AI is unavailable
   */
  private static generateFallbackSuggestions(
    contentAnalysis: ContentAnalysis,
    projectTitle: string
  ): ImageSuggestion[] {
    const mainTopic = contentAnalysis.topics[0] || 'content'
    const keyword = contentAnalysis.keywords[0] || 'visual'
    
    return [
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `img-${Date.now()}-1`,
        prompt: `Modern quote graphic with text "${contentAnalysis.keyMoments[0]?.description || projectTitle}" on gradient background`,
        type: 'quote',
        style: 'gradient',
        description: 'Eye-catching quote graphic for social media',
        recommendedSize: '1024x1024',
        recommendedQuality: 'medium'
      },
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `img-${Date.now()}-2`,
        prompt: `Visual representation of ${mainTopic} concept with modern flat design elements`,
        type: 'visual',
        style: 'flat-design',
        description: 'Main concept visualization',
        recommendedSize: '1536x1024',
        recommendedQuality: 'high'
      },
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `img-${Date.now()}-3`,
        prompt: `Professional thumbnail for video about ${projectTitle} with bold text overlay`,
        type: 'thumbnail',
        style: 'corporate',
        description: 'Video thumbnail image',
        recommendedSize: '1536x1024',
        recommendedQuality: 'high'
      },
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `img-${Date.now()}-4`,
        prompt: `Minimalist infographic showing key points about ${keyword}`,
        type: 'infographic',
        style: 'minimalist',
        description: 'Information visualization',
        recommendedSize: '1024x1536',
        recommendedQuality: 'medium'
      }
    ]
  }
} 