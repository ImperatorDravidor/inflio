import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { PLATFORM_CONFIGS } from '@/lib/social/oauth-config'
import { handleError, AppError } from '@/lib/error-handler'

interface TokenData {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

interface UserProfile {
  id: string
  name: string
  email?: string
  picture?: string
  username?: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const { platform } = await context.params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error(`OAuth error for ${platform}:`, error)
      const errorUrl = new URL('/social', request.url)
      errorUrl.searchParams.set('error', error)
      return NextResponse.redirect(errorUrl)
    }

    if (!code) {
      throw new AppError('No authorization code received', 'OAUTH_ERROR', 400)
    }

    // Validate state parameter (implement CSRF protection)
    // In production, validate state against stored value

    // Get platform config
    const config = PLATFORM_CONFIGS[platform]
    if (!config) {
      throw new AppError(`Platform ${platform} not supported`, 'INVALID_PLATFORM', 400)
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(platform, code, config)
    
    // Get user profile
    const userProfile = await getUserProfile(platform, tokenData.access_token, config)

    // Store integration in database
    const supabase = createSupabaseBrowserClient()
    
    // Calculate token expiration
    const tokenExpiration = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // Upsert integration
    const { error: dbError } = await supabase
      .from('social_integrations')
      .upsert({
        user_id: userId,
        platform,
        internal_id: userProfile.id,
        name: userProfile.name,
        picture: userProfile.picture,
        provider_identifier: userProfile.username || userProfile.id,
        token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiration: tokenExpiration,
        profile: JSON.stringify(userProfile),
        disabled: false,
        refresh_needed: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,internal_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new AppError('Failed to save integration', 'DB_ERROR', 500)
    }

    // Redirect to social page with success
    const successUrl = new URL('/social', request.url)
    successUrl.searchParams.set('connected', platform)
    return NextResponse.redirect(successUrl)

  } catch (error) {
    handleError(error, `social-callback-${await context.params.then(p => p.platform)}`)
    
    const errorUrl = new URL('/social', request.url)
    if (error instanceof AppError) {
      errorUrl.searchParams.set('error', error.message)
    } else {
      errorUrl.searchParams.set('error', 'Connection failed')
    }
    
    return NextResponse.redirect(errorUrl)
  }
}

async function exchangeCodeForToken(
  platform: string,
  code: string,
  config: any
): Promise<TokenData> {
  const tokenUrl = config.oauth.tokenUrl
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.oauth.redirectUri,
    client_id: config.oauth.clientId,
    client_secret: config.oauth.clientSecret
  })

  // Platform-specific adjustments
  if (platform === 'linkedin') {
    // LinkedIn uses form data
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const error = await response.text()
      throw new AppError(`LinkedIn token exchange failed: ${error}`, 'OAUTH_TOKEN_ERROR')
    }

    return response.json()
  }

  if (platform === 'x') {
    // Twitter/X OAuth 2.0 with PKCE
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.oauth.clientId}:${config.oauth.clientSecret}`).toString('base64')}`
      },
      body: params.toString()
    })

    if (!response.ok) {
      const error = await response.text()
      throw new AppError(`X token exchange failed: ${error}`, 'OAUTH_TOKEN_ERROR')
    }

    return response.json()
  }

  if (platform === 'youtube') {
    // Google OAuth 2.0
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const error = await response.text()
      throw new AppError(`YouTube token exchange failed: ${error}`, 'OAUTH_TOKEN_ERROR')
    }

    return response.json()
  }

  if (platform === 'tiktok') {
    // TikTok has a different flow
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: config.oauth.clientId,
        client_secret: config.oauth.clientSecret,
        code,
        grant_type: 'authorization_code'
      }).toString()
    })

    if (!response.ok) {
      const error = await response.text()
      throw new AppError(`TikTok token exchange failed: ${error}`, 'OAUTH_TOKEN_ERROR')
    }

    const data = await response.json()
    return {
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token,
      expires_in: data.data.expires_in
    }
  }

  // Default flow for Instagram, Facebook, Threads
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new AppError(`Token exchange failed: ${error}`, 'OAUTH_TOKEN_ERROR')
  }

  return response.json()
}

async function getUserProfile(
  platform: string,
  accessToken: string,
  config: any
): Promise<UserProfile> {
  // Platform-specific user profile fetching
  switch (platform) {
    case 'instagram':
    case 'facebook': {
      // Use Graph API
      const response = await fetch(
        `${config.apiBaseUrl}/me?fields=id,name,email,picture&access_token=${accessToken}`
      )
      
      if (!response.ok) {
        throw new AppError('Failed to fetch user profile', 'PROFILE_FETCH_ERROR')
      }
      
      const data = await response.json()
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        picture: data.picture?.data?.url,
        username: data.username
      }
    }

    case 'x': {
      // Twitter/X API v2
      const response = await fetch(
        `${config.apiBaseUrl}/users/me?user.fields=profile_image_url,username`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (!response.ok) {
        throw new AppError('Failed to fetch X profile', 'PROFILE_FETCH_ERROR')
      }
      
      const { data } = await response.json()
      return {
        id: data.id,
        name: data.name,
        username: data.username,
        picture: data.profile_image_url
      }
    }

    case 'linkedin': {
      // LinkedIn API v2
      const [profileResponse, emailResponse] = await Promise.all([
        fetch('https://api.linkedin.com/v2/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ])
      
      if (!profileResponse.ok || !emailResponse.ok) {
        throw new AppError('Failed to fetch LinkedIn profile', 'PROFILE_FETCH_ERROR')
      }
      
      const profile = await profileResponse.json()
      const emailData = await emailResponse.json()
      
      return {
        id: profile.id,
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        email: emailData.elements?.[0]?.['handle~']?.emailAddress,
        picture: profile.profilePicture?.displayImage
      }
    }

    case 'youtube': {
      // Google OAuth userinfo
      const response = await fetch(
        `${config.oauth.userInfoUrl}?access_token=${accessToken}`
      )
      
      if (!response.ok) {
        throw new AppError('Failed to fetch YouTube profile', 'PROFILE_FETCH_ERROR')
      }
      
      const data = await response.json()
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        picture: data.picture
      }
    }

    case 'tiktok': {
      // TikTok API
      const response = await fetch(
        `${config.apiBaseUrl}/user/info/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (!response.ok) {
        throw new AppError('Failed to fetch TikTok profile', 'PROFILE_FETCH_ERROR')
      }
      
      const { data } = await response.json()
      return {
        id: data.user.open_id,
        name: data.user.display_name,
        username: data.user.username,
        picture: data.user.avatar_url
      }
    }

    case 'threads': {
      // Threads uses similar API to Instagram
      const response = await fetch(
        `${config.apiBaseUrl}/me?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`
      )
      
      if (!response.ok) {
        throw new AppError('Failed to fetch Threads profile', 'PROFILE_FETCH_ERROR')
      }
      
      const data = await response.json()
      return {
        id: data.id,
        name: data.username,
        username: data.username,
        picture: data.threads_profile_picture_url
      }
    }

    default:
      throw new AppError(`Profile fetching not implemented for ${platform}`, 'NOT_IMPLEMENTED')
  }
} 