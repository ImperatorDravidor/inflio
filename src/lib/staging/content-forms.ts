export type ContentType = 'video' | 'image' | 'carousel' | 'story' | 'article' | 'short'
export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'x' | 'threads'

export interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'url' | 'tags' | 'datetime' | 'checkbox' | 'file'
  required: boolean
  placeholder?: string
  maxLength?: number
  minLength?: number
  options?: { value: string; label: string }[]
  helpText?: string
  validation?: (value: any) => string | null // returns error message or null
}

export interface ContentFormDefinition {
  platform: Platform
  contentType: ContentType
  fields: FieldDefinition[]
  characterLimits: {
    caption?: number
    title?: number
    description?: number
  }
  mediaRequirements?: {
    minDuration?: number
    maxDuration?: number
    maxFileSize?: number
    aspectRatio?: string[]
    formats?: string[]
  }
}

// Platform-Content Type Matrix
export const contentFormDefinitions: ContentFormDefinition[] = [
  // Instagram Forms
  {
    platform: 'instagram',
    contentType: 'video',
    fields: [
      {
        name: 'caption',
        label: 'Caption',
        type: 'textarea',
        required: true,
        placeholder: '✨ Share your story...\n\nWhat makes this special?',
        maxLength: 2200,
        helpText: 'First 125 characters are shown without "more"'
      },
      {
        name: 'hashtags',
        label: 'Hashtags',
        type: 'tags',
        required: true,
        placeholder: 'Add relevant hashtags',
        helpText: 'Use 5-30 hashtags for best reach'
      },
      {
        name: 'location',
        label: 'Location',
        type: 'text',
        required: false,
        placeholder: 'Add location tag'
      },
      {
        name: 'collaborators',
        label: 'Tag Collaborators',
        type: 'tags',
        required: false,
        placeholder: '@username'
      },
      {
        name: 'musicTrack',
        label: 'Music/Audio',
        type: 'text',
        required: false,
        placeholder: 'Search for audio'
      },
      {
        name: 'coverImage',
        label: 'Cover Image',
        type: 'file',
        required: true,
        helpText: 'Select thumbnail from video'
      }
    ],
    characterLimits: { caption: 2200 },
    mediaRequirements: {
      minDuration: 3,
      maxDuration: 90,
      aspectRatio: ['9:16', '1:1', '4:5'],
      formats: ['mp4', 'mov']
    }
  },
  {
    platform: 'instagram',
    contentType: 'image',
    fields: [
      {
        name: 'caption',
        label: 'Caption',
        type: 'textarea',
        required: true,
        placeholder: '📸 What story does this image tell?',
        maxLength: 2200
      },
      {
        name: 'altText',
        label: 'Alt Text',
        type: 'text',
        required: true,
        placeholder: 'Describe image for accessibility',
        helpText: 'Important for screen readers and SEO'
      },
      {
        name: 'hashtags',
        label: 'Hashtags',
        type: 'tags',
        required: true,
        placeholder: 'Add hashtags'
      },
      {
        name: 'location',
        label: 'Location',
        type: 'text',
        required: false
      },
      {
        name: 'tagPeople',
        label: 'Tag People',
        type: 'tags',
        required: false,
        placeholder: '@username'
      }
    ],
    characterLimits: { caption: 2200 },
    mediaRequirements: {
      aspectRatio: ['1:1', '4:5', '16:9'],
      formats: ['jpg', 'png', 'webp']
    }
  },
  {
    platform: 'instagram',
    contentType: 'carousel',
    fields: [
      {
        name: 'caption',
        label: 'Caption',
        type: 'textarea',
        required: true,
        placeholder: '🎠 Take your audience on a journey...',
        maxLength: 2200
      },
      {
        name: 'slideDescriptions',
        label: 'Slide Descriptions',
        type: 'textarea',
        required: true,
        placeholder: 'Describe each slide (separated by new lines)',
        helpText: 'One line per slide for alt text'
      },
      {
        name: 'hashtags',
        label: 'Hashtags',
        type: 'tags',
        required: true
      },
      {
        name: 'musicTrack',
        label: 'Background Music',
        type: 'text',
        required: false
      }
    ],
    characterLimits: { caption: 2200 },
    mediaRequirements: {
      aspectRatio: ['1:1', '4:5'],
      formats: ['jpg', 'png', 'webp', 'mp4']
    }
  },
  {
    platform: 'instagram',
    contentType: 'story',
    fields: [
      {
        name: 'stickers',
        label: 'Interactive Stickers',
        type: 'select',
        required: false,
        options: [
          { value: 'poll', label: 'Poll' },
          { value: 'question', label: 'Question Box' },
          { value: 'quiz', label: 'Quiz' },
          { value: 'slider', label: 'Slider' },
          { value: 'music', label: 'Music' }
        ]
      },
      {
        name: 'link',
        label: 'Link Sticker URL',
        type: 'url',
        required: false,
        placeholder: 'https://...'
      },
      {
        name: 'mentions',
        label: 'Mention Accounts',
        type: 'tags',
        required: false,
        placeholder: '@username'
      },
      {
        name: 'location',
        label: 'Location',
        type: 'text',
        required: false
      },
      {
        name: 'highlightCategory',
        label: 'Save to Highlight',
        type: 'text',
        required: false,
        placeholder: 'Highlight name'
      }
    ],
    characterLimits: { caption: 2200 },
    mediaRequirements: {
      maxDuration: 15,
      aspectRatio: ['9:16'],
      formats: ['jpg', 'png', 'mp4']
    }
  },

  // TikTok Forms
  {
    platform: 'tiktok',
    contentType: 'video',
    fields: [
      {
        name: 'caption',
        label: 'Caption',
        type: 'textarea',
        required: true,
        placeholder: 'Hook your audience in the first line! 🎬',
        maxLength: 2200
      },
      {
        name: 'hashtags',
        label: 'Hashtags',
        type: 'tags',
        required: true,
        placeholder: '#fyp #foryoupage',
        helpText: 'Mix trending and niche hashtags'
      },
      {
        name: 'sounds',
        label: 'Trending Sound',
        type: 'text',
        required: false,
        placeholder: 'Use trending audio'
      },
      {
        name: 'effects',
        label: 'Effects Used',
        type: 'tags',
        required: false,
        placeholder: 'List effects'
      },
      {
        name: 'duetWith',
        label: 'Duet/Stitch With',
        type: 'text',
        required: false,
        placeholder: '@creator'
      },
      {
        name: 'privacy',
        label: 'Who Can View',
        type: 'select',
        required: true,
        options: [
          { value: 'public', label: 'Everyone' },
          { value: 'friends', label: 'Friends' },
          { value: 'private', label: 'Only Me' }
        ]
      }
    ],
    characterLimits: { caption: 2200 },
    mediaRequirements: {
      minDuration: 3,
      maxDuration: 180,
      aspectRatio: ['9:16'],
      formats: ['mp4', 'mov']
    }
  },

  // YouTube Forms
  {
    platform: 'youtube',
    contentType: 'video',
    fields: [
      {
        name: 'title',
        label: 'Video Title',
        type: 'text',
        required: true,
        placeholder: 'Compelling title with keywords',
        maxLength: 100,
        helpText: 'First 60 characters appear in search'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'In this video...\n\nTimestamps:\n00:00 Intro\n\nLinks:',
        maxLength: 5000,
        helpText: 'First 125 characters show in search'
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'tags',
        required: true,
        placeholder: 'Add search tags',
        helpText: 'Use specific keywords (max 500 chars total)'
      },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: [
          { value: 'education', label: 'Education' },
          { value: 'entertainment', label: 'Entertainment' },
          { value: 'gaming', label: 'Gaming' },
          { value: 'howto', label: 'How-to & Style' },
          { value: 'music', label: 'Music' },
          { value: 'news', label: 'News & Politics' },
          { value: 'tech', label: 'Science & Technology' },
          { value: 'sports', label: 'Sports' }
        ]
      },
      {
        name: 'thumbnail',
        label: 'Custom Thumbnail',
        type: 'file',
        required: true,
        helpText: '1280x720px recommended'
      },
      {
        name: 'playlist',
        label: 'Add to Playlist',
        type: 'select',
        required: false,
        options: [] // Dynamic based on user playlists
      },
      {
        name: 'endScreen',
        label: 'End Screen Elements',
        type: 'checkbox',
        required: false
      },
      {
        name: 'cards',
        label: 'Info Cards',
        type: 'checkbox',
        required: false
      },
      {
        name: 'visibility',
        label: 'Visibility',
        type: 'select',
        required: true,
        options: [
          { value: 'public', label: 'Public' },
          { value: 'unlisted', label: 'Unlisted' },
          { value: 'private', label: 'Private' }
        ]
      },
      {
        name: 'premiereDate',
        label: 'Premiere Date',
        type: 'datetime',
        required: false
      }
    ],
    characterLimits: {
      title: 100,
      description: 5000
    },
    mediaRequirements: {
      maxDuration: 43200, // 12 hours
      aspectRatio: ['16:9', '9:16', '1:1', '4:3'],
      formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv']
    }
  },
  {
    platform: 'youtube',
    contentType: 'short',
    fields: [
      {
        name: 'title',
        label: 'Shorts Title',
        type: 'text',
        required: true,
        placeholder: 'Catchy title #Shorts',
        maxLength: 100
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'Quick description with #Shorts',
        maxLength: 5000
      },
      {
        name: 'hashtags',
        label: 'Hashtags',
        type: 'tags',
        required: true,
        placeholder: '#Shorts is required'
      }
    ],
    characterLimits: {
      title: 100,
      description: 5000
    },
    mediaRequirements: {
      maxDuration: 60,
      aspectRatio: ['9:16'],
      formats: ['mp4', 'mov']
    }
  },

  // LinkedIn Forms
  {
    platform: 'linkedin',
    contentType: 'article',
    fields: [
      {
        name: 'headline',
        label: 'Article Headline',
        type: 'text',
        required: true,
        placeholder: 'Professional insight or industry trend',
        maxLength: 150
      },
      {
        name: 'content',
        label: 'Article Content',
        type: 'textarea',
        required: true,
        placeholder: 'Share your professional insights...',
        maxLength: 120000,
        helpText: 'Format with headers and bullet points'
      },
      {
        name: 'coverImage',
        label: 'Cover Image',
        type: 'file',
        required: false,
        helpText: '1200x627px recommended'
      },
      {
        name: 'tags',
        label: 'Topics',
        type: 'tags',
        required: true,
        placeholder: 'Add relevant topics',
        helpText: 'Max 5 topics'
      }
    ],
    characterLimits: {
      title: 150,
      caption: 120000
    }
  },
  {
    platform: 'linkedin',
    contentType: 'video',
    fields: [
      {
        name: 'caption',
        label: 'Post Text',
        type: 'textarea',
        required: true,
        placeholder: 'Share professional insights with your network...',
        maxLength: 3000
      },
      {
        name: 'title',
        label: 'Video Title',
        type: 'text',
        required: false,
        placeholder: 'Optional video title'
      },
      {
        name: 'hashtags',
        label: 'Hashtags',
        type: 'tags',
        required: false,
        placeholder: 'Professional hashtags',
        helpText: '3-5 hashtags recommended'
      },
      {
        name: 'targetAudience',
        label: 'Audience',
        type: 'select',
        required: false,
        options: [
          { value: 'connections', label: 'Connections only' },
          { value: 'public', label: 'Anyone on LinkedIn' },
          { value: 'targeted', label: 'Targeted audience' }
        ]
      }
    ],
    characterLimits: { caption: 3000 },
    mediaRequirements: {
      maxDuration: 600,
      maxFileSize: 5000, // 5GB
      aspectRatio: ['16:9', '1:1', '4:5'],
      formats: ['mp4', 'mov']
    }
  },

  // Facebook Forms
  {
    platform: 'facebook',
    contentType: 'video',
    fields: [
      {
        name: 'caption',
        label: 'Post Text',
        type: 'textarea',
        required: true,
        placeholder: 'What would you like to share?',
        maxLength: 63206
      },
      {
        name: 'feeling',
        label: 'Feeling/Activity',
        type: 'select',
        required: false,
        options: [
          { value: 'happy', label: '😊 Happy' },
          { value: 'excited', label: '🎉 Excited' },
          { value: 'thankful', label: '🙏 Thankful' },
          { value: 'motivated', label: '💪 Motivated' }
        ]
      },
      {
        name: 'location',
        label: 'Check In',
        type: 'text',
        required: false,
        placeholder: 'Where are you?'
      },
      {
        name: 'tags',
        label: 'Tag Friends',
        type: 'tags',
        required: false,
        placeholder: 'Tag people'
      },
      {
        name: 'audience',
        label: 'Audience',
        type: 'select',
        required: true,
        options: [
          { value: 'public', label: 'Public' },
          { value: 'friends', label: 'Friends' },
          { value: 'custom', label: 'Custom' }
        ]
      }
    ],
    characterLimits: { caption: 63206 },
    mediaRequirements: {
      maxDuration: 240,
      maxFileSize: 4000,
      aspectRatio: ['16:9', '9:16', '1:1'],
      formats: ['mp4', 'mov']
    }
  },

  // X (Twitter) Forms
  {
    platform: 'x',
    contentType: 'video',
    fields: [
      {
        name: 'tweet',
        label: 'Tweet',
        type: 'textarea',
        required: true,
        placeholder: "What's happening?",
        maxLength: 280,
        helpText: 'Links count as 23 characters'
      },
      {
        name: 'thread',
        label: 'Add to Thread',
        type: 'checkbox',
        required: false
      },
      {
        name: 'threadContent',
        label: 'Thread Continuation',
        type: 'textarea',
        required: false,
        placeholder: 'Continue thread (2/n)...',
        maxLength: 280
      },
      {
        name: 'replyRestriction',
        label: 'Who Can Reply',
        type: 'select',
        required: false,
        options: [
          { value: 'everyone', label: 'Everyone' },
          { value: 'following', label: 'People you follow' },
          { value: 'mentioned', label: 'Only mentioned' }
        ]
      }
    ],
    characterLimits: { caption: 280 },
    mediaRequirements: {
      maxDuration: 140,
      maxFileSize: 512,
      aspectRatio: ['16:9', '1:1'],
      formats: ['mp4', 'mov']
    }
  },

  // Threads Forms
  {
    platform: 'threads',
    contentType: 'video',
    fields: [
      {
        name: 'text',
        label: 'Thread',
        type: 'textarea',
        required: true,
        placeholder: 'Start a conversation...',
        maxLength: 500
      },
      {
        name: 'replyControl',
        label: 'Who Can Reply',
        type: 'select',
        required: false,
        options: [
          { value: 'everyone', label: 'Anyone' },
          { value: 'followers', label: 'Followers' },
          { value: 'mentioned', label: 'Mentioned only' }
        ]
      }
    ],
    characterLimits: { caption: 500 },
    mediaRequirements: {
      maxDuration: 90,
      aspectRatio: ['9:16', '1:1'],
      formats: ['mp4', 'mov']
    }
  }
]

// Helper to get form definition
export function getContentForm(platform: Platform, contentType: ContentType): ContentFormDefinition | undefined {
  return contentFormDefinitions.find(
    def => def.platform === platform && def.contentType === contentType
  )
}

// Get all valid content types for a platform
export function getPlatformContentTypes(platform: Platform): ContentType[] {
  return contentFormDefinitions
    .filter(def => def.platform === platform)
    .map(def => def.contentType)
}

// Validation helpers
export function validateField(field: FieldDefinition, value: any): string | null {
  if (field.required && !value) {
    return `${field.label} is required`
  }

  if (field.type === 'textarea' || field.type === 'text') {
    if (field.minLength && value.length < field.minLength) {
      return `${field.label} must be at least ${field.minLength} characters`
    }
    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label} must not exceed ${field.maxLength} characters`
    }
  }

  if (field.type === 'url' && value) {
    try {
      new URL(value)
    } catch {
      return `${field.label} must be a valid URL`
    }
  }

  if (field.type === 'tags' && field.required && (!Array.isArray(value) || value.length === 0)) {
    return `At least one ${field.label.toLowerCase()} is required`
  }

  if (field.validation) {
    return field.validation(value)
  }

  return null
} 