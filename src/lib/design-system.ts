// Unified Design System for Inflio
// This provides consistent styling across the entire application

export const colors = {
  // Primary brand colors
  primary: {
    DEFAULT: 'oklch(0.45 0.15 265)', // Professional purple
    hover: 'oklch(0.40 0.15 265)',
    muted: 'oklch(0.45 0.15 265 / 0.1)',
    foreground: 'oklch(0.98 0 0)'
  },
  
  // Neutral colors
  neutral: {
    50: 'oklch(0.98 0.001 260)',
    100: 'oklch(0.96 0.001 260)',
    200: 'oklch(0.92 0.002 260)',
    300: 'oklch(0.88 0.002 260)',
    400: 'oklch(0.70 0.01 260)',
    500: 'oklch(0.50 0.01 260)',
    600: 'oklch(0.35 0.01 260)',
    700: 'oklch(0.25 0.01 260)',
    800: 'oklch(0.15 0.01 260)',
    900: 'oklch(0.10 0.01 260)'
  },
  
  // Semantic colors
  success: 'oklch(0.60 0.15 150)',
  warning: 'oklch(0.70 0.15 60)',
  error: 'oklch(0.60 0.20 25)',
  info: 'oklch(0.60 0.15 220)'
}

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem'
}

export const animations = {
  // Subtle, professional animations only
  transition: {
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  hover: {
    scale: { scale: 1.02 },
    lift: { y: -2 },
    glow: { boxShadow: '0 4px 20px -2px oklch(0.45 0.15 265 / 0.2)' }
  }
}

export const components = {
  card: {
    base: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm',
    hover: 'hover:shadow-md transition-shadow duration-200',
    padding: 'p-4 lg:p-6'
  },
  
  button: {
    base: 'font-medium rounded-md transition-all duration-200',
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md',
    secondary: 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700',
    ghost: 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
  },
  
  stat: {
    base: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4',
    icon: 'p-2 rounded-md bg-primary-muted',
    value: 'text-2xl font-bold text-neutral-900 dark:text-neutral-100',
    label: 'text-sm text-neutral-600 dark:text-neutral-400'
  }
}

export const gradients = {
  // Limited, cohesive gradients
  primary: 'linear-gradient(135deg, oklch(0.45 0.15 265), oklch(0.50 0.12 280))',
  subtle: 'linear-gradient(135deg, oklch(0.45 0.15 265 / 0.1), oklch(0.50 0.12 280 / 0.05))',
  dark: 'linear-gradient(135deg, oklch(0.15 0.01 260), oklch(0.18 0.01 260))'
}

export const effects = {
  glass: 'backdrop-blur-sm bg-white/80 dark:bg-neutral-900/80 border border-white/20 dark:border-neutral-700/50',
  glow: 'shadow-lg shadow-primary/20',
  elevate: 'shadow-xl'
}

// Utility function to apply consistent styling
export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
} 