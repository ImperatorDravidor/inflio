"use client"

import { motion } from "framer-motion"
import {
  Upload,
  Wand2,
  Eye,
  Send,
} from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Drag and drop your video or paste a YouTube link. We support all major formats up to 2GB.",
    icon: Upload,
  },
  {
    number: "02",
    title: "Process",
    description: "Our AI transcribes, identifies key moments, and generates clips, blogs, and social posts.",
    icon: Wand2,
  },
  {
    number: "03",
    title: "Review",
    description: "Preview everything before publishing. Edit, refine, or approve with one click.",
    icon: Eye,
  },
  {
    number: "04",
    title: "Publish",
    description: "Schedule or publish instantly to all 13 platforms. Each optimized automatically.",
    icon: Send,
  },
]

export function HowItWorksSection() {
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
            Four steps.{" "}
            <span className="text-white/40">Ten minutes.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From raw video to published content across every platform.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -translate-x-8" />
              )}
              
              <div className="text-center">
                {/* Icon */}
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 mx-auto mb-6">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                
                {/* Number */}
                <p className="text-xs text-primary font-medium mb-2">{step.number}</p>
                
                {/* Title */}
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                
                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Time Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground">
            Total time from upload to publish:{" "}
            <span className="text-primary font-semibold">~30 minutes</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
