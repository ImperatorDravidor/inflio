"use client"

import { useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { PremiumOnboarding } from '@/components/onboarding/premium-onboarding'
import { motion } from 'framer-motion'
import { InflioLogo } from '@/components/inflio-logo'

// Futuristic loading component with logo and sync ring
function InflioLoader({ title = "Preparing Your Experience", subtitle = "Setting up your AI content studio..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8"
      >
        {/* Logo with futuristic sync ring */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.8) 10%, transparent 20%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner glow ring */}
          <motion.div
            className="absolute inset-2 rounded-full border border-white/20"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Logo container */}
          <div className="relative z-10 bg-background rounded-full p-4 shadow-lg">
            <InflioLogo size="md" variant="dark" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {subtitle}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function OnboardingContent() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStep = searchParams.get('step') ? parseInt(searchParams.get('step')!) : undefined

  useEffect(() => {
    // Only redirect after auth is fully loaded and we're sure there's no user
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])

  // Premium loading state
  if (!isLoaded || !userId) {
    return <InflioLoader />
  }

  return <PremiumOnboarding userId={userId} initialStep={initialStep} />
}

// Simple fallback without framer-motion for Suspense
function SimpleFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center space-y-8">
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.8) 10%, transparent 20%)',
              animationDuration: '1.5s'
            }}
          />
          <div className="absolute inset-2 rounded-full border border-white/20 animate-pulse" />
          <div className="relative z-10 bg-background rounded-full p-4 shadow-lg">
            <div className="h-16 w-36 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Loading...</h1>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<SimpleFallback />}>
      <OnboardingContent />
    </Suspense>
  )
}