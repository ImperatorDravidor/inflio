"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

const comparisons = [
  { feature: "Full video-to-content pipeline", inflio: true, others: false },
  { feature: "AI Persona training", inflio: true, others: false },
  { feature: "Brand voice learning", inflio: true, others: false },
  { feature: "13 platform publishing", inflio: true, others: false },
  { feature: "Blog generation", inflio: true, others: false },
  { feature: "Thumbnail generation", inflio: true, others: false },
  { feature: "Free tier available", inflio: true, others: true },
]

const differentiators = [
  {
    title: "AI Persona",
    description: "Train a model on your face. Generate thumbnails and graphics featuring you, consistently.",
  },
  {
    title: "True All-in-One",
    description: "Clips, blogs, social posts, thumbnails, scheduling — one platform, not five.",
  },
  {
    title: "Brand DNA",
    description: "We learn your voice, colors, and style. Everything generated feels authentically you.",
  },
]

export function WhyInflioSection() {
  return (
    <section className="py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Why Inflio?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Others give you clips. We give you a complete content strategy.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Differentiators */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {differentiators.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <h3 className="text-lg font-semibold mb-2 text-primary">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/5 overflow-hidden"
          >
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/[0.03] border-b border-white/5">
              <div className="text-sm font-medium text-white/40">Feature</div>
              <div className="text-sm font-medium text-center">Inflio</div>
              <div className="text-sm font-medium text-center text-white/40">Others</div>
            </div>

            {/* Rows */}
            {comparisons.map((row, index) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="grid grid-cols-3 gap-4 p-4 border-b border-white/5 last:border-0"
              >
                <div className="text-sm text-muted-foreground">{row.feature}</div>
                <div className="text-center">
                  {row.inflio ? (
                    <Check className="h-5 w-5 text-green-400 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-white/20 mx-auto" />
                  )}
                </div>
                <div className="text-center">
                  {row.others ? (
                    <Check className="h-5 w-5 text-white/40 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-white/20 mx-auto" />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
