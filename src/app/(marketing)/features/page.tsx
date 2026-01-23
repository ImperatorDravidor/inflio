"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Scissors,
  Mic,
  Captions,
  FileText,
  MessageSquare,
  Image,
  Bot,
  Palette,
  Eye,
  Globe,
  Calendar,
  BarChart3,
} from "lucide-react"

const features = [
  {
    category: "Video → Clips",
    items: [
      {
        title: "Clip Detection",
        desc: "AI watches your video. Finds the good parts. Suggests cuts.",
        href: "/features/clip-generation",
        icon: Scissors,
      },
      {
        title: "Transcription",
        desc: "Whisper-powered. Word-level timestamps. 50+ languages.",
        href: "/features/transcription",
        icon: Mic,
      },
      {
        title: "Captions",
        desc: "Animated subtitles. Word-by-word or karaoke. Your brand styling.",
        href: "/features/subtitles",
        icon: Captions,
      },
    ],
  },
  {
    category: "Content Generation",
    items: [
      {
        title: "Social Captions",
        desc: "Platform-specific copy from your transcript. Not generic AI slop.",
        href: "/features/social-posts",
        icon: MessageSquare,
      },
      {
        title: "Blog Posts",
        desc: "Video → structured article. First draft, not finished product.",
        href: "/features/blog-generator",
        icon: FileText,
      },
      {
        title: "Thumbnails",
        desc: "Your face (AI-generated), your brand colors, click-worthy.",
        href: "/features/thumbnails",
        icon: Image,
      },
    ],
  },
  {
    category: "Your AI Persona",
    items: [
      {
        title: "Face Training",
        desc: "Upload photos. Train a model. Generate images of 'you' on demand.",
        href: "/features/avatar-training",
        icon: Bot,
        highlight: true,
      },
      {
        title: "Brand Settings",
        desc: "Colors, fonts, voice. Set once. Applied everywhere automatically.",
        href: "/features/brand-identity",
        icon: Palette,
      },
      {
        title: "Consistency",
        desc: "Same face + same colors = recognizable in the feed.",
        href: "/features/consistent-visuals",
        icon: Eye,
      },
    ],
  },
  {
    category: "Publishing",
    items: [
      {
        title: "Multi-Platform",
        desc: "TikTok, Instagram, YouTube, LinkedIn, X — one upload.",
        href: "/features/multi-platform",
        icon: Globe,
      },
      {
        title: "Scheduling",
        desc: "Create when you have time. Post when it makes sense.",
        href: "/features/scheduler",
        icon: Calendar,
      },
      {
        title: "Analytics",
        desc: "Performance across platforms. Basic metrics. One dashboard.",
        href: "/features/analytics",
        icon: BarChart3,
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Video in, content empire out
          </h1>
          <p className="text-lg text-white/60 max-w-xl leading-relaxed mb-8">
            Upload a long video. Get clips, captions, thumbnails, social posts, and blog content. 
            Publish everywhere. That's the idea. Here's each piece.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      {features.map((section, sectionIndex) => (
        <section key={section.category} className="mx-auto max-w-4xl px-6 lg:px-8 mb-12">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4"
          >
            {section.category}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-3">
            {section.items.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Link
                  href={feature.href}
                  className={`block h-full p-4 rounded-xl border transition-all duration-200 hover:border-white/20 group ${
                    feature.highlight 
                      ? "bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20" 
                      : "bg-white/[0.02] border-white/10"
                  }`}
                >
                  <feature.icon className={`h-5 w-5 mb-2.5 ${feature.highlight ? "text-primary" : "text-white/30 group-hover:text-white/50 transition-colors"}`} />
                  <h3 className="font-medium text-white text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {feature.desc}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      {/* The Connection */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-lg font-semibold text-white mb-3">
            These aren't separate tools
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Transcription powers clips, captions, social posts, and blog content. 
            Your trained persona appears in thumbnails. Brand settings apply to everything visual. 
            One video upload → everything else flows from it. That's the point.
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            See if it fits your workflow
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Upload something you've already recorded. Run it through. 
            Decide if the output is worth it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                View pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
