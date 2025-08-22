/**
 * Unified Design System for Inflio
 * Ensures consistent UI/UX across all features
 */

export const designSystem = {
  // Animation Presets
  animations: {
    // Portal/Modal animations
    portal: {
      enter: {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: { duration: 0.2, ease: "easeInOut" }
        },
        exit: { 
          opacity: 0, 
          scale: 0.95, 
          y: 20,
          transition: { duration: 0.2, ease: "easeInOut" }
        }
      },
      // Backdrop fade
      backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 }
      },
      // Content slide
      content: {
        initial: { x: 300, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 300, opacity: 0 },
        transition: { 
          type: "spring",
          damping: 30,
          stiffness: 300
        }
      }
    },
    // Card interactions
    card: {
      hover: {
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      },
      tap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      }
    },
    // List items
    list: {
      stagger: {
        initial: { opacity: 0, y: 20 },
        animate: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: {
            delay: i * 0.05,
            duration: 0.3,
            ease: "easeInOut"
          }
        })
      }
    },
    // Progress indicators
    progress: {
      pulse: {
        animate: {
          scale: [1, 1.05, 1],
          opacity: [0.7, 1, 0.7],
        },
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    },
    // Success states
    success: {
      checkmark: {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: 0.5, ease: "easeOut" }
      },
      celebration: {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { 
          type: "spring",
          damping: 15,
          stiffness: 200
        }
      }
    }
  },

  // Spacing System (8px base)
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
    '4xl': '6rem',  // 96px
  },

  // Typography Scale
  typography: {
    // Font families
    fonts: {
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
      display: 'var(--font-display)',
    },
    // Size scale
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    // Line heights
    lineHeights: {
      tight: '1.1',
      snug: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
    // Font weights
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },

  // Color System
  colors: {
    // Brand colors
    brand: {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--secondary))',
      accent: 'hsl(var(--accent))',
    },
    // Semantic colors
    semantic: {
      success: 'hsl(142, 76%, 36%)',
      warning: 'hsl(38, 92%, 50%)',
      error: 'hsl(0, 84%, 60%)',
      info: 'hsl(217, 91%, 60%)',
    },
    // Platform colors
    platforms: {
      instagram: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
      twitter: '#000000',
      linkedin: '#0077B5',
      facebook: '#1877F2',
      youtube: '#FF0000',
      tiktok: '#000000',
    },
    // Gradients
    gradients: {
      premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      sunset: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
      ocean: 'linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%)',
      purple: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
    }
  },

  // Border Radius
  radii: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    glow: '0 0 20px rgb(var(--primary) / 0.3)',
    'glow-lg': '0 0 40px rgb(var(--primary) / 0.4)',
  },

  // Z-index Scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    toast: 60,
    tooltip: 70,
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms ease',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Component Styles
  components: {
    // Portal/Modal styles
    portal: {
      backdrop: 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
      container: 'fixed inset-0 z-50 flex items-center justify-center p-4',
      content: 'relative w-full max-w-4xl max-h-[90vh] bg-background rounded-xl shadow-2xl overflow-hidden',
      header: 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4',
      body: 'overflow-y-auto px-6 py-4',
      footer: 'sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-6 py-4',
    },
    // Card styles
    card: {
      base: 'rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200',
      hover: 'hover:shadow-md hover:border-primary/20',
      interactive: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
      gradient: 'bg-gradient-to-br from-background to-muted/50',
    },
    // Button styles
    button: {
      base: 'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      sizes: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
      variants: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        premium: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
      }
    },
    // Input styles
    input: {
      base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      error: 'border-destructive focus-visible:ring-destructive',
      success: 'border-green-500 focus-visible:ring-green-500',
    },
    // Badge styles
    badge: {
      base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      variants: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'text-foreground border',
        success: 'bg-green-500/10 text-green-600 border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        error: 'bg-red-500/10 text-red-600 border-red-500/20',
      }
    }
  }
}

// Utility functions
export const getAnimation = (name: keyof typeof designSystem.animations) => designSystem.animations[name]
export const getSpacing = (size: keyof typeof designSystem.spacing) => designSystem.spacing[size]
export const getColor = (path: string) => {
  const [category, shade] = path.split('.')
  return (designSystem.colors as any)[category]?.[shade] || path
}
export const getShadow = (size: keyof typeof designSystem.shadows) => designSystem.shadows[size]
export const getRadius = (size: keyof typeof designSystem.radii) => designSystem.radii[size]

// CSS-in-JS helper
export const applyTheme = (element: HTMLElement) => {
  const root = document.documentElement
  Object.entries(designSystem.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value)
  })
  Object.entries(designSystem.radii).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value)
  })
}