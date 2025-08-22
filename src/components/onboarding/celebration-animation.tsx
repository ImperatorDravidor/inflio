"use client"

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

interface CelebrationAnimationProps {
  trigger: boolean
  onComplete?: () => void
}

export function CelebrationAnimation({ trigger, onComplete }: CelebrationAnimationProps) {
  useEffect(() => {
    if (trigger) {
      // Trigger confetti
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) {
          clearInterval(interval)
          onComplete?.()
          return
        }

        const particleCount = 50 * (timeLeft / duration)
        
        // Shoot from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B']
        })
        
        // Shoot from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B']
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [trigger, onComplete])

  if (!trigger) return null

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Success message */}
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 pointer-events-auto"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        <motion.div
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: 3,
            repeatType: "reverse"
          }}
        >
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </svg>
        </motion.div>
        
        <motion.h2
          className="text-2xl font-bold text-center mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to Inflio! 🎉
        </motion.h2>
        
        <motion.p
          className="text-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your workspace is ready. Let's create something amazing!
        </motion.p>
      </motion.div>
    </motion.div>
  )
}