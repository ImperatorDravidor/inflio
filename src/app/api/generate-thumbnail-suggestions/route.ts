import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Fetch project with transcript and content analysis
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      console.error('Project fetch error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const contentAnalysis = project.content_analysis || {}
    const keywords = contentAnalysis.keywords || []
    const topics = contentAnalysis.topics || []
    const summary = contentAnalysis.summary || ''
    const keyMoments = contentAnalysis.keyMoments || []
    const sentiment = contentAnalysis.sentiment || 'neutral'

    // Build context for AI
    const contextPrompt = `
Video Title: ${project.title}
Content Summary: ${summary}
Main Topics: ${topics.join(', ')}
Keywords: ${keywords.join(', ')}
Sentiment: ${sentiment}
Key Moments: ${keyMoments.slice(0, 3).map((m: any) => m.description).join('; ')}
`

    // Generate thumbnail suggestions using GPT-4.1
    const openai = getOpenAI()
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `You are an expert YouTube thumbnail designer who creates viral, high-CTR thumbnails like MrBeast, MKBHD, and top creators. You understand that thumbnails with faces get 38% more clicks, and that the creator's face should be prominent. Always assume the creator will merge their face into the thumbnail.`
        },
        {
          role: 'user',
          content: `${contextPrompt}

Generate 5 HIGH-CONVERTING YouTube thumbnail concepts. Remember: The creator's FACE will be prominently featured in EVERY thumbnail.

For each concept, provide:

1. A detailed prompt that ALWAYS includes:
   - Specific facial expression (shocked, excited, confused, laughing, concerned, etc.)
   - Face position and size (30-50% of frame)
   - Hand gestures or body language
   - Background elements and composition
   - Text placement that doesn't cover the face
   
2. The psychological trigger (curiosity gap, FOMO, shock value, etc.)
3. Target audience mindset
4. Text overlay (2-5 words MAX, huge readable font)
5. Color psychology (contrasting, saturated colors)
6. Viral score (1-10)

Study these viral patterns:
- MrBeast: Shocked face + impossible scenario + huge text
- MKBHD: Confident expression + product + minimal text
- Emma Chamberlain: Relatable expression + lifestyle setting
- Yes Theory: Excited/scared face + adventure backdrop
- Graham Stephan: Concerned face + money/finance visual

CRITICAL: Every prompt MUST specify:
- EXACT facial expression
- Where the face is positioned
- What the person is doing/pointing at
- Text that creates curiosity without giving away everything

Output as JSON with "suggestions" array. Each suggestion must make someone STOP SCROLLING and CLICK.`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const aiResponse = completion.choices[0].message.content
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    let suggestions
    try {
      const parsed = JSON.parse(aiResponse)
      suggestions = parsed.suggestions || parsed.thumbnails || parsed
      
      // Ensure it's an array
      if (!Array.isArray(suggestions)) {
        suggestions = [suggestions]
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      throw new Error('Invalid AI response format')
    }

    // Process and enhance suggestions
    const enhancedSuggestions = suggestions.map((suggestion: any, index: number) => ({
      id: `ai-suggestion-${index}`,
      prompt: suggestion.prompt || '',
      emotion: suggestion.emotion || 'engaging',
      audience: suggestion.audience || 'general',
      style: mapToValidStyle(suggestion.style),
      textOverlay: suggestion.textOverlay || '',
      colorScheme: suggestion.colorScheme || 'vibrant',
      clickabilityScore: suggestion.clickabilityScore || 7,
      rationale: suggestion.rationale || 'AI-optimized for engagement',
      timestamp: new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      suggestions: enhancedSuggestions.slice(0, 5), // Ensure max 5 suggestions
      metadata: {
        projectTitle: project.title,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4.1-2025-04-14'
      }
    })

  } catch (error) {
    console.error('Thumbnail suggestion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate thumbnail suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Map AI suggested styles to valid FAL AI styles
function mapToValidStyle(aiStyle: string): string {
  const styleMap: Record<string, string> = {
    'realistic': 'photorealistic',
    'photo': 'photorealistic',
    'illustrated': 'flat-design',
    'cartoon': 'flat-design',
    'modern': 'gradient',
    'corporate': 'corporate',
    'professional': 'corporate',
    'tech': 'cyberpunk',
    'futuristic': 'cyberpunk',
    'colorful': 'gradient',
    'vibrant': 'gradient'
  }
  
  const normalizedStyle = aiStyle?.toLowerCase() || 'gradient'
  
  // Check if it's already a valid style
  const validStyles = ['photorealistic', 'corporate', 'gradient', 'flat-design', 'cyberpunk']
  if (validStyles.includes(normalizedStyle)) {
    return normalizedStyle
  }
  
  // Try to find a mapping
  for (const [key, value] of Object.entries(styleMap)) {
    if (normalizedStyle.includes(key)) {
      return value
    }
  }
  
  return 'photorealistic' // Default fallback for YouTube thumbnails
} 