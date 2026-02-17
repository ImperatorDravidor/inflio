"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Video,
  FileText,
  MessageSquare,
  Image,
  Upload,
  Wand2,
  CheckCircle2,
} from "lucide-react"

const outputTypes = [
  { icon: Video, label: "10+ Clips", color: "text-red-400" },
  { icon: FileText, label: "Blog Post", color: "text-blue-400" },
  { icon: MessageSquare, label: "Social Posts", color: "text-green-400" },
  { icon: Image, label: "Thumbnails", color: "text-purple-400" },
]

export function DemoSection() {
  return (
    <section id="demo" className="py-20 bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
            How it works
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            Upload once, get everything. In under 30 minutes.
          </p>
        </motion.div>

        {/* Visual Process Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl" />
          
          {/* Main Visual */}
          <div className="relative rounded-xl border border-white/10 bg-[#0c0c0c]/80 backdrop-blur overflow-hidden">
            {/* Process Flow */}
            <div className="p-8 md:p-10">
              <div className="grid md:grid-cols-3 gap-6 md:gap-4 items-center">
                {/* Step 1: Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="relative inline-flex mb-4">
                    <div className="w-24 h-24 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-white/50" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">1</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white">Upload Video</p>
                  <p className="text-xs text-white/40 mt-1">Any format, up to 2GB</p>
                </motion.div>

                {/* Arrow 1 */}
                <div className="hidden md:flex items-center justify-center absolute left-[33%] top-1/2 -translate-y-1/2 -translate-x-1/2">
                  <ArrowRight className="h-5 w-5 text-white/20" />
                </div>

                {/* Step 2: Processing */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  <div className="relative inline-flex mb-4">
                    <motion.div
                      className="w-24 h-24 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                      animate={{ 
                        boxShadow: [
                          "0 0 0px rgba(124,58,237,0)",
                          "0 0 30px rgba(124,58,237,0.15)",
                          "0 0 0px rgba(124,58,237,0)"
                        ]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      <Wand2 className="h-8 w-8 text-primary" />
                    </motion.div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">2</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white">AI Processing</p>
                  <p className="text-xs text-white/40 mt-1">~8 minutes</p>
                </motion.div>

                {/* Arrow 2 */}
                <div className="hidden md:flex items-center justify-center absolute left-[67%] top-1/2 -translate-y-1/2 -translate-x-1/2">
                  <ArrowRight className="h-5 w-5 text-white/20" />
                </div>

                {/* Step 3: Output */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="relative inline-flex mb-4">
                    <div className="grid grid-cols-2 gap-1.5">
                      {outputTypes.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                          viewport={{ once: true }}
                          className="w-11 h-11 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center"
                        >
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white">Ready to Publish</p>
                  <p className="text-xs text-white/40 mt-1">20+ content pieces</p>
                </motion.div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 bg-white/[0.02] px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {outputTypes.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className="text-xs text-white/50">{item.label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/sign-up">
                  <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 h-8 text-xs">
                    <Sparkles className="h-3 w-3" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
