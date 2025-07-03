import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PLATFORM_CONFIGS } from '@/lib/social/oauth-config'
import { refreshAccessToken } from '@/lib/social/platform-publishers'

export const maxDuration = 60 // Vercel serverless function timeout

export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by Vercel Cron (in production)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin
    
    // Get posts that are due to be published
    const { data: duePosts, error: fetchError } = await supabase
      .from('social_posts')
      .select(`
        *,
        integration:social_integrations(*)
      `)
      .eq('state', 'scheduled')
      .lte('publish_date', new Date().toISOString())
      .limit(10) // Process up to 10 posts per run

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ message: 'No posts to publish' })
    }

    const results = []
    
    // Process each post
    for (const post of duePosts) {
      try {
        // Update state to publishing
        await supabase
          .from('social_posts')
          .update({ state: 'publishing' })
          .eq('id', post.id)

        // Get the platform from metadata
        const platforms = post.metadata?.platforms || []
        const platform = platforms[0] // Use first platform
        
        if (!platform || !post.integration) {
          throw new Error('No platform or integration found')
        }

        // Publish to the platform
        const publishResult = await publishToPlatform(
          platform,
          post.integration,
          post
        )

        if (publishResult.success) {
          // Update post as published
          await supabase
            .from('social_posts')
            .update({ 
              state: 'published',
              analytics: publishResult.analytics || {},
              metadata: {
                ...post.metadata,
                published_at: new Date().toISOString(),
                platform_post_id: publishResult.platformPostId
              }
            })
            .eq('id', post.id)

          results.push({ postId: post.id, status: 'published' })
        } else {
          throw new Error(publishResult.error || 'Unknown error')
        }
      } catch (error) {
        // Update post as failed
        await supabase
          .from('social_posts')
          .update({ 
            state: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', post.id)

        results.push({ 
          postId: post.id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Simplified platform publishing logic
async function publishToPlatform(
  platform: string,
  integration: any,
  post: any
): Promise<any> {
  const { token, refresh_token } = integration
  
  // Check if token needs refresh
  if (integration.token_expiration && new Date(integration.token_expiration) < new Date()) {
    try {
      const newTokens = await refreshAccessToken(platform, refresh_token)
      // Update tokens in database
      await supabaseAdmin
        .from('social_integrations')
        .update({
          token: newTokens.accessToken,
          refresh_token: refresh_token,
          token_expiration: new Date(Date.now() + (newTokens.expiresIn || 3600) * 1000).toISOString()
        })
        .eq('id', integration.id)
      
      integration.token = newTokens.accessToken
    } catch (error) {
      return { success: false, error: 'Token refresh failed' }
    }
  }

  // Platform-specific publishing
  switch (platform) {
    case 'x':
    case 'twitter':
      return await publishToX(integration.token, post)
    
    case 'facebook':
      return await publishToFacebook(integration.token, post, integration.provider_identifier)
    
    case 'instagram':
      return await publishToInstagram(integration.token, post, integration.provider_identifier)
    
    case 'youtube':
      return await publishToYouTube(integration.token, post)
    
    default:
      return { success: false, error: `Platform ${platform} not implemented` }
  }
}

// X/Twitter Publishing
async function publishToX(token: string, post: any) {
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: post.content
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to post')
    }

    const data = await response.json()
    return {
      success: true,
      platformPostId: data.data.id,
      analytics: {
        url: `https://twitter.com/i/web/status/${data.data.id}`
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'X API error' 
    }
  }
}

// Facebook Publishing
async function publishToFacebook(token: string, post: any, pageId: string) {
  try {
    const params = new URLSearchParams({
      access_token: token,
      message: post.content
    })

    if (post.media_urls?.length > 0) {
      params.append('link', post.media_urls[0])
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: 'POST',
        body: params
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to post')
    }

    const data = await response.json()
    return {
      success: true,
      platformPostId: data.id,
      analytics: {
        url: `https://www.facebook.com/${data.id}`
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Facebook API error' 
    }
  }
}

// Instagram Publishing
async function publishToInstagram(token: string, post: any, pageId: string) {
  try {
    if (!post.media_urls || post.media_urls.length === 0) {
      throw new Error('Instagram requires media')
    }

    // Step 1: Create media container
    const createParams = new URLSearchParams({
      access_token: token,
      image_url: post.media_urls[0],
      caption: post.content
    })

    const createResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/media`,
      {
        method: 'POST',
        body: createParams
      }
    )

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.error?.message || 'Failed to create media')
    }

    const { id: containerId } = await createResponse.json()

    // Step 2: Publish the container
    const publishParams = new URLSearchParams({
      access_token: token,
      creation_id: containerId
    })

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/media_publish`,
      {
        method: 'POST',
        body: publishParams
      }
    )

    if (!publishResponse.ok) {
      const error = await publishResponse.json()
      throw new Error(error.error?.message || 'Failed to publish')
    }

    const { id: postId } = await publishResponse.json()
    
    return {
      success: true,
      platformPostId: postId,
      analytics: {
        url: `https://www.instagram.com/p/${postId}/`
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Instagram API error' 
    }
  }
}

// YouTube Publishing (simplified - full implementation would be more complex)
async function publishToYouTube(token: string, post: any) {
  // YouTube video upload is complex and requires resumable uploads
  // This is a simplified version
  return {
    success: false,
    error: 'YouTube publishing requires video upload implementation'
  }
} 