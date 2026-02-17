/**
 * Service to convert AI post suggestions into staging-ready content
 * Only posts with complete data (captions, images, hashtags) can be staged
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { StagedContent } from '@/lib/staging/staging-service'
import { Platform } from '@/lib/social/types'

export interface PostSuggestion {
  id: string
  project_id: string
  user_id: string
  content_type: string
  title: string
  description?: string
  platforms: string[]
  copy_variants: Record<string, {
    caption: string
    hashtags: string[]
    cta?: string
    title?: string
    description?: string
  }>
  images: Array<{
    id: string
    url?: string
    prompt: string
    type: string
  }>
  metadata?: {
    ready_to_post?: boolean
    quality_score?: number
    [key: string]: any
  }
}

export class PostsToStagingService {
  /**
   * Check if a post suggestion is ready to be staged
   * Must have: complete captions, images, hashtags for all platforms
   */
  static isPostReadyForStaging(suggestion: PostSuggestion): boolean {
    // Must have at least one platform
    if (!suggestion.platforms || suggestion.platforms.length === 0) {
      return false
    }
    
    // Must have generated images
    if (!suggestion.images || suggestion.images.length === 0) {
      return false
    }
    
    // At least one image must have a URL (generated)
    const hasGeneratedImage = suggestion.images.some(img => img.url)
    if (!hasGeneratedImage) {
      return false
    }
    
    // Must have copy variants for all platforms
    if (!suggestion.copy_variants) {
      return false
    }
    
    // Check each platform has complete content
    for (const platform of suggestion.platforms) {
      const platformCopy = suggestion.copy_variants[platform]
      
      if (!platformCopy) {
        return false
      }
      
      // Must have caption
      if (!platformCopy.caption || platformCopy.caption.trim().length === 0) {
        return false
      }
      
      // Must have hashtags
      if (!platformCopy.hashtags || platformCopy.hashtags.length === 0) {
        return false
      }
      
      // Must have CTA
      if (!platformCopy.cta || platformCopy.cta.trim().length === 0) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * Get missing elements for a post to be ready
   */
  static getMissingElements(suggestion: PostSuggestion): string[] {
    const missing: string[] = []
    
    if (!suggestion.platforms || suggestion.platforms.length === 0) {
      missing.push('No platforms selected')
    }
    
    if (!suggestion.images || suggestion.images.length === 0) {
      missing.push('No images')
    } else {
      const hasGeneratedImage = suggestion.images.some(img => img.url)
      if (!hasGeneratedImage) {
        missing.push('Images not generated yet')
      }
    }
    
    if (!suggestion.copy_variants) {
      missing.push('No captions')
    } else {
      for (const platform of suggestion.platforms || []) {
        const platformCopy = suggestion.copy_variants[platform]
        
        if (!platformCopy) {
          missing.push(`Missing ${platform} content`)
          continue
        }
        
        if (!platformCopy.caption || platformCopy.caption.trim().length === 0) {
          missing.push(`${platform} caption`)
        }
        
        if (!platformCopy.hashtags || platformCopy.hashtags.length === 0) {
          missing.push(`${platform} hashtags`)
        }
        
        if (!platformCopy.cta || platformCopy.cta.trim().length === 0) {
          missing.push(`${platform} CTA`)
        }
      }
    }
    
    return missing
  }
  
  /**
   * Convert a post suggestion to staged content
   * Only call this for ready posts (check with isPostReadyForStaging first)
   */
  static async sendToStaging(
    suggestion: PostSuggestion,
    projectId: string,
    userId: string
  ): Promise<{ success: boolean; stagedId?: string; error?: string }> {
    
    // Validate the post is ready
    if (!this.isPostReadyForStaging(suggestion)) {
      const missing = this.getMissingElements(suggestion)
      return {
        success: false,
        error: `Post is not ready. Missing: ${missing.join(', ')}`
      }
    }
    
    const supabase = createSupabaseBrowserClient()
    
    try {
      // Convert suggestion to staged content format
      const stagedContent: StagedContent = {
        id: suggestion.id,
        type: this.mapContentType(suggestion.content_type),
        title: suggestion.title,
        description: suggestion.description,
        platforms: suggestion.platforms as Platform[],
        platformContent: this.buildPlatformContent(suggestion),
        mediaUrls: suggestion.images
          .filter(img => img.url)
          .map(img => img.url!),
        thumbnailUrl: suggestion.images.find(img => img.url)?.url,
        originalData: {
          suggestionId: suggestion.id,
          projectId: projectId,
          contentType: suggestion.content_type,
          qualityScore: suggestion.metadata?.quality_score,
          generatedAt: new Date().toISOString()
        },
        analytics: {
          estimatedReach: suggestion.metadata?.engagement_prediction 
            ? Math.round(suggestion.metadata.engagement_prediction * 10000)
            : undefined
        }
      }
      
      // Insert into staged_posts table
      const { data: stagedPost, error } = await supabase
        .from('staged_posts')
        .insert({
          user_id: userId,
          project_id: projectId,
          title: stagedContent.title,
          description: stagedContent.description,
          type: stagedContent.type,
          platforms: stagedContent.platforms,
          platform_content: stagedContent.platformContent,
          media_urls: stagedContent.mediaUrls,
          thumbnail_url: stagedContent.thumbnailUrl,
          metadata: {
            ...stagedContent.originalData,
            analytics: stagedContent.analytics
          },
          status: 'ready',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('[PostsToStaging] Error inserting to staging:', error)
        return {
          success: false,
          error: error.message
        }
      }
      
      // Mark the suggestion as staged
      await supabase
        .from('post_suggestions')
        .update({
          status: 'staged',
          staged_at: new Date().toISOString()
        })
        .eq('id', suggestion.id)
      
      return {
        success: true,
        stagedId: stagedPost.id
      }
      
    } catch (error: any) {
      console.error('[PostsToStaging] Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send to staging'
      }
    }
  }
  
  /**
   * Map content type to staging type
   */
  private static mapContentType(contentType: string): 'clip' | 'blog' | 'image' | 'carousel' {
    switch (contentType) {
      case 'carousel':
        return 'carousel'
      case 'blog':
      case 'thread':
        return 'blog'
      case 'reel':
      case 'video':
        return 'clip'
      default:
        return 'image'
    }
  }
  
  /**
   * Build platform content from suggestion
   */
  private static buildPlatformContent(suggestion: PostSuggestion) {
    const platformContent: any = {}
    
    for (const platform of suggestion.platforms) {
      const copy = suggestion.copy_variants[platform]
      
      if (copy) {
        platformContent[platform] = {
          caption: copy.caption,
          hashtags: copy.hashtags,
          mentions: [],
          title: copy.title || suggestion.title,
          description: copy.description || suggestion.description,
          cta: copy.cta,
          altText: `${suggestion.title} - ${suggestion.description}`,
          characterCount: copy.caption.length,
          isValid: true,
          validationErrors: []
        }
      }
    }
    
    return platformContent
  }
  
  /**
   * Batch send multiple suggestions to staging
   */
  static async sendBatchToStaging(
    suggestions: PostSuggestion[],
    projectId: string,
    userId: string
  ): Promise<{
    success: number
    failed: number
    errors: Array<{ id: string; error: string }>
  }> {
    
    const results = await Promise.all(
      suggestions.map(suggestion => 
        this.sendToStaging(suggestion, projectId, userId)
      )
    )
    
    const success = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const errors = results
      .filter(r => !r.success)
      .map((r, i) => ({
        id: suggestions[i].id,
        error: r.error || 'Unknown error'
      }))
    
    return { success, failed, errors }
  }
}





