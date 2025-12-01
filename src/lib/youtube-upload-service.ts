// YouTube Upload Service for Submagic Magic Clips Integration
// Uploads videos to YouTube as unlisted for clip generation

import { logger } from './logger'

interface YouTubeUploadOptions {
  videoUrl: string
  title: string
  description?: string
  privacy?: 'private' | 'unlisted' | 'public'
}

interface YouTubeUploadResult {
  videoId: string
  videoUrl: string
  uploadStatus: 'uploaded' | 'processing' | 'failed'
}

export class YouTubeUploadService {
  /**
   * Get YouTube API configuration
   */
  private static getConfig() {
    const apiKey = process.env.YOUTUBE_API_KEY || ''
    const clientId = process.env.YOUTUBE_CLIENT_ID || ''
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || ''
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN || ''
    
    // Check if we have OAuth credentials
    const hasOAuth = clientId && clientSecret && refreshToken
    
    // Check if we have API key (less functionality but easier)
    const hasApiKey = !!apiKey
    
    if (!hasOAuth && !hasApiKey) {
      logger.error('[YouTube] No YouTube credentials configured', {
        action: 'youtube_config',
        metadata: { service: 'youtube' }
      })
      throw new Error('YouTube API is not configured. Please set YOUTUBE_API_KEY or OAuth credentials.')
    }
    
    return { 
      apiKey, 
      clientId, 
      clientSecret, 
      refreshToken,
      hasOAuth,
      hasApiKey
    }
  }

  /**
   * Get OAuth2 access token using refresh token
   */
  private static async getAccessToken(): Promise<string> {
    const { clientId, clientSecret, refreshToken } = this.getConfig()
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      logger.error('[YouTube] Failed to get access token', {
        action: 'youtube_auth_failed',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      throw error
    }
  }

  /**
   * Upload video to YouTube
   */
  static async uploadVideo(options: YouTubeUploadOptions): Promise<YouTubeUploadResult> {
    const { videoUrl, title, description, privacy = 'unlisted' } = options
    
    logger.info('[YouTube] Starting video upload', {
      action: 'youtube_upload_start',
      metadata: { title, privacy, videoUrl }
    })

    try {
      const { hasOAuth } = this.getConfig()
      
      if (!hasOAuth) {
        throw new Error('YouTube OAuth is required for uploading videos. API key alone is not sufficient.')
      }

      // Get access token
      const accessToken = await this.getAccessToken()

      // Step 1: Download video from URL
      logger.debug('[YouTube] Downloading video from URL', {
        action: 'youtube_download_video',
        metadata: { videoUrl }
      })
      
      const videoResponse = await fetch(videoUrl)
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`)
      }
      
      const videoBlob = await videoResponse.blob()
      const videoBuffer = await videoBlob.arrayBuffer()
      
      logger.debug('[YouTube] Video downloaded, size:', {
        action: 'youtube_video_downloaded',
        metadata: { size: videoBuffer.byteLength }
      })

      // Step 2: Initialize upload
      const metadata = {
        snippet: {
          title: title.substring(0, 100), // YouTube title max 100 chars
          description: description || 'Uploaded for AI clip generation',
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false,
        },
      }

      const initResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': String(videoBuffer.byteLength),
            'X-Upload-Content-Type': 'video/*',
          },
          body: JSON.stringify(metadata),
        }
      )

      if (!initResponse.ok) {
        const errorText = await initResponse.text()
        throw new Error(`Failed to initialize upload: ${initResponse.statusText} - ${errorText}`)
      }

      const uploadUrl = initResponse.headers.get('Location')
      if (!uploadUrl) {
        throw new Error('No upload URL returned from YouTube')
      }

      // Step 3: Upload video content
      logger.debug('[YouTube] Uploading video content', {
        action: 'youtube_upload_content',
        metadata: { uploadUrl }
      })

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/*',
        },
        body: videoBuffer,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`Failed to upload video: ${uploadResponse.statusText} - ${errorText}`)
      }

      const result = await uploadResponse.json()
      const videoId = result.id

      logger.info('[YouTube] Video uploaded successfully', {
        action: 'youtube_upload_success',
        metadata: { videoId, title }
      })

      return {
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        uploadStatus: 'uploaded',
      }
    } catch (error) {
      logger.error('[YouTube] Upload failed', {
        action: 'youtube_upload_failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          videoUrl,
          title
        }
      })
      throw error
    }
  }

  /**
   * Check if a YouTube video exists and is accessible
   */
  static async checkVideoStatus(videoId: string): Promise<'available' | 'processing' | 'not_found'> {
    try {
      const { apiKey, hasApiKey } = this.getConfig()
      
      if (!hasApiKey) {
        // If we don't have API key, assume it's available
        return 'available'
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${apiKey}`
      )

      if (!response.ok) {
        return 'not_found'
      }

      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        return 'not_found'
      }

      const uploadStatus = data.items[0].status.uploadStatus
      
      if (uploadStatus === 'uploaded') {
        return 'available'
      } else if (uploadStatus === 'processing') {
        return 'processing'
      } else {
        return 'not_found'
      }
    } catch (error) {
      logger.error('[YouTube] Failed to check video status', {
        action: 'youtube_check_status_failed',
        metadata: { 
          videoId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      })
      return 'not_found'
    }
  }

  /**
   * Delete a video from YouTube (cleanup after processing)
   */
  static async deleteVideo(videoId: string): Promise<boolean> {
    try {
      const { hasOAuth } = this.getConfig()
      
      if (!hasOAuth) {
        logger.warn('[YouTube] Cannot delete video without OAuth credentials', {
          action: 'youtube_delete_skipped',
          metadata: { videoId }
        })
        return false
      }

      const accessToken = await this.getAccessToken()

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.statusText}`)
      }

      logger.info('[YouTube] Video deleted successfully', {
        action: 'youtube_delete_success',
        metadata: { videoId }
      })

      return true
    } catch (error) {
      logger.error('[YouTube] Failed to delete video', {
        action: 'youtube_delete_failed',
        metadata: {
          videoId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      return false
    }
  }
}


