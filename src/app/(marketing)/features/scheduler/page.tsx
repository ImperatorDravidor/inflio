"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Layers,
} from "lucide-react"

export default function SchedulerPage() {
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
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Publishing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Batch create Sunday. Drip out all week.
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            You have one afternoon to make content. Your audience is online every day. 
            Schedule posts across platforms so one productive session becomes a week of consistent presence.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Three ways to schedule
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-white text-sm">Pick a specific time</h3>
                <p className="text-sm text-white/50 mt-1">
                  "Post this to TikTok Tuesday at 6pm EST." Straightforward.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-white text-sm">Add to queue</h3>
                <p className="text-sm text-white/50 mt-1">
                  Set up recurring time slots (e.g., 9am and 7pm daily). 
                  New posts fill the next available slot automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-white text-sm">Drag on the calendar</h3>
                <p className="text-sm text-white/50 mt-1">
                  Visual calendar view. See everything scheduled. Drag to reschedule. 
                  Click to edit. Overview of your content pipeline.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Per-Platform */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Same clip, different times
          </h2>
          <p className="text-white/60 leading-relaxed">
            A clip can post to TikTok at 7pm and LinkedIn at 9am the next day. 
            Different audiences, different optimal times. Schedule each platform 
            independently from the same content.
          </p>
        </motion.div>
      </section>

      {/* On Optimal Times */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <h3 className="font-semibold text-orange-400 mb-3">On "optimal posting times"</h3>
          <p className="text-white/60 text-sm leading-relaxed">
            We can suggest times based on general research (TikTok evenings, LinkedIn mornings). 
            But honestly, "optimal times" vary by audience and niche. The suggestions are a 
            reasonable starting point if you have no idea. Your own data matters more than 
            any generic advice. Pay attention to what works for you.
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
            Plan your content calendar
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Create when you have time. Post when your audience is watching.
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
