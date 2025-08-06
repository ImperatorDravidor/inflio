/**
 * ⚠️ PROTECTED ROUTE - This endpoint is protected in production
 * Only accessible in development or by admin users
 * Protection handled by middleware-protect-dev-routes.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PLATFORM_CONFIGS, validatePlatformConfig } from '@/lib/social/oauth-config'

export async function GET(request: NextRequest) {
  // Check authentication
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to run diagnostics' }, { status: 401 })
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    platforms: {} as Record<string, any>,
    summary: {
      configured: 0,
      missing: 0,
      partial: 0
    }
  }

  // Check each platform
  const platforms = ['facebook', 'instagram', 'x', 'youtube', 'linkedin', 'tiktok', 'threads']
  
  for (const platform of platforms) {
    const config = PLATFORM_CONFIGS[platform]
    if (!config) continue

    // Get environment variable names for this platform
    const envVarNames = getEnvVarNames(platform)
    
    const platformCheck = {
      name: config.name,
      status: 'not_configured' as 'configured' | 'partial' | 'not_configured',
      credentials: {} as Record<string, any>,
      redirectUri: config.oauth.redirectUri,
      issues: [] as string[],
      setupUrl: getSetupUrl(platform)
    }

    // Check client ID
    const clientId = config.oauth.clientId
    const hasClientId = !!clientId && clientId !== 'undefined'
    platformCheck.credentials.clientId = {
      envVar: envVarNames.clientId,
      isSet: hasClientId,
      preview: hasClientId ? `${clientId.substring(0, 10)}...` : 'NOT SET'
    }

    // Check client secret
    const clientSecret = config.oauth.clientSecret
    const hasClientSecret = !!clientSecret && clientSecret !== 'undefined'
    platformCheck.credentials.clientSecret = {
      envVar: envVarNames.clientSecret,
      isSet: hasClientSecret,
      preview: hasClientSecret ? '***SET***' : 'NOT SET'
    }

    // Check redirect URI
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      platformCheck.issues.push('NEXT_PUBLIC_APP_URL not set - redirect URIs will not work')
    }

    // Determine status
    if (hasClientId && hasClientSecret) {
      platformCheck.status = 'configured'
      diagnostics.summary.configured++
    } else if (hasClientId || hasClientSecret) {
      platformCheck.status = 'partial'
      diagnostics.summary.partial++
      platformCheck.issues.push('Missing some credentials')
    } else {
      platformCheck.status = 'not_configured'
      diagnostics.summary.missing++
      platformCheck.issues.push('No credentials configured')
    }

    // Add platform-specific checks
    if (platform === 'instagram' && platformCheck.status === 'configured') {
      if (!process.env.FACEBOOK_APP_ID) {
        platformCheck.issues.push('Instagram uses Facebook App credentials')
      }
    }

    diagnostics.platforms[platform] = platformCheck
  }

  // Generate setup instructions
  const setupInstructions = generateSetupInstructions(diagnostics)

  return NextResponse.json({
    diagnostics,
    setupInstructions,
    nextSteps: generateNextSteps(diagnostics)
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

function getEnvVarNames(platform: string): { clientId: string; clientSecret: string } {
  const mapping: Record<string, { clientId: string; clientSecret: string }> = {
    facebook: { clientId: 'FACEBOOK_APP_ID', clientSecret: 'FACEBOOK_APP_SECRET' },
    instagram: { 
      clientId: 'INSTAGRAM_CLIENT_ID or FACEBOOK_APP_ID', 
      clientSecret: 'INSTAGRAM_CLIENT_SECRET or FACEBOOK_APP_SECRET' 
    },
    x: { 
      clientId: 'TWITTER_CLIENT_ID or X_API_KEY', 
      clientSecret: 'TWITTER_CLIENT_SECRET or X_API_SECRET' 
    },
    youtube: { 
      clientId: 'YOUTUBE_CLIENT_ID or GOOGLE_CLIENT_ID', 
      clientSecret: 'YOUTUBE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET' 
    },
    linkedin: { clientId: 'LINKEDIN_CLIENT_ID', clientSecret: 'LINKEDIN_CLIENT_SECRET' },
    tiktok: { clientId: 'TIKTOK_CLIENT_KEY', clientSecret: 'TIKTOK_CLIENT_SECRET' },
    threads: { 
      clientId: 'THREADS_CLIENT_ID or FACEBOOK_APP_ID', 
      clientSecret: 'THREADS_CLIENT_SECRET or FACEBOOK_APP_SECRET' 
    }
  }
  return mapping[platform] || { clientId: 'UNKNOWN', clientSecret: 'UNKNOWN' }
}

function getSetupUrl(platform: string): string {
  const urls: Record<string, string> = {
    facebook: 'https://developers.facebook.com/apps',
    instagram: 'https://developers.facebook.com/apps',
    x: 'https://developer.twitter.com/en/portal/dashboard',
    youtube: 'https://console.cloud.google.com/',
    linkedin: 'https://www.linkedin.com/developers/apps',
    tiktok: 'https://developers.tiktok.com/apps',
    threads: 'https://developers.facebook.com/apps'
  }
  return urls[platform] || '#'
}

function generateSetupInstructions(diagnostics: any): Record<string, string[]> {
  const instructions: Record<string, string[]> = {}

  for (const [platform, check] of Object.entries(diagnostics.platforms) as [string, any][]) {
    if (check.status !== 'configured') {
      const steps: string[] = []
      
      if (!diagnostics.appUrl || diagnostics.appUrl === 'NOT SET') {
        steps.push('1. Set NEXT_PUBLIC_APP_URL in your .env.local file')
      }

      steps.push(
        `${steps.length + 1}. Go to ${check.setupUrl}`,
        `${steps.length + 2}. Create a new app (or use existing)`,
        `${steps.length + 3}. Add redirect URI: ${check.redirectUri || 'Configure NEXT_PUBLIC_APP_URL first'}`,
        `${steps.length + 4}. Copy credentials to .env.local:`
      )

      if (!check.credentials.clientId.isSet) {
        steps.push(`   ${check.credentials.clientId.envVar}=your-client-id`)
      }
      if (!check.credentials.clientSecret.isSet) {
        steps.push(`   ${check.credentials.clientSecret.envVar}=your-client-secret`)
      }

      instructions[platform] = steps
    }
  }

  return instructions
}

function generateNextSteps(diagnostics: any): string[] {
  const steps: string[] = []

  if (!diagnostics.appUrl || diagnostics.appUrl === 'NOT SET') {
    steps.push('🚨 CRITICAL: Set NEXT_PUBLIC_APP_URL in .env.local first!')
  }

  if (diagnostics.summary.missing > 0) {
    steps.push(`📝 Configure ${diagnostics.summary.missing} missing platform(s) by following setup instructions above`)
  }

  if (diagnostics.summary.partial > 0) {
    steps.push(`⚠️ Complete setup for ${diagnostics.summary.partial} partially configured platform(s)`)
  }

  if (diagnostics.summary.configured > 0) {
    steps.push(`✅ Test the ${diagnostics.summary.configured} configured platform(s) by connecting accounts`)
  }

  steps.push('🔄 After making changes, restart your dev server for env vars to take effect')

  return steps
} 