import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { publishToSocialPlatform, refreshAccessToken } from '@/lib/social/platform-publishers'
import { handleError, AppError } from '@/lib/error-handler'
import { z } from 'zod'

const publishSchema = z.object({
  postId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = publishSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { postId } = validation.data
    const supabase = createSupabaseBrowserClient()

    // Get post details with integration
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .select(`
        *,
        integration:social_integrations(*)
      `)
      .eq('id', postId)
      .eq('user_id', userId)
      .single()

    if (postError || !post) {
      throw new AppError('Post not found', 'POST_NOT_FOUND', 404)
    }

    // Check if post is already published
    if (post.state === 'published') {
      return NextResponse.json({
        success: true,
        message: 'Post already published',
        url: post.metadata?.url
      })
    }

    // Check if post is scheduled for future
    const publishDate = new Date(post.publish_date)
    if (publishDate > new Date()) {
      throw new AppError(
        'Cannot publish future scheduled post. Wait for scheduled time or update publish date.',
        'FUTURE_POST',
        400
      )
    }

    // Get integration details
    let integration = post.integration
    if (!integration && post.integration_id) {
      // Fallback: fetch integration separately
      const { data: integrationData } = await supabase
        .from('social_integrations')
        .select('*')
        .eq('id', post.integration_id)
        .single()
      
      if (!integrationData) {
        throw new AppError('Social account not found', 'INTEGRATION_NOT_FOUND', 404)
      }
      integration = integrationData
    }

    // For staging posts without integration_id, get platform from metadata
    const platform = integration?.platform || post.metadata?.platform || post.platform
    if (!platform) {
      throw new AppError('Platform not specified', 'PLATFORM_MISSING', 400)
    }

    // Update post status to publishing
    await supabase
      .from('social_posts')
      .update({ 
        state: 'publishing',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    try {
      let publishResult
      
      if (integration) {
        // Check if token needs refresh
        let accessToken = integration.token
        
        if (integration.token_expiration) {
          const expiration = new Date(integration.token_expiration)
          if (expiration <= new Date() && integration.refresh_token) {
            // Refresh the token
            const refreshResult = await refreshAccessToken(
              platform,
              integration.refresh_token
            )
            
            accessToken = refreshResult.accessToken
            
            // Update token in database
            await supabase
              .from('social_integrations')
              .update({
                token: accessToken,
                token_expiration: refreshResult.expiresIn 
                  ? new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString()
                  : null,
                refresh_needed: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', integration.id)
          }
        }

        // Publish to platform
        publishResult = await publishToSocialPlatform(
          platform,
          accessToken,
          {
            content: post.content,
            mediaUrls: post.media_urls,
            hashtags: post.hashtags,
            metadata: post.metadata
          }
        )
      } else {
        // Staging post without real integration
        publishResult = {
          success: true,
          platformPostId: `staging-${Date.now()}`,
          url: '#',
          error: 'This is a staged post without a connected account'
        }
      }

      if (publishResult.success) {
        // Update post as published
        await supabase
          .from('social_posts')
          .update({
            state: 'published',
            metadata: {
              ...post.metadata,
              platform_post_id: publishResult.platformPostId,
              url: publishResult.url,
              published_at: new Date().toISOString()
            },
            error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', postId)

        return NextResponse.json({
          success: true,
          message: 'Post published successfully',
          url: publishResult.url,
          platformPostId: publishResult.platformPostId
        })
      } else {
        // Publishing failed
        await supabase
          .from('social_posts')
          .update({
            state: 'failed',
            error: publishResult.error || 'Publishing failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', postId)

        throw new AppError(
          publishResult.error || 'Publishing failed',
          'PUBLISH_FAILED',
          500
        )
      }
    } catch (publishError) {
      // Update post as failed
      await supabase
        .from('social_posts')
        .update({
          state: 'failed',
          error: publishError instanceof Error ? publishError.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      throw publishError
    }

  } catch (error) {
    handleError(error, 'social-publish')
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    )
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