import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, type, variants = 2 } = await request.json()

    if (!content || !type) {
      return NextResponse.json(
        { error: 'Missing content or type' },
        { status: 400 }
      )
    }

    const contentString = typeof content === 'string' 
      ? content 
      : JSON.stringify(content)

    const prompt = `Generate ${variants} different variations of the following ${type} content for A/B testing.
    
    Original content: ${contentString}
    
    Create ${variants} distinct versions that:
    1. Maintain the core message
    2. Use different hooks, CTAs, or emotional appeals
    3. Vary in tone (professional, casual, urgent, etc.)
    4. Test different content structures
    5. Include different hashtags or keywords
    
    Each variant should be optimized for engagement but test different approaches.
    
    Return as a JSON object with an array called "variants", where each variant has:
    - content: the variation text
    - approach: brief description of the testing approach
    - hypothesis: what we're testing with this variant`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert in social media A/B testing and content optimization.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8, // Higher temperature for more variation
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    const generatedVariants = result.variants || []

    // Ensure we have the requested number of variants
    while (generatedVariants.length < variants) {
      generatedVariants.push({
        content: contentString,
        approach: 'Control variant',
        hypothesis: 'Original content as baseline'
      })
    }

    return NextResponse.json({
      success: true,
      variants: generatedVariants.slice(0, variants),
      originalContent: content,
      type,
      testingTips: [
        'Run each variant for at least 48 hours',
        'Ensure similar posting times for fair comparison',
        'Track engagement metrics: likes, comments, shares, saves',
        'Consider audience segments when analyzing results'
      ]
    })

  } catch (error) {
    console.error('Error generating A/B variants:', error)
    return NextResponse.json(
      { error: 'Failed to generate A/B variants' },
      { status: 500 }
    )
  }
} 