export interface PlatformSpec {
  name: string
  sizes: {
    [key: string]: {
      width: number
      height: number
      displayName: string
      description: string
      bestFor: string[]
    }
  }
  colorScheme?: string[]
  fontSizes?: {
    title: number
    body: number
    caption: number
  }
}

export interface GraphicsTemplate {
  id: string
  name: string
  description: string
  category: 'quote' | 'announcement' | 'promotion' | 'educational' | 'carousel' | 'story'
  platforms: string[]
  style: {
    background: string
    textColor: string
    accentColor: string
    layout: 'centered' | 'left-aligned' | 'right-aligned' | 'split'
  }
  prompts: {
    withPersona: string
    withoutPersona: string
  }
}

export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  instagram: {
    name: 'Instagram',
    sizes: {
      post: {
        width: 1080,
        height: 1080,
        displayName: 'Square Post',
        description: 'Standard Instagram post',
        bestFor: ['quotes', 'announcements', 'product shots']
      },
      story: {
        width: 1080,
        height: 1920,
        displayName: 'Story/Reel',
        description: 'Full-screen vertical content',
        bestFor: ['behind-the-scenes', 'quick tips', 'announcements']
      },
      portrait: {
        width: 1080,
        height: 1350,
        displayName: 'Portrait Post',
        description: '4:5 aspect ratio for more visibility',
        bestFor: ['infographics', 'before/after', 'tutorials']
      },
      carousel: {
        width: 1080,
        height: 1080,
        displayName: 'Carousel Slide',
        description: 'Multi-slide posts for storytelling',
        bestFor: ['tutorials', 'listicles', 'product features']
      }
    },
    colorScheme: ['#E4405F', '#C13584', '#F56040', '#FCAF45'],
    fontSizes: {
      title: 72,
      body: 48,
      caption: 36
    }
  },
  twitter: {
    name: 'Twitter/X',
    sizes: {
      post: {
        width: 1200,
        height: 675,
        displayName: 'Tweet Image',
        description: 'Optimal for Twitter timeline',
        bestFor: ['news', 'quotes', 'statistics']
      },
      header: {
        width: 1500,
        height: 500,
        displayName: 'Header Image',
        description: 'Profile header banner',
        bestFor: ['branding', 'announcements']
      }
    },
    colorScheme: ['#1DA1F2', '#14171A', '#657786', '#E1E8ED'],
    fontSizes: {
      title: 64,
      body: 42,
      caption: 32
    }
  },
  linkedin: {
    name: 'LinkedIn',
    sizes: {
      post: {
        width: 1200,
        height: 628,
        displayName: 'Feed Post',
        description: 'Professional content for feed',
        bestFor: ['thought leadership', 'company updates', 'insights']
      },
      article: {
        width: 1200,
        height: 628,
        displayName: 'Article Cover',
        description: 'LinkedIn article header',
        bestFor: ['blog posts', 'long-form content']
      },
      square: {
        width: 1200,
        height: 1200,
        displayName: 'Square Post',
        description: 'Eye-catching square format',
        bestFor: ['quotes', 'tips', 'infographics']
      }
    },
    colorScheme: ['#0077B5', '#313335', '#86888A', '#CACCCE'],
    fontSizes: {
      title: 68,
      body: 44,
      caption: 34
    }
  },
  facebook: {
    name: 'Facebook',
    sizes: {
      post: {
        width: 1200,
        height: 630,
        displayName: 'Feed Post',
        description: 'Standard Facebook post',
        bestFor: ['engagement posts', 'links', 'announcements']
      },
      story: {
        width: 1080,
        height: 1920,
        displayName: 'Story',
        description: 'Facebook Story format',
        bestFor: ['quick updates', 'behind-the-scenes']
      },
      cover: {
        width: 1640,
        height: 859,
        displayName: 'Cover Photo',
        description: 'Page cover image',
        bestFor: ['branding', 'seasonal updates']
      }
    },
    colorScheme: ['#1877F2', '#42B883', '#FFFC00', '#FF6550'],
    fontSizes: {
      title: 70,
      body: 46,
      caption: 36
    }
  },
  youtube: {
    name: 'YouTube',
    sizes: {
      thumbnail: {
        width: 1280,
        height: 720,
        displayName: 'Video Thumbnail',
        description: 'YouTube video thumbnail',
        bestFor: ['video covers', 'eye-catching previews']
      },
      banner: {
        width: 2560,
        height: 1440,
        displayName: 'Channel Banner',
        description: 'Channel header image',
        bestFor: ['channel branding', 'schedules']
      },
      community: {
        width: 1280,
        height: 720,
        displayName: 'Community Post',
        description: 'Community tab image',
        bestFor: ['announcements', 'polls', 'updates']
      }
    },
    colorScheme: ['#FF0000', '#282828', '#FFFFFF'],
    fontSizes: {
      title: 80,
      body: 52,
      caption: 40
    }
  },
  tiktok: {
    name: 'TikTok',
    sizes: {
      cover: {
        width: 1080,
        height: 1920,
        displayName: 'Video Cover',
        description: 'TikTok video cover frame',
        bestFor: ['video previews', 'catchy covers']
      }
    },
    colorScheme: ['#FF0050', '#00F2EA', '#000000', '#FFFFFF'],
    fontSizes: {
      title: 72,
      body: 48,
      caption: 36
    }
  }
}

