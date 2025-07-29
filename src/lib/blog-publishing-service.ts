import { createSupabaseBrowserClient } from './supabase/client'
import { toast } from 'sonner'

export interface BlogPublishOptions {
  platform: 'medium' | 'linkedin' | 'newsletter' | 'wordpress' | 'dev.to'
  blogPost: {
    title: string
    content: string
    excerpt: string
    tags: string[]
    coverImage?: string
    canonicalUrl?: string
  }
  scheduling?: {
    publishAt?: Date
    timezone?: string
  }
  platformSpecific?: {
    medium?: {
      publicationId?: string
      license?: 'all-rights-reserved' | 'cc-40-by' | 'cc-40-by-sa' | 'cc-40-by-nd' | 'cc-40-by-nc' | 'cc-40-by-nc-nd' | 'cc-40-by-nc-sa' | 'cc-40-zero' | 'public-domain'
      notifyFollowers?: boolean
    }
    linkedin?: {
      visibility?: 'PUBLIC' | 'CONNECTIONS'
      shareCommentary?: string
      disableComments?: boolean
      disableReshares?: boolean
    }
    newsletter?: {
      subscriberList?: string[]
      subject?: string
      preheader?: string
      footerContent?: string
      trackOpens?: boolean
      trackClicks?: boolean
    }
  }
}

export class BlogPublishingService {
  /**
   * Publish to Medium
   */
  static async publishToMedium(options: BlogPublishOptions): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get Medium integration token
      const { data: integration } = await supabase
        .from('social_accounts')
        .select('access_token, metadata')
        .eq('user_id', user.id)
        .eq('platform', 'medium')
        .single()

      if (!integration?.access_token) {
        return { success: false, error: 'Medium account not connected' }
      }

      // Format content for Medium
      const mediumContent = await this.formatForMedium(options.blogPost)

