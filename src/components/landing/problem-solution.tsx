"use client"

import { motion } from "framer-motion"
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react"

const withoutInflio = [
  { task: "Watch video to find clips", time: "1-2 hours" },
  { task: "Edit each clip manually", time: "2-4 hours" },
  { task: "Write blog post", time: "2-3 hours" },
  { task: "Create social captions", time: "1 hour" },
  { task: "Design thumbnails", time: "30-60 min" },
  { task: "Post to each platform", time: "30-60 min" },
]

const withInflio = [
  { task: "Upload your video", time: "30 sec" },
  { task: "Review AI-generated content", time: "15-30 min" },
  { task: "Publish everywhere", time: "1 click" },
]

export function ProblemSolutionSection() {
  return (
    <section className="py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            The old way is{" "}
            <span className="text-red-400">broken</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You create amazing content. But turning one video into a complete 
            content strategy? That's where hours disappear.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Without Inflio */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">The manual way</h3>
                  <p className="text-sm text-muted-foreground">6-10+ hours per video</p>
                </div>
              </div>

              <div className="space-y-4">
                {withoutInflio.map((item, index) => (
                  <motion.div
                    key={item.task}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between py-3 border-b border-red-500/10 last:border-0"
                  >
                    <span className="text-muted-foreground">{item.task}</span>
                    <span className="text-sm text-red-400 font-medium">{item.time}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-red-500/10 flex items-center justify-between">
                <span className="font-medium">Total time</span>
                <span className="text-xl font-bold text-red-400">6-10+ hours</span>
              </div>
            </div>
          </motion.div>

          {/* With Inflio */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="p-8 rounded-3xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <Sparkles className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">With Inflio</h3>
                  <p className="text-sm text-muted-foreground">Under 45 minutes total</p>
                </div>
              </div>

              <div className="space-y-4">
                {withInflio.map((item, index) => (
                  <motion.div
                    key={item.task}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between py-3 border-b border-green-500/10 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span>{item.task}</span>
                    </div>
                    <span className="text-sm text-green-400 font-medium">{item.time}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-green-500/10 flex items-center justify-between">
                <span className="font-medium">Total time</span>
                <span className="text-xl font-bold text-green-400">~30 minutes</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground">
            That's{" "}
            <span className="text-2xl font-bold text-primary">97%</span>
            {" "}less time spent on repurposing.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
