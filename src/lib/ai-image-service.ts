import { getOpenAI } from './openai'
import { ContentAnalysis } from './ai-content-service'

<<<<<<< HEAD
export interface ImageSuggestion {
  id: string
  prompt: string
  originalPrompt: string
  type: 'quote' | 'visual' | 'carousel' | 'infographic' | 'thumbnail' | 'concept' | 'hook'
  style?: string
  description: string
  recommendedSize: string
  recommendedQuality: 'low' | 'medium' | 'high'
  contentRelevance: number // 1-10 score of how relevant this is to the content
  keyMomentRef?: string // Reference to specific key moment
  topicRef?: string // Reference to specific topic
  carouselSlides?: number // Number of slides if type is carousel
=======
export interface GenerateImageOptions {
  prompt: string
  style?: 'thumbnail' | 'social' | 'quote' | 'infographic' | 'carousel'
  size?: '1080x1080' | '1920x1080' | '1080x1920' | '1200x630'
  theme?: 'light' | 'dark' | 'auto'
  brandColors?: string[]
  includeText?: boolean
  textOverlay?: string
  context?: {
    projectTitle?: string
    contentType?: string
    platform?: string
    keywords?: string[]
  }
}

export interface ImageSuggestion {
  id: string
  prompt: string
  style: string
  reasoning: string
  estimatedEngagement: number
>>>>>>> 7184e73 (Add new files and configurations for project setup)
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
  { id: 'neon', name: 'Neon', description: 'Bright neon colors with glowing effects' },
  { id: '3d-render', name: '3D Render', description: 'Realistic 3D rendered graphics' },
]

export class AIImageService {
  /**
   * Generate highly specific image suggestions based on content analysis
   */
  static async generateImageSuggestions(
    contentAnalysis: ContentAnalysis,
    projectTitle: string,
    transcriptSample?: string
  ): Promise<ImageSuggestion[]> {
    try {
      const openai = getOpenAI()
      
      // Extract key quotes from key moments for quote graphics
      const impactfulQuotes = contentAnalysis.keyMoments
        .map(moment => moment.description)
        .filter(desc => desc.length > 20 && desc.length < 200)
        .slice(0, 3)

      // Identify visual concepts from topics and keywords
      const visualConcepts = contentAnalysis.topics.slice(0, 5)
      const actionKeywords = contentAnalysis.keywords.filter(keyword => 
        keyword.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(keyword.toLowerCase())
      ).slice(0, 8)

      const systemPrompt = `You are an expert visual content strategist and social media graphic designer.
Your specialty is creating highly specific, engaging visual content that directly connects to video content.
You understand viral social media aesthetics, typography, color psychology, and platform-specific requirements.

Create image prompts that are:
1. HIGHLY SPECIFIC to the actual content (not generic)
2. VISUALLY COMPELLING and scroll-stopping
3. OPTIMIZED for social media engagement
4. TECHNICALLY DETAILED for AI image generation
5. PLATFORM-APPROPRIATE for different use cases

Focus on creating visuals that would make someone stop scrolling and engage with the content.`

      const userPrompt = `Create 8-10 highly specific image suggestions for this video content:

**VIDEO DETAILS:**
Title: "${projectTitle}"
Summary: ${contentAnalysis.summary}

**KEY TOPICS:** ${contentAnalysis.topics.join(', ')}
**ACTIONABLE KEYWORDS:** ${actionKeywords.join(', ')}

**IMPACTFUL MOMENTS:**
${contentAnalysis.keyMoments.map((moment, i) => `${i + 1}. [${moment.timestamp || 'Key moment'}] ${moment.description}`).join('\n')}

**SAMPLE QUOTES FOR GRAPHICS:**
${impactfulQuotes.map((quote, i) => `${i + 1}. "${quote}"`).join('\n')}

**CONTENT ANALYSIS INSIGHTS:**
- Sentiment: ${contentAnalysis.sentiment}
- Main message: ${contentAnalysis.summary.split('.')[0]}
- Target concepts: ${visualConcepts.join(', ')}

Create diverse, scroll-stopping visuals including:

1. **HOOK IMAGES** - Attention-grabbing visuals that make people want to watch
2. **QUOTE GRAPHICS** - Powerful quotes from the video with striking typography
3. **CONCEPT VISUALIZATIONS** - Abstract/metaphorical representations of key ideas
4. **CAROUSEL POSTS** - Multi-slide educational/breakdown content
5. **INFOGRAPHIC ELEMENTS** - Data/process visualization from the content
6. **THUMBNAIL VARIANTS** - Eye-catching video thumbnails with emotion/intrigue

For each suggestion, be extremely specific about:
- Visual elements, composition, lighting
- Typography style and placement
- Color schemes that match the content mood
- Specific objects, scenes, or metaphors to include
- Emotional tone and viewer psychology

Return as JSON:
{
  "suggestions": [
    {
      "prompt": "Extremely detailed, specific prompt for AI image generation",
      "type": "quote|visual|carousel|infographic|thumbnail|concept|hook", 
      "description": "Specific use case and why this visual works",
      "recommendedSize": "1024x1024|1024x1536|1536x1024",
      "recommendedQuality": "medium|high",
      "style": "specific style recommendation",
      "contentRelevance": 9,
      "keyMomentRef": "reference to specific key moment if applicable",
      "topicRef": "reference to specific topic if applicable",
      "carouselSlides": 3
    }
  ]
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const { suggestions } = JSON.parse(response)
      
      // Enhance and validate suggestions
      return suggestions.map((suggestion: any, index: number) => ({
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `suggest-${Date.now()}-${index}`,
        prompt: suggestion.prompt,
<<<<<<< HEAD
        originalPrompt: suggestion.prompt,
        type: suggestion.type || 'visual',
        style: suggestion.style || this.suggestStyleForContent(contentAnalysis),
        description: suggestion.description || 'AI-generated visual content',
        recommendedSize: suggestion.recommendedSize || '1024x1024',
        recommendedQuality: suggestion.recommendedQuality || 'high',
        contentRelevance: suggestion.contentRelevance || 8,
        keyMomentRef: suggestion.keyMomentRef,
        topicRef: suggestion.topicRef,
        carouselSlides: suggestion.carouselSlides
=======
        style: suggestion.style || this.suggestStyleForContent(contentAnalysis),
        reasoning: suggestion.description || 'AI-generated visual content',
        estimatedEngagement: suggestion.contentRelevance ? suggestion.contentRelevance * 10 : 80
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      }))
    } catch (error) {
      console.error('Error generating image suggestions:', error)
      
      // Return enhanced fallback suggestions
      return AIImageService.generateContentAwareFallbacks(contentAnalysis, projectTitle)
    }
  }

  /**
   * Suggest optimal style based on content analysis
   */
  private static suggestStyleForContent(contentAnalysis: ContentAnalysis): string {
    const sentiment = contentAnalysis.sentiment
    const topics = contentAnalysis.topics.join(' ').toLowerCase()
    
    if (topics.includes('business') || topics.includes('professional') || topics.includes('corporate')) {
      return 'corporate'
    }
    if (topics.includes('tech') || topics.includes('innovation') || topics.includes('future')) {
      return 'cyberpunk'
    }
    if (topics.includes('creative') || topics.includes('art') || topics.includes('design')) {
      return 'watercolor'
    }
    if (sentiment === 'positive' && topics.includes('lifestyle')) {
      return 'gradient'
    }
    if (topics.includes('education') || topics.includes('tutorial')) {
      return 'flat-design'
    }
    
    return 'minimalist' // Safe default
  }

  /**
   * Generate content-aware fallback suggestions
   */
  private static generateContentAwareFallbacks(
    contentAnalysis: ContentAnalysis,
    projectTitle: string
  ): ImageSuggestion[] {
    const mainTopic = contentAnalysis.topics[0] || 'content'
    const primaryKeyword = contentAnalysis.keywords[0] || 'concept'
    const keyMoment = contentAnalysis.keyMoments[0]
    
    return [
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `fallback-${Date.now()}-1`,
        prompt: `Split-screen composition: left side shows "${keyMoment?.description || 'key insight'}" as bold, modern typography in white text on dark background, right side features abstract geometric visualization of ${mainTopic} concept with vibrant gradient colors, professional lighting, 4K quality`,
<<<<<<< HEAD
        originalPrompt: `Split-screen quote and concept visualization`,
        type: 'quote',
        style: 'gradient',
        description: `Powerful quote graphic featuring key insight from the video about ${mainTopic}`,
        recommendedSize: '1024x1024',
        recommendedQuality: 'high',
        contentRelevance: 9,
        keyMomentRef: keyMoment?.description,
        topicRef: mainTopic
=======
        style: 'gradient',
        reasoning: `Powerful quote graphic featuring key insight from the video about ${mainTopic}`,
        estimatedEngagement: 90
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      },
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `fallback-${Date.now()}-2`,
        prompt: `Cinematic hero shot of ${primaryKeyword} visualization: photorealistic scene featuring modern ${mainTopic} concept, dramatic lighting with warm golden hour glow, shallow depth of field, professional composition, inspiring and aspirational mood, ultra-high detail`,
<<<<<<< HEAD
        originalPrompt: `Hero visualization of main concept`,
        type: 'concept',
        style: 'photorealistic',
        description: `Stunning hero image that embodies the core message about ${mainTopic}`,
        recommendedSize: '1536x1024',
        recommendedQuality: 'high',
        contentRelevance: 10,
        topicRef: mainTopic
=======
        style: 'photorealistic',
        reasoning: `Stunning hero image that embodies the core message about ${mainTopic}`,
        estimatedEngagement: 95
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      },
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `fallback-${Date.now()}-3`,
        prompt: `YouTube thumbnail design: close-up of expressive face showing ${contentAnalysis.sentiment} emotion, bold text overlay "${projectTitle.split(' ').slice(0, 3).join(' ')}" in eye-catching font, bright contrasting colors, high energy composition, optimized for mobile viewing`,
<<<<<<< HEAD
        originalPrompt: `Engaging video thumbnail`,
        type: 'thumbnail',
        style: 'corporate',
        description: `Click-worthy thumbnail that conveys the video's emotional impact`,
        recommendedSize: '1536x1024',
        recommendedQuality: 'high',
        contentRelevance: 8
=======
        style: 'corporate',
        reasoning: `Click-worthy thumbnail that conveys the video's emotional impact`,
        estimatedEngagement: 80
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      },
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `fallback-${Date.now()}-4`,
        prompt: `Educational carousel slide 1 of 3: clean infographic layout showing "Key Insights About ${mainTopic}" with three main points as large, readable text blocks, modern flat design icons, consistent brand colors, Instagram-optimized dimensions`,
<<<<<<< HEAD
        originalPrompt: `Educational carousel series`,
        type: 'carousel',
        style: 'flat-design',
        description: `Multi-slide educational content breaking down key concepts`,
        recommendedSize: '1024x1024',
        recommendedQuality: 'medium',
        contentRelevance: 9,
        carouselSlides: 3,
        topicRef: mainTopic
=======
        style: 'flat-design',
        reasoning: `Multi-slide educational content breaking down key concepts`,
        estimatedEngagement: 85
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      },
      {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : `fallback-${Date.now()}-5`,
        prompt: `Attention-grabbing hook image: split composition showing "before vs after" or "problem vs solution" related to ${primaryKeyword}, use contrasting warm and cool tones, add subtle motion blur effects, include text overlay "You won't believe what happens next", designed to stop infinite scroll`,
<<<<<<< HEAD
        originalPrompt: `Scroll-stopping hook image`,
        type: 'hook',
        style: 'gradient',
        description: `Irresistible hook image designed to maximize engagement and clicks`,
        recommendedSize: '1024x1024',
        recommendedQuality: 'high',
        contentRelevance: 8
=======
        style: 'gradient',
        reasoning: `Irresistible hook image designed to maximize engagement and clicks`,
        estimatedEngagement: 75
>>>>>>> 7184e73 (Add new files and configurations for project setup)
      }
    ]
  }

  /**
   * Generate enhanced prompt with style and technical details
   */
  static enhancePromptWithStyle(basePrompt: string, style: string, quality: string = 'medium'): string {
    if (!style) return basePrompt
    
    const styleEnhancements: Record<string, string> = {
      'photorealistic': 'photorealistic, professional photography, studio lighting, 85mm lens, shallow depth of field, ultra-sharp details, 8K resolution, camera raw',
      'minimalist': 'minimal design, clean composition, lots of negative space, simple geometric shapes, modern typography, subtle shadows, premium feel',
      'watercolor': 'watercolor painting style, soft brushstrokes, organic color blending, artistic texture, dreamy atmosphere, hand-painted feel, paper texture',
      'flat-design': 'flat design, bold solid colors, no gradients, simple shapes, modern icons, clean typography, Google Material Design inspired',
      'cyberpunk': 'cyberpunk aesthetic, neon lighting, holographic elements, futuristic city, purple and cyan color scheme, high tech atmosphere, digital effects',
      'vintage': 'vintage aesthetic, retro color grading, aged paper texture, classic typography, nostalgic mood, film grain, warm sepia tones',
      'corporate': 'professional business style, clean layout, modern corporate aesthetic, blue and gray color scheme, premium materials, sophisticated lighting',
      'hand-drawn': 'hand-drawn illustration, pencil sketch style, organic linework, artistic imperfections, creative energy, sketch book texture',
      'gradient': 'vibrant gradient backgrounds, smooth color transitions, modern design, dynamic flow, Instagram-worthy aesthetic, trendy colors',
      'isometric': '3D isometric view, technical illustration, precise geometric shapes, depth and dimension, modern tech aesthetic, clean angles',
      'neon': 'bright neon colors, glowing effects, electric atmosphere, vibrant luminosity, dark background contrast, futuristic energy',
      '3d-render': 'realistic 3D render, ray tracing, global illumination, photorealistic materials, cinema 4D style, professional lighting setup'
    }
    
    const qualityEnhancements: Record<string, string> = {
      'low': 'clean composition, good lighting',
      'medium': 'high quality, professional composition, excellent lighting, sharp details',
      'high': 'ultra-high quality, masterpiece composition, studio lighting, razor-sharp details, award-winning photography, perfect composition'
    }
    
    const styleEnhancement = styleEnhancements[style] || style
    const qualityEnhancement = qualityEnhancements[quality] || qualityEnhancements['medium']
    
    return `${basePrompt}. Style: ${styleEnhancement}. Quality: ${qualityEnhancement}. Composition: rule of thirds, visual hierarchy, balanced elements.`
  }

  /**
   * Generate carousel prompts for multi-slide content
   */
  static generateCarouselPrompts(baseSuggestion: ImageSuggestion, slideCount: number = 3): string[] {
    const prompts: string[] = []
    
    for (let i = 1; i <= slideCount; i++) {
      let slidePrompt = baseSuggestion.prompt
      
      switch (i) {
        case 1:
          slidePrompt = slidePrompt.replace('slide 1 of 3', `slide ${i} of ${slideCount}: Introduction/Hook`)
          break
        case 2:
          slidePrompt = slidePrompt.replace('slide 1 of 3', `slide ${i} of ${slideCount}: Main Content/Details`)
          break
        case 3:
          slidePrompt = slidePrompt.replace('slide 1 of 3', `slide ${i} of ${slideCount}: Conclusion/Call-to-Action`)
          break
        default:
          slidePrompt = slidePrompt.replace('slide 1 of 3', `slide ${i} of ${slideCount}`)
      }
      
      prompts.push(slidePrompt)
    }
    
    return prompts
  }