export const GRAPHICS_TEMPLATES: GraphicsTemplate[] = [
  {
    id: 'motivational-quote',
    name: 'Motivational Quote',
    description: 'Inspiring quotes with elegant typography',
    category: 'quote',
    platforms: ['instagram', 'twitter', 'linkedin', 'facebook'],
    style: {
      background: 'gradient',
      textColor: 'white',
      accentColor: 'gold',
      layout: 'centered'
    },
    prompts: {
      withPersona: 'Create a motivational quote graphic featuring {personaName} with professional appearance, elegant gradient background, modern typography, inspiring and uplifting mood',
      withoutPersona: 'Create a motivational quote graphic with elegant gradient background, modern typography, inspiring and uplifting mood, professional design'
    }
  },
  {
    id: 'product-announcement',
    name: 'Product Announcement',
    description: 'Eye-catching product launch graphics',
    category: 'announcement',
    platforms: ['instagram', 'twitter', 'linkedin', 'facebook'],
    style: {
      background: 'solid',
      textColor: 'contrast',
      accentColor: 'brand',
      layout: 'split'
    },
    prompts: {
      withPersona: 'Create a product announcement graphic featuring {personaName} presenting the product, modern clean design, bold typography, exciting and professional',
      withoutPersona: 'Create a product announcement graphic with modern clean design, bold typography, product showcase, exciting and professional mood'
    }
  },
  {
    id: 'educational-carousel',
    name: 'Educational Carousel',
    description: 'Multi-slide educational content',
    category: 'carousel',
    platforms: ['instagram', 'linkedin'],
    style: {
      background: 'minimal',
      textColor: 'dark',
      accentColor: 'primary',
      layout: 'left-aligned'
    },
    prompts: {
      withPersona: 'Create an educational carousel slide featuring {personaName} as the expert, clean minimalist design, clear hierarchy, informative and trustworthy',
      withoutPersona: 'Create an educational carousel slide with clean minimalist design, clear information hierarchy, professional and informative'
    }
  },
  {
    id: 'testimonial',
    name: 'Customer Testimonial',
    description: 'Social proof and testimonials',
    category: 'quote',
    platforms: ['instagram', 'twitter', 'linkedin', 'facebook'],
    style: {
      background: 'soft',
      textColor: 'dark',
      accentColor: 'trust',
      layout: 'centered'
    },
    prompts: {
      withPersona: 'Create a testimonial graphic featuring {personaName} with the customer quote, trustworthy design, professional headshot style, authentic feel',
      withoutPersona: 'Create a testimonial graphic with customer quote, trustworthy design, clean layout, authentic and professional feel'
    }
  },
  {
    id: 'event-promotion',
    name: 'Event Promotion',
    description: 'Webinar and event announcements',
    category: 'promotion',
    platforms: ['instagram', 'twitter', 'linkedin', 'facebook', 'youtube'],
    style: {
      background: 'dynamic',
      textColor: 'white',
      accentColor: 'energy',
      layout: 'centered'
    },
    prompts: {
      withPersona: 'Create an event promotion graphic featuring {personaName} as the speaker, dynamic design, clear event details, exciting and professional',
      withoutPersona: 'Create an event promotion graphic with dynamic design, clear event information, date and time prominent, exciting atmosphere'
    }
  },
  {
    id: 'tips-and-tricks',
    name: 'Tips & Tricks',
    description: 'Quick tips and how-to content',
    category: 'educational',
    platforms: ['instagram', 'twitter', 'tiktok'],
    style: {
      background: 'colorful',
      textColor: 'white',
      accentColor: 'highlight',
      layout: 'left-aligned'
    },
    prompts: {
      withPersona: 'Create a tips and tricks graphic featuring {personaName} sharing expertise, numbered list format, vibrant colors, helpful and engaging',
      withoutPersona: 'Create a tips and tricks graphic with numbered list format, vibrant colors, clear typography, helpful and engaging design'
    }
  },
  {
    id: 'story-template',
    name: 'Story Template',
    description: 'Vertical story format for all platforms',
    category: 'story',
    platforms: ['instagram', 'facebook', 'tiktok'],
    style: {
      background: 'immersive',
      textColor: 'white',
      accentColor: 'subtle',
      layout: 'centered'
    },
    prompts: {
      withPersona: 'Create a vertical story graphic featuring {personaName} in an immersive full-screen design, mobile-optimized, engaging and personal feel',
      withoutPersona: 'Create a vertical story graphic with immersive full-screen design, mobile-optimized layout, engaging and eye-catching'
    }
  },
  {
    id: 'data-visualization',
    name: 'Data & Statistics',
    description: 'Infographics and data presentations',
    category: 'educational',
    platforms: ['linkedin', 'twitter', 'instagram'],
    style: {
      background: 'clean',
      textColor: 'dark',
      accentColor: 'data',
      layout: 'split'
    },
    prompts: {
      withPersona: 'Create a data visualization graphic featuring {personaName} presenting insights, clean charts and graphs, professional design, credible and informative',
      withoutPersona: 'Create a data visualization graphic with clean charts and graphs, clear data presentation, professional and credible design'
    }
  }
]

