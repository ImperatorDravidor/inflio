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
    category: "Video Processing",
    items: [
      {
        title: "Clip Detection",
        desc: "AI watches your video. Finds the good parts. Suggests cuts.",
        href: "/features/clip-generation",
        icon: Scissors,
        gradient: "from-violet-500/15 to-violet-500/5",
      },
      {
        title: "Transcription",
        desc: "Whisper-powered. Word-level timestamps. 50+ languages.",
        href: "/features/transcription",
        icon: Mic,
        gradient: "from-sky-500/15 to-sky-500/5",
      },
      {
        title: "Captions",
        desc: "Animated subtitles. Word-by-word or karaoke. Your brand styling.",
        href: "/features/subtitles",
        icon: Captions,
        gradient: "from-teal-500/15 to-teal-500/5",
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
        gradient: "from-orange-500/15 to-orange-500/5",
      },
      {
        title: "Blog Posts",
        desc: "Video to structured article. First draft, not finished product.",
        href: "/features/blog-generator",
        icon: FileText,
        gradient: "from-emerald-500/15 to-emerald-500/5",
      },
      {
        title: "Thumbnails",
        desc: "Your face (AI-generated), your brand colors, click-worthy.",
        href: "/features/thumbnails",
        icon: Image,
        gradient: "from-pink-500/15 to-pink-500/5",
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
        gradient: "from-indigo-500/15 to-indigo-500/5",
        highlight: true,
      },
      {
        title: "Brand Settings",
        desc: "Colors, fonts, voice. Set once. Applied everywhere automatically.",
        href: "/features/brand-identity",
        icon: Palette,
        gradient: "from-amber-500/15 to-amber-500/5",
      },
      {
        title: "Consistency",
        desc: "Same face + same colors = recognizable in the feed.",
        href: "/features/consistent-visuals",
        icon: Eye,
        gradient: "from-rose-500/15 to-rose-500/5",
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
        gradient: "from-cyan-500/15 to-cyan-500/5",
      },
      {
        title: "Scheduling",
        desc: "Create when you have time. Post when it makes sense.",
        href: "/features/scheduler",
        icon: Calendar,
        gradient: "from-lime-500/15 to-lime-500/5",
      },
      {
        title: "Analytics",
        desc: "Performance across platforms. Basic metrics. One dashboard.",
        href: "/features/analytics",
        icon: BarChart3,
        gradient: "from-fuchsia-500/15 to-fuchsia-500/5",
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="pt-32 pb-24">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            Features
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Video in,{" "}
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent">
              content empire
            </span>{" "}
            out
          </h1>
          <p className="text-lg text-white/40 max-w-xl leading-relaxed mb-8">
            Upload a long video. Get clips, captions, thumbnails, social posts, and blog content.
            Publish everywhere. Here&apos;s each piece.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="group gap-2 bg-white text-black hover:bg-white/90 h-12 px-6 rounded-xl font-medium">
              <Sparkles className="h-4 w-4" />
              Get started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      {features.map((section) => (
        <section key={section.category} className="mx-auto max-w-4xl px-6 lg:px-8 mb-14">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-primary/70 uppercase tracking-wider mb-5"
          >
            {section.category}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-4">
            {section.items.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                viewport={{ once: true }}
              >
                <Link
                  href={feature.href}
                  className={`block h-full p-5 rounded-xl border transition-all duration-300 group ${
                    feature.highlight
                      ? "bg-gradient-to-br from-primary/[0.04] to-purple-500/[0.03] border-primary/20 hover:border-primary/30"
                      : "bg-white/[0.015] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b ${feature.gradient} border border-white/[0.06] mb-3 group-hover:scale-105 transition-transform duration-300`}>
                    <feature.icon className="h-4.5 w-4.5 text-white/70" />
                  </div>
                  <h3 className="font-medium text-white/90 text-sm mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {feature.desc}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      {/* The Connection */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-7 rounded-2xl bg-white/[0.015] border border-white/[0.06]"
        >
          <h2 className="text-lg font-semibold text-white/90 mb-3">
            These aren&apos;t separate tools
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Transcription powers clips, captions, social posts, and blog content.
            Your trained persona appears in thumbnails. Brand settings apply to everything visual.
            One video upload — everything else flows from it. That&apos;s the point.
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
          className="text-center p-12 rounded-2xl bg-gradient-to-br from-primary/[0.04] via-purple-500/[0.03] to-pink-500/[0.03] border border-white/[0.06]"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            See if it fits your workflow
          </h2>
          <p className="text-white/40 max-w-md mx-auto mb-8 leading-relaxed">
            Upload something you&apos;ve already recorded. Run it through.
            Decide if the output is worth it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="group gap-2 bg-white text-black hover:bg-white/90 rounded-xl h-12 px-6 font-medium">
                Get started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="ghost" size="lg" className="border border-white/[0.06] text-white/70 hover:bg-white/[0.04] rounded-xl h-12 px-6">
                View pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
