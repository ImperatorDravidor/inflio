import { PLATFORM_CONFIGS } from './oauth-config'
import { handleError, AppError } from '../error-handler'
import { createSupabaseBrowserClient } from '../supabase/client'

export interface PublishResult {
  success: boolean
  platformPostId?: string
  error?: string
  url?: string
}

export interface PublishOptions {
  content: string
  mediaUrls?: string[]
  hashtags?: string[]
  metadata?: any
}

// Base publisher class
abstract class PlatformPublisher {
  protected accessToken: string
  protected config: any

  constructor(accessToken: string, platform: string) {
    this.accessToken = accessToken
    this.config = PLATFORM_CONFIGS[platform]
    if (!this.config) {
      throw new AppError(`Platform ${platform} not configured`, 'INVALID_PLATFORM')
    }
  }

  abstract publish(options: PublishOptions): Promise<PublishResult>
  
  protected async uploadMedia(mediaUrl: string): Promise<string> {
    // Default implementation - platforms can override
    return mediaUrl
  }
}

// Instagram Publisher
class InstagramPublisher extends PlatformPublisher {
  async publish(options: PublishOptions): Promise<PublishResult> {
    try {
      const { content, mediaUrls, hashtags } = options
      const caption = this.buildCaption(content, hashtags)

      if (!mediaUrls || mediaUrls.length === 0) {
        // Text-only posts not supported on Instagram
        throw new AppError('Instagram requires at least one image or video', 'INVALID_CONTENT')
      }

      // For single image/video
      if (mediaUrls.length === 1) {
        return await this.publishSingleMedia(mediaUrls[0], caption)
      }

      // For carousel (multiple images)
      return await this.publishCarousel(mediaUrls, caption)
    } catch (error) {
      handleError(error, 'instagram-publish')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Instagram publishing failed'
      }
    }
  }

  private async publishSingleMedia(mediaUrl: string, caption: string): Promise<PublishResult> {
    // Step 1: Create media container
    const createResponse = await fetch(
      `${this.config.apiBaseUrl}/me/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: mediaUrl,
          caption,
          access_token: this.accessToken
        })
      }
    )

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new AppError(`Failed to create Instagram media: ${error.error?.message}`, 'INSTAGRAM_ERROR')
    }

    const { id: containerId } = await createResponse.json()

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `${this.config.apiBaseUrl}/me/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: this.accessToken
        })
      }
    )

    if (!publishResponse.ok) {
      const error = await publishResponse.json()
      throw new AppError(`Failed to publish Instagram media: ${error.error?.message}`, 'INSTAGRAM_ERROR')
    }

    const { id: postId } = await publishResponse.json()

    return {
      success: true,
      platformPostId: postId,
      url: `https://www.instagram.com/p/${postId}/`
    }
  }

  private async publishCarousel(mediaUrls: string[], caption: string): Promise<PublishResult> {
    // Step 1: Create media containers for each item
    const containerIds = []
    
    for (const mediaUrl of mediaUrls.slice(0, 10)) { // Max 10 items
      const response = await fetch(
        `${this.config.apiBaseUrl}/me/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: mediaUrl,
            is_carousel_item: true,
            access_token: this.accessToken
          })
        }
      )

      if (!response.ok) {
        throw new AppError('Failed to create carousel item', 'INSTAGRAM_ERROR')
      }

      const { id } = await response.json()
      containerIds.push(id)
    }

    // Step 2: Create carousel container
    const carouselResponse = await fetch(
      `${this.config.apiBaseUrl}/me/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: containerIds,
          caption,
          access_token: this.accessToken
        })
      }
    )

    if (!carouselResponse.ok) {
      throw new AppError('Failed to create carousel', 'INSTAGRAM_ERROR')
    }

    const { id: carouselId } = await carouselResponse.json()

    // Step 3: Publish
    const publishResponse = await fetch(
      `${this.config.apiBaseUrl}/me/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: carouselId,
          access_token: this.accessToken
        })
      }
    )

    if (!publishResponse.ok) {
      throw new AppError('Failed to publish carousel', 'INSTAGRAM_ERROR')
    }

    const { id: postId } = await publishResponse.json()

    return {
      success: true,
      platformPostId: postId,
      url: `https://www.instagram.com/p/${postId}/`
    }
  }

  private buildCaption(content: string, hashtags?: string[]): string {
    let caption = content
    if (hashtags && hashtags.length > 0) {
      const tags = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      caption += '\n\n' + tags.join(' ')
    }
    return caption
  }
}

