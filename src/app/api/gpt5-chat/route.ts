import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GPT5Service } from '@/lib/gpt5-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Analyze context and generate appropriate response
    const contextString = `
User: ${context?.userName || 'User'}
Completed Steps: ${context?.completedSteps?.join(', ') || 'None'}
Current Step: ${context?.currentStep || 'Getting Started'}

The user is setting up their Inflio account, an AI-powered content creation platform.
Help them through the onboarding process and answer any questions about features.
Be encouraging, helpful, and concise.
`

    const fullPrompt = `${contextString}\n\nUser question: ${message}\n\nProvide a helpful, friendly response:`

    // Call GPT-5 with appropriate settings for conversational UI
    const response = await GPT5Service.chat(fullPrompt, {
      reasoning: { effort: 'low' },
      text: { verbosity: 'medium' }
    })

    return NextResponse.json({ 
      response: response.output_text,
      tokens: {
        input: response.input_tokens,
        output: response.output_tokens,
        reasoning: response.reasoning_tokens
      }
    })
  } catch (error) {
    console.error('GPT-5 chat error:', error)
    
    // Fallback response if GPT-5 fails
    const fallbackResponses = [
      "I'm here to help you get started with Inflio! Click on any step to continue your setup.",
      "Great question! Let me help you with that. What specific aspect would you like to know more about?",
      "You're making great progress! The next step will unlock more powerful features for your content creation.",
      "Inflio uses AI to transform your videos into multiple content pieces. Complete the onboarding to see it in action!",
      "Each step you complete brings you closer to automated content creation. You're doing great!"
    ]
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    
    return NextResponse.json({ 
      response: randomResponse,
      fallback: true 
    })
  }
}
