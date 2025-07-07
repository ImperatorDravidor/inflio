import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.KLAP_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'KLAP_API_KEY not configured' }, { status: 500 })
  }
  
  const endpoints = [
    'https://api.klap.app/v2',
    'https://api.klap.video/v2',
    'https://api.klap.app/v1',
    'https://api.klap.video/v1'
  ]
  
  const results = await Promise.all(
    endpoints.map(async (baseUrl) => {
      try {
        // Try to create a test task
        const response = await fetch(`${baseUrl}/tasks/video-to-shorts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
            language: 'en',
            max_duration: 30,
            max_clip_count: 1
          })
        })
        
        const responseText = await response.text()
        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = responseText
        }
        
        return {
          endpoint: baseUrl,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          response: responseData,
          working: response.ok
        }
      } catch (error) {
        return {
          endpoint: baseUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
          working: false
        }
      }
    })
  )
  
  // Find working endpoints
  const workingEndpoints = results.filter(r => r.working)
  const recommendedEndpoint = workingEndpoints[0]?.endpoint || 'None found'
  
  return NextResponse.json({
    currentlyUsing: process.env.KLAP_API_URL || 'https://api.klap.app/v2',
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
    results,
    recommendation: recommendedEndpoint,
    summary: {
      workingEndpoints: workingEndpoints.map(e => e.endpoint),
      failedEndpoints: results.filter(r => !r.working).map(r => ({
        endpoint: r.endpoint,
        reason: r.error || `HTTP ${r.status}`
      }))
    }
  })
} 