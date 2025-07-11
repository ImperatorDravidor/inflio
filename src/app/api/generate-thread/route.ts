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

    const { content, title, platform = 'twitter' } = await request.json()

    if (!content || !title) {
      return NextResponse.json(
        { error: 'Missing content or title' },
        { status: 400 }
      )
    }

    const maxLength = platform === 'twitter' ? 280 : 3000 // Twitter vs LinkedIn
    const platformName = platform === 'twitter' ? 'Twitter' : 'LinkedIn'

    const prompt = `Convert the following content into an engaging ${platformName} thread.
    
    Title: ${title}
    Content: ${content}
    
    Rules:
    1. Each part must be under ${maxLength} characters
    2. Start with a strong hook
    3. End each part with a reason to keep reading (except the last)
    4. Include relevant hashtags at the end
    5. Make it engaging and conversational
    6. Number each part (1/n, 2/n, etc.)
    
    Return the thread as a JSON array of strings, each representing one part.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert social media content creator who specializes in creating viral threads.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    const thread = result.thread || []

    // Validate thread parts length
    const validatedThread = thread.map((part: string) => {
      if (part.length > maxLength) {
        // Truncate if too long
        return part.substring(0, maxLength - 3) + '...'
      }
      return part
    })

    return NextResponse.json({
      success: true,
      thread: validatedThread,
      platform,
      totalParts: validatedThread.length,
      estimatedReadTime: Math.ceil(content.split(' ').length / 200), // minutes
      hashtags: extractHashtags(validatedThread.join(' '))
    })
  } catch (error) {
    console.error('Error generating thread:', error)
    return NextResponse.json(
      { error: 'Failed to generate thread' },
      { status: 500 }
    )
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#\w+/g
  const matches = text.match(hashtagRegex) || []
  return [...new Set(matches)] // Remove duplicates
} 