// X (Twitter) Publisher
class XPublisher extends PlatformPublisher {
  async publish(options: PublishOptions): Promise<PublishResult> {
    try {
      const { content, mediaUrls } = options
      
      // Upload media if present
      const mediaIds = []
      if (mediaUrls && mediaUrls.length > 0) {
        for (const mediaUrl of mediaUrls.slice(0, 4)) { // Max 4 media items
          const mediaId = await this.uploadMedia(mediaUrl)
          mediaIds.push(mediaId)
        }
      }

      // Create tweet
      const tweetData: any = { text: content }
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds }
      }

      const response = await fetch(
        `${this.config.apiBaseUrl}/tweets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tweetData)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new AppError(`Failed to post tweet: ${error.detail}`, 'X_ERROR')
      }

      const { data } = await response.json()

      return {
        success: true,
        platformPostId: data.id,
        url: `https://x.com/i/status/${data.id}`
      }
    } catch (error) {
      handleError(error, 'x-publish')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'X publishing failed'
      }
    }
  }

  protected async uploadMedia(mediaUrl: string): Promise<string> {
    // X media upload is complex - simplified version
    // In production, implement chunked upload for large files
    const mediaResponse = await fetch(mediaUrl)
    const mediaBlob = await mediaResponse.blob()
    
    // This is a simplified example - actual implementation needs chunked upload
    const formData = new FormData()
    formData.append('media', mediaBlob)
    
    const uploadResponse = await fetch(
      'https://upload.twitter.com/1.1/media/upload.json',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formData
      }
    )

    if (!uploadResponse.ok) {
      throw new AppError('Failed to upload media to X', 'X_MEDIA_ERROR')
    }

    const { media_id_string } = await uploadResponse.json()
    return media_id_string
  }
}

// LinkedIn Publisher
class LinkedInPublisher extends PlatformPublisher {
  async publish(options: PublishOptions): Promise<PublishResult> {
    try {
      const { content, mediaUrls } = options
      
      // Get person URN
      const profileResponse = await fetch(
        'https://api.linkedin.com/v2/me',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      )

      if (!profileResponse.ok) {
        throw new AppError('Failed to get LinkedIn profile', 'LINKEDIN_ERROR')
      }

      const profile = await profileResponse.json()
      const authorUrn = `urn:li:person:${profile.id}`

      // Create post
      const shareContent: any = {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: mediaUrls && mediaUrls.length > 0 ? 'IMAGE' : 'NONE'
      }

      // Add media if present
      if (mediaUrls && mediaUrls.length > 0) {
        // LinkedIn media upload is complex - this is simplified
        // In production, implement proper asset upload flow
        shareContent.media = mediaUrls.map(url => ({
          status: 'READY',
          originalUrl: url
        }))
      }

      const postData = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': shareContent
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }

      const response = await fetch(
        `${this.config.apiBaseUrl}/ugcPosts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new AppError(`Failed to post to LinkedIn: ${error.message}`, 'LINKEDIN_ERROR')
      }

      const result = await response.json()
      const postId = result.id.split(':').pop()

      return {
        success: true,
        platformPostId: postId,
        url: `https://www.linkedin.com/feed/update/${result.id}/`
      }
    } catch (error) {
      handleError(error, 'linkedin-publish')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LinkedIn publishing failed'
      }
    }
  }
}

// Factory function to get publisher
export function getPlatformPublisher(platform: string, accessToken: string): PlatformPublisher {
  switch (platform) {
    case 'instagram':
      return new InstagramPublisher(accessToken, platform)
    case 'x':
      return new XPublisher(accessToken, platform)
    case 'linkedin':
      return new LinkedInPublisher(accessToken, platform)
    // Add other platforms as needed
    default:
      throw new AppError(`Publisher not implemented for ${platform}`, 'NOT_IMPLEMENTED')
  }
}

// Main publishing function
export async function publishToSocialPlatform(
  platform: string,
  accessToken: string,
  options: PublishOptions
): Promise<PublishResult> {
  try {
    const publisher = getPlatformPublisher(platform, accessToken)
    return await publisher.publish(options)
  } catch (error) {
    handleError(error, `publish-${platform}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Publishing failed'
    }
  }
}

// Token refresh helper
export async function refreshAccessToken(
  platform: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const config = PLATFORM_CONFIGS[platform]
  if (!config) {
    throw new AppError(`Platform ${platform} not configured`, 'INVALID_PLATFORM')
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.oauth.clientId,
    client_secret: config.oauth.clientSecret
  })

  const response = await fetch(config.oauth.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    throw new AppError('Failed to refresh token', 'TOKEN_REFRESH_ERROR')
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  }
} 