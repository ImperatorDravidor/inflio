"use client"

import { motion } from "framer-motion"
import { Video, Building2, Briefcase } from "lucide-react"

const personas = [
  {
    title: "Creators",
    subtitle: "YouTubers, Podcasters, Influencers",
    description: "You create amazing long-form content but repurposing takes forever. Inflio turns your videos into a content empire without the burnout.",
    icon: Video,
    stats: "Save 40+ hours/month",
  },
  {
    title: "Agencies",
    subtitle: "Managing Multiple Clients",
    description: "Your clients expect more content, faster. Inflio lets you deliver 10x the output without 10x the team.",
    icon: Building2,
    stats: "Scale without hiring",
  },
  {
    title: "Brands",
    subtitle: "In-House Teams",
    description: "Your brand has a voice. Inflio learns it and maintains consistency across every piece of content.",
    icon: Briefcase,
    stats: "100% brand consistency",
  },
]

export function BuiltForSection() {
  return (
    <section className="py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Built for everyone who creates
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From solo creators to enterprise teams — Inflio scales with you.
          </p>
        </motion.div>

        {/* Personas */}
        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-colors"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                <persona.icon className="h-7 w-7" />
              </div>
              
              <h3 className="text-xl font-semibold mb-1">{persona.title}</h3>
              <p className="text-sm text-primary mb-4">{persona.subtitle}</p>
              
              <p className="text-muted-foreground mb-6">
                {persona.description}
              </p>
              
              <p className="text-sm font-medium text-green-400">
                {persona.stats}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
