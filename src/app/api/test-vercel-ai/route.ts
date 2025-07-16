import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'

export async function GET(request: NextRequest) {
  const results = {
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    openAIKey: {
      exists: !!process.env.OPENAI_API_KEY,
      isPlaceholder: process.env.OPENAI_API_KEY === 'your_openai_api_key_here',
      length: process.env.OPENAI_API_KEY?.length || 0
    },
    assemblyAIKey: {
      exists: !!process.env.ASSEMBLYAI_API_KEY,
      length: process.env.ASSEMBLYAI_API_KEY?.length || 0
    },
    openAITest: {
      status: 'not_tested',
      error: null as string | null,
      model: null as string | null
    }
  }

  // Test OpenAI if key exists and not placeholder
  if (results.openAIKey.exists && !results.openAIKey.isPlaceholder) {
    try {
      const openai = getOpenAI()
      
      // Test with a simple completion
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini', // Test the model being used in production
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Reply with "OK" if you can read this.' }
        ],
        max_tokens: 10
      })
      
      results.openAITest.status = 'success'
      results.openAITest.model = completion.model
    } catch (error) {
      results.openAITest.status = 'failed'
      results.openAITest.error = error instanceof Error ? error.message : 'Unknown error'
      
      // Try with a standard model if custom model fails
      if (error instanceof Error && error.message.includes('model')) {
        try {
          const openai = getOpenAI()
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Standard model
            messages: [
              { role: 'system', content: 'You are a test assistant.' },
              { role: 'user', content: 'Reply with "OK" if you can read this.' }
            ],
            max_tokens: 10
          })
          
          results.openAITest.status = 'success_with_standard_model'
          results.openAITest.model = completion.model
        } catch (fallbackError) {
          results.openAITest.error += ` | Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`
        }
      }
    }
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-store'
    }
  })
} 