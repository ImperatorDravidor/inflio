"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Play,
  Sparkles,
} from "lucide-react"

interface HeroSectionProps {
  isSignedIn?: boolean
}

export function HeroSection({ isSignedIn }: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#09090b]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 pt-24 pb-16 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/60">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-400" />
            AI-Powered Content Repurposing
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          One video.
          <br />
          <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Twenty pieces of content.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10"
        >
          Upload your video and get clips, blogs, social posts, and thumbnails — 
          all optimized for every platform. In minutes, not hours.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
            <Button size="lg" className="h-12 px-6 bg-white text-black hover:bg-white/90 font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Start creating
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="ghost" className="h-12 px-6 text-white/70 hover:text-white hover:bg-white/5">
              <Play className="h-4 w-4 mr-2" />
              See how it works
            </Button>
          </Link>
        </motion.div>

        {/* Trust */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 text-sm text-white/30"
        >
          14-day money-back guarantee
        </motion.p>
      </div>
    </section>
  )
}
