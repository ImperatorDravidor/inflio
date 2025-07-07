import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to run diagnostics' }, { status: 401 })
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      runtime: process.versions,
    },
    klapConfig: {
      hasApiKey: !!process.env.KLAP_API_KEY,
      apiKeyPrefix: process.env.KLAP_API_KEY ? process.env.KLAP_API_KEY.substring(0, 10) + '...' : 'NOT SET',
      apiUrl: process.env.KLAP_API_URL || 'https://api.klap.app/v2 (default)',
      skipVideoReupload: process.env.SKIP_KLAP_VIDEO_REUPLOAD === 'true',
    },
    appConfig: {
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
    },
    tests: {
      apiKeyValidation: { status: 'pending', message: '' },
      klapApiConnection: { status: 'pending', message: '' },
      sampleVideoProcessing: { status: 'pending', message: '' },
    },
    recommendations: [] as string[],
  }

  // Test 1: Validate API Key format
  if (!process.env.KLAP_API_KEY) {
    diagnostics.tests.apiKeyValidation = { 
      status: 'failed', 
      message: 'KLAP_API_KEY environment variable is not set' 
    }
    diagnostics.recommendations.push('Add KLAP_API_KEY to your environment variables')
  } else if (!process.env.KLAP_API_KEY.startsWith('klap_')) {
    diagnostics.tests.apiKeyValidation = { 
      status: 'warning', 
      message: 'API key does not start with "klap_" - might be invalid' 
    }
  } else {
    diagnostics.tests.apiKeyValidation = { 
      status: 'passed', 
      message: 'API key format looks valid' 
    }
  }

  // Test 2: Test Klap API connection
  if (process.env.KLAP_API_KEY) {
    try {
      // Test with a simple API call
      const testUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
      const response = await fetch('https://api.klap.app/v2/tasks/video-to-shorts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_video_url: testUrl,
          language: 'en',
          max_duration: 30,
          // Add dry_run flag if supported to avoid actual processing
        }),
      })

      if (response.ok) {
        const task = await response.json()
        diagnostics.tests.klapApiConnection = { 
          status: 'passed', 
          message: `API connection successful. Test task created: ${task.id}` 
        }
        
        // Clean up test task if possible
        // Note: You might want to cancel this task to avoid charges
      } else {
        const errorText = await response.text()
        diagnostics.tests.klapApiConnection = { 
          status: 'failed', 
          message: `API returned ${response.status}: ${errorText}` 
        }
        
        if (response.status === 401) {
          diagnostics.recommendations.push('Your Klap API key appears to be invalid. Get a new one from klap.app')
        } else if (response.status === 429) {
          diagnostics.recommendations.push('Rate limit exceeded. Wait a bit or upgrade your Klap plan')
        }
      }
    } catch (error) {
      diagnostics.tests.klapApiConnection = { 
        status: 'failed', 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
      diagnostics.recommendations.push('Check your internet connection or Klap API status')
    }
  } else {
    diagnostics.tests.klapApiConnection = { 
      status: 'skipped', 
      message: 'Cannot test API connection without API key' 
    }
  }

  // Test 3: Check sample video processing
  diagnostics.tests.sampleVideoProcessing = {
    status: 'info',
    message: 'Ready to process videos. Upload a video with "Generate Clips" enabled to test.'
  }

  // Additional recommendations based on configuration
  if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_BASE_URL) {
    diagnostics.recommendations.push('Set NEXT_PUBLIC_APP_URL to your domain (e.g., https://inflio.ai)')
  }

  if (!process.env.SKIP_KLAP_VIDEO_REUPLOAD) {
    diagnostics.recommendations.push('Consider setting SKIP_KLAP_VIDEO_REUPLOAD=true for faster processing')
  }

  // Check for common issues
  const commonIssues = []
  
  if (diagnostics.environment.isProduction && diagnostics.environment.vercelEnv) {
    commonIssues.push('Running on Vercel with 1-minute function timeout - Klap processing needs 10-20 minutes')
    diagnostics.recommendations.push('Klap processing takes 10-20 minutes but Vercel functions timeout at 1 minute. The app should handle this gracefully.')
  }

  return NextResponse.json({
    ...diagnostics,
    commonIssues,
    summary: {
      canProcessClips: diagnostics.tests.apiKeyValidation.status === 'passed' && 
                       diagnostics.tests.klapApiConnection.status === 'passed',
      issueCount: diagnostics.recommendations.length + commonIssues.length,
      status: diagnostics.recommendations.length === 0 ? 'healthy' : 'needs-attention'
    }
  })
} 