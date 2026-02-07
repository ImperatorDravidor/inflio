"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Play,
  Sparkles,
  Video,
  FileText,
  MessageSquare,
  Image,
  Scissors,
} from "lucide-react"

interface HeroSectionProps {
  isSignedIn?: boolean
}

const floatingItems = [
  { icon: Scissors, label: "Clips", x: "8%", y: "20%", delay: 0 },
  { icon: FileText, label: "Blog", x: "85%", y: "25%", delay: 0.5 },
  { icon: MessageSquare, label: "Social", x: "5%", y: "70%", delay: 1.0 },
  { icon: Image, label: "Thumbnails", x: "90%", y: "65%", delay: 1.5 },
]

export function HeroSection({ isSignedIn }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#06060a]" />
        {/* Primary radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,80,220,0.15),transparent_70%)]" />
        {/* Secondary warm glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_60%_0%,rgba(200,100,255,0.08),transparent_60%)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
      </div>

      {/* Floating content type indicators - desktop only */}
      <div className="hidden lg:block">
        {floatingItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 + item.delay, ease: "easeOut" }}
            className="absolute"
            style={{ left: item.x, top: item.y }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm"
            >
              <item.icon className="h-4 w-4 text-primary/70" />
              <span className="text-xs text-white/40 font-medium">{item.label}</span>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 pt-32 pb-24 text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] text-sm text-white/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            AI-Powered Content Repurposing
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-7"
        >
          One video.
          <br />
          <span className="bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent">
            Endless content.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Upload a video. Get clips, blog posts, social captions, and thumbnails — 
          optimized for every platform. In minutes, not hours.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
            <Button size="lg" className="group h-13 px-7 bg-white text-black hover:bg-white/90 font-medium text-base rounded-xl shadow-[0_0_30px_-5px_rgba(167,139,250,0.3)] hover:shadow-[0_0_40px_-5px_rgba(167,139,250,0.4)] transition-all duration-300">
              <Sparkles className="h-4 w-4 mr-2" />
              Start creating
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="ghost" className="h-13 px-7 text-white/60 hover:text-white hover:bg-white/[0.06] font-medium text-base rounded-xl border border-white/[0.06]">
              <Play className="h-4 w-4 mr-2" />
              See how it works
            </Button>
          </Link>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex items-center justify-center gap-6 text-sm text-white/25"
        >
          <span>No credit card required</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>14-day money-back guarantee</span>
        </motion.div>
      </div>
    </section>
  )
}
