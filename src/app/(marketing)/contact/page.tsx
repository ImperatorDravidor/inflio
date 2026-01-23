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
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
            Get in touch
          </h1>
          <p className="text-white/50">
            Have a question or want to learn more? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid sm:grid-cols-2 gap-3 mb-10"
        >
          {quickLinks.map((link, index) => (
            <Link
              key={link.title}
              href={link.href}
              className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <link.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white text-sm">{link.title}</h3>
                <p className="text-xs text-white/40">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-1">Send a message</h2>
            <p className="text-sm text-white/40 mb-6">
              We typically respond within one business day.
            </p>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Message sent</h3>
                <p className="text-sm text-white/50 mb-4">
                  Thanks for reaching out. We'll get back to you soon.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSubmitted(false)
                    setFormState({ name: "", email: "", reason: "general", message: "" })
                  }}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1.5">
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      required
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      required
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-white/70 mb-1.5">
                    What's this about?
                  </label>
                  <select
                    id="reason"
                    value={formState.reason}
                    onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-primary/50"
                  >
                    {contactReasons.map((reason) => (
                      <option key={reason.value} value={reason.value} className="bg-[#0a0a0a]">
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-1.5">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="How can we help?"
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    required
                    rows={4}
                    className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 gap-2 bg-white text-black hover:bg-white/90"
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
          className="mt-8 p-5 rounded-xl bg-white/[0.02] border border-white/10"
        >
          <h3 className="font-medium text-white text-sm mb-3">Prefer email?</h3>
          <div className="space-y-2 text-sm">
            <p className="text-white/50">
              <span className="text-white/70">General:</span>{" "}
              <a href="mailto:hello@inflio.com" className="text-primary hover:underline">hello@inflio.com</a>
            </p>
            <p className="text-white/50">
              <span className="text-white/70">Support:</span>{" "}
              <a href="mailto:support@inflio.com" className="text-primary hover:underline">support@inflio.com</a>
            </p>
            <p className="text-white/50">
              <span className="text-white/70">Sales:</span>{" "}
              <a href="mailto:sales@inflio.com" className="text-primary hover:underline">sales@inflio.com</a>
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
          <span className="text-xs text-white/40">Follow us:</span>
          <a
            href="https://x.com/inflioai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <IconBrandX className="h-4 w-4" />
          </a>
          <a
            href="https://linkedin.com/company/inflio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <IconBrandLinkedin className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
