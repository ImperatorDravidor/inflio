"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Palette,
  Type,
  PenTool,
} from "lucide-react"

export default function BrandIdentityPage() {
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
            <Palette className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">AI Persona</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Configure once. Never think about it again.
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            Your brand colors, fonts, and voice preferences get baked into everything we generate. 
            Captions, thumbnails, social posts — all match your brand automatically without 
            configuring each piece.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* What You Set */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            What you configure
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Palette,
              title: "Colors",
              items: ["Primary brand color", "Secondary/accent", "Background options", "Text colors"],
              note: "Upload your logo to auto-extract palette",
            },
            {
              icon: Type,
              title: "Typography",
              items: ["Headline font", "Body font", "Caption font", "Custom font uploads"],
              note: "Or choose from our library",
            },
            {
              icon: PenTool,
              title: "Voice",
              items: ["Formal vs casual", "Emoji preferences", "Common phrases", "Words to avoid"],
              note: "Guides AI-generated copy",
            },
          ].map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <section.icon className="h-6 w-6 text-primary/70 mb-3" />
              <h3 className="font-medium text-white mb-3">{section.title}</h3>
              <ul className="space-y-1.5 mb-3">
                {section.items.map((item) => (
                  <li key={item} className="text-xs text-white/50">{item}</li>
                ))}
              </ul>
              <p className="text-[10px] text-white/30">{section.note}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Where It Applies */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Where settings apply
          </h2>
          <div className="space-y-3 text-sm">
            {[
              { feature: "Captions/Subtitles", how: "Font, colors, highlight style" },
              { feature: "Thumbnails", how: "Color palette, text styling, overlays" },
              { feature: "Social posts", how: "Tone, emoji usage, writing style" },
              { feature: "Blog content", how: "Voice preferences, formatting" },
            ].map((item) => (
              <div key={item.feature} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-white">{item.feature}</span>
                <span className="text-white/40 text-xs">{item.how}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Multiple Brands */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            For agencies & multi-brand creators
          </h2>
          <p className="text-white/60 leading-relaxed">
            Create separate brand profiles for different clients or channels. Switch between them 
            when generating content. No more accidentally using Client A's colors on Client B's thumbnails.
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
            Set up your brand
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            15 minutes of setup. Forever consistent output.
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
