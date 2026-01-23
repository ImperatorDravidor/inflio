"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  AlertTriangle,
} from "lucide-react"

export default function AnalyticsPage() {
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
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Publishing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Did that clip actually work?
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            You posted the same clip to 5 platforms. Checking each native dashboard is tedious. 
            We pull the data together so you can compare performance in one place.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* What We Track */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            What you can see
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: Eye,
              title: "Views & impressions",
              description: "How many people saw it. Definition varies by platform but we show what's available.",
            },
            {
              icon: TrendingUp,
              title: "Engagement",
              description: "Likes, comments, shares, saves. The signals that people actually cared.",
            },
            {
              icon: Users,
              title: "Follower changes",
              description: "Growth or loss over time. See if specific content drove follows.",
            },
            {
              icon: BarChart3,
              title: "Cross-platform comparison",
              description: "Same clip, different platforms. Which performed better where?",
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

      {/* What It Answers */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Questions this can answer
          </h2>
          <ul className="space-y-3 text-white/60 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span>Which of my clips actually got traction vs. flopped?</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span>Should I focus more on TikTok or Instagram for this type of content?</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span>Is my consistent posting leading to follower growth or staying flat?</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span>What do my best-performing posts have in common?</span>
            </li>
          </ul>
        </motion.div>
      </section>

      {/* Limitations */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-orange-400 mb-3">
                Not a replacement for native analytics
              </h2>
              <div className="text-white/60 text-sm space-y-3 leading-relaxed">
                <p>
                  Platform APIs give us limited data. For deep analytics — audience demographics, 
                  watch time curves, traffic sources — you still need YouTube Studio, Instagram 
                  Insights, etc.
                </p>
                <p>
                  Think of this as a convenient summary layer for quick comparisons, not a full 
                  analytics suite. Good for "did this work?" Less good for "why exactly did it work?"
                </p>
              </div>
            </div>
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
          className="text-center p-10 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            See your content performance
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Connect your accounts, publish through Inflio, see results in one dashboard.
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
