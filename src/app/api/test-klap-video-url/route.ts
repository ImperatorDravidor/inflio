import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, testOnly } = await request.json()
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      hasApiKey: !!process.env.KLAP_API_KEY,
      environment: process.env.NODE_ENV,
      videoUrl,
      urlAnalysis: {
        isSupabaseUrl: videoUrl?.includes('supabase'),
        hasPublicPath: videoUrl?.includes('/storage/v1/object/public/'),
        protocol: videoUrl?.startsWith('https://') ? 'HTTPS' : 'HTTP',
        length: videoUrl?.length,
        domain: new URL(videoUrl).hostname
      }
    }
    
    // Test if URL is accessible
    try {
      console.log(`[Test] Checking if video URL is accessible: ${videoUrl}`)
      const headResponse = await fetch(videoUrl, { method: 'HEAD' })
      diagnostics.urlAccessibility = {
        status: headResponse.status,
        statusText: headResponse.statusText,
        contentType: headResponse.headers.get('content-type'),
        contentLength: headResponse.headers.get('content-length'),
        accessible: headResponse.ok
      }
      
      if (!headResponse.ok) {
        diagnostics.error = `Video URL returned ${headResponse.status}: ${headResponse.statusText}`
      }
    } catch (error) {
      diagnostics.urlAccessibility = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Failed to access URL'
      }
    }
    
    // If testOnly, don't create KLAP task
    if (testOnly) {
      return NextResponse.json(diagnostics)
    }
    
    // Try to create KLAP task
    try {
      console.log(`[Test] Creating KLAP task with video URL...`)
      const task = await KlapAPIService.createVideoTask(videoUrl)
      diagnostics.klapTask = {
        success: true,
        taskId: task.id,
        message: 'KLAP task created successfully!'
      }
    } catch (error) {
      diagnostics.klapTask = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create KLAP task'
      }
      
      // Check if it's a URL-related error
      if (error instanceof Error) {
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
          diagnostics.possibleIssues = [
            'Video URL might not be accessible by KLAP',
            'Video format might not be supported',
            'URL might require authentication'
          ]
        }
      }
    }
    
    // Recommendations
    diagnostics.recommendations = []
    if (videoUrl?.includes('supabase')) {
      diagnostics.recommendations.push('Consider using a signed URL with longer expiration')
      diagnostics.recommendations.push('Ensure Supabase bucket is public or URL has proper auth')
    }
    if (!diagnostics.urlAccessibility?.accessible) {
      diagnostics.recommendations.push('Video URL is not publicly accessible')
    }
    
    return NextResponse.json(diagnostics)
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 