export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  authorizationUrl: string
  tokenUrl: string
  scopes: string[]
  userInfoUrl?: string
}

export interface PlatformConfig {
  name: string
  icon: string
  color: string
  oauth: OAuthConfig
  apiBaseUrl: string
  publishEndpoint: string
  mediaTypes: string[]
  limits: {
    text: number
    images: number
    videos: number
    videoDuration: number
  }
}

// Get redirect URI for platform
const getRedirectUri = (platform: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/social/callback/${platform}`
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  instagram: {
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    oauth: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET!,
      redirectUri: getRedirectUri('instagram'),
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'public_profile',
        'email',
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_insights',
        'pages_show_list',
        'pages_read_engagement',
        'business_management'
      ]
    },
    apiBaseUrl: 'https://graph.instagram.com',
    publishEndpoint: '/me/media_publish',
    mediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    limits: {
      text: 2200,
      images: 10,
      videos: 1,
      videoDuration: 60
    }
  },
  
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    oauth: {
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      redirectUri: getRedirectUri('facebook'),
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'pages_read_user_content',
        'public_profile'
      ]
    },
    apiBaseUrl: 'https://graph.facebook.com/v18.0',
    publishEndpoint: '/me/feed',
    mediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    limits: {
      text: 63206,
      images: 10,
      videos: 1,
      videoDuration: 240
    }
  },
  
  x: {
    name: 'X (Twitter)',
    icon: 'twitter',
    color: '#000000',
    oauth: {
      clientId: process.env.TWITTER_CLIENT_ID || process.env.X_API_KEY!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.X_API_SECRET!,
      redirectUri: getRedirectUri('x'),
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      userInfoUrl: 'https://api.twitter.com/2/users/me'
    },
    apiBaseUrl: 'https://api.twitter.com/2',
    publishEndpoint: '/tweets',
    mediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    limits: {
      text: 280,
      images: 4,
      videos: 1,
      videoDuration: 140
    }
  },
  
  linkedin: {
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    oauth: {
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirectUri: getRedirectUri('linkedin'),
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
      userInfoUrl: 'https://api.linkedin.com/v2/me'
    },
    apiBaseUrl: 'https://api.linkedin.com/v2',
    publishEndpoint: '/ugcPosts',
    mediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    limits: {
      text: 3000,
      images: 9,
      videos: 1,
      videoDuration: 600
    }
  },
  
  youtube: {
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    oauth: {
      clientId: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: getRedirectUri('youtube'),
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo'
    },
    apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
    publishEndpoint: '/videos',
    mediaTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    limits: {
      text: 5000,
      images: 0,
      videos: 1,
      videoDuration: 43200 // 12 hours
    }
  },
  
  tiktok: {
    name: 'TikTok',
    icon: 'tiktok',
    color: '#000000',
    oauth: {
      clientId: process.env.TIKTOK_CLIENT_KEY!,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
      redirectUri: getRedirectUri('tiktok'),
      authorizationUrl: 'https://www.tiktok.com/auth/authorize',
      tokenUrl: 'https://open-api.tiktok.com/oauth/access_token',
      scopes: ['user.info.basic', 'video.list', 'video.upload'],
      userInfoUrl: 'https://open-api.tiktok.com/user/info/'
    },
    apiBaseUrl: 'https://open-api.tiktok.com',
    publishEndpoint: '/video/upload',
    mediaTypes: ['video/mp4'],
    limits: {
      text: 2200,
      images: 0,
      videos: 1,
      videoDuration: 180
    }
  },
  
  threads: {
    name: 'Threads',
    icon: 'threads',
    color: '#000000',
    oauth: {
      clientId: process.env.THREADS_CLIENT_ID || process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.THREADS_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET!,
      redirectUri: getRedirectUri('threads'),
      authorizationUrl: 'https://www.threads.net/oauth/authorize',
      tokenUrl: 'https://graph.threads.net/oauth/access_token',
      scopes: ['threads_basic', 'threads_content_publish']
    },
    apiBaseUrl: 'https://graph.threads.net/v1.0',
    publishEndpoint: '/me/threads_publish',
    mediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    limits: {
      text: 500,
      images: 10,
      videos: 1,
      videoDuration: 90
    }
  }
}

// Helper to generate OAuth URL
export function generateOAuthUrl(platform: string, state: string): string {
  const config = PLATFORM_CONFIGS[platform]
  if (!config) throw new Error(`Platform ${platform} not supported`)
  
  const params = new URLSearchParams({
    client_id: config.oauth.clientId,
    redirect_uri: config.oauth.redirectUri,
    response_type: 'code',
    scope: config.oauth.scopes.join(' '),
    state,
    access_type: 'offline', // For refresh tokens
    prompt: 'consent' // Force consent screen
  })
  
  // Platform-specific params
  if (platform === 'instagram' || platform === 'facebook') {
    params.append('display', 'popup')
  }
  
  if (platform === 'youtube') {
    // Google requires specific params
    params.append('include_granted_scopes', 'true')
  }
  
  return `${config.oauth.authorizationUrl}?${params.toString()}`
}

// Validate environment variables
export function validatePlatformConfig(platform: string): boolean {
  const config = PLATFORM_CONFIGS[platform]
  if (!config) return false
  
  const hasClientId = !!config.oauth.clientId && config.oauth.clientId !== 'undefined'
  const hasClientSecret = !!config.oauth.clientSecret && config.oauth.clientSecret !== 'undefined'
  
  return hasClientId && hasClientSecret
} 