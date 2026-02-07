"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Target,
  Heart,
  Zap,
  Globe,
  Clock,
  Video,
} from "lucide-react"

const beliefs = [
  {
    title: "Creators deserve their time back",
    description: "You should spend time creating, not reformatting the same content for different platforms.",
    icon: Clock,
  },
  {
    title: "AI should amplify, not replace",
    description: "Your voice is unique. AI should help you reach more people while keeping your authentic style.",
    icon: Heart,
  },
  {
    title: "Simple beats complex",
    description: "Powerful tools shouldn't require a manual. Upload, process, publish. That's it.",
    icon: Zap,
  },
  {
    title: "Built for everyone",
    description: "Whether you're a solo creator or a media company, the same tools should work for you.",
    icon: Globe,
  },
]

const metrics = [
  { value: "30 min", label: "Average processing time" },
  { value: "50+", label: "Languages supported" },
  { value: "13", label: "Platforms connected" },
  { value: "99%", label: "Transcription accuracy" },
]

export default function AboutPage() {
  return (
    <div className="pt-32 pb-24">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">About Inflio</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Content repurposing{" "}
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent">
              shouldn&apos;t be this hard
            </span>
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
            We built Inflio because we were tired of spending more time reformatting
            content than actually creating it. One video should become twenty pieces
            of content — automatically.
          </p>
        </motion.div>
      </section>

      {/* The Problem */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.015] border border-white/[0.06]"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-white/[0.06]">
              <Target className="h-5 w-5 text-white/80" />
            </div>
            <h2 className="text-xl font-semibold text-white/90">The problem we&apos;re solving</h2>
          </div>
          <div className="space-y-4 text-white/50 leading-relaxed">
            <p>
              Every creator knows the pain: you spend hours crafting a great video, then
              spend even more hours cutting clips, writing blog posts, creating social
              captions, and designing thumbnails. By the time you&apos;re done, you&apos;re too
              exhausted to make more content.
            </p>
            <p>
              The math doesn&apos;t work. A single video can take 9+ hours to fully repurpose
              across platforms. That&apos;s not sustainable for anyone — solo creators, agencies,
              or enterprise teams.
            </p>
            <p>
              Inflio reduces that to under 30 minutes. Upload once, get everything you need.
              Your video becomes clips, transcripts, blog posts, social content, and thumbnails —
              all optimized for each platform, all in your voice.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Metrics */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl bg-white/[0.015] border border-white/[0.06]"
            >
              <p className="text-2xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent mb-1">
                {metric.value}
              </p>
              <p className="text-xs text-white/35">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* What We Believe */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            Our Principles
          </p>
          <h2 className="text-2xl font-bold text-white mb-2">What we believe</h2>
          <p className="text-white/40">
            The principles behind every feature we build.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {beliefs.map((belief, index) => (
            <motion.div
              key={belief.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-white/[0.015] border border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-violet-500/15 to-violet-500/5 border border-white/[0.06] mb-4">
                <belief.icon className="h-5 w-5 text-white/70" />
              </div>
              <h3 className="font-semibold text-white/90 mb-1.5">{belief.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{belief.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What You Get */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/[0.04] via-purple-500/[0.03] to-pink-500/[0.03] border border-white/[0.06]"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-white/[0.06]">
              <Video className="h-5 w-5 text-white/80" />
            </div>
            <h2 className="text-xl font-semibold text-white/90">What you get</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2.5 text-white/50">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                AI-generated clips from viral moments
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                Accurate transcription in 50+ languages
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                SEO-optimized blog posts
              </li>
            </ul>
            <ul className="space-y-2.5 text-white/50">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                Platform-specific social captions
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                Eye-catching thumbnails with AI Persona
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                One-click publishing to 13 platforms
              </li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-2xl bg-white/[0.015] border border-white/[0.06]"
        >
          <Sparkles className="h-10 w-10 text-primary/70 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-white mb-3">Ready to save hours every week?</h2>
          <p className="text-white/40 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            14-day money-back guarantee on all plans.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button className="group gap-2 bg-white text-black hover:bg-white/90 rounded-xl h-11 px-6 font-medium">
                Get started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="border border-white/[0.06] text-white/70 hover:bg-white/[0.04] rounded-xl h-11 px-6">
                Talk to us
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
