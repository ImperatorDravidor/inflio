"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Clock, Headphones } from "lucide-react"

const trustItems = [
  {
    title: "Enterprise Security",
    description: "SOC 2 Type II compliant. AES-256 encryption at rest, TLS 1.3 in transit.",
    icon: Shield,
  },
  {
    title: "Data Privacy",
    description: "GDPR & CCPA compliant. Your content is never used to train our models.",
    icon: Lock,
  },
  {
    title: "99.9% Uptime",
    description: "Built on AWS and Google Cloud. Multi-region redundancy.",
    icon: Clock,
  },
  {
    title: "Human Support",
    description: "Real people, not bots. Average response time under 4 hours.",
    icon: Headphones,
  },
]

export function TrustSection() {
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 mx-auto mb-4">
                <item.icon className="h-6 w-6 text-white/60" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
