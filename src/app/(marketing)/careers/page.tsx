"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Mail,
  Heart,
  Zap,
  Globe,
  Users,
  Sparkles,
  MapPin,
} from "lucide-react"
import {
  IconBrandLinkedin,
} from "@tabler/icons-react"

const values = [
  {
    title: "Creator-obsessed",
    description: "We use Inflio ourselves. Every feature starts with real creator pain points.",
    icon: Heart,
  },
  {
    title: "Ship fast, learn faster",
    description: "We deploy multiple times a day. Real feedback beats endless planning.",
    icon: Zap,
  },
  {
    title: "Remote-first",
    description: "Work from anywhere. We care about output, not office hours.",
    icon: Globe,
  },
  {
    title: "Small team, big impact",
    description: "Every person shapes the product. No layers, no politics.",
    icon: Users,
  },
]

const whatWereLookingFor = [
  "Engineers who ship (full-stack, AI/ML, infrastructure)",
  "Designers who obsess over details",
  "Marketers who understand creators",
  "Support people who actually care",
]

export default function CareersPage() {
  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
            Build the future of{" "}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              content creation
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            We're a small team working on hard problems at the intersection of 
            AI, video, and creator tools.
          </p>
        </motion.div>

        {/* How We Work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-xl font-bold text-white mb-6">How we work</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-white mb-1">{value.title}</h3>
                <p className="text-sm text-white/50">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* What We're Looking For */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-xl font-bold text-white mb-4">Who we're looking for</h2>
          <p className="text-white/50 mb-6">
            We don't have a formal job board yet, but we're always interested in 
            meeting talented people who want to work on creator tools.
          </p>
          <div className="space-y-2">
            {whatWereLookingFor.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-white/70">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-white">Location</h3>
            </div>
            <p className="text-sm text-white/50">
              We're remote-first with optional co-working in San Francisco. 
              We hire globally but have a preference for US/EU timezones for 
              easier collaboration.
            </p>
          </div>
        </motion.div>

        {/* Get In Touch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-white/10 text-center"
        >
          <Users className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Interested?</h2>
          <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
            Send us an email with what you're working on and why Inflio interests you. 
            No formal resume required — show us your work.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:careers@inflio.com">
              <Button className="gap-2 bg-white text-black hover:bg-white/90">
                <Mail className="h-4 w-4" />
                careers@inflio.com
              </Button>
            </a>
            <a
              href="https://linkedin.com/company/inflio"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2 border-white/10 text-white hover:bg-white/5">
                <IconBrandLinkedin className="h-4 w-4" />
                Follow on LinkedIn
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
