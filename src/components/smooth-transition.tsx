"use client"

import { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SmoothTransitionProps {
  children: ReactNode
  transitionKey?: string | number
  className?: string
}

export function SmoothTransition({ 
  children, 
  transitionKey,
  className 
}: SmoothTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}