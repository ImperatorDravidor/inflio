"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Captions,
  Type,
  Palette,
  Settings,
} from "lucide-react"

export default function SubtitlesPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <Captions className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Video Processing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            85% of social video is watched on mute
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            Your clip is worthless if people scroll past because they can't follow along silently. 
            Animated captions aren't decoration — they're how most people will experience your content.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Animation Styles with Visual */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Four animation styles
          </h2>
          <p className="text-white/50">
            Different content calls for different energy.
          </p>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-white">Word-by-word pop</h3>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/20 text-primary">Most popular</span>
            </div>
            <p className="text-sm text-white/50 mb-4">
              Each word highlights as it's spoken. Bold, attention-grabbing. The TikTok default.
            </p>
            <div className="font-bold text-lg tracking-wide">
              <span className="text-white/30">The secret to </span>
              <span className="text-primary">viral</span>
              <span className="text-white/30"> content</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <h3 className="font-semibold text-white mb-2">Karaoke fill</h3>
            <p className="text-sm text-white/50 mb-4">
              Words fill with color smoothly as you speak, like karaoke. Feels more fluid.
            </p>
            <div className="font-bold text-lg tracking-wide">
              <span className="bg-gradient-to-r from-primary from-60% to-white/30 to-60% bg-clip-text text-transparent">
                The secret to viral content
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <h3 className="font-semibold text-white mb-2">Phrase fade</h3>
            <p className="text-sm text-white/50 mb-4">
              Full phrases appear and fade. Cleaner, more professional. Good for talking-head content.
            </p>
            <div className="font-medium text-base text-white/70 px-3 py-2 bg-black/30 rounded inline-block">
              The secret to viral content
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <h3 className="font-semibold text-white mb-2">Classic subtitles</h3>
            <p className="text-sm text-white/50 mb-4">
              Traditional bottom placement, no animation. For when the content speaks for itself.
            </p>
            <div className="text-sm text-white/80 text-center py-1 px-3 bg-black/60 rounded mx-auto inline-block">
              The secret to viral content
            </div>
          </motion.div>
        </div>
      </section>

      {/* Customization */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Make them match your brand
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Type,
              title: "Typography",
              items: ["Custom fonts (upload yours)", "Size, weight, spacing", "Outline and shadow"],
            },
            {
              icon: Palette,
              title: "Colors",
              items: ["Text and highlight colors", "Background box options", "Brand colors auto-applied"],
            },
            {
              icon: Settings,
              title: "Positioning",
              items: ["Top, center, or bottom", "Custom margins", "Max text width"],
            },
          ].map((group, index) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <group.icon className="h-6 w-6 text-primary/70 mb-3" />
              <h3 className="font-medium text-white mb-3">{group.title}</h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="text-xs text-white/50">{item}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Save as Preset */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Create once, apply forever
          </h2>
          <p className="text-white/60 leading-relaxed">
            Style your captions once. Save as a preset. Every clip you create uses that style 
            automatically. Consistent branding without configuring anything each time. 
            You can have multiple presets for different content types.
          </p>
        </motion.div>
      </section>

      {/* The Workflow */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Already synced when you need them
          </h2>
          <p className="text-white/60 leading-relaxed mb-6">
            Captions aren't a separate step. When you upload a video:
          </p>
          <div className="space-y-2 text-sm text-white/50">
            <p>1. Transcription runs automatically (word-level timestamps)</p>
            <p>2. When you generate clips, captions are already synced</p>
            <p>3. Apply your preset style in one click</p>
            <p>4. Export with captions burned in, or as separate SRT/VTT files</p>
          </div>
        </motion.div>
      </section>

      {/* Translation Note */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <h3 className="font-semibold text-orange-400 mb-2">On translation</h3>
          <p className="text-white/60 text-sm leading-relaxed">
            We generate captions in your video's original language reliably. Translation to other 
            languages is available but machine translation still makes mistakes, especially with 
            nuance, slang, or technical terms. Review translated captions before publishing.
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
          className="text-center p-10 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Try different styles on your content
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Upload a video. Generate a clip. Preview different caption styles. 
            Find what fits your brand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                See all features
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