      // Medium API request
      const response = await fetch('https://api.medium.com/v1/users/me/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: options.blogPost.title,
          contentFormat: 'html',
          content: mediumContent,
          tags: options.blogPost.tags.slice(0, 5), // Medium allows max 5 tags
          canonicalUrl: options.blogPost.canonicalUrl,
          publishStatus: 'public',
          license: options.platformSpecific?.medium?.license || 'all-rights-reserved',
          notifyFollowers: options.platformSpecific?.medium?.notifyFollowers !== false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors?.[0]?.message || 'Failed to publish to Medium')
      }

      const result = await response.json()
      
      // Track publication
      await this.trackPublication(user.id, 'medium', options.blogPost.title, result.data.url)

      return { success: true, url: result.data.url }
    } catch (error) {
      console.error('Medium publishing error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to publish to Medium' }
    }
  }

  /**
   * Publish to LinkedIn
   */
  static async publishToLinkedIn(options: BlogPublishOptions): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get LinkedIn integration
      const { data: integration } = await supabase
        .from('social_accounts')
        .select('access_token, platform_user_id')
        .eq('user_id', user.id)
        .eq('platform', 'linkedin')
        .single()

      if (!integration?.access_token) {
        return { success: false, error: 'LinkedIn account not connected' }
      }

      // Format content for LinkedIn article
      const linkedInContent = await this.formatForLinkedIn(options.blogPost)

      // LinkedIn API request for article
      const response = await fetch('https://api.linkedin.com/v2/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: `urn:li:person:${integration.platform_user_id}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: options.platformSpecific?.linkedin?.shareCommentary || options.blogPost.excerpt
              },
              shareMediaCategory: 'ARTICLE',
              media: [{
                status: 'READY',
                title: {
                  text: options.blogPost.title
                },
                description: {
                  text: options.blogPost.excerpt
                },
                originalUrl: options.blogPost.canonicalUrl || 'https://inflio.com',
                article: {
                  source: options.blogPost.canonicalUrl || 'https://inflio.com',
                  thumbnail: options.blogPost.coverImage,
                  description: linkedInContent,
                  title: options.blogPost.title
                }
              }]
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': options.platformSpecific?.linkedin?.visibility || 'PUBLIC'
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to publish to LinkedIn')
      }

      const result = await response.json()
      const articleId = result.id
      const articleUrl = `https://www.linkedin.com/pulse/${articleId}`

      // Track publication
      await this.trackPublication(user.id, 'linkedin', options.blogPost.title, articleUrl)

      return { success: true, url: articleUrl }
    } catch (error) {
      console.error('LinkedIn publishing error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to publish to LinkedIn' }
    }
  }

  /**
   * Send as Newsletter
   */
  static async sendNewsletter(options: BlogPublishOptions): Promise<{ success: boolean; sentCount?: number; error?: string }> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get newsletter configuration
      const { data: config } = await supabase
        .from('newsletter_config')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!config) {
        return { success: false, error: 'Newsletter not configured. Please set up your newsletter settings first.' }
      }

      // Get subscriber list
      const { data: subscribers } = await supabase
        .from('newsletter_subscribers')
        .select('email, name')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!subscribers || subscribers.length === 0) {
        return { success: false, error: 'No active subscribers found' }
      }

      // Format content for email
      const emailContent = await this.formatForNewsletter(options.blogPost, config)

      // Send via email service (using Resend/SendGrid/etc)
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: options.platformSpecific?.newsletter?.subject || options.blogPost.title,
          preheader: options.platformSpecific?.newsletter?.preheader || options.blogPost.excerpt,
          content: emailContent,
          subscribers: options.platformSpecific?.newsletter?.subscriberList || subscribers,
          config: {
            trackOpens: options.platformSpecific?.newsletter?.trackOpens ?? true,
            trackClicks: options.platformSpecific?.newsletter?.trackClicks ?? true,
            footerContent: options.platformSpecific?.newsletter?.footerContent || config.default_footer
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send newsletter')
      }

      const result = await response.json()

      // Track newsletter send
      await this.trackPublication(user.id, 'newsletter', options.blogPost.title, null, {
        sentCount: result.sentCount,
        subscriberCount: subscribers.length
      })

      return { success: true, sentCount: result.sentCount }
    } catch (error) {
      console.error('Newsletter sending error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send newsletter' }
    }
  }

  /**
   * Format content for Medium
   */
  private static async formatForMedium(blogPost: any): Promise<string> {
    let content = `<h1>${blogPost.title}</h1>`
    
    if (blogPost.coverImage) {
      content += `<img src="${blogPost.coverImage}" alt="${blogPost.title}">`
    }
    
    content += `<p><em>${blogPost.excerpt}</em></p>`
    content += blogPost.content
    
    // Add tags at the end
    if (blogPost.tags.length > 0) {
      content += '<p>Tags: ' + blogPost.tags.map((tag: string) => `<em>${tag}</em>`).join(', ') + '</p>'
    }
    
    return content
  }

  /**
   * Format content for LinkedIn
   */
  private static async formatForLinkedIn(blogPost: any): Promise<string> {
    // LinkedIn has character limits and specific formatting
    let content = blogPost.content
      .replace(/<h1>/g, '\n\n**')
      .replace(/<\/h1>/g, '**\n\n')
      .replace(/<h2>/g, '\n\n**')
      .replace(/<\/h2>/g, '**\n\n')
      .replace(/<h3>/g, '\n\n*')
      .replace(/<\/h3>/g, '*\n\n')
      .replace(/<strong>/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<em>/g, '*')
      .replace(/<\/em>/g, '*')
      .replace(/<p>/g, '\n\n')
      .replace(/<\/p>/g, '')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags

    // Truncate if too long (LinkedIn limit ~40k characters)
    if (content.length > 39000) {
      content = content.substring(0, 39000) + '...\n\n[Read more on our website]'
    }

    // Add hashtags
    if (blogPost.tags.length > 0) {
      content += '\n\n' + blogPost.tags.map((tag: string) => `#${tag.replace(/\s+/g, '')}`).join(' ')
    }

    return content
  }

  /**
   * Format content for Newsletter
   */
  private static async formatForNewsletter(blogPost: any, config: any): Promise<string> {
    // Create beautiful HTML email template
    const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blogPost.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 20px;
    }
    h1 {
      color: #2c3e50;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .excerpt {
      color: #7f8c8d;
      font-size: 18px;
      font-style: italic;
      margin-bottom: 30px;
    }
    .content {
      font-size: 16px;
      color: #34495e;
    }
    .content h2 {
      color: #2c3e50;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .content h3 {
      color: #34495e;
      margin-top: 25px;
      margin-bottom: 10px;
    }
    .content p {
      margin: 15px 0;
    }
    .content ul, .content ol {
      margin: 15px 0;
      padding-left: 30px;
    }
    .content li {
      margin: 8px 0;
    }
    .content a {
      color: #3498db;
      text-decoration: none;
    }
    .content a:hover {
      text-decoration: underline;
    }
    .content img {
      max-width: 100%;
      height: auto;
      margin: 20px 0;
      border-radius: 8px;
    }
    .content blockquote {
      border-left: 4px solid #3498db;
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: #7f8c8d;
    }
    .cta {
      text-align: center;
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #ecf0f1;
      text-align: center;
      color: #95a5a6;
      font-size: 14px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      margin: 0 10px;
      color: #95a5a6;
      text-decoration: none;
    }
    .unsubscribe {
      margin-top: 20px;
      font-size: 12px;
    }
    .unsubscribe a {
      color: #95a5a6;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${config.logo_url ? `<img src="${config.logo_url}" alt="Logo" class="logo">` : ''}
      <h1>${blogPost.title}</h1>
      <p class="excerpt">${blogPost.excerpt}</p>
    </div>
    
    ${blogPost.coverImage ? `<img src="${blogPost.coverImage}" alt="${blogPost.title}" style="width: 100%; border-radius: 8px; margin-bottom: 30px;">` : ''}
    
    <div class="content">
      ${blogPost.content}
    </div>
    
    <div class="cta">
      <a href="${config.website_url || '#'}" class="cta-button">Read More on Our Website</a>
    </div>
    
    <div class="footer">
      ${config.footer_content || ''}
      
      <div class="social-links">
        ${config.social_links?.twitter ? `<a href="${config.social_links.twitter}">Twitter</a>` : ''}
        ${config.social_links?.linkedin ? `<a href="${config.social_links.linkedin}">LinkedIn</a>` : ''}
        ${config.social_links?.facebook ? `<a href="${config.social_links.facebook}">Facebook</a>` : ''}
      </div>
      
      <div class="unsubscribe">
        <a href="{{{unsubscribe_url}}}">Unsubscribe</a> | 
        <a href="{{{preferences_url}}}">Update Preferences</a>
      </div>
    </div>
  </div>
</body>
</html>`

    return template
  }

  /**
   * Track publication analytics
   */
  private static async trackPublication(
    userId: string, 
    platform: string, 
    title: string, 
    url: string | null,
    metadata?: any
  ) {
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.from('blog_publications').insert({
        user_id: userId,
        platform,
        title,
        url,
        metadata,
        published_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to track publication:', error)
    }
  }

  /**
   * Schedule blog post for future publishing
   */
  static async scheduleBlogPost(
    blogPost: any,
    platforms: Array<{ platform: string; publishAt: Date; options?: any }>,
    userId: string
  ) {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Create scheduled posts
      const scheduledPosts = platforms.map(p => ({
        user_id: userId,
        blog_id: blogPost.id,
        platform: p.platform,
        scheduled_for: p.publishAt.toISOString(),
        options: p.options,
        status: 'scheduled'
      }))

      const { error } = await supabase
        .from('scheduled_blog_posts')
        .insert(scheduledPosts)

      if (error) throw error

      toast.success(`Scheduled ${platforms.length} blog posts`)
      return { success: true }
    } catch (error) {
      console.error('Scheduling error:', error)
      toast.error('Failed to schedule blog posts')
      return { success: false, error }
    }
  }
} 