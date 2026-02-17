"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Bot,
  Upload,
  Clock,
  Shield,
  Camera,
  AlertTriangle,
  Check,
  X,
} from "lucide-react"

export default function AvatarTrainingPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">Foundation Feature</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Train AI on your face
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            Upload 10-20 photos. We fine-tune an image model on your appearance. 
            Then you can generate new images of "you" for thumbnails, graphics, whatever — 
            without scheduling another photoshoot.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* What You Actually Do */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            The process, step by step
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium">1</div>
              <div>
                <h3 className="font-medium text-white">Upload 10-20 photos of your face</h3>
                <p className="text-sm text-white/50 mt-1">
                  Different angles, different expressions. Good lighting. Recent photos that look like 
                  how you want to appear. We'll tell you if any need replacing.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium">2</div>
              <div>
                <h3 className="font-medium text-white">Training runs (~15-20 minutes)</h3>
                <p className="text-sm text-white/50 mt-1">
                  Close the tab if you want. We email you when it's done. The model learns your 
                  facial features, how light hits your face, your typical expressions.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium">3</div>
              <div>
                <h3 className="font-medium text-white">Generate images whenever you need</h3>
                <p className="text-sm text-white/50 mt-1">
                  Describe what you want: "surprised face," "professional headshot," "excited pointing." 
                  Get multiple options. Pick what works. Use for thumbnails, graphics, social content.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Photo Examples */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            What makes good training photos
          </h2>
          <p className="text-white/50">
            Better input = better results. Quality matters more than quantity.
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
              <Check className="h-4 w-4" /> Include these
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• 3-4 shots looking directly at camera</li>
              <li>• 3-4 shots at 3/4 angle (slightly turned)</li>
              <li>• 2-3 profile or near-profile views</li>
              <li>• Mix of expressions (neutral, smiling, animated)</li>
              <li>• Good lighting (natural light or well-lit room)</li>
              <li>• High resolution (512×512 minimum, higher is better)</li>
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
              <X className="h-4 w-4" /> Avoid these
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Blurry or motion-blurred photos</li>
              <li>• Heavy Instagram filters</li>
              <li>• Sunglasses covering your eyes</li>
              <li>• Group photos cropped down</li>
              <li>• Old photos with different hair/look</li>
              <li>• Extreme angles (looking straight up/down)</li>
            </ul>
          </motion.div>
        </div>
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
                Setting expectations
              </h2>
              <div className="space-y-3 text-white/60 leading-relaxed text-sm">
                <p>
                  AI-generated faces are impressive but imperfect. You will see:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• Generations that look "almost you" but slightly off</li>
                  <li>• Hands that look weird (AI's universal weakness)</li>
                  <li>• Inconsistency between different generations</li>
                  <li>• Some expressions that just don't work</li>
                </ul>
                <p>
                  <span className="text-white">The workflow is:</span> generate several options, 
                  pick the ones that look right, ignore the rest. If you get 2-3 usable images out 
                  of every 5 generations, that's normal and still faster than alternatives.
                </p>
                <p>
                  If you need photorealistic perfection every time, you need a photographer. 
                  If you need "good enough for a thumbnail" fast, this works.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">
                Your data, your control
              </h2>
              <div className="text-white/60 leading-relaxed text-sm space-y-2">
                <p>We take this seriously because it's your face:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Your photos and model are private to your account</li>
                  <li>• We don't use your data to train any shared models</li>
                  <li>• You can delete everything at any time</li>
                  <li>• Encrypted storage for all uploaded images</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* What It Enables */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            What this unlocks
          </h2>
          <p className="text-white/60 leading-relaxed mb-4">
            Once your persona is trained, you can:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>Generate thumbnails with your face</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>Create social graphics featuring you</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>Consistent visual identity across content</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>Quick iterations without new photos</span>
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
            Train your persona
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            10-20 photos. 20 minutes of training. Then generate images of yourself 
            whenever you need them.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Start training
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
