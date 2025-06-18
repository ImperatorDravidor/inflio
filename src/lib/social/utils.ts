import { Project, ClipData, BlogPost } from "@/lib/project-types"
import { CreatePostRequest } from "./types"

// Generate social media content from project data
export function generateSocialContent(project: Project, contentType: 'video' | 'clip' | 'blog', contentItem?: ClipData | BlogPost) {
  const baseContent: Partial<CreatePostRequest> = {
    project_id: project.id,
    hashtags: project.tags.map(tag => `#${tag.replace(/\s+/g, '')}`),
  }

  if (contentType === 'video') {
    return {
      ...baseContent,
      content: `🎬 New video alert! "${project.title}"\n\n${project.description || 'Check it out!'}\n\n${baseContent.hashtags?.join(' ')}`,
      media_urls: project.thumbnail_url ? [project.thumbnail_url] : undefined
    }
  }

  if (contentType === 'clip' && contentItem) {
    const clip = contentItem as ClipData
    return {
      ...baseContent,
      content: `🎯 ${clip.title}\n\n${clip.description || 'Watch this highlight from our latest video!'}\n\n${baseContent.hashtags?.join(' ')}`,
      media_urls: clip.thumbnail ? [clip.thumbnail] : undefined
    }
  }

  if (contentType === 'blog' && contentItem) {
    const blog = contentItem as BlogPost
    return {
      ...baseContent,
      content: `📝 New blog post: "${blog.title}"\n\n${blog.excerpt}\n\nRead more 👇\n${baseContent.hashtags?.join(' ')}`,
      title: blog.title,
      description: blog.excerpt
    }
  }

  return baseContent
}

// Suggest optimal posting times based on platform
export function getOptimalPostingTimes(platform: string): string[] {
  const times: Record<string, string[]> = {
    twitter: ['9:00 AM', '12:00 PM', '5:00 PM', '7:00 PM'],
    linkedin: ['7:30 AM', '12:00 PM', '5:30 PM'],
    instagram: ['11:00 AM', '2:00 PM', '5:00 PM', '8:00 PM'],
    tiktok: ['6:00 AM', '3:00 PM', '7:00 PM', '11:00 PM'],
    youtube: ['2:00 PM', '4:00 PM', '9:00 PM'],
    facebook: ['9:00 AM', '3:00 PM', '7:00 PM']
  }
  
  return times[platform] || times.twitter
}

// Generate AI prompts for content variations
export function generateContentPrompts(project: Project, platform: string): string[] {
  const prompts = [
    `Create a ${platform} post announcing "${project.title}" - make it engaging and use emojis`,
    `Write a hook for ${platform} about the key takeaway from "${project.title}"`,
    `Generate a question-based ${platform} post that sparks discussion about "${project.title}"`,
    `Create a behind-the-scenes ${platform} post about making "${project.title}"`
  ]
  
  return prompts
}

// Calculate best content mix for the week
export function calculateContentMix(totalSlots: number = 7) {
  return {
    educational: Math.floor(totalSlots * 0.4), // 40%
    entertaining: Math.floor(totalSlots * 0.3), // 30%
    promotional: Math.floor(totalSlots * 0.2), // 20%
    engagement: Math.floor(totalSlots * 0.1)   // 10%
  }
}

// Get platform-specific character limits and media requirements
export function getPlatformRequirements(platform: string) {
  const requirements: Record<string, any> = {
    twitter: {
      maxLength: 280,
      maxImages: 4,
      maxVideoDuration: 140,
      videoFormats: ['mp4', 'mov'],
      imageFormats: ['jpg', 'png', 'gif', 'webp']
    },
    linkedin: {
      maxLength: 3000,
      maxImages: 9,
      maxVideoDuration: 600,
      videoFormats: ['mp4'],
      imageFormats: ['jpg', 'png']
    },
    instagram: {
      maxLength: 2200,
      maxImages: 10,
      maxVideoDuration: 60,
      videoFormats: ['mp4', 'mov'],
      imageFormats: ['jpg', 'png'],
      requiresImage: true
    },
    tiktok: {
      maxLength: 2200,
      maxVideoDuration: 180,
      videoFormats: ['mp4'],
      requiresVideo: true
    },
    youtube: {
      titleMaxLength: 100,
      descriptionMaxLength: 5000,
      maxVideoDuration: 43200, // 12 hours
      videoFormats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
    },
    facebook: {
      maxLength: 63206,
      maxImages: 10,
      maxVideoDuration: 240,
      videoFormats: ['mp4', 'mov'],
      imageFormats: ['jpg', 'png', 'gif']
    }
  }
  
  return requirements[platform] || requirements.twitter
} 