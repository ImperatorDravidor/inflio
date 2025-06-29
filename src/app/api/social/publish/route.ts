import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { publishToSocialPlatform, refreshAccessToken } from '@/lib/social/platform-publishers'
import { handleError, AppError } from '@/lib/error-handler'
import { z } from 'zod'

const publishSchema = z.object({
  content: z.string().min(1).max(5000),
  platforms: z.array(z.string()).min(1),
  media: z.array(z.string()).optional(),
  scheduledFor: z.string().datetime().optional(),
  projectId: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request
    const body = await request.json()
    const validation = publishSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { content, platforms, media, scheduledFor, projectId } = validation.data
    const supabase = createSupabaseBrowserClient()

    // Get connected integrations for the requested platforms
    const { data: integrations, error: integrationsError } = await supabase
      .from('social_integrations')
      .select('*')
      .eq('user_id', userId)
      .in('platform', platforms)
      .eq('disabled', false)

    if (integrationsError || !integrations || integrations.length === 0) {
      return NextResponse.json(
        { error: 'No connected accounts found for the selected platforms' },
        { status: 400 }
      )
    }

    // Create posts for each platform
    const posts = []
    const errors = []

    for (const integration of integrations) {
      try {
        // Create post record
        const { data: post, error: postError } = await supabase
          .from('social_posts')
          .insert({
            user_id: userId,
            integration_id: integration.id,
            project_id: projectId,
            state: scheduledFor ? 'scheduled' : 'publishing',
            publish_date: scheduledFor || new Date().toISOString(),
            content,
            media_urls: media || [],
            settings: {
              platform: integration.platform,
              autoHashtags: true
            }
          })
          .select()
          .single()

        if (postError) throw postError

        // If not scheduled, publish immediately
        if (!scheduledFor) {
          // Call platform-specific publish API
          const publishResult = await publishToPlatform(integration, post)
          
          if (publishResult.success) {
            // Update post state
            await supabase
              .from('social_posts')
              .update({ 
                state: 'published',
                analytics: 'analytics' in publishResult ? publishResult.analytics : {}
              })
              .eq('id', post.id)
            
            posts.push({
              ...post,
              state: 'published',
              platformResponse: 'data' in publishResult ? publishResult.data : null
            })
          } else {
            // Update post state to failed
            await supabase
              .from('social_posts')
              .update({ 
                state: 'failed',
                error: 'error' in publishResult ? publishResult.error : 'Unknown error'
              })
              .eq('id', post.id)
            
            errors.push({
              platform: integration.platform,
              error: 'error' in publishResult ? publishResult.error : 'Unknown error'
            })
          }
        } else {
          posts.push(post)
        }
      } catch (error) {
        errors.push({
          platform: integration.platform,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: posts.length > 0,
      posts,
      errors: errors.length > 0 ? errors : undefined,
      scheduled: !!scheduledFor
    })

  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to publish content',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Platform-specific publishing logic
async function publishToPlatform(integration: any, post: any) {
  const { platform, token } = integration
  
  try {
    switch (platform) {
      case 'x':
      case 'twitter':
        return await publishToTwitter(token, post)
      
      case 'linkedin':
        return await publishToLinkedIn(token, post, integration.provider_identifier)
      
      case 'facebook':
      case 'instagram':
        return await publishToMeta(platform, token, post, integration.provider_identifier)
      
      case 'youtube':
        return await publishToYouTube(token, post)
      
      default:
        return {
          success: false,
          error: `Platform ${platform} not yet implemented`
        }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Platform API error'
    }
  }
}

// Twitter/X Publishing
async function publishToTwitter(token: string, post: any) {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: post.content,
      // Add media if present
      ...(post.media_urls?.length > 0 && {
        media: { media_ids: post.media_urls }
      })
    })
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to post to Twitter')
  }

  return {
    success: true,
    data,
    analytics: {
      post_id: data.data.id,
      url: `https://twitter.com/i/web/status/${data.data.id}`
    }
  }
}

// LinkedIn Publishing
async function publishToLinkedIn(token: string, post: any, authorId: string) {
  // First, register the post
  const registerResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: `urn:li:person:${authorId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.content
          },
          shareMediaCategory: post.media_urls?.length > 0 ? 'IMAGE' : 'NONE',
          // Add media if present
          ...(post.media_urls?.length > 0 && {
            media: post.media_urls.map((url: string) => ({
              status: 'READY',
              originalUrl: url
            }))
          })
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  })

  const data = await registerResponse.json()
  
  if (!registerResponse.ok) {
    throw new Error(data.message || 'Failed to post to LinkedIn')
  }

  return {
    success: true,
    data,
    analytics: {
      post_id: data.id,
      url: `https://www.linkedin.com/feed/update/${data.id}`
    }
  }
}

// Meta (Facebook/Instagram) Publishing
async function publishToMeta(platform: string, token: string, post: any, pageId: string) {
  const endpoint = platform === 'instagram' 
    ? `https://graph.facebook.com/v18.0/${pageId}/media`
    : `https://graph.facebook.com/v18.0/${pageId}/feed`

  const params: any = {
    access_token: token,
    message: post.content
  }

  // Handle media for Instagram
  if (platform === 'instagram' && post.media_urls?.length > 0) {
    params.image_url = post.media_urls[0]
    params.caption = post.content
    delete params.message
  }

  // Handle media for Facebook
  if (platform === 'facebook' && post.media_urls?.length > 0) {
    params.link = post.media_urls[0]
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: new URLSearchParams(params)
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to post to Meta platform')
  }

  // For Instagram, we need to publish the media after creating it
  if (platform === 'instagram' && data.id) {
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/media_publish`,
      {
        method: 'POST',
        body: new URLSearchParams({
          creation_id: data.id,
          access_token: token
        })
      }
    )

    const publishData = await publishResponse.json()
    
    if (!publishResponse.ok) {
      throw new Error(publishData.error?.message || 'Failed to publish Instagram post')
    }

    return {
      success: true,
      data: publishData,
      analytics: {
        post_id: publishData.id,
        url: `https://www.instagram.com/p/${publishData.id}`
      }
    }
  }

  return {
    success: true,
    data,
    analytics: {
      post_id: data.id,
      url: platform === 'facebook' 
        ? `https://www.facebook.com/${data.id}`
        : `https://www.instagram.com/p/${data.id}`
    }
  }
}

// YouTube Publishing (Community Posts or Video Description)
async function publishToYouTube(token: string, post: any) {
  // YouTube doesn't have a direct "post" API like other platforms
  // This would typically be used for community posts or video descriptions
  // For now, return a placeholder
  return {
    success: false,
    error: 'YouTube publishing requires video upload functionality'
  }
}

// Check for posts that need to be published
export async function GET(request: NextRequest) {
  try {
    // This would typically be called by a cron job
    // For now, we'll just return posts that are due to be published
    
    // Note: In a real implementation, you'd query for posts where:
    // - state = 'scheduled'
    // - publish_date <= now()
    
    return NextResponse.json({
      message: 'Scheduler endpoint - implement cron job to call this'
    })
    
  } catch (error) {
    console.error('Error checking scheduled posts:', error)
    return NextResponse.json(
      { error: 'Failed to check scheduled posts' },
      { status: 500 }
    )
  }
} 