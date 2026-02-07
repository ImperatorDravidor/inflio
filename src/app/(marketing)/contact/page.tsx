"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import {
  Mail,
  MessageSquare,
  Send,
  Check,
  ArrowRight,
  HelpCircle,
} from "lucide-react"
import {
  IconBrandX,
  IconBrandLinkedin,
} from "@tabler/icons-react"

const contactReasons = [
  { value: "general", label: "General inquiry" },
  { value: "sales", label: "Sales / Enterprise" },
  { value: "support", label: "Technical support" },
  { value: "partnerships", label: "Partnerships" },
  { value: "press", label: "Press / Media" },
]

const quickLinks = [
  {
    title: "Support",
    description: "Get help with your account",
    href: "/support",
    icon: HelpCircle,
  },
  {
    title: "Sales",
    description: "Enterprise and custom plans",
    href: "mailto:sales@inflio.com",
    icon: MessageSquare,
  },
]

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    reason: "general",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            Contact
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
            Get in touch
          </h1>
          <p className="text-white/40 leading-relaxed">
            Have a question or want to learn more? We&apos;d love to hear from you.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid sm:grid-cols-2 gap-3 mb-10"
        >
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.015] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-violet-500/15 to-violet-500/5 border border-white/[0.06] group-hover:scale-105 transition-transform duration-300">
                <link.icon className="h-5 w-5 text-white/70" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white/90 text-sm">{link.title}</h3>
                <p className="text-xs text-white/35">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
            </Link>
          ))}
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-7 rounded-2xl bg-white/[0.015] border border-white/[0.06]">
            <h2 className="text-lg font-semibold text-white/90 mb-1">Send a message</h2>
            <p className="text-sm text-white/35 mb-6">
              We typically respond within one business day.
            </p>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-4">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white/90 mb-1">Message sent</h3>
                <p className="text-sm text-white/40 mb-5">
                  Thanks for reaching out. We&apos;ll get back to you soon.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSubmitted(false)
                    setFormState({ name: "", email: "", reason: "general", message: "" })
                  }}
                  className="border border-white/[0.06] text-white/60 hover:bg-white/[0.04] rounded-lg"
                >
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/60 mb-1.5">
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      required
                      className="h-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/40 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/60 mb-1.5">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      required
                      className="h-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/40 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-white/60 mb-1.5">
                    What&apos;s this about?
                  </label>
                  <select
                    id="reason"
                    value={formState.reason}
                    onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-white focus:outline-none focus:border-primary/40"
                  >
                    {contactReasons.map((reason) => (
                      <option key={reason.value} value={reason.value} className="bg-[#0a0a0a]">
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/60 mb-1.5">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="How can we help?"
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    required
                    rows={4}
                    className="resize-none bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/40 rounded-lg"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gap-2 bg-white text-black hover:bg-white/90 rounded-xl font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send message
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Direct Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 p-6 rounded-xl bg-white/[0.015] border border-white/[0.06]"
        >
          <h3 className="font-medium text-white/80 text-sm mb-3">Prefer email?</h3>
          <div className="space-y-2 text-sm">
            <p className="text-white/40">
              <span className="text-white/60">General:</span>{" "}
              <a href="mailto:hello@inflio.com" className="text-primary/80 hover:text-primary hover:underline transition-colors">hello@inflio.com</a>
            </p>
            <p className="text-white/40">
              <span className="text-white/60">Support:</span>{" "}
              <a href="mailto:support@inflio.com" className="text-primary/80 hover:text-primary hover:underline transition-colors">support@inflio.com</a>
            </p>
            <p className="text-white/40">
              <span className="text-white/60">Sales:</span>{" "}
              <a href="mailto:sales@inflio.com" className="text-primary/80 hover:text-primary hover:underline transition-colors">sales@inflio.com</a>
            </p>
          </div>
        </motion.div>

        {/* Social */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <span className="text-xs text-white/30">Follow us:</span>
          <a
            href="https://x.com/inflioai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all duration-200"
          >
            <IconBrandX className="h-4 w-4" />
          </a>
          <a
            href="https://linkedin.com/company/inflio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all duration-200"
          >
            <IconBrandLinkedin className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
