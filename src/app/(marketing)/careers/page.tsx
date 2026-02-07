"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
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
    gradient: "from-pink-500/15 to-pink-500/5",
  },
  {
    title: "Ship fast, learn faster",
    description: "We deploy multiple times a day. Real feedback beats endless planning.",
    icon: Zap,
    gradient: "from-amber-500/15 to-amber-500/5",
  },
  {
    title: "Remote-first",
    description: "Work from anywhere. We care about output, not office hours.",
    icon: Globe,
    gradient: "from-sky-500/15 to-sky-500/5",
  },
  {
    title: "Small team, big impact",
    description: "Every person shapes the product. No layers, no politics.",
    icon: Users,
    gradient: "from-emerald-500/15 to-emerald-500/5",
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
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            Careers
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 text-white">
            Build the future of{" "}
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent">
              content creation
            </span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            We&apos;re a small team working on hard problems at the intersection of
            AI, video, and creator tools.
          </p>
        </motion.div>

        {/* How We Work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-sm font-medium text-primary/70 tracking-wide uppercase mb-4">
            Culture
          </p>
          <h2 className="text-xl font-bold text-white mb-6">How we work</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-white/[0.015] border border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b ${value.gradient} border border-white/[0.06] mb-4`}>
                  <value.icon className="h-5 w-5 text-white/70" />
                </div>
                <h3 className="font-medium text-white/90 mb-1.5">{value.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{value.description}</p>
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
          className="mb-20"
        >
          <p className="text-sm font-medium text-primary/70 tracking-wide uppercase mb-4">
            Open Roles
          </p>
          <h2 className="text-xl font-bold text-white mb-4">Who we&apos;re looking for</h2>
          <p className="text-white/40 mb-6 leading-relaxed">
            We don&apos;t have a formal job board yet, but we&apos;re always interested in
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
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]"
              >
                <Sparkles className="h-4 w-4 text-primary/70 shrink-0" />
                <span className="text-sm text-white/60">{item}</span>
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
          className="mb-20"
        >
          <div className="p-6 rounded-xl bg-white/[0.015] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="h-5 w-5 text-primary/70" />
              <h3 className="font-medium text-white/90">Location</h3>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              We&apos;re remote-first with optional co-working in San Francisco.
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
          className="p-10 rounded-2xl bg-gradient-to-br from-primary/[0.04] via-purple-500/[0.03] to-pink-500/[0.03] border border-white/[0.06] text-center"
        >
          <Users className="h-10 w-10 text-primary/70 mx-auto mb-5" />
          <h2 className="text-xl font-bold text-white mb-3">Interested?</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto mb-7 leading-relaxed">
            Send us an email with what you&apos;re working on and why Inflio interests you.
            No formal resume required — show us your work.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:careers@inflio.com">
              <Button className="group gap-2 bg-white text-black hover:bg-white/90 rounded-xl h-11 px-6 font-medium">
                <Mail className="h-4 w-4" />
                careers@inflio.com
              </Button>
            </a>
            <a
              href="https://linkedin.com/company/inflio"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" className="gap-2 border border-white/[0.06] text-white/70 hover:bg-white/[0.04] rounded-xl h-11 px-6">
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
