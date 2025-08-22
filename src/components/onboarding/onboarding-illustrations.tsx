"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedIconProps {
  className?: string
  delay?: number
}

export function PlatformIllustration({ className, delay = 0 }: AnimatedIconProps) {
  return (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 200 200" fill="none">
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        stroke="url(#gradient1)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay, ease: "easeInOut" }}
      />
      
      {/* Floating platform icons */}
      {[
        { x: 50, y: 50, r: 15 },
        { x: 150, y: 50, r: 15 },
        { x: 150, y: 150, r: 15 },
        { x: 50, y: 150, r: 15 },
        { x: 100, y: 30, r: 12 },
        { x: 100, y: 170, r: 12 },
      ].map((circle, i) => (
        <motion.circle
          key={i}
          cx={circle.x}
          cy={circle.y}
          r={circle.r}
          fill="url(#gradient2)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{
            duration: 0.5,
            delay: delay + 0.2 + i * 0.1,
            ease: "backOut"
          }}
        />
      ))}
      
      {/* Connecting lines */}
      {[
        { x1: 50, y1: 50, x2: 150, y2: 50 },
        { x1: 150, y1: 50, x2: 150, y2: 150 },
        { x1: 150, y1: 150, x2: 50, y2: 150 },
        { x1: 50, y1: 150, x2: 50, y2: 50 },
      ].map((line, i) => (
        <motion.line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="url(#gradient1)"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{
            duration: 1,
            delay: delay + 0.5 + i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
      
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function ProfileIllustration({ className, delay = 0 }: AnimatedIconProps) {
  return (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 200 200" fill="none">
      {/* Profile circle */}
      <motion.circle
        cx="100"
        cy="80"
        r="30"
        fill="url(#profileGradient)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay, type: "spring", stiffness: 200 }}
      />
      
      {/* Body */}
      <motion.path
        d="M 70 110 Q 100 100 130 110 L 130 150 Q 100 160 70 150 Z"
        fill="url(#profileGradient)"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
      />
      
      {/* Floating elements */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x = 100 + Math.cos(rad) * 60
        const y = 100 + Math.sin(rad) * 60
        
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="8"
            fill="url(#accentGradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 1],
              opacity: [0, 0.6, 0.6],
              y: [0, -5, 0]
            }}
            transition={{
              duration: 2,
              delay: delay + 0.3 + i * 0.1,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        )
      })}
      
      <defs>
        <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function BrandIllustration({ className, delay = 0 }: AnimatedIconProps) {
  return (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 200 200" fill="none">
      {/* Color palette */}
      {[
        { x: 60, y: 60, color: "#8B5CF6" },
        { x: 100, y: 60, color: "#EC4899" },
        { x: 140, y: 60, color: "#3B82F6" },
        { x: 60, y: 100, color: "#10B981" },
        { x: 100, y: 100, color: "#F59E0B" },
        { x: 140, y: 100, color: "#EF4444" },
      ].map((rect, i) => (
        <motion.rect
          key={i}
          x={rect.x - 15}
          y={rect.y - 15}
          width="30"
          height="30"
          rx="8"
          fill={rect.color}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.1,
            type: "spring",
            stiffness: 200
          }}
        />
      ))}
      
      {/* Typography preview */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.6 }}
      >
        <rect x="50" y="130" width="100" height="8" rx="4" fill="url(#textGradient)" opacity="0.8" />
        <rect x="50" y="145" width="70" height="6" rx="3" fill="url(#textGradient)" opacity="0.6" />
        <rect x="50" y="158" width="85" height="6" rx="3" fill="url(#textGradient)" opacity="0.4" />
      </motion.g>
      
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function AIAssistantIllustration({ className, delay = 0 }: AnimatedIconProps) {
  return (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 200 200" fill="none">
      {/* Brain/AI core */}
      <motion.circle
        cx="100"
        cy="100"
        r="40"
        fill="none"
        stroke="url(#aiGradient)"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay }}
      />
      
      {/* Neural connections */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180
        const x1 = 100 + Math.cos(angle) * 40
        const y1 = 100 + Math.sin(angle) * 40
        const x2 = 100 + Math.cos(angle) * 70
        const y2 = 100 + Math.sin(angle) * 70
        
        return (
          <motion.g key={i}>
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#aiGradient)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{
                duration: 0.5,
                delay: delay + 0.2 + i * 0.1
              }}
            />
            <motion.circle
              cx={x2}
              cy={y2}
              r="6"
              fill="url(#aiNodeGradient)"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{
                duration: 0.3,
                delay: delay + 0.4 + i * 0.1
              }}
            />
          </motion.g>
        )
      })}
      
      {/* Pulsing center */}
      <motion.circle
        cx="100"
        cy="100"
        r="15"
        fill="url(#aiCenterGradient)"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          delay,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <defs>
        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="aiNodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <radialGradient id="aiCenterGradient">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export function SuccessIllustration({ className, delay = 0 }: AnimatedIconProps) {
  return (
    <svg className={cn("w-full h-full", className)} viewBox="0 0 200 200" fill="none">
      {/* Success circle */}
      <motion.circle
        cx="100"
        cy="100"
        r="60"
        fill="none"
        stroke="url(#successGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
      />
      
      {/* Checkmark */}
      <motion.path
        d="M 70 100 L 90 120 L 130 80"
        stroke="url(#successGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.5, ease: "easeOut" }}
      />
      
      {/* Celebration particles */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const x = 100 + Math.cos(angle) * 80
        const y = 100 + Math.sin(angle) * 80
        
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill={i % 2 === 0 ? "#8B5CF6" : "#EC4899"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: [0, Math.cos(angle) * 20, Math.cos(angle) * 40],
              y: [0, Math.sin(angle) * 20, Math.sin(angle) * 40]
            }}
            transition={{
              duration: 1,
              delay: delay + 1 + i * 0.05,
              ease: "easeOut"
            }}
          />
        )
      })}
      
      <defs>
        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
    </svg>
  )
}