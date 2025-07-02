import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { text, maxLength = 200 } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return a mock summary if no API key
      const mockSummary = `This video discusses various topics and presents interesting insights. The content covers multiple aspects that viewers will find valuable and informative. Key points are presented clearly throughout the video.`
      
      return NextResponse.json({ 
        summary: mockSummary,
        mock: true 
      })
    }

    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that creates concise summaries of video transcripts. Create a summary that is approximately ${maxLength} words or less. Focus on the main points and key takeaways.`
        },
        {
          role: "user",
          content: `Please summarize this transcript:\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.'

    return NextResponse.json({ 
      summary,
      mock: false 
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    
    // Fallback to mock summary on error
    const mockSummary = `This video discusses various topics and presents interesting insights. The content covers multiple aspects that viewers will find valuable and informative. Key points are presented clearly throughout the video.`
    
    return NextResponse.json({ 
      summary: mockSummary,
      mock: true,
      error: error instanceof Error ? error.message : 'Failed to generate summary'
    })
  }
} 