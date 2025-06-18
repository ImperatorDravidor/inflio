import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { SocialMediaServiceClient, Platform } from '@/lib/social/types'

const socialMediaService = new SocialMediaServiceClient()

interface TokenData {
  userId: string
  name: string
  picture?: string
  providerId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  profile?: Record<string, unknown>
}

// OAuth callback handler for social media platforms
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    
    const userId = user.id
    
    const { platform: platformStr } = await params
    const platform = platformStr as Platform
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error(`OAuth error for ${platform}:`, error)
      return NextResponse.redirect(
        new URL(`/social?error=auth_failed&platform=${platform}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/social?error=no_code&platform=${platform}`, request.url)
      )
    }

    // Exchange code for tokens based on platform
    let tokenData
    switch (platform) {
      case 'x':
        tokenData = await exchangeTwitterCode(code)
        break
      case 'instagram':
        tokenData = await exchangeInstagramCode(code)
        break
      case 'linkedin':
        tokenData = await exchangeLinkedInCode(code)
        break
      case 'youtube':
        tokenData = await exchangeYouTubeCode(code)
        break
      case 'facebook':
        tokenData = await exchangeFacebookCode(code)
        break
      case 'tiktok':
        tokenData = await exchangeTikTokCode(code)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    // Save the integration
    await socialMediaService.createIntegration({
      user_id: userId,
      platform,
      internal_id: tokenData.userId,
      name: tokenData.name,
      picture: tokenData.picture,
      provider_identifier: tokenData.providerId,
      token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      token_expiration: tokenData.expiresAt,
      profile: JSON.stringify(tokenData.profile)
    })

    // Redirect back to social media dashboard with success
    return NextResponse.redirect(
      new URL(`/social?success=connected&platform=${platform}`, request.url)
    )

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/social?error=callback_failed', request.url)
    )
  }
}

// Platform-specific token exchange functions
// These would need to be implemented with actual API calls

async function exchangeTwitterCode(_code: string): Promise<TokenData> {
  // TODO: Implement Twitter OAuth 2.0 token exchange
  // https://developer.twitter.com/en/docs/authentication/oauth-2-0
  throw new Error('Twitter OAuth not implemented')
}

async function exchangeInstagramCode(_code: string): Promise<TokenData> {
  // TODO: Implement Instagram OAuth token exchange
  // https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions
  throw new Error('Instagram OAuth not implemented')
}

async function exchangeLinkedInCode(_code: string): Promise<TokenData> {
  // TODO: Implement LinkedIn OAuth 2.0 token exchange
  // https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
  throw new Error('LinkedIn OAuth not implemented')
}

async function exchangeYouTubeCode(_code: string): Promise<TokenData> {
  // TODO: Implement YouTube (Google) OAuth 2.0 token exchange
  // https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
  throw new Error('YouTube OAuth not implemented')
}

async function exchangeFacebookCode(_code: string): Promise<TokenData> {
  // TODO: Implement Facebook OAuth token exchange
  // https://developers.facebook.com/docs/facebook-login/guides/access-tokens
  throw new Error('Facebook OAuth not implemented')
}

async function exchangeTikTokCode(_code: string): Promise<TokenData> {
  // TODO: Implement TikTok OAuth token exchange
  // https://developers.tiktok.com/doc/login-kit-web
  throw new Error('TikTok OAuth not implemented')
} 