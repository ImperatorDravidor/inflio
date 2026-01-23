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
  ArrowRight,
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
    answer: "Yes, no contracts or commitments. Cancel from your dashboard anytime and keep access until the end of your billing period. We also offer a 30-day money-back guarantee.",
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
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
            Help Center
          </h1>
          <p className="text-white/50 max-w-lg mx-auto">
            Find answers to common questions or get in touch with our team.
          </p>
        </motion.div>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid sm:grid-cols-2 gap-4 mb-12"
        >
          {contactOptions.map((option, index) => (
            <motion.a
              key={option.title}
              href={option.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              className="group p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <option.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">{option.title}</h3>
                  <p className="text-xs text-white/40">{option.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{option.detail}</span>
                <span className="flex items-center gap-1 text-xs text-white/40">
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
          className="mb-12"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                viewport={{ once: true }}
                className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-white text-sm pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/40 shrink-0 transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-4 pb-4"
                  >
                    <p className="text-sm text-white/50 leading-relaxed">{faq.answer}</p>
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
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-white/10 text-center"
        >
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Still have questions?</h2>
          <p className="text-sm text-white/50 max-w-md mx-auto mb-5">
            Can't find what you're looking for? Our team is happy to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:support@inflio.com">
              <Button className="gap-2 bg-white text-black hover:bg-white/90">
                <Mail className="h-4 w-4" />
                Contact support
              </Button>
            </a>
            <Link href="/contact">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
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
            className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"
          >
            <span className="flex h-2 w-2 rounded-full bg-green-400" />
            All systems operational
            <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
