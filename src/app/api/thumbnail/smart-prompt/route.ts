import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOpenAI } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      projectTitle,
      projectContext,
      transcript,
      platform,
      style
    } = body

    const openai = getOpenAI()

    // Analyze content for key themes
    const contentAnalysis = await analyzeContent(
      projectTitle,
      projectContext,
      transcript,
      openai
    )

    // Generate smart suggestions based on analysis
    const suggestions = await generateSmartSuggestions(
      contentAnalysis,
      platform,
      style,
      openai
    )

    return NextResponse.json({
      success: true,
      suggestions,
      analysis: contentAnalysis
    })

  } catch (error) {
    console.error('Smart prompt error:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart prompts' },
      { status: 500 }
    )
  }
}

async function analyzeContent(
  title: string,
  context: any,
  transcript: string,
  openai: any
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Analyze video content to extract key themes, emotions, and visual elements for thumbnail creation.'
        },
        {
          role: 'user',
          content: `Title: ${title}
          Context: ${JSON.stringify(context || {})}
          Transcript excerpt: ${transcript || 'Not provided'}
          
          Extract:
          1. Main topics (3-5)
          2. Key emotions/mood
          3. Visual elements to highlight
          4. Target audience characteristics
          
          Output as JSON.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Content analysis error:', error)
    return {
      topics: [],
      emotions: [],
      visualElements: [],
      audience: []
    }
  }
}

async function generateSmartSuggestions(
  analysis: any,
  platform: string,
  style: string,
  openai: any
) {
  const categories = [
    {
      category: 'Composition',
      focus: 'Layout and framing suggestions'
    },
    {
      category: 'Visual Elements',
      focus: 'Specific objects, scenes, or concepts to include'
    },
    {
      category: 'Mood & Style',
      focus: 'Emotional tone and artistic direction'
    },
    {
      category: 'Text & Typography',
      focus: 'Text placement and style suggestions'
    },
    {
      category: 'Color Palette',
      focus: 'Color schemes and combinations'
    }
  ]

  const suggestions = []

  for (const cat of categories) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Generate thumbnail prompt suggestions for ${cat.category}. Platform: ${platform}, Style: ${style}`
          },
          {
            role: 'user',
            content: `Analysis: ${JSON.stringify(analysis)}
            Focus: ${cat.focus}
            
            Generate 3-4 specific, actionable prompt additions.
            Output as JSON array of strings.`
          }
        ],
        temperature: 0.8,
        max_tokens: 150,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      suggestions.push({
        category: cat.category,
        suggestions: result.suggestions || []
      })
    } catch (error) {
      console.error(`Error generating ${cat.category} suggestions:`, error)
    }
  }

  return suggestions
}