"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Scissors,
  Clock,
  Target,
  Settings,
  Volume2,
  Brain,
  MessageCircle,
  Layers,
} from "lucide-react"

export default function ClipGenerationPage() {
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
            <Scissors className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Video Processing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Stop watching your own videos on repeat
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            Finding good clips means watching the whole thing again. Marking timestamps. 
            Deciding where to cut. Doing it again for the next clip. It's labor, not creativity. 
            Let AI do the scrubbing.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Concrete Example */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Here's what actually happens
          </h2>
          <div className="space-y-6 text-white/60">
            <p>
              You upload a 47-minute podcast episode. Two minutes later, you get back:
            </p>
            <div className="space-y-4 pl-4 border-l-2 border-primary/30">
              <div>
                <p className="text-white text-sm font-medium">Clip 1 (58 seconds)</p>
                <p className="text-sm">"The moment where your guest explains why they quit their 6-figure job. 
                Starts with the setup question, ends on the punchline."</p>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Clip 2 (34 seconds)</p>
                <p className="text-sm">"That tangent about morning routines that got a big laugh. 
                Clean cut at the joke landing."</p>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Clip 3 (72 seconds)</p>
                <p className="text-sm">"The controversial take on hiring that'll get comments. 
                Includes the reaction shot."</p>
              </div>
              <p className="text-white/40 text-sm">...and 8 more suggestions, ranked by engagement potential</p>
            </div>
            <p>
              You preview each one. Keep 4. Trash the rest. 
              Those 4 get captions, thumbnails, and social posts generated automatically.
            </p>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Under the hood
          </h2>
          <p className="text-white/50">
            Not magic — pattern recognition at scale.
          </p>
        </motion.div>

        <div className="space-y-4">
          {[
            {
              icon: Volume2,
              title: "Transcribes everything",
              description: "Whisper converts your audio to text with word-level timestamps. We know exactly when each phrase starts and ends.",
            },
            {
              icon: Brain,
              title: "Finds natural boundaries",
              description: "Complete thoughts, finished stories, resolved questions. We don't cut mid-sentence or leave ideas hanging.",
            },
            {
              icon: MessageCircle,
              title: "Spots engaging moments",
              description: "Strong opinions. Emotional shifts. Surprising reveals. Clear advice. The stuff that holds attention in short-form.",
            },
            {
              icon: Layers,
              title: "Ranks by potential",
              description: "Not every moment is clip-worthy. We surface the best candidates first, but you see everything if you want.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex gap-5 p-5 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Works Great / Not Great */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20"
          >
            <h3 className="font-semibold text-green-400 mb-4">Best results with</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>→ Podcasts and interviews</li>
              <li>→ Educational talking-head content</li>
              <li>→ Webinars and presentations</li>
              <li>→ Commentary and reaction videos</li>
              <li>→ Anything with clear spoken dialogue</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20"
          >
            <h3 className="font-semibold text-orange-400 mb-4">Won't work well for</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>→ Music videos (duh)</li>
              <li>→ Mostly silent footage</li>
              <li>→ Heavy background noise</li>
              <li>→ Non-English content (improving)</li>
              <li>→ Visual-first content like cooking demos</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Clips are just the start
          </h2>
          <p className="text-white/60 leading-relaxed mb-4">
            Once you've picked your clips, the same transcript powers everything else:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              "Captions already synced to the audio",
              "Social posts written from the content",
              "Thumbnails with your AI persona",
              "One-click scheduling across platforms",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-white/50">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* You're Still In Control */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            You're the editor, not the AI
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Clock,
              title: "Set target lengths",
              description: "30 sec for TikTok, 60 for Reels, 90 for YouTube Shorts",
            },
            {
              icon: Target,
              title: "Adjust any boundary",
              description: "Extend 3 seconds here, trim the intro there",
            },
            {
              icon: Settings,
              title: "Save preferences",
              description: "Prioritize certain topics or formats next time",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <item.icon className="h-6 w-6 text-primary/70 mb-3" />
              <h3 className="font-medium text-white text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-white/50">{item.description}</p>
            </motion.div>
          ))}
        </div>
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
            Try it on something you've already recorded
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Upload a video. See what clips it finds. Keep what works. 
            No commitment.
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