<<<<<<< HEAD
=======

  static async generateEnhancedImage(options: GenerateImageOptions): Promise<string> {
    try {
      // Enhance prompt based on style and context
      let enhancedPrompt = options.prompt
      
      // Add style-specific enhancements
      switch (options.style) {
        case 'thumbnail':
          enhancedPrompt = `Create an eye-catching YouTube/video thumbnail: ${options.prompt}. Bold text, high contrast, photorealistic elements, vibrant colors.`
          break
        case 'social':
          enhancedPrompt = `Design a modern social media image: ${options.prompt}. Clean, minimalist, engaging, perfect for ${options.context?.platform || 'Instagram'}.`
          break
        case 'quote':
          enhancedPrompt = `Create a beautiful quote image: ${options.prompt}. Elegant typography, inspiring background, readable text.`
          break
        case 'infographic':
          enhancedPrompt = `Design a clear infographic: ${options.prompt}. Data visualization, clean layout, easy to understand.`
          break
        case 'carousel':
          enhancedPrompt = `Create a carousel slide image: ${options.prompt}. Consistent design, numbered slide, part of a series.`
          break
      }
      
      // Add platform-specific requirements
      if (options.context?.platform) {
        const platformStyles: Record<string, string> = {
          instagram: 'Instagram-optimized, square format, visually stunning',
          linkedin: 'Professional, business-appropriate, informative',
          twitter: 'Eye-catching, works in feed, high contrast',
          tiktok: 'Trendy, youth-oriented, vertical format'
        }
        
        enhancedPrompt += `. ${platformStyles[options.context.platform] || ''}`
      }
      
      // Add brand colors if provided
      if (options.brandColors && options.brandColors.length > 0) {
        enhancedPrompt += `. Use brand colors: ${options.brandColors.join(', ')}`
      }
      
      // Generate the image
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          count: 1,
          size: options.size || '1080x1080',
          quality: 'hd'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate image')
      }
      
      const data = await response.json()
      return data.urls[0]
      
    } catch (error) {
      console.error('Error generating enhanced image:', error)
      throw error
    }
  }

  static async generateSmartImageSuggestions(
    content: string,
    contentType: 'clip' | 'blog' | 'social',
    context?: any
  ): Promise<ImageSuggestion[]> {
    try {
      const response = await fetch('/api/generate-unified-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          contentType,
          context,
          requestType: 'image-suggestions'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }
      
      const suggestions = await response.json()
      
      // Process and rank suggestions
      return suggestions.map((s: any, index: number) => ({
        id: `suggestion-${index}`,
        prompt: s.prompt,
        style: s.style || 'social',
        reasoning: s.reasoning || 'AI-optimized for engagement',
        estimatedEngagement: s.score || (5 - index) * 20
      }))
      
    } catch (error) {
      console.error('Error generating image suggestions:', error)
      // Return default suggestions
      return [
        {
          id: 'default-1',
          prompt: `Modern social media graphic featuring key points from: ${content.slice(0, 50)}...`,
          style: 'social',
          reasoning: 'Clean design that highlights main message',
          estimatedEngagement: 75
        },
        {
          id: 'default-2',
          prompt: `Eye-catching thumbnail with bold text overlay for: ${content.slice(0, 50)}...`,
          style: 'thumbnail',
          reasoning: 'High-contrast design for maximum visibility',
          estimatedEngagement: 65
        }
      ]
    }
  }

  static async generateImageFromText(
    text: string,
    style: 'quote' | 'key-points' | 'visual-metaphor' = 'quote'
  ): Promise<string> {
    try {
      let prompt = ''
      
      switch (style) {
        case 'quote':
          // Extract key quote or create one
          const keyPhrase = this.extractKeyPhrase(text)
          prompt = `Beautiful quote card with text "${keyPhrase}" on an inspiring background, modern typography, social media ready`
          break
          
        case 'key-points':
          // Extract bullet points
          const points = this.extractKeyPoints(text)
          prompt = `Clean infographic showing ${points.length} key points: ${points.join(', ')}. Modern design, easy to read`
          break
          
        case 'visual-metaphor':
          // Generate visual representation
          const concept = this.extractMainConcept(text)
          prompt = `Abstract visual metaphor representing "${concept}". Artistic, thought-provoking, suitable for social media`
          break
      }
      
      return await this.generateEnhancedImage({
        prompt,
        style: style === 'quote' ? 'quote' : 'infographic',
        size: '1080x1080'
      })
      
    } catch (error) {
      console.error('Error generating image from text:', error)
      throw error
    }
  }

  static async createCarouselImages(
    content: string[],
    theme: string,
    brandColors?: string[]
  ): Promise<string[]> {
    try {
      const images: string[] = []
      
      for (let i = 0; i < content.length; i++) {
        const image = await this.generateEnhancedImage({
          prompt: `Carousel slide ${i + 1}/${content.length}: ${content[i]}. Consistent design theme: ${theme}`,
          style: 'carousel',
          size: '1080x1080',
          brandColors,
          includeText: true,
          textOverlay: `${i + 1}/${content.length}`
        })
        
        images.push(image)
      }
      
      return images
      
    } catch (error) {
      console.error('Error creating carousel images:', error)
      throw error
    }
  }

  // Helper methods
  private static extractKeyPhrase(text: string): string {
    // Simple extraction - in production, use NLP
    const sentences = text.split(/[.!?]/).filter(s => s.trim())
    const shortest = sentences.reduce((a, b) => 
      a.length < b.length && a.length > 20 ? a : b
    )
    return shortest.trim().slice(0, 60) + '...'
  }

  private static extractKeyPoints(text: string): string[] {
    // Extract main points - in production, use NLP
    const sentences = text.split(/[.!?]/).filter(s => s.trim())
    return sentences
      .slice(0, 3)
      .map(s => s.trim().slice(0, 40) + '...')
  }

  private static extractMainConcept(text: string): string {
    // Extract main concept - in production, use NLP
    const words = text.toLowerCase().split(/\s+/)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']
    const significantWords = words.filter(w => 
      !commonWords.includes(w) && w.length > 4
    )
    return significantWords.slice(0, 3).join(' ')
  }
>>>>>>> 7184e73 (Add new files and configurations for project setup)
} 