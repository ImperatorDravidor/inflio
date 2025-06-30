// Design tokens for staging and publishing system - Inflio Theme
export const designTokens = {
  // Status colors - Using Inflio's primary color palette
  status: {
    required: {
      color: 'text-destructive',
      background: 'bg-destructive/5 dark:bg-destructive/10',
      border: 'border-destructive/20 dark:border-destructive/30',
      icon: 'text-destructive'
    },
    optional: {
      color: 'text-primary',
      background: 'bg-primary/5 dark:bg-primary/10',
      border: 'border-primary/20 dark:border-primary/30',
      icon: 'text-primary'
    },
    complete: {
      color: 'text-emerald-600 dark:text-emerald-400',
      background: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-500'
    },
    warning: {
      color: 'text-amber-600 dark:text-amber-400',
      background: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-500'
    },
    error: {
      color: 'text-destructive',
      background: 'bg-destructive/10 dark:bg-destructive/20',
      border: 'border-destructive/30 dark:border-destructive/40',
      icon: 'text-destructive'
    },
    info: {
      color: 'text-primary',
      background: 'bg-primary/5 dark:bg-primary/10',
      border: 'border-primary/20 dark:border-primary/30',
      icon: 'text-primary'
    }
  },

  // Platform brand colors - Consistent gradients
  platforms: {
    instagram: {
      gradient: 'from-purple-500 to-pink-500',
      solid: 'bg-gradient-to-br from-purple-500 to-pink-500',
      text: 'text-purple-600 dark:text-purple-400',
      light: 'bg-purple-50 dark:bg-purple-950/20'
    },
    tiktok: {
      gradient: 'from-black to-gray-800',
      solid: 'bg-black',
      text: 'text-gray-900 dark:text-gray-100',
      light: 'bg-gray-100 dark:bg-gray-900/20'
    },
    youtube: {
      gradient: 'from-red-500 to-red-600',
      solid: 'bg-red-600',
      text: 'text-red-600 dark:text-red-400',
      light: 'bg-red-50 dark:bg-red-950/20'
    },
    linkedin: {
      gradient: 'from-blue-600 to-blue-700',
      solid: 'bg-blue-700',
      text: 'text-blue-700 dark:text-blue-400',
      light: 'bg-blue-50 dark:bg-blue-950/20'
    },
    facebook: {
      gradient: 'from-blue-500 to-blue-600',
      solid: 'bg-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      light: 'bg-blue-50 dark:bg-blue-950/20'
    },
    x: {
      gradient: 'from-gray-900 to-black',
      solid: 'bg-black',
      text: 'text-gray-900 dark:text-gray-100',
      light: 'bg-gray-100 dark:bg-gray-900/20'
    },
    threads: {
      gradient: 'from-gray-800 to-black',
      solid: 'bg-gray-900',
      text: 'text-gray-800 dark:text-gray-200',
      light: 'bg-gray-100 dark:bg-gray-900/20'
    }
  },

  // Field states - Using Inflio's design system
  fields: {
    default: {
      border: 'border-input',
      focus: 'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
      background: 'bg-background'
    },
    error: {
      border: 'border-destructive',
      focus: 'focus:ring-2 focus:ring-destructive/20 focus:border-destructive',
      background: 'bg-destructive/5'
    },
    success: {
      border: 'border-emerald-500 dark:border-emerald-400',
      focus: 'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
      background: 'bg-emerald-50/50 dark:bg-emerald-950/10'
    },
    warning: {
      border: 'border-amber-500 dark:border-amber-400',
      focus: 'focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500',
      background: 'bg-amber-50/50 dark:bg-amber-950/10'
    }
  },

  // Progress indicators
  progress: {
    incomplete: 'bg-muted',
    complete: 'bg-primary',
    partial: 'bg-amber-500',
    error: 'bg-destructive'
  },

  // Task states for checklist
  tasks: {
    pending: {
      checkbox: 'border-border',
      text: 'text-foreground',
      background: 'bg-muted/50'
    },
    completed: {
      checkbox: 'bg-primary border-primary',
      text: 'text-muted-foreground line-through',
      background: 'bg-transparent'
    },
    error: {
      checkbox: 'border-destructive',
      text: 'text-destructive',
      background: 'bg-destructive/5'
    }
  },

  // Content type colors
  contentTypes: {
    video: {
      color: 'text-purple-600 dark:text-purple-400',
      background: 'bg-purple-100 dark:bg-purple-900/20',
      icon: 'text-purple-500'
    },
    image: {
      color: 'text-blue-600 dark:text-blue-400',
      background: 'bg-blue-100 dark:bg-blue-900/20',
      icon: 'text-blue-500'
    },
    article: {
      color: 'text-green-600 dark:text-green-400',
      background: 'bg-green-100 dark:bg-green-900/20',
      icon: 'text-green-500'
    },
    carousel: {
      color: 'text-orange-600 dark:text-orange-400',
      background: 'bg-orange-100 dark:bg-orange-900/20',
      icon: 'text-orange-500'
    }
  }
}

// Helper functions
export function getStatusClasses(status: keyof typeof designTokens.status) {
  return designTokens.status[status] || designTokens.status.info
}

export function getPlatformClasses(platform: string) {
  return designTokens.platforms[platform as keyof typeof designTokens.platforms] || {
    gradient: 'from-gray-500 to-gray-600',
    solid: 'bg-gray-600',
    text: 'text-gray-600 dark:text-gray-400',
    light: 'bg-gray-50 dark:bg-gray-950/20'
  }
}

export function getFieldClasses(state: keyof typeof designTokens.fields) {
  return designTokens.fields[state] || designTokens.fields.default
}

export function getTaskClasses(state: keyof typeof designTokens.tasks) {
  return designTokens.tasks[state] || designTokens.tasks.pending
}

export function getContentTypeClasses(type: string) {
  const mapping: Record<string, keyof typeof designTokens.contentTypes> = {
    video: 'video',
    clip: 'video',
    longform: 'video',
    short: 'video',
    image: 'image',
    blog: 'article',
    article: 'article',
    carousel: 'carousel'
  }
  
  const contentType = mapping[type] || 'video'
  return designTokens.contentTypes[contentType]
} 