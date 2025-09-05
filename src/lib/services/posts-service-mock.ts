/**
 * Mock data generator for posts when OpenAI is not configured
 * This allows testing the posts feature without OpenAI API
 */

import { PostContentType, Platform } from './posts-service'

export class MockPostsGenerator {
  static generateMockContentIdea(params: {
    contentType: PostContentType
    projectTitle: string
  }) {
    const { contentType, projectTitle } = params
    
    const mockIdeas = {
      carousel: {
        title: `5 Key Insights from ${projectTitle}`,
        description: 'Educational carousel post with key takeaways',
        visual_elements: ['Title slide', 'Insight 1', 'Insight 2', 'Insight 3', 'Call to action'],
        key_message: 'Learn the essential points from this content',
        hook: '🚀 Don\'t miss these game-changing insights!',
        prompt: 'Modern, clean design with bold typography and gradient backgrounds'
      },
      quote: {
        title: `Inspiring Quote from ${projectTitle}`,
        description: 'Powerful quote card with attribution',
        visual_elements: ['Quote text', 'Speaker attribution', 'Brand elements'],
        key_message: 'Wisdom worth sharing',
        hook: '💭 This will change how you think...',
        prompt: 'Minimalist quote card with elegant typography'
      },
      single: {
        title: `Key Takeaway: ${projectTitle}`,
        description: 'Single impactful visual with core message',
        visual_elements: ['Main visual', 'Key text overlay', 'Brand logo'],
        key_message: 'The one thing you need to know',
        hook: '📍 Save this for later!',
        prompt: 'Eye-catching single image with bold statement'
      },
      thread: {
        title: `Thread: Breaking Down ${projectTitle}`,
        description: 'Detailed text thread with supporting visuals',
        visual_elements: ['Cover image', 'Supporting visual 1', 'Supporting visual 2'],
        key_message: 'Complete breakdown of the topic',
        hook: '🧵 Thread: Everything you need to know about this',
        prompt: 'Professional thread visuals with consistent branding'
      }
    }
    
    return mockIdeas[contentType] || mockIdeas.single
  }

  static generateMockPlatformCopy(params: {
    contentIdea: any
    platform: Platform
    contentType: PostContentType
  }) {
    const { contentIdea, platform } = params
    
    const platformTemplates = {
      instagram: {
        caption: `${contentIdea.hook}\n\n${contentIdea.key_message}\n\n${contentIdea.title}\n\nDrop a 💬 if this resonates with you!\n\nFollow for more insights 👆`,
        hashtags: ['contentcreation', 'socialmedia', 'growth', 'education', 'insights'],
        cta: 'Save this post for later! 📌'
      },
      twitter: {
        caption: `${contentIdea.hook}\n\n${contentIdea.key_message}\n\nRT if you agree 🔄`,
        hashtags: ['thread', 'insights', 'growth'],
        cta: 'Follow for more 👆'
      },
      linkedin: {
        caption: `${contentIdea.title}\n\n${contentIdea.key_message}\n\n${contentIdea.description}\n\nWhat are your thoughts on this?\n\nFollow for more professional insights.`,
        hashtags: ['professional', 'insights', 'leadership', 'growth', 'learning'],
        cta: 'Connect for more insights',
        title: contentIdea.title,
        description: contentIdea.description
      },
      facebook: {
        caption: `${contentIdea.hook}\n\n${contentIdea.key_message}\n\n${contentIdea.title}\n\nWhat do you think? Let me know in the comments! 💭`,
        hashtags: ['education', 'insights', 'community'],
        cta: 'Share if you found this helpful! 🙏'
      },
      youtube: {
        caption: '',
        hashtags: [],
        title: contentIdea.title,
        description: `${contentIdea.description}\n\nIn this video, we explore ${contentIdea.key_message}`
      },
      tiktok: {
        caption: `${contentIdea.hook} ${contentIdea.key_message}`,
        hashtags: ['fyp', 'education', 'learn', 'viral', 'trending'],
        cta: 'Follow for more!'
      }
    }
    
    return platformTemplates[platform] || platformTemplates.instagram
  }

  static generateMockImages(count: number, contentType: PostContentType) {
    const mockImages = []
    const baseUrls = [
      'https://picsum.photos/1080/1350?random=',
      'https://via.placeholder.com/1080x1350/6366f1/ffffff?text='
    ]
    
    for (let i = 0; i < count; i++) {
      mockImages.push({
        id: `mock-img-${Date.now()}-${i}`,
        url: `${baseUrls[0]}${Date.now()}${i}`,
        position: i,
        prompt: 'Mock image prompt',
        status: 'generated'
      })
    }
    
    return mockImages
  }

  static calculateMockEngagement() {
    // Return a random engagement score between 0.6 and 0.95
    return 0.6 + Math.random() * 0.35
  }
}

