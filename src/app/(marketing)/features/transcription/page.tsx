"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Mic,
  Globe,
  Clock,
  FileText,
  Download,
} from "lucide-react"

export default function TranscriptionPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <Mic className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Video Processing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Transcription that handles your mumbling
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            OpenAI's Whisper model powers everything. It handles accents, crosstalk, 
            technical jargon, and background noise better than alternatives we've tested. 
            And every other feature depends on this transcript being right.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Why It Matters */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Why transcription quality is non-negotiable
          </h2>
          <div className="space-y-4 text-white/60 leading-relaxed">
            <p>
              The transcript isn't just a text file. It's the foundation for:
            </p>
            <ul className="space-y-2 ml-4 text-sm">
              <li>• <span className="text-white">Clip detection</span> — finding where to cut based on what was said</li>
              <li>• <span className="text-white">Subtitles</span> — word-by-word captions with precise timing</li>
              <li>• <span className="text-white">Social posts</span> — pulling quotes and key points</li>
              <li>• <span className="text-white">Blog content</span> — restructuring what you said into written form</li>
            </ul>
            <p>
              Garbage transcription cascades into garbage everything else. 
              So we use the best model available and don't cut corners.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Technical Details */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            The technical bits
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: Mic,
              title: "Whisper Large V3",
              description: "OpenAI's most accurate model. Trained on 680,000+ hours of multilingual audio.",
            },
            {
              icon: Clock,
              title: "Word-level timestamps",
              description: "Every word timestamped precisely. Makes animated captions and clips possible.",
            },
            {
              icon: Globe,
              title: "50+ languages",
              description: "Auto-detects language. Best results with English, Spanish, French, German, Japanese.",
            },
            {
              icon: FileText,
              title: "Speaker detection",
              description: "Labels different speakers throughout. Essential for interviews and podcasts.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <item.icon className="h-6 w-6 text-primary/70 mb-3" />
              <h3 className="font-medium text-white text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-white/50">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Accuracy Caveat */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <h3 className="font-semibold text-orange-400 mb-3">It's not perfect</h3>
          <div className="text-white/60 text-sm space-y-2 leading-relaxed">
            <p>Whisper is the best we've found, but you'll still see errors with:</p>
            <ul className="ml-4 space-y-1">
              <li>• Uncommon proper nouns and brand names</li>
              <li>• Heavy background music or noise</li>
              <li>• Multiple people talking over each other</li>
              <li>• Very fast speech or strong regional accents</li>
            </ul>
            <p>We recommend reviewing transcripts for important content. Editing tools make corrections quick.</p>
          </div>
        </motion.div>
      </section>

      {/* Export */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <div className="flex items-start gap-4">
            <Download className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-2">Export formats</h3>
              <p className="text-sm text-white/50">
                SRT, VTT (for video platforms), plain text (for blog/docs), 
                or JSON with timestamps (for custom integrations).
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Test it on your audio
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Upload a video. Check the transcript quality. Everything else builds from there.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                See all features
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
