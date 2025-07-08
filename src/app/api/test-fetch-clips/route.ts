import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get('folderId')
  
  if (!folderId) {
    return NextResponse.json({
      error: 'Please provide folderId as query parameter',
      example: '/api/test-fetch-clips?folderId=YOUR_FOLDER_ID'
    }, { status: 400 })
  }

  const apiKey = process.env.KLAP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'KLAP_API_KEY not configured' }, { status: 500 })
  }

  try {
    // Direct API call to see raw response
    const response = await fetch(`https://api.klap.app/v2/projects/${folderId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'Failed to fetch clips',
        status: response.status,
        details: errorText
      }, { status: response.status })
    }

    const rawData = await response.json()
    
    // Test our KlapAPIService
    const { KlapAPIService } = await import('@/lib/klap-api')
    const serviceClips = await KlapAPIService.getClipsFromFolder(folderId)

    return NextResponse.json({
      success: true,
      rawApiResponse: {
        type: typeof rawData,
        isArray: Array.isArray(rawData),
        length: Array.isArray(rawData) ? rawData.length : undefined,
        keys: typeof rawData === 'object' ? Object.keys(rawData) : undefined,
        sample: Array.isArray(rawData) ? rawData.slice(0, 2) : rawData
      },
      serviceResult: {
        clipsCount: serviceClips.length,
        clips: serviceClips.slice(0, 2) // First 2 clips
      }
    })
    
  } catch (error) {
    console.error('[Test Fetch Clips] Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 