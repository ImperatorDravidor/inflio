"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Eye,
  Bot,
  Palette,
  Layers,
} from "lucide-react"

export default function ConsistentVisualsPage() {
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
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">AI Persona</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Recognizable before they read your name
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            Same face. Same colors. Same typography. When someone scrolls past your content, 
            they should know it's yours instantly. That recognition builds over hundreds of posts. 
            Consistency is what makes it happen.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Three Layers */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Three systems keeping you consistent
          </h2>
        </motion.div>

        <div className="space-y-4">
          {[
            {
              icon: Bot,
              title: "Your trained persona",
              description: "Thumbnails and graphics use your AI likeness. Same face across all content, automatically.",
              link: { text: "Train your persona", href: "/features/avatar-training" },
            },
            {
              icon: Palette,
              title: "Your brand settings",
              description: "Colors and fonts apply to captions, thumbnails, everything visual. Set once, never configure again.",
              link: { text: "Set up brand", href: "/features/brand-identity" },
            },
            {
              icon: Layers,
              title: "Saved presets",
              description: "Caption styles, thumbnail layouts, voice settings. Save what works, apply with one click.",
              link: null,
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
                {item.link && (
                  <Link href={item.link.href} className="text-sm text-primary hover:underline mt-1 inline-block">
                    {item.link.text} →
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why It Matters */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            The compounding effect
          </h2>
          <div className="space-y-4 text-white/60 leading-relaxed">
            <p>
              No single thumbnail matters that much. But multiply by hundreds of posts over a year. 
              Consistency becomes identity.
            </p>
            <p>
              The problem is manual consistency is tedious. Different photoshoots. Different editors. 
              Slight color drift. Inconsistent caption styles. It's hard to maintain when you're 
              cranking out content.
            </p>
            <p>
              Automating it means consistency is the default, not something you have to actively maintain.
            </p>
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
          className="text-center p-10 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Build your visual identity
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Train your persona. Set up your brand. Let consistency happen automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features/avatar-training">
              <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                Start with persona training
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
