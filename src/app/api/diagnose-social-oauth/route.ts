import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
<<<<<<< HEAD
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
=======

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to run diagnostics' }, { status: 401 })
    }

    // Check OAuth credentials for each platform
    const platforms = {
      facebook: {
        name: 'Facebook & Instagram',
        credentials: {
          'FACEBOOK_APP_ID': process.env.FACEBOOK_APP_ID,
          'FACEBOOK_APP_SECRET': process.env.FACEBOOK_APP_SECRET ? '***hidden***' : undefined,
          'INSTAGRAM_CLIENT_ID': process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID,
          'INSTAGRAM_CLIENT_SECRET': process.env.INSTAGRAM_CLIENT_SECRET ? '***hidden***' : (process.env.FACEBOOK_APP_SECRET ? '***hidden***' : undefined)
        },
        callbackUrl: '/api/social/callback/facebook',
        setupUrl: 'https://developers.facebook.com'
      },
      youtube: {
        name: 'YouTube',
        credentials: {
          'YOUTUBE_CLIENT_ID': process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
          'YOUTUBE_CLIENT_SECRET': (process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET) ? '***hidden***' : undefined
        },
        callbackUrl: '/api/social/callback/youtube',
        setupUrl: 'https://console.cloud.google.com'
      },
      x: {
        name: 'X (Twitter)',
        credentials: {
          'TWITTER_CLIENT_ID': process.env.TWITTER_CLIENT_ID || process.env.X_API_KEY,
          'TWITTER_CLIENT_SECRET': (process.env.TWITTER_CLIENT_SECRET || process.env.X_API_SECRET) ? '***hidden***' : undefined
        },
        callbackUrl: '/api/social/callback/x',
        setupUrl: 'https://developer.twitter.com'
      },
      linkedin: {
        name: 'LinkedIn',
        credentials: {
          'LINKEDIN_CLIENT_ID': process.env.LINKEDIN_CLIENT_ID,
          'LINKEDIN_CLIENT_SECRET': process.env.LINKEDIN_CLIENT_SECRET ? '***hidden***' : undefined
        },
        callbackUrl: '/api/social/callback/linkedin',
        setupUrl: 'https://www.linkedin.com/developers'
      }
    }

    // Check app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Generate report
    const report = {
      appUrl,
      timestamp: new Date().toISOString(),
      platforms: Object.entries(platforms).map(([key, platform]) => {
        const configured = Object.values(platform.credentials).every(val => val !== undefined)
        const callbackUrl = `${appUrl}${platform.callbackUrl}`
        
        return {
          platform: key,
          name: platform.name,
          configured,
          credentials: platform.credentials,
          callbackUrl,
          setupUrl: platform.setupUrl,
          status: configured ? '✅ Ready' : '❌ Missing credentials'
        }
      })
    }

    // Create HTML response for easy reading
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Social OAuth Diagnostic</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; margin-bottom: 10px; }
            .subtitle { color: #666; margin-bottom: 30px; }
            .app-url {
              background: #f0f0f0;
              padding: 10px 15px;
              border-radius: 5px;
              margin-bottom: 30px;
              font-family: monospace;
            }
            .platform {
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .platform.configured {
              border-color: #4caf50;
              background: #f1f8f1;
            }
            .platform.not-configured {
              border-color: #f44336;
              background: #fef1f1;
            }
            .platform h2 {
              margin: 0 0 15px 0;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .status { font-size: 18px; }
            .credentials {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              font-family: monospace;
              font-size: 14px;
            }
            .credential-item {
              margin: 5px 0;
              display: flex;
              justify-content: space-between;
            }
            .missing { color: #f44336; }
            .present { color: #4caf50; }
            .callback-url {
              background: #e3f2fd;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
              font-family: monospace;
              font-size: 13px;
              word-break: break-all;
            }
            .setup-link {
              display: inline-block;
              background: #2196f3;
              color: white;
              padding: 8px 16px;
              border-radius: 5px;
              text-decoration: none;
              margin-top: 10px;
            }
            .setup-link:hover {
              background: #1976d2;
            }
            .instructions {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 5px;
              margin-top: 30px;
            }
            .instructions h3 {
              margin-top: 0;
              color: #856404;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions code {
              background: #f8f9fa;
              padding: 2px 5px;
              border-radius: 3px;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔍 Social OAuth Diagnostic Report</h1>
            <p class="subtitle">Generated at ${new Date().toLocaleString()}</p>
            
            <div class="app-url">
              <strong>App URL:</strong> ${appUrl}
            </div>

            ${report.platforms.map(platform => `
              <div class="platform ${platform.configured ? 'configured' : 'not-configured'}">
                <h2>
                  <span class="status">${platform.status}</span>
                  ${platform.name}
                </h2>
                
                <div class="credentials">
                  <strong>Credentials:</strong>
                  ${Object.entries(platform.credentials).map(([key, value]) => `
                    <div class="credential-item">
                      <span>${key}:</span>
                      <span class="${value ? 'present' : 'missing'}">${value || 'Not configured'}</span>
                    </div>
                  `).join('')}
                </div>
                
                <div class="callback-url">
                  <strong>Callback URL to add in ${platform.name}:</strong><br>
                  ${platform.callbackUrl}
                </div>
                
                ${!platform.configured ? `
                  <a href="${platform.setupUrl}" target="_blank" class="setup-link">
                    Setup ${platform.name} →
                  </a>
                ` : ''}
              </div>
            `).join('')}

            ${report.platforms.some(p => !p.configured) ? `
              <div class="instructions">
                <h3>📝 Next Steps</h3>
                <ol>
                  <li>Click the setup links above to create OAuth apps</li>
                  <li>Copy the callback URLs exactly as shown</li>
                  <li>Get your Client ID and Client Secret</li>
                  <li>Add them to your <code>.env.local</code> file</li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            ` : `
              <div class="instructions" style="background: #e8f5e9; border-color: #c8e6c9;">
                <h3>✅ All platforms configured!</h3>
                <p>You can now connect your social media accounts from the <a href="/social">Social Media</a> page.</p>
              </div>
            `}
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json(
      { error: 'Failed to run diagnostics' },
      { status: 500 }
    )
  }
>>>>>>> 7184e73 (Add new files and configurations for project setup)
} 