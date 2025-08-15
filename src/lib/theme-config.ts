/**
 * Unified Theme Configuration
 * Manages themes and color schemes across the platform
 */

export interface ThemeConfig {
  name: string
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
  gradients: {
    primary: string
    secondary: string
    accent: string
    premium: string
  }
  animations: {
    duration: number
    ease: string
  }
}

// Preset themes
export const themes: Record<string, ThemeConfig> = {
  default: {
    name: 'Default',
    colors: {
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(222.2, 84%, 4.9%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(222.2, 84%, 4.9%)',
      popover: 'hsl(0, 0%, 100%)',
      popoverForeground: 'hsl(222.2, 84%, 4.9%)',
      primary: 'hsl(262.1, 83.3%, 57.8%)',
      primaryForeground: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(210, 40%, 96.1%)',
      secondaryForeground: 'hsl(222.2, 47.4%, 11.2%)',
      muted: 'hsl(210, 40%, 96.1%)',
      mutedForeground: 'hsl(215.4, 16.3%, 46.9%)',
      accent: 'hsl(210, 40%, 96.1%)',
      accentForeground: 'hsl(222.2, 47.4%, 11.2%)',
      destructive: 'hsl(0, 84.2%, 60.2%)',
      destructiveForeground: 'hsl(210, 40%, 98%)',
      border: 'hsl(214.3, 31.8%, 91.4%)',
      input: 'hsl(214.3, 31.8%, 91.4%)',
      ring: 'hsl(262.1, 83.3%, 57.8%)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
    },
    animations: {
      duration: 250,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: 'hsl(222.2, 84%, 4.9%)',
      foreground: 'hsl(210, 40%, 98%)',
      card: 'hsl(222.2, 84%, 4.9%)',
      cardForeground: 'hsl(210, 40%, 98%)',
      popover: 'hsl(222.2, 84%, 4.9%)',
      popoverForeground: 'hsl(210, 40%, 98%)',
      primary: 'hsl(263.4, 70%, 50.4%)',
      primaryForeground: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(217.2, 32.6%, 17.5%)',
      secondaryForeground: 'hsl(210, 40%, 98%)',
      muted: 'hsl(217.2, 32.6%, 17.5%)',
      mutedForeground: 'hsl(215, 20.2%, 65.1%)',
      accent: 'hsl(217.2, 32.6%, 17.5%)',
      accentForeground: 'hsl(210, 40%, 98%)',
      destructive: 'hsl(0, 62.8%, 30.6%)',
      destructiveForeground: 'hsl(210, 40%, 98%)',
      border: 'hsl(217.2, 32.6%, 17.5%)',
      input: 'hsl(217.2, 32.6%, 17.5%)',
      ring: 'hsl(263.4, 70%, 50.4%)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
    },
    animations: {
      duration: 250,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  midnight: {
    name: 'Midnight',
    colors: {
      background: 'hsl(240, 10%, 3.9%)',
      foreground: 'hsl(0, 0%, 98%)',
      card: 'hsl(240, 10%, 3.9%)',
      cardForeground: 'hsl(0, 0%, 98%)',
      popover: 'hsl(240, 10%, 3.9%)',
      popoverForeground: 'hsl(0, 0%, 98%)',
      primary: 'hsl(346.8, 77.2%, 49.8%)',
      primaryForeground: 'hsl(355.7, 100%, 97.3%)',
      secondary: 'hsl(240, 3.7%, 15.9%)',
      secondaryForeground: 'hsl(0, 0%, 98%)',
      muted: 'hsl(240, 3.7%, 15.9%)',
      mutedForeground: 'hsl(240, 5%, 64.9%)',
      accent: 'hsl(240, 3.7%, 15.9%)',
      accentForeground: 'hsl(0, 0%, 98%)',
      destructive: 'hsl(0, 62.8%, 30.6%)',
      destructiveForeground: 'hsl(0, 0%, 98%)',
      border: 'hsl(240, 3.7%, 15.9%)',
      input: 'hsl(240, 3.7%, 15.9%)',
      ring: 'hsl(346.8, 77.2%, 49.8%)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
      secondary: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      accent: 'linear-gradient(135deg, #0700b8 0%, #00ff88 100%)',
      premium: 'linear-gradient(135deg, #ff0844 0%, #ff6a00 50%, #ffb199 100%)'
    },
    animations: {
      duration: 300,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      background: 'hsl(143, 20%, 96%)',
      foreground: 'hsl(143, 50%, 10%)',
      card: 'hsl(143, 20%, 98%)',
      cardForeground: 'hsl(143, 50%, 10%)',
      popover: 'hsl(143, 20%, 98%)',
      popoverForeground: 'hsl(143, 50%, 10%)',
      primary: 'hsl(142, 70%, 45%)',
      primaryForeground: 'hsl(144, 100%, 97%)',
      secondary: 'hsl(143, 30%, 90%)',
      secondaryForeground: 'hsl(143, 50%, 20%)',
      muted: 'hsl(143, 20%, 90%)',
      mutedForeground: 'hsl(143, 20%, 40%)',
      accent: 'hsl(142, 50%, 85%)',
      accentForeground: 'hsl(143, 50%, 20%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 98%)',
      border: 'hsl(143, 30%, 82%)',
      input: 'hsl(143, 30%, 82%)',
      ring: 'hsl(142, 70%, 45%)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      secondary: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
      accent: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
      premium: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e063 100%)'
    },
    animations: {
      duration: 280,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

// Apply theme to DOM
export function applyTheme(themeName: keyof typeof themes) {
  const theme = themes[themeName]
  if (!theme) return

  const root = document.documentElement

  // Apply colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    // Extract HSL values without the hsl() wrapper
    const hslValue = value.replace(/hsl\((.*)\)/, '$1')
    root.style.setProperty(`--${cssVar}`, hslValue)
  })

  // Apply gradients
  Object.entries(theme.gradients).forEach(([key, value]) => {
    root.style.setProperty(`--gradient-${key}`, value)
  })

  // Apply animation settings
  root.style.setProperty('--animation-duration', `${theme.animations.duration}ms`)
  root.style.setProperty('--animation-ease', theme.animations.ease)

  // Store theme preference
  localStorage.setItem('theme', themeName)
  
  // Add theme class to body
  document.body.className = document.body.className
    .replace(/theme-\w+/g, '')
    .concat(` theme-${themeName}`)
}

// Get current theme
export function getCurrentTheme(): string {
  if (typeof window === 'undefined') return 'default'
  return localStorage.getItem('theme') || 'default'
}

// Initialize theme on load
export function initializeTheme() {
  if (typeof window === 'undefined') return
  
  const savedTheme = getCurrentTheme()
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = savedTheme || (prefersDark ? 'dark' : 'default')
  
  applyTheme(theme as keyof typeof themes)
}

// Theme toggle hook
export function useTheme() {
  const setTheme = (themeName: keyof typeof themes) => {
    applyTheme(themeName)
  }

  const toggleTheme = () => {
    const current = getCurrentTheme()
    const next = current === 'default' ? 'dark' : 'default'
    setTheme(next as keyof typeof themes)
  }

  return {
    theme: getCurrentTheme(),
    setTheme,
    toggleTheme,
    themes: Object.keys(themes)
  }
}