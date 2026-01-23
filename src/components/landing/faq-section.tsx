"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "How long does it take to process a video?",
    a: "Most videos are fully processed in 20-30 minutes, depending on length. You'll get transcription, clips, blog posts, social captions, and thumbnails all at once.",
  },
  {
    q: "What video formats do you support?",
    a: "We support all major formats: MP4, MOV, AVI, MKV, WebM. Videos can be up to 2GB. You can also paste a YouTube URL directly.",
  },
  {
    q: "How accurate is the transcription?",
    a: "We use OpenAI's Whisper model, which achieves 99% accuracy in English and supports 50+ languages. It handles accents and technical terms well.",
  },
  {
    q: "How does AI Persona training work?",
    a: "Upload 5-10 photos of yourself, and our AI trains a model on your likeness. You can then generate thumbnails featuring 'you' in any scenario.",
  },
  {
    q: "Will the content sound like me?",
    a: "Yes. Inflio learns your brand voice during onboarding by analyzing your existing content. Every piece is generated in your style, not generic AI-speak.",
  },
  {
    q: "Which platforms can I publish to?",
    a: "Currently 13 platforms: YouTube, TikTok, Instagram (Reels, Stories, Feed), LinkedIn, X, Facebook, Medium, Substack, Vimeo, Twitch, WordPress, Pinterest, and Threads.",
  },
  {
    q: "Is there a free plan?",
    a: "We offer a 14-day money-back guarantee on all plans. If Inflio isn't right for you, just email us within 14 days for a full refund.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, no contracts. Cancel anytime from your dashboard. You keep access until the end of your billing period. We also offer a 30-day money-back guarantee.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Questions? Answered.
          </h2>
          <p className="text-muted-foreground">
            Can't find what you're looking for?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-white/40 shrink-0 transition-transform duration-200 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="mt-4 text-sm text-muted-foreground pr-8">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
