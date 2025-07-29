import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'
import { requireDevelopmentOrAdmin } from '../middleware-auth'

export async function GET(req: NextRequest) {
  // Check authorization
  const authError = await requireDevelopmentOrAdmin(req)
  if (authError) return authError

  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY
    
    // Test 1: Check API key
    if (!apiKey) {
      return NextResponse.json({
        error: 'ASSEMBLYAI_API_KEY not set',
        hasKey: false
      })
    }

    // Test 2: Create client
    const client = new AssemblyAI({ apiKey })
    
    // Test 3: Test with a small audio file
    const testAudioUrl = 'https://storage.googleapis.com/aai-docs-samples/hello.mp3'
    
    console.log('[Test] Starting transcription test...')
    
    // Test 4: Try submit method
    try {
      const submitResult = await client.transcripts.submit({
        audio: testAudioUrl
      })
      console.log('[Test] Submit result:', submitResult)
      
      // Test 5: Try polling manually
      let attempts = 0
      let status = submitResult
      
      while (status.status !== 'completed' && status.status !== 'error' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        status = await client.transcripts.get(submitResult.id)
        attempts++
        console.log(`[Test] Poll attempt ${attempts}:`, status.status)
      }
      
      return NextResponse.json({
        success: true,
        method: 'submit + manual poll',
        finalStatus: status.status,
        hasText: !!status.text,
        attempts,
        transcriptId: submitResult.id
      })
    } catch (submitError) {
      console.error('[Test] Submit method failed:', submitError)
      
      // Test 6: Try transcribe method
      try {
        console.log('[Test] Trying transcribe method...')
        const transcribeResult = await client.transcripts.transcribe({
          audio: testAudioUrl
        })
        
        return NextResponse.json({
          success: true,
          method: 'transcribe',
          status: transcribeResult.status,
          hasText: !!transcribeResult.text,
          textPreview: transcribeResult.text?.substring(0, 100)
        })
      } catch (transcribeError) {
        return NextResponse.json({
          error: 'Both methods failed',
          submitError: submitError instanceof Error ? submitError.message : 'Unknown',
          transcribeError: transcribeError instanceof Error ? transcribeError.message : 'Unknown'
        })
      }
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}