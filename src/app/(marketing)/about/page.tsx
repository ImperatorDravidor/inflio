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
  Users,
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
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs text-primary font-medium uppercase tracking-wider mb-4">About Inflio</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 text-white">
            Content repurposing{" "}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              shouldn't be this hard
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            We built Inflio because we were tired of spending more time reformatting 
            content than actually creating it. One video should become twenty pieces 
            of content — automatically.
          </p>
        </motion.div>
      </section>

      {/* The Problem */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">The problem we're solving</h2>
          </div>
          <div className="space-y-4 text-white/60 leading-relaxed">
            <p>
              Every creator knows the pain: you spend hours crafting a great video, then 
              spend even more hours cutting clips, writing blog posts, creating social 
              captions, and designing thumbnails. By the time you're done, you're too 
              exhausted to make more content.
            </p>
            <p>
              The math doesn't work. A single video can take 9+ hours to fully repurpose 
              across platforms. That's not sustainable for anyone — solo creators, agencies, 
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
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
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
              className="text-center p-5 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <p className="text-2xl font-bold text-primary mb-1">
                {metric.value}
              </p>
              <p className="text-xs text-white/40">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* What We Believe */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold text-white mb-2">What we believe</h2>
          <p className="text-white/50">
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
              className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <belief.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white mb-1.5">{belief.title}</h3>
              <p className="text-sm text-white/50">{belief.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Summary */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Video className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">What you get</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2 text-white/60">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                AI-generated clips from viral moments
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Accurate transcription in 50+ languages
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                SEO-optimized blog posts
              </li>
            </ul>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Platform-specific social captions
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Eye-catching thumbnails with AI Persona
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
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
          className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ready to save hours every week?</h2>
          <p className="text-white/50 max-w-md mx-auto mb-6 text-sm">
            14-day money-back guarantee on all plans.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button className="gap-2 bg-white text-black hover:bg-white/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                Talk to us
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
