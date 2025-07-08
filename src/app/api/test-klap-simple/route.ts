import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const config = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      platform: process.platform,
      nodeVersion: process.version,
    },
    klap: {
      hasApiKey: !!process.env.KLAP_API_KEY,
      apiKeyPrefix: process.env.KLAP_API_KEY ? 
        process.env.KLAP_API_KEY.substring(0, 10) + '...' : 
        'NOT SET - This is why clips are not generating!',
      skipVideoReupload: process.env.SKIP_KLAP_VIDEO_REUPLOAD === 'true',
      downloadingClips: process.env.SKIP_KLAP_VIDEO_REUPLOAD !== 'true' ? 'YES - Clips will be stored in your Supabase' : 'NO - Using Klap URLs only',
    },
    urls: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
    },
    criticalIssues: [] as string[],
    quickFix: [] as string[],
  }

  // Check for critical issues
  if (!process.env.KLAP_API_KEY) {
    config.criticalIssues.push('❌ CRITICAL: KLAP_API_KEY is not set - clips WILL NOT work')
    config.quickFix.push(
      '1. Get API key from https://klap.app',
      '2. Add to .env.local: KLAP_API_KEY=your_api_key_here',
      '3. Restart your development server'
    )
  }

  if (!process.env.NEXT_PUBLIC_APP_URL && config.environment.isProduction) {
    config.criticalIssues.push('❌ NEXT_PUBLIC_APP_URL is not set')
    config.quickFix.push(
      'Add to .env.local: NEXT_PUBLIC_APP_URL=https://inflio.ai'
    )
  }

  const status = config.criticalIssues.filter(issue => issue.startsWith('❌')).length === 0 ? 'READY' : 'NOT READY'

  return NextResponse.json({
    status,
    message: status === 'READY' ? 
      'Klap integration is properly configured! Clips will be 30 seconds each.' : 
      'Fix the issues below to enable clip generation',
    ...config,
    clipSettings: {
      duration: '30 seconds per clip',
      maxClips: '10 clips maximum',
      storage: 'Downloaded to your Supabase storage',
    },
    productionUrl: 'https://inflio.ai/api/test-klap-simple',
  })
} 