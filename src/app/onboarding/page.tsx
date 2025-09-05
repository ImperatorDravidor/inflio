"use client"

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PremiumOnboarding } from '@/components/onboarding/premium-onboarding'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function OnboardingPage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // Only redirect after auth is fully loaded and we're sure there's no user
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])
  
  // Premium loading state
  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-10 w-10 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Preparing Your Experience
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Setting up your AI content studio...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }
  
  return <PremiumOnboarding userId={userId} />
}