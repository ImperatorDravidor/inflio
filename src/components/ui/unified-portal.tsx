"use client"

import { ReactNode, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { designSystem } from '@/lib/design-system'
import { Badge } from '@/components/ui/badge'

interface UnifiedPortalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error'
  }
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showBackButton?: boolean
  onBack?: () => void
  className?: string
  contentClassName?: string
  allowFullscreen?: boolean
  sidePanel?: ReactNode
  headerActions?: ReactNode
  loading?: boolean
  loadingMessage?: string
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full mx-4'
}

export function UnifiedPortal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  children,
  footer,
  size = 'lg',
  showBackButton,
  onBack,
  className,
  contentClassName,
  allowFullscreen = true,
  sidePanel,
  headerActions,
  loading,
  loadingMessage = 'Loading...'
}: UnifiedPortalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape' && !isFullscreen) {
        onClose()
      }
      if (e.key === 'F11' && allowFullscreen) {
        e.preventDefault()
        setIsFullscreen(!isFullscreen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isFullscreen, onClose, allowFullscreen])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            {...designSystem.animations.portal.backdrop}
            onClick={!isFullscreen ? onClose : undefined}
          />

          {/* Portal Container */}
          <motion.div
            className={cn(
              "fixed z-50",
              isFullscreen 
                ? "inset-0" 
                : "inset-x-0 top-[5vh] bottom-[5vh] flex items-center justify-center px-4"
            )}
            {...designSystem.animations.portal.enter}
          >
            <div
              className={cn(
                "relative w-full bg-background shadow-2xl overflow-hidden",
                !isFullscreen && cn(sizeClasses[size], "rounded-xl max-h-[90vh]"),
                isFullscreen && "h-full",
                "flex flex-col",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Premium gradient border effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-50 blur-xl -z-10" />
              
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    {showBackButton && onBack && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="mr-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {icon && (
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {icon}
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{title}</h2>
                        {badge && (
                          <Badge variant={badge.variant || 'default'} className="ml-2">
                            {badge.text}
                          </Badge>
                        )}
                      </div>
                      {subtitle && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {headerActions}
                    
                    {allowFullscreen && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="hidden md:inline-flex"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <div className={cn(
                  "flex-1 overflow-y-auto",
                  sidePanel ? "border-r" : "",
                  contentClassName
                )}>
                  {loading ? (
                    <motion.div
                      className="flex flex-col items-center justify-center min-h-[400px] p-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        {/* Animated rings */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-primary/20"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.2, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-primary/30"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 0.2, 0.6],
                          }}
                          transition={{
                            duration: 2,
                            delay: 0.2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        {/* Center spinner */}
                        <motion.div
                          className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      </div>
                      
                      <motion.p
                        className="mt-4 text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {loadingMessage}
                      </motion.p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 py-4"
                    >
                      {children}
                    </motion.div>
                  )}
                </div>

                {/* Side Panel */}
                {sidePanel && (
                  <motion.div
                    className="w-80 bg-muted/30 overflow-y-auto"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {sidePanel}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {footer && (
                <motion.div
                  className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-6 py-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {footer}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}