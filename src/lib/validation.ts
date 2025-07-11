// Input validation utilities for improved security and data integrity
import { z } from 'zod'

// Common validation schemas
export const schemas = {
  // User input
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  
  // Content
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  caption: z.string().max(2200, 'Caption too long'), // Instagram max
  hashtag: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Invalid hashtag format'),
  
  // URLs
  url: z.string().url('Invalid URL'),
  videoUrl: z.string().url('Invalid video URL'),
  imageUrl: z.string().url('Invalid image URL'),
  
  // IDs
  projectId: z.string().uuid('Invalid project ID'),
  userId: z.string().min(1, 'User ID required'),
  
  // Numbers
  score: z.number().min(0).max(100),
  duration: z.number().positive(),
  fileSize: z.number().positive().max(524288000), // 500MB
  
  // Platform-specific
  platform: z.enum(['instagram', 'x', 'linkedin', 'facebook', 'tiktok', 'youtube', 'threads']),
  contentType: z.enum(['clip', 'blog', 'image', 'carousel', 'social', 'longform']),
  
  // Arrays
  hashtags: z.array(z.string().regex(/^[a-zA-Z0-9_]+$/)).max(30), // Instagram max
  platforms: z.array(z.enum(['instagram', 'x', 'linkedin', 'facebook', 'tiktok', 'youtube', 'threads']))
}

// Content validation schemas
export const contentSchemas = {
  // Clip data validation
  clip: z.object({
    id: z.string(),
    title: schemas.title,
    description: schemas.description,
    exportUrl: schemas.videoUrl.optional(),
    duration: schemas.duration,
    score: schemas.score.optional(),
    transcript: z.string().optional(),
    viralityExplanation: z.string().optional()
  }),
  
  // Blog post validation
  blog: z.object({
    id: z.string(),
    title: schemas.title,
    content: z.string().min(100, 'Blog content too short'),
    excerpt: z.string().max(500),
    tags: z.array(z.string()).max(10),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    readingTime: z.number().positive()
  }),
  
  // Social post validation
  socialPost: z.object({
    platform: schemas.platform,
    content: z.string(),
    hashtags: schemas.hashtags,
    scheduledDate: z.date().optional(),
    mediaUrls: z.array(schemas.url).optional()
  }),
  
  // Image validation
  image: z.object({
    url: schemas.imageUrl,
    alt: z.string().max(500),
    width: z.number().positive().optional(),
    height: z.number().positive().optional()
  })
}

// Platform-specific validation
export const platformValidation = {
  instagram: {
    caption: z.string().max(2200),
    hashtags: z.array(z.string()).max(30),
    altText: z.string().max(500).optional(),
    location: z.string().max(100).optional()
  },
  x: {
    content: z.string().max(280),
    hashtags: z.array(z.string()).max(5) // Best practice
  },
  linkedin: {
    content: z.string().max(3000),
    hashtags: z.array(z.string()).max(5),
    articleUrl: schemas.url.optional()
  },
  facebook: {
    content: z.string().max(63206),
    hashtags: z.array(z.string()).max(10)
  },
  tiktok: {
    caption: z.string().max(150), // Recommended
    hashtags: z.array(z.string()).max(10)
  },
  youtube: {
    title: z.string().min(1).max(100),
    description: z.string().max(5000),
    tags: z.array(z.string()).max(500) // Total character limit
  }
}

// Validation helpers
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean
  data?: T
  errors?: z.ZodError['errors']
} {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    return { success: false, errors: [{ 
      code: 'custom',
      path: [],
      message: 'Unknown validation error'
    } as z.ZodIssue] }
  }
}

// Sanitization helpers
export const sanitize = {
  // Remove potentially dangerous HTML/scripts
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .trim()
  },
  
  // Clean hashtags
  hashtag: (tag: string): string => {
    return tag
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove invalid characters
      .replace(/^#+/, '') // Remove leading #
      .toLowerCase()
  },
  
  // Clean filenames
  filename: (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9._-]/g, '-') // Replace invalid chars with dash
      .replace(/--+/g, '-') // Replace multiple dashes with single
      .toLowerCase()
  },
  
  // Truncate text with ellipsis
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  },
  
  // Clean URLs
  url: (url: string): string => {
    try {
      const parsed = new URL(url)
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol')
      }
      return parsed.toString()
    } catch {
      return ''
    }
  }
}

// Character counting utilities
export const characterCount = {
  // Count characters considering emoji and special characters
  accurate: (text: string): number => {
    // Use Intl.Segmenter for accurate character counting
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
      return Array.from(segmenter.segment(text)).length
    }
    // Fallback to simple length
    return text.length
  },
  
  // Platform-specific counting (some platforms count differently)
  twitter: (text: string): number => {
    // Twitter counts URLs as 23 characters
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = text.match(urlRegex) || []
    let count = characterCount.accurate(text)
    
    urls.forEach(url => {
      count = count - url.length + 23
    })
    
    return count
  }
}

// File validation
export const fileValidation = {
  // Validate file size
  size: (bytes: number, maxMB: number = 500): boolean => {
    return bytes <= maxMB * 1024 * 1024
  },
  
  // Validate file type
  type: (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimeType)
  },
  
  // Common file type validators
  isVideo: (mimeType: string): boolean => {
    return fileValidation.type(mimeType, [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm'
    ])
  },
  
  isImage: (mimeType: string): boolean => {
    return fileValidation.type(mimeType, [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ])
  }
} 