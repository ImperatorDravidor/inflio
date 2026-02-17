"use client"

import { motion } from "framer-motion"
import {
  Scissors,
  Mic,
  FileText,
  MessageSquare,
  Image,
  Bot,
  Globe,
  Calendar,
  Palette,
  Sparkles,
} from "lucide-react"

const features = [
  {
    title: "AI Clip Generation",
    description: "Our AI watches your video and extracts the most engaging moments automatically. No manual scrubbing.",
    icon: Scissors,
  },
  {
    title: "99% Accurate Transcription",
    description: "Powered by Whisper. Supports 50+ languages with speaker detection and timestamps.",
    icon: Mic,
  },
  {
    title: "SEO Blog Posts",
    description: "Turn any video into a fully-formatted, SEO-optimized blog post with proper headings and structure.",
    icon: FileText,
  },
  {
    title: "Social Captions",
    description: "Platform-optimized captions for every network. The right hashtags, length, and tone.",
    icon: MessageSquare,
  },
  {
    title: "AI Thumbnails",
    description: "Generate eye-catching thumbnails that capture attention. Your face, your style, every time.",
    icon: Image,
  },
  {
    title: "AI Persona",
    description: "Train a model on your likeness. Get consistent personal branding across all generated content.",
    icon: Bot,
  },
  {
    title: "13 Platforms",
    description: "YouTube, TikTok, Instagram, LinkedIn, X, Facebook, Medium, Substack, and more.",
    icon: Globe,
  },
  {
    title: "Smart Scheduling",
    description: "Schedule posts at optimal times. Our AI learns when your audience is most engaged.",
    icon: Calendar,
  },
  {
    title: "Brand Learning",
    description: "Inflio learns your colors, fonts, voice, and style. Everything stays on-brand.",
    icon: Palette,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-white/60 font-medium">Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Everything you need.{" "}
            <span className="text-white/40">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete toolkit for transforming long-form video into 
            platform-ready content. Powered by AI, designed for creators.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary mb-5 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
