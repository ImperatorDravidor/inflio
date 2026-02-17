"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  HelpCircle,
  MessageSquare,
  Mail,
  ChevronDown,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react"

const faqs = [
  {
    question: "How many videos can I process on the free plan?",
    answer: "The free plan includes 25 video uploads per month. Each upload counts as one credit regardless of video length (up to 30 minutes on free, 2 hours on paid plans).",
  },
  {
    question: "What video formats are supported?",
    answer: "We support MP4, MOV, AVI, MKV, and WebM files up to 2GB. You can also paste YouTube URLs directly — we'll handle the rest.",
  },
  {
    question: "How long does processing take?",
    answer: "Most videos are fully processed in 20-30 minutes, depending on length. You'll get transcription, clips, blog posts, social captions, and thumbnails all at once.",
  },
  {
    question: "How accurate is the transcription?",
    answer: "We use state-of-the-art speech recognition with 99%+ accuracy for clear audio. We support 50+ languages with automatic language detection.",
  },
  {
    question: "How does AI Persona work?",
    answer: "Upload 5-10 photos of yourself and we train a custom model on your likeness. Then generate thumbnails featuring 'you' in any scenario while maintaining brand consistency. Available on Creator plan and above.",
  },
  {
    question: "Which platforms can I publish to?",
    answer: "YouTube (including Shorts), TikTok, Instagram (Reels, Feed, Stories), LinkedIn, X/Twitter, Facebook, Medium, Twitch, and more. We optimize content format for each platform automatically.",
  },
  {
    question: "Can I edit the generated content?",
    answer: "Yes, everything is editable. Review and tweak transcripts, captions, blog posts, and more before publishing. You have full control.",
  },
  {
    question: "Do you use my content to train AI?",
    answer: "No. Your videos and generated content are never used to train our AI models. Your content is processed in real-time and stored only for your personal use.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, no contracts or commitments. Cancel from your dashboard anytime and keep access until the end of your billing period. We also offer a 14-day money-back guarantee.",
  },
  {
    question: "What if I need more than the Studio plan?",
    answer: "Contact us at sales@inflio.com for custom enterprise pricing with dedicated support, custom integrations, and volume discounts.",
  },
]

const contactOptions = [
  {
    title: "Email Support",
    description: "Get help from our team",
    detail: "support@inflio.com",
    response: "Usually within 24 hours",
    icon: Mail,
    href: "mailto:support@inflio.com",
  },
  {
    title: "Live Chat",
    description: "For quick questions",
    detail: "Available in-app",
    response: "Mon-Fri, 9am-6pm PT",
    icon: MessageSquare,
    href: "/dashboard",
  },
]

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-white/[0.06] mx-auto mb-5">
            <HelpCircle className="h-6 w-6 text-white/80" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
            Help Center
          </h1>
          <p className="text-white/40 max-w-lg mx-auto leading-relaxed">
            Find answers to common questions or get in touch with our team.
          </p>
        </motion.div>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid sm:grid-cols-2 gap-4 mb-14"
        >
          {contactOptions.map((option, index) => (
            <motion.a
              key={option.title}
              href={option.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              className="group p-5 rounded-xl bg-white/[0.015] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-violet-500/15 to-violet-500/5 border border-white/[0.06] group-hover:scale-105 transition-transform duration-300">
                  <option.icon className="h-5 w-5 text-white/70" />
                </div>
                <div>
                  <h3 className="font-medium text-white/90 text-sm">{option.title}</h3>
                  <p className="text-xs text-white/35">{option.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary/80">{option.detail}</span>
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Clock className="h-3 w-3" />
                  {option.response}
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-sm font-medium text-primary/70 tracking-wide uppercase mb-4">
            FAQ
          </p>
          <h2 className="text-lg font-semibold text-white/90 mb-5">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                viewport={{ once: true }}
                className="rounded-xl bg-white/[0.015] border border-white/[0.06] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors duration-200"
                >
                  <span className="font-medium text-white/80 text-sm pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/30 shrink-0 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm text-white/40 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Still Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-10 rounded-2xl bg-gradient-to-br from-primary/[0.04] via-purple-500/[0.03] to-pink-500/[0.03] border border-white/[0.06] text-center"
        >
          <Sparkles className="h-8 w-8 text-primary/70 mx-auto mb-5" />
          <h2 className="text-xl font-bold text-white mb-3">Still have questions?</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto mb-6 leading-relaxed">
            Can&apos;t find what you&apos;re looking for? Our team is happy to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:support@inflio.com">
              <Button className="group gap-2 bg-white text-black hover:bg-white/90 rounded-xl h-11 px-6 font-medium">
                <Mail className="h-4 w-4" />
                Contact support
              </Button>
            </a>
            <Link href="/contact">
              <Button variant="ghost" className="border border-white/[0.06] text-white/70 hover:bg-white/[0.04] rounded-xl h-11 px-6">
                General inquiries
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <a
            href="https://status.inflio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            All systems operational
            <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
