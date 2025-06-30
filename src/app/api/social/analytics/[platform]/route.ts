import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { platform } = await params
    const supabase = createSupabaseBrowserClient()

    // Get integration for the platform
    const { data: integration, error: integrationError } = await supabase
      .from('social_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('disabled', false)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: `No connected ${platform} account found` },
        { status: 404 }
      )
    }

    // Get analytics based on platform
    const analytics = await fetchPlatformAnalytics(integration)

    // Get recent posts for this platform
    const { data: recentPosts } = await supabase
      .from('social_posts')
      .select('*')
      .eq('integration_id', integration.id)
      .eq('state', 'published')
      .order('publish_date', { ascending: false })
      .limit(10)

    return NextResponse.json({
      platform,
      integration: {
        id: integration.id,
        name: integration.name,
        picture: integration.picture,
        connected_at: integration.created_at
      },
      analytics,
      recentPosts: recentPosts || []
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Fetch platform-specific analytics
async function fetchPlatformAnalytics(integration: any) {
  const { platform, token, provider_identifier } = integration
  
  try {
    switch (platform) {
      case 'x':
      case 'twitter':
        return await fetchTwitterAnalytics(token, provider_identifier)
      
      case 'linkedin':
        return await fetchLinkedInAnalytics(token, provider_identifier)
      
      case 'facebook':
        return await fetchFacebookAnalytics(token, provider_identifier)
        
      case 'instagram':
        return await fetchInstagramAnalytics(token, provider_identifier)
      
      case 'youtube':
        return await fetchYouTubeAnalytics(token, provider_identifier)
      
      default:
        return {
          error: `Analytics for ${platform} not yet implemented`
        }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    }
  }
}

// Twitter/X Analytics
async function fetchTwitterAnalytics(token: string, userId: string) {
  // Get user metrics
  const userResponse = await fetch(
    `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  if (!userResponse.ok) {
    throw new Error('Failed to fetch Twitter user metrics')
  }

  const userData = await userResponse.json()
  const metrics = userData.data.public_metrics

  return {
    followers: metrics.followers_count,
    following: metrics.following_count,
    tweets: metrics.tweet_count,
    listed: metrics.listed_count,
    engagement: {
      // Twitter doesn't provide engagement rate directly
      impressions: 'N/A',
      engagementRate: 'N/A'
    }
  }
}

// LinkedIn Analytics
async function fetchLinkedInAnalytics(token: string, userId: string) {
  // Get follower statistics
  const response = await fetch(
    `https://api.linkedin.com/v2/networkSizes/${userId}?edgeType=CompanyFollowedByMember`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn analytics')
  }

  const data = await response.json()

  // Get share statistics (requires additional permissions)
  // This is a simplified version - actual implementation would need more API calls
  return {
    followers: data.firstDegreeSize || 0,
    connections: data.firstDegreeSize || 0,
    engagement: {
      views: 'Requires additional permissions',
      engagementRate: 'Requires additional permissions'
    }
  }
}

// Facebook Analytics
async function fetchFacebookAnalytics(token: string, pageId: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=followers_count,fan_count,engagement&access_token=${token}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Facebook analytics')
  }

  const data = await response.json()

  return {
    followers: data.followers_count || data.fan_count || 0,
    likes: data.fan_count || 0,
    engagement: {
      count: data.engagement?.count || 0,
      socialSentence: data.engagement?.social_sentence || ''
    }
  }
}

// Instagram Analytics
async function fetchInstagramAnalytics(token: string, accountId: string) {
  // Get Instagram Business Account insights
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/insights?metric=impressions,reach,profile_views&period=day&access_token=${token}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Instagram analytics')
  }

  const insightsData = await response.json()

  // Get follower count
  const accountResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}?fields=followers_count,media_count&access_token=${token}`
  )

  const accountData = await accountResponse.json()

  return {
    followers: accountData.followers_count || 0,
    posts: accountData.media_count || 0,
    insights: {
      impressions: insightsData.data?.find((m: any) => m.name === 'impressions')?.values?.[0]?.value || 0,
      reach: insightsData.data?.find((m: any) => m.name === 'reach')?.values?.[0]?.value || 0,
      profileViews: insightsData.data?.find((m: any) => m.name === 'profile_views')?.values?.[0]?.value || 0
    }
  }
}

// YouTube Analytics
async function fetchYouTubeAnalytics(token: string, channelId: string) {
  // Get channel statistics
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&access_token=${token}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube analytics')
  }

  const data = await response.json()
  const stats = data.items?.[0]?.statistics

  if (!stats) {
    throw new Error('No YouTube statistics found')
  }

  return {
    subscribers: parseInt(stats.subscriberCount || '0'),
    views: parseInt(stats.viewCount || '0'),
    videos: parseInt(stats.videoCount || '0'),
    engagement: {
      // YouTube Analytics API requires additional scope
      averageViewDuration: 'Requires YouTube Analytics API',
      estimatedMinutesWatched: 'Requires YouTube Analytics API'
    }
  }
} 