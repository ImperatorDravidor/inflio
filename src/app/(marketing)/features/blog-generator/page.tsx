"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react"

export default function BlogGeneratorPage() {
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
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Content Creation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            That video explanation? It's already a blog post.
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            You explained something on camera. That same explanation — restructured for reading — 
            is an article. We take your transcript and reshape it into proper written content. 
            A first draft, not a finished piece.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* What It Does */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Transcript → structured article
          </h2>
          <div className="space-y-4 text-white/60 leading-relaxed">
            <p>
              Spoken content is rambling. Written content needs structure. We:
            </p>
            <ul className="space-y-2 ml-4 text-sm">
              <li>• <span className="text-white">Reorganize</span> your points into logical sections with headings</li>
              <li>• <span className="text-white">Clean up</span> verbal tics, false starts, tangents that work when talking but not in text</li>
              <li>• <span className="text-white">Add structure</span> — H1/H2/H3 hierarchy, intro, conclusion, proper paragraphing</li>
              <li>• <span className="text-white">Suggest</span> SEO elements — meta description, natural keyword usage</li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* Expectations */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-orange-400 mb-3">
                This is a first draft
              </h2>
              <div className="space-y-3 text-white/60 leading-relaxed text-sm">
                <p>
                  AI-generated blog posts need editing. They're a starting point, not publish-ready.
                </p>
                <p>Things you'll typically want to fix:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Add specific examples or data that wasn't in the video</li>
                  <li>• Remove sections that don't work in written form</li>
                  <li>• Adjust tone to match how you actually write</li>
                  <li>• Fact-check technical claims</li>
                  <li>• Add internal links to other content</li>
                </ul>
                <p>
                  The value is skipping the blank page. Get 70% there in seconds, spend your 
                  time on the 30% that requires your brain.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Best Use Cases */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Works best with
          </h2>
          <ul className="space-y-3 text-white/60 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span><span className="text-white">Tutorials</span> — step-by-step explanations translate well to written guides</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span><span className="text-white">Expert interviews</span> — especially when the guest shares distinct insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span><span className="text-white">Educational content</span> — explanations, breakdowns, how-tos</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">→</span>
              <span><span className="text-white">Commentary/analysis</span> — opinions and takes on industry topics</span>
            </li>
          </ul>
          <p className="text-white/40 text-sm mt-4">
            Less suited for: vlogs, entertainment content, videos where the visual is the point.
          </p>
        </motion.div>
      </section>

      {/* Export */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h3 className="font-medium text-white mb-3">Export as</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-white/50">
            <div>
              <span className="text-white">Markdown</span>
              <p className="text-xs">Most CMS platforms, Notion, GitHub</p>
            </div>
            <div>
              <span className="text-white">HTML</span>
              <p className="text-xs">WordPress, custom sites</p>
            </div>
            <div>
              <span className="text-white">Plain text</span>
              <p className="text-xs">Google Docs, Word, anywhere</p>
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
            Turn a video into a draft
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Pick a video with substantial content. See what article it generates. 
            Decide if the draft is useful.
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
