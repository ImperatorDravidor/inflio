"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Image,
  AlertTriangle,
  Check,
  X,
} from "lucide-react"

export default function ThumbnailsPage() {
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
            <Image className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Content Creation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Your face in every thumbnail (without a photoshoot)
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            Faces get clicks. Your face builds recognition. But you can't do a new photo session 
            for every video. Train your AI persona once, then generate thumbnails featuring "you" 
            whenever you need them.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Prerequisite */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-primary/5 border border-primary/20"
        >
          <p className="text-white/70 text-sm leading-relaxed">
            <span className="text-white font-medium">Requires persona training first.</span>{" "}
            This feature generates images using your trained AI likeness. If you haven't 
            uploaded photos and trained your persona yet,{" "}
            <Link href="/features/avatar-training" className="text-primary hover:underline">
              start there →
            </Link>
          </p>
        </motion.div>
      </section>

      {/* Example Prompts */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-2">
            How prompts work
          </h2>
          <p className="text-white/50 text-sm">
            You describe the vibe, we generate options.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20"
          >
            <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
              <Check className="h-4 w-4" /> Good prompts
            </h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <span className="text-white/80">"Surprised expression, looking at phone, clean background"</span>
                <span className="block text-xs text-white/40 mt-1">Clear, specific, achievable</span>
              </li>
              <li>
                <span className="text-white/80">"Professional headshot, slight smile, navy blue background"</span>
                <span className="block text-xs text-white/40 mt-1">Simple pose, clear context</span>
              </li>
              <li>
                <span className="text-white/80">"Excited, pointing at something off-screen, bright lighting"</span>
                <span className="block text-xs text-white/40 mt-1">Expression + gesture + lighting</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20"
          >
            <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
              <X className="h-4 w-4" /> Prompts that struggle
            </h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <span className="text-white/80">"Me fighting a dragon on a mountain"</span>
                <span className="block text-xs text-white/40 mt-1">Too complex, face will drift</span>
              </li>
              <li>
                <span className="text-white/80">"Close-up of hands typing on laptop"</span>
                <span className="block text-xs text-white/40 mt-1">AI hands are still unreliable</span>
              </li>
              <li>
                <span className="text-white/80">"Me with 5 other people in a meeting"</span>
                <span className="block text-xs text-white/40 mt-1">Multiple faces = chaos</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* What You Control */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Beyond the face
          </h2>
          <div className="space-y-4 text-white/60 leading-relaxed">
            <p>
              Thumbnails aren't just about the photo. After generation, you can:
            </p>
            <ul className="space-y-2 ml-4 text-sm">
              <li>• <span className="text-white">Add text overlays</span> — headlines in your brand fonts, positioned for readability</li>
              <li>• <span className="text-white">Apply brand colors</span> — automatic if you've set them up, or pick custom</li>
              <li>• <span className="text-white">Swap backgrounds</span> — solid, gradient, or generate a contextual one</li>
              <li>• <span className="text-white">Add visual elements</span> — arrows, circles, emoji, basic graphics</li>
            </ul>
            <p>
              It's not Photoshop. But for "scroll-stopping thumbnail in 2 minutes," it's often enough.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Reality Check */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-orange-400 mb-3">
                The honest truth about AI faces
              </h2>
              <div className="space-y-3 text-white/60 leading-relaxed text-sm">
                <p>
                  AI face generation is good, not perfect. Expect to see:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• Your face looking slightly "off" in some generations</li>
                  <li>• Weird hands if they're in frame (AI's achilles heel)</li>
                  <li>• Inconsistency between generations</li>
                  <li>• Occasional artifacts in complex scenes</li>
                </ul>
                <p>
                  The workflow is: generate 4-5 options, pick 1-2 that work, discard the rest. 
                  For most creators, getting 2 usable thumbnails in 3 minutes beats spending an hour 
                  in Photoshop or scheduling a photoshoot.
                </p>
                <p>
                  If every thumbnail needs to be perfect, you still need a designer. 
                  If "good enough, fast" is acceptable, this works.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Consistency Benefit */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            The real benefit: consistency
          </h2>
          <p className="text-white/60 leading-relaxed">
            When every thumbnail uses the same trained persona and brand colors, your content 
            starts looking cohesive. Someone scrolling recognizes your style before reading the title. 
            That recognition compounds over time. It's hard to maintain manually — you'd need the same 
            photos, same editing approach, same colors every time. Automated, it just happens.
          </p>
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
            See what your thumbnails could look like
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Train your persona first. Then try generating some thumbnails. 
            Decide if the output works for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features/avatar-training">
              <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                Train your persona first
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