export const CONTENT_SUGGESTIONS = {
  instagram: [
    'Behind-the-scenes content',
    'User-generated content repost',
    'Quick tips carousel',
    'Before/after transformation',
    'Day in the life',
    'Product showcase',
    'Team spotlight',
    'Customer success story'
  ],
  twitter: [
    'Industry insights thread',
    'Quick tip tweet',
    'Poll with image',
    'News commentary',
    'Resource roundup',
    'Hot take',
    'Case study teaser'
  ],
  linkedin: [
    'Thought leadership post',
    'Industry analysis',
    'Company milestone',
    'Employee spotlight',
    'Case study',
    'Professional tips',
    'Market insights'
  ],
  facebook: [
    'Community question',
    'Event announcement',
    'Photo album',
    'Live video promo',
    'Contest announcement',
    'Milestone celebration'
  ],
  youtube: [
    'Video thumbnail',
    'Community poll',
    'Channel update',
    'Premiere announcement',
    'Playlist cover'
  ],
  tiktok: [
    'Trend participation',
    'Quick tutorial',
    'Behind the scenes',
    'Challenge announcement'
  ]
}

export function getOptimalSize(platform: string, contentType: string): { width: number; height: number } {
  const platformSpec = PLATFORM_SPECS[platform]
  if (!platformSpec) return { width: 1080, height: 1080 } // Default square
  
  // Find the best size for the content type
  for (const [sizeKey, sizeSpec] of Object.entries(platformSpec.sizes)) {
    if (sizeSpec.bestFor.includes(contentType)) {
      return { width: sizeSpec.width, height: sizeSpec.height }
    }
  }
  
  // Return the first available size as fallback
  const firstSize = Object.values(platformSpec.sizes)[0]
  return { width: firstSize.width, height: firstSize.height }
}

export function getTemplatesByPlatform(platform: string): GraphicsTemplate[] {
  return GRAPHICS_TEMPLATES.filter(template => template.platforms.includes(platform))
}

export function getTemplatesByCategory(category: string): GraphicsTemplate[] {
  return GRAPHICS_TEMPLATES.filter(template => template.category === category)
} 